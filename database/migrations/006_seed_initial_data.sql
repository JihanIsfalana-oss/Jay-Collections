-- =============================================================================
-- MIGRATION 006 — SEED DATA
-- Project  : Jay Collection's for Wedding
-- Author   : Data Engineering Team
-- Created  : 2024-01-01
-- Depends  : 005_create_functions_triggers_views.sql
-- Purpose  : Data awal yang WAJIB ada agar sistem bisa berjalan.
--            Ini bukan data dummy testing — ini data konfigurasi produksi:
--            - User tiers (Biasa, Keren, Prioritas)
--            - Admin roles dengan permissions
--            - Super admin pertama
--            - Design categories awal
--            - Sample wedding statistics (BPS data simulasi)
-- PERHATIAN : Ganti password hash super admin sebelum deploy ke production!
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- SEED: user_tiers
-- Tiga tier sesuai spec: Pengantin Biasa, Pengantin Keren, Pengantin Prioritas
-- Harga dalam Rupiah (IDR). Sesuaikan dengan keputusan bisnis.
-- ---------------------------------------------------------------------------
INSERT INTO user_tiers (id, tier_name, tier_slug, price_monthly, max_orders_per_month, ai_design_access, priority_support, description) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Pengantin Biasa',
  'basic',
  0.00,
  1,
  FALSE,
  FALSE,
  'Paket gratis. Akses fitur dasar: 1 order per bulan, referensi desain manual.'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Pengantin Keren',
  'keren',
  99000.00,
  3,
  TRUE,
  FALSE,
  'Paket premium. 3 order per bulan, akses AI design recommender, template eksklusif.'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Pengantin Prioritas',
  'prioritas',
  199000.00,
  10,
  TRUE,
  TRUE,
  'Paket VIP. 10 order per bulan, AI design, antrian prioritas engineer, dedicated support.'
);

-- ---------------------------------------------------------------------------
-- SEED: admin_roles
-- Tiga role: Super Admin, Admin, Engineer
-- Permissions sebagai JSONB — mudah diubah tanpa schema migration
-- ---------------------------------------------------------------------------
INSERT INTO admin_roles (id, role_name, role_slug, permissions, description) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  'Super Admin',
  'super_admin',
  '{
    "can_manage_admins": true,
    "can_manage_users": true,
    "can_ban_users": true,
    "can_manage_tiers": true,
    "can_assign_orders": true,
    "can_upload_output": true,
    "can_manage_designs": true,
    "can_import_statistics": true,
    "can_send_notifications": true,
    "can_view_audit_logs": true,
    "can_manage_vouchers": true,
    "can_view_revenue": true
  }',
  'Akses penuh ke semua fitur admin panel.'
),
(
  '00000000-0000-0000-0001-000000000002',
  'Admin',
  'admin',
  '{
    "can_manage_admins": false,
    "can_manage_users": true,
    "can_ban_users": true,
    "can_manage_tiers": false,
    "can_assign_orders": true,
    "can_upload_output": false,
    "can_manage_designs": true,
    "can_import_statistics": true,
    "can_send_notifications": true,
    "can_view_audit_logs": false,
    "can_manage_vouchers": true,
    "can_view_revenue": true
  }',
  'Admin umum. Bisa kelola user, order, dan konten. Tidak bisa kelola admin lain atau tier.'
),
(
  '00000000-0000-0000-0001-000000000003',
  'Engineer',
  'engineer',
  '{
    "can_manage_admins": false,
    "can_manage_users": false,
    "can_ban_users": false,
    "can_manage_tiers": false,
    "can_assign_orders": false,
    "can_upload_output": true,
    "can_manage_designs": false,
    "can_import_statistics": false,
    "can_send_notifications": false,
    "can_view_audit_logs": false,
    "can_manage_vouchers": false,
    "can_view_revenue": false
  }',
  'Engineer/desainer. Hanya bisa melihat order yang di-assign dan mengupload output undangan.'
);

-- ---------------------------------------------------------------------------
-- SEED: admins — Super Admin pertama
-- WAJIB GANTI password_hash sebelum production!
-- Hash di bawah adalah bcrypt dari "SuperAdmin@Jay2024!"
-- Generate baru dengan: bcrypt.hash("password_baru", 12)
-- ---------------------------------------------------------------------------
INSERT INTO admins (id, full_name, email, password_hash, role_id, is_active) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  'Jay Collection Admin',
  'admin@jaycollection.id',
  -- !! GANTI INI SEBELUM PRODUCTION !!
  '$2b$12$placeholder.hash.replace.before.production.deploy',
  '00000000-0000-0000-0001-000000000001',
  TRUE
);

