import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, BadGatewayException } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { OrdersQueryRepository } from '../repository/orders.query';
import { OrdersCommandRepository } from '../repository/orders.command';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderItem } from '../entities/order-item.entity';

const CATALOG_URL = process.env.CATALOG_URL;
const SEATING_URL = process.env.SEATING_URL;
const PAYMENT_URL = process.env.PAYMENT_URL;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL;
const TAX_PERCENT = Number(process.env.TAX_PERCENT);

type RemoteError = { message: string; status?: number; detail?: any };

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly queryRepo: OrdersQueryRepository,
    private readonly commandRepo: OrdersCommandRepository,
  ) { }

  async createOrderFlow(idempotencyKey: string, orderRequest: CreateOrderDto) {
    const { user_id, event_id, seats } = orderRequest as any;

    const existing = await this.queryRepo.findByIdempotency(idempotencyKey);
    if (existing) {
      const items = await this.queryRepo.findOrderItems(existing.id);
      const tickets = await this.queryRepo.findTickets(existing.id);
      return { order: existing, items, tickets };
    }

    const toCents = (v: any) =>
      typeof v === 'number'
        ? Math.round(v * (v > 1000 ? 1 : 100))
        : !isNaN(Number(v))
          ? Math.round(Number(v) * 100)
          : 0;

    const catalogResp = await this.safeGet(() => this.fetchEvent(event_id), 'Invalid event-id');

    const availResp = await this.safeGet(() => this.fetchAvailability(event_id), 'Invalid seating availability response');
    const availableList = availResp?.data?.availableSeatsList;
    if (!Array.isArray(availableList)) {
      this.logger.error('Invalid seating availability response format', { eventId: event_id, payload: availResp?.data });
      throw new BadGatewayException('Invalid seating availability response');
    }

    const availableById = new Map(availableList.map((s: any) => [Number(s.id), s]));

    const seatSnapshots = seats.map((sid: number) => {
      const seat = availableById.get(Number(sid));
      if (!seat) {
        this.logger.warn(`Seat missing: event=${event_id} seat=${sid}`);
        throw new BadRequestException('Invalid seat selection');
      }
      if (String(seat.status).toUpperCase() !== 'AVAILABLE') {
        this.logger.warn(`Seat not available: event=${event_id} seat=${sid} status=${seat.status}`);
        throw new BadRequestException('Seat not available');
      }
      return {
        id: Number(seat.id),
        code: (seat.seatNumber || seat.seat_code || seat.seatCode || '').toString(),
        priceCents: seat.price_cents ?? toCents(seat.price),
      };
    });

    const reserveResp = await this.safePost(() => this.reserveSeats(event_id, seats, user_id), 'Seat reservation failed');
    if (!reserveResp?.data?.success) {
      this.logger.error('Seat reservation failed', { eventId: event_id, seatIds: seats, remote: reserveResp?.data });
      throw new BadGatewayException('Seat reservation failed');
    }

    const subtotal = seatSnapshots.reduce((sum: any, s: { priceCents: any }) => sum + s.priceCents, 0);
    const tax = Math.ceil(subtotal * (TAX_PERCENT / 100));
    const total = subtotal + tax;

    const order = await this.commandRepo.createOrder({
      idempotencyKey,
      userId: user_id,
      eventId: event_id,
      totalCents: total,
      taxCents: tax,
    });

    await Promise.all(
      seatSnapshots.map((s: { id: number; code: string; priceCents: number }) =>
        this.commandRepo.insertOrderItem(order.id, s.id, s.code, s.priceCents),
      ),
    );

    const payIdempotency = `${idempotencyKey}-pay`;
    const paymentPayload = {
      merchant_order_id: String(order.id),
      amount_cents: total,
      currency: 'INR',
    };

    let paymentResp: AxiosResponse<any>;
    try {
      paymentResp = await this.chargePayment(paymentPayload, payIdempotency);
    } catch (err) {
      this.logger.error('Payment charge failed: ' + this.stringifyError(err), this.normalizeAxiosError(err));
      try {
        await this.releaseSeatsArray(seats);
      } catch (e) {
        this.logger.warn('Seat release after payment failure also failed: ' + this.stringifyError(e), this.normalizeAxiosError(e));
      }
      await this.commandRepo.updateOrderStatus(order.id, 'FAILED');
      throw new BadGatewayException('Payment processing failed');
    }

    const paymentData = paymentResp?.data;
    return { order, payment: paymentData };
  }

  async handlePaymentCallback(order_id: string, payment_id: string, status: string) {
    if (!order_id || !payment_id || !status) throw new BadRequestException('invalid');
    const order = await this.queryRepo.findById(order_id);
    if (!order) throw new NotFoundException('order not found');

    if (status === 'SUCCESS') {
      if (order.status !== 'PENDING') return { ok: true, note: 'already processed' };

      const items = await this.queryRepo.findOrderItems(order_id);
      const seats = items.map((r: OrderItem) => r.seatId);

      try {
        await this.allocateSeats(order_id, seats);
      } catch (e) {
        this.logger.error('Seat allocation failed after payment: ' + this.stringifyError(e), this.normalizeAxiosError(e));
        try {
          await this.releaseSeatsArray(seats);
        } catch (inner) {
          this.logger.warn('Seat release after allocation failure failed: ' + this.stringifyError(inner), this.normalizeAxiosError(inner));
        }
        await this.commandRepo.updateOrderStatus(order.id, 'FAILED');
        throw new BadGatewayException('Seat allocation failed after payment');
      }

      for (const seatId of seats) {
        const ticketCode = 'TICKET-' + uuidv4();
        await this.commandRepo.insertTicket(order_id, seatId, ticketCode);
      }

      await this.commandRepo.updateOrderStatus(order_id, 'CONFIRMED');

      try {
        await this.sendNotification('ORDER_CONFIRMED', { order_id, seats });
      } catch (e: any) {
        this.logger.warn('notify err: ' + this.stringifyError(e), this.normalizeAxiosError(e));
      }

      const fullOrder = await this.queryRepo.findById(order_id);
      return { ok: true, order: fullOrder };
    } else {
      const items = await this.queryRepo.findOrderItems(order_id);
      const seats = items.map((r: any) => r.seat_id || r.seatId);

      try {
        await this.releaseSeatsObject({ order_id, event_id: order.eventId, seats });
      } catch (e: any) {
        this.logger.warn('release err: ' + this.stringifyError(e), this.normalizeAxiosError(e));
      }

      await this.commandRepo.updateOrderStatus(order_id, 'FAILED');

      try {
        await this.sendNotification('ORDER_FAILED', { order_id, seats });
      } catch (e: any) {
        this.logger.warn('notify err: ' + this.stringifyError(e), this.normalizeAxiosError(e));
      }

      const failedOrder = await this.queryRepo.findById(order_id);
      return { ok: true, order: failedOrder };
    }
  }

  async findById(id: string) {
    return this.queryRepo.findById(id);
  }

  async findOrderItems(orderId: string) {
    return this.queryRepo.findOrderItems(orderId);
  }

  async findTickets(orderId: string) {
    return this.queryRepo.findTickets(orderId);
  }

  private normalizeAxiosError(err: any): RemoteError {
    if (!err) return { message: 'unknown error' };
    if (axios.isAxiosError(err)) {
      const aerr = err as AxiosError;
      const status = aerr.response?.status;
      let detail = undefined;
      try {
        detail = aerr.response?.data;
      } catch (_) {
        detail = undefined;
      }
      return {
        message: aerr.message,
        status,
        detail,
      };
    }
    return { message: String(err) || 'unknown error' };
  }

  private stringifyError(e: any) {
    try {
      if (!e) return '';
      if (axios.isAxiosError(e)) {
        return `${e.message} ${JSON.stringify(e.response?.data ?? e.response ?? {})}`;
      }
      if (e instanceof Error) return e.message;
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }

  private async safeGet(fn: () => Promise<AxiosResponse<any>>, errorMessage: string): Promise<AxiosResponse<any>> {
    try {
      return await fn();
    } catch (err) {
      this.logger.error(`${errorMessage}: ${this.stringifyError(err)}`, this.normalizeAxiosError(err));
      throw new BadGatewayException(errorMessage);
    }
  }

  private async safePost(fn: () => Promise<AxiosResponse<any>>, errorMessage: string): Promise<AxiosResponse<any>> {
    try {
      return await fn();
    } catch (err) {
      this.logger.error(`${errorMessage}: ${this.stringifyError(err)}`, this.normalizeAxiosError(err));
      throw new BadGatewayException(errorMessage);
    }
  }

  private async fetchEvent(eventId: any): Promise<AxiosResponse<any>> {
    return axios.get(`${CATALOG_URL}/v1/events/${eventId}`);
  }

  private async fetchAvailability(eventId: any): Promise<AxiosResponse<any>> {
    return axios.get(`${SEATING_URL}/v1/seats/availability`, { params: { eventId }, timeout: 3000 });
  }

  private async reserveSeats(eventId: any, seatIds: any[], userId: any): Promise<AxiosResponse<any>> {
    return axios.post(
      `${SEATING_URL}/v1/seats/reserve`,
      { eventId, seatIds, userId, ttl_seconds: 15 * 60 },
      { timeout: 3000 },
    );
  }

  private async releaseSeatsArray(seatIds: any[]): Promise<AxiosResponse<any>> {
    return axios.post(`${SEATING_URL}/v1/seats/release`, seatIds, { timeout: 3000 });
  }

  private async releaseSeatsObject(payload: any): Promise<AxiosResponse<any>> {
    return axios.post(`${SEATING_URL}/v1/seats/release`, payload, { timeout: 3000 });
  }

  private async allocateSeats(orderId: any, seatIds: any[]): Promise<AxiosResponse<any>> {
    return axios.post(`${SEATING_URL}/v1/seats/allocate`, { orderId, seatIds });
  }

  private async chargePayment(payload: any, idempotencyKey: string): Promise<AxiosResponse<any>> {
    return axios.post(`${PAYMENT_URL}/v1/charge`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 8000,
    });
  }

  private async sendNotification(type: string, payload: any): Promise<AxiosResponse<any>> {
    return axios.post(`${NOTIFICATION_URL}/v1/notify`, { type, ...payload }, { timeout: 2000 });
  }
}
