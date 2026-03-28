-- AlterTable
ALTER TABLE "company_proposals" ADD COLUMN IF NOT EXISTS "assignedDepartment" TEXT;
ALTER TABLE "company_proposals" ADD COLUMN IF NOT EXISTS "assignedRole" TEXT;
ALTER TABLE "company_proposals" ADD COLUMN IF NOT EXISTS "companyYears" INTEGER;
ALTER TABLE "company_proposals" ADD COLUMN IF NOT EXISTS "hasPsuMoa" BOOLEAN;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "aggregateKey" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "notificationCount" INTEGER NOT NULL DEFAULT 1;
-- Keep NOT NULL; provide default to satisfy existing rows during migration application.
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE IF EXISTS "system_runtime_config";

-- CreateTable
CREATE TABLE IF NOT EXISTS "message_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetRoles" "Role"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "message_templates_isActive_idx" ON "message_templates"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_userId_aggregateKey_read_idx" ON "notifications"("userId", "aggregateKey", "read");
