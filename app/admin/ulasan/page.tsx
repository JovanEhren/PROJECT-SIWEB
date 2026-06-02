"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import {
  deleteReviewFromDatabase,
  fetchReviewsFromDatabase,
  ReviewItem,
  updateReviewInDatabase
} from "@/lib/admin-reviews";

function RatingStars({ stars }: { stars: number }) {
  return (
    <div className="mt-1.5 text-base tracking-[0.08em] text-[#f4aa00]">
      {"★".repeat(stars)}
      <span className="text-[#cfd5d2]">{"★".repeat(5 - stars)}</span>
    </div>
  );
}

const ITEMS_PER_PAGE = 3;

function LoadingFallback() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f2f5f1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px] rounded-[28px] bg-white p-6 text-[13px] font-semibold text-[#5f6d63]">
        Memuat ulasan...
      </div>
    </main>
  );
}

function AdminUlasanContent() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unmoderated">("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Ulasan | SHIPIN GO Admin";
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const rows = await fetchReviewsFromDatabase(true);
        if (!active) return;
        setReviews(rows);
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Gagal memuat ulasan.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const bars = useMemo(() => {
    const all = reviews.length > 0 ? reviews : [];
    const total = all.length || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = all.filter((review) => review.stars === star).length;
      return { star, pct: Math.round((count / total) * 100) };
    });
  }, [reviews]);

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, row) => sum + row.stars, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const displayedReviews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filteredByStatus = filter === "unmoderated" ? reviews.filter((review) => !review.visible) : reviews;

    if (!keyword) return filteredByStatus;

    return filteredByStatus.filter((review) => {
      return (
        review.name.toLowerCase().includes(keyword) ||
        review.text.toLowerCase().includes(keyword) ||
        review.meta.toLowerCase().includes(keyword)
      );
    });
  }, [filter, query, reviews]);

  const totalPages = Math.max(1, Math.ceil(displayedReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = displayedReviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleToggleVisibility(id: string, visible: boolean) {
    try {
      const updatedReview = await updateReviewInDatabase(id, { visible: !visible });
      setReviews((current) => current.map((review) => (review.id === id ? updatedReview : review)));
      setMessage("Status moderasi ulasan diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memperbarui moderasi ulasan.");
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      await deleteReviewFromDatabase(id);
      setReviews((current) => current.filter((review) => review.id !== id));
      setMessage("Ulasan berhasil dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus ulasan.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f2f5f1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <section className="rounded-[34px] bg-gradient-to-r from-[#8be897] to-[#97e6a9] px-8 py-8 sm:px-10 sm:py-9">
          <h1 className="text-[clamp(1.8rem,2.3vw,3.2rem)] font-black italic leading-[0.98] tracking-tight text-[#0d4e32]">
            Kelola Ulasan Pelanggan
          </h1>
          <p className="mt-3 max-w-5xl text-[clamp(0.98rem,1.2vw,1.65rem)] leading-[1.12] text-[#1d6244]">
            Moderasi suara pelanggan Anda untuk menjaga kualitas layanan SHIPIN GO.
          </p>
        </section>

        <section className="mt-7 grid gap-6 lg:grid-cols-[390px_1fr]">
          <div className="space-y-6">
            <article className="rounded-[30px] bg-white px-7 py-7 shadow-[0_10px_30px_rgba(21,43,28,0.06)]">
              <h2 className="text-[clamp(1.7rem,1.8vw,2.55rem)] font-extrabold leading-[0.98] text-[#17362a]">
                Ringkasan
                <br />
                Rating
              </h2>

              <div className="mt-5 flex items-start gap-4">
                <p className="text-[clamp(3.1rem,3.8vw,4.8rem)] font-black leading-[0.9] text-[#1d5d40]">
                  {average || "0.0"}
                </p>
                <div className="pt-2.5">
                  <div className="text-base tracking-[0.1em] text-[#f4aa00]">★★★★☆</div>
                  <p className="mt-1 text-[clamp(1rem,1.15vw,1.45rem)] leading-[1.12] text-[#58645e]">
                    Dari {reviews.length}
                    <br />
                    Ulasan
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {bars.map((bar) => (
                  <div key={bar.star} className="grid grid-cols-[16px_1fr_52px] items-center gap-3">
                    <span className="text-[clamp(0.95rem,1.2vw,1.35rem)] text-[#4e5b55]">{bar.star}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-[#edf0ee]">
                      <div className="h-full rounded-full bg-[#1e7a45]" style={{ width: `${bar.pct}%` }} />
                    </div>
                    <span className="text-right text-[clamp(0.85rem,1vw,1.2rem)] text-[#4e5b55]">{bar.pct}%</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] bg-[#18672f] px-7 py-7">
              <h3 className="text-[clamp(1.4rem,1.9vw,2.2rem)] font-extrabold leading-tight text-white">
                Butuh Bantuan?
              </h3>
              <p className="mt-3 text-[clamp(0.95rem,1.1vw,1.2rem)] leading-relaxed text-[#8ce7a1]">
                Tim moderasi kami siap membantu Anda menyaring ulasan yang melanggar aturan.
              </p>
              <button
                type="button"
                onClick={() => setMessage("Support dihubungi. Tim moderasi akan menindaklanjuti.")}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#87ea90] px-6 text-base font-bold text-[#0e4728]"
              >
                Hubungi Support
              </button>
            </article>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-[clamp(1.85rem,2vw,2.7rem)] font-black leading-none text-[#17362a]">
                Ulasan Terbaru
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`h-12 rounded-full px-7 text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold ${
                    filter === "all" ? "bg-[#155a3a] text-white" : "border border-[#d1d7d3] bg-white text-[#334842]"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("unmoderated");
                    setCurrentPage(1);
                  }}
                  className={`h-12 rounded-full px-7 text-[clamp(0.95rem,1.1vw,1.25rem)] font-medium ${
                    filter === "unmoderated"
                      ? "bg-[#155a3a] text-white"
                      : "border border-[#d1d7d3] bg-white text-[#334842]"
                  }`}
                >
                  Belum Dimoderasi
                </button>
              </div>
            </div>

            {message ? <p className="mt-3 text-[12px] font-semibold text-[#1f6a3f]">{message}</p> : null}

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, isi ulasan, atau transaksi..."
              className="mt-4 h-12 w-full rounded-2xl border border-[#d8e0d8] bg-white px-4 text-sm text-[#2a372f] outline-none"
            />

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-[24px] border border-dashed border-[#d7dfd7] bg-white px-6 py-8 text-center">
                  <p className="text-[13px] font-semibold text-[#5f6d63]">Memuat ulasan dari database...</p>
                </div>
              ) : null}
              {!loading && paginatedReviews.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d7dfd7] bg-white px-6 py-8 text-center">
                  <p className="text-[13px] font-semibold text-[#5f6d63]">Belum ada ulasan yang cocok.</p>
                </div>
              ) : null}
              {paginatedReviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[28px] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(21,43,28,0.06)]"
                >
                  <div className="flex gap-4">
                    <div
                      className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold ${review.avatarBg}`}
                    >
                      {review.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[clamp(1.45rem,1.35vw,1.9rem)] font-extrabold leading-none text-[#153528]">
                          {review.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(review.id, review.visible)}
                          className={`rounded-lg px-3 py-1 text-xs font-extrabold tracking-wide ${
                            review.visible ? "bg-[#bde8c7] text-[#11623a]" : "bg-[#eceef1] text-[#46505a]"
                          }`}
                        >
                          {review.visible ? "TAMPILKAN" : "SEMBUNYIKAN"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="rounded-lg bg-[#fde9e7] px-3 py-1 text-xs font-extrabold tracking-wide text-[#b9473f]"
                        >
                          HAPUS
                        </button>
                      </div>

                      <RatingStars stars={review.stars} />

                      <p className="mt-2 text-[clamp(0.98rem,1vw,1.18rem)] leading-relaxed text-[#26433a]">
                        {review.text}
                      </p>
                      <p className="mt-3 text-[clamp(0.82rem,0.88vw,0.98rem)] text-[#4f5c56]">{review.meta}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 pb-2 text-[12px] font-semibold text-[#5f6d63] sm:flex-row sm:justify-between">
              <p>Menampilkan {paginatedReviews.length} dari {displayedReviews.length} ulasan</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6dcd4] text-[13px] text-[#47604f] transition-all disabled:cursor-not-allowed disabled:opacity-35 hover:border-[#8fd797] hover:bg-[#eefaf0]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                        currentPage === page
                          ? "bg-[#148a31] text-white shadow-[0_4px_12px_rgba(20,138,49,0.25)]"
                          : "border border-[#d6dcd4] text-[#47604f] hover:border-[#8fd797] hover:bg-[#eefaf0]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6dcd4] text-[#47604f] transition-all disabled:cursor-not-allowed disabled:opacity-35 hover:border-[#8fd797] hover:bg-[#eefaf0]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 flex justify-center pb-2">
              <button
                type="button"
                onClick={() => setMessage(`Total ulasan saat ini: ${reviews.length}`)}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#cfe8d4] bg-white px-6 text-sm font-extrabold text-[#155a3a] shadow-[0_12px_28px_rgba(21,90,58,0.08)] transition hover:-translate-y-0.5 hover:border-[#8fd797] hover:bg-[#f4fff6] hover:shadow-[0_16px_34px_rgba(21,90,58,0.14)] sm:px-7 sm:text-base"
              >
                Lihat Lebih Banyak
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e7f8eb] text-[#1f7a44] transition group-hover:bg-[#155a3a] group-hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminUlasanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminUlasanContent />
    </Suspense>
  );
}
