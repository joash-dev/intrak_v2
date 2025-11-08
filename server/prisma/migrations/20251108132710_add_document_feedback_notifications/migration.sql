/*
  Warnings:

  - The values [ACCEPTED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `applicationDeadline` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `filledSlots` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `totalSlots` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `company_applications` table. All the data in the column will be lost.
  - You are about to drop the column `expectations` on the `company_applications` table. All the data in the column will be lost.
  - You are about to drop the column `motivation` on the `company_applications` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `company_applications` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `company_applications` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `company_applications` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `company_applications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('USER_REGISTERED', 'USER_UPDATED', 'USER_DELETED', 'DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'ATTENDANCE_LOGGED', 'EVALUATION_SUBMITTED', 'ANNOUNCEMENT_CREATED', 'COMPANY_ADDED', 'STUDENT_ASSIGNED', 'SETTINGS_UPDATED', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGED');

-- CreateEnum
CREATE TYPE "DocumentFeedbackType" AS ENUM ('COMMENT', 'REQUEST_CHANGES', 'APPROVAL_NOTE', 'STUDENT_RESPONSE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOCUMENT', 'ATTENDANCE', 'SYSTEM', 'ALERT', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
ALTER TABLE "company_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "company_applications" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "company_applications" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'RESUBMISSION_REQUESTED';

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "applicationDeadline",
DROP COLUMN "filledSlots",
DROP COLUMN "requirements",
DROP COLUMN "totalSlots",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "maxSlots" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "company_applications" DROP COLUMN "endDate",
DROP COLUMN "expectations",
DROP COLUMN "motivation",
DROP COLUMN "notes",
DROP COLUMN "skills",
DROP COLUMN "startDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "document_feedback" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "DocumentFeedbackType" NOT NULL DEFAULT 'COMMENT',
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'OTHER',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL DEFAULT 'INFO',
    "priority" "AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_feedback" ADD CONSTRAINT "document_feedback_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_feedback" ADD CONSTRAINT "document_feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
