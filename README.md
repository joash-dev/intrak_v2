# OJT Management System

A comprehensive On-the-Job Training (OJT) management system for BS Computer Engineering students, featuring role-based access for Students, Instructors, Coordinators, and Supervisors.

![OJT System](https://img.shields.io/badge/Status-Active%20Development-green)
![React](https://img.shields.io/badge/React-18.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0-blue)

## 🚀 **Quick Start**

### Prerequisites

- **Node.js** (v18.0 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v15.0 or higher)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/joash-dev/intrak_v2.git
cd intrak_v2
```

### 2. Install Dependencies

#### Backend Dependencies

```bash
cd server
npm install
```

#### Frontend Dependencies

```bash
cd ../client
npm install
```

### 3. Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/intrak_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Email Configuration (Optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH="./uploads"
```

#### Frontend Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=OJT Management System
```

### 4. Database Setup

#### Install PostgreSQL

- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE intrak_db;

# Create user (optional)
CREATE USER intrak_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE intrak_db TO intrak_user;

# Exit
\q
```

#### Run Database Migrations

```bash
cd server
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 5. Start the Application

#### Start Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5000

---

## 📋 **Default Login Credentials**

### Test Accounts

```
Student:
- Email: student@example.com
- Password: password123

Instructor:
- Email: instructor@example.com
- Password: password123

Coordinator:
- Email: coordinator@example.com
- Password: password123

Supervisor:
- Email: supervisor@example.com
- Password: password123
```

---

## 🏗️ **Project Structure**

```
intrak_v2/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   │   ├── StudentUi/  # Student portal pages
│   │   │   ├── InstructorUi/ # Instructor portal pages
│   │   │   ├── CoordinatorUi/ # Coordinator portal pages
│   │   │   └── SupervisorUi/ # Supervisor portal pages
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── prisma/             # Database schema and migrations
│   ├── uploads/            # File uploads directory
│   └── package.json
├── docs/                   # Documentation
├── README.md
└── TODO.md
```

---

## 🔧 **Development Commands**

### Backend Commands

```bash
cd server

# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npx prisma db seed        # Seed database with sample data
npx prisma studio         # Open Prisma Studio (database GUI)

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Frontend Commands

```bash
cd client

# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run tests
npm run test:ui      # Run tests with UI
```

---

## 🗄️ **Database Schema**

### Key Tables

- **users** - User accounts and authentication
- **students** - Student information and profiles
- **instructors** - Instructor information
- **companies** - Company information
- **documents** - Document uploads and status
- **attendance** - Attendance logs and verification
- **evaluations** - Student evaluations and ratings
- **announcements** - System announcements

### Database Management

```bash
# View database in browser
npx prisma studio

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

---

## 🔐 **Authentication & Authorization**

### JWT Token System

- **Access Token**: Short-lived (1 hour) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Role-based Access**: Student, Instructor, Coordinator, Supervisor

### Protected Routes

- All API endpoints require authentication
- Role-based access control for sensitive operations
- File upload security with virus scanning

---

## 📁 **File Upload System**

### Supported File Types

- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG
- **Size Limit**: 10MB per file

### Security Features

- File type validation
- File size limits
- Virus scanning (planned)
- Secure file storage

---

## 🎨 **UI/UX Features**

### Design System

- **Theme**: Purple primary with blue/green accents
- **Typography**: Inter font family
- **Components**: Custom Tailwind CSS components
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first design

### Dark/Light Mode

- Automatic system preference detection
- Manual theme toggle
- Persistent theme selection

---

## 📱 **User Roles & Features**

### 👨‍🎓 **Student Portal**

- Dashboard with progress tracking
- Document upload and management
- Attendance logging (QR, GPS, Manual)
- View evaluations and reports
- Profile settings

### 👨‍🏫 **Instructor Portal**

- Monitor assigned students
- Review and approve/reject documents
- Submit student evaluations
- View attendance and progress
- Generate reports

### 👨‍💼 **Coordinator Portal**

- Manage all students and instructors
- Review all documents
- Verify attendance
- Generate comprehensive reports
- Manage announcements
- System administration

### 👨‍💻 **Supervisor Portal**

- Monitor company students
- Verify attendance
- Submit evaluations
- View student progress

---

## 🚀 **Deployment**

### Production Build

```bash
# Build frontend
cd client
npm run build

# Build backend
cd ../server
npm run build
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
PORT=3000
```

### Docker Deployment (Optional)

```bash
# Build Docker image
docker build -t intrak-system .

# Run with Docker Compose
docker-compose up -d
```

---

## 🧪 **Testing**

### Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests (planned)
npm run test:e2e
```

### Test Coverage

- Unit tests for utilities and services
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for user workflows

---

## 🐛 **Troubleshooting**

### Common Issues

#### Database Connection Error

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check database exists
psql -U postgres -l
```

#### Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

#### Node Modules Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Prisma Issues

```bash
# Reset Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

---

## 📚 **API Documentation**

### Base URL

```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Authentication Endpoints

```
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/refresh        # Refresh access token
POST /auth/logout         # User logout
```

### Student Endpoints

```
GET  /students/profile    # Get student profile
GET  /students           # Get all students (coordinator only)
POST /students           # Create student (coordinator only)
PUT  /students/:id       # Update student
DELETE /students/:id     # Delete student
```

### Document Endpoints

```
GET  /documents          # Get documents
POST /documents/upload   # Upload document
GET  /documents/:id      # Get document details
PUT  /documents/:id/approve # Approve document
PUT  /documents/:id/reject  # Reject document
GET  /documents/:id/download # Download document
```

### Attendance Endpoints

```
GET  /attendance         # Get attendance logs
POST /attendance/log     # Log attendance
GET  /attendance/qr/:id  # Generate QR code
POST /attendance/verify  # Verify attendance
```

---

## 🤝 **Contributing**

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add your feature"`
6. Push to branch: `git push origin feature/your-feature`
7. Create a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features

### Pull Request Guidelines

- Clear description of changes
- Screenshots for UI changes
- Update documentation if needed
- Ensure all tests pass
- Request review from team members

---

## 📞 **Support**

### Getting Help

- **Documentation**: Check this README and code comments
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### Reporting Bugs

When reporting bugs, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/OS information
- Error messages

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **React** - Frontend framework
- **Node.js** - Backend runtime
- **Prisma** - Database ORM
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library

---

## 📊 **Project Status**

- ✅ **Core Features**: Complete
- ✅ **Authentication**: Complete
- ✅ **User Management**: Complete
- ✅ **Document System**: Complete
- ✅ **Attendance Tracking**: Complete
- 🔄 **Notifications**: In Progress
- 🔄 **Mobile App**: Planned
- 🔄 **Advanced Analytics**: Planned

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team

---

## 🎯 **Quick Reference**

### Essential Commands

```bash
# Setup (first time)
git clone https://github.com/joash-dev/intrak_v2.git
cd intrak_v2
cd server && npm install
cd ../client && npm install

# Database setup
cd server
npx prisma migrate dev
npx prisma db seed

# Start development
cd server && npm run dev
cd client && npm run dev
```

### Important URLs

- **Application**: http://localhost:5173
- **API**: http://localhost:5000
- **Database GUI**: http://localhost:5555 (Prisma Studio)

### Default Login

- **Email**: student@example.com
- **Password**: password123
