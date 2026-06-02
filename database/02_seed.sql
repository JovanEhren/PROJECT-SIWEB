INSERT INTO shipin_users (id, full_name, email, username, phone, role, account_status, password_hash)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin Shipin', 'admin@shipingo.id', 'adminship1', '0215007447', 'ADMIN', 'AKTIF', '$2b$10$fmOwzlcpl5ZnRLCgRycDtO7A9J/7uhJbkOTLJ3O74gAzUORGHYZYe'),
  ('22222222-2222-2222-2222-222222222221', 'Budi Santoso', 'budi.santoso@mail.id', NULL, '081200000001', 'CUSTOMER', 'AKTIF', 'hashed_customer_budi'),
  ('22222222-2222-2222-2222-222222222222', 'Siti Aminah', 'siti.aminah@mail.id', NULL, '081300000001', 'CUSTOMER', 'AKTIF', 'hashed_customer_siti'),
  ('22222222-2222-2222-2222-222222222223', 'Rina Kartika', 'rina.kartika@mail.id', NULL, '081300000002', 'CUSTOMER', 'AKTIF', 'hashed_customer_rina'),
  ('22222222-2222-2222-2222-222222222224', 'Dimas Prakoso', 'dimas.prakoso@mail.id', NULL, '081300000003', 'CUSTOMER', 'AKTIF', 'hashed_customer_dimas'),
  ('22222222-2222-2222-2222-222222222225', 'Laras Wulandari', 'laras.wulandari@mail.id', NULL, '081300000004', 'CUSTOMER', 'AKTIF', 'hashed_customer_laras'),
  ('22222222-2222-2222-2222-222222222226', 'Maya Putri', 'maya.putri@mail.id', NULL, '081300000005', 'CUSTOMER', 'AKTIF', 'hashed_customer_maya'),
  ('33333333-3333-3333-3333-333333333331', 'Andi Kurir', 'andi.kurir@shipingo.id', NULL, '081211112222', 'COURIER', 'AKTIF', 'hashed_courier_andi'),
  ('33333333-3333-3333-3333-333333333332', 'Fajar Kurir', 'fajar.kurir@shipingo.id', NULL, '081211112223', 'COURIER', 'AKTIF', 'hashed_courier_fajar'),
  ('33333333-3333-3333-3333-333333333333', 'Nadia Kurir', 'nadia.kurir@shipingo.id', NULL, '081211112224', 'COURIER', 'AKTIF', 'hashed_courier_nadia')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status,
  password_hash = EXCLUDED.password_hash;

INSERT INTO shipin_addresses (id, user_id, label, city, province, postal_code, detail_address, is_primary)
VALUES
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 'Rumah', 'Jakarta Selatan', 'DKI Jakarta', '12190', 'Jl. Mampang Prapatan No. 15', TRUE),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Rumah', 'Surabaya', 'Jawa Timur', '60231', 'Jl. Darmo Permai Blok B1', TRUE),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'Base Kurir', 'Surabaya', 'Jawa Timur', '60119', 'Hub SHIPIN GO Surabaya', TRUE),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222223', 'Toko', 'Bandung', 'Jawa Barat', '40115', 'Jl. Asia Afrika No. 88', TRUE),
  ('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222224', 'Gudang', 'Medan', 'Sumatera Utara', '20112', 'Jl. Gatot Subroto No. 41', TRUE),
  ('44444444-4444-4444-4444-444444444446', '22222222-2222-2222-2222-222222222225', 'Kantor', 'Yogyakarta', 'DI Yogyakarta', '55281', 'Jl. Kaliurang Km 5', TRUE),
  ('44444444-4444-4444-4444-444444444447', '22222222-2222-2222-2222-222222222226', 'Rumah', 'Denpasar', 'Bali', '80234', 'Jl. Teuku Umar No. 9', TRUE),
  ('44444444-4444-4444-4444-444444444448', '33333333-3333-3333-3333-333333333332', 'Base Kurir', 'Jakarta Timur', 'DKI Jakarta', '13410', 'Hub SHIPIN GO Jakarta Timur', TRUE),
  ('44444444-4444-4444-4444-444444444449', '33333333-3333-3333-3333-333333333333', 'Base Kurir', 'Bandung', 'Jawa Barat', '40132', 'Hub SHIPIN GO Bandung', TRUE),
  ('44444444-4444-4444-4444-444444444450', '22222222-2222-2222-2222-222222222221', 'Gudang UMKM', 'Bekasi', 'Jawa Barat', '17113', 'Jl. Ahmad Yani No. 20', FALSE)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  label = EXCLUDED.label,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  postal_code = EXCLUDED.postal_code,
  detail_address = EXCLUDED.detail_address,
  is_primary = EXCLUDED.is_primary;

