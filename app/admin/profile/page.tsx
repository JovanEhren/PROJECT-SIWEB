"use client";

import { Suspense, useState } from "react";

import { ShieldIcon, StarIcon, TruckIcon, UserIcon } from "@/components/icons";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

function RowLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#24463a]">{children}</p>;
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-[#57645e]">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-[#59665f]">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.5c2.4 2.2 3.8 5.2 3.8 8.5S14.4 18.3 12 20.5c-2.4-2.2-3.8-5.2-3.8-8.5S9.6 5.7 12 3.5Z" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
  ariaLabel
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
  ariaLabel: string;
}) {
  return (
    <div>
      <RowLabel>{label}</RowLabel>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-[#e0e6df] bg-[#f2f5ef] px-4 pr-12 text-[15px] tracking-[0.2em] text-[#253a33] outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e6d64]"
          aria-label={ariaLabel}
        >
          {show ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M3 3 21 21" />
              <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />
              <path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a15.6 15.6 0 0 1-3.2 4.5" />
              <path d="M6.2 6.2A15.8 15.8 0 0 0 2 12s3 8 10 8a9.8 9.8 0 0 0 4.2-.9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[#98a29d]">{hint}</p> : null}
    </div>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f2f5f1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] rounded-[28px] border border-[#e5ebe5] bg-white p-6 text-[13px] font-semibold text-[#5f6d63]">
        Loading profile...
      </div>
    </main>
  );
}

function AdminProfilContent() {
  // Language State
  const [isEnglish, setIsEnglish] = useState(false);

  // Form Fields State
  const [fullName, setFullName] = useState("Bagus Arya");
  const [email, setEmail] = useState("bagus.santoso@email.com");
  const [currentPassword, setCurrentPassword] = useState("password");
  const [newPassword, setNewPassword] = useState("password");
  const [confirmPassword, setConfirmPassword] = useState("password");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");

  // Dynamic Statistics Data based on language
  const stats = [
    { label: isEnglish ? "TOTAL SHIPMENTS" : "TOTAL PENGIRIMAN", value: "124", tone: "bg-[#d9f2d6]", icon: "truck" },
    { label: isEnglish ? "SENDER RATING" : "RATING PENGIRIM", value: "4.9", tone: "bg-[#e3e7df]", icon: "star" },
    { label: isEnglish ? "ACCOUNT STATUS" : "STATUS AKUN", value: isEnglish ? "Active" : "Aktif", tone: "bg-[#d9f2d6]", icon: "shield" }
  ];

  function updateEmail() {
    if (!email.trim() || !email.includes("@")) {
      setMessageTone("error");
      setMessage(isEnglish ? "Invalid email address." : "Email tidak valid.");
      return;
    }
    setMessageTone("success");
    setMessage(isEnglish ? "Email updated successfully." : "Email berhasil diperbarui.");
  }

  function saveSecurity() {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessageTone("error");
      setMessage(isEnglish ? "Please fill in all password fields." : "Lengkapi semua kolom kata sandi.");
      return;
    }
    if (newPassword.length < 8) {
      setMessageTone("error");
      setMessage(isEnglish ? "New password must be at least 8 characters long." : "Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessageTone("error");
      setMessage(isEnglish ? "Password confirmation does not match." : "Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setMessageTone("success");
    setMessage(isEnglish ? "Security changes saved successfully." : "Perubahan keamanan berhasil disimpan.");
  }

  function toggleLanguage() {
    const nextLang = !isEnglish;
    setIsEnglish(nextLang);
    setMessageTone("info");
    setMessage(
      nextLang 
        ? "Language changed to English (Default)." 
        : "Bahasa diubah ke Bahasa Indonesia (Default)."
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f2f5f1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        {/* Header Section */}
        <section className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-extrabold leading-none text-[#185338] md:text-[50px]">
              {isEnglish ? "Profile & Settings" : "Profil & Pengaturan"}
            </h1>
            <p className="mt-2 text-[13px] text-[#445149] md:text-[16px]">
              {isEnglish 
                ? "Manage your account information and ensure your logistics data security remains intact." 
                : "Kelola informasi akun Anda dan pastikan keamanan data logistik Anda tetap terjaga."}
            </p>
          </div>
          <AdminLogoutButton />
        </section>

        {/* Feedback Messages */}
        {message ? (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-[12px] font-semibold ${
              messageTone === "error"
                ? "bg-[#fde9e7] text-[#b9473f]"
                : messageTone === "success"
                  ? "bg-[#eaf8ee] text-[#1f7a44]"
                  : "bg-[#f2f5ef] text-[#5c6c62]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-4">
            {/* Account Details Card */}
            <article className="rounded-[30px] border border-[#e5ebe5] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(25,45,33,0.05)] md:px-7">
              <div className="flex items-center gap-4">
                <div className="relative h-[95px] w-[95px] rounded-[28px] border-[3px] border-[#79de8c] bg-[#f6fbf5]">
                  <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-white">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b7f4c] text-white ring-2 ring-[#d5e8d8]">
                      <UserIcon className="h-[18px] w-[18px]" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageTone("info");
                      setMessage(
                        isEnglish 
                          ? "Profile picture edit feature will be enabled upon media integration." 
                          : "Fitur ubah foto profil akan diaktifkan pada integrasi media."
                      );
                    }}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1f8f55] text-white shadow-sm"
                    aria-label={isEnglish ? "Edit profile picture" : "Edit foto profil"}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M12 20h9" />
                      <path d="m16.5 3.5 4 4L7 21H3v-4L16.5 3.5Z" />
                    </svg>
                  </button>
                </div>
                <div>
                  <h2 className="text-[23px] font-extrabold text-[#153528] md:text-[26px]">
                    {isEnglish ? "Account Details" : "Detail Akun"}
                  </h2>
                  <p className="text-sm text-[#5f6b64]">
                    {isEnglish ? "Your basic information registered in the system." : "Informasi dasar Anda yang terdaftar di sistem."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div>
                  <RowLabel>{isEnglish ? "Full Name" : "Nama Lengkap"}</RowLabel>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 w-full rounded-xl bg-[#f2f5ef] px-4 text-[16px] text-[#213730] outline-none"
                  />
                </div>
                <div>
                  <RowLabel>{isEnglish ? "Username" : "Username"}</RowLabel>
                  <div className="h-12 rounded-xl bg-[#f2f5ef] px-4 text-[15px] leading-[48px] text-[#9ca8a1]">
                    adminship1
                  </div>
                  <p className="mt-1 text-[11px] text-[#98a29d]">
                    {isEnglish ? "Username cannot be changed." : "Username tidak dapat diubah."}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <RowLabel>{isEnglish ? "Email" : "Email"}</RowLabel>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 min-w-[280px] flex-1 rounded-xl bg-[#f2f5ef] px-4 text-[15px] text-[#213730] outline-none"
                  />
                  <button
                    type="button"
                    onClick={updateEmail}
                    className="h-12 rounded-full bg-[#84e88c] px-7 text-[15px] font-semibold text-[#1a5a35]"
                  >
                    {isEnglish ? "Update" : "Update"}
                  </button>
                </div>
              </div>
            </article>

            {/* Statistics Row */}
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <article key={item.label} className={`${item.tone} rounded-[24px] px-5 py-4`}>
                  <div className="mb-2">
                    {item.icon === "truck" && <TruckIcon className="h-6 w-6 text-[#1d7a43]" />}
                    {item.icon === "star" && (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#5f665f]">
                        <StarIcon className="h-3.5 w-3.5 text-[#5f665f]" />
                      </span>
                    )}
                    {item.icon === "shield" && <ShieldIcon className="h-6 w-6 text-[#0e7d3f]" />}
                  </div>
                  <p className="text-[42px] font-black leading-none text-[#185338]">{item.value}</p>
                  <p className="mt-1 text-[12px] font-bold tracking-wide text-[#29443b]">{item.label}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Security Management Card */}
          <article className="rounded-[30px] border border-[#e5ebe5] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(25,45,33,0.05)] md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fee7e5]">
                <svg viewBox="0 0 24 24" fill="none" stroke="#e26457" strokeWidth="2" className="h-4 w-4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
              </div>
              <h2 className="text-[34px] font-extrabold leading-none text-[#153528]">
                {isEnglish ? "Security" : "Keamanan"}
              </h2>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#4f5c56]">
              {isEnglish 
                ? "Change your password regularly to secure your SHIPIN GO account." 
                : "Ganti kata sandi Anda secara berkala untuk menjaga keamanan akun SHIPIN GO."}
            </p>

            <div className="mt-5 space-y-4">
              <PasswordField
                label={isEnglish ? "Current Password" : "Kata Sandi Saat Ini"}
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((prev) => !prev)}
                ariaLabel={
                  showCurrentPassword 
                    ? (isEnglish ? "Hide password" : "Sembunyikan kata sandi") 
                    : (isEnglish ? "Show password" : "Lihat kata sandi")
                }
              />

              <PasswordField
                label={isEnglish ? "New Password" : "Kata Sandi Baru"}
                value={newPassword}
                onChange={setNewPassword}
                show={showNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
                hint={isEnglish ? "Minimum 8 characters with a mix of numbers" : "Minimal 8 karakter dengan kombinasi angka"}
                ariaLabel={
                  showNewPassword 
                    ? (isEnglish ? "Hide password" : "Sembunyikan kata sandi") 
                    : (isEnglish ? "Show password" : "Lihat kata sandi")
                }
              />

              <PasswordField
                label={isEnglish ? "Confirm New Password" : "Konfirmasi Kata Sandi Baru"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                ariaLabel={
                  showConfirmPassword 
                    ? (isEnglish ? "Hide password" : "Sembunyikan kata sandi") 
                    : (isEnglish ? "Show password" : "Lihat kata sandi")
                }
              />
            </div>

            <button
              type="button"
              onClick={saveSecurity}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1a7332] text-[16px] font-semibold text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <path d="M17 21v-8H7v8" />
                <path d="M7 3v5h8" />
              </svg>
              {isEnglish ? "Save Changes" : "Simpan Perubahan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMessageTone("info");
                setMessage(
                  isEnglish 
                    ? "Please contact the super admin to reset your password." 
                    : "Silakan hubungi super admin untuk reset kata sandi."
                );
              }}
              className="mt-4 w-full text-center text-[14px] text-[#5d6962]"
            >
              {isEnglish ? "Forgot password?" : "Lupa kata sandi?"}
            </button>
          </article>
        </section>

        {/* Language Selection Card */}
        <section className="mt-2">
          <article
            className="flex max-w-[620px] items-center justify-between rounded-[24px] border border-[#e5ebe5] bg-[#f5f8f2] px-5 py-4"
          >
            <button type="button" onClick={toggleLanguage} className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecf0ea]">
                <GlobeIcon />
              </div>
              <div>
                <p className="text-[18px] font-semibold leading-none text-[#253a33]">
                  {isEnglish ? "Language Settings" : "Pengaturan Bahasa"}
                </p>
                <p className="mt-1 text-[12px] text-[#65726b]">
                  {isEnglish ? "English (Default)" : "Bahasa Indonesia (Default)"}
                </p>
              </div>
            </button>
            <ChevronRight />
          </article>
        </section>
      </div>
    </main>
  );
}

export default function AdminProfilPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminProfilContent />
    </Suspense>
  );
}