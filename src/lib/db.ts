import { Pool, PoolClient } from 'pg';

const MAX_CONNECTIONS = 20;
const IDLE_TIMEOUT_MS = 30000;

export const pool = new Pool({
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: 5432,
  database: 'cip60',
  max: MAX_CONNECTIONS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const executeQuery = async <T = any>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> => {
  const client = await pool.connect();

  try {
    const result = await client.query(queryText, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
};

export const executeTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};