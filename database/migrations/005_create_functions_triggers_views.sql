-- =============================================================================
-- MIGRATION 005 — FUNCTIONS, TRIGGERS & VIEWS
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-06-01
-- Depends  : 004_create_order_content_tables.sql
-- Purpose  : Mendefinisikan:
--            1. Functions — logic yang dijalankan di level database
--            2. Triggers  — otomatisasi yang terpicu saat data berubah
--            3. Views     — query kompleks yang disederhanakan menjadi "tabel virtual"
--            Semua ini mengurangi beban logic di aplikasi dan menjaga konsistensi data.
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: UTILITY FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FUNCTION: set_updated_at()
-- Otomatis mengupdate kolom updated_at ke NOW() setiap kali baris diupdate.
-- Dipakai oleh trigger pada semua tabel yang punya kolom updated_at.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_updated_at() IS 'Trigger function: otomatis update kolom updated_at ke waktu sekarang.';

-- ---------------------------------------------------------------------------
-- FUNCTION: generate_order_code()
-- Menghasilkan order code format: JAY-YYYY-XXXXXX (6 digit random alphanumeric uppercase).
-- Dipanggil oleh trigger sebelum INSERT ke tabel orders.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
  v_year    TEXT;
  v_random  TEXT;
  v_code    TEXT;
  v_exists  BOOLEAN;
BEGIN
  -- Hanya generate jika order_code belum diisi
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    LOOP
      -- Generate 6 karakter random alphanumeric uppercase
      v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
      v_code := 'JAY-' || v_year || '-' || v_random;
      -- Pastikan tidak collision
      SELECT EXISTS(SELECT 1 FROM orders WHERE order_code = v_code) INTO v_exists;
      EXIT WHEN NOT v_exists;
    END LOOP;
    NEW.order_code := v_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_code() IS 'Trigger function: generate order_code format JAY-YYYY-XXXXXX sebelum INSERT ke orders.';

-- ---------------------------------------------------------------------------
-- FUNCTION: generate_voucher_code()
-- Menghasilkan voucher code format: JAYCOUPLE-XXXXXXXX (8 digit random uppercase).
-- Dipanggil oleh trigger sebelum INSERT ke tabel vouchers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TRIGGER AS $$
DECLARE
  v_random  TEXT;
  v_code    TEXT;
  v_exists  BOOLEAN;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      v_random := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
      v_code   := 'JAYCOUPLE-' || v_random;
      SELECT EXISTS(SELECT 1 FROM vouchers WHERE code = v_code) INTO v_exists;
      EXIT WHEN NOT v_exists;
    END LOOP;
    NEW.code := v_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_voucher_code() IS 'Trigger function: generate voucher code format JAYCOUPLE-XXXXXXXX sebelum INSERT ke vouchers.';

