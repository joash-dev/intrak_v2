const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@intrak.edu.ph';
  const password = 'Admin@2024!';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'System Administrator',
      passwordHash,
      role: 'ADMIN',
      department: 'IT Department',
      active: true,
    },
    create: {
      email,
      name: 'System Administrator',
      passwordHash,
      role: 'ADMIN',
      department: 'IT Department',
    },
  });

  console.log('Admin user ready:', { email: user.email });
}

main()
  .catch((error) => {
    console.error('Error creating admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
