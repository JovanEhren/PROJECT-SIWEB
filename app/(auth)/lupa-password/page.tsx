"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldErrors = {
  login?: string;
  newPassword?: string;
  confirmPassword?: string;
};

function validateLogin(value: string) {
  if (!value.trim()) return "Email atau username tidak boleh kosong";
  return "";
}

function validateNewPassword(value: string) {
  if (!value) return "Password baru tidak boleh kosong";
  if (value.length < 8) return "Password minimal 8 karakter";
  if (!/\d/.test(value)) return "Password harus mengandung angka";
  return "";
}

function validateConfirmPassword(value: string, sourcePassword: string) {
  if (!value) return "Konfirmasi password tidak boleh kosong";
  if (value !== sourcePassword) return "Password tidak cocok";
  return "";
}

export default function LupaPasswordPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"error" | "success">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function setFieldError<K extends keyof FieldErrors>(key: K, value: FieldErrors[K]) {
    setFieldErrors((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const nextErrors: FieldErrors = {
      login: validateLogin(login),
      newPassword: validateNewPassword(newPassword),
      confirmPassword: validateConfirmPassword(confirmPassword, newPassword)
    };

    setFieldErrors(nextErrors);
    if (nextErrors.login || nextErrors.newPassword || nextErrors.confirmPassword) {
      setTone("error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          newPassword,
          confirmPassword
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { field?: keyof FieldErrors; message?: string }
        | null;

      if (!response.ok) {
        if (data?.field && data?.message) {
          setFieldError(data.field, data.message);
        } else {
          setTone("error");
          setMessage(data?.message || "Terjadi kesalahan, silakan coba beberapa saat lagi");
        }
        return;
      }

      setTone("success");
      setMessage(data?.message || "Password berhasil diubah! Mengalihkan ke halaman login...");
      setFieldErrors({});
      setLogin("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setTone("error");
      setMessage("Terjadi kesalahan, silakan coba beberapa saat lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(175,244,170,0.22),transparent_42%),#f3f7f1] px-4">
      <div className="w-full max-w-[520px] rounded-[28px] border border-[#e3eadf] bg-white p-6 shadow-[0_24px_60px_rgba(95,128,101,0.22)] sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5f7c68]">Admin Recovery</p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-none text-[#1f3427] sm:text-[38px]">
          Lupa Password
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-[#59655d]">
          Atur ulang password akun admin yang tersimpan di database Neon.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2f4a3a]">
              Email atau Username
            </label>
            <input
              type="text"
              value={login}
              onChange={(event) => {
                setLogin(event.target.value);
                if (fieldErrors.login) setFieldError("login", validateLogin(event.target.value));
              }}
              onBlur={(event) => setFieldError("login", validateLogin(event.target.value))}
              placeholder="admin@email.com"
              className="h-11 w-full rounded-xl border border-[#dde4db] bg-[#fbfdf9] px-4 text-[14px] text-[#213730] outline-none"
            />
            {fieldErrors.login ? <p className="mt-2 text-[13px] font-medium text-[#b42318]">{fieldErrors.login}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2f4a3a]">
              Password Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                if (fieldErrors.newPassword) setFieldError("newPassword", validateNewPassword(event.target.value));
                if (fieldErrors.confirmPassword) {
                  setFieldError("confirmPassword", validateConfirmPassword(confirmPassword, event.target.value));
                }
              }}
              onBlur={(event) => setFieldError("newPassword", validateNewPassword(event.target.value))}
              placeholder="Minimal 8 karakter"
              className="h-11 w-full rounded-xl border border-[#dde4db] bg-[#fbfdf9] px-4 text-[14px] text-[#213730] outline-none"
            />
            {fieldErrors.newPassword ? <p className="mt-2 text-[13px] font-medium text-[#b42318]">{fieldErrors.newPassword}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2f4a3a]">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldError("confirmPassword", validateConfirmPassword(event.target.value, newPassword));
                }
              }}
              onBlur={(event) => setFieldError("confirmPassword", validateConfirmPassword(event.target.value, newPassword))}
              placeholder="Ulangi password baru"
              className="h-11 w-full rounded-xl border border-[#dde4db] bg-[#fbfdf9] px-4 text-[14px] text-[#213730] outline-none"
            />
            {fieldErrors.confirmPassword ? (
              <p className="mt-2 text-[13px] font-medium text-[#b42318]">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1a7332] px-7 text-[14px] font-semibold text-white"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>

        {message ? (
          <p className={`mt-3 text-[13px] font-medium ${tone === "success" ? "text-[#1f7a44]" : "text-[#b42318]"}`}>
            {message}
          </p>
        ) : null}

        <p className="mt-5 text-center text-[13px] text-[#607067]">
          <Link href="/login" className="font-semibold text-[#14663a] hover:text-[#0f4f2d]">
            Kembali ke login
          </Link>
        </p>
      </div>
    </main>
  );
}
