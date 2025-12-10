# Order Service

## Overview

The **Order Service** manages the lifecycle of ticket orders in the Event Ticketing System.
It is responsible for creating and tracking user orders, coordinating seat reservations, payments, and ticket issuance.
Built using **NestJS** and **PostgreSQL**, it follows a modular microservices architecture and communicates with external services like the Catalog, Reservation, Payment, and Notification services.

## Technologies

* **Node.js 21**
* **NestJS 10**
* **TypeORM**
* **PostgreSQL**
* **Axios** (for inter-service communication)
* **CQRS Pattern** (Commands and Queries separation)
* **Prometheus-compatible Metrics**
* **Docker**

## Features

* Idempotent order creation (using `Idempotency-Key`)
* Integration with:

  * Catalog Service (event and seat info)
  * Reservation Service (seat reservation & allocation)
  * Payment Service (charge creation & callbacks)
  * Notification Service (order confirmation/failure alerts)
* Tax calculation and total cost computation
* Ticket generation upon successful payment
* PostgreSQL persistence using TypeORM
* Clean CQRS-based repository pattern
* Health & metrics endpoints for monitoring
* Structured logging via NestJS Logger
* Docker-ready deployment

---

## API Endpoints

### Orders

| Method | Endpoint                | Description                       |
| ------ | ----------------------- | --------------------------------- |
| `POST` | `/v1/orders`            | Create a new order (idempotent)   |
| `GET`  | `/v1/orders/:orderId`   | Get order details by ID           |
| `POST` | `/v1/payments/callback` | Handle payment service callback   |
| `GET`  | `/health`               | Service health check              |
| `GET`  | `/metrics`              | System metrics (CPU, RAM, uptime) |

---

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE,
    user_id INT,
    event_id INT,
    total_cents INT,
    tax_cents INT,
    status TEXT NOT NULL CHECK(status IN ('PENDING','CONFIRMED','CANCELLED','FAILED','REFUNDED')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

### Order Items Table

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    seat_id INT,
    seat_code TEXT,
    seat_price_cents INT
);
```

### Tickets Table

```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    seat_id INT,
    ticket_code TEXT UNIQUE,
    issued_at TIMESTAMP DEFAULT now()
);
```

---

## Configuration

### Environment Variables

| Variable            | Description                      |
| ------------------- | -------------------------------- |
| `DATABASE_HOST`     | PostgreSQL hostname              |
| `DATABASE_PORT`     | PostgreSQL port                  |
| `DATABASE_USERNAME` | PostgreSQL username              |
| `DATABASE_PASSWORD` | PostgreSQL password              |
| `DATABASE_NAME`     | PostgreSQL database name         |
| `CATALOG_URL`       | Catalog Service base URL         |
| `SEATING_URL`   | Reservation Service base URL     |
| `PAYMENT_URL`       | Payment Service base URL         |
| `NOTIFICATION_URL`  | Notification Service base URL    |
| `TAX_PERCENT`       | Tax percentage applied to orders |
| `PORT`              | Service port (default: 4003)     |

---

## Running Locally

### Prerequisites

* Node.js 21+
* npm
* PostgreSQL running locally

### Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the application:**

   ```bash
   npm run build
   ```

3. **Run the application:**

   ```bash
   npm run start
   ```

---

## Running with Docker

### Build Docker Image:

```bash
docker build -t order-service:latest .
```

### Run Container:

```bash
docker run -p 4003:4003 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=orderdb \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e CATALOG_URL=http://catalog-service:4001 \
  -e SEATING_URL=http://seating-service:4002 \
  -e PAYMENT_URL=http://payment-service:4004 \
  -e NOTIFICATION_URL=http://notification-service:4005 \
  order-service:latest
```

---

## Running with Docker Compose

```bash
docker-compose up order-service
```

---

## Testing the API

### 1. Create an Order

```bash
curl -X POST http://localhost:4003/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: abc123" \
  -d '{
    "user_id": 101,
    "event_id": 101,
    "seats": [1, 2, 3]
  }'
```

### 2. Get Order by ID

```bash
curl -X GET http://localhost:4003/v1/orders/7f7ddc5b-2099-44a1-9f52-3089eb15c1d9
```

### 3. Payment Callback (invoked by Payment Service)

```bash
curl -X POST http://localhost:4003/v1/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "7f7ddc5b-2099-44a1-9f52-3089eb15c1d9",
    "payment_id": "7d0f1735-b4ab-4f43-8d27-6322a91db938",
    "status": "SUCCESS"
  }'
```

### 4. Health Check

```bash
curl -X GET http://localhost:4003/health
```

### 5. System Metrics

```bash
curl -X GET http://localhost:4003/metrics
```

---

## Monitoring Metrics

The `/metrics` endpoint exposes lightweight system-level metrics compatible with Prometheus/Grafana dashboards:

* CPU load (1 min average)
* Memory usage (RSS)
* Heap usage
* Uptime (seconds)
* Platform & timestamp

---

## Security

* **Idempotency enforced:** Duplicate order submissions (same key) return existing order.
* **Validated DTOs:** All request payloads validated via `class-validator`.
* **Secure inter-service communication:** Internal services communicate over controlled network interfaces.
* **Environment-based config:** No secrets hardcoded in code.

---

## Future Enhancements

* Implement distributed transaction consistency (Saga pattern)
* Add support for refunds & cancellations
* Introduce retry logic for failed notifications
* Enhance observability with OpenTelemetry tracing
* Introduce async message queue for inter-service communication (Kafka/NATS)
