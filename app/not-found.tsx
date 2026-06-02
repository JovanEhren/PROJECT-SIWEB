import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/public/footer";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan | SHIPIN GO",
  description: "Halaman yang Anda cari tidak tersedia di SHIPIN GO."
};

export default function NotFound() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-[calc(100vh-200px)] bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),transparent_40%),#f3f7f1] px-4 py-10 sm:py-14">
        <div className="mx-auto grid max-w-[560px] place-items-center">
          <div className="w-full rounded-[30px] border border-[#ddeddc] bg-white p-8 text-center shadow-[0_24px_60px_rgba(95,128,101,0.18)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf8ee] text-[#16a34a]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-9 w-9">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5h.01M14.5 9.5h.01M8.5 15c1-1 2.2-1.5 3.5-1.5S14.5 14 15.5 15" />
              </svg>
            </div>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-[#16a34a]">404 Not Found</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-none text-[#1e3526]">Halaman Tidak Ditemukan</h1>
            <p className="mt-4 text-[15px] leading-7 text-[#617067]">
              Maaf, halaman yang Anda cari tidak tersedia.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#16a34a] px-6 text-[14px] font-semibold text-white hover:bg-[#12813a]"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
