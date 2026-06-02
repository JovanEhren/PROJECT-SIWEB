type PublicToastProps = {
  message: string;
  tone?: "error" | "success";
};

export function PublicToast({ message, tone = "error" }: PublicToastProps) {
  const isError = tone === "error";

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 rounded-[18px] border bg-white px-4 py-3 shadow-[0_18px_36px_rgba(35,61,42,0.18)]">
      <p
        className={`text-[13px] font-semibold ${
          isError ? "text-[#b42318]" : "text-[#1a7d45]"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
