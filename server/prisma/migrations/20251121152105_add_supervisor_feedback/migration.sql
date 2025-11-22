-- CreateTable
CREATE TABLE "supervisor_feedbacks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "punctualRating" INTEGER NOT NULL,
    "knowledgeRating" INTEGER NOT NULL,
    "teamworkRating" INTEGER NOT NULL,
    "taskPerformanceRating" INTEGER NOT NULL,
    "policyComplianceRating" INTEGER NOT NULL,
    "conductRating" INTEGER NOT NULL,
    "traitsRating" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_feedbacks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supervisor_feedbacks" ADD CONSTRAINT "supervisor_feedbacks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_feedbacks" ADD CONSTRAINT "supervisor_feedbacks_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
