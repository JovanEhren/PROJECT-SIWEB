"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from "@/components/icons";
import { InputField } from "@/components/ui/input-field";
import { PrimaryButton } from "@/components/ui/primary-button";

type LoginFormProps = {
  mode?: "login" | "register";
};

type FieldErrors = {
  fullName?: string;
  username?: string;
  email?: string;
  login?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGIT_PATTERN = /\d/;

export function LoginForm({ mode = "login" }: LoginFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (!isRegister && params.get("reason") === "expired") {
      setNotice("Sesi Anda telah berakhir, silakan login kembali.");
    }
  }, [isRegister]);

  function setFieldError<K extends keyof FieldErrors>(key: K, value: FieldErrors[K]) {
    setFieldErrors((current) => ({
      ...current,
      [key]: value
    }));
  }

  function clearGlobalMessages() {
    setError("");
    setNotice("");
  }

  function validateFullName(value: string) {
    if (!value.trim()) return "Nama lengkap tidak boleh kosong";
    return "";
  }

  function validateUsername(value: string) {
    if (!value.trim()) return "Username tidak boleh kosong";
    return "";
  }

  function validateEmail(value: string) {
    const normalized = value.trim();
    if (!normalized) return "Email tidak boleh kosong";
    if (!EMAIL_PATTERN.test(normalized)) return "Format email tidak valid";
    return "";
  }

  function validateLogin(value: string) {
    if (!value.trim()) return "Username tidak boleh kosong";
    return "";
  }

  function validatePassword(value: string, strict = false) {
    if (!value) return "Password tidak boleh kosong";
    if (strict && value.length < 8) return "Password minimal 8 karakter";
    if (strict && !DIGIT_PATTERN.test(value)) return "Password harus mengandung angka";
    return "";
  }

  function validateConfirmPassword(value: string, sourcePassword: string) {
    if (value !== sourcePassword) return "Password tidak cocok";
    return "";
  }

  async function handleLoginSubmit() {
    const nextErrors: FieldErrors = {
      login: validateLogin(emailOrUsername),
      password: validatePassword(password)
    };

    setFieldErrors(nextErrors);
    if (nextErrors.login || nextErrors.password) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: emailOrUsername.trim(),
          password,
          remember
        })
      });

      if (!response.ok) {
        setError("Username atau password salah");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, silakan coba beberapa saat lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit() {
    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password, true),
      confirmPassword: validateConfirmPassword(confirmPassword, password)
    };

    setFieldErrors(nextErrors);
    if (nextErrors.fullName || nextErrors.username || nextErrors.email || nextErrors.password || nextErrors.confirmPassword) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          remember
        })
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string;
            field?: keyof FieldErrors;
          }
        | null;

      if (!response.ok) {
        if (data?.field && data?.message) {
          setFieldError(data.field, data.message);
        } else {
          setError(data?.message || "Gagal menyimpan data, coba lagi");
        }
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, silakan coba beberapa saat lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearGlobalMessages();

    if (isRegister) {
      await handleRegisterSubmit();
      return;
    }

    await handleLoginSubmit();
  }

  return (
    <section className="flex min-h-[460px] items-center rounded-[30px] bg-[#fbfaf3] px-4 py-8 sm:px-6 lg:min-h-[760px] lg:px-8">
      <div className="mx-auto w-full max-w-[470px]">
        <div className="px-2 sm:px-4">
          <Link href="/" className="inline-block w-fit" aria-label="Kembali ke halaman utama">
            <Image
              src="/images/shipin-go-logo-transparent.png"
              alt="Logo Shipin Go"
              width={112}
              height={74}
              className="h-auto w-[92px] object-contain sm:w-[104px]"
              priority
            />
          </Link>
          <h1 className="mt-7 text-[40px] font-extrabold leading-none text-[#2a312d] sm:text-[48px]">
            {isRegister ? "Daftar Akun" : "Selamat Datang"}
          </h1>
          <p className="mt-4 max-w-[330px] text-[15px] leading-8 text-[#6b716b]">
            {isRegister
              ? "Buat akun admin untuk mengelola pengiriman Anda."
              : "Masuk sebagai admin untuk mengelola pengiriman Anda dengan mudah."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-[32px] bg-transparent px-2 sm:px-4">
          {isRegister ? (
            <>
              <div>
                <label className="mb-3 block text-sm font-semibold text-[#3f4742]">Nama Lengkap</label>
                <InputField
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    if (fieldErrors.fullName) setFieldError("fullName", validateFullName(event.target.value));
                  }}
                  onBlur={(event) => setFieldError("fullName", validateFullName(event.target.value))}
                  placeholder="Masukkan nama lengkap"
                  icon={<UserIcon className="h-[18px] w-[18px]" />}
                  required
                />
                {fieldErrors.fullName ? <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.fullName}</p> : null}
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-[#3f4742]">Username</label>
                <InputField
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (fieldErrors.username) setFieldError("username", validateUsername(event.target.value));
                  }}
                  onBlur={(event) => setFieldError("username", validateUsername(event.target.value))}
                  placeholder="Masukkan username"
                  icon={<UserIcon className="h-[18px] w-[18px]" />}
                  required
                />
                {fieldErrors.username ? <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.username}</p> : null}
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-[#3f4742]">Email</label>
                <InputField
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) setFieldError("email", validateEmail(event.target.value));
                  }}
                  onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
                  placeholder="nama@email.com"
                  icon={<UserIcon className="h-[18px] w-[18px]" />}
                  required
                />
                {fieldErrors.email ? <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.email}</p> : null}
              </div>
            </>
          ) : (
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#3f4742]">Email atau Username</label>
              <InputField
                value={emailOrUsername}
                onChange={(event) => {
                  setEmailOrUsername(event.target.value);
                  if (fieldErrors.login) setFieldError("login", validateLogin(event.target.value));
                }}
                onBlur={(event) => setFieldError("login", validateLogin(event.target.value))}
                placeholder="nama@email.com"
                icon={<UserIcon className="h-[18px] w-[18px]" />}
                required
              />
              {fieldErrors.login ? <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.login}</p> : null}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <label className="block text-sm font-semibold text-[#3f4742]">Password</label>
              {!isRegister ? (
                <Link href="/lupa-password" className="text-sm font-semibold text-shipin-deep hover:text-[#12572f]">
                  Lupa Password?
                </Link>
              ) : null}
            </div>
            <InputField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) setFieldError("password", validatePassword(event.target.value, isRegister));
                if (isRegister && fieldErrors.confirmPassword) {
                  setFieldError("confirmPassword", validateConfirmPassword(confirmPassword, event.target.value));
                }
              }}
              onBlur={(event) => setFieldError("password", validatePassword(event.target.value, isRegister))}
              placeholder="********"
              icon={<LockIcon className="h-[18px] w-[18px]" />}
              trailing={
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="grid place-items-center"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <EyeIcon className="h-[18px] w-[18px]" />
                  )}
                </button>
              }
              required
            />
            {fieldErrors.password ? <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.password}</p> : null}
          </div>

          {isRegister ? (
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#3f4742]">Konfirmasi Password</label>
              <InputField
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldError("confirmPassword", validateConfirmPassword(event.target.value, password));
                  }
                }}
                onBlur={(event) => setFieldError("confirmPassword", validateConfirmPassword(event.target.value, password))}
                placeholder="********"
                icon={<LockIcon className="h-[18px] w-[18px]" />}
                trailing={
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="grid place-items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-[18px] w-[18px]" />
                    ) : (
                      <EyeIcon className="h-[18px] w-[18px]" />
                    )}
                  </button>
                }
                required
              />
              {fieldErrors.confirmPassword ? (
                <p className="mt-2 text-sm text-[#b42318]">{fieldErrors.confirmPassword}</p>
              ) : null}
            </div>
          ) : null}

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#72786e]">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full border ${
                remember ? "border-shipin-deep bg-shipin-deep text-white" : "border-[#d8ddd3] bg-white"
              }`}
            >
              {remember ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="sr-only"
            />
            Ingat saya di perangkat ini
          </label>

          <PrimaryButton
            type="submit"
            className="mt-2 w-full text-base"
            icon={<ArrowRightIcon className="h-5 w-5" />}
            disabled={isSubmitting}
          >
            {isRegister ? "Daftar Sekarang" : "Masuk Sekarang"}
          </PrimaryButton>

          {error ? <p className="text-sm font-medium text-[#b42318]">{error}</p> : null}
          {notice ? <p className="text-sm font-medium text-[#1f7a44]">{notice}</p> : null}

          <p className="text-center text-sm text-[#72786e]">
            {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-shipin-deep hover:text-[#12572f]">
              {isRegister ? "Masuk Sekarang" : "Daftar Sekarang"}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
