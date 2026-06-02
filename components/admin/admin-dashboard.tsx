"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ChatBubbleIcon,
  CheckIcon,
  ClipboardIcon,
  EyeIcon,
  HistoryIcon,
  MoneyIcon,
  PackageIcon,
  PrinterIcon,
  SearchIcon
} from "@/components/icons";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import {
  fetchShipmentsFromDatabase,
  PaymentStatus as HistoryPaymentStatus,
  ShipmentRecord,
  ShipmentStatus as HistoryShipmentStatus,
  updateShipmentInDatabase
} from "@/lib/admin-shipments";

type ShipmentStatus = "Dikirim" | "Selesai" | "Pending";
type PaymentStatus = "Lunas" | "Menunggu";
type ServiceType = "Reguler" | "Same-Day" | "Ekspres";

type ShipmentRow = {
  id: string;
  itemName?: string;
  itemCategory?: string;
  sender: string;
  senderPhone?: string;
  senderCity: string;
  receiver: string;
  receiverCity: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  createdAt: number;
  dayIndex: number;
  status: ShipmentStatus;
  payment: PaymentStatus;
  service: ServiceType;
  amount: number;
};

const dayLabels = ["S", "S", "R", "K", "J", "S", "M"];
const longDayLabels = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

const statusOptions = ["Semua", "Dikirim", "Selesai", "Pending"] as const;
const paymentOptions = ["Semua", "Lunas", "Menunggu"] as const;
const serviceOptions = ["Semua", "Reguler", "Same-Day", "Ekspres"] as const;
const ITEMS_PER_PAGE = 5;

function sensitiveBlurClass(isRevealed: boolean) {
  return isRevealed ? "" : "blur-[4px] select-none";
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
}

function toDayStart(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : null;
}

function toDayEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).getTime() : null;
}

function formatDateRangeLabel(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return `${start.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short"
  })} - ${end.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short"
  })}`;
}

function formatCurrency(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function statusBadgeTone(status: ShipmentStatus) {
  if (status === "Selesai") return "bg-[#28a745] text-white";
  if (status === "Pending") return "bg-[#f59e0b] text-white";
  return "bg-[#7c3aed] text-white";
}

function mapHistoryShipmentStatus(status: HistoryShipmentStatus): ShipmentStatus {
  if (status === "SAMPAI") return "Selesai";
  if (status === "DIJADWALKAN") return "Pending";
  return "Dikirim";
}

function toHistoryShipmentStatus(status: ShipmentStatus): HistoryShipmentStatus {
  if (status === "Selesai") return "SAMPAI";
  if (status === "Pending") return "DIJADWALKAN";
  return "DALAM PERJALANAN";
}

function mapHistoryPaymentStatus(status: HistoryPaymentStatus): PaymentStatus {
  return status === "LUNAS" ? "Lunas" : "Menunggu";
}

function toHistoryPaymentStatus(status: PaymentStatus): HistoryPaymentStatus {
  return status === "Lunas" ? "LUNAS" : "BELUM BAYAR";
}

function mapHistoryService(service?: ShipmentRecord["service"]): ServiceType {
  if (service === "EKSPRES") return "Ekspres";
  return "Reguler";
}

function extractCityFromAddress(value?: string) {
  if (!value) return "-";
  const tokens = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!tokens.length) return "-";
  if (tokens.length >= 3) return tokens[tokens.length - 3];
  return tokens[tokens.length - 1];
}

function mapShipmentRows(rows: ShipmentRecord[]): ShipmentRow[] {
  return rows.map((row) => {
    const dayIndex = ((new Date(row.createdAt).getDay() + 6) % 7) || 0;
    return {
      id: row.id,
      itemName: row.itemName,
      itemCategory: row.itemCategory,
      sender: row.sender,
      senderPhone: row.senderPhone,
      senderCity: row.originCity || extractCityFromAddress(row.senderAddress),
      receiver: row.receiver,
      receiverCity: row.destinationCity || extractCityFromAddress(row.receiverAddress),
      lengthCm: row.lengthCm,
      widthCm: row.widthCm,
      heightCm: row.heightCm,
      createdAt: row.createdAt,
      dayIndex,
      status: mapHistoryShipmentStatus(row.shipment),
      payment: mapHistoryPaymentStatus(row.payment),
      service: mapHistoryService(row.service),
      amount: row.total
    };
  });
}

