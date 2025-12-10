import { Pool } from 'pg';

const pool = new Pool({
  connectionString: `postgres://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'userdb'}`,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
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
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      last_login TIMESTAMP
    );
  `);

  console.log('User DB initialized');
}

export default pool;