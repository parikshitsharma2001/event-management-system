# Catalog Service

## Overview

The **Catalog Service** provides event and venue management capabilities for the Event Ticketing System. It stores venues and events, and exposes APIs to create/list events and venues. It is built with **NestJS** and uses a dedicated **PostgreSQL** database.

## Technologies

* Node.js 21
* NestJS 10
* TypeORM (optional — service currently uses `pg` for direct queries; entities can be added)
* PostgreSQL
* Axios (for inter-service communication if needed)
* Prometheus-compatible Metrics
* Docker

## Features

* Create and manage venues
* Create and manage events (title, type, times, status, description)
* Listing and querying events with filters (city, type, status)
* Simple, validated DTOs for request payloads
* Health and metrics endpoints for monitoring
* Modular NestJS architecture (controller, service, repository/DB layer, DTOs)
* Docker-friendly for local and CI use

---

## API Endpoints

### Health & Metrics

* `GET /health` — Health check endpoint
* `GET /metrics` — (If implemented) system metrics (CPU, RAM, uptime)

### Venues & Events

* `POST /v1/venues` — Create a new venue

  * Body: `{ name: string, city?: string, address?: string, capacity?: number }`
* `POST /v1/events` — Create a new event

  * Body: `{ venue_id: number, title: string, type?: string, start_time: string (ISO), end_time?: string (ISO), status?: string, description?: string }`
* `GET /v1/events` — List events (supports query filters)

  * Query params: `city`, `type`, `status`
* `GET /v1/events/:id` — Get event details by numeric ID

---

## Database Schema

The service initializes its DB with the following schema (SQL):

### Venues Table

```sql
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  capacity INT
);
```

### Events Table

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  venue_id INT NOT NULL,
  title TEXT NOT NULL,
  type TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'ON_SALE',
  description TEXT
);
```

> Note: There is no explicit foreign-key constraint in the provided `initDb()` snippet between `events.venue_id` and `venues.id`. If you want referential integrity, add `REFERENCES venues(id)` to `venue_id`.

---

## Configuration

### Environment Variables

| Variable            | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `DATABASE_HOST`     | PostgreSQL hostname                                           |
| `DATABASE_PORT`     | PostgreSQL port                                               |
| `DATABASE_USERNAME` | PostgreSQL username                                           |
| `DATABASE_PASSWORD` | PostgreSQL password                                           |
| `DATABASE_NAME`     | PostgreSQL database name                                      |
| `PORT`              | Service port (defaults to the value used in the code or 4001) |

---

## Running Locally

### Prerequisites

* Node.js 21+
* npm
* PostgreSQL

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

> If you use TypeORM or add entities later, run migrations or enable `synchronize` carefully in development.

---

## Running with Docker

### Build Docker image:

```bash
docker build -t catalog-service:latest .
```

### Run container:

```bash
docker run -p 4001:4001 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=catalogdb \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres \
  catalog-service:latest
```

---

## Running with Docker Compose

Start the whole stack (example `docker-compose.yml` must include a `catalogdb` service as in your compose):

```bash
docker-compose up catalog-service
```

---

## Testing API

### 1. Create a Venue

```bash
curl -X POST http://localhost:4001/v1/venues \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Town Hall",
    "city": "Bengaluru",
    "address": "123 Main St",
    "capacity": 2000
  }'
```

### 2. Create an Event

```bash
curl -X POST http://localhost:4001/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "venue_id": 1,
    "title": "Indie Music Night",
    "type": "MUSIC",
    "start_time": "2025-12-10T18:00:00Z",
    "end_time": "2025-12-10T21:00:00Z",
    "status": "ON_SALE",
    "description": "An evening of independent music."
  }'
```

### 3. List Events (filter by city/type/status)

```bash
curl -X GET "http://localhost:4001/v1/events?city=Bengaluru&type=MUSIC&status=ON_SALE"
```

### 4. Get Event by ID

```bash
curl -X GET http://localhost:4001/v1/events/1
```

### 5. Health Check

```bash
curl -X GET http://localhost:4001/health
```

---

## Monitoring & Metrics

The service exposes a minimal `/health` endpoint. You can add a `/metrics` endpoint (Prometheus) similar to other services in the system to export:

* CPU load
* Memory usage
* Uptime
* Custom business metrics (events created, venues count)

---

## Security & Validation

* Request payloads should be validated using DTOs and `class-validator` (the controller uses `ValidationPipe` in endpoints).
* Avoid exposing DB credentials — load them via environment variables.
* Consider adding rate limiting / authentication on write endpoints in production.

---

## Future Enhancements

* Introduce foreign key constraints between `events.venue_id` and `venues.id`.
* Add pagination, sorting, and richer filters for `GET /v1/events`.
* Add OpenAPI/Swagger docs (`@nestjs/swagger`) for auto-generated API docs.
* Add Prometheus metrics and tracing (OpenTelemetry).
* Add admin UI for managing venues & events.
* Add migrations (TypeORM or another tool) and CI integration.
