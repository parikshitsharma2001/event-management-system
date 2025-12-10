# Event Ticketing and Seat Reservation System
## Microservices Architecture Documentation

**Course:** Scalable Services  
**Assignment:** Event Ticketing and Seat Reservation Application  
**Project Repository:** https://github.com/parikshitsharma2001/event-ticketing-and-seat-reservation

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Core Components](#3-core-components)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Microservices Communication](#6-microservices-communication)
7. [Deployment](#7-deployment)
8. [Testing with Postman/cURL](#8-testing-with-postmancurl)
9. [Monitoring and Observability](#9-monitoring-and-observability)
10. [GitHub Repository Links](#10-github-repository-links)

---

## 1. Introduction

The Event Ticketing and Seat Reservation System is a production-grade microservices application designed to handle event management, user authentication, seat reservations, order management, and payment processing at scale. Built with modern technologies and best practices, the system demonstrates expertise in distributed systems, containerization, and cloud-native development.

### Architecture Overview

The application consists of five independent microservices:

- **User Service (Port 8081):** Handles user authentication, registration, and profile management using JWT tokens
- **Seating Service (Port 8082):** Manages seat inventory, temporary reservations with TTL, and seat allocation with pessimistic locking
- **Payment Service (Port 4004):** Processes payments with idempotent operations, handles refunds, and integrates with order callbacks
- **Catalog Service (Port 8000):** Manages venues and events with comprehensive search and filtering capabilities
- **Order Service (Port 4003):** Orchestrates the complete booking workflow from reservation to ticket generation

### Technology Stack

**Backend Technologies:**
- **TypeScript** with **NestJS** (Payment Service, Order Service, Catalog Service)

**Data Layer:**
- **PostgreSQL** - Primary relational database for all services
- **TypeORM** - ORM for NestJS service

**Security & Authentication:**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **BCrypt** - Password hashing

**DevOps & Infrastructure:**
- **Docker** - Container runtime
- **Docker Compose** - Local orchestration
- **Kubernetes/Minikube** - Production orchestration
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

### Key Features

**Microservices Best Practices:**
- Database-per-service pattern ensuring data isolation
- RESTful API communication between services
- Independent deployment and scaling
- Service autonomy and loose coupling

**Scalability & Performance:**
- Horizontal scaling through Kubernetes
- Pessimistic locking for concurrency control
- Connection pooling for database optimization

**Reliability & Resilience:**
- Automatic reservation expiration (15-minute TTL)
- Idempotent payment processing
- Health check endpoints for monitoring
- Comprehensive error handling

**Security:**
- JWT-based authentication with expiration
- Password encryption using BCrypt
- SQL injection prevention via parameterized queries
- CORS configuration for secure cross-origin requests

---

## 2. Prerequisites

### Required Software

**Development Tools:**
- Node.js 21 or higher
- Git

**Databases & Caching:**
- PostgreSQL 8.0 or higher
- Redis 7 or higher

**Containerization:**
- Docker Desktop
- Kubernetes (enabled in Docker Desktop or Minikube)
- kubectl CLI

### Environment Setup

Ensure all software is properly installed and configured:

```bash
# Verify Node.js
node -version

# Verify Docker
docker --version

# Verify Kubernetes
kubectl version --client
```

---
## 3. Core Components

### 3.1 User Service (TypeScript/NestJS)

**Port:** 8081  
**Database:** userdb  
**Technology:** TypeScript, NestJS 10, TypeORM, PostgreSQL

**Key Features:**
- User registration with comprehensive validation
- JWT-based authentication and token management
- Profile management (CRUD operations)
- User search and filtering capabilities
- Account status management (active/inactive/blocked)
- Password encryption using BCrypt
- Prometheus metrics integration

**Project Structure:**
```
user-service/
├── src/
│   ├── app.module.ts               # Main application module
│   ├── main.ts                     # Application entry point
│   ├── config/
│   │   └── database.ts             # Database configuration
│   └── users/
│       ├── controller/
│       │   └── users.controller.ts # REST endpoints
│       ├── service/
│       │   └── users.service.ts    # Business logic
│       ├── repository/
│       │   ├── users.command.ts    # Write operations
│       │   └── users.query.ts      # Read operations
│       ├── entities/
│       │   └── user.entity.ts      # User entity
│       ├── dto/
│       │   └── user.dto.ts         # DTOs
│       └── users.module.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Database Tables:**
- `users` - Core user information
  - user_id (Primary Key)
  - username (Unique)
  - email (Unique)
  - password (Encrypted)
  - first_name
  - last_name
  - phone_number
  - account_status
  - created_at
  - updated_at

---

### 3.2 Seating Service (TypeScript/NestJS)

**Port:** 8082  
**Database:** seatingdb  
**Cache:** Redis  
**Technology:** TypeScript, NestJS 10, TypeORM, PostgreSQL, Redis 7

**Key Features:**
- Real-time seat availability tracking
- Temporary seat reservations with 15-minute TTL
- **Redis-based automatic expiration** of reservations
- Automatic expiration and cleanup of expired reservations
- Pessimistic locking to prevent race conditions
- Seat allocation for confirmed orders
- Comprehensive availability reports by event/venue
- Scheduled cron jobs for reservation cleanup

**Project Structure:**
```
seating-service/
├── src/
│   ├── app.module.ts               # Main application module
│   ├── main.ts                     # Application entry point
│   ├── config/
│   │   ├── database.ts             # Database configuration
│   │   └── redis.ts                # Redis configuration
│   └── seating/
│       ├── controller/
│       │   └── seating.controller.ts
│       ├── service/
│       │   └── seating.service.ts  # Includes Redis operations
│       ├── repository/
│       │   ├── seating.command.ts
│       │   └── seating.query.ts
│       ├── entities/
│       │   └── seat.entity.ts
│       ├── dto/
│       │   └── seating.dto.ts
│       └── seating.module.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Redis Integration:**
- Stores reservation metadata with automatic TTL
- Key pattern: `seat:reservation:{reservationId}`
- Automatic cleanup via Redis expiry and scheduled tasks
- Fallback to database queries for resilience

**Database Tables:**
- `seats` - Seat inventory and status
  - seat_id (Primary Key)
  - event_id (Foreign Key)
  - venue_id (Foreign Key)
  - section
  - row_number
  - seat_number
  - status (AVAILABLE, RESERVED, ALLOCATED, BLOCKED)
  - reserved_by (User ID)
  - reservation_expiry
  - price
  - created_at
  - updated_at

---

### 3.3 Payment Service (TypeScript/NestJS)

**Port:** 4004  
**Database:** paymentsdb  
**Technology:** TypeScript, NestJS, TypeORM, PostgreSQL

**Key Features:**
- Idempotent payment processing using idempotency keys
- Order service callback integration
- Refund handling for successful payments
- Payment state machine (PENDING → SUCCESS/FAILED → REFUNDED)
- PostgreSQL persistence with TypeORM
- CQRS-based repository pattern (Command/Query separation)
- Health check endpoint for monitoring
- Structured logging and Prometheus-ready metrics
- Modular architecture (Controller → Service → Repository)

**Project Structure:**
```
payment-service/
├── src/
│   ├── app.module.ts               # Main application module
│   ├── main.ts                     # Application entry point
│   ├── config/
│   │   └── database.ts             # Database configuration
│   └── payments/
│       ├── controller/
│       │   └── payments.ts         # Payment endpoints
│       ├── service/
│       │   └── payments.ts         # Business logic
│       ├── repository/
│       │   ├── payment.command.ts  # Write operations
│       │   └── payments.query.ts   # Read operations
│       ├── entities/
│       │   └── payment.entity.ts   # Payment entity
│       ├── dto/
│       │   ├── create-charge.dto.ts
│       │   └── refund.dto.ts
│       └── payments.module.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Database Tables:**
- `payments` - Payment transactions
  - payment_id (Primary Key, UUID)
  - merchant_order_id (Unique)
  - amount_cents
  - currency
  - status (PENDING, SUCCESS, FAILED, REFUNDED)
  - idempotency_key (Unique)
  - payment_method
  - transaction_id
  - failure_reason
  - created_at
  - updated_at
  - refunded_at

---

### 3.4 Catalog Service (TypeScript/NestJS)

**Port:** 8000  
**Database:** catalogdb  
**Technology:** TypeScript, NestJS, TypeORM, PostgreSQL

**Key Features:**
- Venue management (CRUD operations)
- Event creation and management
- Advanced search and filtering by:
  - City
  - Event type (Concert, Sports, Theater, Conference)
  - Status (UPCOMING, ONGOING, COMPLETED, CANCELLED)
  - Date range
- Event-venue association management
- High-performance async endpoints

**Project Structure:**
```
catalog-service/
├── app/
│   ├── main.py                     # FastAPI application
│   ├── models/
│   │   ├── venue.py
│   │   └── event.py
│   ├── routers/
│   │   ├── venues.py
│   │   └── events.py
│   ├── schemas/
│   │   ├── venue.py
│   │   └── event.py
│   ├── database.py
│   └── config.py
├── Dockerfile
├── requirements.txt
└── README.md
```

**Database Tables:**
- `venues` - Event locations
  - venue_id (Primary Key)
  - name
  - address
  - city
  - state
  - country
  - postal_code
  - capacity
  - venue_type
  - facilities (JSON)
  - created_at
  - updated_at

- `events` - Event information
  - event_id (Primary Key)
  - venue_id (Foreign Key)
  - name
  - description
  - event_type (CONCERT, SPORTS, THEATER, CONFERENCE)
  - start_date
  - end_date
  - status (UPCOMING, ONGOING, COMPLETED, CANCELLED)
  - total_seats
  - available_seats
  - base_price
  - created_at
  - updated_at

---

### 3.5 Order Service (TypeScript/NestJS)

**Port:** 4003  
**Database:** orderdb  
**Technology:** Node.js 21, NestJS 10, TypeORM, PostgreSQL

**Key Features:**
- Idempotent order creation using `Idempotency-Key`
- Integration with Catalog, Seating, Payment, and Notification services
- Tax calculation and total order amount computation
- Ticket generation and issuance after successful payment
- PostgreSQL persistence with TypeORM
- CQRS-based command-query separation
- Health and metrics endpoints compatible with Prometheus
- Structured logging via NestJS Logger
- Docker and Kubernetes ready

**Project Structure:**
```
order-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── orders/
│   │   ├── controller/
│   │   │   └── orders.controller.ts
│   │   ├── service/
│   │   │   └── orders.service.ts
│   │   ├── repository/
│   │   │   ├── orders.command.ts
│   │   │   └── orders.query.ts
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   ├── order-item.entity.ts
│   │   │   └── ticket.entity.ts
│   │   ├── dto/
│   │   │   └── create-order.dto.ts
│   │   └── orders.module.ts
│   ├── config/
│   │   └── database.ts
│   └── common/
│       └── utils.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

**Database Tables:**
- `orders`
  - id (UUID, Primary Key)
  - idempotency_key (Unique)
  - user_id
  - event_id
  - total_cents
  - tax_cents
  - status (PENDING, CONFIRMED, CANCELLED, FAILED, REFUNDED)
  - created_at
  - updated_at

- `order_items`
  - id (Primary Key)
  - order_id (Foreign Key → orders.id)
  - seat_id
  - seat_code
  - seat_price_cents

- `tickets`
  - id (UUID, Primary Key)
  - order_id (Foreign Key → orders.id)
  - seat_id
  - ticket_code (Unique)
  - issued_at

---


**Key Features:**
- Order creation and lifecycle management
- Integration with Seating Service for seat allocation
- Integration with Payment Service for transaction processing
- Ticket generation after successful payment
- Order history and tracking
- Cancellation and refund orchestration

**Order States:**
- PENDING - Initial order created
- RESERVED - Seats temporarily held
- PAYMENT_PROCESSING - Payment in progress
- CONFIRMED - Payment successful, tickets issued
- FAILED - Payment failed
- CANCELLED - Order cancelled
- REFUNDED - Order refunded

---

## 4. System Architecture

### 4.1 High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                 │
│           (Web Browser / Mobile App / Postman / cURL)                     │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         API Gateway (Future)                              │
│                   Load Balancing & Routing                                │
└───────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────┘
            │             │             │             │             │
            ▼             ▼             ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │   User   │  │ Seating  │  │ Payment  │  │ Catalog  │  │  Order   │
    │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │
    │          │  │          │  │          │  │          │  │          │
    │ :8081    │  │ :8082    │  │ :4004    │  │ :8000    │  │ :4003    │
    │ NestJS   │  │ NestJS   │  │ NestJS   │  │ FastAPI  │  │ NestJS   │
    └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │             │             │             │
         ▼             ▼             ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │ userdb │   │seatingdb│  │payments│   │catalog │   │ orderdb│
    │        │   │        │   │  db    │   │  db    │   │        │
    └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
         │             │             │             │             │
         └─────────────┴─────────────┴─────────────┴─────────────┘
                               │
                         PostgreSQL

```

### 4.2 Inter-Service Communication Flow

**Ticket Booking Workflow:**

```
┌────────┐         ┌────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│  User  │         │  User  │         │  Order   │         │ Seating  │         │ Payment │
│ Client │         │Service │         │ Service  │         │ Service  │         │ Service │
└───┬────┘         └───┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
    │                  │                   │                   │                    │
    │ 1. Login         │                   │                   │                    │
    ├─────────────────>│                   │                   │                    │
    │                  │                   │                   │                    │
    │ 2. JWT Token     │                   │                   │                    │
    │<─────────────────┤                   │                   │                    │
    │                  │                   │                   │                    │
    │ 3. Browse Events (via Catalog)       │                   │                    │
    ├──────────────────┴──────────────────────────────────────────────────────────────>│
    │<────────────────────────────────────────────────────────────────────────────────┤
    │                  │                   │                   │                    │
    │ 4. Check Seat Availability            │                   │                    │
    ├──────────────────────────────────────>│                   │                    │
    │                                       │                   │                    │
    │ 5. Available Seats                    │                   │                    │
    │<──────────────────────────────────────┤                   │                    │
    │                                       │                   │                    │
    │ 6. Reserve Seats (15-minute hold)     │                   │                    │
    ├──────────────────────────────────────>│                   │                    │
    │                                       │                   │                    │
    │ 7. Reservation Confirmed              │                   │                    │
    │<──────────────────────────────────────┤                   │                    │
    │                                       │                   │                    │
    │ 8. Create Order                       │                   │                    │
    ├──────────────────────────────────────>│                   │                    │
    │                                       │ 8a. Validate Reservation with Seating   │
    │                                       ├───────────────────────────────────────>│
    │                                       │ 8b. Confirm Event & Pricing (Catalog)   │
    │                                       ├────────────────────────────────────────>│
    │                                       │                   │                    │
    │ 9. Order Created (status: PENDING)    │                   │                    │
    │<──────────────────────────────────────┤                   │                    │
    │                                       │                   │                    │
    │ 10. Process Payment (Idempotent)      │                   │                    │
    ├────────────────────────────────────────────────────────────────────────────────>│
    │                                       │                   │                    │
    │                                       │       11. Payment Callback              │
    │                                       │<────────────────────────────────────────┤
    │                                       │                   │                    │
    │ 12. Update Order (status: CONFIRMED)  │                   │                    │
    │                                       │                   │                    │
    │ 13. Allocate Seats                    │                   │                    │
    │                                       ├───────────────────────────────────────>│
    │                                       │                   │                    │
    │ 14. Seats Allocated                   │<───────────────────────────────────────┤
    │                                       │                   │                    │
    │ 15. Generate Tickets                  │                   │                    │
    │                                       │                   │                    │
    │ 16. Send Confirmation to User         │                   │                    │
    │<──────────────────────────────────────┤                   │                    │
    │                                       │                   │                    │
```

**Payment Failure & Auto-Expiry Flow:**

```
Scenario 1: Payment Fails
┌──────────┐                    ┌─────────┐
│ Seating  │                    │ Payment │
│ Service  │                    │ Service │
└────┬─────┘                    └────┬────┘
     │                              │
     │ Seats Reserved               │
     │ (15 min TTL)                 │
     │                              │
     │ Payment Request              │
     ├─────────────────────────────>│
     │                              │
     │        Payment Failed        │
     │<─────────────────────────────┤
     │                              │
     │ Auto-expire after 15 min     │
     │ (Return to AVAILABLE)        │
     │                              │

Scenario 2: User Abandons
┌──────────┐
│ Seating  │
│ Service  │
└────┬─────┘
     │
     │ Seats Reserved
     │ (15 min TTL)
     │
     │ User doesn't pay
     │ within 15 minutes
     │
     │ Background job releases
     │ seats automatically
     │
```

### 4.3 Database-per-Service Pattern

Each microservice maintains complete autonomy over its data:

```
┌──────────────────┐    ┌──────────────────┐
│  User Service    │    │   User Database  │
│                  ├───>│    (userdb)      │
│  - Authentication│    │                  │
│  - Profile Mgmt  │    │  Tables:         │
│  - JWT Tokens    │    │  - users         │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ Seating Service  │    │ Seating Database │
│                  ├───>│   (seatingdb)    │
│  - Availability  │    │                  │
│  - Reservations  │    │  Tables:         │
│  - Allocation    │    │  - seats         │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ Payment Service  │    │ Payment Database │
│                  ├───>│  (paymentsdb)    │
│  - Transactions  │    │                  │
│  - Refunds       │    │  Tables:         │
│  - Idempotency   │    │  - payments      │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ Catalog Service  │    │ Catalog Database │
│                  ├───>│   (catalogdb)    │
│  - Venues        │    │                  │
│  - Events        │    │  Tables:         │
│  - Search        │    │  - venues        │
│                  │    │  - events        │
└──────────────────┘    └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│  Order Service   │    │   Order Database │
│                  ├───>│    (orderdb)     │
│  - Order Mgmt    │    │                  │
│  - Lifecycle     │    │  Tables:         │
│  - Ticket Issuance│   │  - orders        │
│  - Payment Coord │    │  - order_items   │
│  - Seat Coord    │    │  - tickets       │
└──────────────────┘    └──────────────────┘
```
---

## 5. Database Schema

### 5.1 User Service Database (userdb)

```sql
CREATE DATABASE IF NOT EXISTS userdb;
USE userdb;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- BCrypt hashed
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15),
    account_status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, BLOCKED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_account_status (account_status)
);

-- Example Data
INSERT INTO users (username, email, password, first_name, last_name, phone_number) VALUES
('john_doe', 'john@example.com', '$2a$10$...', 'John', 'Doe', '+1234567890'),
('jane_smith', 'jane@example.com', '$2a$10$...', 'Jane', 'Smith', '+1987654321');
```

### 5.2 Seating Service Database (seatingdb)

```sql
CREATE DATABASE IF NOT EXISTS seatingdb;
USE seatingdb;

CREATE TABLE IF NOT EXISTS seats (
    seat_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    venue_id BIGINT NOT NULL,
    section VARCHAR(20) NOT NULL,          -- VIP, PREMIUM, REGULAR
    row_number VARCHAR(10) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, ALLOCATED, BLOCKED
    reserved_by BIGINT,                     -- User ID
    reservation_expiry TIMESTAMP,           -- TTL: 15 minutes
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_seat (event_id, section, row_number, seat_number),
    INDEX idx_event_status (event_id, status),
    INDEX idx_reservation_expiry (reservation_expiry),
    INDEX idx_reserved_by (reserved_by)
);

-- Example Data
INSERT INTO seats (event_id, venue_id, section, row_number, seat_number, status, price) VALUES
(1, 1, 'VIP', 'A', '1', 'AVAILABLE', 150.00),
(1, 1, 'VIP', 'A', '2', 'AVAILABLE', 150.00),
(1, 1, 'PREMIUM', 'B', '1', 'AVAILABLE', 100.00),
(1, 1, 'REGULAR', 'C', '1', 'AVAILABLE', 50.00);
```

### 5.3 Payment Service Database (paymentsdb)

```sql
CREATE DATABASE IF NOT EXISTS paymentsdb;
USE paymentsdb;

CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_order_id UUID UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SUCCESS, FAILED, REFUNDED
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    payment_method VARCHAR(50),            -- CREDIT_CARD, DEBIT_CARD, UPI, WALLET
    transaction_id VARCHAR(100),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refunded_at TIMESTAMP,
    
    INDEX idx_merchant_order (merchant_order_id),
    INDEX idx_status (status),
    INDEX idx_idempotency (idempotency_key)
);

-- Example Data
INSERT INTO payments (merchant_order_id, amount_cents, currency, status, idempotency_key, payment_method) VALUES
('b418c1e8-908f-4c90-b77d-5d99c52b1fa3', 15000, 'INR', 'SUCCESS', 'idmp-12345-abcde', 'UPI'),
('a29d6b24-97e7-4c03-bc8b-1fa44c2b5d45', 25000, 'INR', 'SUCCESS', 'idmp-67890-fghij', 'CREDIT_CARD');
```

### 5.4 Catalog Service Database (catalogdb)

```sql
CREATE DATABASE IF NOT EXISTS catalogdb;
USE catalogdb;

CREATE TABLE IF NOT EXISTS venues (
    venue_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    capacity INTEGER NOT NULL,
    venue_type VARCHAR(50),                -- STADIUM, THEATER, ARENA, CONVENTION_CENTER
    facilities JSON,                       -- {"parking": true, "wifi": true, "food": true}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_venue_type (venue_type)
);

CREATE TABLE IF NOT EXISTS events (
    event_id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,       -- CONCERT, SPORTS, THEATER, CONFERENCE
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING', -- UPCOMING, ONGOING, COMPLETED, CANCELLED
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    INDEX idx_event_type (event_type),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date)
);

-- Example Data
INSERT INTO venues (name, address, city, state, country, capacity, venue_type) VALUES
('Madison Square Garden', '4 Pennsylvania Plaza', 'New York', 'NY', 'USA', 20000, 'ARENA'),
('Wembley Stadium', 'Wembley, London', 'London', NULL, 'UK', 90000, 'STADIUM');

INSERT INTO events (venue_id, name, event_type, start_date, end_date, total_seats, available_seats, base_price) VALUES
(1, 'Rock Concert 2025', 'CONCERT', '2025-12-01 19:00:00', '2025-12-01 23:00:00', 20000, 18500, 75.00),
(2, 'Champions League Final', 'SPORTS', '2025-06-15 20:00:00', '2025-06-15 22:30:00', 90000, 85000, 120.00);
```

### 5.5 Order Service Database (orderdb)

```sql
CREATE DATABASE IF NOT EXISTS orderdb;
USE orderdb;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE,                 -- to ensure idempotent order creation
    user_id BIGINT,                              -- references user-service.user_id (logical)
    event_id BIGINT,                             -- references catalog.events.event_id (logical)
    total_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, RESERVED, PAYMENT_PROCESSING, CONFIRMED, FAILED, CANCELLED, REFUNDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_idempotency (idempotency_key)
);

