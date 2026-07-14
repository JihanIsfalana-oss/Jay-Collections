-- ========================================================
-- EKSPANSI SCHEMA UNTUK ENTERPRISE ADMIN & COMPLIANCE STANDARD
-- ========================================================

-- 1. SECURITY UPGRADE: Tambahkan kolom MFA (TOTP) ke tabel admins
ALTER TABLE admins ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS backup_codes JSONB;

-- 2. INFRASTRUCTURE & APP SECURITY: Tabel pembatasan IP untuk Admin Panel
CREATE TABLE IF NOT EXISTS admin_allowed_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE, -- Mendukung IPv4 dan IPv6
    label VARCHAR(100), -- Contoh: 'IP Kantor Jay', 'VPN Server'
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL, -- Kompatibel dengan UUID admins.id
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. OPERATIONAL EXCELLENCE: Tabel Catatan Internal untuk Tim Manajemen Pesanan
CREATE TABLE IF NOT EXISTS order_internal_notes (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. PDPA COMPLIANCE (UU No. 27/2022): Log Persetujuan & Workflow Penghapusan Data Pribadi
CREATE TABLE IF NOT EXISTS pdpa_consent_audits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'CONSENT_GIVEN', 'DATA_EXPORT_REQ', 'PURGE_REQUEST'
    details JSONB, -- Menyimpan data payload apa yang diekspor/dihapus
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. FINANCIAL RECONCILIATION VIEW: Menggabungkan Data Kas Masuk dari Midtrans vs Net Profit
CREATE OR REPLACE VIEW view_payment_reconciliation AS
SELECT 
    p.id AS payment_id,
    p.order_id,
    o.user_id,
    p.amount, -- Diubah dari gross_amount ke amount agar sesuai dengan database riil
    -- Estimasi Net Profit: gross dikurangi biaya potongan Midtrans (misal QRIS 0.7%, VA Rp 4.000)
    CASE 
        WHEN p.payment_method = 'qris' THEN (p.amount * 0.993)
        ELSE (p.amount - 4000)
    END AS estimated_net_amount,
    p.payment_method,
    p.status, -- Diubah dari payment_status ke status sesuai dengan tabel payments riil
    p.updated_at AS settlement_time, -- Menggunakan updated_at sebagai representasi waktu settlement
    p.created_at
FROM payments p
JOIN orders o ON p.order_id = o.id;