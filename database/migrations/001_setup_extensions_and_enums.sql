-- =============================================================================
-- MIGRATION 001 — EXTENSIONS & ENUM TYPES
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-06-01
-- Purpose  : Initialize PostgreSQL extensions dan definisikan semua custom
--            ENUM types sebelum tabel apapun dibuat. Harus dijalankan PERTAMA.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
-- uuid-ossp  : Mengaktifkan fungsi gen_random_uuid() untuk primary key UUID.
--              UUID lebih aman dari integer ID karena tidak bisa di-enumerate
--              oleh attacker (tidak ada /users/1, /users/2, dst).
-- pgcrypto   : Digunakan untuk enkripsi token dan hashing tambahan jika dibutuhkan.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM: USER & AUTH DOMAIN
-- ---------------------------------------------------------------------------

-- Status subscription tier user (Biasa / Keren / Prioritas)
CREATE TYPE user_tier_status AS ENUM (
  'active',      -- Subscription sedang berjalan
  'expired',     -- Subscription sudah habis masa berlakunya
  'cancelled'    -- User membatalkan subscription sebelum expired
);

-- Status link pasangan antar user
CREATE TYPE couple_link_status AS ENUM (
  'pending',    -- Permintaan link sudah dikirim, belum diterima
  'accepted',   -- Pasangan sudah menerima link
  'rejected',   -- Pasangan menolak link
  'dissolved'   -- Link pernah aktif tapi sudah diputus
);

-- Jenis interaksi yang menambah interaction_score pada couple
CREATE TYPE couple_interaction_type AS ENUM (
  'both_login_same_day',     -- Keduanya login di hari yang sama (+5 poin)
  'partner_profile_view',    -- Salah satu melihat profil pasangan (+3 poin)
  'shared_order_created',    -- Membuat order bersama (+10 poin)
  'partner_design_view'      -- Melihat referensi desain yang sama (+2 poin)
);

-- ---------------------------------------------------------------------------
-- ENUM: ADMIN & OPERATIONS DOMAIN
-- ---------------------------------------------------------------------------

-- Role admin di panel (super_admin bisa semua, engineer hanya handle order)
CREATE TYPE admin_role AS ENUM (
  'super_admin',    -- Akses penuh: user management, statistik, semua order
  'admin',          -- Akses umum: order management, notifikasi
  'engineer'        -- Hanya bisa: terima assignment, upload output undangan
);

-- Status assignment order ke engineer
CREATE TYPE assignment_status AS ENUM (
  'assigned',       -- Order sudah di-assign ke engineer
  'in_progress',    -- Engineer sedang mengerjakan
  'review',         -- Menunggu review sebelum dikirim ke user
  'completed',      -- Output sudah di-upload dan final
  'reassigned'      -- Di-assign ulang ke engineer lain
);

-- Target audience untuk system notification
CREATE TYPE notification_target AS ENUM (
  'all_users',          -- Semua user aktif
  'tier_basic',         -- Hanya user tier Pengantin Biasa
  'tier_keren',         -- Hanya user tier Pengantin Keren
  'tier_prioritas',     -- Hanya user tier Pengantin Prioritas
  'specific_user'       -- Satu user tertentu (gunakan target_user_id)
);

-- ---------------------------------------------------------------------------
-- ENUM: ORDER & CONTENT DOMAIN
-- ---------------------------------------------------------------------------

-- Status lifecycle sebuah order dari dibuat sampai selesai
CREATE TYPE order_status AS ENUM (
  'draft',           -- User belum selesai mengisi form
  'pending_payment', -- Form selesai, menunggu pembayaran
  'paid',            -- Pembayaran dikonfirmasi
  'in_queue',        -- Masuk antrian pengerjaan engineer
  'in_progress',     -- Sedang dikerjakan engineer
  'review',          -- Menunggu review internal
  'ready',           -- Output siap, menunggu konfirmasi user
  'completed',       -- User sudah download, order selesai
  'cancelled',       -- Order dibatalkan
  'refunded'         -- Pembayaran dikembalikan
);

-- Metode pembayaran yang didukung via Midtrans
CREATE TYPE payment_method AS ENUM (
  'bank_transfer',   -- Transfer bank manual
  'virtual_account', -- Virtual Account BCA / BNI / BRI / Mandiri
  'qris',            -- QRIS (semua dompet digital)
  'gopay',           -- GoPay
  'ovo',             -- OVO
  'dana',            -- DANA
  'credit_card',     -- Kartu kredit / debit
  'indomaret',       -- Minimarket Indomaret
  'alfamart'         -- Minimarket Alfamart
);

-- Status payment dari Midtrans
CREATE TYPE payment_status AS ENUM (
  'pending',     -- Menunggu pembayaran dari user
  'settlement',  -- Pembayaran berhasil dan settled
  'capture',     -- Berhasil di-capture (kartu kredit)
  'deny',        -- Ditolak oleh bank/provider
  'cancel',      -- Dibatalkan oleh user atau sistem
  'expire',      -- Waktu pembayaran habis
  'refund',      -- Sudah direfund
  'partial_refund' -- Refund sebagian
);

-- Tipe asset yang diupload user untuk keperluan undangan
CREATE TYPE asset_type AS ENUM (
  'photo_couple',      -- Foto pasangan utama
  'photo_prewedding',  -- Foto prewedding
  'photo_family',      -- Foto keluarga
  'video_highlight',   -- Video highlight / teaser
  'document_maps',     -- Gambar peta lokasi
  'logo_custom',       -- Logo atau monogram custom
  'other'              -- Lainnya
);

-- Status request AI design generation
CREATE TYPE ai_request_status AS ENUM (
  'queued',      -- Request masuk antrian
  'processing',  -- Sedang diproses model AI
  'completed',   -- Berhasil menghasilkan output
  'failed',      -- Gagal (timeout / error model)
  'cancelled'    -- Dibatalkan user
);

COMMIT;

-- =============================================================================
-- ROLLBACK REFERENCE (jalankan manual jika perlu undo migration ini)
-- =============================================================================
-- DROP TYPE IF EXISTS ai_request_status CASCADE;
-- DROP TYPE IF EXISTS asset_type CASCADE;
-- DROP TYPE IF EXISTS payment_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS order_status CASCADE;
-- DROP TYPE IF EXISTS notification_target CASCADE;
-- DROP TYPE IF EXISTS assignment_status CASCADE;
-- DROP TYPE IF EXISTS admin_role CASCADE;
-- DROP TYPE IF EXISTS couple_interaction_type CASCADE;
-- DROP TYPE IF EXISTS couple_link_status CASCADE;
-- DROP TYPE IF EXISTS user_tier_status CASCADE;
-- DROP EXTENSION IF EXISTS pgcrypto;
-- DROP EXTENSION IF EXISTS "uuid-ossp";
