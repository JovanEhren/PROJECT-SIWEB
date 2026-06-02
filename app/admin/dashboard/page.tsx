import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Dashboard | SHIPIN GO Admin",
  description: "Dashboard operasional admin SHIPIN GO."
};

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f2f5f1] p-6">
          <div className="mx-auto max-w-7xl rounded-[28px] bg-white p-6 text-sm font-semibold text-[#5f6d63]">
            Memuat dashboard...
          </div>
        </main>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
