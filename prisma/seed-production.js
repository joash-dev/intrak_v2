const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production account seeding...');
  
  // Production account data
  const accounts = [
    // ADMIN ACCOUNTS
    {
      email: "admin@intrak.edu.ph",
      password: await bcrypt.hash("Admin@2024!", 12),
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
      active: true,
      emailVerified: true,
      department: "IT Department",
      employeeId: "ADM001"
    },
    {
      email: "superadmin@intrak.edu.ph",
      password: await bcrypt.hash("SuperAdmin@2024!", 12),
      firstName: "Super",
      lastName: "Administrator",
      role: "ADMIN",
      active: true,
      emailVerified: true,
      department: "IT Department",
      employeeId: "ADM002"
    },

    // COORDINATOR ACCOUNTS
    {
      email: "coordinator@intrak.edu.ph",
      password: await bcrypt.hash("Coordinator@2024!", 12),
      firstName: "Maria",
      lastName: "Santos",
      role: "COORDINATOR",
      active: true,
      emailVerified: true,
      department: "Computer Engineering",
      employeeId: "COO001"
    },
    {
      email: "ojt.coordinator@intrak.edu.ph",
      password: await bcrypt.hash("OJTCoordinator@2024!", 12),
      firstName: "Juan",
      lastName: "Dela Cruz",
      role: "COORDINATOR",
      active: true,
      emailVerified: true,
      department: "Computer Engineering",
      employeeId: "COO002"
    },

    // INSTRUCTOR ACCOUNTS
    {
      email: "instructor@intrak.edu.ph",
      password: await bcrypt.hash("Instructor@2024!", 12),
      firstName: "Ana",
      lastName: "Rodriguez",
      role: "INSTRUCTOR",
      active: true,
      emailVerified: true,
      department: "Computer Engineering",
      employeeId: "INS001"
    },
    {
      email: "prof.martinez@intrak.edu.ph",
      password: await bcrypt.hash("ProfMartinez@2024!", 12),
      firstName: "Carlos",
      lastName: "Martinez",
      role: "INSTRUCTOR",
      active: true,
      emailVerified: true,
      department: "Computer Engineering",
      employeeId: "INS002"
    },
    {
      email: "prof.garcia@intrak.edu.ph",
      password: await bcrypt.hash("ProfGarcia@2024!", 12),
      firstName: "Elena",
      lastName: "Garcia",
      role: "INSTRUCTOR",
      active: true,
      emailVerified: true,
      department: "Computer Engineering",
      employeeId: "INS003"
    },

    // STUDENT ACCOUNTS
    {
      email: "student@intrak.edu.ph",
      password: await bcrypt.hash("Student@2024!", 12),
      firstName: "John",
      lastName: "Smith",
      role: "STUDENT",
      active: true,
      emailVerified: true,
      studentNumber: "ANU2024-001",
      program: "BS Computer Engineering",
      year: "4th Year"
    },
    {
      email: "maria.gonzalez@intrak.edu.ph",
      password: await bcrypt.hash("MariaGonzalez@2024!", 12),
      firstName: "Maria",
      lastName: "Gonzalez",
      role: "STUDENT",
      active: true,
      emailVerified: true,
      studentNumber: "ANU2024-002",
      program: "BS Computer Engineering",
      year: "4th Year"
    },
    {
      email: "jose.lopez@intrak.edu.ph",
      password: await bcrypt.hash("JoseLopez@2024!", 12),
      firstName: "Jose",
      lastName: "Lopez",
      role: "STUDENT",
      active: true,
      emailVerified: true,
      studentNumber: "ANU2024-003",
      program: "BS Computer Engineering",
      year: "4th Year"
    },

    // SUPERVISOR ACCOUNTS
    {
      email: "supervisor@techcorp.com",
      password: await bcrypt.hash("Supervisor@2024!", 12),
      firstName: "Robert",
      lastName: "Johnson",
      role: "SUPERVISOR",
      active: true,
      emailVerified: true,
      company: "TechCorp Solutions",
      department: "Software Development",
      employeeId: "SUP001"
    },
    {
      email: "hr.supervisor@techcorp.com",
      password: await bcrypt.hash("HRSupervisor@2024!", 12),
      firstName: "Sarah",
      lastName: "Williams",
      role: "SUPERVISOR",
      active: true,
      emailVerified: true,
      company: "TechCorp Solutions",
      department: "Human Resources",
      employeeId: "SUP002"
    },
    {
      email: "dev.lead@innovate.com",
      password: await bcrypt.hash("DevLead@2024!", 12),
      firstName: "Michael",
      lastName: "Brown",
      role: "SUPERVISOR",
      active: true,
      emailVerified: true,
      company: "InnovateTech Inc.",
      department: "Product Development",
      employeeId: "SUP003"
    }
  ];

  // Create accounts
  for (const account of accounts) {
    try {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        console.log(`⚠️  Account already exists: ${account.email}`);
        continue;
      }

      // Create new account
      await prisma.user.create({
        data: account
      });

      console.log(`✅ Created ${account.role} account: ${account.email}`);
    } catch (error) {
      console.error(`❌ Failed to create account ${account.email}:`, error.message);
    }
  }

  // Create some sample companies
  const companies = [
    {
      name: "TechCorp Solutions",
      address: "123 Technology Avenue, Metro Manila",
      contactPerson: "Robert Johnson",
      contactEmail: "supervisor@techcorp.com",
      contactPhone: "+63 2 1234 5678",
      website: "https://techcorp.com",
      description: "Leading technology solutions provider",
      active: true
    },
    {
      name: "InnovateTech Inc.",
      address: "456 Innovation Street, Quezon City",
      contactPerson: "Michael Brown",
      contactEmail: "dev.lead@innovate.com",
      contactPhone: "+63 2 8765 4321",
      website: "https://innovatetech.com",
      description: "Innovative software development company",
      active: true
    },
    {
      name: "Global Systems Corp",
      address: "789 Business District, Makati City",
      contactPerson: "Jennifer Davis",
      contactEmail: "j.davis@globalsystems.com",
      contactPhone: "+63 2 5555 1234",
      website: "https://globalsystems.com",
      description: "Global enterprise solutions provider",
      active: true
    }
  ];

  console.log('\n🏢 Creating sample companies...');
  for (const company of companies) {
    try {
      const existingCompany = await prisma.company.findFirst({
        where: { name: company.name }
      });

      if (existingCompany) {
        console.log(`⚠️  Company already exists: ${company.name}`);
        continue;
      }

      await prisma.company.create({
        data: company
      });

      console.log(`✅ Created company: ${company.name}`);
    } catch (error) {
      console.error(`❌ Failed to create company ${company.name}:`, error.message);
    }
  }

  console.log('\n🎉 Production account seeding completed!');
  console.log('\n📋 Account Summary:');
  console.log('   • 2 Admin accounts');
  console.log('   • 2 Coordinator accounts');
  console.log('   • 3 Instructor accounts');
  console.log('   • 3 Student accounts');
  console.log('   • 3 Supervisor accounts');
  console.log('   • 3 Sample companies');
  console.log('\n⚠️  IMPORTANT: Change all default passwords after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
