"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  ChatBubbleIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon
} from "@/components/icons";
import { PublicFooter } from "@/components/public/footer";
import { PublicToast } from "@/components/ui/public-toast";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { OFFICE_PARTNERS } from "@/lib/shipping-pricing";

const TrackingMap = dynamic(
  () => import("@/components/public/tracking-map").then((mod) => mod.TrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full bg-[linear-gradient(135deg,#4f8f86,#6aab9f)]" />
    )
  }
);

const contactCards = [
  {
    title: "WhatsApp",
    description: "Chat cepat untuk cek status paket.",
    value: "+6281353823867",
    href: "https://wa.me/6281353823867",
    icon: ChatBubbleIcon
  },
  {
    title: "Call Center",
    description: "Layanan suara tersedia 24/7.",
    value: "021-500-SHIP",
    icon: PhoneIcon
  },
  {
    title: "Email",
    description: "Tim siap merespons di hari kerja.",
    value: "shipingo@gmail.com",
    href: "mailto:shipingo@gmail.com",
    icon: MailIcon
  }
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function KontakPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Pengiriman Domestik");
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState("");

  function validateName(value: string) {
    if (!value.trim()) return "Nama tidak boleh kosong";
    return "";
  }

  function validateEmail(value: string) {
    const normalized = value.trim();
    if (!normalized) return "Email tidak boleh kosong";
    if (!EMAIL_PATTERN.test(normalized)) return "Format email tidak valid";
    return "";
  }

  function validateMessage(value: string) {
    if (!value.trim()) return "Pesan tidak boleh kosong";
    return "";
  }

  function setFieldError(key: string, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit() {
    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      message: validateMessage(message)
    };

    setFieldErrors(nextErrors);
    setIsSent(false);

    if (nextErrors.name || nextErrors.email || nextErrors.message) {
      return;
    }

    try {
      void subject;
      setIsSent(true);
      setToastMessage("");
      setName("");
      setEmail("");
      setMessage("");
      setFieldErrors({});
    } catch {
      setToastMessage("Gagal mengirim pesan, silakan coba lagi");
    }
  }

  return (
    <main>
      <ScrollReveal />
      <section className="shell py-10 lg:py-14">
        <div className="mx-auto max-w-[1020px]">
          <div className="reveal-on-scroll max-w-[620px]">
            <h1 className="text-[38px] font-extrabold tracking-[-0.04em] text-[#1f2622] sm:text-[52px]">
              Hubungi Kami
            </h1>
            <p className="mt-2 text-[14px] leading-7 text-[#6d746e] sm:text-[16px]">
              Tim dukungan kami siap membantu kebutuhan logistik Anda. Hubungi kami melalui kanal
              yang tersedia atau kirim pertanyaan langsung lewat formulir.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.56fr_1fr]">
            <div className="space-y-4">
              {contactCards.map((item, index) => (
                <article
                  key={item.title}
                  className={`reveal-on-scroll hover-lift rounded-[20px] border border-[#e3e8e2] bg-[#f8faf7] p-5 shadow-[0_12px_30px_rgba(173,183,168,0.14)] ${
                    index === 1 ? "reveal-delay-1" : ""
                  } ${index === 2 ? "reveal-delay-2" : ""}`}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#d5f4d5] text-[#1b8248]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-[#26322b]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#6f786f]">{item.description}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="mt-4 inline-block text-[14px] font-semibold text-[#1b8248] hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-4 text-[14px] font-semibold text-[#1b8248]">{item.value}</p>
                  )}
                </article>
              ))}
            </div>

            <article className="reveal-on-scroll reveal-delay-1 rounded-[24px] border border-[#e3e8e2] bg-[#f8faf7] p-6 shadow-[0_18px_36px_rgba(173,183,168,0.16)] sm:p-7">
              <h2 className="text-[30px] font-extrabold tracking-[-0.03em] text-[#2a312d]">
                Kirim Pesan
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4a534d]">
                    Nama Lengkap
                  </label>
                  <input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (fieldErrors.name) setFieldError("name", validateName(event.target.value));
                    }}
                    onBlur={(event) => setFieldError("name", validateName(event.target.value))}
                    className="mt-2 h-11 w-full rounded-full border border-[#e2e8e1] bg-[#f1f4ef] px-4 text-[14px] text-[#38433c] outline-none"
                    placeholder="Masukkan nama Anda"
                  />
                  {fieldErrors.name ? <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.name}</p> : null}
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4a534d]">
                    Alamat Email
                  </label>
                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (fieldErrors.email) setFieldError("email", validateEmail(event.target.value));
                    }}
                    onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
                    className="mt-2 h-11 w-full rounded-full border border-[#e2e8e1] bg-[#f1f4ef] px-4 text-[14px] text-[#38433c] outline-none"
                    placeholder="email@perusahaan.com"
                  />
                  {fieldErrors.email ? <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.email}</p> : null}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4a534d]">
                  Subjek Layanan
                </label>
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 h-11 w-full rounded-full border border-[#e2e8e1] bg-[#f1f4ef] px-4 text-[14px] text-[#38433c] outline-none"
                >
                  <option>Pengiriman Domestik</option>
                  <option>Layanan Express</option>
                  <option>Klaim & Refund</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4a534d]">
                  Pesan
                </label>
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    if (fieldErrors.message) setFieldError("message", validateMessage(event.target.value));
                  }}
                  onBlur={(event) => setFieldError("message", validateMessage(event.target.value))}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-[14px] border border-[#e2e8e1] bg-[#f1f4ef] px-4 py-3 text-[14px] text-[#38433c] outline-none"
                  placeholder="Ada yang bisa kami bantu?"
                />
                {fieldErrors.message ? <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.message}</p> : null}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#168049] to-[#12a662] px-6 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(21,143,82,0.3)]"
              >
                Kirim Pertanyaan
              </button>
              {isSent ? (
                <p className="mt-3 text-[12px] font-semibold text-[#1b8248]">Pesan Anda berhasil dikirim!</p>
              ) : null}
            </article>
          </div>

          <div className="mt-6 grid gap-5 lg:items-start lg:grid-cols-[1fr_0.46fr]">
            <article className="reveal-on-scroll hover-lift relative self-start overflow-hidden rounded-[24px] border border-[#e2e7e1] bg-[#4f8f86] p-4 shadow-[0_18px_34px_rgba(114,148,138,0.22)]">
              <div className="relative overflow-hidden rounded-[18px] border border-white/40">
                <TrackingMap
                  latest={{
                    lat: -6.2088,
                    lng: 106.8456,
                    label: "SHIPIN GO HQ - Sudirman, Jakarta"
                  }}
                  heightClassName="h-[320px] sm:h-[380px] lg:h-[520px]"
                  zoom={13}
                  scrollWheelZoom={false}
                />
              </div>
            </article>

            <article className="reveal-on-scroll reveal-delay-1 rounded-[24px] border border-[#e3e8e2] bg-[#f8faf7] p-6 shadow-[0_18px_36px_rgba(173,183,168,0.16)]">
              <h3 className="text-[27px] font-extrabold tracking-[-0.03em] text-[#2b332e]">Lokasi Kantor</h3>
              <div className="mt-4 space-y-4 text-[13px] leading-6 text-[#5c665f]">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 h-4 w-4 text-[#1b8248]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#405047]">
                      Alamat Utama
                    </p>
                    <p>Jl. Jend. Sudirman Kav 52-53, Jakarta 12190</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 h-4 w-4 text-[#1b8248]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#405047]">
                      Jam Operasional
                    </p>
                    <p>Senin - Jumat: 08:00 - 18:00</p>
                    <p>Sabtu: 09:00 - 15:00</p>
                    <p>Minggu / Libur: Tutup</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-[#e2e7e1] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#405047]">
                    Mitra Kantor
                  </p>
                  <span className="rounded-full bg-[#e8f5e7] px-2.5 py-1 text-[10px] font-bold text-[#2f6f43]">
                    {OFFICE_PARTNERS.length} Lokasi
                  </span>
                </div>
                <ul className="mt-2 grid max-h-[230px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {OFFICE_PARTNERS.map((partner) => (
                    <li key={partner.name} className="rounded-[10px] border border-[#e6ece6] bg-white px-3 py-2">
                      <p className="text-[12px] font-bold text-[#294033]">{partner.name}</p>
                      <p className="text-[11px] text-[#5d6d61]">
                        {partner.area} | {partner.address}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <PublicFooter />
      {toastMessage ? <PublicToast message={toastMessage} /> : null}
    </main>
  );
}
