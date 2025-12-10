import { Pool } from 'pg';

const pool = new Pool({
  connectionString: `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
});

export async function initDb() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS orders (
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
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      seat_id INT,
      seat_code TEXT,
      seat_price_cents INT
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      seat_id INT,
      ticket_code TEXT UNIQUE,
      issued_at TIMESTAMP DEFAULT now()
    );
  `);
  console.log('Order DB initialized');
}
