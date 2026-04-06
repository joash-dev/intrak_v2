-- CreateEnum
CREATE TYPE "AttendanceNoWorkReason" AS ENUM ('TYPHOON', 'NATURAL_DISASTER', 'POWER_OUTAGE', 'TRANSPORT_INTERRUPTED', 'COMPANY_SUSPENDED', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceNoWorkStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "attendance_no_work_notices" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "reason" "AttendanceNoWorkReason" NOT NULL,
    "details" TEXT,
    "status" "AttendanceNoWorkStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "supervisorRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_no_work_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_no_work_notices_studentId_dateKey_key" ON "attendance_no_work_notices"("studentId", "dateKey");

-- CreateIndex
CREATE INDEX "attendance_no_work_notices_studentId_idx" ON "attendance_no_work_notices"("studentId");

-- CreateIndex
CREATE INDEX "attendance_no_work_notices_status_idx" ON "attendance_no_work_notices"("status");

-- CreateIndex
CREATE INDEX "attendance_no_work_notices_dateKey_idx" ON "attendance_no_work_notices"("dateKey");

-- AddForeignKey
ALTER TABLE "attendance_no_work_notices" ADD CONSTRAINT "attendance_no_work_notices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_no_work_notices" ADD CONSTRAINT "attendance_no_work_notices_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
