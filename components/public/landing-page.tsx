"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  StarIcon,
  WalletIcon,
  SearchIcon,
  ShieldIcon,
  CheckIcon,
  BoltIcon,
  GlobeIcon,
  DollarCheckIcon,
  HeadsetIcon,
  RocketIcon,
  BulbIcon,
  TruckIcon
} from "@/components/icons";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const features = [
  {
    title: "Cakupan Luas",
    description: "Jaringan distribusi yang kuat hingga ke tingkat kecamatan di seluruh Indonesia."
  },
  {
    title: "Tarif Instan",
    description: "Dapatkan perbandingan harga real-time tanpa biaya tersembunyi untuk efisiensi budget."
  },
  {
    title: "Dukungan 24/7",
    description: "Tim dukungan pelanggan profesional yang siap membantu Anda kapan saja tanpa libur."
  },
  {
    title: "Akurasi Cepat",
    description: "Sistem tracking presisi tinggi yang memastikan barang sampai tepat pada estimasi waktu."
  }
];

const tips = [
  "Gunakan kemasan yang pas dengan ukuran barang untuk menghindari biaya volume.",
  "Bandingkan tarif antar ekspedisi secara real-time untuk menemukan harga termurah.",
  "Manfaatkan layanan pick-up gratis untuk menghemat waktu dan biaya transportasi.",
  "Pilih asuransi yang tepat sesuai nilai barang agar pengiriman tetap ekonomis namun aman."
];

const reviews = [
  {
    name: "Claudio",
    role: "Pemilik UMKM Kuliner",
    quote:
      "SHIPIN GO membantu kami memantau semua kiriman tanpa drama. Tampilannya rapi dan sangat mudah dipahami."
  },
  {
    name: "Nadya",
    role: "Brand Fashion Lokal",
    quote:
      "Landing page publiknya informatif, sementara admin panelnya terasa fokus untuk operasional harian."
  },
  {
    name: "Rizal",
    role: "Supplier Peralatan",
    quote:
      "Transisi dari halaman publik ke dashboard admin terasa jelas. Cocok untuk tim kecil yang ingin serba praktis."
  }
];

