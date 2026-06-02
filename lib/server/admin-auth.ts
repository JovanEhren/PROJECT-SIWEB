import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { pool } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_IDENTITY_COOKIE, DEFAULT_ADMIN_USERNAME } from "@/lib/auth";

export type CurrentAdmin = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  accountStatus: string;
  passwordHash: string;
};

type AdminRow = {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  phone: string | null;
  account_status: string | null;
  password_hash: string | null;
};

function mapAdmin(row: AdminRow): CurrentAdmin {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username || DEFAULT_ADMIN_USERNAME,
    email: row.email,
    phone: row.phone || "",
    accountStatus: row.account_status || "AKTIF",
    passwordHash: row.password_hash || ""
  };
}

export async function findAdminByLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  if (!normalized) return null;

  const result = await pool.query<AdminRow>(
    `
      SELECT id, full_name, username, email, phone, account_status, password_hash
      FROM shipin_users
      WHERE role = 'ADMIN'
        AND (LOWER(email) = $1 OR LOWER(COALESCE(username, '')) = $1)
      LIMIT 1
    `,
    [normalized]
  );

  return result.rows[0] ? mapAdmin(result.rows[0]) : null;
}

export async function findAdminById(id: string) {
  const result = await pool.query<AdminRow>(
    `
      SELECT id, full_name, username, email, phone, account_status, password_hash
      FROM shipin_users
      WHERE role = 'ADMIN' AND id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ? mapAdmin(result.rows[0]) : null;
}

export async function getCurrentAdminFromRequest(request?: NextRequest) {
  const cookieStore = request ? null : await cookies();
  const sessionValue = request
    ? request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    : cookieStore?.get(ADMIN_SESSION_COOKIE)?.value;

  if (sessionValue !== "active") {
    return null;
  }

  const identity = request
    ? request.cookies.get(ADMIN_SESSION_IDENTITY_COOKIE)?.value
    : cookieStore?.get(ADMIN_SESSION_IDENTITY_COOKIE)?.value;

  if (identity) {
    const byId = await findAdminById(identity);
    if (byId) return byId;

    const byLogin = await findAdminByLogin(identity);
    if (byLogin) return byLogin;
  }

  const fallback = await pool.query<AdminRow>(
    `
      SELECT id, full_name, username, email, phone, account_status, password_hash
      FROM shipin_users
      WHERE role = 'ADMIN'
      ORDER BY created_at ASC
      LIMIT 1
    `
  );

  return fallback.rows[0] ? mapAdmin(fallback.rows[0]) : null;
}
