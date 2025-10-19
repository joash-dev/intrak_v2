@echo off
REM INTRAK Production Account Setup Script for Windows
REM This script sets up production accounts for the INTRAK system

echo 🚀 Setting up INTRAK Production Accounts...
echo =============================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install dependencies if needed
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Check if bcryptjs is installed
npm list bcryptjs >nul 2>&1
if errorlevel 1 (
    echo Installing bcryptjs...
    npm install bcryptjs
)

REM Run database migrations
echo 🗄️  Running database migrations...
npx prisma migrate deploy

REM Run the production seed script
echo 🌱 Creating production accounts...
node prisma/seed-production.js

echo.
echo ✅ Production account setup completed!
echo.
echo 📋 Next Steps:
echo 1. Access the system using any of the created accounts
echo 2. Change all default passwords immediately
echo 3. Enable 2FA for admin accounts
echo 4. Review the production-accounts-summary.md file for all credentials
echo.
echo 🔗 Quick Access:
echo    Admin Panel: http://localhost:3000/admin
echo    Coordinator: http://localhost:3000/coordinator
echo    Instructor:  http://localhost:3000/instructor
echo    Student:     http://localhost:3000/student
echo    Supervisor:  http://localhost:3000/supervisor
echo.
echo ⚠️  Security Reminder: Change all default passwords!
pause