export function LandingPage() {
  const router = useRouter();
  const [trackingResi, setTrackingResi] = useState("");

  function handleTrackFromLanding() {
    const keyword = trackingResi.toUpperCase().replace(/[^A-Z0-9-]/g, "").trim();
    if (!keyword) {
      router.push("/lacak-paket");
      return;
    }
    router.push(`/lacak-paket?resi=${encodeURIComponent(keyword)}`);
  }

  const featureIcons = [
    {
      icon: <GlobeIcon className="h-7 w-7" />,
      iconBg: "bg-[#ddf4db]",
      iconColor: "text-[#1d6a36]"
    },
    {
      icon: <DollarCheckIcon className="h-7 w-7" />,
      iconBg: "bg-[#d9f8cf]",
      iconColor: "text-[#1b7a37]"
    },
    {
      icon: <HeadsetIcon className="h-7 w-7" />,
      iconBg: "bg-[#def6d9]",
      iconColor: "text-[#2a7d38]"
    },
    {
      icon: <RocketIcon className="h-7 w-7" />,
      iconBg: "bg-[#f7f2c8]",
      iconColor: "text-[#2a7d38]"
    }
  ];

  return (
    <main>
      <ScrollReveal />
      <section
        id="beranda"
        className="shell grid gap-8 py-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-14 xl:gap-10"
      >
        <div className="reveal-on-scroll rounded-[30px] bg-hero-glow px-5 py-6 sm:rounded-[34px] sm:px-8 sm:py-8 lg:px-5 lg:py-8 xl:px-6 xl:py-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d6efd3] bg-[#effbea] px-3.5 py-2 text-[11px] font-semibold text-shipin-deep shadow-[0_8px_18px_rgba(179,219,168,0.16)] sm:px-4 sm:text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full bg-shipin-deep" />
            Revolusi Logistik Terpercaya
          </div>
          <h1 className="mt-7 max-w-[520px] text-[34px] font-extrabold leading-[0.88] tracking-[-0.065em] text-shipin-ink min-[390px]:text-[38px] sm:mt-10 sm:max-w-[560px] sm:text-[56px] lg:max-w-[560px] lg:text-[86px] xl:max-w-[600px] xl:text-[98px]">
            <span className="block whitespace-nowrap">Kirim barang</span>
            <span className="mt-2 block text-shipin-deep sm:mt-3">tanpa</span>
            <span className="-mt-1 block text-shipin-deep sm:-mt-2">drama.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[14px] leading-[1.7] text-[#666d68] min-[390px]:text-[15px] sm:mt-8 sm:max-w-[560px] sm:text-[19px] lg:max-w-[520px] lg:text-[20px]">
            Pengalaman pengiriman modern yang transparan, aman, dan tepat waktu untuk
            kebutuhan bisnis maupun individu Anda.
          </p>
          <div className="mt-7 flex max-w-[690px] flex-col gap-2.5 rounded-[24px] bg-white/94 p-2 shadow-[0_16px_34px_rgba(173,202,164,0.28)] sm:mt-10 sm:rounded-[30px] sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-1 items-center gap-2.5 rounded-full border border-[#eceee4] bg-white px-4 py-3 text-[13px] text-[#b0b6ab] min-[390px]:text-[14px] sm:px-6 sm:text-[15px]">
              <SearchIcon className="h-4 w-4 text-[#9fc4a0]" />
              <input
                value={trackingResi}
                onChange={(event) => setTrackingResi(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleTrackFromLanding();
                  }
                }}
                className="w-full bg-transparent text-[#38423e] outline-none placeholder:text-[#b0b6ab]"
                placeholder="Masukkan nomor resi Anda..."
              />
            </div>
            <PrimaryButton
              onClick={handleTrackFromLanding}
              className="h-[48px] min-w-[150px] px-5 text-[14px] sm:h-[52px] sm:min-w-[170px] sm:px-6 sm:text-[15px]"
            >
              Lacak Paket
            </PrimaryButton>
          </div>
          <div className="mt-3.5 flex items-start gap-2 text-[12px] leading-5 text-[#767b76] min-[390px]:text-[13px] min-[390px]:leading-6 sm:items-center sm:text-[14px]">
            <ShieldIcon className="h-3.5 w-3.5 text-[#7f857d]" />
            <span>Integrasi ke 50+ kurir global & domestik secara real-time.</span>
          </div>
        </div>

        <div className="reveal-on-scroll reveal-delay-1 relative overflow-hidden rounded-[34px] bg-[#dff2dd] p-5 shadow-soft sm:rounded-[38px] sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.82),_transparent_36%)]" />
          <div className="relative isolate h-full min-h-[320px] rounded-[30px] bg-[#ecf8e9] p-4 sm:min-h-[500px] sm:rounded-[34px] sm:p-5 lg:min-h-[640px]">
            <Image
              src="/images/landing-hero-photo.jpg"
              alt="Armada logistik SHIPIN GO"
              fill
              className="rounded-[28px] object-cover sm:rounded-[30px]"
              priority
            />
            <div className="anim-float absolute bottom-2 left-2 z-20 w-[198px] rounded-[24px] border border-white/85 bg-white p-4 shadow-[0_18px_36px_rgba(27,63,38,0.2)] backdrop-blur-[1px] min-[390px]:w-[215px] sm:bottom-5 sm:left-5 sm:w-[292px] sm:rounded-[28px] sm:p-7">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#86e882] text-shipin-ink sm:h-12 sm:w-12">
                  <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold leading-6 text-[#1f2a23] sm:text-[20px] sm:leading-6">
                    Cakupan
                    <br />
                    Nasional
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#4f5750] sm:mt-3 sm:text-[13px] sm:leading-6">
                    Menjangkau pelosok di 34 provinsi dengan efisiensi tingkat tinggi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-8 lg:py-12">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-shipin-deep/70">
            Kenapa harus SHIPIN GO?
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-shipin-ink sm:text-4xl">
            Solusi yang tetap ringan untuk publik, tapi kuat untuk admin.
          </h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`reveal-on-scroll hover-lift min-h-[252px] rounded-[28px] border border-[#e7ebdf] bg-[#f8faef] px-6 py-7 shadow-[0_12px_30px_rgba(194,206,175,0.16)] sm:min-h-[348px] sm:rounded-[36px] sm:px-10 sm:py-10 ${index === 1 ? "reveal-delay-1" : ""} ${index === 2 ? "reveal-delay-2" : ""} ${index === 3 ? "reveal-delay-3" : ""}`}
            >
              <div
                className={`mb-7 inline-flex h-14 w-14 items-center justify-center rounded-full ${featureIcons[index]?.iconBg} ${featureIcons[index]?.iconColor} sm:mb-9 sm:h-16 sm:w-16`}
              >
                {featureIcons[index]?.icon}
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.03em] text-[#2d352f] min-[390px]:text-[21px] sm:text-[24px]">
                {feature.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6] text-[#636a63] sm:mt-5 sm:text-[16px] sm:leading-[1.65]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="cek-ongkir" className="shell grid gap-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <article className="reveal-on-scroll hover-lift relative overflow-hidden rounded-[28px] border border-[#e1e9de] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf5_100%)] p-5 shadow-[0_22px_48px_rgba(95,126,99,0.14)] sm:p-7">
          <div className="absolute right-0 top-0 h-36 w-36 translate-x-10 -translate-y-10 rounded-full bg-[#dff7d8]/80" />
          <div className="absolute bottom-0 right-0 h-28 w-32 rounded-tl-[32px] bg-[#eef6eb]" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf6e8] text-shipin-deep">
                <WalletIcon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-[#cfe8d4] bg-[#f3fbf1] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1d7a45]">
                Real-time
              </span>
            </div>
            <div className="mt-8 max-w-[460px]">
              <h3 className="text-[30px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#222d27] sm:text-[42px]">
                Cek Ongkir Instan
              </h3>
              <p className="mt-3 text-[14px] leading-6 text-[#68736b] sm:text-[16px]">
                Bandingkan estimasi tarif cargo darat berdasarkan rute, berat, dan layanan sebelum membuat pengiriman.
              </p>
            </div>

            <div className="mt-7 rounded-[22px] border border-[#e0e8dd] bg-white p-4 shadow-[0_14px_28px_rgba(98,127,102,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8a948c]">Rute Contoh</p>
                  <p className="mt-1 text-[17px] font-extrabold text-[#24332a]">Jakarta Selatan - Surabaya</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-[#e9f8e6] px-3 py-1.5 text-[12px] font-bold text-[#1e7d42]">
                  2.5 kg
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] bg-[#f5f8f3] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a948c]">Reguler</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#24332a]">Rp 42rb</p>
                </div>
                <div className="rounded-[16px] bg-[#f5f8f3] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a948c]">Cepat</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#24332a]">Rp 65rb</p>
                </div>
                <div className="rounded-[16px] bg-[#f5f8f3] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a948c]">ETA</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#24332a]">1-3 hari</p>
                </div>
              </div>
            </div>
            <Link
              href="/cek-ongkir"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#176c3b] px-6 text-[14px] font-bold text-white shadow-[0_16px_28px_rgba(23,108,59,0.22)] hover:bg-[#12572f]"
            >
              Bandingkan Harga
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>
        </article>
        <article className="reveal-on-scroll reveal-delay-1 hover-lift relative overflow-hidden rounded-[28px] border border-[#d6ead0] bg-[linear-gradient(135deg,#f2fdeb_0%,#e7f8dd_52%,#f8fff4_100%)] p-5 shadow-[0_22px_48px_rgba(126,164,112,0.16)] sm:p-7">
          <div className="absolute -bottom-8 -right-8 text-[#cfeac8]/80">
            <TruckIcon className="h-32 w-32 stroke-[1.1] sm:h-44 sm:w-44" />
          </div>
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f3d1] text-shipin-deep shadow-[0_12px_24px_rgba(151,205,141,0.18)]">
                  <BulbIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-[25px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#26312b] sm:text-[36px]">
                  Tips Menghemat Ongkir
                </h3>
              </div>
              <div className="rounded-2xl border border-[#cae8c3] bg-white/55 px-4 py-3 text-[12px] font-semibold leading-5 text-[#3f6c4a] backdrop-blur">
                Cocok untuk pengiriman rutin UMKM dan cargo darat antarkota.
              </div>
            </div>
          </div>
          <ul className="relative mt-6 grid gap-3">
            {tips.map((tip) => (
              <li
                key={tip}
                className="flex gap-3 rounded-[18px] border border-white/70 bg-white/58 px-4 py-3 text-[14px] leading-[1.55] text-[#536058] shadow-[0_10px_22px_rgba(113,150,104,0.07)] backdrop-blur sm:text-[16px]"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#7ac47b] bg-[#f7fff5] text-shipin-deep">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section id="ulasan" className="shell py-8 lg:py-12">
        <div className="shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-shipin-deep">
                Ulasan
              </p>
              <h2 className="mt-4 text-3xl font-bold text-shipin-ink">
                Dipercaya bisnis yang butuh operasional ringkas.
              </h2>
            </div>
            <Link href="/admin/login" className="text-sm font-semibold text-shipin-deep hover:text-[#12572f]">
              Masuk ke admin untuk mengelola ulasan
            </Link>
          </div>
          <div className="mt-8 overflow-hidden" style={{ paddingBottom: "4px" }}>
            <div className="marquee-track-wrapper group cursor-pointer">
              <div className="marquee-track flex w-max" style={{ animation: "marquee 25s linear infinite" }}>
                {[...reviews, ...reviews].map((review, index) => (
                  <article
                    key={`${review.name}-${index}`}
                    className="mx-0 w-[340px] shrink-0 rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                    style={{ marginRight: "24px" }}
                  >
                    <div className="flex items-center gap-1 text-[#f5b700]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 italic text-[#4a4a4a]">"{review.quote}"</p>
                    <div className="mt-6">
                      <p className="font-bold text-shipin-ink">{review.name}</p>
                      <p className="text-sm text-[#888888]">{review.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell grid gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <div className="space-y-5">
          <h2 className="max-w-[430px] text-[32px] font-extrabold leading-[0.98] tracking-[-0.05em] text-shipin-ink min-[390px]:text-[34px] sm:text-[56px] lg:text-[64px]">
            <span className="block">Keunggulan</span>
            <span className="block">Layanan</span>
            <span className="mt-2 block text-shipin-deep sm:mt-3">Eksklusif SHIPIN</span>
            <span className="block text-shipin-deep">GO</span>
          </h2>
          <p className="max-w-[440px] text-[14px] leading-7 text-shipin-text min-[390px]:text-[15px] sm:text-[16px] sm:leading-8">
            Kami tidak hanya mengirimkan barang, kami memberikan ketenangan pikiran
            bagi setiap pelanggan kami.
          </p>
          <div className="space-y-8 pt-2">
            <div className="flex items-start gap-7">
              <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-[#93f089] text-[#176a3a] shadow-[0_14px_28px_rgba(147,240,137,0.22)] sm:h-[74px] sm:w-[74px] sm:rounded-[24px]">
                <ShieldIcon className="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
              <div className="pt-1">
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-shipin-ink min-[390px]:text-[19px] sm:text-[24px]">
                  Asuransi All-Risk
                </h3>
                <p className="mt-2 max-w-[470px] text-[14px] leading-7 text-shipin-text min-[390px]:text-[15px] sm:text-[16px] sm:leading-8">
                  Keamanan adalah prioritas utama. Setiap pengiriman otomatis dilindungi
                  asuransi premium tanpa proses klaim yang rumit.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-7">
              <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-[#93f089] text-[#176a3a] shadow-[0_14px_28px_rgba(147,240,137,0.22)] sm:h-[74px] sm:w-[74px] sm:rounded-[24px]">
                <BoltIcon className="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
              <div className="pt-1">
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-shipin-ink min-[390px]:text-[19px] sm:text-[24px]">
                  Layanan Same-Day
                </h3>
                <p className="mt-2 max-w-[470px] text-[14px] leading-7 text-shipin-text min-[390px]:text-[15px] sm:text-[16px] sm:leading-8">
                  Pengiriman antar kota besar di Indonesia dengan jaminan sampai di hari
                  yang sama atau maksimal 24 jam.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="reveal-on-scroll reveal-delay-2 hover-lift relative min-h-[460px] overflow-hidden rounded-[34px] shadow-soft lg:min-h-[620px]">
          <Image
            src="/images/enterprise-courier.jpg"
            alt="Kurir SHIPIN GO sedang menangani paket"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d4426]/20 via-[#0d4426]/42 to-[#0b1f15]/86" />
          <div className="absolute inset-0 flex flex-col justify-end p-7 text-white sm:p-9">
            <div className="mb-4 inline-flex w-fit rounded-full bg-[#1d8a42] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/95 sm:mb-6">
              Enterprise Solution
            </div>
            <p className="max-w-[380px] text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
              Logistik Khusus Untuk Bisnis &amp; UMKM
            </p>
            <p className="mt-4 max-w-[420px] text-[15px] leading-7 text-white/85 sm:text-[17px]">
              Optimalkan rantai pasok bisnis Anda dengan dashboard terpadu dan armada dedicated.
            </p>
            <div className="mt-7 inline-flex w-fit rounded-full bg-white px-7 py-3 text-[15px] font-bold text-[#1b7a37] sm:mt-9 sm:px-10 sm:py-4 sm:text-[18px]">
              Jadwalkan Demo
            </div>
          </div>
        </div>
      </section>

      <footer id="kontak" className="mt-10 bg-white/85">
        <div className="shell py-12">
          <div className="grid gap-10 border-b border-[#e8ebe4] pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
            <div>
              <p className="text-[18px] font-extrabold tracking-[-0.03em] text-shipin-deep">SHIPIN GO</p>
              <p className="mt-5 max-w-[360px] text-[15px] leading-8 text-shipin-text">
                Solusi logistik terdepan di Indonesia. Menghubungkan orang dan bisnis
                melalui sistem pengiriman yang cerdas dan efisien.
              </p>
            </div>
            <div>
              <p className="text-[15px] font-bold text-shipin-ink">Perusahaan</p>
              <ul className="mt-5 space-y-4 text-[15px] text-shipin-text">
                <li>Tentang Kami</li>
                <li>Karir</li>
                <li>Kontak</li>
              </ul>
            </div>
            <div>
              <p className="text-[15px] font-bold text-shipin-ink">Dukungan</p>
              <ul className="mt-5 space-y-4 text-[15px] text-shipin-text">
                <li>Pusat Bantuan</li>
                <li>Syarat &amp; Ketentuan</li>
                <li>Kebijakan Privasi</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-7 text-[14px] text-shipin-text sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 SHIPIN GO. Hak Cipta Dilindungi.</p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                Instagram
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                LinkedIn
              </a>
              <a href="https://x.com/" target="_blank" rel="noreferrer" className="hover:text-shipin-deep">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}


