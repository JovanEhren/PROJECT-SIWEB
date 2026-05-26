import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var shipinPgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum tersedia. Isi .env.local dengan koneksi Neon PostgreSQL.");
}

const needsSsl =
  connectionString.includes("sslmode=require") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("aws.neon");

export const pool =
  globalThis.shipinPgPool ||
  new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true
  });

export const db = pool;

if (process.env.NODE_ENV !== "production") {
  globalThis.shipinPgPool = pool;
}
