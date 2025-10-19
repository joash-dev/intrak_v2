#!/bin/bash

# INTRAK Production Account Setup Script
# This script sets up production accounts for the INTRAK system

echo "🚀 Setting up INTRAK Production Accounts..."
echo "============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if bcryptjs is installed
if ! npm list bcryptjs > /dev/null 2>&1; then
    echo "Installing bcryptjs..."
    npm install bcryptjs
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Run the production seed script
echo "🌱 Creating production accounts..."
node prisma/seed-production.js

echo ""
echo "✅ Production account setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Access the system using any of the created accounts"
echo "2. Change all default passwords immediately"
echo "3. Enable 2FA for admin accounts"
echo "4. Review the production-accounts-summary.md file for all credentials"
echo ""
echo "🔗 Quick Access:"
echo "   Admin Panel: http://localhost:3000/admin"
echo "   Coordinator: http://localhost:3000/coordinator"
echo "   Instructor:  http://localhost:3000/instructor"
echo "   Student:     http://localhost:3000/student"
echo "   Supervisor:  http://localhost:3000/supervisor"
echo ""
echo "⚠️  Security Reminder: Change all default passwords!"
