/*
  List all students with their startDate.
  Usage:
    node server/scripts/list-student-start-dates.js
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  const students = await prisma.student.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Name, StudentNumber, Email, StartDate');
  for (const s of students) {
    console.log(`${s.user?.name || 'Unknown'}, ${s.studentNumber}, ${s.user?.email || ''}, ${formatDate(s.startDate)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


