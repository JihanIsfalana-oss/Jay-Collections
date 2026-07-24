-- =============================================================================
-- MIGRATION 004 — DOMAIN 3: ORDER & CONTENT TABLES + CROSS-DOMAIN FKs
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-06-01
-- Depends  : 002_create_user_auth_tables.sql
--            003_create_admin_operations_tables.sql
-- Purpose  : Membuat tabel domain Order & Content, lalu menyelesaikan semua
--            FK lintas domain yang tidak bisa dibuat di migration sebelumnya
--            karena tabel target belum ada.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLE: design_categories
-- Kategori referensi desain undangan (Modern, Tradisional, Rustic, dll).
-- Dikelola admin, ditampilkan ke user di fitur Referensi Design.
-- ---------------------------------------------------------------------------
CREATE TABLE design_categories (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,                         -- "Modern Minimalis"
  slug           VARCHAR(100) NOT NULL UNIQUE,                  -- "modern-minimalis"
  description    TEXT,
  thumbnail_url  TEXT,                                          -- Cloudinary URL preview kategori
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order  INTEGER     NOT NULL DEFAULT 0,                -- Urutan tampil di UI
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE design_categories IS 'Kategori referensi desain undangan. Dikelola admin, ditampilkan ke user di halaman Referensi Design.';

-- ---------------------------------------------------------------------------
-- TABLE: design_references
-- Koleksi referensi desain undangan per kategori.
-- ai_style_prompt: prompt siap pakai untuk dikirim ke AI model jika user
-- memilih desain ini sebagai basis generasi AI-nya.
-- ---------------------------------------------------------------------------
CREATE TABLE design_references (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID        NOT NULL REFERENCES design_categories(id) ON DELETE RESTRICT,
  title            VARCHAR(150) NOT NULL,
  thumbnail_url    TEXT        NOT NULL,                        -- Cloudinary URL preview desain
  description      TEXT,
  style_tags       TEXT[],                                      -- Array: ["elegant", "floral", "serif"]
  ai_style_prompt  TEXT,                                        -- Prompt untuk AI jika desain ini dipilih
  is_featured      BOOLEAN     NOT NULL DEFAULT FALSE,          -- Tampil di section "Featured"
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  view_count       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE design_references IS 'Referensi desain undangan. ai_style_prompt dipakai saat user request generasi AI berbasis desain ini.';
COMMENT ON COLUMN design_references.style_tags IS 'PostgreSQL array. Query dengan @> operator: WHERE style_tags @> ARRAY[''elegant'']';

-- ---------------------------------------------------------------------------
-- TABLE: orders
-- Tabel inti transaksi. Satu order = satu undangan pernikahan.
-- Status lifecycle: draft → pending_payment → paid → in_queue → in_progress
--                  → review → ready → completed
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  voucher_id            UUID          REFERENCES vouchers(id) ON DELETE SET NULL,
  design_reference_id   UUID          REFERENCES design_references(id) ON DELETE SET NULL,
  order_code            VARCHAR(30)   NOT NULL UNIQUE,           -- "JAY-2024-XXXX" (human-readable)
  status                order_status  NOT NULL DEFAULT 'draft',

  -- Informasi pernikahan
  bride_name            VARCHAR(150)  NOT NULL DEFAULT '',
  groom_name            VARCHAR(150)  NOT NULL DEFAULT '',
  wedding_date          DATE,
  wedding_location      TEXT,                                    -- Nama gedung / tempat umum
  ceremony_location     TEXT,                                    -- Alamat lengkap akad
  reception_location    TEXT,                                    -- Alamat lengkap resepsi
  couple_story          TEXT,                                    -- Cerita singkat pasangan
  custom_notes          TEXT,                                    -- Permintaan khusus ke engineer

  -- Pricing
  subtotal              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Validasi: discount tidak boleh melebihi subtotal
  CONSTRAINT chk_discount_valid CHECK (discount_amount <= subtotal),
  -- Validasi: total = subtotal - discount
  CONSTRAINT chk_total_valid CHECK (
    total_amount = subtotal - discount_amount
  )
);

COMMENT ON TABLE orders IS 'Tabel inti transaksi undangan. Satu order = satu undangan pernikahan. Status mengikuti lifecycle dari draft sampai completed.';
COMMENT ON COLUMN orders.order_code IS 'Format: JAY-YYYY-XXXX. Human-readable, dipakai untuk komunikasi dengan user.';

-- ---------------------------------------------------------------------------
-- TABLE: order_status_logs
-- Setiap perubahan status order dicatat di sini.
-- changed_by_type: 'user' | 'admin' — polymorphic reference karena
-- PostgreSQL tidak mendukung FK ke dua tabel berbeda dalam satu kolom.
-- ---------------------------------------------------------------------------
CREATE TABLE order_status_logs (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status      order_status,                                           -- NULL untuk status awal
  to_status        order_status  NOT NULL,
  changed_by_type  VARCHAR(10)   NOT NULL CHECK (changed_by_type IN ('user', 'admin', 'system')),
  changed_by_id    UUID          NOT NULL,                                 -- ID dari users atau admins
  note             TEXT,
  changed_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_status_logs IS 'Audit log setiap perubahan status order. changed_by_type membedakan apakah perubahan dilakukan user, admin, atau sistem.';

-- ---------------------------------------------------------------------------
-- TABLE: payments
-- Data pembayaran via Midtrans. raw_callback menyimpan payload asli webhook.
-- Satu order = satu payment record (status bisa berubah mengikuti callback).
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id                       UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                 UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  midtrans_order_id        VARCHAR(100)    NOT NULL UNIQUE,               -- Order ID yang dikirim ke Midtrans
  midtrans_transaction_id  VARCHAR(100)    UNIQUE,                        -- Transaction ID dari Midtrans (setelah paid)
  midtrans_status          VARCHAR(50),                                   -- Status raw dari Midtrans
  amount                   DECIMAL(12,2)  NOT NULL,
  payment_method           payment_method,                                -- Diisi setelah user memilih metode
  status                   payment_status NOT NULL DEFAULT 'pending',
  va_number                VARCHAR(30),                                   -- Nomor VA jika pakai virtual account
  qris_url                 TEXT,                                          -- URL QRIS image jika pakai QRIS
  deeplink_url             TEXT,                                          -- Deep link GoPay/OVO
  raw_callback             JSONB,                                         -- Payload webhook asli dari Midtrans
  paid_at                  TIMESTAMPTZ,                                   -- Di-set saat status = settlement
  expired_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Data pembayaran via Midtrans. raw_callback menyimpan payload webhook asli untuk audit dan dispute. Satu order = satu payment.';
COMMENT ON COLUMN payments.raw_callback IS 'Jangan pernah dihapus. Berguna untuk investigasi dispute payment dengan Midtrans.';

-- ---------------------------------------------------------------------------
-- TABLE: order_assets
-- File-file yang diupload user sebagai bahan undangan (foto, video, dll).
-- Setiap file diupload ke Cloudinary, URL-nya disimpan di sini.
-- ---------------------------------------------------------------------------
CREATE TABLE order_assets (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  asset_type            asset_type  NOT NULL,
  cloudinary_public_id  TEXT        NOT NULL UNIQUE,
  cloudinary_url        TEXT        NOT NULL,
  cloudinary_format     VARCHAR(20),                            -- "jpg", "mp4", "pdf", dll
  file_size_kb          INTEGER     CHECK (file_size_kb > 0),
  mime_type             VARCHAR(100),
  caption               TEXT,                                   -- Keterangan foto (opsional dari user)
  display_order         INTEGER     NOT NULL DEFAULT 0,         -- Urutan tampil di preview order
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_assets IS 'File yang diupload user sebagai bahan pembuatan undangan. Setiap file disimpan di Cloudinary.';

-- ---------------------------------------------------------------------------
-- TABLE: ai_design_requests
-- Setiap request user ke AI untuk rekomendasi/generasi desain dicatat di sini.
-- Membantu monitoring penggunaan AI, cost tracking (tokens), dan debugging.
-- ---------------------------------------------------------------------------
CREATE TABLE ai_design_requests (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id             UUID              REFERENCES orders(id) ON DELETE SET NULL,       -- Opsional
  design_reference_id  UUID              REFERENCES design_references(id) ON DELETE SET NULL,
  user_prompt          TEXT              NOT NULL,                -- Prompt asli dari user
  ai_response_text     TEXT,                                      -- Teks response dari AI
  cloudinary_result_url TEXT,                                     -- URL hasil visual (jika ada)
  model_used           VARCHAR(100)      NOT NULL,                -- "claude-sonnet-4-20250514"
  tokens_used          INTEGER           CHECK (tokens_used >= 0),
  request_status       ai_request_status NOT NULL DEFAULT 'queued',
  requested_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ
);

COMMENT ON TABLE ai_design_requests IS 'Log setiap request AI design. Digunakan untuk monitoring, cost tracking, dan debugging model response.';

-- =============================================================================
-- CROSS-DOMAIN FOREIGN KEYS
-- FK yang tidak bisa dibuat di migration sebelumnya karena tabel target belum ada.
-- =============================================================================

-- vouchers.used_by_order_id → orders.id
ALTER TABLE vouchers
  ADD CONSTRAINT fk_vouchers_order
  FOREIGN KEY (used_by_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- order_assignments.order_id → orders.id  (dari domain admin, migration 003)
ALTER TABLE order_assignments
  ADD CONSTRAINT fk_assignments_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- invitation_outputs.order_id → orders.id  (dari domain admin, migration 003)
ALTER TABLE invitation_outputs
  ADD CONSTRAINT fk_outputs_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- =============================================================================
-- INDEXES — DOMAIN 3
-- =============================================================================

-- design_categories: query kategori aktif, urutan tampil
CREATE INDEX idx_design_cat_slug       ON design_categories(slug);
CREATE INDEX idx_design_cat_active     ON design_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_design_cat_order      ON design_categories(display_order);

-- design_references: query per kategori, featured, style_tags
CREATE INDEX idx_design_ref_category   ON design_references(category_id);
CREATE INDEX idx_design_ref_featured   ON design_references(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_design_ref_active     ON design_references(is_active) WHERE is_active = TRUE;
-- GIN index untuk query array style_tags
CREATE INDEX idx_design_ref_tags_gin   ON design_references USING gin(style_tags);

-- orders: query by user, status, order_code
CREATE INDEX idx_orders_user_id        ON orders(user_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_orders_order_code     ON orders(order_code);
CREATE INDEX idx_orders_voucher_id     ON orders(voucher_id) WHERE voucher_id IS NOT NULL;
CREATE INDEX idx_orders_created_at     ON orders(created_at DESC);
-- Index komposit untuk query "order user tertentu dengan status tertentu"
CREATE INDEX idx_orders_user_status    ON orders(user_id, status);

-- order_status_logs: query history per order
CREATE INDEX idx_status_logs_order_id  ON order_status_logs(order_id);
CREATE INDEX idx_status_logs_changed   ON order_status_logs(changed_at DESC);

-- payments: query by order, status, midtrans ID
CREATE INDEX idx_payments_order_id         ON payments(order_id);
CREATE INDEX idx_payments_status           ON payments(status);
CREATE INDEX idx_payments_midtrans_order   ON payments(midtrans_order_id);
CREATE INDEX idx_payments_midtrans_trx     ON payments(midtrans_transaction_id);
-- GIN index untuk query di dalam raw_callback JSONB
CREATE INDEX idx_payments_callback_gin     ON payments USING gin(raw_callback);

-- order_assets: query aset per order, per tipe
CREATE INDEX idx_assets_order_id    ON order_assets(order_id);
CREATE INDEX idx_assets_type        ON order_assets(asset_type);
CREATE INDEX idx_assets_order_disp  ON order_assets(order_id, display_order);

-- ai_design_requests: query per user, per order, monitoring status
CREATE INDEX idx_ai_req_user_id    ON ai_design_requests(user_id);
CREATE INDEX idx_ai_req_order_id   ON ai_design_requests(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_ai_req_status     ON ai_design_requests(request_status);
CREATE INDEX idx_ai_req_model      ON ai_design_requests(model_used);
CREATE INDEX idx_ai_req_requested  ON ai_design_requests(requested_at DESC);

COMMIT;

-- =============================================================================
-- ROLLBACK REFERENCE
-- =============================================================================
-- -- Hapus cross-domain FK dulu
-- ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_order;
-- ALTER TABLE order_assignments DROP CONSTRAINT IF EXISTS fk_assignments_order;
-- ALTER TABLE invitation_outputs DROP CONSTRAINT IF EXISTS fk_outputs_order;
-- -- Lalu drop tabel domain 3
-- DROP TABLE IF EXISTS ai_design_requests CASCADE;
-- DROP TABLE IF EXISTS order_assets CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS order_status_logs CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS design_references CASCADE;
-- DROP TABLE IF EXISTS design_categories CASCADE;
