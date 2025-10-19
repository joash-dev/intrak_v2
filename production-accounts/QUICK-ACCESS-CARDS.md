# 🎯 INTRAK Quick Access Cards

## 🔐 Admin Access

| Role            | Email                      | Password           | Portal   |
| --------------- | -------------------------- | ------------------ | -------- |
| **Admin**       | `admin@intrak.edu.ph`      | `Admin@2024!`      | `/admin` |
| **Super Admin** | `superadmin@intrak.edu.ph` | `SuperAdmin@2024!` | `/admin` |

## 👨‍🏫 Coordinator Access

| Role                 | Email                           | Password               | Portal         |
| -------------------- | ------------------------------- | ---------------------- | -------------- |
| **Main Coordinator** | `coordinator@intrak.edu.ph`     | `Coordinator@2024!`    | `/coordinator` |
| **OJT Coordinator**  | `ojt.coordinator@intrak.edu.ph` | `OJTCoordinator@2024!` | `/coordinator` |

## 👩‍🏫 Instructor Access

| Role                   | Email                         | Password             | Portal        |
| ---------------------- | ----------------------------- | -------------------- | ------------- |
| **Primary Instructor** | `instructor@intrak.edu.ph`    | `Instructor@2024!`   | `/instructor` |
| **Prof. Martinez**     | `prof.martinez@intrak.edu.ph` | `ProfMartinez@2024!` | `/instructor` |
| **Prof. Garcia**       | `prof.garcia@intrak.edu.ph`   | `ProfGarcia@2024!`   | `/instructor` |

## 🎓 Student Access

| Role               | Email                          | Password              | Portal     |
| ------------------ | ------------------------------ | --------------------- | ---------- |
| **John Smith**     | `student@intrak.edu.ph`        | `Student@2024!`       | `/student` |
| **Maria Gonzalez** | `maria.gonzalez@intrak.edu.ph` | `MariaGonzalez@2024!` | `/student` |
| **Jose Lopez**     | `jose.lopez@intrak.edu.ph`     | `JoseLopez@2024!`     | `/student` |

## 👔 Supervisor Access

| Role                    | Email                        | Password             | Portal        |
| ----------------------- | ---------------------------- | -------------------- | ------------- |
| **TechCorp Supervisor** | `supervisor@techcorp.com`    | `Supervisor@2024!`   | `/supervisor` |
| **HR Supervisor**       | `hr.supervisor@techcorp.com` | `HRSupervisor@2024!` | `/supervisor` |
| **Dev Lead**            | `dev.lead@innovate.com`      | `DevLead@2024!`      | `/supervisor` |

---

## 🚀 Quick Setup Commands

### Windows

```bash
setup-production-accounts.bat
```

### Linux/Mac

```bash
chmod +x setup-production-accounts.sh
./setup-production-accounts.sh
```

### Manual Setup

```bash
# Install dependencies
npm install bcryptjs

# Run migrations
npx prisma migrate deploy

# Seed production accounts
node prisma/seed-production.js
```

---

## 🔒 Security Checklist

- [ ] **Change all default passwords immediately**
- [ ] **Enable 2FA for admin accounts**
- [ ] **Set up password complexity requirements**
- [ ] **Configure account lockout policies**
- [ ] **Enable audit logging**
- [ ] **Set up session timeout policies**
- [ ] **Configure email notifications**
- [ ] **Regular security audits**

---

## 📱 System URLs

- **Base URL**: `http://localhost:3000`
- **Admin Panel**: `/admin`
- **Coordinator Portal**: `/coordinator`
- **Instructor Portal**: `/instructor`
- **Student Portal**: `/student`
- **Supervisor Portal**: `/supervisor`

---

## 🏢 Sample Companies Created

1. **TechCorp Solutions** - Software Development
2. **InnovateTech Inc.** - Product Development
3. **Global Systems Corp** - Enterprise Solutions

---

_Generated for INTRAK v2.1.3 Production Setup_
