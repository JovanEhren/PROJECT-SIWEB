"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PrinterIcon, ShieldIcon } from "@/components/icons";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createShipmentInDatabase, fetchVehiclesFromDatabase, ServiceType, VehicleOption } from "@/lib/admin-shipments";
import { AREA_TREE, estimateShippingCost, formatFullAddress, resolveAreaCoordinate } from "@/lib/shipping-pricing";
import { getDemoTrackingDurationMs } from "@/lib/tracking-config";

const serviceOptions = [
  {
    id: "reguler" as const,
    title: "Reguler (2-3 Hari)",
    subtitle: "Keseimbangan antara harga & kecepatan",
    recommended: true
  },
  {
    id: "ekspres" as const,
    title: "Ekspres (Besok Sampai)",
    subtitle: "Prioritas utama untuk paket mendesak",
    recommended: false
  }
];

const DRAFT_STORAGE_KEY = "shipin_admin_kirim_paket_draft";

type ShipmentFieldErrorKey =
  | "senderName"
  | "senderPhone"
  | "senderAddressDetail"
  | "receiverName"
  | "receiverPhone"
  | "receiverAddressDetail"
  | "itemName"
  | "itemCategory"
  | "vehicleId"
  | "weightKg"
  | "dimP"
  | "dimL"
  | "dimT";

function isValidPhoneNumber(value: string) {
  const normalized = value.replace(/[\s()-]/g, "");
  return /^(\+62|62|0)\d{8,13}$/.test(normalized);
}

function isNumericField(value: string) {
  if (!value.trim()) return false;
  return Number.isFinite(Number(value));
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-[#eef2ee] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] rounded-[28px] bg-white p-6 text-[13px] font-semibold text-[#5f6d63]">
        Memuat formulir pengiriman...
      </div>
    </main>
  );
}

