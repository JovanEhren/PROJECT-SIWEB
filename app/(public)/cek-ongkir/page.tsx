import type { Metadata } from "next";
import { Suspense } from "react";

import { CekOngkirPage } from "@/components/public/cek-ongkir-page";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Cek Ongkir | SHIPIN GO",
  description: "Bandingkan tarif pengiriman SHIPIN GO secara cepat."
};

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#f2f5f1]">
      <div className="mx-auto max-w-[1540px] px-4 py-6 text-[13px] font-semibold text-[#5f6d63]">
        Memuat kalkulator...
      </div>
    </main>
  );
}

export default function CekOngkirRoutePage() {
  return (
    <>
      <PublicNavbar />
      <Suspense fallback={<LoadingFallback />}>
        <CekOngkirPage />
      </Suspense>
    </>
  );
}
