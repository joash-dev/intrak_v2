/*
  Warnings:

  - Added the required column `category` to the `document_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PRE_DEPLOYMENT', 'UPON_APPROVAL', 'POST_OJT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'RECORD_FILE';
ALTER TYPE "DocumentType" ADD VALUE 'APPLICATION_INTERNSHIP';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE 'CERTIFICATION_UNITS';
ALTER TYPE "DocumentType" ADD VALUE 'INTERNSHIP_RESUME';
ALTER TYPE "DocumentType" ADD VALUE 'CONSENT_FORM';
ALTER TYPE "DocumentType" ADD VALUE 'ENDORSEMENT_LETTER';
ALTER TYPE "DocumentType" ADD VALUE 'INTERNSHIP_RELEASE';
ALTER TYPE "DocumentType" ADD VALUE 'INTERNSHIP_AGREEMENT';
ALTER TYPE "DocumentType" ADD VALUE 'TRAINING_AGREEMENT';
ALTER TYPE "DocumentType" ADD VALUE 'INTERNSHIP_EVALUATION';
ALTER TYPE "DocumentType" ADD VALUE 'CERTIFICATE_COMPLETION';
ALTER TYPE "DocumentType" ADD VALUE 'NARRATIVE_REPORT';
ALTER TYPE "DocumentType" ADD VALUE 'DTR_PHOTOCOPY';
ALTER TYPE "DocumentType" ADD VALUE 'TIME_FRAMES';
ALTER TYPE "DocumentType" ADD VALUE 'WEEKLY_REPORTS';
ALTER TYPE "DocumentType" ADD VALUE 'STUDENT_FEEDBACK';
ALTER TYPE "DocumentType" ADD VALUE 'SUPERVISOR_FEEDBACK';
ALTER TYPE "DocumentType" ADD VALUE 'AGENCY_SELF_EVALUATION';
ALTER TYPE "DocumentType" ADD VALUE 'AGENCY_STUDENT_EVALUATION';

-- AlterTable
-- First add the column as nullable
ALTER TABLE "document_templates" ADD COLUMN     "category" "DocumentCategory";

-- Update existing records with a default category
UPDATE "document_templates" SET "category" = 'PRE_DEPLOYMENT' WHERE "category" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "document_templates" ALTER COLUMN "category" SET NOT NULL;
