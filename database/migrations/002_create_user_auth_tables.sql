-- =============================================================================
-- MIGRATION 002 — DOMAIN 1: USER & AUTH TABLES
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-06-01
-- Depends  : 001_setup_extensions_and_enums.sql
-- Purpose  : Membuat semua tabel untuk domain User dan Auth. Tabel ini adalah
--            pondasi sistem — hampir semua tabel lain mereferensikan USERS.id.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLE: user_tiers
-- Menyimpan definisi tier langganan (Pengantin Biasa, Keren, Prioritas).
-- Dipisah dari USERS agar harga dan fitur bisa diupdate tanpa schema migration.
-- ---------------------------------------------------------------------------
CREATE TABLE user_tiers (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name            VARCHAR(50)   NOT NULL,                        -- "Pengantin Biasa"
  tier_slug            VARCHAR(50)   NOT NULL UNIQUE,                 -- "basic", "keren", "prioritas"
  price_monthly        DECIMAL(12,2) NOT NULL DEFAULT 0.00,           -- Harga per bulan (IDR)
  max_orders_per_month INTEGER       NOT NULL DEFAULT 1,              -- Batas order per bulan
  ai_design_access     BOOLEAN       NOT NULL DEFAULT FALSE,          -- Akses fitur AI design
  priority_support     BOOLEAN       NOT NULL DEFAULT FALSE,          -- Antrian prioritas engineer
  description          TEXT,                                          -- Deskripsi tier untuk UI
  is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_tiers IS 'Definisi tier langganan akun user. Tier menentukan akses fitur dan batas order.';

-- ---------------------------------------------------------------------------
-- TABLE: users
-- Tabel inti identitas user. Menyimpan data registrasi dan OAuth Google.
-- password_hash NULL jika user daftar via Google OAuth.
-- google_id NULL jika user daftar via form biasa.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap      VARCHAR(150) NOT NULL,
  nama_panggilan    VARCHAR(50)  NOT NULL,
  tanggal_lahir     DATE         NOT NULL,
  tempat_lahir      VARCHAR(100) NOT NULL,
  username          VARCHAR(50)  NOT NULL UNIQUE,
  email             VARCHAR(150) NOT NULL UNIQUE,
  password_hash     TEXT,                                      -- NULL jika Google OAuth
  google_id         VARCHAR(100) UNIQUE,                       -- NULL jika registrasi biasa
  avatar_url        TEXT,                                      -- URL Cloudinary / Google avatar
  current_tier_id   UUID         REFERENCES user_tiers(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Minimal salah satu: password atau google_id harus ada
  CONSTRAINT chk_auth_method CHECK (
    password_hash IS NOT NULL OR google_id IS NOT NULL
  )
);

COMMENT ON TABLE users IS 'Tabel utama identitas user. Mendukung dua metode auth: form biasa dan Google OAuth.';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash. NULL untuk user Google OAuth.';
COMMENT ON COLUMN users.google_id IS 'Google sub ID dari OAuth. NULL untuk user registrasi biasa.';

-- ---------------------------------------------------------------------------
-- TABLE: user_tier_subscriptions
-- History semua subscription tier per user. Satu user bisa ganti tier
-- berkali-kali — tabel ini mencatat seluruh riwayatnya.
-- ---------------------------------------------------------------------------
CREATE TABLE user_tier_subscriptions (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id     UUID               NOT NULL REFERENCES user_tiers(id) ON DELETE RESTRICT,
  status      user_tier_status   NOT NULL DEFAULT 'active',
  started_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,                                     -- NULL = tier gratis permanen
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_tier_subscriptions IS 'Riwayat subscription tier user. Setiap upgrade/downgrade membuat baris baru.';

-- ---------------------------------------------------------------------------
-- TABLE: user_account_status
-- Dipisah dari USERS untuk menjaga tabel utama tetap bersih.
-- Menyimpan state ban, login fail count, dan last login.
-- Redis menyimpan counter real-time, tabel ini adalah persistent state.
-- ---------------------------------------------------------------------------
CREATE TABLE user_account_status (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_banned         BOOLEAN     NOT NULL DEFAULT FALSE,
  login_fail_count  INTEGER     NOT NULL DEFAULT 0,            -- Sync dari Redis counter
  banned_until      TIMESTAMPTZ,                               -- NULL jika tidak sedang banned
  ban_reason        TEXT,                                      -- Alasan ban untuk audit
  last_login_at     TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_account_status IS 'Status akun user: ban, login fail count, last login. Redis menangani counter real-time, tabel ini sebagai persistent state.';

-- ---------------------------------------------------------------------------
-- TABLE: login_sessions
-- Session aktif user. Setiap login sukses membuat satu baris.
-- Token di-hash sebelum disimpan. Redis menyimpan session cache untuk
-- performa, tabel ini sebagai persistent backup.
-- ---------------------------------------------------------------------------
CREATE TABLE login_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token  TEXT        NOT NULL UNIQUE,                  -- Hashed token
  ip_address     INET        NOT NULL,
  user_agent     TEXT,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE login_sessions IS 'Session login aktif. Token di-hash sebelum disimpan. Expired sessions di-cleanup via scheduled job.';

-- ---------------------------------------------------------------------------
-- TABLE: login_audit
-- Log permanen semua percobaan login (berhasil maupun gagal).
-- Tidak dihapus. Berguna untuk investigasi, compliance, dan dispute.
-- ---------------------------------------------------------------------------
CREATE TABLE login_audit (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users(id) ON DELETE SET NULL, -- SET NULL jika user dihapus
  ip_address    INET        NOT NULL,
  user_agent    TEXT,
  success       BOOLEAN     NOT NULL,
  fail_reason   VARCHAR(100),                                  -- "wrong_password", "account_banned", dst
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE login_audit IS 'Audit log permanen setiap percobaan login. Tidak dihapus. Digunakan untuk investigasi dan keamanan.';

-- ---------------------------------------------------------------------------
-- TABLE: password_resets
-- Token untuk reset password. Satu request = satu baris.
-- Token expired setelah 1 jam. Hanya berlaku sekali (is_used).
-- ---------------------------------------------------------------------------
CREATE TABLE password_resets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token  TEXT        NOT NULL UNIQUE,                    -- UUID random, dikirim via email
  is_used      BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE password_resets IS 'Token reset password. Berlaku 1 jam, single-use. Dikirim via email ke user.';

-- ---------------------------------------------------------------------------
-- TABLE: couple_links
-- Menghubungkan dua user sebagai pasangan.
-- interaction_score dihitung oleh background job setiap malam.
-- ---------------------------------------------------------------------------
CREATE TABLE couple_links (
  id                          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id           UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id              UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                      couple_link_status NOT NULL DEFAULT 'pending',
  interaction_score           INTEGER            NOT NULL DEFAULT 0,
  score_threshold_for_voucher INTEGER            NOT NULL DEFAULT 50,   -- Skor minimum untuk dapat voucher
  voucher_granted             BOOLEAN            NOT NULL DEFAULT FALSE,
  linked_at                   TIMESTAMPTZ,                               -- Di-set saat status = accepted
  updated_at                  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  -- Satu pasangan hanya boleh punya satu link aktif
  CONSTRAINT uq_couple_pair UNIQUE (requester_user_id, target_user_id),
  -- User tidak bisa link dengan dirinya sendiri
  CONSTRAINT chk_no_self_link CHECK (requester_user_id != target_user_id)
);

COMMENT ON TABLE couple_links IS 'Relasi pasangan antar user. interaction_score dihitung oleh nightly background job.';

-- ---------------------------------------------------------------------------
-- TABLE: couple_interactions
-- Setiap event interaksi pasangan dicatat di sini.
-- Background job membaca tabel ini untuk menghitung ulang interaction_score.
-- ---------------------------------------------------------------------------
CREATE TABLE couple_interactions (
  id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id   UUID                     NOT NULL REFERENCES couple_links(id) ON DELETE CASCADE,
  actor_user_id    UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type couple_interaction_type  NOT NULL,
  score_delta      INTEGER                  NOT NULL DEFAULT 0,   -- Poin yang ditambahkan
  occurred_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE couple_interactions IS 'Log event interaksi pasangan. Score_delta dikumulasikan ke couple_links.interaction_score oleh background job.';

-- ---------------------------------------------------------------------------
-- TABLE: vouchers
-- Voucher diskon yang dihasilkan dari couple_links saat mencapai threshold.
-- Bisa juga dibuat manual oleh admin (couple_link_id nullable).
-- ---------------------------------------------------------------------------
CREATE TABLE vouchers (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id     UUID        REFERENCES couple_links(id) ON DELETE SET NULL,
  code               VARCHAR(20) NOT NULL UNIQUE,               -- "JAYCOUPLE-XXXX"
  discount_percent   INTEGER     NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  is_used            BOOLEAN     NOT NULL DEFAULT FALSE,
  used_by_order_id   UUID,                                       -- FK ke orders (ditambah di migration 004)
  expires_at         TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vouchers IS 'Voucher diskon. Dihasilkan otomatis dari couple interaction atau dibuat manual oleh admin.';

-- =============================================================================
-- INDEXES — DOMAIN 1
-- Dibuat setelah semua tabel untuk performa query yang sering dipakai.
-- =============================================================================

-- users: pencarian cepat by username, email, google_id
CREATE INDEX idx_users_username      ON users(username);
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_users_google_id     ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_current_tier  ON users(current_tier_id);

-- user_tier_subscriptions: query subscription aktif per user
CREATE INDEX idx_tier_subs_user_id  ON user_tier_subscriptions(user_id);
CREATE INDEX idx_tier_subs_status   ON user_tier_subscriptions(status);

-- user_account_status: query user yang sedang banned
CREATE INDEX idx_account_status_user_id  ON user_account_status(user_id);
CREATE INDEX idx_account_status_banned   ON user_account_status(is_banned) WHERE is_banned = TRUE;

-- login_sessions: validasi session per user, cleanup expired
CREATE INDEX idx_sessions_user_id   ON login_sessions(user_id);
CREATE INDEX idx_sessions_token     ON login_sessions(session_token);
CREATE INDEX idx_sessions_expires   ON login_sessions(expires_at);

-- login_audit: query riwayat login per user, analytics IP
CREATE INDEX idx_audit_user_id      ON login_audit(user_id);
CREATE INDEX idx_audit_ip           ON login_audit(ip_address);
CREATE INDEX idx_audit_attempted_at ON login_audit(attempted_at DESC);

-- password_resets: validasi token, cleanup expired
CREATE INDEX idx_pwd_reset_user_id ON password_resets(user_id);
CREATE INDEX idx_pwd_reset_token   ON password_resets(reset_token);

-- couple_links: cari pasangan by user
CREATE INDEX idx_couple_requester ON couple_links(requester_user_id);
CREATE INDEX idx_couple_target    ON couple_links(target_user_id);
CREATE INDEX idx_couple_status    ON couple_links(status);

-- couple_interactions: query interaksi per couple_link
CREATE INDEX idx_interactions_couple ON couple_interactions(couple_link_id);
CREATE INDEX idx_interactions_actor  ON couple_interactions(actor_user_id);
CREATE INDEX idx_interactions_type   ON couple_interactions(interaction_type);

-- vouchers: validasi kode voucher, query by couple_link
CREATE INDEX idx_vouchers_code         ON vouchers(code);
CREATE INDEX idx_vouchers_couple_link  ON vouchers(couple_link_id);
CREATE INDEX idx_vouchers_is_used      ON vouchers(is_used) WHERE is_used = FALSE;

COMMIT;

-- =============================================================================
-- ROLLBACK REFERENCE
-- =============================================================================
-- DROP TABLE IF EXISTS vouchers CASCADE;
-- DROP TABLE IF EXISTS couple_interactions CASCADE;
-- DROP TABLE IF EXISTS couple_links CASCADE;
-- DROP TABLE IF EXISTS password_resets CASCADE;
-- DROP TABLE IF EXISTS login_audit CASCADE;
-- DROP TABLE IF EXISTS login_sessions CASCADE;
-- DROP TABLE IF EXISTS user_account_status CASCADE;
-- DROP TABLE IF EXISTS user_tier_subscriptions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS user_tiers CASCADE;
