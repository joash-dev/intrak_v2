-- AlterTable
ALTER TABLE "students" ADD COLUMN     "instructorId" TEXT;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
