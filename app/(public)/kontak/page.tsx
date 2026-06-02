import type { Metadata } from "next";
import { Suspense } from "react";

import { KontakPage } from "@/components/public/kontak-page";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Kontak | SHIPIN GO",
  description: "Hubungi tim SHIPIN GO untuk bantuan dan informasi layanan."
};

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#f2f5f1]">
      <div className="mx-auto max-w-[1540px] px-4 py-6 text-[13px] font-semibold text-[#5f6d63]">
        Memuat kontak...
      </div>
    </main>
  );
}

export default function KontakPublicPage() {
  return (
    <>
      <PublicNavbar />
      <Suspense fallback={<LoadingFallback />}>
        <KontakPage />
      </Suspense>
    </>
  );
}
