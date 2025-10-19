# INTRAK Production Accounts

## Overview

This document contains the production account credentials for the INTRAK system. These accounts are created for testing and initial setup purposes.

## ⚠️ Security Notice

**IMPORTANT**: Change all default passwords after first login and enable 2FA for admin accounts.

---

## Admin Accounts

### System Administrator

- **Email**: `admin@intrak.edu.ph`
- **Password**: `Admin@2024!`
- **Name**: System Administrator
- **Role**: ADMIN
- **Department**: IT Department
- **Employee ID**: ADM001

### Super Administrator

- **Email**: `superadmin@intrak.edu.ph`
- **Password**: `SuperAdmin@2024!`
- **Name**: Super Administrator
- **Role**: ADMIN
- **Department**: IT Department
- **Employee ID**: ADM002

---

## Coordinator Accounts

### Main Coordinator

- **Email**: `coordinator@intrak.edu.ph`
- **Password**: `Coordinator@2024!`
- **Name**: Maria Santos
- **Role**: COORDINATOR
- **Department**: Computer Engineering
- **Employee ID**: COO001

### OJT Coordinator

- **Email**: `ojt.coordinator@intrak.edu.ph`
- **Password**: `OJTCoordinator@2024!`
- **Name**: Juan Dela Cruz
- **Role**: COORDINATOR
- **Department**: Computer Engineering
- **Employee ID**: COO002

---

## Instructor Accounts

### Primary Instructor

- **Email**: `instructor@intrak.edu.ph`
- **Password**: `Instructor@2024!`
- **Name**: Ana Rodriguez
- **Role**: INSTRUCTOR
- **Department**: Computer Engineering
- **Employee ID**: INS001

### Professor Martinez

- **Email**: `prof.martinez@intrak.edu.ph`
- **Password**: `ProfMartinez@2024!`
- **Name**: Carlos Martinez
- **Role**: INSTRUCTOR
- **Department**: Computer Engineering
- **Employee ID**: INS002

### Professor Garcia

- **Email**: `prof.garcia@intrak.edu.ph`
- **Password**: `ProfGarcia@2024!`
- **Name**: Elena Garcia
- **Role**: INSTRUCTOR
- **Department**: Computer Engineering
- **Employee ID**: INS003

---

## Student Accounts

### Test Student 1

- **Email**: `student@intrak.edu.ph`
- **Password**: `Student@2024!`
- **Name**: John Smith
- **Role**: STUDENT
- **Student Number**: ANU2024-001
- **Program**: BS Computer Engineering
- **Year**: 4th Year

### Test Student 2

- **Email**: `maria.gonzalez@intrak.edu.ph`
- **Password**: `MariaGonzalez@2024!`
- **Name**: Maria Gonzalez
- **Role**: STUDENT
- **Student Number**: ANU2024-002
- **Program**: BS Computer Engineering
- **Year**: 4th Year

### Test Student 3

- **Email**: `jose.lopez@intrak.edu.ph`
- **Password**: `JoseLopez@2024!`
- **Name**: Jose Lopez
- **Role**: STUDENT
- **Student Number**: ANU2024-003
- **Program**: BS Computer Engineering
- **Year**: 4th Year

---

## Supervisor Accounts

### TechCorp Supervisor

- **Email**: `supervisor@techcorp.com`
- **Password**: `Supervisor@2024!`
- **Name**: Robert Johnson
- **Role**: SUPERVISOR
- **Company**: TechCorp Solutions
- **Department**: Software Development
- **Employee ID**: SUP001

### HR Supervisor

- **Email**: `hr.supervisor@techcorp.com`
- **Password**: `HRSupervisor@2024!`
- **Name**: Sarah Williams
- **Role**: SUPERVISOR
- **Company**: TechCorp Solutions
- **Department**: Human Resources
- **Employee ID**: SUP002

### Development Lead

- **Email**: `dev.lead@innovate.com`
- **Password**: `DevLead@2024!`
- **Name**: Michael Brown
- **Role**: SUPERVISOR
- **Company**: InnovateTech Inc.
- **Department**: Product Development
- **Employee ID**: SUP003

---

## Database Seeding

### Prisma Seed Script

Create a file `prisma/seed-production.js` with the following content:

```javascript
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating production accounts...");

  const accounts = [
    // Admin accounts
    {
      email: "admin@intrak.edu.ph",
      password: await bcrypt.hash("Admin@2024!", 12),
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
      active: true,
      emailVerified: true,
      department: "IT Department",
      employeeId: "ADM001",
    },
    // ... (include all accounts from above)
  ];

  for (const account of accounts) {
    await prisma.user.create({
      data: account,
    });
    console.log(`Created ${account.role} account: ${account.email}`);
  }

  console.log("Production accounts created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run the seed script:

```bash
npx prisma db seed
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable 2FA for admin accounts
- [ ] Set up password complexity requirements
- [ ] Configure account lockout policies
- [ ] Enable audit logging
- [ ] Set up session timeout policies
- [ ] Configure email notifications for security events
- [ ] Regular security audits
- [ ] Backup account recovery procedures

---

## Quick Access URLs

- **Admin Panel**: `/admin`
- **Coordinator Portal**: `/coordinator`
- **Instructor Portal**: `/instructor`
- **Student Portal**: `/student`
- **Supervisor Portal**: `/supervisor`

---

_Generated on: $(date)_
_System: INTRAK v2.1.3_