-- Order items (individual seat lines)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    seat_id BIGINT,             -- seat identifier from seating service (logical link)
    seat_code TEXT,             -- human-friendly seat code (e.g. "A-12")
    seat_price_cents INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    
    INDEX idx_order_id (order_id),
    INDEX idx_seat_id (seat_id)
);

-- Tickets issued for confirmed orders
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    seat_id BIGINT,             -- seat identifier
    ticket_code TEXT UNIQUE,    -- unique ticket identifier / QR payload
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    
    INDEX idx_ticket_order (order_id),
    INDEX idx_ticket_seat (seat_id)
);

-- Example Data (demo)
INSERT INTO orders (idempotency_key, user_id, event_id, total_cents, tax_cents, status) VALUES
('idem-abc-001', 101, 1001, 45000, 4500, 'PENDING'),
('idem-xyz-002', 102, 1002, 90000, 9000, 'CONFIRMED');

-- Link seats as order items (example)
INSERT INTO order_items (order_id, seat_id, seat_code, seat_price_cents) VALUES
('00000000-0000-0000-0000-000000000001', 201, 'VIP-A-12', 15000),
('00000000-0000-0000-0000-000000000001', 202, 'VIP-A-13', 15000),
('00000000-0000-0000-0000-000000000001', 203, 'VIP-A-14', 15000);

