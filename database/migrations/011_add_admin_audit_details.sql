-- =============================================================================
-- MIGRATION 011 — ADMIN AUDIT DETAILS COLUMN
-- Project  : Jay Digital Invitation
-- Author   : Data Engineering Team
-- Created  : 2026-07-18
-- Purpose  : Menambahkan kolom details agar seluruh insert audit log yang
--            sudah dipakai controller tetap kompatibel dengan schema terbaru.
-- =============================================================================

BEGIN;

ALTER TABLE admin_audit_logs
  ADD COLUMN IF NOT EXISTS details JSONB;

COMMENT ON COLUMN admin_audit_logs.details IS 'Payload JSON fleksibel untuk audit event tambahan di luar before_value/after_value.';

COMMIT;