INSERT INTO shipin_shipping_services (id, code, display_name, description, eta_min_days, eta_max_days, price_multiplier)
VALUES
  (1, 'REGULER', 'Layanan Reguler', 'Keseimbangan terbaik antara harga dan kecepatan.', 2, 3, 1.00),
  (2, 'EKSPRES', 'Layanan Express', 'Pengiriman prioritas untuk kebutuhan mendesak.', 1, 1, 1.55),
  (3, 'HEMAT', 'Layanan Hemat', 'Pengiriman ekonomis untuk paket non-prioritas.', 4, 7, 0.72),
  (4, 'SAME_DAY', 'Same Day', 'Paket tiba di hari yang sama untuk kota tertentu.', 0, 1, 2.10),
  (5, 'NEXT_DAY', 'Next Day', 'Pengiriman esok hari untuk jalur utama.', 1, 1, 1.35),
  (6, 'CARGO', 'Cargo Besar', 'Layanan barang besar dan berat.', 3, 6, 0.90),
  (7, 'COLD_CHAIN', 'Cold Chain', 'Pengiriman suhu terkontrol.', 1, 3, 2.35),
  (8, 'INSTANT', 'Instant City', 'Pengiriman cepat dalam kota.', 0, 1, 2.60),
  (9, 'ECONOMY_INTERCITY', 'Ekonomi Antar Kota', 'Tarif rendah untuk antarkota.', 5, 9, 0.65),
  (10, 'DOCUMENT', 'Document Priority', 'Prioritas untuk dokumen penting.', 1, 2, 1.25)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  eta_min_days = EXCLUDED.eta_min_days,
  eta_max_days = EXCLUDED.eta_max_days,
  price_multiplier = EXCLUDED.price_multiplier;

SELECT setval(pg_get_serial_sequence('shipin_shipping_services', 'id'), GREATEST((SELECT MAX(id) FROM shipin_shipping_services), 1), true);

INSERT INTO shipin_package_categories (id, code, display_name, description, base_insurance_rate)
VALUES
  (1, 'DOC', 'Dokumen', 'Surat, kontrak, dan arsip ringan.', 0.0010),
  (2, 'FASHION', 'Fashion', 'Pakaian, sepatu, dan aksesori.', 0.0015),
  (3, 'ELECTRONIC', 'Elektronik', 'Perangkat elektronik bernilai tinggi.', 0.0040),
  (4, 'FOOD_DRY', 'Makanan Kering', 'Makanan kemasan non-cair.', 0.0020),
  (5, 'COSMETIC', 'Kosmetik', 'Produk perawatan dan kecantikan.', 0.0025),
  (6, 'MEDICAL', 'Perlengkapan Medis', 'Alat kesehatan non-obat keras.', 0.0030),
  (7, 'BOOK', 'Buku', 'Buku dan materi cetak.', 0.0010),
  (8, 'SPAREPART', 'Suku Cadang', 'Komponen otomotif dan mesin kecil.', 0.0028),
  (9, 'FURNITURE_SMALL', 'Furnitur Kecil', 'Perabot kecil dan dekorasi rumah.', 0.0035),
  (10, 'FROZEN', 'Frozen Food', 'Produk beku dengan kebutuhan suhu khusus.', 0.0050)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_insurance_rate = EXCLUDED.base_insurance_rate;

SELECT setval(pg_get_serial_sequence('shipin_package_categories', 'id'), GREATEST((SELECT MAX(id) FROM shipin_package_categories), 1), true);

INSERT INTO shipin_hubs (id, code, hub_name, city, province, address, lat, lng)
VALUES
  (1, 'JKT-CG', 'Jakarta Central Gateway', 'Jakarta Pusat', 'DKI Jakarta', 'Jl. Kramat Raya No. 10', -6.186486, 106.834091),
  (2, 'JKT-TM', 'Jakarta Timur Hub', 'Jakarta Timur', 'DKI Jakarta', 'Jl. Pemuda No. 77', -6.193125, 106.880875),
  (3, 'BDG-MN', 'Bandung Main Hub', 'Bandung', 'Jawa Barat', 'Jl. Soekarno Hatta No. 120', -6.917464, 107.619123),
  (4, 'SBY-WH', 'Surabaya Warehouse', 'Surabaya', 'Jawa Timur', 'Jl. Margomulyo No. 55', -7.257472, 112.752088),
  (5, 'MDN-GT', 'Medan Gateway', 'Medan', 'Sumatera Utara', 'Jl. Gatot Subroto No. 30', 3.595196, 98.672223),
  (6, 'YGY-DC', 'Yogyakarta Distribution Center', 'Yogyakarta', 'DI Yogyakarta', 'Jl. Magelang Km 7', -7.795580, 110.369490),
  (7, 'DPS-BL', 'Denpasar Bali Hub', 'Denpasar', 'Bali', 'Jl. Gatot Subroto Barat No. 99', -8.670458, 115.212629),
  (8, 'SMG-TR', 'Semarang Transit Hub', 'Semarang', 'Jawa Tengah', 'Jl. Kaligawe No. 11', -6.966667, 110.416664),
  (9, 'MKS-EA', 'Makassar East Hub', 'Makassar', 'Sulawesi Selatan', 'Jl. Perintis Kemerdekaan No. 21', -5.147665, 119.432732),
  (10, 'PLG-SM', 'Palembang Sumatra Hub', 'Palembang', 'Sumatera Selatan', 'Jl. Demang Lebar Daun No. 8', -2.990934, 104.756554)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  hub_name = EXCLUDED.hub_name,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

