import type { Metadata } from "next";
import { Suspense } from "react";

import { PublicNavbar } from "@/components/public/navbar";
import { UlasanPage } from "@/components/public/ulasan-page";

export const metadata: Metadata = {
  title: "Ulasan | SHIPIN GO",
  description: "Baca dan kirim ulasan pelanggan SHIPIN GO."
};

export default function UlasanPublicPage() {
  return (
    <>
      <PublicNavbar />
      <Suspense
        fallback={
          <main className="shell py-10">
            <div className="rounded-[20px] border border-[#e4e8e3] bg-[#f8faf7] p-6 text-[13px] font-semibold text-[#657068]">
              Memuat ulasan...
            </div>
          </main>
        }
      >
        <UlasanPage />
      </Suspense>
    </>
  );
}
