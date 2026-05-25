import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

declare global {
  // eslint-disable-next-line no-var
  var shipinPgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum tersedia. Isi .env.local dengan koneksi Neon PostgreSQL.");
}

export const pool =
  globalThis.shipinPgPool ||
  new Pool({
    connectionString,
    max: 20, // Connection pool max
    idleTimeout: 30, // Close idle connections after 30s
    connectionTimeoutMillis: 5000 // Connection timeout 5s
  });

export const db = pool;

if (process.env.NODE_ENV !== "production") {
  globalThis.shipinPgPool = pool;
}
