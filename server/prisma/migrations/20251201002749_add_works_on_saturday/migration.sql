-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "companyType" "CompanyType" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "workingDays" TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']::TEXT[];

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "worksOnSaturday" BOOLEAN NOT NULL DEFAULT false;
