-- CreateEnum
CREATE TYPE "CompanyProposalStatus" AS ENUM (
  'SUBMITTED_TO_INSTRUCTOR',
  'RETURNED_BY_INSTRUCTOR',
  'REJECTED_BY_INSTRUCTOR',
  'FORWARDED_TO_COORDINATOR',
  'UNDER_COORDINATOR_REVIEW',
  'PENDING_EXTERNAL_APPROVAL',
  'APPROVED',
  'REJECTED'
);

-- CreateEnum
CREATE TYPE "CompanyProposalDocumentType" AS ENUM (
  'STUDENT_PROPOSAL',
  'INSTRUCTOR_ENDORSEMENT',
  'COORDINATOR_FINAL_DOCUMENT',
  'SUPPORTING_DOCUMENT'
);

-- CreateTable
CREATE TABLE "company_proposals" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "instructorId" TEXT,
  "companyName" TEXT NOT NULL,
  "address" TEXT,
  "contactPerson" TEXT,
  "contactEmail" TEXT,
  "contactNumber" TEXT,
  "industry" TEXT,
  "remarks" TEXT,
  "coordinatorRemarks" TEXT,
  "externalReference" TEXT,
  "status" "CompanyProposalStatus" NOT NULL DEFAULT 'SUBMITTED_TO_INSTRUCTOR',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "instructorReviewedAt" TIMESTAMP(3),
  "coordinatorReviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_proposal_attachments" (
  "id" TEXT NOT NULL,
  "proposalId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "documentType" "CompanyProposalDocumentType" NOT NULL,
  "filename" TEXT NOT NULL,
  "filepath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_proposal_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_proposals_studentId_idx" ON "company_proposals"("studentId");
CREATE INDEX "company_proposals_instructorId_idx" ON "company_proposals"("instructorId");
CREATE INDEX "company_proposals_status_idx" ON "company_proposals"("status");
CREATE INDEX "company_proposal_attachments_proposalId_idx" ON "company_proposal_attachments"("proposalId");
CREATE INDEX "company_proposal_attachments_uploadedById_idx" ON "company_proposal_attachments"("uploadedById");
CREATE INDEX "company_proposal_attachments_role_idx" ON "company_proposal_attachments"("role");

-- AddForeignKey
ALTER TABLE "company_proposals"
ADD CONSTRAINT "company_proposals_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "students"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_proposals"
ADD CONSTRAINT "company_proposals_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_proposal_attachments"
ADD CONSTRAINT "company_proposal_attachments_proposalId_fkey"
FOREIGN KEY ("proposalId") REFERENCES "company_proposals"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_proposal_attachments"
ADD CONSTRAINT "company_proposal_attachments_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
