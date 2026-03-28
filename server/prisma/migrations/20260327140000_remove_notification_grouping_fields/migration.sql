DROP INDEX IF EXISTS "notifications_userId_aggregateKey_read_idx";

ALTER TABLE "notifications"
DROP COLUMN IF EXISTS "lastEmailSentAt",
DROP COLUMN IF EXISTS "aggregateKey",
DROP COLUMN IF EXISTS "notificationCount",
DROP COLUMN IF EXISTS "updatedAt";