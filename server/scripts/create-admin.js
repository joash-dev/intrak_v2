const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@intrak.site';
  const password = 'Password123!'; // Default password

  console.log(`Creating/Updating admin account: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      // Update password if user exists, just to be sure
      passwordHash,
      role: 'ADMIN'
    },
    create: {
      email,
      name: 'System Administrator',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('------------------------------------------------');
  console.log('✅ Admin Account Configured Successfully!');
  console.log('------------------------------------------------');
  console.log(`📧 Email:    ${user.email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('------------------------------------------------');
  console.log('You can change this password later in the settings.');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
