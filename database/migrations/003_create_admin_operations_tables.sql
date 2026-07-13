-- =============================================================================
-- MIGRATION 003 — DOMAIN 2: ADMIN & OPERATIONS TABLES
-- Project  : Jay Collection's for Wedding
-- Author   : Data Engineering Team
-- Created  : 2024-01-01
-- Depends  : 001_setup_extensions_and_enums.sql
-- Purpose  : Membuat tabel untuk panel admin yang sepenuhnya terpisah dari
--            domain user. Admin memiliki JWT secret, session, dan audit log
--            sendiri. Tidak ada relasi langsung antara tabel admins dan users
--            kecuali order_assignments dan invitation_outputs yang mereferensikan
--            kedua domain.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLE: admin_roles
-- Definisi role admin dengan permission berbasis JSON.
-- Lebih fleksibel dari enum karena permission bisa ditambah tanpa migration.
-- Format permissions: {"can_assign_orders": true, "can_ban_users": false, ...}
-- ---------------------------------------------------------------------------
CREATE TABLE admin_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name   VARCHAR(50) NOT NULL,                            -- "Super Admin", "Engineer"
  role_slug   VARCHAR(50) NOT NULL UNIQUE,                     -- "super_admin", "engineer"
  permissions JSONB       NOT NULL DEFAULT '{}',               -- JSONB untuk query lebih cepat
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_roles IS 'Definisi role admin dengan permission granular berbasis JSONB. Gunakan JSONB bukan JSON untuk mendukung indexing.';
COMMENT ON COLUMN admin_roles.permissions IS 'Contoh: {"can_assign_orders": true, "can_upload_output": true, "can_ban_users": false, "can_manage_tiers": false}';

