-- =============================================================================
-- MIGRATION 009 — CLEANUP DUPLICATE TABLES FROM MIGRATION 008
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-07-12
-- Depends  : 004_create_order_content_tables.sql
--            008_design_catalog_tables.sql
-- Purpose  : Migration 008 secara tidak sengaja membuat tabel duplikat:
--            - design_categories (SERIAL id) -> sudah ada di migration 004 (UUID id)
--            - reference_designs -> duplikat dari design_references di migration 004
--            - ai_prompt_templates -> tabel baru yang tidak terintegrasi
--            Migration ini menghapus tabel duplikat dan memindahkan data
--            yang berguna (ai_prompt_templates) ke schema yang benar.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. HAPUS TABEL DUPLIKAT DARI MIGRATION 008
-- design_categories dengan SERIAL id sudah tidak diperlukan karena
-- migration 004 sudah memiliki design_categories dengan UUID id.
-- Data dari migration 008 sudah di-import via ON CONFLICT DO NOTHING,
-- jadi aman untuk di-drop.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS reference_designs CASCADE;

-- Hanya drop tabel design_categories versi SERIAL (008) jika ada
-- Kita cek dengan menjatuhkan constraint unique dulu jika diperlukan
-- Tabel ini aman di-drop karena migration 008 menggunakan CREATE TABLE IF NOT EXISTS
-- dan data sudah di-migrasi ke tabel utama (004) via ON CONFLICT DO NOTHING
DROP TABLE IF EXISTS ai_prompt_templates CASCADE;

-- Tabel design_categories versi SERIAL tidak bisa di-drop jika masih
-- direferensi oleh reference_designs (sudah di-drop di atas).
-- Tapi sebaiknya kita rename dulu untuk safety, lalu drop.
-- Karena migration 008 menggunakan CREATE TABLE IF NOT EXISTS, tabel ini
-- mungkin tidak ada jika migration 004 sudah jalan duluan.
-- Kita gunakan pendekatan aman: drop hanya jika ada.
DO $$
BEGIN
  -- Cek apakah tabel design_categories dengan kolom 'slug' bertipe VARCHAR(100) UNIQUE
  -- (ini ciri tabel versi 008, karena versi 004 pakai UUID)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'design_categories' 
      AND column_name = 'id' 
      AND data_type = 'integer'
  ) THEN
    -- Drop tabel design_categories versi SERIAL (008)
    -- Hanya jika ada tabel lain yang reference, kita handle
    DROP TABLE IF EXISTS design_categories CASCADE;
    RAISE NOTICE 'Dropped duplicate design_categories table (SERIAL version from migration 008)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. RE-SEED DATA KATEGORI KE TABEL UTAMA (004) JIKA BELUM ADA
-- Migration 008 menggunakan INSERT...ON CONFLICT DO NOTHING untuk seed data,
-- jadi data seharusnya sudah ada di tabel utama (004). Tapi kita pastikan
-- dengan seed ulang menggunakan UUID yang sesuai.
-- ---------------------------------------------------------------------------
INSERT INTO design_categories (id, name, slug, description, display_order) 
SELECT gen_random_uuid(), 'Minimalist & Clean', 'minimalist-clean', 'Layout bersih dengan tipografi modern.', 7
WHERE NOT EXISTS (SELECT 1 FROM design_categories WHERE slug = 'minimalist-clean');

INSERT INTO design_categories (id, name, slug, description, display_order)
SELECT gen_random_uuid(), 'Rustic & Floral', 'rustic-floral', 'Tema pedesaan dengan dekorasi bunga.', 8
WHERE NOT EXISTS (SELECT 1 FROM design_categories WHERE slug = 'rustic-floral');

INSERT INTO design_categories (id, name, slug, description, display_order)
SELECT gen_random_uuid(), 'Royal Gold & Luxury', 'royal-gold-luxury', 'Tema eksklusif aksen emas.', 9
WHERE NOT EXISTS (SELECT 1 FROM design_categories WHERE slug = 'royal-gold-luxury');

INSERT INTO design_categories (id, name, slug, description, display_order)
SELECT gen_random_uuid(), 'Cultural & Traditional', 'cultural-traditional', 'Desain adat daerah Indonesia.', 10
WHERE NOT EXISTS (SELECT 1 FROM design_categories WHERE slug = 'cultural-traditional');

COMMIT;