-- Example ticket entries (issued after payment/confirmation)
INSERT INTO tickets (id, order_id, seat_id, ticket_code) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 201, 'TCK-20251109-AAA'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 202, 'TCK-20251109-AAB'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 203, 'TCK-20251109-AAC');

```

### 5.5 Entity Relationship Diagram

```
┌──────────────┐
│    users     │
├──────────────┤
│ user_id (PK) │
│ username     │
│ email        │
│ password     │
│ first_name   │
│ last_name    │
└──────┬───────┘
       │
       │ reserved_by (FK)
       │
       ▼
┌──────────────┐         ┌──────────────┐
│    seats     │         │    venues    │
├──────────────┤         ├──────────────┤
│ seat_id (PK) │         │ venue_id(PK) │
│ event_id(FK) │◄────┐   │ name         │
│ venue_id(FK) │─────┼──>│ city         │
│ section      │     │   │ capacity     │
│ status       │     │   └──────────────┘
│ reserved_by  │     │
└──────────────┘     │
                     │
                     │
┌──────────────┐     │
│   events     │     │
├──────────────┤     │
│ event_id(PK) │─────┘
│ venue_id(FK) │
│ name         │
│ event_type   │
│ start_date   │
│ status       │
└──────────────┘

┌────────────────────┐
│     payments       │
├────────────────────┤
│ payment_id (PK)    │
│ merchant_order_id  │
│ amount_cents       │
│ status             │
│ idempotency_key    │
└────────────────────┘

           │
           │ merchant_order_id (FK)
           ▼

┌────────────────────┐
│       orders       │
├────────────────────┤
│ id (PK)            │
│ idempotency_key    │
│ user_id (FK)       │
│ event_id (FK)      │
│ total_cents        │
│ tax_cents          │
│ status             │
│ created_at         │
│ updated_at         │
└──────┬─────────────┘
       │
       │ order_id (FK)
       ▼

┌────────────────────┐
│    order_items     │
├────────────────────┤
│ id (PK)            │
│ order_id (FK)      │
│ seat_id (FK)       │
│ seat_code          │
│ seat_price_cents   │
└──────┬─────────────┘
       │
       │ order_id (FK)
       ▼

