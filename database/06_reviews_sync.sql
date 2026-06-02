BEGIN;

ALTER TABLE shipin_reviews
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_token TEXT;

UPDATE shipin_reviews r
SET reviewer_name = u.full_name
FROM shipin_users u
WHERE r.customer_id = u.id
  AND (r.reviewer_name IS NULL OR r.reviewer_name = '');

INSERT INTO shipin_users (id, full_name, email, username, phone, role, account_status, password_hash)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Public Reviewer',
  'public.reviewer@shipingo.local',
  'public-reviewer',
  NULL,
  'CUSTOMER',
  'AKTIF',
  'public_reviewer_placeholder'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status;

COMMIT;
