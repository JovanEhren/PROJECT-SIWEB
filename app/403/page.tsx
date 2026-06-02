import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Akses Ditolak | SHIPIN GO",
  description: "Anda tidak memiliki akses ke halaman ini."
};

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.16),transparent_40%),#f3f7f1] px-4">
      <div className="w-full max-w-[560px] rounded-[30px] border border-[#ddeddc] bg-white p-8 text-center shadow-[0_24px_60px_rgba(95,128,101,0.18)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf8ee] text-[#16a34a]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-9 w-9">
            <path d="M12 3 5 7v5c0 4.2 2.8 8 7 9 4.2-1 7-4.8 7-9V7l-7-4Z" />
            <path d="M9.5 9.5 14.5 14.5M14.5 9.5l-5 5" />
          </svg>
        </div>
        <p className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-[#16a34a]">403 Forbidden</p>
        <h1 className="mt-3 text-[34px] font-extrabold leading-none text-[#1e3526]">
          Anda tidak memiliki akses ke halaman ini
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#617067]">
          Silakan kembali ke halaman utama atau login menggunakan akun admin yang valid.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#16a34a] px-6 text-[14px] font-semibold text-white hover:bg-[#12813a]"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