┌────────────────────┐
│      tickets       │
├────────────────────┤
│ id (PK)            │
│ order_id (FK)      │
│ seat_id (FK)       │
│ ticket_code (UQ)   │
│ issued_at          │
└────────────────────┘

```

---

## 6. Microservices Communication

### 6.1 Service Endpoints (REST APIs)

#### User Service (Port 8081)

**Authentication Endpoints:**
```
POST   /v1/users/register          - Register new user
POST   /v1/users/login             - Authenticate and get JWT token
POST   /v1/users/logout            - Invalidate JWT token
POST   /v1/users/refresh           - Refresh JWT token
```

**User Management Endpoints:**
```
GET    /v1/users/{id}              - Get user by ID
PUT    /v1/users/{id}              - Update user profile
DELETE /v1/users/{id}              - Delete user account
GET    /v1/users                   - List all users (Admin only)
GET    /v1/users/search?query=     - Search users by name/email
```

**Health Check:**
```
GET    /actuator/health            - Service health status
GET    /actuator/prometheus        - Prometheus metrics
```

**Example Request - User Registration:**
```json
POST http://localhost:8081/v1/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Example Response:**
```json
{
  "userId": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accountStatus": "ACTIVE",
  "createdAt": "2025-11-09T10:30:00Z"
}
```

**Example Request - User Login:**
```json
POST http://localhost:8081/v1/users/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Example Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

#### Seating Service (Port 8082)

**Seat Availability Endpoints:**
```
GET    /v1/seats/availability?eventId={id}           - Get available seats for event
GET    /v1/seats/availability?eventId={id}&section=  - Filter by section
GET    /v1/seats/{id}                                - Get specific seat details
```

**Reservation Endpoints:**
```
POST   /v1/seats/reserve          - Reserve seats (15-minute hold)
POST   /v1/seats/allocate         - Allocate seats after payment
POST   /v1/seats/release          - Release reserved seats
DELETE /v1/seats/reservation/{id} - Cancel reservation
```

**Admin Endpoints:**
```
POST   /v1/seats/bulk             - Bulk create seats for event
PUT    /v1/seats/{id}/block       - Block seat (maintenance)
PUT    /v1/seats/{id}/unblock     - Unblock seat
```

**Health Check:**
```
GET    /actuator/health           - Service health status
GET    /actuator/prometheus       - Prometheus metrics
```

**Example Request - Check Availability:**
```
GET http://localhost:8082/v1/seats/availability?eventId=1
Authorization: Bearer {jwt_token}
```

**Example Response:**
```json
{
  "eventId": 1,
  "totalSeats": 1000,
  "availableSeats": 847,
  "reservedSeats": 123,
  "allocatedSeats": 30,
  "seatsBySection": [
    {
      "section": "VIP",
      "totalSeats": 100,
      "availableSeats": 45,
      "price": 150.00
    },
    {
      "section": "PREMIUM",
      "totalSeats": 300,
      "availableSeats": 234,
      "price": 100.00
    },
    {
      "section": "REGULAR",
      "totalSeats": 600,
      "availableSeats": 568,
      "price": 50.00
    }
  ]
}
```

**Example Request - Reserve Seats:**
```json
POST http://localhost:8082/v1/seats/reserve
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "eventId": 1,
  "seatIds": [45, 46, 47],
  "userId": 1
}
```

**Example Response:**
```json
{
  "reservationId": "res_abc123xyz",
  "eventId": 1,
  "userId": 1,
  "seats": [
    {
      "seatId": 45,
      "section": "VIP",
      "row": "A",
      "number": "12",
      "price": 150.00
    },
    {
      "seatId": 46,
      "section": "VIP",
      "row": "A",
      "number": "13",
      "price": 150.00
    },
    {
      "seatId": 47,
      "section": "VIP",
      "row": "A",
      "number": "14",
      "price": 150.00
    }
  ],
  "totalAmount": 450.00,
  "status": "RESERVED",
  "expiresAt": "2025-11-09T11:00:00Z",
  "ttlSeconds": 900
}
```

---

#### Payment Service (Port 4004)

**Payment Processing Endpoints:**
```
POST   /v1/charge                 - Create payment charge (idempotent)
GET    /v1/payments/{id}          - Get payment details
POST   /v1/refund                 - Process refund
GET    /v1/payments               - List all payments (Admin)
```

**Health Check:**
```
GET    /health                    - Service health status
GET    /metrics                   - Prometheus metrics
```

**Example Request - Create Payment:**
```json
POST http://localhost:4004/v1/charge
Content-Type: application/json
Idempotency-Key: order_abc123_payment_001

