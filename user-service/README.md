# User Service

## Overview
User Service handles user authentication, registration, and profile management for the Event Ticketing System. Built using NestJS and following the microservices pattern with a dedicated PostgreSQL database.

## Technologies
- Node.js 21
- NestJS 10
- TypeORM
- PostgreSQL
- JWT Authentication
- BCrypt Password Hashing
- Prometheus Metrics
- Docker

## Features
- User registration with validation
- User authentication with JWT tokens
- User profile management (CRUD operations)
- User search and filtering
- Account status management (active, suspended, deleted)
- Password encryption with BCrypt
- Prometheus metrics for monitoring
- Health check endpoints
- CQRS-based repository pattern

## API Endpoints

### Authentication
- `POST /v1/users/register` - Register a new user
- `POST /v1/users/login` - Authenticate and get JWT token

### User Management
- `GET /v1/users/{id}` - Get user by ID
- `GET /v1/users/username/{username}` - Get user by username
- `GET /v1/users/email/{email}` - Get user by email
- `GET /v1/users?search={term}&activeOnly={boolean}` - Search users
- `PUT /v1/users/{id}` - Update user profile
- `DELETE /v1/users/{id}` - Soft delete user
- `PATCH /v1/users/{id}/suspend` - Suspend user account
- `PATCH /v1/users/{id}/activate` - Activate user account

### Monitoring
- `GET /health` - Health check
- `GET /actuator/health` - Spring Boot compatible health check
- `GET /actuator/prometheus` - Prometheus metrics

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);
```

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_HOST | PostgreSQL hostname | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USERNAME | PostgreSQL username | postgres |
| DATABASE_PASSWORD | PostgreSQL password | postgres |
| DATABASE_NAME | PostgreSQL database name | userdb |
| JWT_SECRET | JWT secret key | mySecretKey... |
| PORT | Service port | 8081 |

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
docker build -t user-service:latest .
```

### Run container:
```bash
docker run -p 8081:8081 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_NAME=userdb \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres \
  user-service:latest
```

## Running with Docker Compose
```bash
docker-compose up user-service
```

## Testing API

### 1. Register User
```bash
curl -X POST http://localhost:8081/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "city": "New York"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8081/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "john_doe",
    "password": "password123"
  }'
```

### 3. Get User by ID
```bash
curl -X GET http://localhost:8081/v1/users/1
```

### 4. Update User
```bash
curl -X PUT http://localhost:8081/v1/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John Updated",
    "city": "Los Angeles"
  }'
```

### 5. Search Users
```bash
curl -X GET "http://localhost:8081/v1/users?search=john"
```

### 6. Health Check
```bash
curl -X GET http://localhost:8081/health
```

### 7. Prometheus Metrics
```bash
curl -X GET http://localhost:8081/actuator/prometheus
```

## Monitoring Metrics

The service exposes the following custom metrics:
- `user_registrations_total` - Total number of user registrations
- `user_logins_total` - Total number of user logins

## Security
- Passwords are encrypted using BCrypt (10 rounds)
- JWT tokens expire after 24 hours
- All sensitive endpoints should be secured (currently open for testing)

## Future Enhancements
- OAuth2 integration
- Role-based access control (RBAC)
- Email verification
- Password reset functionality
- Two-factor authentication
- Rate limiting
- API Gateway integration