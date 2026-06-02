# Active Neon Schema

Skema akhir yang aktif dipakai aplikasi per 31 Mei 2026:

- `shipin_users`
  Menyimpan akun pelanggan/admin yang direferensikan oleh shipment.
- `shipin_addresses`
  Menyimpan alamat asal dan tujuan yang terhubung ke user.
- `shipin_shipping_services`
  Master layanan pengiriman seperti reguler dan ekspres.
- `shipin_package_categories`
  Master kategori paket untuk kebutuhan klasifikasi shipment.
- `shipin_hubs`
  Master hub logistik dan titik home hub kendaraan.
- `shipin_vehicles`
  Master kendaraan yang bisa dipilih admin saat membuat shipment.
- `shipin_shipments`
  Tabel utama pengiriman: resi, pelanggan, penerima, nama barang, jenis barang, dimensi, berat, total, status, koordinat, dan relasi master lain.
- `shipin_payments`
  Detail pembayaran satu-ke-satu untuk setiap shipment.
- `shipin_tracking_events`
  Event tracking untuk progres pengiriman dan tampilan peta/lacak.
- `shipin_reviews`
  Sumber rating pengirim yang dibaca dinamis di halaman profile admin, admin ulasan, dan halaman ulasan publik.
- `riwayat_pengiriman`
  Timeline checkpoint histori untuk detail pelacakan.

Tabel berikut dianggap tidak aktif oleh codebase saat ini dan dibersihkan oleh `04_neon_sync_cleanup.sql`:

- Legacy non-prefix: `addresses`, `contact_messages`, `customers`, `invoices`, `revenue`, `reviews`, `shipments`, `shipping_rate_quotes`, `shipping_services`, `tracking_events`, `users`
- Fitur `shipin_*` yang tidak direferensikan runtime saat ini: `shipin_contact_messages`, `shipin_shipping_rate_quotes`, `shipin_shipment_handling_tags`, `shipin_handling_tags`
