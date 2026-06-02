"use client";

import { useMemo, useState } from "react";

import { BoltIcon, PackageIcon, SearchIcon, TruckIcon } from "@/components/icons";
import { PublicFooter } from "@/components/public/footer";
import { PublicToast } from "@/components/ui/public-toast";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AREA_TREE, estimateShippingCost } from "@/lib/shipping-pricing";

type ServiceType = "express" | "reguler" | "hemat";

type ShippingService = {
  key: ServiceType;
  name: string;
  description: string;
  eta: string;
  feature: string;
  multiplier: number;
  icon: "bolt" | "truck" | "package";
};

const shippingOptions: ShippingService[] = [
  {
    key: "express",
    name: "Layanan Express",
    description: "Pengiriman kilat untuk kebutuhan mendesak.",
    eta: "1 Hari",
    feature: "Prioritas Penuh",
    multiplier: 1.55,
    icon: "bolt"
  },
  {
    key: "reguler",
    name: "Layanan Reguler",
    description: "Keseimbangan terbaik antara harga dan kecepatan.",
    eta: "2-3 Hari",
    feature: "Free Tracking",
    multiplier: 1,
    icon: "truck"
  },
  {
    key: "hemat",
    name: "Layanan Hemat",
    description: "Solusi ekonomis untuk pengiriman santai.",
    eta: "4-7 Hari",
    feature: "Drop-off Only",
    multiplier: 0.72,
    icon: "package"
  }
];

function formatRupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function CekOngkirPage() {
  const [originProvince, setOriginProvince] = useState(AREA_TREE[0]?.province || "");
  const [originCity, setOriginCity] = useState(AREA_TREE[0]?.cities[0]?.city || "");
  const [destinationProvince, setDestinationProvince] = useState(AREA_TREE[0]?.province || "");
  const [destinationCity, setDestinationCity] = useState(AREA_TREE[0]?.cities[0]?.city || "");
  const [weight, setWeight] = useState("2.5");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [originDetail, setOriginDetail] = useState("");
  const [destinationDetail, setDestinationDetail] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState("");

  const numericWeight = Number(weight || 0);
  const hasCoreData =
    originProvince.trim() &&
    originCity.trim() &&
    destinationProvince.trim() &&
    destinationCity.trim() &&
    originDetail.trim() &&
    destinationDetail.trim() &&
    numericWeight > 0;

  const originProvinceNode =
    AREA_TREE.find((item) => item.province === originProvince) || AREA_TREE[0];
  const destinationProvinceNode =
    AREA_TREE.find((item) => item.province === destinationProvince) || AREA_TREE[0];
  const originCities = originProvinceNode?.cities || [];
  const destinationCities = destinationProvinceNode?.cities || [];

  const pricedOptions = useMemo(
    () =>
      shippingOptions.map((option) => {
        const mappedService = option.key === "express" ? "EKSPRES" : option.key === "hemat" ? "HEMAT" : "REGULER";
        const shipping = estimateShippingCost({
          originCity,
          destinationCity,
          originProvince,
          destinationProvince,
          weightKg: numericWeight || 1,
          lengthCm: Number(length || 0),
          widthCm: Number(width || 0),
          heightCm: Number(height || 0),
          service: mappedService
        });
        const serviceFee = shipping.serviceFee;
        return {
          ...option,
          distanceKm: shipping.distanceKm,
          billableWeight: shipping.billableWeight,
          price: shipping.total,
          detailBaseCost: shipping.baseCost,
          detailServiceFee: serviceFee
        };
      }),
    [
      destinationCity,
      destinationProvince,
      height,
      length,
      numericWeight,
      originCity,
      originProvince,
      width
    ]
  );

  const selectedOption = pricedOptions.find((item) => item.key === selectedService) ?? null;

  function validateOriginCity(value: string) {
    if (!value.trim()) return "Kota asal tidak boleh kosong";
    return "";
  }

  function validateDestinationCity(value: string) {
    if (!value.trim()) return "Kota tujuan tidak boleh kosong";
    return "";
  }

  function validateWeight(value: string) {
    if (!value.trim()) return "Berat paket tidak boleh kosong";
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "Berat harus berupa angka";
    if (numeric <= 0) return "Berat harus lebih dari 0";
    return "";
  }

  function validateRequired(value: string, messageText: string) {
    if (!value.trim()) return messageText;
    return "";
  }

  function setFieldError(key: string, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleCalculate() {
    const nextErrors = {
      originCity: validateOriginCity(originCity),
      destinationCity: validateDestinationCity(destinationCity),
      originDetail: validateRequired(originDetail, "Alamat detail asal tidak boleh kosong"),
      destinationDetail: validateRequired(destinationDetail, "Alamat detail tujuan tidak boleh kosong"),
      weight: validateWeight(weight)
    };

    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !hasCoreData) {
      setCalculated(false);
      setSelectedService(null);
      setMessage("");
      return;
    }

    try {
      setCalculated(true);
      setSelectedService("reguler");
      setToastMessage("");
      setMessage("Estimasi ongkir berhasil dihitung. Silakan pilih layanan.");
    } catch {
      setCalculated(false);
      setSelectedService(null);
      setMessage("");
      setToastMessage("Gagal menghitung ongkir, silakan coba lagi");
    }
  }

  return (
    <main>
      <ScrollReveal />
      <section className="shell py-10 lg:py-14">
        <div className="mx-auto max-w-[760px] text-center reveal-on-scroll">
          <h1 className="text-[33px] font-extrabold tracking-[-0.04em] text-[#1f2622] sm:text-[60px]">
            Estimasi Biaya Pengiriman
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[#6d746e] sm:text-[16px] sm:leading-7">
            Hitung biaya pengiriman paket Anda dengan akurat. Masukkan detail pengiriman
            untuk melihat layanan terbaik kami.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="reveal-on-scroll hover-lift rounded-[26px] border border-[#e4e8e2] bg-[#f9faf8] p-5 shadow-[0_18px_36px_rgba(173,183,168,0.18)] sm:rounded-[30px] sm:p-6">
            <div className="flex items-center gap-2 text-[#2d3330]">
              <PackageIcon className="h-4 w-4" />
              <h2 className="text-[18px] font-bold">Detail Paket</h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                    Provinsi Asal
                  </p>
                  <select
                    value={originProvince}
                    onChange={(event) => {
                      const nextProvince = event.target.value;
                      const nextProvinceNode =
                        AREA_TREE.find((item) => item.province === nextProvince) || AREA_TREE[0];
                      setOriginProvince(nextProvince);
                      setOriginCity(nextProvinceNode?.cities[0]?.city || "");
                    }}
                    className="mt-2 h-[46px] w-full rounded-[10px] border border-[#e5e9e2] bg-[#f1f3ef] px-4 text-[13px] text-[#3f4a43] outline-none"
                  >
                    {AREA_TREE.map((item) => (
                      <option key={item.province} value={item.province}>
                        {item.province}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                    Kota/Kab Asal
                  </p>
                  <SearchableSelect
                    value={originCity}
                    options={originCities.map((item) => item.city)}
                    className="mt-0"
                    onChange={(value) => {
                      setOriginCity(value);
                      if (fieldErrors.originCity) setFieldError("originCity", validateOriginCity(value));
                    }}
                  />
                  {fieldErrors.originCity ? (
                    <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.originCity}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                    Provinsi Tujuan
                  </p>
                  <select
                    value={destinationProvince}
                    onChange={(event) => {
                      const nextProvince = event.target.value;
                      const nextProvinceNode =
                        AREA_TREE.find((item) => item.province === nextProvince) || AREA_TREE[0];
                      setDestinationProvince(nextProvince);
                      setDestinationCity(nextProvinceNode?.cities[0]?.city || "");
                    }}
                    className="mt-2 h-[46px] w-full rounded-[10px] border border-[#e5e9e2] bg-[#f1f3ef] px-4 text-[13px] text-[#3f4a43] outline-none"
                  >
                    {AREA_TREE.map((item) => (
                      <option key={item.province} value={item.province}>
                        {item.province}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                    Kota/Kab Tujuan
                  </p>
                  <SearchableSelect
                    value={destinationCity}
                    options={destinationCities.map((item) => item.city)}
                    className="mt-0"
                    onChange={(value) => {
                      setDestinationCity(value);
                      if (fieldErrors.destinationCity) {
                        setFieldError("destinationCity", validateDestinationCity(value));
                      }
                    }}
                  />
                  {fieldErrors.destinationCity ? (
                    <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.destinationCity}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                  Alamat Detail Asal
                </p>
                <textarea
                  value={originDetail}
                  onChange={(event) => {
                    setOriginDetail(event.target.value);
                    if (fieldErrors.originDetail) {
                      setFieldError("originDetail", validateRequired(event.target.value, "Alamat detail asal tidak boleh kosong"));
                    }
                  }}
                  onBlur={(event) => setFieldError("originDetail", validateRequired(event.target.value, "Alamat detail asal tidak boleh kosong"))}
                  className="mt-2 h-[62px] w-full resize-none rounded-[10px] border border-[#e5e9e2] bg-[#f1f3ef] px-4 py-2 text-[13px] text-[#3f4a43] outline-none"
                  placeholder="Jalan, nomor, RT/RW, patokan"
                />
                {fieldErrors.originDetail ? (
                  <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.originDetail}</p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                  Alamat Detail Tujuan
                </p>
                <textarea
                  value={destinationDetail}
                  onChange={(event) => {
                    setDestinationDetail(event.target.value);
                    if (fieldErrors.destinationDetail) {
                      setFieldError("destinationDetail", validateRequired(event.target.value, "Alamat detail tujuan tidak boleh kosong"));
                    }
                  }}
                  onBlur={(event) =>
                    setFieldError("destinationDetail", validateRequired(event.target.value, "Alamat detail tujuan tidak boleh kosong"))
                  }
                  className="mt-2 h-[62px] w-full resize-none rounded-[10px] border border-[#e5e9e2] bg-[#f1f3ef] px-4 py-2 text-[13px] text-[#3f4a43] outline-none"
                  placeholder="Jalan, nomor, RT/RW, patokan"
                />
                {fieldErrors.destinationDetail ? (
                  <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.destinationDetail}</p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                  Berat (kg)
                </p>
                <input
                  value={weight}
                  onChange={(event) => {
                    setWeight(event.target.value);
                    if (fieldErrors.weight) setFieldError("weight", validateWeight(event.target.value));
                  }}
                  onBlur={(event) => setFieldError("weight", validateWeight(event.target.value))}
                  className="mt-2 h-[46px] w-full rounded-[10px] border border-[#e5e9e2] bg-[#f1f3ef] px-4 text-[13px] text-[#3f4a43] outline-none"
                  placeholder="2.50"
                />
                {fieldErrors.weight ? (
                  <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.weight}</p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#4c534e]">
                  Dimensi Paket (cm)
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={length}
                    onChange={(event) => setLength(event.target.value)}
                    className="w-full rounded-[14px] border border-[#d9dfd7] bg-white px-3 py-2 text-[13px] text-[#27352d] placeholder:text-[#9ca59e] focus:outline-none"
                    placeholder="Panjang"
                  />
                  <input
                    type="number"
                    min="0"
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                    className="w-full rounded-[14px] border border-[#d9dfd7] bg-white px-3 py-2 text-[13px] text-[#27352d] placeholder:text-[#9ca59e] focus:outline-none"
                    placeholder="Lebar"
                  />
                  <input
                    type="number"
                    min="0"
                    value={height}
                    onChange={(event) => setHeight(event.target.value)}
                    className="w-full rounded-[14px] border border-[#d9dfd7] bg-white px-3 py-2 text-[13px] text-[#27352d] placeholder:text-[#9ca59e] focus:outline-none"
                    placeholder="Tinggi"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#168049] to-[#12a662] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(21,143,82,0.3)]"
            >
              <SearchIcon className="h-4 w-4" />
              Cek Harga Sekarang
            </button>

            {message ? (
              <p className={`mt-3 text-[12px] font-medium ${calculated ? "text-[#1b8248]" : "text-[#bf3b3b]"}`}>
                {message}
              </p>
            ) : null}
          </article>

          <article className="reveal-on-scroll reveal-delay-1 hover-lift rounded-[26px] border border-[#e4e8e2] bg-[#f9faf8] p-5 shadow-[0_18px_36px_rgba(173,183,168,0.18)] sm:rounded-[30px] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[19px] font-bold text-[#2a312d] sm:text-[22px]">
                Opsi Pengiriman Tersedia
              </h2>
              <p className="text-[11px] text-[#8a918b]">Ditemukan {shippingOptions.length} Layanan</p>
            </div>

            <div className="space-y-3">
              {pricedOptions.map((option) => (
                <div
                  key={option.name}
                  className={`rounded-[16px] border px-4 py-4 ${
                    selectedService === option.key
                      ? "border-[#b9e8c5] bg-[#f3fcf4]"
                      : "border-[#e6e9e4] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef7ee] text-[#1d8046]">
                        {option.icon === "bolt" ? (
                          <BoltIcon className="h-4 w-4" />
                        ) : option.icon === "truck" ? (
                          <TruckIcon className="h-4 w-4" />
                        ) : (
                          <PackageIcon className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <p className="text-[15px] font-bold text-[#2b312d]">{option.name}</p>
                        <p className="mt-0.5 text-[12px] text-[#737a74]">{option.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#5f665f]">
                          <span className="rounded-full bg-[#f1f4ef] px-2 py-1">{option.eta}</span>
                          <span className="rounded-full bg-[#f1f4ef] px-2 py-1">{option.feature}</span>
                          <span className="rounded-full bg-[#f1f4ef] px-2 py-1">{option.distanceKm} km</span>
                          <span className="rounded-full bg-[#f1f4ef] px-2 py-1">{option.billableWeight} kg tagih</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[29px] font-extrabold leading-none tracking-[-0.03em] text-[#1f5e3c]">
                        {calculated ? formatRupiah(option.price) : "-"}
                      </p>
                      <button
                        type="button"
                        disabled={!calculated}
                        onClick={() => setSelectedService(option.key)}
                        className="mt-2 text-[11px] font-bold uppercase tracking-[0.07em] text-[#1b8751] disabled:opacity-45"
                      >
                        Pilih Layanan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[14px] border border-[#d8efd8] bg-[#f2fbf2] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#2e7043]">
                Informasi Penting
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#607065]">
                Harga di atas adalah estimasi. Biaya bisa berubah tergantung asuransi tambahan,
                packing kayu, atau penjemputan di luar area.
              </p>
              {selectedOption ? (
                <p className="mt-2 text-[12px] font-semibold text-[#256d3f]">
                  Layanan dipilih: {selectedOption.name} | Dasar: {formatRupiah(selectedOption.detailBaseCost)} |
                  Layanan: {formatRupiah(selectedOption.detailServiceFee)} | Total: {formatRupiah(selectedOption.price)}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      <PublicFooter />
      {toastMessage ? <PublicToast message={toastMessage} /> : null}
    </main>
  );
}
