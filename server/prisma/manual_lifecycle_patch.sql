DO $$ BEGIN
  CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'PURGED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "StudentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "retentionUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalHold" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "legalHoldReason" TEXT,
  ADD COLUMN IF NOT EXISTS "legalHoldSetById" TEXT,
  ADD COLUMN IF NOT EXISTS "legalHoldSetAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "students"
  ADD CONSTRAINT "students_legalHoldSetById_fkey"
  FOREIGN KEY ("legalHoldSetById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "students_lifecycleStatus_idx" ON "students"("lifecycleStatus");
CREATE INDEX IF NOT EXISTS "students_retentionUntil_idx" ON "students"("retentionUntil");
CREATE INDEX IF NOT EXISTS "students_legalHold_idx" ON "students"("legalHold");
