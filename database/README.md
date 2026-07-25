🗄️ Jay Digital Invitation — Database Documentation

Overview

Dokumentasi ini mencakup arsitektur, skema tabel, dan petunjuk migrasi database PostgreSQL & Redis untuk platform Jay Digital Invitation.

Setelah pemutakhiran Fase 6 (Enterprise Admin & Compliance Groundwork), database saat ini terdiri dari 28 tabel, 6 views, 6 trigger functions, dan 16 triggers yang terbagi dalam domain fungsional yang kokoh dan aman.

**Penamaan Database:** Nama fisik database (`jay_collection`) sengaja **tidak diubah** mengikuti rebranding produk menjadi "Jay Digital Invitation". Ini adalah keputusan sadar untuk menjaga stabilitas sistem — rename database production berisiko downtime dan tidak memberi manfaat user-facing apapun karena nama database tidak pernah terlihat oleh pengguna akhir. Developer baru yang bergabung ke proyek ini **tidak perlu** "memperbaiki" inkonsistensi ini.

📁 Struktur File Database

database/
├── migrations/
│   ├── 001_setup_extensions_and_enums.sql     ← Extensions & semua ENUM types
│   ├── 002_create_user_auth_tables.sql         ← Domain 1: User & Auth (10 tabel)
│   ├── 003_create_admin_operations_tables.sql  ← Domain 2: Admin & Ops (8 tabel, id: UUID)
│   ├── 004_create_order_content_tables.sql     ← Domain 3: Order & Content (7 tabel)
│   ├── 005_create_functions_triggers_views.sql ← Functions, Triggers, & Views awal
│   ├── 006_seed_initial_data.sql              ← Data awal (tiers, roles, admin)
│   └── 007_enterprise_admin_expansion.sql     ← PEMUTAKHIRAN: MFA, PDPA, IP Whitelist, Finance View
├── run_all_migrations.sql                     ← Runner script psql manual
└── README.md                                  ← Dokumentasi ini


🚀 Cara Menjalankan Migrasi

Setup Awal & Jalankan Semua Skema (Pertama Kali)

Jika Anda ingin membangun database kosong dari awal dan mengeksekusi seluruh skema migrasi secara berurutan:

# 1. Buat database baru di PostgreSQL
psql -U postgres -c "CREATE DATABASE jay_collection;"

# 2. Jalankan master migration runner untuk mengeksekusi semua SQL
psql -U postgres -d jay_collection -f database/run_all_migrations.sql


Menjalankan Migrasi Tambahan Saja (Fase 6 Groundwork)

Jika database Anda sudah terisi dan Anda hanya ingin menerapkan skema tambahan dari pemutakhiran Fase 6 (007_enterprise_admin_expansion.sql):

psql -U postgres -d jay_collection -f database/migrations/007_enterprise_admin_expansion.sql


🏛️ Domain & Skema Tabel Terupdate

Domain 1 — User, Auth & Compliance (11 Tabel)

Nama Tabel

Tipe ID

Fungsi & Deskripsi

user_tiers

INT

Definisi tier paket langganan (Biasa, Keren, Prioritas)

users

INT

Identitas user utama (Mendukung Form Lokal + Google OAuth)

user_tier_subscriptions

INT

Log riwayat langganan dan status transaksi paket user

user_account_status

INT

Status ban, jumlah kegagalan login, dan tracking login terakhir

login_sessions

INT

Session token aktif user untuk verifikasi request API

login_audit

INT

Log permanen seluruh aktivitas percobaan masuk (Audit Trail)

password_resets

INT

Token reset password sekali pakai (Masa kedaluwarsa 1 jam, single-use)

couple_links

INT

Relasi keterhubungan pasangan nikah antar akun user

couple_interactions

INT

Log poin aktivitas pasangan untuk akumulasi gamifikasi skor

vouchers

INT

Voucher diskon platform hasil dari pencapaian couple interaction

pdpa_consent_audits

INT

[BARU] Log audit kepatuhan UU PDPA No. 27/2022 (Consent & Penghapusan Data)

