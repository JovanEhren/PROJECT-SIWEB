"use client";

import { usePathname } from "next/navigation";

import { AdminTopNavbar } from "@/components/admin/admin-top-navbar";

export default function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNavbar = pathname !== "/admin/login";

  return (
    <>
      {showNavbar ? <AdminTopNavbar /> : null}
      {children}
    </>
  );
}
