BEGIN;

ALTER TABLE admin_audit_logs 
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

COMMENT ON COLUMN admin_audit_logs.details IS 
  'Kolom fleksibel untuk payload audit yang tidak dipetakan ke before_value/after_value. Ditambahkan migration 013 karena banyak controller sudah menulis ke kolom ini sejak awal tanpa kolom aslinya pernah dibuat.';

COMMIT;