-- ---------------------------------------------------------------------------
-- FUNCTION: log_order_status_change()
-- Otomatis insert ke order_status_logs setiap kali status order berubah.
-- changed_by_type dan changed_by_id diisi dari kolom sementara yang diset
-- oleh aplikasi sebelum UPDATE (via SET LOCAL).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya log jika status berubah
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_logs (
      order_id,
      from_status,
      to_status,
      changed_by_type,
      changed_by_id,
      note
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(CURRENT_SETTING('app.changed_by_type', TRUE), 'system'),
      COALESCE(CURRENT_SETTING('app.changed_by_id', TRUE)::UUID, gen_random_uuid()),
      CURRENT_SETTING('app.status_change_note', TRUE)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_order_status_change() IS 'Trigger function: otomatis insert ke order_status_logs saat status order berubah. Set app.changed_by_type dan app.changed_by_id via SET LOCAL sebelum UPDATE.';

-- ---------------------------------------------------------------------------
-- FUNCTION: check_invitation_output_final()
-- Memastikan hanya ada SATU invitation_output dengan is_final = TRUE per order.
-- Jika ada yang sudah final, yang lama di-set FALSE sebelum yang baru di-set TRUE.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_invitation_output_final()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_final = TRUE THEN
    -- Reset semua output lain dari order yang sama menjadi not final
    UPDATE invitation_outputs
    SET is_final = FALSE
    WHERE order_id = NEW.order_id
      AND id != NEW.id
      AND is_final = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_invitation_output_final() IS 'Trigger function: pastikan hanya satu invitation_output yang is_final = TRUE per order.';

-- ---------------------------------------------------------------------------
-- FUNCTION: recalculate_couple_interaction_score()
-- Menghitung ulang interaction_score di couple_links berdasarkan semua
-- couple_interactions yang ada. Dipanggil setiap kali ada insert ke
-- couple_interactions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_couple_interaction_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE couple_links
  SET
    interaction_score = (
      SELECT COALESCE(SUM(score_delta), 0)
      FROM couple_interactions
      WHERE couple_link_id = NEW.couple_link_id
    ),
    updated_at = NOW()
  WHERE id = NEW.couple_link_id;

  -- Cek apakah sudah mencapai threshold untuk grant voucher
  UPDATE couple_links
  SET voucher_granted = TRUE
  WHERE id = NEW.couple_link_id
    AND interaction_score >= score_threshold_for_voucher
    AND voucher_granted = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_couple_interaction_score() IS 'Trigger function: hitung ulang interaction_score dan cek threshold voucher setiap ada interaksi baru.';

-- ---------------------------------------------------------------------------
-- FUNCTION: increment_design_view_count()
-- Menambah view_count pada design_references setiap kali order menggunakan
-- design tersebut. Dipanggil oleh trigger pada orders saat design_reference_id
-- di-set pertama kali.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_design_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya increment jika design_reference_id baru di-set (sebelumnya NULL)
  IF NEW.design_reference_id IS NOT NULL AND
     (OLD.design_reference_id IS NULL OR OLD.design_reference_id != NEW.design_reference_id) THEN
    UPDATE design_references
    SET view_count = view_count + 1
    WHERE id = NEW.design_reference_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_design_view_count() IS 'Trigger function: increment view_count pada design_references setiap kali desain dipilih dalam order.';

-- =============================================================================
-- SECTION 2: TRIGGERS
-- Menghubungkan functions ke tabel yang tepat.
-- =============================================================================

-- updated_at triggers untuk semua tabel yang relevan
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_tiers_updated_at
  BEFORE UPDATE ON user_tiers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_account_status_updated_at
  BEFORE UPDATE ON user_account_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_couple_links_updated_at
  BEFORE UPDATE ON couple_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_system_notif_updated_at
  BEFORE UPDATE ON system_notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_design_cat_updated_at
  BEFORE UPDATE ON design_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_design_ref_updated_at
  BEFORE UPDATE ON design_references
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Order code generator
CREATE TRIGGER trg_orders_generate_code
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_code();

-- Voucher code generator
CREATE TRIGGER trg_vouchers_generate_code
  BEFORE INSERT ON vouchers
  FOR EACH ROW EXECUTE FUNCTION generate_voucher_code();

-- Order status audit log
CREATE TRIGGER trg_orders_log_status
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Single final output enforcement
CREATE TRIGGER trg_outputs_check_final
  BEFORE INSERT OR UPDATE ON invitation_outputs
  FOR EACH ROW EXECUTE FUNCTION check_invitation_output_final();

-- Couple interaction score recalculation
CREATE TRIGGER trg_interactions_recalc_score
  AFTER INSERT ON couple_interactions
  FOR EACH ROW EXECUTE FUNCTION recalculate_couple_interaction_score();

-- Design view count increment
CREATE TRIGGER trg_orders_increment_design_view
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION increment_design_view_count();

-- =============================================================================
-- SECTION 3: VIEWS
-- Query kompleks yang disederhanakan. Aplikasi cukup SELECT * FROM view_name.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: v_active_users
-- User aktif dengan tier subscription saat ini.
-- Dipakai oleh dashboard admin dan analytics.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_users AS
SELECT
  u.id,
  u.nama_lengkap,
  u.nama_panggilan,
  u.username,
  u.email,
  u.avatar_url,
  u.created_at,
  uas.is_banned,
  uas.login_fail_count,
  uas.last_login_at,
  ut.tier_name,
  ut.tier_slug,
  uts.expires_at AS tier_expires_at
FROM users u
LEFT JOIN user_account_status uas ON uas.user_id = u.id
LEFT JOIN user_tier_subscriptions uts ON uts.user_id = u.id AND uts.status = 'active'
LEFT JOIN user_tiers ut ON ut.id = uts.tier_id
WHERE uas.is_banned = FALSE OR uas.is_banned IS NULL;

COMMENT ON VIEW v_active_users IS 'User aktif (tidak banned) lengkap dengan tier saat ini. Dipakai di admin dashboard.';

-- ---------------------------------------------------------------------------
-- VIEW: v_order_summary
-- Ringkasan order dengan informasi user, payment status, dan assignment.
-- Dipakai oleh admin panel untuk monitoring semua order.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id               AS order_id,
  o.order_code,
  o.status           AS order_status,
  o.bride_name,
  o.groom_name,
  o.wedding_date,
  o.total_amount,
  o.created_at,
  u.nama_lengkap     AS user_nama_lengkap,
  u.email            AS user_email,
  p.status           AS payment_status,
  p.payment_method,
  p.paid_at,
  a.assigned_to_admin_id,
  adm.full_name      AS assigned_engineer_name,
  a.assignment_status,
  io.is_final        AS output_ready,
  io.cloudinary_url  AS output_url
FROM orders o
LEFT JOIN users u            ON u.id = o.user_id
LEFT JOIN payments p         ON p.order_id = o.id
LEFT JOIN order_assignments a ON a.order_id = o.id AND a.assignment_status NOT IN ('reassigned')
LEFT JOIN admins adm         ON adm.id = a.assigned_to_admin_id
LEFT JOIN invitation_outputs io ON io.order_id = o.id AND io.is_final = TRUE;

COMMENT ON VIEW v_order_summary IS 'Ringkasan lengkap order: user, payment, assignment, output. Dipakai di halaman monitoring admin.';

-- ---------------------------------------------------------------------------
-- VIEW: v_couple_dashboard
-- Data pasangan dengan interaction score, voucher status, dan info masing-masing user.
-- Dipakai di dashboard user untuk menampilkan info pasangan.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_couple_dashboard AS
SELECT
  cl.id              AS couple_link_id,
  cl.status          AS link_status,
  cl.interaction_score,
  cl.score_threshold_for_voucher,
  ROUND((cl.interaction_score::DECIMAL / cl.score_threshold_for_voucher) * 100, 1) AS progress_percent,
  cl.voucher_granted,
  v.code             AS voucher_code,
  v.discount_percent AS voucher_discount,
  v.is_used          AS voucher_used,
  v.expires_at       AS voucher_expires_at,
  cl.linked_at,
  -- User A (requester)
  u_a.id             AS user_a_id,
  u_a.nama_lengkap   AS user_a_nama,
  u_a.nama_panggilan AS user_a_panggilan,
  u_a.avatar_url     AS user_a_avatar,
  -- User B (target)
  u_b.id             AS user_b_id,
  u_b.nama_lengkap   AS user_b_nama,
  u_b.nama_panggilan AS user_b_panggilan,
  u_b.avatar_url     AS user_b_avatar
FROM couple_links cl
LEFT JOIN users u_a ON u_a.id = cl.requester_user_id
LEFT JOIN users u_b ON u_b.id = cl.target_user_id
LEFT JOIN vouchers v ON v.couple_link_id = cl.id AND v.is_used = FALSE
WHERE cl.status = 'accepted';

COMMENT ON VIEW v_couple_dashboard IS 'Data pasangan aktif dengan interaction score, progress voucher, dan info kedua user. Dipakai di dashboard user.';

-- ---------------------------------------------------------------------------
-- VIEW: v_wedding_stats_summary
-- Agregasi statistik pernikahan untuk ditampilkan di chart dashboard user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_wedding_stats_summary AS
SELECT
  reference_year,
  province,
  SUM(total_marriages)          AS total_marriages,
  ROUND(AVG(avg_age_bride), 1)  AS avg_age_bride,
  ROUND(AVG(avg_age_groom), 1)  AS avg_age_groom,
  dataset_source
FROM wedding_statistics
GROUP BY reference_year, province, dataset_source
ORDER BY reference_year DESC, province;

COMMENT ON VIEW v_wedding_stats_summary IS 'Agregasi statistik pernikahan per tahun dan provinsi. Dipakai untuk chart di dashboard user.';

-- ---------------------------------------------------------------------------
-- VIEW: v_design_catalog
-- Katalog referensi desain aktif dengan info kategori.
-- Dipakai di halaman Referensi Design user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_design_catalog AS
SELECT
  dr.id,
  dr.title,
  dr.thumbnail_url,
  dr.description,
  dr.style_tags,
  dr.is_featured,
  dr.view_count,
  dr.created_at,
  dc.id    AS category_id,
  dc.name  AS category_name,
  dc.slug  AS category_slug
FROM design_references dr
JOIN design_categories dc ON dc.id = dr.category_id
WHERE dr.is_active = TRUE AND dc.is_active = TRUE
ORDER BY dr.is_featured DESC, dr.view_count DESC;

COMMENT ON VIEW v_design_catalog IS 'Katalog desain aktif dengan info kategori, diurutkan: featured dulu, lalu by view count.';

COMMIT;

-- =============================================================================
-- ROLLBACK REFERENCE
-- =============================================================================
-- DROP VIEW IF EXISTS v_design_catalog;
-- DROP VIEW IF EXISTS v_wedding_stats_summary;
-- DROP VIEW IF EXISTS v_couple_dashboard;
-- DROP VIEW IF EXISTS v_order_summary;
-- DROP VIEW IF EXISTS v_active_users;
-- DROP TRIGGER IF EXISTS trg_orders_increment_design_view ON orders;
-- DROP TRIGGER IF EXISTS trg_interactions_recalc_score ON couple_interactions;
-- DROP TRIGGER IF EXISTS trg_outputs_check_final ON invitation_outputs;
-- DROP TRIGGER IF EXISTS trg_orders_log_status ON orders;
-- DROP TRIGGER IF EXISTS trg_vouchers_generate_code ON vouchers;
-- DROP TRIGGER IF EXISTS trg_orders_generate_code ON orders;
-- DROP TRIGGER IF EXISTS trg_design_ref_updated_at ON design_references;
-- DROP TRIGGER IF EXISTS trg_design_cat_updated_at ON design_categories;
-- DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
-- DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
-- DROP TRIGGER IF EXISTS trg_system_notif_updated_at ON system_notifications;
-- DROP TRIGGER IF EXISTS trg_admin_roles_updated_at ON admin_roles;
-- DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
-- DROP TRIGGER IF EXISTS trg_couple_links_updated_at ON couple_links;
-- DROP TRIGGER IF EXISTS trg_user_account_status_updated_at ON user_account_status;
-- DROP TRIGGER IF EXISTS trg_user_tiers_updated_at ON user_tiers;
-- DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
-- DROP FUNCTION IF EXISTS increment_design_view_count;
-- DROP FUNCTION IF EXISTS recalculate_couple_interaction_score;
-- DROP FUNCTION IF EXISTS check_invitation_output_final;
-- DROP FUNCTION IF EXISTS log_order_status_change;
-- DROP FUNCTION IF EXISTS generate_voucher_code;
-- DROP FUNCTION IF EXISTS generate_order_code;
-- DROP FUNCTION IF EXISTS set_updated_at;
