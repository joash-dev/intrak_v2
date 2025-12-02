import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying database schema...');
  
  try {
    // Check Company table for companyType
    console.log('Checking Company table for companyType...');
    // We don't need to find a record, just attempting the query with the select is enough to trigger the error if the column is missing
    // But finding one is better if data exists.
    const company = await prisma.company.findFirst({
      select: {
        id: true,
        companyType: true
      }
    });
    console.log('✅ Company table check passed. companyType is accessible.');

    // Check Student table for worksOnSaturday
    console.log('Checking Student table for worksOnSaturday...');
    const student = await prisma.student.findFirst({
      select: {
        id: true,
        worksOnSaturday: true
      }
    });
    console.log('✅ Student table check passed. worksOnSaturday is accessible.');

    console.log('🎉 Schema verification successful!');
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
