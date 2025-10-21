import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAlertsAndActivities() {
  console.log('🌱 Seeding alerts and activities...');

  try {
    // Create system alerts
    const alerts = await prisma.systemAlert.createMany({
      data: [
        {
          type: 'WARNING',
          priority: 'HIGH',
          title: 'Pending Document Reviews',
          message: '47 documents awaiting coordinator approval across 12 companies',
          resolved: false
        },
        {
          type: 'INFO',
          priority: 'MEDIUM',
          title: 'System Maintenance Scheduled',
          message: 'Planned maintenance window: Sunday from 2:00 AM to 4:00 AM',
          resolved: false
        },
        {
          type: 'WARNING',
          priority: 'MEDIUM',
          title: 'Incomplete Student Profiles',
          message: '23 students have incomplete profile information affecting placement matching',
          resolved: false
        }
      ]
    });

    console.log(`✅ Created ${alerts.count} system alerts`);

    // Create activities
    const now = new Date();
    const activities = await prisma.activity.createMany({
      data: [
        {
          type: 'USER_REGISTERED',
          description: 'New student registered: Sarah Johnson (Computer Science)',
          userName: 'Coordinator',
          createdAt: new Date(now.getTime() - 15 * 60 * 1000)
        },
        {
          type: 'DOCUMENT_APPROVED',
          description: 'MOA approved for TechCorp Solutions - 5 students assigned',
          userName: 'Coordinator',
          createdAt: new Date(now.getTime() - 45 * 60 * 1000)
        },
        {
          type: 'ATTENDANCE_LOGGED',
          description: 'Attendance verified: 42 students checked in across 15 companies',
          userName: 'System',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
        },
        {
          type: 'EVALUATION_SUBMITTED',
          description: 'Student evaluation completed: Mark Chen (4.5/5.0 rating)',
          userName: 'Instructor',
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
        },
        {
          type: 'COMPANY_ADDED',
          description: 'New company registered: DataCorp Analytics (Manila)',
          userName: 'Admin',
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
        },
        {
          type: 'ANNOUNCEMENT_CREATED',
          description: 'System announcement posted: Internship Fair Schedule Update',
          userName: 'Coordinator',
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
        },
        {
          type: 'DOCUMENT_UPLOADED',
          description: '28 documents uploaded for DTR verification across departments',
          userName: 'Students',
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
        },
        {
          type: 'USER_UPDATED',
          description: 'Instructor profile updated: Dr. Maria Santos (Department Head)',
          userName: 'Admin',
          createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000)
        },
        {
          type: 'STUDENT_ASSIGNED',
          description: '12 students assigned to Dr. Rodriguez for supervision',
          userName: 'Coordinator',
          createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000)
        },
        {
          type: 'SETTINGS_UPDATED',
          description: 'System settings modified: Email notifications enabled for all users',
          userName: 'Admin',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      ]
    });

    console.log(`✅ Created ${activities.count} activities`);
    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedAlertsAndActivities()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedAlertsAndActivities;