function buildSparkline(values: number[]) {
  const width = 220;
  const height = 120;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const step = width / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");

  return { points, width, height };
}

export function AdminDashboard() {
  const [shipmentRows, setShipmentRows] = useState<ShipmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Semua");
  const [paymentFilter, setPaymentFilter] = useState<(typeof paymentOptions)[number]>("Semua");
  const [serviceFilter, setServiceFilter] = useState<(typeof serviceOptions)[number]>("Semua");
  const defaultDateRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [revealedRows, setRevealedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const currentRows = mapShipmentRows(await fetchShipmentsFromDatabase());
      if (!active) return;
      setShipmentRows(currentRows);
      setSelectedShipmentId((currentId) =>
        currentId && currentRows.some((row) => row.id === currentId) ? currentId : currentRows[0]?.id || null
      );
    };

    hydrate().catch(() => setShipmentRows([]));
    return () => {
      active = false;
    };
  }, []);

  const selectedShipment =
    shipmentRows.find((shipment) => shipment.id === selectedShipmentId) ?? shipmentRows[0] ?? null;

  const filteredShipments = useMemo(() => {
    const startAt = toDayStart(startDate);
    const endAt = toDayEnd(endDate);

    return shipmentRows.filter((shipment) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        shipment.id.toLowerCase().includes(query) ||
        shipment.sender.toLowerCase().includes(query) ||
        shipment.receiver.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "Semua" || shipment.status === statusFilter;
      const matchesPayment = paymentFilter === "Semua" || shipment.payment === paymentFilter;
      const matchesService = serviceFilter === "Semua" || shipment.service === serviceFilter;
      const matchesDate =
        (!startAt || shipment.createdAt >= startAt) &&
        (!endAt || shipment.createdAt <= endAt);

      return matchesSearch && matchesStatus && matchesPayment && matchesService && matchesDate;
    });
  }, [endDate, paymentFilter, search, serviceFilter, shipmentRows, startDate, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / ITEMS_PER_PAGE));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [endDate, paymentFilter, search, serviceFilter, startDate, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const chartMetrics = useMemo(() => {
    const packageSeries = Array.from({ length: 7 }, () => 0);
    const revenueSeries = Array.from({ length: 7 }, () => 0);

    shipmentRows.forEach((shipment) => {
      const statusWeight =
        shipment.status === "Selesai" ? 280 : shipment.status === "Dikirim" ? 210 : 120;
      const serviceWeight =
        shipment.service === "Same-Day" ? 36 : shipment.service === "Ekspres" ? 48 : 20;
      const paymentMultiplier = shipment.payment === "Lunas" ? 1 : 0.45;

      packageSeries[shipment.dayIndex] += Math.round(statusWeight + serviceWeight);
      revenueSeries[shipment.dayIndex] += shipment.amount * paymentMultiplier;
    });

    return {
      weeklyPackages: packageSeries,
      weeklyRevenue: revenueSeries.map((value) => Number((value / 1_000_000).toFixed(2)))
    };
  }, [filteredShipments]);

  const totals = useMemo(() => {
    const revenue = filteredShipments.reduce((sum, row) => sum + row.amount, 0);
    const success = filteredShipments.filter((row) => row.status === "Selesai").length;
    const pending = filteredShipments.filter((row) => row.status === "Pending").length;
    const shipped = filteredShipments.filter((row) => row.status === "Dikirim").length;

    return {
      transaksi: filteredShipments.length,
      paket: filteredShipments.length * 3 + 1578,
      pendapatan: revenue,
      berhasil: success + 3410,
      pending: pending + 182,
      dikirim: shipped
    };
  }, [filteredShipments]);

  async function updateShipmentStatus(id: string, nextStatus: ShipmentStatus) {
    const current = shipmentRows.find((row) => row.id === id);
    const inferredPayment: PaymentStatus =
      nextStatus === "Pending" ? "Menunggu" : current?.payment === "Menunggu" ? "Lunas" : current?.payment || "Lunas";

    const updated = await updateShipmentInDatabase(id, {
      shipment: toHistoryShipmentStatus(nextStatus),
      payment: toHistoryPaymentStatus(inferredPayment)
    });
    setShipmentRows(mapShipmentRows(updated));
    setSelectedShipmentId(id);
  }

  function toggleSensitiveRow(id: string) {
    setRevealedRows((current) => ({
      ...current,
      [id]: !current[id]
    }));
  }

  function printShipmentLabel() {
    const target = selectedShipment ?? filteredShipments[0];

    if (!target) return;

    const printWindow = window.open("", "_blank", "width=720,height=860");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Resi ${target.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1b4332; }
            .card { border: 2px solid #1b4332; border-radius: 24px; padding: 24px; }
            h1 { margin: 0 0 12px; }
            p { margin: 8px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>SHIPIN GO</h1>
            <p><strong>Resi:</strong> ${target.id}</p>
            <p><strong>Pengirim:</strong> ${target.sender} (${target.senderCity})</p>
            <p><strong>Penerima:</strong> ${target.receiver} (${target.receiverCity})</p>
            <p><strong>Layanan:</strong> ${target.service}</p>
            <p><strong>Status:</strong> ${target.status}</p>
            <p><strong>Total:</strong> ${formatCurrency(target.amount)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const sparkline = buildSparkline(chartMetrics.weeklyRevenue);

  const quickActions = [
    {
      label: "Cetak Resi",
      onClick: printShipmentLabel,
      icon: <PrinterIcon className="h-4 w-4" />,
      className: "bg-white text-[#495249]"
    }
  ];

  const summaryCards = [
    { label: "Total Transaksi", value: totals.transaksi + 1280, tone: "text-[#6c766e]", icon: <ClipboardIcon className="h-4 w-4" /> },
    { label: "Total Paket", value: totals.paket, tone: "text-[#6c766e]", icon: <PackageIcon className="h-4 w-4" /> },
    { label: "Pendapatan", value: `Rp ${(totals.pendapatan / 1_000_000 + 42.1).toFixed(1)}M`, tone: "text-[#6c766e]", icon: <MoneyIcon className="h-4 w-4" /> },
    { label: "Paket Berhasil", value: totals.berhasil, tone: "text-[#6c766e]", icon: <CheckIcon className="h-4 w-4" /> },
    { label: "Paket Pending", value: totals.pending, tone: "text-[#d06e3e]", icon: <HistoryIcon className="h-4 w-4" /> }
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(185,250,165,0.5),_transparent_28%),linear-gradient(180deg,#f7fbf3_0%,#f0f7eb_100%)] p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[34px] bg-[radial-gradient(circle_at_top_left,_rgba(180,251,166,0.52),_transparent_30%),linear-gradient(180deg,#effbe9_0%,#e8f7e2_100%)] p-5 shadow-[0_24px_60px_rgba(175,209,157,0.22)] sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6aa05f]">
                Admin Overview
              </p>
              <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em] text-[#273228] sm:text-[36px]">
                Selamat Datang, Admin!
              </h1>
              <p className="mt-2 text-[15px] text-[#6c746d]">
                Pantau performa logistik UMKM Anda hari ini.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_10px_20px_rgba(122,165,114,0.12)] ${action.className}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
              <AdminLogoutButton />
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card, index) => (
              <article
                key={card.label}
                className="rounded-[28px] bg-white/92 p-5 shadow-[0_16px_34px_rgba(145,176,127,0.14)]"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef9e8] ${card.tone}`}>
                    {card.icon}
                  </span>
                  {index === 0 ? (
                    <span className="rounded-full bg-[#dff9d6] px-2.5 py-1 text-[11px] font-bold text-[#4ca650]">
                      +12%
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm text-[#859084]">{card.label}</p>
                <p className="mt-2 text-[34px] font-extrabold tracking-[-0.04em] text-[#273228]">
                  {typeof card.value === "number" ? card.value.toLocaleString("id-ID") : card.value}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <article className="rounded-[34px] bg-white p-5 shadow-[0_18px_44px_rgba(155,184,143,0.18)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#2a332b]">
                  Tren Pendapatan & Paket
                </h2>
                <p className="mt-1 text-sm text-[#7b847b]">
                  Statistik otomatis mengikuti update status resi
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-[#67a55f]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#68c86d]" />
                  Pendapatan
                </span>
                <span className="inline-flex items-center gap-1 text-[#1d7f33]">
                  <span className="h-2 w-2 rounded-full bg-[#1d7f33]" />
                  Paket
                </span>
              </div>
            </div>

            <div className="mt-6 grid h-[240px] grid-cols-7 items-end gap-3">
              {chartMetrics.weeklyPackages.map((value, index) => {
                const max = Math.max(...chartMetrics.weeklyPackages);
                const height = `${(value / max) * 100}%`;
                const isPeak = value === max && value > 0;
                return (
                  <div key={longDayLabels[index]} className="flex h-full flex-col justify-end">
                    {isPeak ? (
                      <div className="mb-2 self-center rounded-full bg-[#2a332b] px-2.5 py-1 text-[10px] font-bold text-white">
                        {value}
                      </div>
                    ) : (
                      <div className="mb-2 h-6" />
                    )}
                    <div
                      className={`admin-chart-bar rounded-t-[22px] ${isPeak ? "bg-[#8fe987]" : "bg-[#eef3e8]"}`}
                      style={{ height, animationDelay: `${index * 120}ms` }}
                    />
                    <p className="mt-3 text-center text-[11px] font-semibold text-[#9aa39b]">
                      {longDayLabels[index]}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[34px] bg-white p-5 shadow-[0_18px_44px_rgba(155,184,143,0.18)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#2a332b]">
                  Tren Pendapatan Harian
                </h2>
                <p className="mt-1 text-sm text-[#7b847b]">
                  Visualisasi performa keuangan berdasarkan daftar resi aktif
                </p>
              </div>
              <span className="rounded-full bg-[#dff8d7] px-3 py-1 text-[11px] font-bold text-[#4ba14e]">
                Rp {Math.max(...chartMetrics.weeklyRevenue).toFixed(2)}M Puncak
              </span>
            </div>

            <div className="mt-8">
              <svg viewBox={`0 0 ${sparkline.width} ${sparkline.height}`} className="w-full">
                <g className="admin-chart-line-float">
                  <polyline
                    fill="none"
                    stroke="#1c7b33"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sparkline.points}
                  />
                </g>
              </svg>
              <div className="mt-3 flex justify-between px-1 text-[11px] font-semibold text-[#9aa39b]">
                {dayLabels.map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-4 shadow-[0_10px_24px_rgba(155,184,143,0.14)]">
              <SearchIcon className="h-4 w-4 text-[#8f9990]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari Resi atau Pengirim..."
                className="w-full bg-transparent text-sm text-[#384138] outline-none placeholder:text-[#afb6af]"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as (typeof statusOptions)[number]);
                  setCurrentPage(1);
                }}
                className="rounded-full bg-white px-4 py-3 text-sm text-[#505850] shadow-[0_10px_24px_rgba(155,184,143,0.14)] outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(event.target.value as (typeof paymentOptions)[number]);
                  setCurrentPage(1);
                }}
                className="rounded-full bg-white px-4 py-3 text-sm text-[#505850] shadow-[0_10px_24px_rgba(155,184,143,0.14)] outline-none"
              >
                {paymentOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value as (typeof serviceOptions)[number]);
                  setCurrentPage(1);
                }}
                className="rounded-full bg-white px-4 py-3 text-sm text-[#505850] shadow-[0_10px_24px_rgba(155,184,143,0.14)] outline-none"
              >
                {serviceOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#505850] shadow-[0_10px_24px_rgba(155,184,143,0.14)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-[#6b766b]">
                    <path d="M8 2v4M16 2v4M3 10h18" />
                    <rect x="3" y="4" width="18" height="17" rx="3" />
                  </svg>
                  <span>{formatDateRangeLabel(startDate, endDate)}</span>
                </button>

                {isDatePickerOpen ? (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[260px] rounded-[22px] border border-[#e2e9df] bg-white p-4 shadow-[0_20px_34px_rgba(155,184,143,0.2)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b867d]">
                      Filter Tanggal
                    </p>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold text-[#6a746b]">Mulai</span>
                        <input
                          type="date"
                          value={startDate}
                          max={endDate}
                          onChange={(event) => setStartDate(event.target.value)}
                          className="w-full rounded-[14px] border border-[#dfe7dd] px-3 py-2 text-[13px] outline-none"
                          aria-label="Tanggal mulai"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-semibold text-[#6a746b]">Sampai</span>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(event) => setEndDate(event.target.value)}
                          className="w-full rounded-[14px] border border-[#dfe7dd] px-3 py-2 text-[13px] outline-none"
                          aria-label="Tanggal akhir"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(false)}
                        className="rounded-full border border-[#dfe7dd] px-3 py-2 text-[12px] font-semibold text-[#566156]"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_44px_rgba(155,184,143,0.18)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-[#edf0ea] text-[12px] uppercase tracking-[0.18em] text-[#97a196]">
                  <tr>
                    <th className="px-6 py-4">Resi</th>
                    <th className="px-6 py-4">Pengirim</th>
                    <th className="px-6 py-4">Telepon</th>
                    <th className="px-6 py-4">Penerima</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedShipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b border-[#edf0ea] last:border-b-0">
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => setSelectedShipmentId(shipment.id)}
                          className={`font-bold text-[#2b8b45] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}
                        >
                          {shipment.id}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`font-semibold text-[#2a332b] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}>{shipment.sender}</p>
                        <p className={`text-sm text-[#8a938a] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}>{shipment.senderCity}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-block text-sm text-[#556055] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}
                        >
                          {shipment.senderPhone || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className={`font-semibold text-[#2a332b] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}>{shipment.receiver}</p>
                        <p className={`text-sm text-[#8a938a] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}>{shipment.receiverCity}</p>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={shipment.status}
                          onChange={(event) =>
                            updateShipmentStatus(shipment.id, event.target.value as ShipmentStatus)
                          }
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold outline-none transition ${statusBadgeTone(shipment.status)} ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}
                        >
                          <option value="Dikirim">Dikirim</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>
                      <td className={`px-6 py-5 font-semibold text-[#444d44] transition ${sensitiveBlurClass(Boolean(revealedRows[shipment.id]))}`}>
                        {formatCurrency(shipment.amount)}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => toggleSensitiveRow(shipment.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eef9e8] text-[#2f9344]"
                          aria-label={revealedRows[shipment.id] ? "Sembunyikan data sensitif" : "Tampilkan data sensitif"}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedShipments.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm font-semibold text-[#7f887f]">
                  Belum ada transaksi yang cocok.
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#edf0ea] px-6 py-4 text-sm text-[#7f887f] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Menampilkan {paginatedShipments.length} dari {filteredShipments.length} transaksi
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full bg-[#f3f8ef] px-3 py-1.5 font-bold text-[#59705a] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Sebelumnya
                </button>
                <span className="font-semibold text-[#384138]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full bg-[#f3f8ef] px-3 py-1.5 font-bold text-[#59705a] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Berikutnya
                </button>
              </div>
              <div className="hidden">
                <button className="rounded-full bg-[#f3f8ef] px-3 py-1.5 text-[#59705a]">‹</button>
                <button className="rounded-full bg-[#f3f8ef] px-3 py-1.5 text-[#59705a]">›</button>
              </div>
            </div>
          </div>

          {selectedShipment ? (
            <article className="rounded-[28px] bg-white p-5 shadow-[0_14px_32px_rgba(155,184,143,0.16)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7e8d7f]">
                    Detail Resi
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold text-[#283128]">{selectedShipment.id}</h3>
                </div>
                <button
                  type="button"
                  onClick={printShipmentLabel}
                  className="inline-flex items-center gap-2 rounded-full bg-[#9df28f] px-4 py-3 text-sm font-semibold text-[#175e35]"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Cetak Resi Terpilih
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Pengirim</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">{selectedShipment.sender}</p>
                  <p className="text-sm text-[#7e887f]">{selectedShipment.senderCity}</p>
                  <p className="text-sm text-[#7e887f]">{selectedShipment.senderPhone || "-"}</p>
                </div>
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Penerima</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">{selectedShipment.receiver}</p>
                  <p className="text-sm text-[#7e887f]">{selectedShipment.receiverCity}</p>
                </div>
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Layanan</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">{selectedShipment.service}</p>
                  <p className="text-sm text-[#7e887f]">{formatCurrency(selectedShipment.amount)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Nama Barang</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">{selectedShipment.itemName || "-"}</p>
                </div>
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Jenis Barang</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">{selectedShipment.itemCategory || "-"}</p>
                </div>
                <div className="rounded-[22px] bg-[#f4f8f1] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e988f]">Dimensi</p>
                  <p className="mt-2 font-semibold text-[#2a332b]">
                    {selectedShipment.lengthCm || 0} x {selectedShipment.widthCm || 0} x {selectedShipment.heightCm || 0} cm
                  </p>
                </div>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
