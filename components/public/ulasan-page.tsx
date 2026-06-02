"use client";

import { useEffect, useMemo, useState } from "react";

import { StarIcon } from "@/components/icons";
import { PublicFooter } from "@/components/public/footer";
import {
  createReviewInDatabase,
  deleteReviewFromDatabase,
  fetchReviewsFromDatabase,
  ReviewItem,
  updateReviewInDatabase
} from "@/lib/admin-reviews";
import { PublicToast } from "@/components/ui/public-toast";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const PUBLIC_OWNED_REVIEW_KEY = "shipin_public_owned_reviews_v1";
const PUBLIC_REVIEW_TOKEN_KEY = "shipin_public_review_tokens_v1";
const ITEMS_PER_PAGE = 3;

function ReviewStars({ stars }: { stars: number }) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={`h-3.5 w-3.5 ${index < stars ? "text-[#0f8d50]" : "text-[#d9ddd8]"}`}
        />
      ))}
    </div>
  );
}

export function UlasanPage() {
  const [rows, setRows] = useState<ReviewItem[]>([]);
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ownedReviewIds, setOwnedReviewIds] = useState<string[]>([]);
  const [ownedReviewTokens, setOwnedReviewTokens] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingText, setEditingText] = useState("");
  const [editingStars, setEditingStars] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const reviews = await fetchReviewsFromDatabase(false);
        if (!active) return;
        setRows(reviews);
      } catch (error) {
        if (!active) return;
        setToastMessage(error instanceof Error ? error.message : "Gagal mengirim ulasan, silakan coba lagi");
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();
    try {
      const raw = window.localStorage.getItem(PUBLIC_OWNED_REVIEW_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setOwnedReviewIds(Array.isArray(parsed) ? parsed : []);

      const tokenRaw = window.localStorage.getItem(PUBLIC_REVIEW_TOKEN_KEY);
      const tokenParsed = tokenRaw ? (JSON.parse(tokenRaw) as Record<string, string>) : {};
      setOwnedReviewTokens(tokenParsed && typeof tokenParsed === "object" ? tokenParsed : {});
    } catch {
      setOwnedReviewIds([]);
      setOwnedReviewTokens({});
    }

    return () => {
      active = false;
    };
  }, []);

  const visibleRows = useMemo(() => rows.filter((row) => row.visible), [rows]);

  const displayedRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const searchedRows = keyword
      ? visibleRows.filter((row) => {
          return (
            row.name.toLowerCase().includes(keyword) ||
            row.text.toLowerCase().includes(keyword) ||
            row.meta.toLowerCase().includes(keyword)
          );
        })
      : visibleRows;
    const list = [...searchedRows];
    if (sort === "top") {
      return list.sort((a, b) => b.stars - a.stars);
    }
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [query, sort, visibleRows]);

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / ITEMS_PER_PAGE));
  const paginatedRows = displayedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const average = useMemo(() => {
    if (visibleRows.length === 0) return 0;
    const total = visibleRows.reduce((sum, row) => sum + row.stars, 0);
    return Number((total / visibleRows.length).toFixed(1));
  }, [visibleRows]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = {
      name: !name.trim() ? "Nama tidak boleh kosong" : "",
      text: !text.trim() ? "Ulasan tidak boleh kosong" : "",
      stars: stars <= 0 ? "Pilih rating terlebih dahulu" : ""
    };
    setFieldErrors(nextErrors);

    if (nextErrors.name || nextErrors.text || nextErrors.stars) {
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createReviewInDatabase(name.trim(), text.trim(), stars);
      setRows((current) => [created.review, ...current]);
      setCurrentPage(1);
      const createdId = created.review.id;
      const nextOwnedIds = [createdId, ...ownedReviewIds];
      const nextOwnedTokens = {
        ...ownedReviewTokens,
        [createdId]: created.reviewerToken
      };
      setOwnedReviewIds(nextOwnedIds);
      setOwnedReviewTokens(nextOwnedTokens);
      window.localStorage.setItem(PUBLIC_OWNED_REVIEW_KEY, JSON.stringify(nextOwnedIds));
      window.localStorage.setItem(PUBLIC_REVIEW_TOKEN_KEY, JSON.stringify(nextOwnedTokens));
      setName("");
      setText("");
      setStars(0);
      setFieldErrors({});
      setMessageTone("success");
      setMessage("Ulasan berhasil dikirim. Terima kasih atas masukan Anda.");
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Gagal mengirim ulasan, silakan coba lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartEdit(review: ReviewItem) {
    setEditingReviewId(review.id);
    setEditingName(review.name);
    setEditingText(review.text.replace(/^"|"$/g, ""));
    setEditingStars(review.stars);
    setMessage("");
  }

  function handleCancelEdit() {
    setEditingReviewId(null);
    setEditingName("");
    setEditingText("");
    setEditingStars(5);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingReviewId) return;
    if (!editingName.trim() || !editingText.trim()) {
      setMessageTone("error");
      setMessage("Nama dan pesan ulasan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedReview = await updateReviewInDatabase(editingReviewId, {
        name: editingName.trim(),
        stars: editingStars,
        text: editingText.trim(),
        reviewerToken: ownedReviewTokens[editingReviewId]
      });
      setRows((current) => current.map((review) => (review.id === editingReviewId ? updatedReview : review)));
      setCurrentPage(1);
      handleCancelEdit();
      setMessageTone("success");
      setMessage("Ulasan berhasil diperbarui.");
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Gagal mengirim ulasan, silakan coba lagi");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteReview(id: string) {
    try {
      await deleteReviewFromDatabase(id, ownedReviewTokens[id]);
      setRows((current) => current.filter((review) => review.id !== id));
      setCurrentPage(1);
      const nextOwnedIds = ownedReviewIds.filter((item) => item !== id);
      const nextOwnedTokens = { ...ownedReviewTokens };
      delete nextOwnedTokens[id];
      setOwnedReviewIds(nextOwnedIds);
      setOwnedReviewTokens(nextOwnedTokens);
      window.localStorage.setItem(PUBLIC_OWNED_REVIEW_KEY, JSON.stringify(nextOwnedIds));
      window.localStorage.setItem(PUBLIC_REVIEW_TOKEN_KEY, JSON.stringify(nextOwnedTokens));
      if (editingReviewId === id) {
        handleCancelEdit();
      }
      setMessageTone("success");
      setMessage("Ulasan berhasil dihapus.");
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Gagal mengirim ulasan, silakan coba lagi");
    }
  }

  return (
    <main>
      <ScrollReveal />
      <section className="shell py-10 lg:py-14">
        <div className="mx-auto max-w-[1040px]">
          <div className="grid gap-5 lg:grid-cols-[1fr_310px] lg:items-end">
            <div className="reveal-on-scroll">
              <h1 className="max-w-[650px] text-[42px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#1f2622] sm:text-[58px]">
                Apa Kata Mereka Tentang
                <span className="text-[#127840]"> SHIPIN GO ?</span>
              </h1>
              <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-[#6e766f] sm:text-[15px]">
                Kepercayaan Anda adalah prioritas kami. Kami bangga telah membantu ribuan bisnis
                mengirimkan paket dengan aman dan tepat waktu ke seluruh penjuru negeri.
              </p>
            </div>

            <article className="reveal-on-scroll reveal-delay-1 rounded-[18px] border border-[#e4e8e3] bg-[#f8faf7] px-6 py-6 text-center shadow-[0_12px_26px_rgba(173,183,168,0.14)]">
              <p className="text-[52px] font-black leading-none tracking-[-0.04em] text-[#0f8148]">
                {average}
                <span className="text-[28px] text-[#4d5a52]">/5.0</span>
              </p>
              <p className="mt-3 text-[12px] font-medium text-[#636f67]">
                Berdasarkan {visibleRows.length}+ ulasan terverifikasi
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
            <article className="reveal-on-scroll rounded-[20px] border border-[#e4e8e3] bg-[#f8faf7] p-5 shadow-[0_14px_28px_rgba(173,183,168,0.14)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[31px] font-extrabold tracking-[-0.03em] text-[#2c352f]">
                  Ulasan Terbaru
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSort("latest");
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                      sort === "latest" ? "bg-[#e4f4e5] text-[#126b39]" : "text-[#657068]"
                    }`}
                  >
                    Terbaru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSort("top");
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                      sort === "top" ? "bg-[#e4f4e5] text-[#126b39]" : "text-[#657068]"
                    }`}
                  >
                    Terpopuler
                  </button>
                </div>
              </div>

              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, isi ulasan, atau transaksi..."
                className="mt-4 h-10 w-full rounded-[12px] border border-[#e0e6df] bg-white px-3 text-[13px] text-[#324039] outline-none placeholder:text-[#9aa39b]"
              />

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="rounded-[16px] border border-dashed border-[#d7dfd7] bg-white px-4 py-6 text-center">
                    <p className="text-[13px] font-semibold text-[#657068]">Memuat ulasan dari database...</p>
                  </div>
                ) : null}
                {!loading && paginatedRows.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#d7dfd7] bg-white px-4 py-6 text-center">
                    <p className="text-[13px] font-semibold text-[#657068]">Belum ada ulasan yang cocok.</p>
                  </div>
                ) : null}
                {paginatedRows.map((review) => (
                  <article key={review.id} className="rounded-[16px] border border-[#e8ece7] bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold leading-none text-[#28342d]">{review.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#788178]">Pelanggan aktif</p>
                      </div>
                      <ReviewStars stars={review.stars} />
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-[#5f6a62]">{review.text}</p>
                    {ownedReviewIds.includes(review.id) ? (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(review)}
                          className="inline-flex h-8 items-center justify-center rounded-full border border-[#b8dec1] px-3 text-[11px] font-semibold text-[#1a7a44]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="inline-flex h-8 items-center justify-center rounded-full border border-[#f3c9c9] px-3 text-[11px] font-semibold text-[#b54545]"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-col items-center gap-3 text-[12px] font-semibold text-[#657068] sm:flex-row sm:justify-between">
                <p>
                  Menampilkan {paginatedRows.length} dari {displayedRows.length} ulasan
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6ddd5] text-[13px] text-[#58665d] transition-all disabled:cursor-not-allowed disabled:opacity-35 hover:border-[#8fd797] hover:bg-[#eefaf0]"
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
                            ? "bg-[#0f8d50] text-white shadow-[0_4px_12px_rgba(15,141,80,0.25)]"
                            : "border border-[#d6ddd5] text-[#58665d] hover:border-[#8fd797] hover:bg-[#eefaf0]"
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6ddd5] text-[#58665d] transition-all disabled:cursor-not-allowed disabled:opacity-35 hover:border-[#8fd797] hover:bg-[#eefaf0]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>

            <aside className="reveal-on-scroll reveal-delay-1 rounded-[20px] border border-[#e4e8e3] bg-[#f8faf7] p-5 shadow-[0_14px_28px_rgba(173,183,168,0.14)] sm:p-6">
              <h3 className="text-[28px] font-extrabold tracking-[-0.03em] text-[#2d362f]">
                {editingReviewId ? "Edit Ulasan" : "Kirim Ulasan"}
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-[#6f786f]">
                {editingReviewId
                  ? "Perbarui ulasan Anda sebelum disimpan."
                  : "Bagikan pengalaman pengiriman Anda untuk membantu pelanggan lainnya."}
              </p>

              <form className="mt-4 space-y-3" onSubmit={editingReviewId ? handleSaveEdit : handleSubmit}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#49524c]">Beri Rating</p>
                  <div className="mt-1.5 flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          type="button"
                          key={value}
                          onClick={() => {
                            if (editingReviewId) {
                              setEditingStars(value);
                              return;
                            }
                            setStars(value);
                            if (fieldErrors.stars) {
                              setFieldErrors((current) => ({ ...current, stars: "" }));
                            }
                          }}
                          className="text-[#0f8d50]"
                        >
                          <StarIcon
                            className={`h-4 w-4 ${
                              value <= (editingReviewId ? editingStars : stars) ? "opacity-100" : "opacity-25"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {!editingReviewId && fieldErrors.stars ? (
                    <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.stars}</p>
                  ) : null}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#49524c]">
                    Nama Lengkap
                  </label>
                  <input
                    value={editingReviewId ? editingName : name}
                    onChange={(event) => {
                      if (editingReviewId) {
                        setEditingName(event.target.value);
                        return;
                      }
                      setName(event.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((current) => ({
                          ...current,
                          name: event.target.value.trim() ? "" : "Nama tidak boleh kosong"
                        }));
                      }
                    }}
                    onBlur={(event) => {
                      if (!editingReviewId) {
                        setFieldErrors((current) => ({
                          ...current,
                          name: event.target.value.trim() ? "" : "Nama tidak boleh kosong"
                        }));
                      }
                    }}
                    className="mt-1.5 h-10 w-full rounded-[10px] border border-[#e0e6df] bg-[#f1f4ef] px-3 text-[13px] text-[#324039] outline-none"
                    placeholder="Masukkan nama Anda"
                  />
                  {!editingReviewId && fieldErrors.name ? (
                    <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#49524c]">
                    Pesan Ulasan
                  </label>
                  <textarea
                    value={editingReviewId ? editingText : text}
                    onChange={(event) => {
                      if (editingReviewId) {
                        setEditingText(event.target.value);
                        return;
                      }
                      setText(event.target.value);
                      if (fieldErrors.text) {
                        setFieldErrors((current) => ({
                          ...current,
                          text: event.target.value.trim() ? "" : "Ulasan tidak boleh kosong"
                        }));
                      }
                    }}
                    onBlur={(event) => {
                      if (!editingReviewId) {
                        setFieldErrors((current) => ({
                          ...current,
                          text: event.target.value.trim() ? "" : "Ulasan tidak boleh kosong"
                        }));
                      }
                    }}
                    rows={4}
                    className="mt-1.5 w-full resize-none rounded-[10px] border border-[#e0e6df] bg-[#f1f4ef] px-3 py-2.5 text-[13px] text-[#324039] outline-none"
                    placeholder="Ceritakan pengalaman Anda..."
                  />
                  {!editingReviewId && fieldErrors.text ? (
                    <p className="mt-2 text-[12px] font-medium text-[#b42318]">{fieldErrors.text}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#168049] to-[#12a662] text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(21,143,82,0.3)]"
                  >
                    {isSubmitting ? "Menyimpan..." : editingReviewId ? "Simpan Perubahan" : "Kirim Ulasan"}
                  </button>
                  {editingReviewId ? (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[#d6ddd5] text-[13px] font-semibold text-[#58665d]"
                    >
                      Batal
                    </button>
                  ) : null}
                </div>

                {message ? (
                  <p className={`text-[12px] font-medium ${messageTone === "error" ? "text-[#b42318]" : "text-[#1a7d45]"}`}>
                    {message}
                  </p>
                ) : null}
              </form>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#778178]">
                <div className="flex -space-x-2">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="inline-block h-6 w-6 rounded-full border-2 border-[#f8faf7] bg-[#2c3a32]"
                    />
                  ))}
                </div>
                12 ulasan baru hari ini
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PublicFooter />
      {toastMessage ? <PublicToast message={toastMessage} /> : null}
    </main>
  );
}
