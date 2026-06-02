CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipin_user_role') THEN
    CREATE TYPE shipin_user_role AS ENUM ('ADMIN', 'CUSTOMER', 'COURIER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipin_payment_status') THEN
    CREATE TYPE shipin_payment_status AS ENUM ('LUNAS', 'BELUM_BAYAR');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipin_shipment_status') THEN
    CREATE TYPE shipin_shipment_status AS ENUM ('DIJADWALKAN', 'DALAM_PERJALANAN', 'SAMPAI');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipin_message_status') THEN
    CREATE TYPE shipin_message_status AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS shipin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  phone TEXT,
  role shipin_user_role NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'AKTIF',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipin_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES shipin_users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  detail_address TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipin_addresses_user_id
  ON shipin_addresses (user_id);

CREATE TABLE IF NOT EXISTS shipin_shipping_services (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  eta_min_days INT NOT NULL,
  eta_max_days INT NOT NULL,
  price_multiplier NUMERIC(6,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS shipin_package_categories (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  base_insurance_rate NUMERIC(6,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shipin_hubs (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  hub_name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6)
);

CREATE TABLE IF NOT EXISTS shipin_vehicles (
  id SMALLSERIAL PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  capacity_kg NUMERIC(10,2) NOT NULL CHECK (capacity_kg > 0),
  home_hub_id SMALLINT NOT NULL REFERENCES shipin_hubs(id)
);

ALTER TABLE shipin_vehicles
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_status TEXT NOT NULL DEFAULT 'AKTIF';

CREATE TABLE IF NOT EXISTS shipin_handling_tags (
  id SMALLSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipin_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resi_code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES shipin_users(id),
  courier_id UUID REFERENCES shipin_users(id),
  service_id SMALLINT NOT NULL REFERENCES shipin_shipping_services(id),
  origin_address_id UUID NOT NULL REFERENCES shipin_addresses(id),
  destination_address_id UUID NOT NULL REFERENCES shipin_addresses(id),
  package_type TEXT NOT NULL,
  weight_kg NUMERIC(8,2) NOT NULL CHECK (weight_kg > 0),
  length_cm NUMERIC(8,2),
  width_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
  payment_status shipin_payment_status NOT NULL DEFAULT 'BELUM_BAYAR',
  shipment_status shipin_shipment_status NOT NULL DEFAULT 'DIJADWALKAN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_arrival_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

ALTER TABLE shipin_shipments
  ADD COLUMN IF NOT EXISTS package_category_id SMALLINT REFERENCES shipin_package_categories(id),
  ADD COLUMN IF NOT EXISTS origin_hub_id SMALLINT REFERENCES shipin_hubs(id),
  ADD COLUMN IF NOT EXISTS destination_hub_id SMALLINT REFERENCES shipin_hubs(id),
  ADD COLUMN IF NOT EXISTS vehicle_id SMALLINT REFERENCES shipin_vehicles(id),
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES shipin_users(id),
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone TEXT,
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS item_category TEXT,
  ADD COLUMN IF NOT EXISTS item_status TEXT NOT NULL DEFAULT 'DIPROSES',
  ADD COLUMN IF NOT EXISTS item_note TEXT,
  ADD COLUMN IF NOT EXISTS koordinat_asal_lat NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS koordinat_asal_lng NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS koordinat_tujuan_lat NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS koordinat_tujuan_lng NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS waktu_berangkat BIGINT,
  ADD COLUMN IF NOT EXISTS durasi_estimasi_ms BIGINT;

CREATE INDEX IF NOT EXISTS idx_shipin_shipments_customer_id
  ON shipin_shipments (customer_id);

CREATE INDEX IF NOT EXISTS idx_shipin_shipments_service_id
  ON shipin_shipments (service_id);

CREATE INDEX IF NOT EXISTS idx_shipin_shipments_status
  ON shipin_shipments (shipment_status, payment_status);

CREATE TABLE IF NOT EXISTS shipin_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL UNIQUE REFERENCES shipin_shipments(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  payment_status shipin_payment_status NOT NULL DEFAULT 'BELUM_BAYAR',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipin_shipment_handling_tags (
  shipment_id UUID NOT NULL REFERENCES shipin_shipments(id) ON DELETE CASCADE,
  handling_tag_id SMALLINT NOT NULL REFERENCES shipin_handling_tags(id) ON DELETE RESTRICT,
  note TEXT,
  PRIMARY KEY (shipment_id, handling_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_shipin_shipment_handling_tags_tag_id
  ON shipin_shipment_handling_tags (handling_tag_id);

CREATE TABLE IF NOT EXISTS shipin_tracking_events (
  id BIGSERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipin_shipments(id) ON DELETE CASCADE,
  event_status TEXT NOT NULL,
  description TEXT NOT NULL,
  location_label TEXT NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shipin_tracking_events_shipment_time
  ON shipin_tracking_events (shipment_id, occurred_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shipin_tracking_events_shipment_status_time
  ON shipin_tracking_events (shipment_id, event_status, occurred_at);

CREATE TABLE IF NOT EXISTS riwayat_pengiriman (
  id SERIAL PRIMARY KEY,
  resi_id VARCHAR NOT NULL,
  waktu TIMESTAMP DEFAULT NOW(),
  status VARCHAR NOT NULL,
  deskripsi TEXT,
  lokasi VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_riwayat_pengiriman_resi_waktu
  ON riwayat_pengiriman (resi_id, waktu DESC);

CREATE TABLE IF NOT EXISTS shipin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipin_shipments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES shipin_users(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  reviewer_token TEXT,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipin_reviews_customer_id
  ON shipin_reviews (customer_id);

CREATE TABLE IF NOT EXISTS shipin_contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES shipin_users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status shipin_message_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shipin_shipping_rate_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  weight_kg NUMERIC(8,2) NOT NULL CHECK (weight_kg > 0),
  length_cm NUMERIC(8,2),
  width_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  selected_service_id SMALLINT REFERENCES shipin_shipping_services(id),
  estimated_cost NUMERIC(14,2) NOT NULL CHECK (estimated_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipin_shipping_rate_quotes_service_id
  ON shipin_shipping_rate_quotes (selected_service_id);
