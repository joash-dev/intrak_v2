@echo off
REM INTRAK Production Accounts - Quick Start
REM Double-click this file to begin setup

echo ========================================
echo   INTRAK Production Accounts Setup
echo ========================================
echo.
echo This will create production accounts for:
echo   - 2 Admin accounts
echo   - 2 Coordinator accounts  
echo   - 3 Instructor accounts
echo   - 3 Student accounts
echo   - 3 Supervisor accounts
echo   - 3 Sample companies
echo.
echo Press any key to continue or close this window to cancel...
pause >nul

echo.
echo Starting setup...
call setup-production-accounts.bat

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Quick Access:
echo   Admin Panel: http://localhost:3000/admin
echo   Coordinator: http://localhost:3000/coordinator
echo   Instructor:  http://localhost:3000/instructor
echo   Student:     http://localhost:3000/student
echo   Supervisor:  http://localhost:3000/supervisor
echo.
echo Default Admin Login:
echo   Email: admin@intrak.edu.ph
echo   Password: Admin@2024!
echo.
echo IMPORTANT: Change all default passwords!
echo.
pause