SELECT setval(pg_get_serial_sequence('shipin_hubs', 'id'), GREATEST((SELECT MAX(id) FROM shipin_hubs), 1), true);

INSERT INTO shipin_vehicles (id, vehicle_name, plate_number, vehicle_type, capacity_kg, vehicle_status, home_hub_id)
VALUES
  (1, 'SGO Van Jakarta 01', 'B 1201 SGO', 'Van', 850, 'AKTIF', 1),
  (2, 'SGO Motor Jakarta 02', 'B 2202 SGO', 'Motor Box', 80, 'AKTIF', 2),
  (3, 'SGO Van Bandung 03', 'D 3303 SGO', 'Van', 900, 'AKTIF', 3),
  (4, 'SGO Truck Surabaya 04', 'L 4404 SGO', 'Truck Engkel', 2200, 'AKTIF', 4),
  (5, 'SGO Truck Medan 05', 'BK 5505 SGO', 'Truck Box', 2500, 'AKTIF', 5),
  (6, 'SGO Van Yogyakarta 06', 'AB 6606 SGO', 'Van', 780, 'AKTIF', 6),
  (7, 'SGO Motor Denpasar 07', 'DK 7707 SGO', 'Motor Box', 75, 'AKTIF', 7),
  (8, 'SGO Truck Semarang 08', 'H 8808 SGO', 'Truck Engkel', 2100, 'AKTIF', 8),
  (9, 'SGO Van Makassar 09', 'DD 9909 SGO', 'Van', 880, 'MAINTENANCE', 9),
  (10, 'SGO Truck Palembang 10', 'BG 1010 SGO', 'Truck Box', 2600, 'AKTIF', 10)
ON CONFLICT (id) DO UPDATE SET
  vehicle_name = EXCLUDED.vehicle_name,
  plate_number = EXCLUDED.plate_number,
  vehicle_type = EXCLUDED.vehicle_type,
  capacity_kg = EXCLUDED.capacity_kg,
  vehicle_status = EXCLUDED.vehicle_status,
  home_hub_id = EXCLUDED.home_hub_id;

SELECT setval(pg_get_serial_sequence('shipin_vehicles', 'id'), GREATEST((SELECT MAX(id) FROM shipin_vehicles), 1), true);

INSERT INTO shipin_handling_tags (id, code, display_name, description)
VALUES
  (1, 'FRAGILE', 'Fragile', 'Butuh penanganan hati-hati.'),
  (2, 'KEEP_DRY', 'Keep Dry', 'Jaga paket tetap kering.'),
  (3, 'THIS_SIDE_UP', 'This Side Up', 'Paket harus tetap pada orientasi tertentu.'),
  (4, 'HIGH_VALUE', 'High Value', 'Barang bernilai tinggi.'),
  (5, 'COLD_STORAGE', 'Cold Storage', 'Butuh penyimpanan dingin.'),
  (6, 'DOCUMENT_ONLY', 'Document Only', 'Khusus dokumen dan arsip.'),
  (7, 'HEAVY', 'Heavy', 'Barang berat.'),
  (8, 'FAST_SORT', 'Fast Sort', 'Prioritas sortir cepat.'),
  (9, 'LIQUID_SAFE', 'Liquid Safe', 'Perlu perlindungan cairan.'),
  (10, 'RETURNABLE_BOX', 'Returnable Box', 'Kemasan perlu dikembalikan.')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

SELECT setval(pg_get_serial_sequence('shipin_handling_tags', 'id'), GREATEST((SELECT MAX(id) FROM shipin_handling_tags), 1), true);

