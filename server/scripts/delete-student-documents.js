/* 
  Delete all documents for a student by their User.name.
  Usage:
    node server/scripts/delete-student-documents.js "Student Full Name"

  Example:
    node server/scripts/delete-student-documents.js "Blezielle Santos"
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const targetName = process.argv[2] || 'Blezielle Santos';
  console.log(`🚨 Deleting all documents for student: ${targetName}`);

  // Find the user first
  const user = await prisma.user.findFirst({
    where: { name: targetName, role: 'STUDENT' },
    select: { id: true, name: true, student: { select: { id: true, studentNumber: true } } },
  });

  if (!user || !user.student) {
    console.error('❌ Student not found or user has no student record.');
    process.exit(1);
  }

  const studentId = user.student.id;
  console.log(`Found studentId=${studentId} (${user.student.studentNumber || 'no-student-number'})`);

  // Count existing documents
  const countBefore = await prisma.document.count({ where: { studentId } });
  console.log(`Documents found: ${countBefore}`);

  if (countBefore === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete feedback first due to FK constraints
  const feedbackDeleted = await prisma.documentFeedback.deleteMany({
    where: { document: { studentId } },
  });
  console.log(`🗑️  Deleted feedback entries: ${feedbackDeleted.count}`);

  // Delete documents
  const result = await prisma.document.deleteMany({ where: { studentId } });
  console.log(`🗑️  Deleted documents: ${result.count}`);

  console.log('✅ Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


