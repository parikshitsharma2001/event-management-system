import { Pool } from 'pg';

const pool = new Pool({
  connectionString: `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS payments (
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
  `);

  console.log('Payment DB initialized');
}

export default pool;