{
  "merchant_order_id": "b418c1e8-908f-4c90-b77d-5d99c52b1fa3",
  "amount_cents": 45000,
  "currency": "INR",
  "payment_method": "UPI",
  "customer_details": {
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Example Response:**
```json
{
  "payment_id": "pay_xyz789abc",
  "merchant_order_id": "b418c1e8-908f-4c90-b77d-5d99c52b1fa3",
  "amount_cents": 45000,
  "currency": "INR",
  "status": "SUCCESS",
  "payment_method": "UPI",
  "transaction_id": "txn_upi_123456789",
  "idempotency_key": "order_abc123_payment_001",
  "created_at": "2025-11-09T10:55:00Z"
}
```

**Example Request - Get Payment Details:**
```
GET http://localhost:4004/v1/payments/pay_xyz789abc
```

**Example Response:**
```json
{
  "payment_id": "pay_xyz789abc",
  "merchant_order_id": "b418c1e8-908f-4c90-b77d-5d99c52b1fa3",
  "amount_cents": 45000,
  "currency": "INR",
  "status": "SUCCESS",
  "payment_method": "UPI",
  "transaction_id": "txn_upi_123456789",
  "created_at": "2025-11-09T10:55:00Z",
  "updated_at": "2025-11-09T10:55:05Z"
}
```

**Example Request - Process Refund:**
```json
POST http://localhost:4004/v1/refund
Content-Type: application/json

{
  "payment_id": "pay_xyz789abc",
  "reason": "Event cancelled"
}
```

**Example Response:**
```json
{
  "refund_id": "ref_abc123xyz",
  "payment_id": "pay_xyz789abc",
  "amount_cents": 45000,
  "currency": "INR",
  "status": "REFUNDED",
  "refunded_at": "2025-11-09T11:30:00Z"
}
```

---

#### Catalog Service (Port 8000)

**Venue Endpoints:**
```
GET    /v1/venues                 - Get all venues
GET    /v1/venues/{id}            - Get venue by ID
POST   /v1/venues                 - Create new venue (Admin)
PUT    /v1/venues/{id}            - Update venue (Admin)
DELETE /v1/venues/{id}            - Delete venue (Admin)
```

**Event Endpoints:**
```
GET    /v1/events                              - Get all events
GET    /v1/events/{id}                         - Get event by ID
GET    /v1/events/search?city=&event_type=     - Search and filter events
POST   /v1/events                              - Create new event (Admin)
PUT    /v1/events/{id}                         - Update event (Admin)
DELETE /v1/events/{id}                         - Delete event (Admin)
```

**Health Check:**
```
GET    /health                    - Service health status
```

**Example Request - Get All Venues:**
```
GET http://localhost:8000/v1/venues
```

**Example Response:**
```json
{
  "venues": [
    {
      "venue_id": 1,
      "name": "Madison Square Garden",
      "address": "4 Pennsylvania Plaza",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "capacity": 20000,
      "venue_type": "ARENA",
      "facilities": {
        "parking": true,
        "wifi": true,
        "food_court": true,
        "accessible": true
      }
    },
    {
      "venue_id": 2,
      "name": "Wembley Stadium",
      "address": "Wembley, London",
      "city": "London",
      "country": "UK",
      "capacity": 90000,
      "venue_type": "STADIUM",
      "facilities": {
        "parking": true,
        "wifi": true,
        "vip_lounges": true
      }
    }
  ]
}
```

**Example Request - Search Events:**
```
GET http://localhost:8000/v1/events/search?city=New%20York&event_type=CONCERT&status=UPCOMING
```

**Example Response:**
```json
{
  "events": [
    {
      "event_id": 1,
      "venue_id": 1,
      "venue_name": "Madison Square Garden",
      "name": "Rock Concert 2025",
      "description": "Annual rock music festival featuring top artists",
      "event_type": "CONCERT",
      "start_date": "2025-12-01T19:00:00Z",
      "end_date": "2025-12-01T23:00:00Z",
      "status": "UPCOMING",
      "total_seats": 20000,
      "available_seats": 18500,
      "base_price": 75.00,
      "city": "New York"
    }
  ],
  "total_count": 1,
  "filters_applied": {
    "city": "New York",
    "event_type": "CONCERT",
    "status": "UPCOMING"
  }
}
```

**Example Request - Create Event:**
```json
POST http://localhost:8000/v1/events
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "venue_id": 1,
  "name": "Jazz Night 2025",
  "description": "An evening of smooth jazz music",
  "event_type": "CONCERT",
  "start_date": "2025-11-25T20:00:00Z",
  "end_date": "2025-11-25T23:30:00Z",
  "total_seats": 5000,
  "base_price": 60.00
}
```

#### Order Service (Port 4003)

**Order Management Endpoints:**

```
POST   /v1/orders                 - Create a new order (idempotent; requires Idempotency-Key header)
GET    /v1/orders/{orderId}       - Get order details by ID
GET    /v1/orders/{orderId}/tickets - Get tickets for an order
POST   /v1/payments/callback      - Handle payment service callback (payment notifications)
GET    /health                    - Service health check
GET    /metrics                   - System metrics (Prometheus-compatible)
```

**Health & Metrics:**

```
GET    /health                    - Service health status (HTTP 200 OK)
GET    /metrics                   - Exposes system/process metrics compatible with Prometheus/Grafana
```

**Example Request - Create Order (idempotent):**

```bash
curl -X POST http://localhost:4003/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: abc123" \
  -d '{
    "user_id": 101,
    "event_id": 1001,
    "reservation_id": "res_abc123xyz",
    "seats": [201,202,203]
  }'
```

**Example Response - Create Order (201 / existing if same key):**

```json
{
  "orderId": "7f7ddc5b-2099-44a1-9f52-3089eb15c1d9",
  "status": "PENDING",
  "userId": 101,
  "eventId": 1001,
  "totalCents": 45000,
  "taxCents": 4500,
  "createdAt": "2025-11-09T10:50:00Z"
}
```

**Notes:**

* If the same `Idempotency-Key` is presented again, the service returns the existing order instead of creating a duplicate.
* On order creation the status is typically `PENDING` (or `RESERVED` depending on implementation) until payment confirmation.

**Example Request - Get Order by ID:**

```bash
curl -X GET http://localhost:4003/v1/orders/7f7ddc5b-2099-44a1-9f52-3089eb15c1d9 \
  -H "Authorization: Bearer {jwt_token}"
```

**Example Response - Get Order:**

```json
{
  "orderId": "7f7ddc5b-2099-44a1-9f52-3089eb15c1d9",
  "status": "CONFIRMED",
  "userId": 101,
  "eventId": 1001,
  "items": [
    {"seatId": 201, "seatCode": "VIP-A-12", "priceCents": 15000},
    {"seatId": 202, "seatCode": "VIP-A-13", "priceCents": 15000},
    {"seatId": 203, "seatCode": "VIP-A-14", "priceCents": 15000}
  ],
  "totalCents": 45000,
  "taxCents": 4500,
  "paymentId": "pay_xyz789abc",
  "createdAt": "2025-11-09T10:50:00Z",
  "updatedAt": "2025-11-09T11:00:05Z"
}
```

**Example Request - Payment Callback (invoked by Payment Service):**

```bash
curl -X POST http://localhost:4003/v1/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "7f7ddc5b-2099-44a1-9f52-3089eb15c1d9",
    "payment_id": "7d0f1735-b4ab-4f43-8d27-6322a91db938",
    "status": "SUCCESS",
    "transaction_id": "txn_upi_123456789"
  }'
```

**Expected Callback Processing (behaviour):**

* On `SUCCESS`:

  * Order Service updates order status to `CONFIRMED`.
  * Calls Seating Service to `allocate` seats (reservation → allocated).
  * Generates `tickets` entries and unique `ticket_code`s.
  * Calls Notification Service (email/SMS) to send tickets/confirmation.
* On `FAILED`:

  * Updates order status to `FAILED`.
  * Leaves reservation until TTL or triggers seat release workflow.
  * Optionally notifies user of failure and next steps.

**Example Request - Get Tickets for an Order:**

```bash
curl -X GET http://localhost:4003/v1/orders/7f7ddc5b-2099-44a1-9f52-3089eb15c1d9/tickets \
  -H "Authorization: Bearer {jwt_token}"
```

**Example Response - Tickets:**

```json
{
  "orderId": "7f7ddc5b-2099-44a1-9f52-3089eb15c1d9",
  "tickets": [
    {"ticketId": "e3cbf6d8-1a2b-4c3d-9e7f-000000000001", "seatId": 201, "ticketCode": "TCK-20251109-AAA", "issuedAt": "2025-11-09T11:00:10Z"},
    {"ticketId": "e3cbf6d8-1a2b-4c3d-9e7f-000000000002", "seatId": 202, "ticketCode": "TCK-20251109-AAB", "issuedAt": "2025-11-09T11:00:10Z"}
  ]
}
```

**Security & Validation:**

* Payloads are validated with DTOs / `class-validator`.
* `Idempotency-Key` enforced for `POST /v1/orders`.
* Only authorized users (or the owning user/admin) can GET order/ticket endpoints (JWT-based auth).
* Inter-service calls use internal endpoints (configured via env vars like `SEATING_URL`, `PAYMENT_URL`, `CATALOG_URL`).

---

### 6.2 Inter-Service Communication

**Communication Patterns:**

1. **Synchronous HTTP/REST Calls:**
   - Trip Service → User Service: Validate user authentication
   - Trip Service → Seating Service: Check and reserve seats
   - Order Service → Payment Service: Process payment
   - Payment Service → Order Service: Payment callback

2. **Service Discovery:**
   - Services communicate using service names in Docker Compose
   - Kubernetes uses internal DNS for service resolution
   - Example: `http://user-service:8081/v1/users/{id}`

**Complete Booking Flow - Inter-Service Communication:**

```
Step 1: User Authentication
Client → User Service
  POST /v1/users/login
  Response: JWT Token

Step 2: Browse Events
Client → Catalog Service
  GET /v1/events/search?city=New%20York
  Response: Available events

Step 3: Check Seat Availability
Client → Seating Service
  GET /v1/seats/availability?eventId=1
  Headers: Authorization: Bearer {jwt_token}
  Response: Available seats by section

Step 4: Reserve Seats
Client → Seating Service
  POST /v1/seats/reserve
  Body: {eventId: 1, seatIds: [45, 46, 47], userId: 1}
  
  Response: Reservation details with 15-min expiry

Step 5: Create Order
Client → Order Service
  POST /v1/orders
  Body: {userId: 1, eventId: 1, reservationId: "res_abc123xyz"}
  
  Internal: Order Service → Seating Service
    GET /v1/seats/reservation/res_abc123xyz
    Verify reservation is valid and not expired
  
  Response: Order created with PENDING status

Step 6: Process Payment
Client → Payment Service
  POST /v1/charge
  Headers: Idempotency-Key: order_abc123_payment_001
  Body: {merchant_order_id: "order_abc123", amount_cents: 45000}
  
  Internal Process:
    - Check idempotency key in database
    - If exists, return cached response
    - If new, process payment with payment gateway
    - Store payment record
    - Update status to SUCCESS/FAILED
  
  Response: Payment confirmation

Step 7: Payment Callback (Success)
Payment Service → Order Service
  POST /v1/orders/callback
  Body: {orderId: "order_abc123", paymentId: "pay_xyz789abc", status: "SUCCESS"}
  
  Internal: Order Service → Seating Service
    POST /v1/seats/allocate
    Body: {reservationId: "res_abc123xyz"}
    
    Seating Service Process:
      - Update seat status from RESERVED to ALLOCATED
      - Release distributed locks
  
  Order Service Process:
    - Update order status to CONFIRMED
    - Generate tickets
    - Send confirmation email (future)

Step 8: Get Tickets
Client → Order Service
  GET /v1/orders/{orderId}/tickets
  Response: Digital tickets with QR codes
```

**Error Handling in Inter-Service Communication:**

```
Scenario: Payment Fails

Payment Service → Order Service
  POST /v1/orders/callback
  Body: {orderId: "order_abc123", status: "FAILED", reason: "Insufficient funds"}

Order Service Actions:
  - Update order status to FAILED
  - DO NOT allocate seats
  - Reservation remains with TTL

Seating Service Actions:
  - Background job detects expired reservations
  - Updates seat status from RESERVED to AVAILABLE
  - Releases seats back to inventory
  - Clears reservation locks
```

**Idempotency in Payment Service:**

```
Request 1:
POST /v1/charge
Idempotency-Key: order_abc123_payment_001
Body: {merchant_order_id: "order_abc123", amount_cents: 45000}

Payment Service Process:
1. Check if idempotency_key exists in payments table
2. Not found → Process new payment
3. Call payment gateway
4. Store payment record with idempotency_key
5. Return response: {payment_id: "pay_xyz789abc", status: "SUCCESS"}

Request 2 (Duplicate - Network retry):
POST /v1/charge
Idempotency-Key: order_abc123_payment_001
Body: {merchant_order_id: "order_abc123", amount_cents: 45000}

Payment Service Process:
1. Check if idempotency_key exists in payments table
2. Found → Return cached response
3. NO NEW PAYMENT PROCESSED
4. Return same response: {payment_id: "pay_xyz789abc", status: "SUCCESS"}
```

---

## 7. Deployment

### 7.1 Project Structure

```
event-ticketing-and-seat-reservation/
├── user-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
│
├── seating-service/
│   ├── src/
│   ├── Dockerfile
│   ├── pom.xml
│   └── README.md
│
├── payment-service/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── catalog-service/
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── docker-compose.yml          # Docker Compose orchestration
├── prometheus.yml              # Prometheus configuration
├── k8s/                        # Kubernetes manifests
│   ├── user-service.yaml
│   ├── seating-service.yaml
│   ├── payment-service.yaml
│   ├── catalog-service.yaml
│   ├── postgres.yaml
│   └── ingress.yaml
│
└── README.md                   # Main documentation
```

---

### 7.2 Docker Deployment

#### 7.2.1 Dockerfile Examples

**User Service Dockerfile:**
```dockerfile
FROM node:21-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:21-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production
EXPOSE 4004
CMD ["node", "dist/main.js"]
```

**Payment Service Dockerfile:**
```dockerfile
FROM node:21-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:21-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 4004
CMD ["node", "dist/main.js"]
```

**Catalog Service Dockerfile:**
```dockerfile
FROM node:21-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:21-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production
EXPOSE 4004
CMD ["node", "dist/main.js"]
```

#### 7.2.2 Docker Compose Configuration

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14
    container_name: postgres-db
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - ticketing-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  # User Service
  user-service:
    build:
      context: ./user-service
      dockerfile: Dockerfile
    container_name: user-service
    ports:
      - "8081:8081"
    environment:
      DATASOURCE_URL: jdbc:postgresql://postgres:5432/userdb
      DATASOURCE_USERNAME: admin
      DATASOURCE_PASSWORD: admin123
      JWT_SECRET: your-secret-key-here-make-it-long-and-secure
      JWT_EXPIRATION: 3600000
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticketing-network
    restart: unless-stopped

  # Seating Service
  seating-service:
    build:
      context: ./seating-service
      dockerfile: Dockerfile
    container_name: seating-service
    ports:
      - "8082:8082"
    environment:
      DATASOURCE_URL: jdbc:postgresql://postgres:5432/seatingdb
      DATASOURCE_USERNAME: admin
      DATASOURCE_PASSWORD: admin123
      RESERVATION_TTL_SECONDS: 900
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticketing-network
    restart: unless-stopped

  # Payment Service
  payment-service:
    build:
      context: ./payment-service
      dockerfile: Dockerfile
    container_name: payment-service
    ports:
      - "4004:4004"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: paymentsdb
      DB_USER: admin
      DB_PASSWORD: admin123
      PORT: 4004
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticketing-network
    restart: unless-stopped

  # Catalog Service
  catalog-service:
    build:
      context: ./catalog-service
      dockerfile: Dockerfile
    container_name: catalog-service
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://admin:admin123@postgres:5432/catalogdb
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticketing-network
    restart: unless-stopped

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - ticketing-network

  # Grafana Dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - ticketing-network

networks:
  ticketing-network:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

**init-db.sql (Database Initialization):**
```sql
-- Create databases for each service
CREATE DATABASE IF NOT EXISTS userdb;
CREATE DATABASE IF NOT EXISTS seatingdb;
CREATE DATABASE IF NOT EXISTS paymentsdb;
CREATE DATABASE IF NOT EXISTS catalogdb;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE userdb TO admin;
GRANT ALL PRIVILEGES ON DATABASE seatingdb TO admin;
GRANT ALL PRIVILEGES ON DATABASE paymentsdb TO admin;
GRANT ALL PRIVILEGES ON DATABASE catalogdb TO admin;
```

#### 7.2.3 Docker Commands

**Build and Start All Services:**
```bash
# Build all images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f user-service

# Check service status
docker-compose ps
```

**Stop and Clean Up:**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

**Individual Service Management:**
```bash
# Restart specific service
docker-compose restart user-service

# Rebuild and restart service
docker-compose up -d --build user-service

# View service logs
docker logs user-service -f --tail 100
```

**Health Checks:**
```bash
# User Service
curl http://localhost:8081/actuator/health

# Seating Service
curl http://localhost:8082/actuator/health

# Payment Service
curl http://localhost:4004/health

# Catalog Service
curl http://localhost:8000/health
```

#### 7.2.4 Docker Images and Containers

**List Running Containers:**
```bash
$ docker ps

CONTAINER ID   IMAGE                    PORTS                    STATUS
abc123def456   user-service            0.0.0.0:8081->8081/tcp   Up 2 hours
def456ghi789   seating-service         0.0.0.0:8082->8082/tcp   Up 2 hours
ghi789jkl012   payment-service         0.0.0.0:4004->4004/tcp   Up 2 hours
jkl012mno345   catalog-service         0.0.0.0:8000->8000/tcp   Up 2 hours
mno345pqr678   postgres:14             0.0.0.0:5432->5432/tcp   Up 2 hours
stu901vwx234   prom/prometheus         0.0.0.0:9090->9090/tcp   Up 2 hours
vwx234yz5678   grafana/grafana         0.0.0.0:3000->3000/tcp   Up 2 hours
```

**View Docker Images:**
```bash
$ docker images

REPOSITORY              TAG          SIZE
user-service           latest        450MB
seating-service        latest        455MB
payment-service        latest        280MB
catalog-service        latest        320MB
postgres               14            350MB
prom/prometheus        latest        220MB
grafana/grafana        latest        310MB
```

**View Docker Volumes:**
```bash
$ docker volume ls

DRIVER    VOLUME NAME
local     event-ticketing_postgres_data
local     event-ticketing_prometheus_data
local     event-ticketing_grafana_data
```

---

### 7.3 Kubernetes Deployment

#### 7.3.3 Building and Deploying to Kubernetes

**Step 1: Configure Minikube Docker Environment**
```bash
# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Verify connection
docker ps
```

**Step 2: Build Service Images**
```bash
# Build all service images in Minikube
cd user-service
docker build -t user-service:v1.0 .

cd ../seating-service
docker build -t seating-service:v1.0 .

cd ../payment-service
docker build -t payment-service:v1.0 .

cd ../catalog-service
docker build -t catalog-service:v1.0 .

cd ..
```

**Step 3: Deploy Infrastructure Components**
```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
```

**Step 4: Deploy Microservices**
```bash
# Deploy all services
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/seating-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/catalog-service.yaml

# Monitor deployment progress
kubectl get deployments -w
```

**Step 5: Verify Deployment**
```bash
# Check all pods
kubectl get pods

# Check services
kubectl get services

# Check persistent volume claims
kubectl get pvc
```

#### 7.3.4 Kubernetes Management Commands

**Viewing Logs:**
```bash
# View logs from a specific service
kubectl logs -l app=user-service -f

# View logs from specific pod
kubectl logs user-service-7d5f8c9b6d-abc12 -f

# View logs from all containers in a pod
kubectl logs user-service-7d5f8c9b6d-abc12 --all-containers=true
```

**Scaling Services:**
```bash
# Scale user service to 3 replicas
kubectl scale deployment user-service --replicas=3

# Auto-scale based on CPU usage
kubectl autoscale deployment user-service --min=2 --max=10 --cpu-percent=70

# Check horizontal pod autoscaler
kubectl get hpa
```

**Updating Services:**
```bash
# Update service image
kubectl set image deployment/user-service user-service=user-service:v1.1

# Rollout status
kubectl rollout status deployment/user-service

# Rollback to previous version
kubectl rollout undo deployment/user-service
```

**Debugging:**
```bash
# Describe pod for detailed information
kubectl describe pod user-service-7d5f8c9b6d-abc12

# Execute commands inside pod
kubectl exec -it user-service-7d5f8c9b6d-abc12 -- /bin/bash

# Port forward for local testing
kubectl port-forward service/user-service 8081:8081
```

#### 7.3.5 Accessing Services via NodePort

```bash
# Get NodePort URLs
minikube service user-service --url
minikube service seating-service --url
minikube service payment-service --url
minikube service catalog-service --url

# Example output:
# http://192.168.49.2:30081
# http://192.168.49.2:30082
# http://192.168.49.2:30404
# http://192.168.49.2:30800
```

**Testing Services:**
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Test user service health
curl http://$MINIKUBE_IP:30081/actuator/health

# Register a user
curl -X POST http://$MINIKUBE_IP:30081/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### 7.3.6 Kubernetes Dashboard

```bash
# Enable dashboard addon
minikube addons enable dashboard

# Access dashboard
minikube dashboard

# Or get dashboard URL
minikube dashboard --url
```

#### 7.3.7 Cleanup Kubernetes Resources

```bash
# Delete all deployments
kubectl delete -f k8s/

# Delete specific deployment
kubectl delete deployment user-service

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

---

## 8. Testing with Postman/cURL

### 8.1 End-to-End Booking Flow Testing

**Test Scenario: Complete ticket booking workflow**

#### Step 1: User Registration
```bash
curl -X POST http://localhost:8081/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "firstName": "Alice",
    "lastName": "Johnson",
    "phoneNumber": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "userId": 5,
  "username": "alice_johnson",
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "Johnson",
  "accountStatus": "ACTIVE",
  "createdAt": "2025-11-09T14:30:00Z"
}
```

#### Step 2: User Login
```bash
curl -X POST http://localhost:8081/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInVzZXJuYW1lIjoiYWxpY2Vfam9obnNvbiIsImlhdCI6MTYzMTU0MjgwMCwiZXhwIjoxNjMxNTQ2NDAwfQ.xyz...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Save the token for subsequent requests:**
```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Step 3: Browse Events
```bash
curl -X GET "http://localhost:8000/v1/events/search?city=New%20York&status=UPCOMING" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Step 4: Check Seat Availability
```bash
curl -X GET "http://localhost:8082/v1/seats/availability?eventId=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Response:**
```json
{
  "eventId": 1,
  "totalSeats": 1000,
  "availableSeats": 847,
  "seatsBySection": [
    {
      "section": "VIP",
      "availableSeats": 45,
      "price": 150.00
    }
  ]
}
```

#### Step 5: Reserve Seats
```bash
curl -X POST http://localhost:8082/v1/seats/reserve \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "seatIds": [101, 102, 103],
    "userId": 5
  }'
