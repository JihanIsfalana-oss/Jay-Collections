BEGIN;

ALTER TABLE design_categories
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(60),  -- Max 60 karakter untuk SERP
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160), -- Max 160 karakter untuk SERP
  ADD COLUMN IF NOT EXISTS og_image_url     TEXT;         -- 1200x630px Cloudinary URL

ALTER TABLE design_references
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(60),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160),
  ADD COLUMN IF NOT EXISTS og_image_url     TEXT;

COMMENT ON COLUMN design_categories.meta_title IS 'SEO title override. Jika NULL, gunakan name sebagai fallback.';
COMMENT ON COLUMN design_categories.meta_description IS 'SEO description override. Jika NULL, gunakan description sebagai fallback.';

COMMIT;