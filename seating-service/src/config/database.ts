import { Pool } from 'pg';

const pool = new Pool({
  connectionString: `postgres://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'seatingdb'}`,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seats (
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
      updated_at TIMESTAMP DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_event_id ON seats(event_id);
    CREATE INDEX IF NOT EXISTS idx_status ON seats(status);
    CREATE INDEX IF NOT EXISTS idx_event_status ON seats(event_id, status);
    CREATE INDEX IF NOT EXISTS idx_order_id ON seats(order_id);
  `);

  console.log('Seating DB initialized');
}

export default pool;