```

**Expected Response:**
```json
{
  "reservationId": "res_xyz789abc",
  "totalAmount": 450.00,
  "expiresAt": "2025-11-09T14:55:00Z",
  "ttlSeconds": 900
}
```

#### Step 6: Process Payment
```bash
curl -X POST http://localhost:4004/v1/charge \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking_alice_20251109_001" \
  -d '{
    "merchant_order_id": "order_alice_xyz789",
    "amount_cents": 45000,
    "currency": "INR",
    "payment_method": "UPI"
  }'
```

**Expected Response:**
```json
{
  "payment_id": "pay_abc123xyz",
  "status": "SUCCESS",
  "transaction_id": "txn_upi_987654321"
}
```

#### Step 7: Verify Seat Allocation
```bash
curl -X GET "http://localhost:8082/v1/seats/availability?eventId=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Verify seats 101, 102, 103 are now ALLOCATED**

### 8.2 Testing Error Scenarios

#### Test Case 1: Duplicate Payment (Idempotency)
```bash
# Send same payment request again
curl -X POST http://localhost:4004/v1/charge \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking_alice_20251109_001" \
  -d '{
    "merchant_order_id": "order_alice_xyz789",
    "amount_cents": 45000,
    "currency": "INR"
  }'
```

**Expected: Same response as first request, NO new payment processed**

