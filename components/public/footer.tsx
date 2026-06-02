export function PublicFooter() {
  return (
    <footer className="mt-8 bg-white/85">
      <div className="shell py-12">
        <div className="grid gap-10 border-b border-[#e8ebe4] pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div>
            <p className="text-[18px] font-extrabold tracking-[-0.03em] text-shipin-deep">SHIPIN GO</p>
            <p className="mt-5 max-w-[360px] text-[15px] leading-8 text-shipin-text">
              Solusi logistik terdepan di Indonesia. Menghubungkan orang dan bisnis melalui sistem
              pengiriman yang cerdas dan efisien.
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
  );
}