-- ---------------------------------------------------------------------------
-- SEED: design_categories
-- 6 kategori desain undangan populer di Indonesia
-- ---------------------------------------------------------------------------
INSERT INTO design_categories (id, name, slug, description, display_order) VALUES
(
  '00000000-0000-0000-0003-000000000001',
  'Modern Minimalis',
  'modern-minimalis',
  'Desain clean dengan tipografi modern, whitespace luas, dan palet warna netral. Cocok untuk pasangan urban.',
  1
),
(
  '00000000-0000-0000-0003-000000000002',
  'Tradisional & Adat',
  'tradisional-adat',
  'Desain kaya motif batik, tenun, dan ornamen nusantara. Menonjolkan identitas budaya daerah.',
  2
),
(
  '00000000-0000-0000-0003-000000000003',
  'Floral & Garden',
  'floral-garden',
  'Desain dengan elemen bunga dan botanis, nuansa romantic dan feminin. Paling populer untuk outdoor wedding.',
  3
),
(
  '00000000-0000-0000-0003-000000000004',
  'Rustic & Vintage',
  'rustic-vintage',
  'Estetika retro dengan tekstur kraft paper, watercolor, dan tipografi handwritten.',
  4
),
(
  '00000000-0000-0000-0003-000000000005',
  'Elegant & Mewah',
  'elegant-mewah',
  'Desain premium dengan aksen gold/silver, ornamen Art Deco, dan palet warna deep. Untuk wedding formal.',
  5
),
(
  '00000000-0000-0000-0003-000000000006',
  'Islami & Syari',
  'islami-syari',
  'Desain dengan kaligrafi Arab, ornamen islami, dan tema pernikahan sesuai syariat.',
  6
);

-- ---------------------------------------------------------------------------
-- SEED: wedding_statistics
-- Data simulasi berdasarkan struktur BPS. Ganti dengan data riil dari
-- https://www.bps.go.id sebelum production.
-- Ini hanya untuk development dan testing dashboard chart.
-- ---------------------------------------------------------------------------
INSERT INTO wedding_statistics (
  dataset_source, reference_year, province,
  age_group_min, age_group_max,
  total_marriages, avg_age_bride, avg_age_groom,
  notes, imported_by_admin_id
) VALUES
-- Data Nasional 2023
('BPS Indonesia - Simulasi Dev', 2023, NULL, 20, 24, 412000, 22.3, 24.7, 'Data simulasi untuk development. Ganti dengan data BPS riil.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, NULL, 25, 29, 531000, 26.8, 28.2, 'Data simulasi untuk development. Ganti dengan data BPS riil.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, NULL, 30, 34, 287000, 31.4, 32.9, 'Data simulasi untuk development. Ganti dengan data BPS riil.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, NULL, 35, 39, 143000, 36.2, 37.8, 'Data simulasi untuk development. Ganti dengan data BPS riil.', '00000000-0000-0000-0002-000000000001'),
-- Per Provinsi 2023 (5 provinsi sample)
('BPS Indonesia - Simulasi Dev', 2023, 'Jawa Barat',     25, 29, 118000, 26.1, 27.8, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, 'Jawa Tengah',    25, 29,  97000, 26.4, 28.0, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, 'Jawa Timur',     25, 29,  89000, 26.7, 28.3, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, 'DKI Jakarta',    25, 29,  42000, 27.2, 29.1, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2023, 'Sumatera Utara', 25, 29,  51000, 25.9, 27.6, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
-- Data tahun sebelumnya untuk chart tren
('BPS Indonesia - Simulasi Dev', 2022, NULL, 25, 29, 498000, 26.5, 27.9, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2021, NULL, 25, 29, 467000, 26.2, 27.6, 'Data simulasi.', '00000000-0000-0000-0002-000000000001'),
('BPS Indonesia - Simulasi Dev', 2020, NULL, 25, 29, 489000, 26.0, 27.4, 'Data simulasi.', '00000000-0000-0000-0002-000000000001');

COMMIT;

-- =============================================================================
-- VERIFIKASI SEED
-- Jalankan query ini setelah migration untuk memastikan data seed masuk:
-- =============================================================================
-- SELECT tier_slug, price_monthly, max_orders_per_month, ai_design_access FROM user_tiers ORDER BY price_monthly;
-- SELECT role_slug, permissions->>'can_ban_users' AS can_ban FROM admin_roles;
-- SELECT email, is_active FROM admins;
-- SELECT name, slug FROM design_categories ORDER BY display_order;
-- SELECT reference_year, province, total_marriages FROM wedding_statistics ORDER BY reference_year DESC LIMIT 5;
