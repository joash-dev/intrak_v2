const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { productionAccounts } = require('../../production-accounts/create-production-accounts');

const prisma = new PrismaClient();

const parseYear = (value) => {
  if (!value) return 4;
  const match = String(value).match(/\d+/);
  if (!match) return 4;
  const year = parseInt(match[0], 10);
  return Number.isFinite(year) ? year : 4;
};

async function upsertAccount(account) {
  const fullName = `${account.firstName} ${account.lastName}`.trim();
  const passwordHash = await bcrypt.hash(account.password, 12);

  const role = account.role === 'SUPERVISOR' ? 'INDUSTRY_PARTNER' : account.role;

  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: {
      name: fullName,
      passwordHash,
      role,
      department: account.department ?? null,
      active: account.active ?? true,
    },
    create: {
      email: account.email,
      name: fullName,
      passwordHash,
      role,
      department: account.department ?? null,
      active: account.active ?? true,
    },
  });

  if (account.role === 'STUDENT') {
    const year = parseYear(account.year);
    const section = account.section || 'A';

    await prisma.student.upsert({
      where: { userId: user.id },
      update: {
        program: account.program || 'BS Computer Engineering',
        year,
        section,
        studentNumber: account.studentNumber,
      },
      create: {
        userId: user.id,
        studentNumber: account.studentNumber,
        program: account.program || 'BS Computer Engineering',
        year,
        section,
      },
    });
  }

  return user;
}

async function main() {
  try {
    console.log('🚀 Seeding production-style accounts...');

    for (const account of productionAccounts) {
      await upsertAccount(account);
      console.log(`✔ ${account.role} account ready: ${account.email}`);
    }

    console.log('✅ All accounts processed.');
  } catch (error) {
    console.error('❌ Failed to seed accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
