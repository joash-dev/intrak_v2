-- AlterTable
ALTER TABLE "company_proposals"
ADD COLUMN "companyYears" INTEGER,
ADD COLUMN "assignedDepartment" TEXT,
ADD COLUMN "assignedRole" TEXT,
ADD COLUMN "hasPsuMoa" BOOLEAN;
