/**
 * Production Account Creation Script
 * This script creates production accounts for all user roles in the INTRAK system
 */

const bcrypt = require('bcryptjs');

// Production account configurations
const productionAccounts = [
  // ADMIN ACCOUNTS
  {
    email: "admin@intrak.edu.ph",
    password: "Admin@2024!",
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
    password: "SuperAdmin@2024!",
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
    password: "Coordinator@2024!",
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
    password: "OJTCoordinator@2024!",
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
    password: "Instructor@2024!",
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
    password: "ProfMartinez@2024!",
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
    password: "ProfGarcia@2024!",
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
    password: "Student@2024!",
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
    password: "MariaGonzalez@2024!",
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
    password: "JoseLopez@2024!",
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
    password: "Supervisor@2024!",
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
    password: "HRSupervisor@2024!",
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
    password: "DevLead@2024!",
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

// Function to hash passwords
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Function to generate SQL insert statements
async function generateSQLInserts() {
  console.log("-- Production Account Creation SQL Script");
  console.log("-- Generated for INTRAK System");
  console.log("-- Date: " + new Date().toISOString());
  console.log("");
  
  for (const account of productionAccounts) {
    const hashedPassword = await hashPassword(account.password);
    
    console.log(`-- Creating ${account.role} account: ${account.email}`);
    console.log(`INSERT INTO "User" (
  "email",
  "password",
  "firstName",
  "lastName",
  "role",
  "active",
  "emailVerified",
  "createdAt",
  "updatedAt"${account.department ? ',\n  "department"' : ''}${account.employeeId ? ',\n  "employeeId"' : ''}${account.studentNumber ? ',\n  "studentNumber"' : ''}${account.program ? ',\n  "program"' : ''}${account.year ? ',\n  "year"' : ''}${account.company ? ',\n  "company"' : ''}
) VALUES (
  '${account.email}',
  '${hashedPassword}',
  '${account.firstName}',
  '${account.lastName}',
  '${account.role}',
  ${account.active},
  ${account.emailVerified},
  NOW(),
  NOW()${account.department ? `,\n  '${account.department}'` : ''}${account.employeeId ? `,\n  '${account.employeeId}'` : ''}${account.studentNumber ? `,\n  '${account.studentNumber}'` : ''}${account.program ? `,\n  '${account.program}'` : ''}${account.year ? `,\n  '${account.year}'` : ''}${account.company ? `,\n  '${account.company}'` : ''}
);`);
    console.log("");
  }
}

// Function to generate account summary
function generateAccountSummary() {
  console.log("=== PRODUCTION ACCOUNTS SUMMARY ===");
  console.log("");
  
  const accountsByRole = productionAccounts.reduce((acc, account) => {
    if (!acc[account.role]) {
      acc[account.role] = [];
    }
    acc[account.role].push(account);
    return acc;
  }, {});
  
  Object.keys(accountsByRole).forEach(role => {
    console.log(`${role} ACCOUNTS:`);
    accountsByRole[role].forEach(account => {
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log(`  Name: ${account.firstName} ${account.lastName}`);
      if (account.studentNumber) console.log(`  Student Number: ${account.studentNumber}`);
      if (account.employeeId) console.log(`  Employee ID: ${account.employeeId}`);
      if (account.company) console.log(`  Company: ${account.company}`);
      console.log("");
    });
  });
}

// Main execution
async function main() {
  try {
    console.log("Creating production accounts for INTRAK system...\n");
    
    // Generate account summary
    generateAccountSummary();
    
    console.log("\n" + "=".repeat(60));
    console.log("SQL INSERT STATEMENTS");
    console.log("=".repeat(60) + "\n");
    
    // Generate SQL inserts
    await generateSQLInserts();
    
    console.log("-- End of SQL Script");
    console.log("\n=== IMPORTANT SECURITY NOTES ===");
    console.log("1. Change all default passwords after first login");
    console.log("2. Enable 2FA for admin accounts");
    console.log("3. Regularly audit user access");
    console.log("4. Store passwords securely and rotate regularly");
    console.log("5. Monitor login attempts and suspicious activity");
    
  } catch (error) {
    console.error("Error generating production accounts:", error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  productionAccounts,
  generateSQLInserts,
  generateAccountSummary
};
