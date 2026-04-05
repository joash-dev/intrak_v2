-- CreateTable
CREATE TABLE "partnership_conversation_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_conversation_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partnership_conversation_reads_userId_studentId_key" ON "partnership_conversation_reads"("userId", "studentId");

-- CreateIndex
CREATE INDEX "partnership_conversation_reads_userId_idx" ON "partnership_conversation_reads"("userId");

-- AddForeignKey
ALTER TABLE "partnership_conversation_reads" ADD CONSTRAINT "partnership_conversation_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_conversation_reads" ADD CONSTRAINT "partnership_conversation_reads_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