Domain 2 — Admin & Security Operations (10 Tabel)

Nama Tabel

Tipe ID

Fungsi & Deskripsi

admin_roles

INT

Definisi tingkatan wewenang admin dengan JSONB Permissions

admins

UUID

Identitas admin platform (Mendukung MFA TOTP Groundwork)

admin_sessions

INT

Session token aktif admin dengan TTL ketat durasi 8 jam

admin_audit_logs

INT

Pelacakan aktivitas perubahan sistem yang dilakukan oleh admin

admin_allowed_ips

INT

[BARU] Daftar putih IP (IP Whitelisting) yang diizinkan mengakses Admin Panel

order_internal_notes

INT

[BARU] Catatan internal operasional per order/pesanan untuk internal tim admin

Domain 3 — Order, Content & Metadata (7 Tabel)

Nama Tabel

Tipe ID

Fungsi & Deskripsi

orders

INT

Data pesanan paket undangan digital (dilengkapi order_code unik)

payments

INT

Integrasi pembayaran (menampung field amount, status, payment_method)

wedding_details

INT

Metadata detail acara pernikahan (Tanggal, Nama Pengantin, Lokasi)

invitation_assets

INT

Peta aset media cloud (Cloudinary SDK upload) untuk foto/video user

guests

INT

Daftar tamu undangan yang didaftarkan oleh pasangan pengantin

rsvp_responses

INT

Kehadiran, ucapan doa, serta konfirmasi jumlah pax dari tamu

ai_theme_suggestions

INT

Hasil rekomendasi AI untuk layout undangan (FastAPI Python Service)

📊 Database Views & Financial Analytics

Database ini mengintegrasikan fungsi analisis keuangan langsung pada layer database untuk mempercepat load-time dashboard admin:

view_payment_reconciliation (Realisasi Profit Bersih)

View ini secara otomatis menghitung estimasi keuntungan bersih (Net Profit) real-time setelah dipotong oleh biaya flat rate / persentase dari payment gateway Midtrans (QRIS 0.7%, Bank Transfer Rp4.000):

CREATE OR REPLACE VIEW view_payment_reconciliation AS
SELECT 
    p.id AS payment_id,
    p.order_id,
    o.user_id,
    p.amount,
    CASE 
        WHEN p.payment_method = 'qris' THEN (p.amount * 0.993)
        ELSE (p.amount - 4000)
    END AS estimated_net_amount,
    p.payment_method,
    p.status,
    p.updated_at AS settlement_time,
    p.created_at
FROM payments p
JOIN orders o ON p.order_id = o.id;


🔒 Skema Keamanan & Redis Caching (Aset Kritis)

Untuk menjamin skalabilitas tinggi dan pertahanan dari brute-force attack, sistem mengimplementasikan Redis caching dengan pola key berikut:

Key Pattern

Tipe Data

TTL

Fungsi Sistem

login_count:{username}

String (int)

24 Jam

Counter kegagalan login (Auto-Ban 24 jam jika gagal login 10x)

session:{token}

String (JSON)

7 Hari

Cache session user aktif (Mereduksi DB overhead hit ke PostgreSQL)

admin_session:{token}

String (JSON)

8 Jam

Cache session kredensial admin panel

rate_limit:{ip}

String (int)

1 Menit

Anti-abuse API Rate Limiter

order_queue:{order_id}

String

-

Antrean real-time pemrosesan media prewedding

⚠️ Catatan Penting untuk Tahap Produksi

Keamanan JWT: Variabel rahasia JWT_SECRET_USER and JWT_SECRET_ADMIN harus dibedakan secara ketat di file .env produksi.

Kepatuhan Regulasi: Tabel pdpa_consent_audits wajib diisi tiap kali user mencentang persetujuan syarat ketentuan atau melakukan request ekspor/penghapusan akun data pribadi.

MFA Enforcement: Jika admin mengaktifkan mfa_enabled = true, session middleware pada backend akan menolak request sampai kode TOTP yang valid dimasukkan.