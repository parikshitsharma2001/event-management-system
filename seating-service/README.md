# Seating Service

## Overview
Seating Service manages seat inventory, availability, reservations, and allocations for events in the ticketing system. Built with NestJS and Redis for automatic reservation expiration.

## Technologies
- Node.js 21
- NestJS 10
- TypeORM
- PostgreSQL
- Redis (for reservation TTL)
- Pessimistic Locking
- Scheduled Tasks
- Docker

## Features
- Real-time seat availability tracking
- Temporary seat reservations (15-minute TTL)
- **Redis-based automatic expiration** of reservations
- Pessimistic locking for concurrent requests
- Seat allocation for confirmed orders
- Seat release mechanism
- Seat blocking/unblocking for maintenance
- Comprehensive availability reports
- CQRS pattern (Command & Query repositories)

## API Endpoints

### Seat Availability
- `GET /v1/seats/availability?eventId={id}` - Get detailed availability for an event
- `GET /v1/seats?eventId={id}&status={status}` - Get seats by event and status
- `GET /v1/seats/{id}` - Get seat by ID
- `GET /v1/seats/order/{orderId}` - Get seats allocated to an order

### Seat Operations
- `POST /v1/seats/reserve` - Reserve seats temporarily (15 min hold)
- `POST /v1/seats/allocate` - Permanently allocate reserved seats
- `POST /v1/seats/release` - Release seats back to available
- `POST /v1/seats` - Create new seat
- `PATCH /v1/seats/{id}/block` - Block a seat
- `PATCH /v1/seats/{id}/unblock` - Unblock a seat

### Monitoring
- `GET /v1/seats/health` - Health check

## Database Schema

### Seats Table
```sql
CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    row_number VARCHAR(10) NOT NULL,
    section VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    reserved_by BIGINT,
    order_id VARCHAR(36),
    reserved_at TIMESTAMP,
    reservation_expires_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_event_status (event_id, status),
    INDEX idx_order_id (order_id)
);
```

## Redis Integration

### Reservation Expiration
When seats are reserved, the service:
1. Stores reservation in PostgreSQL with `reservation_expires_at` timestamp
2. Stores reservation metadata in Redis with 15-minute TTL
3. Schedules a cleanup task using `setTimeout`
4. Falls back to cron job (runs every minute) for missed expirations

**Redis Key Pattern**: `seat:reservation:{reservationId}`

**Redis Value**:
```json
{
  "userId": 123,
  "eventId": 1,
  "seatIds": [1, 2, 3],
  "expiresAt": "2025-12-10T15:30:00.000Z"
}
```

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_HOST | PostgreSQL hostname | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USERNAME | PostgreSQL username | postgres |
| DATABASE_PASSWORD | PostgreSQL password | postgres |
| DATABASE_NAME | PostgreSQL database name | seatingdb |
| REDIS_HOST | Redis hostname | localhost |
| REDIS_PORT | Redis port | 6379 |
| REDIS_PASSWORD | Redis password (optional) | - |
| PORT | Service port | 8082 |

## Running Locally

### Prerequisites
- Node.js 21+
- npm
- PostgreSQL
- Redis

### Steps
1. Start PostgreSQL and Redis:
```bash
# PostgreSQL
createdb seatingdb

# Redis
redis-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Run the application:
```bash
npm run start
```

## Running with Docker

### Build Docker image:
```bash
docker build -t seating-service:latest .
```

### Run container:
```bash
docker run -p 8082:8082 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_NAME=seatingdb \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e REDIS_HOST=host.docker.internal \
  seating-service:latest
```

## API Examples

### Reserve Seats
```bash
curl -X POST http://localhost:8082/v1/seats/reserve \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "eventId": 1,
    "seatIds": [1, 2, 3],
    "userId": 100
  }'
```

### Allocate Seats
```bash
curl -X POST http://localhost:8082/v1/seats/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "seatIds": [1, 2, 3],
    "orderId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Get Availability
```bash
curl -X GET "http://localhost:8082/v1/seats/availability?eventId=1"
```

## Concurrency Control

### Pessimistic Locking
Uses TypeORM's pessimistic write lock during seat reservation:

```typescript
await this.repo
  .createQueryBuilder('seat')
  .whereInIds(ids)
  .setLock('pessimistic_write')
  .getMany();
```

### Optimistic Locking
Version field in entity for detecting concurrent modifications:

```typescript
@VersionColumn({ name: 'version' })
version!: number;
```

## Reservation Expiration Flow

1. **Reserve Seats** → Seats marked as RESERVED with expiration timestamp
2. **Store in Redis** → Reservation data stored with 15-min TTL
3. **Schedule Cleanup** → `setTimeout` scheduled for automatic release
4. **Cron Backup** → Every minute, check DB for expired reservations
5. **Auto-Release** → Seats automatically become AVAILABLE after 15 minutes

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Future Enhancements
- Seat map visualization
- Dynamic pricing based on demand
- Waitlist for sold-out events
- Bulk seat operations API
- Seat hold extension API
- WebSocket for real-time availability updates
- Distributed locking with Redis for multi-instance deployments