#### Test Case 2: Expired Reservation
```bash
# Reserve seats
curl -X POST http://localhost:8082/v1/seats/reserve \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1, "seatIds": [201, 202], "userId": 5}'

# Wait 16 minutes (901 seconds)
sleep 901

# Try to allocate expired reservation
curl -X POST http://localhost:8082/v1/seats/allocate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reservationId": "res_expired_123"}'
```

**Expected: 400 Bad Request - Reservation expired**

#### Test Case 3: Concurrent Seat Reservation
```bash
# Terminal 1: Reserve seat 301
curl -X POST http://localhost:8082/v1/seats/reserve \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"eventId": 1, "seatIds": [301], "userId": 5}' &

# Terminal 2: Reserve same seat simultaneously
curl -X POST http://localhost:8082/v1/seats/reserve \
  -H "Authorization: Bearer $JWT_TOKEN2" \
  -d '{"eventId": 1, "seatIds": [301], "userId": 6}' &

wait
```

**Expected: One succeeds, one fails with "Seat already reserved"**

### 8.3 Postman Collection Structure

**Collection: Event Ticketing API**

```
📁 Event Ticketing API
  📁 User Service
    ├─ POST Register User
    ├─ POST Login
    ├─ GET Get User Profile
    └─ PUT Update User Profile
  
  📁 Catalog Service
    ├─ GET All Venues
    ├─ GET Venue by ID
    ├─ GET All Events
    ├─ GET Search Events
    └─ POST Create Event (Admin)
  
  📁 Seating Service
    ├─ GET Check Availability
    ├─ POST Reserve Seats
    ├─ POST Allocate Seats
    ├─ POST Release Seats
    └─ DELETE Cancel Reservation
  
  📁 Payment Service
    ├─ POST Create Payment
    ├─ GET Payment Details
    ├─ POST Process Refund
    └─ GET All Payments (Admin)
  
  📁 Health Checks
    ├─ GET User Service Health
    ├─ GET Seating Service Health
    ├─ GET Payment Service Health
    └─ GET Catalog Service Health
```

**Environment Variables:**
```json
{
  "base_url_user": "http://localhost:8081",
  "base_url_seating": "http://localhost:8082",
  "base_url_payment": "http://localhost:4004",
  "base_url_catalog": "http://localhost:8000",
  "jwt_token": "",
  "user_id": "",
  "event_id": "1",
  "reservation_id": ""
}
```

---

## 9. Monitoring and Observability

### 9.1 Prometheus Configuration

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8081']
    metrics_path: '/actuator/prometheus'

  - job_name: 'seating-service'
    static_configs:
      - targets: ['seating-service:8082']
    metrics_path: '/actuator/prometheus'

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:4004']
    metrics_path: '/metrics'
```

### 9.2 Key Metrics to Monitor

#### User Service Metrics
```
# Total user registrations
user_registrations_total

# Login attempts
user_login_attempts_total{status="success"}
user_login_attempts_total{status="failed"}

# Active sessions
active_user_sessions_count

# API request duration
http_server_requests_seconds{uri="/v1/users/login"}
```

#### Seating Service Metrics
```
# Seat reservations
seat_reservations_total{status="success"}
seat_reservations_total{status="failed"}

# Expired reservations auto-released
expired_reservations_released_total

# Current reserved seats
seats_currently_reserved_count

# Seat availability by event
seats_available_by_event{event_id="1"}

```

#### Payment Service Metrics
```
# Payment transactions
payment_transactions_total{status="SUCCESS"}
payment_transactions_total{status="FAILED"}

# Refund transactions
refund_transactions_total

# Idempotent request cache hits
idempotent_cache_hits_total