INSERT INTO shipin_shipments (
  id, resi_code, customer_id, courier_id, service_id, origin_address_id, destination_address_id,
  package_category_id, origin_hub_id, destination_hub_id, vehicle_id, receiver_name, receiver_phone,
  package_type, item_status, item_note, weight_kg, length_cm, width_cm, height_cm, total_amount, payment_status,
  shipment_status, created_at, estimated_arrival_at, delivered_at
)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'SPG-99281-ID', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', 2, '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442', 1, 1, 4, 4, 'Siti Aminah', '081300000001', 'Dokumen Kontrak', 'DIPROSES', 'Dokumen kontrak tidak boleh dilipat.', 2.50, 35, 25, 15, 1450000, 'LUNAS', 'DALAM_PERJALANAN', '2026-04-20 08:00:00+07', '2026-04-21 20:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555552', 'SPG-88172-ID', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 1, '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444441', 2, 4, 1, 1, 'Budi Santoso', '081200000001', 'Barang Retail', 'PENDING', 'Barang retail menunggu pembayaran.', 6.40, 60, 40, 45, 5200000, 'BELUM_BAYAR', 'DIJADWALKAN', '2026-04-20 09:10:00+07', '2026-04-23 18:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555553', 'SPG-10453-ID', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', 5, '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444445', 3, 3, 5, 5, 'Dimas Prakoso', '081300000003', 'Elektronik Toko', 'SELESAI', 'Elektronik sudah diterima dengan aman.', 4.20, 40, 30, 22, 2750000, 'LUNAS', 'SAMPAI', '2026-04-18 10:30:00+07', '2026-04-19 18:00:00+07', '2026-04-19 16:45:00+07'),
  ('55555555-5555-5555-5555-555555555554', 'SPG-20454-ID', '22222222-2222-2222-2222-222222222224', '33333333-3333-3333-3333-333333333331', 6, '44444444-4444-4444-4444-444444444445', '44444444-4444-4444-4444-444444444446', 8, 5, 6, 6, 'Laras Wulandari', '081300000004', 'Suku Cadang Mesin', 'DALAM_PENGIRIMAN', 'Suku cadang masuk jalur cargo darat.', 18.75, 80, 55, 50, 6800000, 'LUNAS', 'DALAM_PERJALANAN', '2026-04-19 11:15:00+07', '2026-04-24 17:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555555', 'SPG-30455-ID', '22222222-2222-2222-2222-222222222225', '33333333-3333-3333-3333-333333333332', 3, '44444444-4444-4444-4444-444444444446', '44444444-4444-4444-4444-444444444447', 7, 6, 7, 7, 'Maya Putri', '081300000005', 'Buku Pelatihan', 'PENDING', 'Menunggu jadwal pickup.', 5.00, 45, 35, 20, 980000, 'BELUM_BAYAR', 'DIJADWALKAN', '2026-04-20 12:25:00+07', '2026-04-27 18:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555556', 'SPG-40456-ID', '22222222-2222-2222-2222-222222222226', '33333333-3333-3333-3333-333333333333', 7, '44444444-4444-4444-4444-444444444447', '44444444-4444-4444-4444-444444444444', 10, 7, 3, 3, 'Rina Kartika', '081300000002', 'Frozen Food', 'DALAM_PENGIRIMAN', 'Box pendingin harus dijaga tertutup.', 9.30, 50, 42, 38, 4300000, 'LUNAS', 'DALAM_PERJALANAN', '2026-04-20 13:00:00+07', '2026-04-22 12:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555557', 'SPG-50457-ID', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', 4, '44444444-4444-4444-4444-444444444450', '44444444-4444-4444-4444-444444444448', 5, 2, 2, 2, 'Fajar Kurir', '081211112223', 'Kosmetik Same Day', 'SELESAI', 'Paket kosmetik terkirim same day.', 1.80, 25, 18, 12, 210000, 'LUNAS', 'SAMPAI', '2026-04-17 07:45:00+07', '2026-04-17 20:00:00+07', '2026-04-17 19:10:00+07'),
  ('55555555-5555-5555-5555-555555555558', 'SPG-60458-ID', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', 8, '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444443', 4, 4, 4, 4, 'Andi Kurir', '081211112222', 'Makanan Kering Instan', 'SELESAI', 'Makanan kering dikirim dalam kota.', 2.10, 30, 24, 18, 185000, 'LUNAS', 'SAMPAI', '2026-04-16 09:00:00+07', '2026-04-16 21:00:00+07', '2026-04-16 17:35:00+07'),
  ('55555555-5555-5555-5555-555555555559', 'SPG-70459-ID', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', 9, '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444447', 9, 3, 7, 10, 'Maya Putri', '081300000005', 'Dekorasi Rumah', 'PENDING', 'Barang dekorasi mudah pecah.', 7.80, 70, 40, 35, 1500000, 'BELUM_BAYAR', 'DIJADWALKAN', '2026-04-21 08:20:00+07', '2026-04-29 18:00:00+07', NULL),
  ('55555555-5555-5555-5555-555555555560', 'SPG-80460-ID', '22222222-2222-2222-2222-222222222224', '33333333-3333-3333-3333-333333333331', 10, '44444444-4444-4444-4444-444444444445', '44444444-4444-4444-4444-444444444441', 6, 5, 1, 8, 'Budi Santoso', '081200000001', 'Perlengkapan Medis', 'DALAM_PENGIRIMAN', 'Paket medis prioritas.', 3.40, 38, 28, 24, 1250000, 'LUNAS', 'DALAM_PERJALANAN', '2026-04-21 10:15:00+07', '2026-04-23 10:15:00+07', NULL)
ON CONFLICT (id) DO UPDATE SET
  resi_code = EXCLUDED.resi_code,
  customer_id = EXCLUDED.customer_id,
  courier_id = EXCLUDED.courier_id,
  service_id = EXCLUDED.service_id,
  origin_address_id = EXCLUDED.origin_address_id,
  destination_address_id = EXCLUDED.destination_address_id,
  package_category_id = EXCLUDED.package_category_id,
  origin_hub_id = EXCLUDED.origin_hub_id,
  destination_hub_id = EXCLUDED.destination_hub_id,
  vehicle_id = EXCLUDED.vehicle_id,
  receiver_name = EXCLUDED.receiver_name,
  receiver_phone = EXCLUDED.receiver_phone,
  package_type = EXCLUDED.package_type,
  item_status = EXCLUDED.item_status,
  item_note = EXCLUDED.item_note,
  weight_kg = EXCLUDED.weight_kg,
  length_cm = EXCLUDED.length_cm,
  width_cm = EXCLUDED.width_cm,
  height_cm = EXCLUDED.height_cm,
  total_amount = EXCLUDED.total_amount,
  payment_status = EXCLUDED.payment_status,
  shipment_status = EXCLUDED.shipment_status,
  created_at = EXCLUDED.created_at,
  estimated_arrival_at = EXCLUDED.estimated_arrival_at,
  delivered_at = EXCLUDED.delivered_at;

INSERT INTO shipin_payments (id, shipment_id, invoice_number, payment_method, amount, payment_status, paid_at, created_at)
VALUES
  ('99999999-9999-9999-9999-999999999951', '55555555-5555-5555-5555-555555555551', 'INV-SPG-99281', 'VA_BCA', 1450000, 'LUNAS', '2026-04-20 08:12:00+07', '2026-04-20 08:01:00+07'),
  ('99999999-9999-9999-9999-999999999952', '55555555-5555-5555-5555-555555555552', 'INV-SPG-88172', 'QRIS', 5200000, 'BELUM_BAYAR', NULL, '2026-04-20 09:11:00+07'),
  ('99999999-9999-9999-9999-999999999953', '55555555-5555-5555-5555-555555555553', 'INV-SPG-10453', 'VA_MANDIRI', 2750000, 'LUNAS', '2026-04-18 10:41:00+07', '2026-04-18 10:31:00+07'),
  ('99999999-9999-9999-9999-999999999954', '55555555-5555-5555-5555-555555555554', 'INV-SPG-20454', 'BANK_TRANSFER', 6800000, 'LUNAS', '2026-04-19 11:28:00+07', '2026-04-19 11:16:00+07'),
  ('99999999-9999-9999-9999-999999999955', '55555555-5555-5555-5555-555555555555', 'INV-SPG-30455', 'COD', 980000, 'BELUM_BAYAR', NULL, '2026-04-20 12:26:00+07'),
  ('99999999-9999-9999-9999-999999999956', '55555555-5555-5555-5555-555555555556', 'INV-SPG-40456', 'VA_BNI', 4300000, 'LUNAS', '2026-04-20 13:14:00+07', '2026-04-20 13:01:00+07'),
  ('99999999-9999-9999-9999-999999999957', '55555555-5555-5555-5555-555555555557', 'INV-SPG-50457', 'QRIS', 210000, 'LUNAS', '2026-04-17 07:50:00+07', '2026-04-17 07:46:00+07'),
  ('99999999-9999-9999-9999-999999999958', '55555555-5555-5555-5555-555555555558', 'INV-SPG-60458', 'E_WALLET', 185000, 'LUNAS', '2026-04-16 09:04:00+07', '2026-04-16 09:01:00+07'),
  ('99999999-9999-9999-9999-999999999959', '55555555-5555-5555-5555-555555555559', 'INV-SPG-70459', 'VA_BRI', 1500000, 'BELUM_BAYAR', NULL, '2026-04-21 08:21:00+07'),
  ('99999999-9999-9999-9999-999999999960', '55555555-5555-5555-5555-555555555560', 'INV-SPG-80460', 'VA_BCA', 1250000, 'LUNAS', '2026-04-21 10:20:00+07', '2026-04-21 10:16:00+07')
ON CONFLICT (id) DO UPDATE SET
  shipment_id = EXCLUDED.shipment_id,
  invoice_number = EXCLUDED.invoice_number,
  payment_method = EXCLUDED.payment_method,
  amount = EXCLUDED.amount,
  payment_status = EXCLUDED.payment_status,
  paid_at = EXCLUDED.paid_at,
  created_at = EXCLUDED.created_at;

INSERT INTO shipin_shipment_handling_tags (shipment_id, handling_tag_id, note)
VALUES
  ('55555555-5555-5555-5555-555555555551', 6, 'Dokumen kontrak tidak boleh dilipat.'),
  ('55555555-5555-5555-5555-555555555551', 8, 'Prioritas sortir.'),
  ('55555555-5555-5555-5555-555555555552', 2, 'Paket retail harus tetap kering.'),
  ('55555555-5555-5555-5555-555555555552', 7, 'Berat sedang.'),
  ('55555555-5555-5555-5555-555555555553', 1, 'Elektronik fragile.'),
  ('55555555-5555-5555-5555-555555555553', 4, 'Nilai barang tinggi.'),
  ('55555555-5555-5555-5555-555555555554', 7, 'Suku cadang berat.'),
  ('55555555-5555-5555-5555-555555555554', 3, 'Jaga orientasi paket.'),
  ('55555555-5555-5555-5555-555555555555', 2, 'Jaga buku tetap kering.'),
  ('55555555-5555-5555-5555-555555555555', 8, 'Sortir cepat untuk event pelatihan.'),
  ('55555555-5555-5555-5555-555555555556', 5, 'Butuh suhu dingin.'),
  ('55555555-5555-5555-5555-555555555556', 10, 'Box pendingin dikembalikan.'),
  ('55555555-5555-5555-5555-555555555557', 9, 'Produk cair aman.'),
  ('55555555-5555-5555-5555-555555555557', 4, 'Kosmetik bernilai tinggi.'),
  ('55555555-5555-5555-5555-555555555558', 2, 'Kemasan makanan harus kering.'),
  ('55555555-5555-5555-5555-555555555558', 8, 'Pengiriman instant.'),
  ('55555555-5555-5555-5555-555555555559', 1, 'Dekorasi mudah pecah.'),
  ('55555555-5555-5555-5555-555555555559', 3, 'Jangan dibalik.'),
  ('55555555-5555-5555-5555-555555555560', 4, 'Perlengkapan medis bernilai tinggi.'),
  ('55555555-5555-5555-5555-555555555560', 8, 'Prioritas sortir dokumen medis.')
ON CONFLICT (shipment_id, handling_tag_id) DO UPDATE SET
  note = EXCLUDED.note;

INSERT INTO shipin_tracking_events (shipment_id, event_status, description, location_label, lat, lng, occurred_at)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'Pesanan diterima', 'Pesanan telah dipindai dan masuk dalam sistem manifest utama.', 'Jakarta Selatan', -6.243000, 106.825000, '2026-04-20 08:05:00+07'),
  ('55555555-5555-5555-5555-555555555551', 'Diproses di warehouse', 'Sortir paket berdasarkan wilayah tujuan selesai dilakukan.', 'Jakarta Central Gateway', -6.186486, 106.834091, '2026-04-20 08:50:00+07'),
  ('55555555-5555-5555-5555-555555555551', 'Berangkat dari hub', 'Paket berangkat dari hub asal menuju fasilitas transit resmi.', 'Jakarta Hub', -6.210000, 106.845000, '2026-04-20 09:35:00+07'),
  ('55555555-5555-5555-5555-555555555551', 'Tiba di transit', 'Paket tiba di pusat transit dan siap diteruskan ke area tujuan.', 'Transit Semarang', -6.966700, 110.416700, '2026-04-20 13:10:00+07'),
  ('55555555-5555-5555-5555-555555555551', 'Sedang dikirim', 'Kurir sedang mengantar paket ke alamat penerima.', 'Area Surabaya', -7.265000, 112.734000, '2026-04-20 18:45:00+07'),
  ('55555555-5555-5555-5555-555555555552', 'Pesanan diterima', 'Pesanan diterima dan menunggu jadwal pickup.', 'Surabaya', -7.257500, 112.752100, '2026-04-20 09:20:00+07'),
  ('55555555-5555-5555-5555-555555555553', 'Pesanan diterima', 'Elektronik masuk antrean sortir.', 'Bandung Main Hub', -6.917464, 107.619123, '2026-04-18 10:35:00+07'),
  ('55555555-5555-5555-5555-555555555553', 'Berangkat dari hub', 'Paket berangkat ke Medan Gateway.', 'Bandung Main Hub', -6.917464, 107.619123, '2026-04-18 13:15:00+07'),
  ('55555555-5555-5555-5555-555555555553', 'Terkirim', 'Paket diterima oleh penerima.', 'Medan', 3.595196, 98.672223, '2026-04-19 16:45:00+07'),
  ('55555555-5555-5555-5555-555555555554', 'Pesanan diterima', 'Suku cadang masuk manifest cargo.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-19 11:25:00+07'),
  ('55555555-5555-5555-5555-555555555554', 'Diproses di warehouse', 'Paket ditempatkan pada zona heavy cargo.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-19 14:00:00+07'),
  ('55555555-5555-5555-5555-555555555554', 'Berangkat dari hub', 'Cargo berangkat ke Yogyakarta DC.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-20 06:30:00+07'),
  ('55555555-5555-5555-5555-555555555555', 'Pesanan diterima', 'Buku pelatihan menunggu pickup.', 'Yogyakarta', -7.795580, 110.369490, '2026-04-20 12:40:00+07'),
  ('55555555-5555-5555-5555-555555555556', 'Pesanan diterima', 'Frozen food masuk cold chain.', 'Denpasar Bali Hub', -8.670458, 115.212629, '2026-04-20 13:10:00+07'),
  ('55555555-5555-5555-5555-555555555556', 'Diproses di warehouse', 'Suhu box diverifikasi.', 'Denpasar Bali Hub', -8.670458, 115.212629, '2026-04-20 13:55:00+07'),
  ('55555555-5555-5555-5555-555555555556', 'Berangkat dari hub', 'Paket dingin menuju Bandung.', 'Denpasar Bali Hub', -8.670458, 115.212629, '2026-04-20 16:10:00+07'),
  ('55555555-5555-5555-5555-555555555557', 'Pesanan diterima', 'Kosmetik diterima kurir instant.', 'Jakarta Timur Hub', -6.193125, 106.880875, '2026-04-17 07:52:00+07'),
  ('55555555-5555-5555-5555-555555555557', 'Sedang dikirim', 'Kurir menuju alamat penerima.', 'Jakarta Timur', -6.193125, 106.880875, '2026-04-17 11:15:00+07'),
  ('55555555-5555-5555-5555-555555555557', 'Terkirim', 'Paket diterima penerima.', 'Jakarta Timur', -6.193125, 106.880875, '2026-04-17 19:10:00+07'),
  ('55555555-5555-5555-5555-555555555558', 'Pesanan diterima', 'Makanan kering masuk hub Surabaya.', 'Surabaya Warehouse', -7.257472, 112.752088, '2026-04-16 09:07:00+07'),
  ('55555555-5555-5555-5555-555555555558', 'Sedang dikirim', 'Kurir membawa paket menuju base penerima.', 'Surabaya', -7.257472, 112.752088, '2026-04-16 14:45:00+07'),
  ('55555555-5555-5555-5555-555555555558', 'Terkirim', 'Paket selesai diterima.', 'Surabaya', -7.257472, 112.752088, '2026-04-16 17:35:00+07'),
  ('55555555-5555-5555-5555-555555555559', 'Pesanan diterima', 'Dekorasi rumah menunggu pickup.', 'Bandung', -6.917464, 107.619123, '2026-04-21 08:35:00+07'),
  ('55555555-5555-5555-5555-555555555560', 'Pesanan diterima', 'Paket medis masuk document priority.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-21 10:21:00+07'),
  ('55555555-5555-5555-5555-555555555560', 'Diproses di warehouse', 'Paket medis disortir prioritas.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-21 11:00:00+07'),
  ('55555555-5555-5555-5555-555555555560', 'Berangkat dari hub', 'Paket medis menuju Jakarta.', 'Medan Gateway', 3.595196, 98.672223, '2026-04-21 14:30:00+07')
ON CONFLICT (shipment_id, event_status, occurred_at) DO NOTHING;

INSERT INTO shipin_reviews (id, shipment_id, customer_id, stars, review_text, is_visible, created_at)
VALUES
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222221', 5, 'Pengiriman sangat cepat dan kurir ramah. Paket sampai rapi tanpa kerusakan.', TRUE, '2026-04-21 09:20:00+07'),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', 3, 'Estimasi sedikit meleset, tapi paket aman. Tracking perlu ditingkatkan.', FALSE, '2026-04-21 10:10:00+07'),
  ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222223', 5, 'Elektronik sampai aman dan packing tetap rapi.', TRUE, '2026-04-20 08:30:00+07'),
  ('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222224', 4, 'Cargo berat diproses jelas, update tracking membantu.', TRUE, '2026-04-21 15:20:00+07'),
  ('66666666-6666-6666-6666-666666666665', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222225', 4, 'Harga hemat cocok untuk kiriman buku.', TRUE, '2026-04-21 16:00:00+07'),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555556', '22222222-2222-2222-2222-222222222226', 5, 'Cold chain informatif dan suhu box aman.', TRUE, '2026-04-21 17:15:00+07'),
  ('66666666-6666-6666-6666-666666666667', '55555555-5555-5555-5555-555555555557', '22222222-2222-2222-2222-222222222221', 5, 'Same day sangat membantu operasional harian.', TRUE, '2026-04-18 09:00:00+07'),
  ('66666666-6666-6666-6666-666666666668', '55555555-5555-5555-5555-555555555558', '22222222-2222-2222-2222-222222222222', 4, 'Paket makanan sampai cepat dan aman.', TRUE, '2026-04-17 08:20:00+07'),
  ('66666666-6666-6666-6666-666666666669', '55555555-5555-5555-5555-555555555559', '22222222-2222-2222-2222-222222222223', 3, 'Masih menunggu pickup, semoga estimasi sesuai.', FALSE, '2026-04-21 12:00:00+07'),
  ('66666666-6666-6666-6666-666666666670', '55555555-5555-5555-5555-555555555560', '22222222-2222-2222-2222-222222222224', 5, 'Pengiriman medis diprioritaskan dengan baik.', TRUE, '2026-04-21 18:10:00+07')
ON CONFLICT (id) DO UPDATE SET
  shipment_id = EXCLUDED.shipment_id,
  customer_id = EXCLUDED.customer_id,
  stars = EXCLUDED.stars,
  review_text = EXCLUDED.review_text,
  is_visible = EXCLUDED.is_visible,
  created_at = EXCLUDED.created_at;

INSERT INTO shipin_contact_messages (id, customer_id, sender_name, sender_email, subject, message_text, status, created_at, resolved_at)
VALUES
  ('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222221', 'Budi Santoso', 'budi.santoso@mail.id', 'Pengiriman Domestik', 'Mohon info kapan kurir sampai ke alamat penerima untuk resi SPG-99281-ID.', 'IN_PROGRESS', '2026-04-21 08:40:00+07', NULL),
  ('77777777-7777-7777-7777-777777777772', '22222222-2222-2222-2222-222222222223', 'Rina Kartika', 'rina.kartika@mail.id', 'Klaim & Refund', 'Saya ingin menanyakan prosedur klaim jika paket terlambat.', 'OPEN', '2026-04-21 11:15:00+07', NULL),
  ('77777777-7777-7777-7777-777777777773', '22222222-2222-2222-2222-222222222222', 'Siti Aminah', 'siti.aminah@mail.id', 'Ubah Alamat', 'Apakah alamat tujuan resi SPG-88172-ID masih bisa diperbarui?', 'OPEN', '2026-04-21 12:10:00+07', NULL),
  ('77777777-7777-7777-7777-777777777774', '22222222-2222-2222-2222-222222222224', 'Dimas Prakoso', 'dimas.prakoso@mail.id', 'Pembayaran', 'Invoice sudah dibayar, mohon update status pengiriman.', 'CLOSED', '2026-04-20 13:00:00+07', '2026-04-20 14:30:00+07'),
  ('77777777-7777-7777-7777-777777777775', '22222222-2222-2222-2222-222222222225', 'Laras Wulandari', 'laras.wulandari@mail.id', 'Asuransi Paket', 'Mohon informasi asuransi untuk kiriman buku dan dokumen.', 'CLOSED', '2026-04-20 15:15:00+07', '2026-04-20 16:00:00+07'),
  ('77777777-7777-7777-7777-777777777776', '22222222-2222-2222-2222-222222222226', 'Maya Putri', 'maya.putri@mail.id', 'Cold Chain', 'Apakah frozen food akan tetap menggunakan box pendingin?', 'IN_PROGRESS', '2026-04-21 09:05:00+07', NULL),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222221', 'Budi Santoso', 'budi.santoso@mail.id', 'Pickup Same Day', 'Saya ingin jadwal pickup lebih awal untuk pengiriman same day.', 'OPEN', '2026-04-21 13:40:00+07', NULL),
  ('77777777-7777-7777-7777-777777777778', '22222222-2222-2222-2222-222222222222', 'Siti Aminah', 'siti.aminah@mail.id', 'Bukti Terima', 'Mohon kirimkan bukti terima paket makanan kering.', 'CLOSED', '2026-04-17 10:10:00+07', '2026-04-17 11:00:00+07'),
  ('77777777-7777-7777-7777-777777777779', '22222222-2222-2222-2222-222222222223', 'Rina Kartika', 'rina.kartika@mail.id', 'Packing Fragile', 'Apakah dekorasi rumah saya diberi label fragile?', 'IN_PROGRESS', '2026-04-21 14:55:00+07', NULL),
  ('77777777-7777-7777-7777-777777777780', '22222222-2222-2222-2222-222222222224', 'Dimas Prakoso', 'dimas.prakoso@mail.id', 'Prioritas Medis', 'Mohon pastikan perlengkapan medis diprioritaskan.', 'OPEN', '2026-04-21 15:20:00+07', NULL)
ON CONFLICT (id) DO UPDATE SET
  customer_id = EXCLUDED.customer_id,
  sender_name = EXCLUDED.sender_name,
  sender_email = EXCLUDED.sender_email,
  subject = EXCLUDED.subject,
  message_text = EXCLUDED.message_text,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  resolved_at = EXCLUDED.resolved_at;

INSERT INTO shipin_shipping_rate_quotes (id, origin_city, destination_city, weight_kg, length_cm, width_cm, height_cm, selected_service_id, estimated_cost, created_at)
VALUES
  ('88888888-8888-8888-8888-888888888881', 'Jakarta', 'Surabaya', 2.50, 35, 25, 15, 1, 42300, '2026-04-21 08:00:00+07'),
  ('88888888-8888-8888-8888-888888888882', 'Bandung', 'Medan', 6.40, 60, 40, 45, 2, 112700, '2026-04-21 08:25:00+07'),
  ('88888888-8888-8888-8888-888888888883', 'Bandung', 'Denpasar', 7.80, 70, 40, 35, 9, 98000, '2026-04-21 09:00:00+07'),
  ('88888888-8888-8888-8888-888888888884', 'Medan', 'Yogyakarta', 18.75, 80, 55, 50, 6, 310000, '2026-04-21 09:30:00+07'),
  ('88888888-8888-8888-8888-888888888885', 'Yogyakarta', 'Denpasar', 5.00, 45, 35, 20, 3, 76000, '2026-04-21 10:00:00+07'),
  ('88888888-8888-8888-8888-888888888886', 'Denpasar', 'Bandung', 9.30, 50, 42, 38, 7, 220000, '2026-04-21 10:30:00+07'),
  ('88888888-8888-8888-8888-888888888887', 'Bekasi', 'Jakarta Timur', 1.80, 25, 18, 12, 4, 45000, '2026-04-21 11:00:00+07'),
  ('88888888-8888-8888-8888-888888888888', 'Surabaya', 'Surabaya', 2.10, 30, 24, 18, 8, 38000, '2026-04-21 11:30:00+07'),
  ('88888888-8888-8888-8888-888888888889', 'Medan', 'Jakarta', 3.40, 38, 28, 24, 10, 89000, '2026-04-21 12:00:00+07'),
  ('88888888-8888-8888-8888-888888888890', 'Jakarta', 'Makassar', 4.80, 42, 32, 28, 5, 135000, '2026-04-21 12:30:00+07')
ON CONFLICT (id) DO UPDATE SET
  origin_city = EXCLUDED.origin_city,
  destination_city = EXCLUDED.destination_city,
  weight_kg = EXCLUDED.weight_kg,
  length_cm = EXCLUDED.length_cm,
  width_cm = EXCLUDED.width_cm,
  height_cm = EXCLUDED.height_cm,
  selected_service_id = EXCLUDED.selected_service_id,
  estimated_cost = EXCLUDED.estimated_cost,
  created_at = EXCLUDED.created_at;
