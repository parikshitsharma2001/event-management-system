import { Pool } from 'pg';

const pool = new Pool({
  connectionString: `postgres://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS venues (
      id SERIAL PRIMARY KEY, 
      name TEXT NOT NULL, 
      city TEXT, 
      address TEXT, 
      capacity INT
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      venue_id INT NOT NULL,
      title TEXT NOT NULL,
      type TEXT,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'ON_SALE',
      description TEXT
    );
  `);
  console.log('Catalog DB initialized');
}

export default pool;
