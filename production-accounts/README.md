# 🚀 INTRAK Production Accounts Setup

This folder contains everything you need to set up production accounts for the INTRAK system.

## 📁 Files Overview

### 📋 Documentation

- **`production-accounts-summary.md`** - Complete documentation with all account details and credentials
- **`QUICK-ACCESS-CARDS.md`** - Quick reference tables for easy access to all accounts

### 🛠️ Setup Scripts

- **`setup-production-accounts.bat`** - Windows setup script (automated)
- **`setup-production-accounts.sh`** - Linux/Mac setup script (automated)
- **`create-production-accounts.js`** - Node.js script for generating accounts

### 🗄️ Database Files

- **`../prisma/seed-production.js`** - Prisma database seeding script (located in prisma folder)

## 🎯 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**

```bash
cd production-accounts
setup-production-accounts.bat
```

**Linux/Mac:**

```bash
cd production-accounts
chmod +x setup-production-accounts.sh
./setup-production-accounts.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install bcryptjs

# Run database migrations
npx prisma migrate deploy

# Seed production accounts
node prisma/seed-production.js
```

## 📊 Account Summary

| Role            | Count | Description                             |
| --------------- | ----- | --------------------------------------- |
| **Admin**       | 2     | System administrators with full access  |
| **Coordinator** | 2     | OJT coordinators for program management |
| **Instructor**  | 3     | Faculty members supervising students    |
| **Student**     | 3     | OJT participants                        |
| **Supervisor**  | 3     | Company supervisors                     |

## 🔐 Default Credentials

### Admin Access

- `admin@intrak.edu.ph` / `Admin@2024!`
- `superadmin@intrak.edu.ph` / `SuperAdmin@2024!`

### Coordinator Access

- `coordinator@intrak.edu.ph` / `Coordinator@2024!`
- `ojt.coordinator@intrak.edu.ph` / `OJTCoordinator@2024!`

### Instructor Access

- `instructor@intrak.edu.ph` / `Instructor@2024!`
- `prof.martinez@intrak.edu.ph` / `ProfMartinez@2024!`
- `prof.garcia@intrak.edu.ph` / `ProfGarcia@2024!`

### Student Access

- `student@intrak.edu.ph` / `Student@2024!`
- `maria.gonzalez@intrak.edu.ph` / `MariaGonzalez@2024!`
- `jose.lopez@intrak.edu.ph` / `JoseLopez@2024!`

### Supervisor Access

- `supervisor@techcorp.com` / `Supervisor@2024!`
- `hr.supervisor@techcorp.com` / `HRSupervisor@2024!`
- `dev.lead@innovate.com` / `DevLead@2024!`

## 🌐 System Access URLs

- **Admin Panel**: `http://localhost:3000/admin`
- **Coordinator Portal**: `http://localhost:3000/coordinator`
- **Instructor Portal**: `http://localhost:3000/instructor`
- **Student Portal**: `http://localhost:3000/student`
- **Supervisor Portal**: `http://localhost:3000/supervisor`

## 🏢 Sample Companies

The setup also creates 3 sample companies:

1. **TechCorp Solutions** - Software Development
2. **InnovateTech Inc.** - Product Development
3. **Global Systems Corp** - Enterprise Solutions

## ⚠️ Security Checklist

After running the setup, ensure you:

- [ ] **Change all default passwords immediately**
- [ ] **Enable 2FA for admin accounts**
- [ ] **Set up password complexity requirements**
- [ ] **Configure account lockout policies**
- [ ] **Enable audit logging**
- [ ] **Set up session timeout policies**
- [ ] **Configure email notifications for security events**
- [ ] **Regular security audits**
- [ ] **Backup account recovery procedures**

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure your database is running
   - Check your `.env` file for correct database URL
   - Run `npx prisma migrate deploy` first

2. **bcryptjs Not Found**

   - Run `npm install bcryptjs` to install the dependency

3. **Permission Denied (Linux/Mac)**

   - Run `chmod +x setup-production-accounts.sh` to make the script executable

4. **Account Already Exists**
   - The script will skip existing accounts and continue
   - Check the console output for details

### Manual Account Creation

If the automated setup fails, you can manually create accounts using the Prisma Studio:

```bash
npx prisma studio
```

Then use the data from `production-accounts-summary.md` to create users manually.

## 📞 Support

For issues with account setup:

1. Check the console output for error messages
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Review the troubleshooting section above

## 📝 Notes

- All passwords are hashed using bcryptjs with 12 salt rounds
- Accounts are created with `active: true` and `emailVerified: true`
- Employee IDs and Student Numbers follow the pattern: `ROLE###`
- Company supervisors are linked to sample companies

---

_Generated for INTRAK v2.1.3 Production Setup_
_Last Updated: $(date)_
