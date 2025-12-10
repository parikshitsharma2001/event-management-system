# Payment Service

## Overview
Payment Service handles all payment-related operations in the Event Ticketing System. It is built using NestJS and follows the microservices pattern with a dedicated PostgreSQL database. 
It supports idempotent payment processing, refunds, and communicates with the Order Service for payment status callbacks.

## Technologies
- Node.js 21
- NestJS 10
- TypeORM
- PostgreSQL
- Axios (for inter-service communication)
- CQRS Pattern (Commands and Queries)
- Prometheus-compatible Metrics
- Docker

## Features
- Idempotent payment processing
- Order service callback integration
- Refund handling for successful payments
- Payment state tracking (PENDING, SUCCESS, FAILED, REFUNDED)
- PostgreSQL persistence with TypeORM
- CQRS-based repository pattern (commands & queries)
- Health and metrics endpoints for monitoring
- Modular NestJS architecture (controller, service, repository, DTOs)
- Structured logging
- Docker-based deployment

## API Endpoints

### Payments
- `POST /v1/charge` - Process a new payment (idempotent)
- `POST /v1/refund` - Refund a successful payment
- `GET /v1/payments/:id` - Get payment by ID
- `GET /health` - Health check endpoint
- `GET /metrics` - System metrics (CPU, RAM, uptime)

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_order_id UUID NULL,
    idempotency_key TEXT UNIQUE NULL,
    amount_cents INT DEFAULT 0,
    currency TEXT DEFAULT 'INR' NULL,
    status TEXT CHECK(status IN ('PENDING','SUCCESS','FAILED','REFUNDED')) NULL,
    provider_txn_id TEXT NULL,
    created_at TIMESTAMP DEFAULT now() NULL,
    updated_at TIMESTAMP DEFAULT now() NULL
);
```

## Configuration

### Environment Variables
| Variable | Description |
|-----------|-------------|
| DATABASE_HOST | PostgreSQL hostname |
| DATABASE_PORT | PostgreSQL port |
| DATABASE_USERNAME | PostgreSQL username |
| DATABASE_PASSWORD | PostgreSQL password |
| DATABASE_NAME | PostgreSQL database name |
| ORDER_CALLBACK_URL | Callback URL for Order Service |
| PORT | Service port |

## Running Locally

### Prerequisites
- Node.js 21+
- npm
- PostgreSQL

### Steps
1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Run the application:
```bash
npm run start
```

## Running with Docker

### Build Docker image:
```bash
docker build -t payment-service:latest .
```

### Run container:
```bash
docker run -p 4004:4004   -e DATABASE_HOST=host.docker.internal   -e DATABASE_NAME=paymentdb   -e DATABASE_USERNAME=postgres   -e DATABASE_PASSWORD=postgres   payment-service:latest
```

## Running with Docker Compose
```bash
docker-compose up payment-service
```

## Testing API

### 1. Process Payment (Charge)
```bash
curl -X POST http://localhost:4004/v1/charge   -H "Content-Type: application/json"   -H "Idempotency-Key: abc123"   -d '{
    "merchant_order_id": "f50d9fa2-5d3e-4e49-9a02-218ad32ef4a9",
    "amount_cents": 1500,
    "currency": "INR"
  }'
```

### 2. Refund Payment
```bash
curl -X POST http://localhost:4004/v1/refund   -H "Content-Type: application/json"   -d '{
    "payment_id": "f50d9fa2-5d3e-4e49-9a02-218ad32ef4a9"
  }'
```

### 3. Get Payment by ID
```bash
curl -X GET http://localhost:4004/v1/payments/f50d9fa2-5d3e-4e49-9a02-218ad32ef4a9
```

### 4. Health Check
```bash
curl -X GET http://localhost:4004/health
```

### 5. System Metrics
```bash
curl -X GET http://localhost:4004/metrics
```

## Monitoring Metrics

The service exposes a lightweight metrics endpoint (`/metrics`) returning:
- CPU load
- Memory usage
- Heap usage
- Uptime
- Timestamp

This can be scraped by Prometheus or visualized in Grafana.

## Security
- Each charge request requires a unique `Idempotency-Key`
- External callbacks use secure HTTP POST
- Sensitive data (DB credentials, URLs) loaded via environment variables

## Future Enhancements
- Payment gateway integration (Stripe, Razorpay, PayPal)
- Transaction audit logs
- Retry and dead-letter queue for failed callbacks
- Circuit breaker for external dependencies
- Improved metrics & tracing (OpenTelemetry)
