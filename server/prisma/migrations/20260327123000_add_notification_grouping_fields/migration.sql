-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "aggregateKey" TEXT,
ADD COLUMN "notificationCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill updatedAt from createdAt for existing rows
UPDATE "notifications"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

-- Index for grouped unread notification lookups
CREATE INDEX "notifications_userId_aggregateKey_read_idx"
ON "notifications"("userId", "aggregateKey", "read");
