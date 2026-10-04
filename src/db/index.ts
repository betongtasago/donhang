import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

declare global {
  var _postgresPool: Pool | undefined;
}

if (!process.env.SQL_HOST || !process.env.SQL_USER || !process.env.SQL_PASSWORD || !process.env.SQL_DB_NAME) {
  throw new Error(
    'Missing required database environment variables. Set SQL_HOST, SQL_USER, SQL_PASSWORD, and SQL_DB_NAME. '
      + 'See .env.example for Supabase setup instructions.'
  );
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      port: parseInt(process.env.SQL_PORT || '5432', 10),
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      ssl: process.env.SQL_HOST?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
