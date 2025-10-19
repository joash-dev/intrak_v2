-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "filledSlots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "totalSlots" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "company_applications" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "motivation" TEXT,
    "skills" TEXT,
    "expectations" TEXT,

    CONSTRAINT "company_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_applications_studentId_companyId_key" ON "company_applications"("studentId", "companyId");

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
