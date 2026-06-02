"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
  { href: "/#beranda", label: "Beranda" },
  { href: "/cek-ongkir", label: "Cek Ongkir" },
  { href: "/ulasan", label: "Ulasan" },
  { href: "/kontak", label: "Kontak" },
  { href: "/lacak-paket", label: "Lacak Paket" }
];

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#fbfaf3]/85 backdrop-blur">
      <div className="shell flex h-20 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-extrabold tracking-tight text-shipin-deep">
          <Image
            src="/images/shipin-logo.png"
            alt="SHIPIN GO Logo"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-md object-cover"
            priority
          />
          <span>SHIPIN GO</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-shipin-text lg:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-shipin-deep">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full border border-shipin-deep/15 px-4 py-2 text-sm font-semibold text-shipin-deep hover:border-shipin-deep/30 hover:bg-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-shipin-deep px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#12572f]"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe7dd] bg-white text-[#1b5f35] lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="m6 6 12 12" />
              <path d="m18 6-12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#e8eee6] bg-[#fbfaf3] lg:hidden">
          <div className="shell py-4">
            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-shipin-text hover:bg-[#edf4ea] hover:text-shipin-deep"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-shipin-deep/20 text-sm font-semibold text-shipin-deep"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full bg-shipin-deep text-sm font-semibold text-white"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}