BEGIN;

ALTER TABLE shipin_users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'AKTIF';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'shipin_users_username_key'
  ) THEN
    ALTER TABLE shipin_users
      ADD CONSTRAINT shipin_users_username_key UNIQUE (username);
  END IF;
END $$;

ALTER TABLE shipin_shipments
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES shipin_users(id);

UPDATE shipin_users
SET
  username = COALESCE(NULLIF(username, ''), 'adminship1'),
  account_status = COALESCE(NULLIF(account_status, ''), 'AKTIF'),
  password_hash = '$2b$10$fmOwzlcpl5ZnRLCgRycDtO7A9J/7uhJbkOTLJ3O74gAzUORGHYZYe'
WHERE role = 'ADMIN'
  AND id = '11111111-1111-1111-1111-111111111111';

UPDATE shipin_users
SET account_status = COALESCE(NULLIF(account_status, ''), 'AKTIF')
WHERE account_status IS NULL OR account_status = '';

UPDATE shipin_shipments
SET created_by_admin_id = '11111111-1111-1111-1111-111111111111'
WHERE created_by_admin_id IS NULL;

CREATE TABLE IF NOT EXISTS shipin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipin_shipments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES shipin_users(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipin_reviews_customer_id
  ON shipin_reviews (customer_id);

INSERT INTO shipin_reviews (id, shipment_id, customer_id, stars, review_text, is_visible, created_at)
SELECT
  '99999999-9999-9999-9999-999999999991',
  s.id,
  '22222222-2222-2222-2222-222222222221',
  5,
  'Pengiriman cepat dan admin responsif.',
  TRUE,
  NOW() - INTERVAL '14 days'
FROM shipin_shipments s
WHERE s.resi_code = 'SPG-99281-ID'
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipin_reviews (id, shipment_id, customer_id, stars, review_text, is_visible, created_at)
SELECT
  '99999999-9999-9999-9999-999999999992',
  s.id,
  '22222222-2222-2222-2222-222222222222',
  4,
  'Tracking jelas dan paket sampai aman.',
  TRUE,
  NOW() - INTERVAL '10 days'
FROM shipin_shipments s
WHERE s.resi_code = 'SPG-88172-ID'
ON CONFLICT (id) DO NOTHING;

COMMIT;