function AdminKirimPaketContent() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<"reguler" | "ekspres">("reguler");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderProvince, setSenderProvince] = useState(AREA_TREE[0]?.province || "");
  const [senderCity, setSenderCity] = useState(AREA_TREE[0]?.cities[0]?.city || "");
  const [senderDistrict, setSenderDistrict] = useState(AREA_TREE[0]?.cities[0]?.districts[0] || "");
  const [senderSubdistrict, setSenderSubdistrict] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderAddressDetail, setSenderAddressDetail] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverProvince, setReceiverProvince] = useState(AREA_TREE[0]?.province || "");
  const [receiverCity, setReceiverCity] = useState(AREA_TREE[0]?.cities[0]?.city || "");
  const [receiverDistrict, setReceiverDistrict] = useState(AREA_TREE[0]?.cities[0]?.districts[0] || "");
  const [receiverSubdistrict, setReceiverSubdistrict] = useState("");
  const [receiverPostalCode, setReceiverPostalCode] = useState("");
  const [receiverAddressDetail, setReceiverAddressDetail] = useState("");
  const [weightKg, setWeightKg] = useState("2");
  const [dimP, setDimP] = useState("");
  const [dimL, setDimL] = useState("");
  const [dimT, setDimT] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [deliveryType, setDeliveryType] = useState<"BIASA" | "CEPAT" | "VVIP">("BIASA");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"error" | "success">("error");
  const [senderError, setSenderError] = useState("");
  const [receiverError, setReceiverError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ShipmentFieldErrorKey, string>>>({});
  const [draftInfo, setDraftInfo] = useState("");
  const [guideInfo, setGuideInfo] = useState("");
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [paidShipmentId, setPaidShipmentId] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);

  const weight = Number(weightKg) > 0 ? Number(weightKg) : 1;
  const lengthCm = Number(dimP) > 0 ? Number(dimP) : 0;
  const widthCm = Number(dimL) > 0 ? Number(dimL) : 0;
  const heightCm = Number(dimT) > 0 ? Number(dimT) : 0;

  const senderAddress = formatFullAddress({
    detail: senderAddressDetail,
    subdistrict: senderSubdistrict,
    district: senderDistrict,
    city: senderCity,
    province: senderProvince,
    postalCode: senderPostalCode
  });
  const receiverAddress = formatFullAddress({
    detail: receiverAddressDetail,
    subdistrict: receiverSubdistrict,
    district: receiverDistrict,
    city: receiverCity,
    province: receiverProvince,
    postalCode: receiverPostalCode
  });

  const pricing = estimateShippingCost({
    originCity: senderCity,
    destinationCity: receiverCity,
    originProvince: senderProvince,
    destinationProvince: receiverProvince,
    weightKg: weight,
    lengthCm,
    widthCm,
    heightCm,
    service: selectedService === "ekspres" ? "EKSPRES" : "REGULER"
  });

  const shippingCost = pricing.baseCost;
  const serviceCost = pricing.serviceFee;
  const totalCost = pricing.total;
  const hasCoreData = Boolean(
    senderName.trim() &&
    senderAddressDetail.trim() &&
    senderSubdistrict.trim() &&
    senderPostalCode.trim() &&
    receiverName.trim() &&
    receiverAddressDetail.trim() &&
    receiverSubdistrict.trim() &&
    receiverPostalCode.trim()
  );

  const senderProvinceNode = AREA_TREE.find((item) => item.province === senderProvince) || AREA_TREE[0];
  const senderCities = senderProvinceNode?.cities || [];
  const senderCityNode = senderCities.find((item) => item.city === senderCity) || senderCities[0];
  const senderDistricts = senderCityNode?.districts || [];

  const receiverProvinceNode =
    AREA_TREE.find((item) => item.province === receiverProvince) || AREA_TREE[0];
  const receiverCities = receiverProvinceNode?.cities || [];
  const receiverCityNode = receiverCities.find((item) => item.city === receiverCity) || receiverCities[0];
  const receiverDistricts = receiverCityNode?.districts || [];

  function setFieldError(key: ShipmentFieldErrorKey, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [key]: value
    }));
  }

  function validateField(key: ShipmentFieldErrorKey) {
    switch (key) {
      case "senderName":
        return senderName.trim() ? "" : "Field ini wajib diisi";
      case "senderPhone":
        if (!senderPhone.trim()) return "Field ini wajib diisi";
        return isValidPhoneNumber(senderPhone) ? "" : "Format nomor telepon tidak valid";
      case "senderAddressDetail":
        return senderAddressDetail.trim() ? "" : "Field ini wajib diisi";
      case "receiverName":
        return receiverName.trim() ? "" : "Field ini wajib diisi";
      case "receiverPhone":
        if (!receiverPhone.trim()) return "Field ini wajib diisi";
        return isValidPhoneNumber(receiverPhone) ? "" : "Format nomor telepon tidak valid";
      case "receiverAddressDetail":
        return receiverAddressDetail.trim() ? "" : "Field ini wajib diisi";
      case "itemName":
        return itemName.trim() ? "" : "Field ini wajib diisi";
      case "itemCategory":
        return itemCategory.trim() ? "" : "Field ini wajib diisi";
      case "vehicleId":
        return vehicleId ? "" : "Field ini wajib diisi";
      case "weightKg":
        if (!weightKg.trim()) return "Field ini wajib diisi";
        return isNumericField(weightKg) ? "" : "Harus berupa angka";
      case "dimP":
        if (!dimP.trim()) return "Field ini wajib diisi";
        return isNumericField(dimP) ? "" : "Harus berupa angka";
      case "dimL":
        if (!dimL.trim()) return "Field ini wajib diisi";
        return isNumericField(dimL) ? "" : "Harus berupa angka";
      case "dimT":
        if (!dimT.trim()) return "Field ini wajib diisi";
        return isNumericField(dimT) ? "" : "Harus berupa angka";
      default:
        return "";
    }
  }

  function validateBeforeSubmit() {
    const keys: ShipmentFieldErrorKey[] = [
      "senderName",
      "senderPhone",
      "senderAddressDetail",
      "receiverName",
      "receiverPhone",
      "receiverAddressDetail",
      "itemName",
      "itemCategory",
      "vehicleId",
      "weightKg",
      "dimP",
      "dimL",
      "dimT"
    ];

    const nextErrors: Partial<Record<ShipmentFieldErrorKey, string>> = {};
    keys.forEach((key) => {
      const message = validateField(key);
      if (message) {
        nextErrors[key] = message;
      }
    });
    setFieldErrors(nextErrors);
    return keys.every((key) => !nextErrors[key]);
  }

  function resetForm() {
    setSenderName("");
    setSenderPhone("");
    setSenderProvince(AREA_TREE[0]?.province || "");
    setSenderCity(AREA_TREE[0]?.cities[0]?.city || "");
    setSenderDistrict(AREA_TREE[0]?.cities[0]?.districts[0] || "");
    setSenderSubdistrict("");
    setSenderPostalCode("");
    setSenderAddressDetail("");
    setReceiverName("");
    setReceiverPhone("");
    setReceiverProvince(AREA_TREE[0]?.province || "");
    setReceiverCity(AREA_TREE[0]?.cities[0]?.city || "");
    setReceiverDistrict(AREA_TREE[0]?.cities[0]?.districts[0] || "");
    setReceiverSubdistrict("");
    setReceiverPostalCode("");
    setReceiverAddressDetail("");
    setWeightKg("2");
    setDimP("");
    setDimL("");
    setDimT("");
    setItemName("");
    setItemCategory("");
    setItemNote("");
    setDeliveryType("BIASA");
    setVehicleId(vehicles[0]?.id ? String(vehicles[0].id) : "");
    setSelectedService("reguler");
    setSenderError("");
    setReceiverError("");
    setFieldErrors({});
    setDraftInfo("");
    setGuideInfo("");
  }

  function handleCancel() {
    resetForm();
    setNotice("");
    setNoticeTone("error");
  }

  function handleSaveDraft() {
    const draftPayload = {
      senderName,
      senderPhone,
      senderProvince,
      senderCity,
      senderDistrict,
      senderSubdistrict,
      senderPostalCode,
      senderAddressDetail,
      receiverName,
      receiverPhone,
      receiverProvince,
      receiverCity,
      receiverDistrict,
      receiverSubdistrict,
      receiverPostalCode,
      receiverAddressDetail,
      weightKg,
      dimP,
      dimL,
      dimT,
      itemName,
      itemCategory,
      itemNote,
      deliveryType,
      vehicleId,
      selectedService
    };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    setDraftInfo("Draft pengiriman berhasil disimpan.");
  }

  useEffect(() => {
    document.title = "Kirim Paket | SHIPIN GO Admin";
  }, []);

  useEffect(() => {
    fetchVehiclesFromDatabase()
      .then((items) => {
        setVehicles(items);
        setVehicleId((current) => current || (items[0]?.id ? String(items[0].id) : ""));
      })
      .catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as Record<string, string>;

      const senderProvinceValue = draft.senderProvince || AREA_TREE[0]?.province || "";
      const senderProvinceNode =
        AREA_TREE.find((item) => item.province === senderProvinceValue) || AREA_TREE[0];
      const senderCityValue =
        senderProvinceNode?.cities.find((item) => item.city === draft.senderCity)?.city ||
        senderProvinceNode?.cities[0]?.city ||
        "";
      const senderCityNode =
        senderProvinceNode?.cities.find((item) => item.city === senderCityValue) ||
        senderProvinceNode?.cities[0];
      const senderDistrictValue = draft.senderDistrict || senderCityNode?.districts[0] || "";

      const receiverProvinceValue = draft.receiverProvince || AREA_TREE[0]?.province || "";
      const receiverProvinceNode =
        AREA_TREE.find((item) => item.province === receiverProvinceValue) || AREA_TREE[0];
      const receiverCityValue =
        receiverProvinceNode?.cities.find((item) => item.city === draft.receiverCity)?.city ||
        receiverProvinceNode?.cities[0]?.city ||
        "";
      const receiverCityNode =
        receiverProvinceNode?.cities.find((item) => item.city === receiverCityValue) ||
        receiverProvinceNode?.cities[0];
      const receiverDistrictValue = draft.receiverDistrict || receiverCityNode?.districts[0] || "";

      setSenderName(draft.senderName || "");
      setSenderPhone(draft.senderPhone || "");
      setSenderProvince(senderProvinceValue);
      setSenderCity(senderCityValue);
      setSenderDistrict(senderDistrictValue);
      setSenderSubdistrict(draft.senderSubdistrict || "");
      setSenderPostalCode(draft.senderPostalCode || "");
      setSenderAddressDetail(draft.senderAddressDetail || "");

      setReceiverName(draft.receiverName || "");
      setReceiverPhone(draft.receiverPhone || "");
      setReceiverProvince(receiverProvinceValue);
      setReceiverCity(receiverCityValue);
      setReceiverDistrict(receiverDistrictValue);
      setReceiverSubdistrict(draft.receiverSubdistrict || "");
      setReceiverPostalCode(draft.receiverPostalCode || "");
      setReceiverAddressDetail(draft.receiverAddressDetail || "");

      setWeightKg(draft.weightKg || "2");
      setDimP(draft.dimP || "");
      setDimL(draft.dimL || "");
      setDimT(draft.dimT || "");
      setItemName(draft.itemName || "");
      setItemCategory(draft.itemCategory || "");
      setItemNote(draft.itemNote || "");
      setDeliveryType(draft.deliveryType === "VVIP" || draft.deliveryType === "CEPAT" ? draft.deliveryType : "BIASA");
      setVehicleId(draft.vehicleId || "");
      setSelectedService(draft.selectedService === "ekspres" ? "ekspres" : "reguler");
      setDraftInfo("Draft sebelumnya berhasil dimuat.");
    } catch {
      setDraftInfo("");
    }
  }, []);

  function handleGuideClick() {
    setGuideInfo("Panduan: lengkapi data pengirim/penerima, cek total, lalu Konfirmasi & Bayar.");
  }

  async function handleCreateShipment() {
    const isValid = validateBeforeSubmit();
    const senderMissing = !senderName.trim() || !senderAddressDetail.trim() || !senderSubdistrict.trim();
    const receiverMissing =
      !receiverName.trim() || !receiverAddressDetail.trim() || !receiverSubdistrict.trim();
    const cargoMissing = !itemName.trim() || !itemCategory.trim() || !vehicleId;

    setSenderError(senderMissing ? "Nama dan alamat pengirim wajib diisi." : "");
    setReceiverError(receiverMissing ? "Nama dan alamat penerima wajib diisi." : "");

    if (!isValid || senderMissing || receiverMissing || cargoMissing) {
      setNoticeTone("error");
      setNotice("Format data tidak valid. Periksa kembali field yang bertanda merah.");
      return;
    }

    const service: ServiceType = selectedService === "ekspres" ? "EKSPRES" : "REGULER";
    setIsSubmitting(true);

    try {
      const originCoords = resolveAreaCoordinate({
        city: senderCity,
        province: senderProvince
      });
      const destinationCoords = resolveAreaCoordinate({
        city: receiverCity,
        province: receiverProvince
      });

      // Demo tracking speed: fast enough to observe route changes without waiting hours.
      const durasiEstimasiMs = getDemoTrackingDurationMs(service);

      const created = await createShipmentInDatabase({
        senderName,
        pickupAddress: senderAddress,
        receiverName,
        destinationAddress: receiverAddress,
        originProvince: senderProvince,
        destinationProvince: receiverProvince,
        originCity: senderCity,
        destinationCity: receiverCity,
        originPostalCode: senderPostalCode,
        destinationPostalCode: receiverPostalCode,
        lengthCm,
        widthCm,
        heightCm,
        senderPhone,
        receiverPhone,
        weightKg: weight,
        service,
        itemName,
        itemCategory,
        itemNote,
        deliveryType,
        vehicleId: Number(vehicleId),
        originLat: originCoords?.lat,
        originLng: originCoords?.lng,
        destinationLat: destinationCoords?.lat,
        destinationLng: destinationCoords?.lng,
        waktuBerangkat: Date.now(),
        durasiEstimasiMs
      });

      setNoticeTone("success");
      setNotice("Data pengiriman berhasil masuk database.");
      setPaidShipmentId(created.id);
      setPaidAmount(created.total);
      setIsPaymentSuccessOpen(true);
    } catch (error) {
      setNoticeTone("error");
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan data, coba lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoToHistory() {
    setIsPaymentSuccessOpen(false);
    setNotice("");
    resetForm();
    router.push("/admin/histori");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#eef2ee] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <header className="mb-5">
          <h1 className="text-[44px] font-extrabold tracking-[-0.04em] text-[#202923] sm:text-[54px]">
            Buat Pengiriman Baru
          </h1>
          <p className="mt-1.5 max-w-[620px] text-[13px] leading-6 text-[#667067] sm:text-[14px]">
            Lengkapi detail pengiriman Anda. Sistem kami akan menghitung biaya terbaik untuk logistik UMKM Anda secara otomatis.
          </p>
        </header>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <BlockCard number={1} title="Data Pengirim">
              <p className="mb-3 text-[12px] text-[#5e6d62]">
                Info: isi data pengirim utama agar penjemputan tidak tertunda.
              </p>
              <div className="mb-3 grid gap-2.5 sm:grid-cols-2">
                <Field label="Nama Lengkap">
                  <input
                    className={inputClass}
                    placeholder="Contoh: Budi Santoso"
                    value={senderName}
                    onChange={(event) => {
                      setSenderName(event.target.value);
                      if (senderError) setSenderError("");
                      if (fieldErrors.senderName) setFieldError("senderName", "");
                    }}
                    onBlur={() => setFieldError("senderName", validateField("senderName"))}
                  />
                  {fieldErrors.senderName ? <p className="text-[12px] text-[#c62828]">{fieldErrors.senderName}</p> : null}
                </Field>
                <Field label="Nomor Telepon">
                  <input
                    className={inputClass}
                    placeholder="0812xxxx"
                    value={senderPhone}
                    onChange={(event) => {
                      setSenderPhone(event.target.value);
                      if (fieldErrors.senderPhone) setFieldError("senderPhone", "");
                    }}
                    onBlur={() => setFieldError("senderPhone", validateField("senderPhone"))}
                  />
                  {fieldErrors.senderPhone ? <p className="text-[12px] text-[#c62828]">{fieldErrors.senderPhone}</p> : null}
                </Field>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="Provinsi">
                  <select
                    className={inputClass}
                    value={senderProvince}
                    onChange={(event) => {
                      const nextProvince = event.target.value;
                      const nextProvinceNode =
                        AREA_TREE.find((item) => item.province === nextProvince) || AREA_TREE[0];
                      const nextCity = nextProvinceNode?.cities[0]?.city || "";
                      const nextDistrict = nextProvinceNode?.cities[0]?.districts[0] || "";
                      setSenderProvince(nextProvince);
                      setSenderCity(nextCity);
                      setSenderDistrict(nextDistrict);
                    }}
                  >
                    {AREA_TREE.map((item) => (
                      <option key={item.province} value={item.province}>
                        {item.province}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kota / Kabupaten">
                  <SearchableSelect
                    value={senderCity}
                    options={senderCities.map((item) => item.city)}
                    className="mt-0"
                    onChange={(nextCity) => {
                      const nextCityNode = senderCities.find((item) => item.city === nextCity);
                      setSenderCity(nextCity);
                      setSenderDistrict(nextCityNode?.districts[0] || "");
                    }}
                  />
                </Field>
              </div>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                <Field label="Kecamatan">
                  <select
                    className={inputClass}
                    value={senderDistrict}
                    onChange={(event) => setSenderDistrict(event.target.value)}
                  >
                    {senderDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kelurahan">
                  <input
                    className={inputClass}
                    placeholder="Contoh: Kuningan Timur"
                    value={senderSubdistrict}
                    onChange={(event) => setSenderSubdistrict(event.target.value)}
                  />
                </Field>
                <Field label="Kode Pos">
                  <input
                    className={inputClass}
                    placeholder="5 digit"
                    value={senderPostalCode}
                    onChange={(event) => setSenderPostalCode(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Alamat Lengkap Penjemputan">
                <textarea
                  className={`${inputClass} h-[74px] resize-none py-2.5`}
                  placeholder="Nama jalan, nomor rumah/ruko, RT/RW, patokan..."
                  value={senderAddressDetail}
                  onChange={(event) => {
                    setSenderAddressDetail(event.target.value);
                    if (senderError) setSenderError("");
                    if (fieldErrors.senderAddressDetail) setFieldError("senderAddressDetail", "");
                  }}
                  onBlur={() => setFieldError("senderAddressDetail", validateField("senderAddressDetail"))}
                />
                {fieldErrors.senderAddressDetail ? <p className="text-[12px] text-[#c62828]">{fieldErrors.senderAddressDetail}</p> : null}
              </Field>
              {senderError ? <p className="mt-2 text-[12px] font-semibold text-[#c62828]">{senderError}</p> : null}
            </BlockCard>

            <BlockCard number={2} title="Data Penerima">
              <p className="mb-3 text-[12px] text-[#5e6d62]">
                Info: pastikan nama dan alamat tujuan lengkap untuk mencegah retur.
              </p>
              <div className="mb-3 grid gap-2.5 sm:grid-cols-2">
                <Field label="Nama Penerima">
                  <input
                    className={inputClass}
                    placeholder="Contoh: Siti Aminah"
                    value={receiverName}
                    onChange={(event) => {
                      setReceiverName(event.target.value);
                      if (receiverError) setReceiverError("");
                      if (fieldErrors.receiverName) setFieldError("receiverName", "");
                    }}
                    onBlur={() => setFieldError("receiverName", validateField("receiverName"))}
                  />
                  {fieldErrors.receiverName ? <p className="text-[12px] text-[#c62828]">{fieldErrors.receiverName}</p> : null}
                </Field>
                <Field label="Nomor Telepon">
                  <input
                    className={inputClass}
                    placeholder="0857xxxx"
                    value={receiverPhone}
                    onChange={(event) => {
                      setReceiverPhone(event.target.value);
                      if (fieldErrors.receiverPhone) setFieldError("receiverPhone", "");
                    }}
                    onBlur={() => setFieldError("receiverPhone", validateField("receiverPhone"))}
                  />
                  {fieldErrors.receiverPhone ? <p className="text-[12px] text-[#c62828]">{fieldErrors.receiverPhone}</p> : null}
                </Field>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label="Provinsi">
                  <select
                    className={inputClass}
                    value={receiverProvince}
                    onChange={(event) => {
                      const nextProvince = event.target.value;
                      const nextProvinceNode =
                        AREA_TREE.find((item) => item.province === nextProvince) || AREA_TREE[0];
                      const nextCity = nextProvinceNode?.cities[0]?.city || "";
                      const nextDistrict = nextProvinceNode?.cities[0]?.districts[0] || "";
                      setReceiverProvince(nextProvince);
                      setReceiverCity(nextCity);
                      setReceiverDistrict(nextDistrict);
                    }}
                  >
                    {AREA_TREE.map((item) => (
                      <option key={item.province} value={item.province}>
                        {item.province}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kota / Kabupaten">
                  <SearchableSelect
                    value={receiverCity}
                    options={receiverCities.map((item) => item.city)}
                    className="mt-0"
                    onChange={(nextCity) => {
                      const nextCityNode = receiverCities.find((item) => item.city === nextCity);
                      setReceiverCity(nextCity);
                      setReceiverDistrict(nextCityNode?.districts[0] || "");
                    }}
                  />
                </Field>
              </div>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                <Field label="Kecamatan">
                  <select
                    className={inputClass}
                    value={receiverDistrict}
                    onChange={(event) => setReceiverDistrict(event.target.value)}
                  >
                    {receiverDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kelurahan">
                  <input
                    className={inputClass}
                    placeholder="Contoh: Dinoyo"
                    value={receiverSubdistrict}
                    onChange={(event) => setReceiverSubdistrict(event.target.value)}
                  />
                </Field>
                <Field label="Kode Pos">
                  <input
                    className={inputClass}
                    placeholder="5 digit"
                    value={receiverPostalCode}
                    onChange={(event) => setReceiverPostalCode(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Alamat Lengkap Tujuan">
                <textarea
                  className={`${inputClass} h-[74px] resize-none py-2.5`}
                  placeholder="Nama jalan, nomor rumah/ruko, RT/RW, patokan..."
                  value={receiverAddressDetail}
                  onChange={(event) => {
                    setReceiverAddressDetail(event.target.value);
                    if (receiverError) setReceiverError("");
                    if (fieldErrors.receiverAddressDetail) setFieldError("receiverAddressDetail", "");
                  }}
                  onBlur={() => setFieldError("receiverAddressDetail", validateField("receiverAddressDetail"))}
                />
                {fieldErrors.receiverAddressDetail ? <p className="text-[12px] text-[#c62828]">{fieldErrors.receiverAddressDetail}</p> : null}
              </Field>
              {receiverError ? <p className="mt-2 text-[12px] font-semibold text-[#c62828]">{receiverError}</p> : null}
            </BlockCard>

            <BlockCard number={3} title="Detail Paket">
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Nama Barang">
                  <input
                    className={inputClass}
                    placeholder="Contoh: Laptop ASUS Vivobook"
                    value={itemName}
                    onChange={(event) => {
                      setItemName(event.target.value);
                      if (fieldErrors.itemName) setFieldError("itemName", "");
                    }}
                    onBlur={() => setFieldError("itemName", validateField("itemName"))}
                  />
                  {fieldErrors.itemName ? <p className="text-[12px] text-[#c62828]">{fieldErrors.itemName}</p> : null}
                </Field>
                <Field label="Jenis Barang">
                  <select
                    className={inputClass}
                    value={itemCategory}
                    onChange={(event) => {
                      setItemCategory(event.target.value);
                      if (fieldErrors.itemCategory) setFieldError("itemCategory", "");
                    }}
                    onBlur={() => setFieldError("itemCategory", validateField("itemCategory"))}
                  >
                    <option value="">Pilih jenis barang</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Pakaian">Pakaian</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Dokumen">Dokumen</option>
                    <option value="Kosmetik">Kosmetik</option>
                    <option value="Aksesoris">Aksesoris</option>
                    <option value="Sparepart">Sparepart</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {fieldErrors.itemCategory ? <p className="text-[12px] text-[#c62828]">{fieldErrors.itemCategory}</p> : null}
                </Field>
              </div>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Jenis Pengiriman">
                  <select
                    className={inputClass}
                    value={deliveryType}
                    onChange={(event) => {
                      const next = event.target.value as "BIASA" | "CEPAT" | "VVIP";
                      setDeliveryType(next);
                      setSelectedService(next === "BIASA" ? "reguler" : "ekspres");
                    }}
                  >
                    <option value="BIASA">Biasa</option>
                    <option value="CEPAT">Cepat</option>
                    <option value="VVIP">Vvip</option>
                  </select>
                </Field>
                <Field label="Kendaraan">
                  <select
                    className={inputClass}
                    value={vehicleId}
                    onChange={(event) => {
                      setVehicleId(event.target.value);
                      if (fieldErrors.vehicleId) setFieldError("vehicleId", "");
                    }}
                    onBlur={() => setFieldError("vehicleId", validateField("vehicleId"))}
                  >
                    <option value="">Pilih kendaraan</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_name} - {vehicle.plate_number}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.vehicleId ? <p className="text-[12px] text-[#c62828]">{fieldErrors.vehicleId}</p> : null}
                </Field>
              </div>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Deskripsi / Catatan Barang">
                  <input
                    className={inputClass}
                    placeholder="Contoh: fragile, jangan dibalik"
                    value={itemNote}
                    onChange={(event) => setItemNote(event.target.value)}
                  />
                </Field>
                <Field label="Berat (Kg)">
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className={`${inputClass} pr-8`}
                      value={weightKg}
                      onChange={(event) => {
                        setWeightKg(event.target.value);
                        if (fieldErrors.weightKg) setFieldError("weightKg", "");
                      }}
                      onBlur={() => setFieldError("weightKg", validateField("weightKg"))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#8e9690]">kg</span>
                  </div>
                  {fieldErrors.weightKg ? <p className="text-[12px] text-[#c62828]">{fieldErrors.weightKg}</p> : null}
                </Field>
              </div>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Dimensi Paket (cm)">
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="0" className={inputClass} placeholder="Panjang" value={dimP} onChange={(event) => { setDimP(event.target.value); if (fieldErrors.dimP) setFieldError("dimP", ""); }} onBlur={() => setFieldError("dimP", validateField("dimP"))} />
                    <input type="number" min="0" className={inputClass} placeholder="Lebar" value={dimL} onChange={(event) => { setDimL(event.target.value); if (fieldErrors.dimL) setFieldError("dimL", ""); }} onBlur={() => setFieldError("dimL", validateField("dimL"))} />
                    <input type="number" min="0" className={inputClass} placeholder="Tinggi" value={dimT} onChange={(event) => { setDimT(event.target.value); if (fieldErrors.dimT) setFieldError("dimT", ""); }} onBlur={() => setFieldError("dimT", validateField("dimT"))} />
                  </div>
                  {fieldErrors.dimP || fieldErrors.dimL || fieldErrors.dimT ? (
                    <p className="text-[12px] text-[#c62828]">
                      {fieldErrors.dimP || fieldErrors.dimL || fieldErrors.dimT}
                    </p>
                  ) : null}
                </Field>
                <div className="rounded-[18px] border border-[#dce4da] bg-[#f6faf5] px-4 py-3 text-[12px] text-[#5d6a61]">
                  <p className="font-bold text-[#2c372f]">Ringkasan Barang</p>
                  <p className="mt-1">Nama: {itemName.trim() || "-"}</p>
                  <p>Jenis: {itemCategory.trim() || "-"}</p>
                  <p>Dimensi: {dimP || "0"} x {dimL || "0"} x {dimT || "0"} cm</p>
                </div>
              </div>

              <p className="mb-2 text-[12px] font-bold text-[#303a33]">Pilih Jenis Layanan</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {serviceOptions.map((service) => {
                  const active = selectedService === service.id;

                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id);
                        setDeliveryType(service.id === "ekspres" ? "CEPAT" : "BIASA");
                      }}
                      className={`rounded-2xl border px-3.5 py-3 text-left transition ${
                        active ? "border-[#8fd09b] bg-[#ecf9ef]" : "border-[#dce2da] bg-white"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#223028]">{service.title}</span>
                        {service.recommended && (
                          <span className="rounded-full bg-[#35b85a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7d867f]">{service.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </BlockCard>
          </div>

          <aside className="rounded-[34px] border border-[#95e198] bg-[linear-gradient(180deg,#9cf09b_0%,#95eb92_35%,#90e58f_100%)] p-8 text-[#143f25] shadow-[0_22px_45px_rgba(107,188,121,0.3)] xl:sticky xl:top-6">
            <h2 className="text-[28px] font-extrabold leading-none tracking-[-0.05em] text-[#133d24] sm:text-[31px]">
              Ringkasan Biaya
            </h2>

            <div className="mt-8 space-y-4 text-[14px] text-[#275238] sm:text-[15px]">
              <div className="rounded-2xl bg-[#d7f6d3] px-3 py-2 text-[12px] font-semibold text-[#245739]">
                Rute: {senderCity || "-"}{" -> "}{receiverCity || "-"}{" | "}{pricing.distanceKm} km
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Biaya Pengiriman ({pricing.billableWeight}kg)</span>
                <span className="shrink-0 text-[18px] font-semibold text-[#1c4d30]">
                  {hasCoreData ? `Rp ${shippingCost.toLocaleString("id-ID")}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Biaya Layanan</span>
                <span className="shrink-0 text-[18px] font-semibold text-[#1c4d30]">
                  {hasCoreData ? `Rp ${serviceCost.toLocaleString("id-ID")}` : "-"}
                </span>
              </div>
            </div>

            <hr className="my-5 border-[#7fda86]" />

            <div className="flex items-center justify-between gap-5">
              <p className="text-[18px] font-bold leading-[1.15] text-[#173c27]">
                Total Pembayaran
              </p>
              <p className="shrink-0 whitespace-nowrap text-[28px] font-black leading-none tracking-[-0.04em] text-[#0f341f] sm:text-[32px] xl:text-[36px]">
                {hasCoreData ? `Rp ${totalCost.toLocaleString("id-ID")}` : "-"}
              </p>
            </div>
            {!hasCoreData ? (
              <p className="mt-3 text-[12px] font-semibold text-[#174c2c]">
                Isi data pengirim dan penerima dulu untuk generate total biaya.
              </p>
            ) : null}

            <div className="mt-8 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(236,255,232,0.95),rgba(210,247,201,0.88))] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <p className="text-center text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#18482d] sm:text-[13px]">
                Metode Pembayaran: QRIS
              </p>

              <div className="mt-6 rounded-[30px] bg-white px-5 py-4 shadow-[0_14px_34px_rgba(111,174,111,0.16)]">
                {hasCoreData ? (
                  <div className="mx-auto flex h-[120px] max-w-[270px] items-center gap-3 rounded-[10px] border border-[#d7d9db] bg-[linear-gradient(180deg,#f3f3f5_0%,#ededf0_100%)] px-3 text-[#5f6661] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
                    <div className="grid h-[84px] w-[84px] grid-cols-7 gap-[2px] rounded bg-white p-[4px]">
                      {Array.from({ length: 49 }).map((_, index) => (
                        <span
                          key={index}
                          className={`rounded-[1px] ${
                            [0, 1, 2, 7, 14, 21, 28, 35, 42, 43, 44, 20, 26, 31, 33, 37, 39].includes(index) ||
                            index % 3 === 0
                              ? "bg-[#1f2d25]"
                              : "bg-[#d7ddd8]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#6d746f]">Dummy QRIS</p>
                      <p className="mt-1 text-[11px] font-semibold leading-4 text-[#7b837d]">
                        Scan untuk pembayaran
                        <br />
                        Rp {totalCost.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-[#929892]">Ref: SHIPIN-{String(totalCost).slice(-4)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex h-[84px] max-w-[270px] items-center justify-center rounded-[10px] border border-dashed border-[#c8d8c6] bg-[#f4faf2] text-center text-[11px] font-semibold tracking-[0.04em] text-[#6a806e]">
                    QRIS akan muncul setelah data inti lengkap
                  </div>
                )}
              </div>

              <p className="mx-auto mt-6 max-w-[250px] text-center text-[12px] leading-6 text-[#5b7a63]">
                Pindai kode QR di atas menggunakan aplikasi perbankan atau e-wallet Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateShipment}
              disabled={isSubmitting}
              className="mt-7 h-14 w-full rounded-full bg-[#175f31] text-[15px] font-bold text-white shadow-[0_18px_28px_rgba(23,95,49,0.24)] transition hover:bg-[#114a26]"
            >
              {isSubmitting ? "Menyimpan ke Database..." : "Konfirmasi & Bayar"}
            </button>
            {notice ? (
              <p
                className={`mt-3 text-center text-[12px] font-semibold ${
                  noticeTone === "error" ? "text-[#c62828]" : "text-[#1d6b3f]"
                }`}
              >
                {notice}
              </p>
            ) : null}

            <div className="mt-6 flex items-start gap-3 rounded-[999px] bg-[linear-gradient(180deg,rgba(203,250,191,0.82),rgba(181,242,171,0.82))] px-5 py-4 text-[12px] leading-6 text-[#2d6843] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#daf7d1] text-[#1e713c]">
                <ShieldIcon className="h-4 w-4" />
              </span>
              <span>
                Pembayaran aman dengan enkripsi SSL 256-bit dan proteksi asuransi pengiriman.
              </span>
            </div>
          </aside>
        </section>

        <section className="mt-4 rounded-[22px] border border-[#e3e8e1] bg-[#f8faf8] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-bold text-[#223128]">Simpan Draft Pengiriman</p>
              <p className="mt-0.5 text-[12px] text-[#7a837d]">Belum siap mengirim sekarang? Simpan data Anda dan lanjutkan nanti.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 rounded-full border border-[#d6dcd4] px-4 text-[12px] font-semibold text-[#5e6d62]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-9 rounded-full border border-[#2a8b48] bg-[#eefaf0] px-4 text-[12px] font-semibold text-[#18663a]"
              >
                Simpan Draft
              </button>
            </div>
          </div>
          {draftInfo ? <p className="mt-3 text-[12px] font-semibold text-[#1d6b3f]">{draftInfo}</p> : null}
        </section>

        <section className="mt-5 rounded-[22px] border border-[#e3e8e1] bg-white px-5 py-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#97ef9f] text-[#17633a]">
            <PrinterIcon className="h-5 w-5" />
          </div>
          <h3 className="text-[24px] font-extrabold tracking-[-0.03em] text-[#1d2b24]">Alur Cetak Resi</h3>
          <p className="mx-auto mt-2 max-w-[620px] text-[12px] leading-6 text-[#7b837d]">
            Setelah pembayaran dikonfirmasi, sistem akan otomatis menerbitkan ID resi
            <span className="font-bold text-[#1a673b]"> SPG-2034-XXXX</span>. Anda dapat memantau status pengiriman serta mencetak label dari menu histori.
          </p>
          <button
            type="button"
            onClick={handleGuideClick}
            className="mt-3 text-[12px] font-bold text-[#1d6b3f]"
          >
            Lihat Panduan Cetak Resi +
          </button>
          {guideInfo ? <p className="mt-2 text-[12px] font-semibold text-[#3d5f48]">{guideInfo}</p> : null}
        </section>
      </div>

      {isPaymentSuccessOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101712]/40 px-4">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dff8d7] text-[#1b7f3e]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-8 w-8">
                <path d="m5 12 4.5 4.5L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-center text-[24px] font-extrabold text-[#1d2e24]">Pembayaran Berhasil</h3>
            <p className="mt-2 text-center text-[14px] text-[#546358]">
              Pembayaran QRIS telah diterima.
            </p>
            <div className="mt-4 rounded-2xl bg-[#f3f8f1] px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#68806d]">No. Resi</p>
              <p className="mt-1 text-[16px] font-extrabold text-[#1d6f3e]">{paidShipmentId}</p>
              <p className="mt-2 text-[12px] text-[#65766a]">Total Bayar</p>
              <p className="text-[22px] font-black text-[#173a28]">Rp {paidAmount.toLocaleString("id-ID")}</p>
            </div>
            <button
              type="button"
              onClick={handleGoToHistory}
              className="mt-5 h-12 w-full rounded-full bg-[#1a7332] text-[15px] font-bold text-white"
            >
              Lanjut ke Histori
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const inputClass =
  "w-full rounded-[14px] border border-[#d9dfd7] bg-white px-3 py-2 text-[13px] text-[#27352d] placeholder:text-[#9ca59e] focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#415046]">{label}</span>
      {children}
    </label>
  );
}

function BlockCard({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <article className="rounded-[24px] border border-[#e3e8e1] bg-[#f8faf8] p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1f9d48] text-[11px] font-bold text-white">
          {number}
        </span>
        <h2 className="text-[36px] font-extrabold tracking-[-0.04em] text-[#1f2d25]">{title}</h2>
      </div>
      {children}
    </article>
  );
}

export default function AdminKirimPaketPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminKirimPaketContent />
    </Suspense>
  );
}
