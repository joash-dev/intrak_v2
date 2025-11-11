-- CreateTable
CREATE TABLE "coordinator_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "autoApproveDocuments" BOOLEAN NOT NULL DEFAULT false,
    "requireDocumentReview" BOOLEAN NOT NULL DEFAULT true,
    "attendanceReminderTime" TEXT NOT NULL DEFAULT '09:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinator_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_settings_userId_key" ON "coordinator_settings"("userId");

-- AddForeignKey
ALTER TABLE "coordinator_settings" ADD CONSTRAINT "coordinator_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
