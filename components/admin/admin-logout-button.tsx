"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/session", {
      method: "DELETE"
    }).catch(() => null);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-shipin-deep/10 bg-white px-4 py-2 text-sm font-semibold text-shipin-deep hover:border-shipin-deep/20 hover:bg-[#f8fbf6]"
    >
      Logout
    </button>
  );
}
