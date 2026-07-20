BEGIN;

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'challenge';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'failure';

COMMIT;