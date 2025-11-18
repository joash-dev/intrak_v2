-- AlterTable
ALTER TABLE "coordinator_settings" ADD COLUMN     "defaultAnnouncementAudience" TEXT NOT NULL DEFAULT 'ALL',
ADD COLUMN     "enableBulkOperations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationFrequency" TEXT NOT NULL DEFAULT 'immediate',
ADD COLUMN     "showAdvancedMetrics" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "partnership_messages" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "partnership_messages" ADD CONSTRAINT "partnership_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_messages" ADD CONSTRAINT "partnership_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
