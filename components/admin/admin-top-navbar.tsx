"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ProfileData = {
  id: string;
  fullName: string;
};

const adminMenuItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/kirim-paket", label: "Kirim Paket" },
  { href: "/admin/histori", label: "Histori" },
  { href: "/admin/ulasan", label: "Ulasan" }
];

export function AdminTopNavbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/admin/profile", { cache: "no-store" });
        const data = (await response.json()) as { profile?: ProfileData };

        if (response.ok && data.profile && active) {
          setProfile(data.profile);
        }
      } catch {
        // Silently fail - navbar stays with default icon
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#fbfaf3]/88 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
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
          <span className="hidden rounded-full bg-[#e8f7df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2a8b48] md:inline-flex">
            Admin Area
          </span>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-shipin-deep text-white shadow-[0_10px_24px_rgba(20,91,48,0.18)]"
                    : "text-shipin-text hover:bg-white hover:text-shipin-deep"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/profile"
            aria-label="Profil Admin"
            className="relative overflow-hidden rounded-full bg-[#1b7f4c] ring-2 ring-[#d5e8d8]"
            style={{ width: "40px", height: "40px" }}
          >
            {profile?.fullName ? (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=fff&color=1b7f4c&size=80&bold=true`}
                alt={`Avatar ${profile.fullName}`}
                className="h-full w-full object-cover"
                width={40}
                height={40}
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute inset-0 m-auto h-[18px] w-[18px] text-white">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/50 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-shipin-deep text-white"
                    : "border border-[#d8ded5] bg-white text-shipin-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}


