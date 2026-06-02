export type ReviewItem = {
  id: string;
  initials: string;
  name: string;
  stars: number;
  text: string;
  meta: string;
  visible: boolean;
  avatarBg: string;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw.slice(0, 180) || "Respons server tidak valid." };
    }
  }

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Request ulasan gagal.");
  }

  return data as T;
}

export async function fetchReviewsFromDatabase(includeHidden = false) {
  const response = await fetch(`/api/reviews${includeHidden ? "?includeHidden=1" : ""}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });
  const data = await parseJsonResponse<{ reviews: ReviewItem[] }>(response);
  return data.reviews;
}

export async function createReviewInDatabase(name: string, text: string, stars: number) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ name, text, stars })
  });
  return parseJsonResponse<{ review: ReviewItem; reviewerToken: string }>(response);
}

export async function updateReviewInDatabase(
  id: string,
  patch: { name?: string; text?: string; stars?: number; visible?: boolean; reviewerToken?: string }
) {
  const response = await fetch(`/api/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify(patch)
  });
  const data = await parseJsonResponse<{ review: ReviewItem }>(response);
  return data.review;
}

export async function deleteReviewFromDatabase(id: string, reviewerToken?: string) {
  const params = reviewerToken ? `?reviewerToken=${encodeURIComponent(reviewerToken)}` : "";
  const response = await fetch(`/api/reviews/${encodeURIComponent(id)}${params}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(10000)
  });
  await parseJsonResponse<{ ok: boolean }>(response);
}
