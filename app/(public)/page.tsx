import type { Metadata } from "next";
import { Suspense } from "react";

import { LandingPage } from "@/components/public/landing-page";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Beranda | SHIPIN GO",
  description: "Solusi logistik terdepan di Indonesia."
};

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#f2f5f1]">
      <div className="mx-auto max-w-[1540px] px-4 py-6 text-[13px] font-semibold text-[#5f6d63]">
        Memuat halaman...
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage />
      </Suspense>
    </>
  );
}