-- ---------------------------------------------------------------------------
-- TABLE: admins
-- Tabel identitas admin. TERPISAH dari tabel users.
-- Tidak ada relasi FK antara admins dan users.
-- Admin login via endpoint /admin/auth/login dengan JWT secret berbeda.
-- ---------------------------------------------------------------------------
CREATE TABLE admins (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,                        -- Bcrypt, wajib — tidak ada OAuth untuk admin
  role_id        UUID         NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admins IS 'Identitas admin. Sepenuhnya terpisah dari tabel users. Gunakan JWT_SECRET_ADMIN yang berbeda dari JWT_SECRET_USER.';

-- ---------------------------------------------------------------------------
-- TABLE: admin_sessions
-- Session aktif admin. Struktur mirip login_sessions tapi untuk admin.
-- Admin session lebih pendek (8 jam vs 7 hari user) untuk keamanan.
-- ---------------------------------------------------------------------------
CREATE TABLE admin_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_token  TEXT        NOT NULL UNIQUE,
  ip_address     INET        NOT NULL,
  user_agent     TEXT,
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours'),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_sessions IS 'Session admin aktif. Durasi 8 jam (lebih pendek dari user session untuk keamanan).';

-- ---------------------------------------------------------------------------
-- TABLE: admin_audit_logs
-- Setiap action admin dicatat di sini: siapa melakukan apa pada data mana.
-- Menyimpan before_value dan after_value untuk forensik data.
-- Tidak dihapus — ini adalah compliance log.
-- ---------------------------------------------------------------------------
CREATE TABLE admin_audit_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID         REFERENCES admins(id) ON DELETE SET NULL,   -- SET NULL jika admin dihapus
  action        VARCHAR(100) NOT NULL,                                    -- "ban_user", "assign_order", dst
  target_table  VARCHAR(100) NOT NULL,                                    -- Nama tabel yang dimodifikasi
  target_id     UUID,                                                     -- ID record yang dimodifikasi
  before_value  JSONB,                                                    -- State sebelum perubahan
  after_value   JSONB,                                                    -- State setelah perubahan
  ip_address    INET,
  notes         TEXT,                                                     -- Catatan tambahan dari admin
  performed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_audit_logs IS 'Audit log immutable untuk setiap aksi admin. Digunakan untuk compliance, forensik, dan dispute resolution.';

-- ---------------------------------------------------------------------------
-- TABLE: order_assignments
-- Menghubungkan ORDER dengan ADMIN (engineer) yang mengerjakannya.
-- Satu order bisa di-reassign — tabel ini menyimpan seluruh history assignment.
-- order_id di sini mereferensikan orders(id) yang dibuat di migration 004.
-- FK ke orders ditambahkan via ALTER TABLE di migration 004.
-- ---------------------------------------------------------------------------
CREATE TABLE order_assignments (
  id                    UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID               NOT NULL,                                       -- FK ditambah di migration 004
  assigned_to_admin_id  UUID               NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  assigned_by_admin_id  UUID               REFERENCES admins(id) ON DELETE SET NULL,
  assignment_status     assignment_status  NOT NULL DEFAULT 'assigned',
  internal_notes        TEXT,                                                              -- Catatan internal antar engineer
  assigned_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

COMMENT ON TABLE order_assignments IS 'Assignment order ke engineer. Mendukung reassignment — setiap assignment membuat baris baru.';

-- ---------------------------------------------------------------------------
-- TABLE: invitation_outputs
-- File output undangan yang diupload engineer setelah selesai dikerjakan.
-- Satu order bisa punya beberapa versi output (version_tag: v1, v2, final).
-- order_id FK ditambahkan via ALTER TABLE di migration 004.
-- ---------------------------------------------------------------------------
CREATE TABLE invitation_outputs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL,                              -- FK ditambah di migration 004
  uploaded_by_admin_id  UUID        REFERENCES admins(id) ON DELETE SET NULL,
  cloudinary_public_id  TEXT        NOT NULL,
  cloudinary_url        TEXT        NOT NULL,
  file_type             VARCHAR(20) NOT NULL,                             -- "pdf", "zip", "mp4"
  version_tag           VARCHAR(20) NOT NULL DEFAULT 'v1',               -- "v1", "v2", "final"
  is_final              BOOLEAN     NOT NULL DEFAULT FALSE,               -- Hanya satu yang bisa TRUE per order
  release_notes         TEXT,                                             -- Catatan perubahan dari engineer
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invitation_outputs IS 'File output undangan per order. Mendukung multiple versi. Hanya satu versi final per order.';

-- ---------------------------------------------------------------------------
-- TABLE: system_notifications
-- Notifikasi dari admin ke user (pengumuman, promo, info tier, dll).
-- target_audience menentukan segmen penerima.
-- ---------------------------------------------------------------------------
CREATE TABLE system_notifications (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin_id   UUID                  REFERENCES admins(id) ON DELETE SET NULL,
  target_audience       notification_target   NOT NULL DEFAULT 'all_users',
  target_user_id        UUID,                                             -- Diisi jika target = specific_user
  title                 VARCHAR(200)          NOT NULL,
  body                  TEXT                  NOT NULL,
  is_active             BOOLEAN               NOT NULL DEFAULT TRUE,
  published_at          TIMESTAMPTZ,                                      -- NULL = belum dipublish (draft)
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  -- Validasi: jika target specific_user maka target_user_id harus diisi
  CONSTRAINT chk_specific_user_target CHECK (
    target_audience != 'specific_user' OR target_user_id IS NOT NULL
  )
);

COMMENT ON TABLE system_notifications IS 'Notifikasi dari admin ke user. Mendukung broadcast ke semua user atau segmen tier tertentu.';

-- ---------------------------------------------------------------------------
-- TABLE: wedding_statistics
-- Dataset statistik pernikahan Indonesia dari BPS atau sumber publik lain.
-- Diimport oleh admin, ditampilkan read-only di dashboard user.
-- Bukan data real-time — diupdate secara periodik (tahunan/semesteran).
-- ---------------------------------------------------------------------------
CREATE TABLE wedding_statistics (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_source        VARCHAR(100) NOT NULL,                            -- "BPS Indonesia 2023"
  reference_year        INTEGER      NOT NULL CHECK (reference_year >= 1945),
  province              VARCHAR(100),                                     -- NULL = data nasional
  age_group_min         INTEGER      NOT NULL CHECK (age_group_min >= 0),
  age_group_max         INTEGER      NOT NULL CHECK (age_group_max > age_group_min),
  total_marriages       INTEGER      NOT NULL CHECK (total_marriages >= 0),
  avg_age_bride         DECIMAL(5,2) CHECK (avg_age_bride >= 0),
  avg_age_groom         DECIMAL(5,2) CHECK (avg_age_groom >= 0),
  notes                 TEXT,                                             -- Catatan metodologi dataset
  imported_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  imported_by_admin_id  UUID         REFERENCES admins(id) ON DELETE SET NULL,

  -- Satu kombinasi unik: source + year + province + age_group
  CONSTRAINT uq_stat_entry UNIQUE (dataset_source, reference_year, province, age_group_min, age_group_max)
);

COMMENT ON TABLE wedding_statistics IS 'Dataset statistik pernikahan Indonesia dari sumber publik (BPS). Ditampilkan di dashboard user. Diimport dan diupdate oleh admin.';

-- =============================================================================
-- INDEXES — DOMAIN 2
-- =============================================================================

-- admins: query by email (login), role, status
CREATE INDEX idx_admins_email      ON admins(email);
CREATE INDEX idx_admins_role_id    ON admins(role_id);
CREATE INDEX idx_admins_is_active  ON admins(is_active) WHERE is_active = TRUE;

-- admin_roles: query by slug
CREATE INDEX idx_admin_roles_slug  ON admin_roles(role_slug);

-- admin_sessions: validasi token, cleanup expired
CREATE INDEX idx_admin_sessions_admin_id  ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token     ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires   ON admin_sessions(expires_at);

-- admin_audit_logs: investigasi per admin, per target tabel/record
CREATE INDEX idx_audit_logs_admin_id      ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target_table  ON admin_audit_logs(target_table);
CREATE INDEX idx_audit_logs_target_id     ON admin_audit_logs(target_id);
CREATE INDEX idx_audit_logs_performed_at  ON admin_audit_logs(performed_at DESC);
-- GIN index untuk search di dalam JSONB (before/after value)
CREATE INDEX idx_audit_logs_after_gin  ON admin_audit_logs USING gin(after_value);

-- order_assignments: query assignment per order, per engineer
CREATE INDEX idx_assignments_order_id   ON order_assignments(order_id);
CREATE INDEX idx_assignments_admin_id   ON order_assignments(assigned_to_admin_id);
CREATE INDEX idx_assignments_status     ON order_assignments(assignment_status);

-- invitation_outputs: query output per order, filter final
CREATE INDEX idx_outputs_order_id   ON invitation_outputs(order_id);
CREATE INDEX idx_outputs_is_final   ON invitation_outputs(is_final) WHERE is_final = TRUE;

-- system_notifications: query notifikasi aktif per audience
CREATE INDEX idx_notif_audience    ON system_notifications(target_audience);
CREATE INDEX idx_notif_is_active   ON system_notifications(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_notif_target_user ON system_notifications(target_user_id) WHERE target_user_id IS NOT NULL;

-- wedding_statistics: query by tahun, provinsi untuk dashboard chart
CREATE INDEX idx_stats_year      ON wedding_statistics(reference_year);
CREATE INDEX idx_stats_province  ON wedding_statistics(province);
CREATE INDEX idx_stats_source    ON wedding_statistics(dataset_source);

COMMIT;

-- =============================================================================
-- ROLLBACK REFERENCE
-- =============================================================================
-- DROP TABLE IF EXISTS wedding_statistics CASCADE;
-- DROP TABLE IF EXISTS system_notifications CASCADE;
-- DROP TABLE IF EXISTS invitation_outputs CASCADE;
-- DROP TABLE IF EXISTS order_assignments CASCADE;
-- DROP TABLE IF EXISTS admin_audit_logs CASCADE;
-- DROP TABLE IF EXISTS admin_sessions CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;
-- DROP TABLE IF EXISTS admin_roles CASCADE;
