"use client";

import { useEffect } from "react";

import { PublicFooter } from "@/components/public/footer";
import { PublicNavbar } from "@/components/public/navbar";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    document.title = "Terjadi Kesalahan | SHIPIN GO";
    console.error("Global app error:", error);
  }, [error]);

  return (
    <>
      <PublicNavbar />
      <main className="min-h-[calc(100vh-200px)] bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.16),transparent_40%),#f3f7f1] px-4 py-10 sm:py-14">
        <div className="mx-auto grid max-w-[560px] place-items-center">
          <div className="w-full rounded-[30px] border border-[#ddeddc] bg-white p-8 text-center shadow-[0_24px_60px_rgba(95,128,101,0.18)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf8ee] text-[#16a34a]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-9 w-9">
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
                <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-[#16a34a]">500 Internal Server Error</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-none text-[#1e3526]">
              Terjadi Kesalahan
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-[#617067]">
              Maaf, terjadi kesalahan pada server. Silakan coba beberapa saat lagi.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#16a34a] px-6 text-[14px] font-semibold text-white hover:bg-[#12813a]"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
