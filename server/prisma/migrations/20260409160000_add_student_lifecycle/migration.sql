-- CreateEnum
CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'PURGED');

-- AlterTable
ALTER TABLE "students"
ADD COLUMN "lifecycleStatus" "StudentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "retentionUntil" TIMESTAMP(3),
ADD COLUMN "legalHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "legalHoldReason" TEXT,
ADD COLUMN "legalHoldSetById" TEXT,
ADD COLUMN "legalHoldSetAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "students_lifecycleStatus_idx" ON "students"("lifecycleStatus");
CREATE INDEX "students_retentionUntil_idx" ON "students"("retentionUntil");
CREATE INDEX "students_legalHold_idx" ON "students"("legalHold");

-- AddForeignKey
ALTER TABLE "students"
ADD CONSTRAINT "students_legalHoldSetById_fkey"
FOREIGN KEY ("legalHoldSetById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
