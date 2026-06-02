import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_IDENTITY_COOKIE,
  ADMIN_SESSION_ROLE_COOKIE
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProtectedAdminRoute = isAdminRoute && !isAdminLoginRoute;
  const isPublicAuthRoute = pathname === "/login" || pathname === "/register";
  const isPasswordRecoveryRoute = pathname === "/lupa-password";
  const isAuthRoute = isAdminLoginRoute || isPublicAuthRoute || isPasswordRecoveryRoute;
  const isLoggedIn = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "active";
  const identity = request.cookies.get(ADMIN_SESSION_IDENTITY_COOKIE)?.value;
  const role = request.cookies.get(ADMIN_SESSION_ROLE_COOKIE)?.value;

  if (pathname === "/admin") {
    const url = request.nextUrl.clone();
    url.pathname = isLoggedIn ? "/admin/dashboard" : "/admin/login";
    if (!isLoggedIn && identity) {
      url.searchParams.set("reason", "expired");
    }
    return NextResponse.redirect(url);
  }

  if (isProtectedAdminRoute && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    if (identity) {
      url.searchParams.set("reason", "expired");
    }
    return NextResponse.redirect(url);
  }

  if (isProtectedAdminRoute && role && role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/403";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register", "/lupa-password"]
};
