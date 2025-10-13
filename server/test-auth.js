const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if any users exist
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('👤 No users found. Creating test instructor...');
      
      // Create instructor user
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await prisma.user.create({
        data: {
          email: 'instructor@test.com',
          name: 'Test Instructor',
          passwordHash: passwordHash,
          role: 'INSTRUCTOR',
          active: true
        }
      });
      
      console.log('✅ Created instructor user:', user.email);
      console.log('📧 Email: instructor@test.com');
      console.log('🔑 Password: password123');
      console.log('👤 Role: INSTRUCTOR');
    } else {
      // List existing users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true
        }
      });
      
      console.log('👥 Existing users:');
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.active ? 'Active' : 'Inactive'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Database connection issue. Please check:');
      console.log('1. PostgreSQL is running');
      console.log('2. Database credentials in .env file');
      console.log('3. Database "intrak_db" exists');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
