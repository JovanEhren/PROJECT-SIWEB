BEGIN;

ALTER TABLE shipin_shipments
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS item_category TEXT;

UPDATE shipin_shipments
SET
  item_name = COALESCE(NULLIF(item_name, ''), package_type),
  item_category = COALESCE(NULLIF(item_category, ''), package_type)
WHERE item_name IS NULL
   OR item_name = ''
   OR item_category IS NULL
   OR item_category = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'riwayat_pengiriman_unique_resi_status'
  ) THEN
    ALTER TABLE riwayat_pengiriman
      ADD CONSTRAINT riwayat_pengiriman_unique_resi_status
      UNIQUE (resi_id, status);
  END IF;
END $$;

DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS revenue CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS shipping_rate_quotes CASCADE;
DROP TABLE IF EXISTS shipping_services CASCADE;
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS shipin_contact_messages CASCADE;
DROP TABLE IF EXISTS shipin_shipping_rate_quotes CASCADE;
DROP TABLE IF EXISTS shipin_shipment_handling_tags CASCADE;
DROP TABLE IF EXISTS shipin_handling_tags CASCADE;

COMMIT;