# Payment processing duration
payment_processing_seconds
```

### 9.3 Accessing Monitoring Dashboards

**Prometheus:**
```
URL: http://localhost:9090
```

**Useful Prometheus Queries:**
```promql
# Request rate per second for user service
rate(http_server_requests_seconds_count[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Failed seat reservation rate
rate(seat_reservations_total{status="failed"}[5m])

# Payment success rate
sum(rate(payment_transactions_total{status="SUCCESS"}[5m])) / 
sum(rate(payment_transactions_total[5m])) * 100
```

**Grafana:**
```
URL: http://localhost:3000
Default Login: admin / admin
```

### 9.4 Grafana Dashboard Configuration

**Dashboard: Microservices Overview**

**Panels:**
1. **Service Health Status** - Green/Red indicators for each service
2. **Request Rate** - Line chart showing requests per second across all services
3. **Error Rate** - Percentage of failed requests
4. **Response Time P95** - 95th percentile latency for each service
5. **Active Reservations** - Gauge showing current seat reservations
6. **Payment Success Rate** - Percentage of successful payments

**Dashboard: Database Performance**

**Panels:**
1. **Connection Pool Usage** - Active database connections
2. **Query Execution Time** - Slow query detection
3. **Database CPU Usage**
4. **Database Memory Usage**

**Dashboard: Business Metrics**

**Panels:**
1. **Bookings per Hour** - Time series of completed bookings
2. **Revenue per Hour** - Monetary value of successful transactions
3. **Top Events by Bookings** - Bar chart of most popular events
4. **User Registration Growth** - Cumulative user count over time
5. **Average Booking Value** - Mean transaction amount

### 9.5 Alerting Rules

**Alert: High Error Rate**
```yaml
- alert: HighErrorRate
  expr: rate(http_server_requests_seconds_count{status="5xx"}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected in {{ $labels.service }}"
```

**Alert: Seat Reservation Bottleneck**
```yaml
- alert: SeatReservationBottleneck
  expr: rate(seat_reservations_total{status="failed"}[5m]) > 0.1
  for: 3m
  labels:
    severity: warning
  annotations:
    summary: "High seat reservation failure rate"
```

**Alert: Payment Service Down**
```yaml
- alert: PaymentServiceDown
  expr: up{job="payment-service"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Payment service is unavailable"
```

### 9.6 Log Aggregation

**Structured Logging Format:**
```json
{
  "timestamp": "2025-11-09T15:30:00.123Z",
  "level": "INFO",
  "service": "seating-service",
  "traceId": "abc123xyz789",
  "spanId": "span001",
  "userId": 5,
  "eventId": 1,
  "message": "Seats reserved successfully",
  "context": {
    "reservationId": "res_xyz789",
    "seatIds": [101, 102, 103],
    "duration_ms": 245
  }
}
```

**Viewing Logs:**
```bash
# Docker Compose
docker-compose logs -f --tail=100 seating-service

# Kubernetes
kubectl logs -l app=seating-service -f --tail=100

# Filter by error level
kubectl logs -l app=payment-service | grep "ERROR"
```

---

## 10. GitHub Repository Links

### 10.1 Main Repository
```
https://github.com/parikshitsharma2001/event-ticketing-and-seat-reservation
```

**Repository Structure:**
- Complete microservices source code for all services
- Docker and Kubernetes deployment configurations
- Database schemas and initialization scripts
- Prometheus and Grafana monitoring setup
- Comprehensive README with setup instructions

### 10.2 Individual Service Repositories (If Separated)

**User Service:**
```
Branch: main
Path: /user-service
Technologies: TypeScript, NestJS, PostgreSQL, TypeORM
```

**Seating Service:**
```
Branch: main
Path: /seating-service
Technologies: TypeScript, NestJS, PostgreSQL, TypeORM
```

**Payment Service:**
```
Branch: main
Path: /payment-service
Technologies: TypeScript, NestJS, PostgreSQL, TypeORM
```

**Catalog Service:**
```
Branch: main
Path: /catalog-service
Technologies: TypeScript, NestJS, PostgreSQL, TypeORM
```

### 10.3 Documentation Files

**Key Documentation:**
- `/README.md` - Main project documentation
- `/user-service/README.md` - User service specific documentation
- `/seating-service/README.md` - Seating service specific documentation
- `/payment-service/README.md` - Payment service specific documentation
- `/catalog-service/README.md` - Catalog service specific documentation
- `/docs/API_DOCUMENTATION.md` - Complete API reference
- `/docs/ARCHITECTURE.md` - System architecture details
- `/docs/DEPLOYMENT.md` - Deployment guide

---

## 11. Architecture Patterns and Best Practices

### 11.1 Design Patterns Implemented

**1. Database-per-Service Pattern**
- Each microservice owns its database
- Data isolation and autonomy
- Independent schema evolution
- No direct database access between services

**2. API Gateway Pattern (Recommended for Production)**
- Single entry point for all client requests
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling

**3. Circuit Breaker Pattern (Future Enhancement)**
- Prevents cascading failures
- Graceful degradation
- Automatic retry with exponential backoff
- Fallback mechanisms

**4. Saga Pattern (Distributed Transactions)**
- Choreography-based saga for booking workflow
- Compensating transactions for rollback
- Example: Reserve → Pay → Allocate (or Rollback)

**5. CQRS Pattern (Command Query Responsibility Segregation)**
- Implemented in Payment Service
- Separate read and write models
- Optimized query performance

**6. Repository Pattern**
- Abstraction over data access
- Clean separation of concerns
- Easier testing and mocking

### 11.2 Security Best Practices

**1. Authentication & Authorization**
- JWT-based stateless authentication
- Token expiration and refresh mechanism
- Role-based access control (RBAC)

**2. Data Protection**
- Password hashing with BCrypt (cost factor 10)
- HTTPS encryption in production
- Sensitive data masking in logs

**3. API Security**
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- CORS configuration
- Rate limiting (future implementation)

**4. Secret Management**
- Environment variables for sensitive data
- Never commit secrets to Git
- Use Kubernetes Secrets in production

### 11.3 Scalability Considerations

**Horizontal Scaling:**
- Stateless service design
- Multiple replicas in Kubernetes
- Load balancing across instances

**Caching Strategy:**
- Cache seat availability data (short TTL)
- Cache event information (longer TTL)
- Invalidation on updates

**Database Optimization:**
- Connection pooling
- Database indexing on frequently queried columns
- Read replicas for catalog service
- Partitioning for large tables

**Asynchronous Processing:**
- Background jobs for expired reservation cleanup
- Event-driven architecture for notifications
- Message queues for decoupling (future)

### 11.4 Resilience and Fault Tolerance

**1. Health Checks**
- Liveness probes in Kubernetes
- Readiness probes for traffic routing
- Deep health checks including database connectivity

**2. Graceful Degradation**
- Timeout configurations
- Fallback responses
- Partial service availability

**3. Data Consistency**
- Eventual consistency model
- Idempotent operations
- Optimistic locking where appropriate
- Pessimistic locking for critical sections

**4. Disaster Recovery**
- Regular database backups
- Point-in-time recovery
- Multi-zone deployment (production)

---

## 12. Future Enhancements

### 12.1 Planned Features

**API Gateway Integration:**
- Centralized authentication
- Request aggregation
- API versioning

**Service Mesh:**
- Istio or Linkerd integration
- Advanced traffic management
- Observability and security
- Service-to-service encryption

**Event-Driven Architecture:**
- Apache Kafka or RabbitMQ
- Asynchronous communication
- Event sourcing
- CQRS full implementation

**Advanced Monitoring:**
- Distributed tracing with Jaeger or Zipkin
- ELK Stack for log aggregation
- APM tools (New Relic, Datadog)
- Custom business metrics dashboards

**Notification Service:**
- Email notifications
- SMS alerts
- Push notifications
- Booking confirmations and reminders

**Order Service Enhancement:**
- Ticket generation with QR codes
- PDF ticket export
- Ticket transfer functionality
- Refund management

**Mobile Application:**
- React Native mobile app
- QR code scanning for entry
- Real-time seat map visualization
- In-app payment integration

### 12.2 Performance Optimizations

**Caching Enhancements:**
- CDN integration for static assets
- Redis Cluster for high availability
- Cache warming strategies

**Database Optimizations:**
- Database sharding
- Read replicas for read-heavy services
- Materialized views
- Query optimization

**API Optimizations:**
- GraphQL for flexible data fetching
- Response compression
- HTTP/2 support
- Pagination and filtering improvements

---

## 13. Troubleshooting Guide

### 13.1 Common Issues

**Issue 1: Service Cannot Connect to Database**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs postgres-db

# Test connection manually
psql -h localhost -U admin -d userdb

# Solution: Ensure database is healthy and environment variables are correct
```

**Issue 2: JWT Token Invalid**
```bash
# Check token expiration
# Ensure JWT_SECRET is same across all instances
# Verify token is being passed in Authorization header correctly

# Solution: Refresh token or re-login
```

### 13.2 Debugging Steps

**1. Check Service Health**
```bash
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
curl http://localhost:4004/health
curl http://localhost:8000/health
```

**2. Verify Inter-Service Communication**
```bash
# From inside a container
docker exec -it user-service curl http://seating-service:8082/actuator/health
```

**3. Check Database Connectivity**
```bash
# Access database
docker exec -it postgres-db psql -U admin -d userdb

# Check tables
\dt

# Query data
SELECT * FROM users LIMIT 10;
```

**4. Monitor Resource Usage**
```bash
# Docker
docker stats

# Kubernetes
kubectl top pods
kubectl top nodes
```

---

## 14. Conclusion

The Event Ticketing and Seat Reservation System demonstrates a comprehensive implementation of microservices architecture with industry best practices. The system successfully addresses key challenges in distributed systems including:

**Technical Achievements:**
- Polyglot microservices with TypeScript
- Database-per-service pattern with complete data isolation
- Idempotent payment processing
- Automatic seat reservation expiration
- JWT-based stateless authentication
- Container orchestration with Docker and Kubernetes
- Comprehensive monitoring and observability

**Scalability & Performance:**
- Horizontal scaling capability
- Stateless service design
- Efficient database operations
- Optimized caching strategies

**Reliability & Resilience:**
- Health checks and auto-recovery
- Graceful error handling
- Data consistency mechanisms
- Comprehensive testing strategies

**Production Readiness:**
- Complete Docker and Kubernetes deployment
- Monitoring with Prometheus and Grafana
- Structured logging for debugging
- Security best practices

This system provides a solid foundation for a production-grade event ticketing platform and demonstrates proficiency in modern cloud-native development, microservices architecture, and DevOps practices.

---

## Appendix

### A. Technology Versions
- Node.js: 21
- PostgreSQL: 14
- Docker: 20.10+
- Kubernetes: 1.28+

### B. Port Allocation
- User Service: 8081
- Seating Service: 8082
- Payment Service: 4004
- Catalog Service: 8000
- PostgreSQL: 5432
- Prometheus: 9090
- Grafana: 3000

### C. Default Credentials
**PostgreSQL:**
- Username: admin
- Password: admin123

**Grafana:**
- Username: admin
- Password: admin

**Note:** Change all default credentials in production environments.

---

**Document Version:** 1.0  
**Last Updated:** November 9, 2025  
**Prepared For:** Scalable Services Assignment  
**Project Repository:** https://github.com/parikshitsharma2001/event-ticketing-and-seat-reservation