# Jay Collection's for Wedding — Database Documentation

## Overview

Database PostgreSQL untuk platform **Jay Collection's for Wedding**. Terdiri dari 25 tabel, 5 views, 6 trigger functions, dan 16 triggers yang terbagi dalam 3 domain fungsional.

---

## Struktur File

```
database/
├── migrations/
│   ├── 001_setup_extensions_and_enums.sql    ← Extensions & semua ENUM types
│   ├── 002_create_user_auth_tables.sql        ← Domain 1: User & Auth (10 tabel)
│   ├── 003_create_admin_operations_tables.sql ← Domain 2: Admin & Ops (8 tabel)
│   ├── 004_create_order_content_tables.sql    ← Domain 3: Order & Content (7 tabel)
│   ├── 005_create_functions_triggers_views.sql← Functions, Triggers, Views
│   └── 006_seed_initial_data.sql             ← Data awal (tiers, roles, admin)
├── run_all_migrations.sql                    ← Runner script (jalankan ini)
└── README.md                                 ← Dokumentasi ini
```

---

## Cara Menjalankan

### Setup Awal (pertama kali)

```bash
# 1. Buat database
psql -U postgres -c "CREATE DATABASE jay_collection;"

# 2. Jalankan semua migration sekaligus
psql -U postgres -d jay_collection -f database/run_all_migrations.sql
```

### Reset Database (development only)

```bash
# ⚠️ BAHAYA: Menghapus SEMUA data!
psql -U postgres -c "DROP DATABASE IF EXISTS jay_collection;"
psql -U postgres -c "CREATE DATABASE jay_collection;"
psql -U postgres -d jay_collection -f database/run_all_migrations.sql
```

### Rollback Manual

Setiap file migration menyertakan blok `ROLLBACK REFERENCE` di bagian bawah.
Jalankan query rollback secara **terbalik** (004 dulu, lalu 003, dst).

---

## Domain & Tabel

### Domain 1 — User & Auth (10 tabel)
| Tabel | Fungsi |
|---|---|
| `user_tiers` | Definisi tier langganan (Biasa, Keren, Prioritas) |
| `users` | Identitas user, mendukung form + Google OAuth |
| `user_tier_subscriptions` | Riwayat semua subscription tier per user |
| `user_account_status` | Status ban, login fail count, last login |
| `login_sessions` | Session aktif user |
| `login_audit` | Log permanen semua percobaan login |
| `password_resets` | Token reset password (expire 1 jam, single-use) |
| `couple_links` | Relasi pasangan antar user |
| `couple_interactions` | Log event interaksi pasangan untuk scoring |
| `vouchers` | Voucher diskon dari couple interaction |

### Domain 2 — Admin & Operations (8 tabel)
| Tabel | Fungsi |
|---|---|
| `admin_roles` | Definisi role admin dengan JSONB permissions |
| `admins` | Identitas admin (terpisah sepenuhnya dari users) |
| `admin_sessions` | Session aktif admin (durasi 8 jam) |
| `admin_audit_logs` | Audit log immutable setiap aksi admin |
| `order_assignments` | Assignment order ke engineer |
| `invitation_outputs` | File output undangan yang diupload engineer |
| `system_notifications` | Notifikasi dari admin ke user |
| `wedding_statistics` | Dataset statistik pernikahan (BPS) |

### Domain 3 — Order & Content (7 tabel)
| Tabel | Fungsi |
|---|---|
| `design_categories` | Kategori referensi desain |
| `design_references` | Koleksi referensi desain dengan AI prompt |
| `orders` | Tabel inti transaksi undangan |
| `order_status_logs` | Audit trail setiap perubahan status order |
| `payments` | Data pembayaran Midtrans dengan raw callback |
| `order_assets` | File upload user (foto, video, dll) |
| `ai_design_requests` | Log request ke AI model |

---

## Views

| View | Dipakai Untuk |
|---|---|
| `v_active_users` | Dashboard admin: daftar user aktif + tier saat ini |
| `v_order_summary` | Admin panel: monitoring semua order + engineer + payment |
| `v_couple_dashboard` | Dashboard user: info pasangan + progress voucher |
| `v_wedding_stats_summary` | Dashboard user: chart statistik pernikahan |
| `v_design_catalog` | Halaman Referensi Design: katalog desain aktif |

---

## Trigger Functions

| Function | Terpicu Pada | Fungsi |
|---|---|---|
| `set_updated_at()` | UPDATE di 11 tabel | Auto-update kolom `updated_at` |
| `generate_order_code()` | INSERT orders | Generate `JAY-YYYY-XXXXXX` |
| `generate_voucher_code()` | INSERT vouchers | Generate `JAYCOUPLE-XXXXXXXX` |
| `log_order_status_change()` | UPDATE orders | Auto-insert ke `order_status_logs` |
| `check_invitation_output_final()` | INSERT/UPDATE invitation_outputs | Pastikan hanya 1 final per order |
| `recalculate_couple_interaction_score()` | INSERT couple_interactions | Hitung ulang score + cek voucher threshold |
| `increment_design_view_count()` | INSERT/UPDATE orders | Increment view_count desain yang dipilih |

---

## ENUM Types

| ENUM | Values |
|---|---|
| `user_tier_status` | active, expired, cancelled |
| `couple_link_status` | pending, accepted, rejected, dissolved |
| `couple_interaction_type` | both_login_same_day, partner_profile_view, shared_order_created, partner_design_view |
| `admin_role` | super_admin, admin, engineer |
| `assignment_status` | assigned, in_progress, review, completed, reassigned |
| `notification_target` | all_users, tier_basic, tier_keren, tier_prioritas, specific_user |
| `order_status` | draft, pending_payment, paid, in_queue, in_progress, review, ready, completed, cancelled, refunded |
| `payment_method` | bank_transfer, virtual_account, qris, gopay, ovo, dana, credit_card, indomaret, alfamart |
| `payment_status` | pending, settlement, capture, deny, cancel, expire, refund, partial_refund |
| `asset_type` | photo_couple, photo_prewedding, photo_family, video_highlight, document_maps, logo_custom, other |
| `ai_request_status` | queued, processing, completed, failed, cancelled |

---

## Redis Keys (Referensi)

Selain PostgreSQL, Redis dipakai untuk:

| Key Pattern | Tipe | TTL | Fungsi |
|---|---|---|---|
| `login_count:{user_id}` | String (int) | 24 jam | Counter login gagal (auto-reset setelah ban selesai) |
| `session:{token}` | String (JSON) | 7 hari | Cache session user (mengurangi DB hit) |
| `admin_session:{token}` | String (JSON) | 8 jam | Cache session admin |
| `rate_limit:{ip}` | String (int) | 1 menit | Anti-abuse per IP |
| `order_queue:{order_id}` | String | - | Status antrian order real-time |

---

## Catatan Penting untuk Production

1. **Ganti password hash super admin** di `006_seed_initial_data.sql` sebelum deploy
2. **Ganti data statistik BPS** dengan data riil dari bps.go.id
3. **Setup pg_cron** (atau external scheduler) untuk cleanup: expired sessions, expired password resets
4. **Setup Row Level Security (RLS)** jika menggunakan Supabase sebagai host PostgreSQL
5. **Backup otomatis** harus dikonfigurasi — minimal daily dump ke cloud storage

---

## Environment Variables (Database)

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/jay_collection
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://user:password@host:6379

# Secrets (berbeda untuk user dan admin!)
JWT_SECRET_USER=your_super_secret_user_key_min_32_chars
JWT_SECRET_ADMIN=your_super_secret_admin_key_min_32_chars_different

# Midtrans
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
