export const ADMIN_SESSION_COOKIE = "shipin_admin_session";
export const ADMIN_SESSION_IDENTITY_COOKIE = "shipin_admin_identity";
export const ADMIN_SESSION_ROLE_COOKIE = "shipin_admin_role";
export const DEFAULT_ADMIN_USERNAME = "adminship1";

export function isValidAdminCredential(username: string, password: string) {
  return username.trim().toLowerCase() === DEFAULT_ADMIN_USERNAME && password === "Admin123";
}
