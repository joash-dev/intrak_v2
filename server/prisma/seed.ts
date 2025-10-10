import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing sample data to avoid duplicates
  console.log('🧹 Cleaning up existing sample data...');
  await prisma.document.deleteMany({
    where: {
      filename: {
        in: ['application_letter.pdf', 'moa.pdf', 'acceptance.pdf', 'dtr.pdf']
      }
    }
  });
  
  await prisma.attendanceLog.deleteMany({
    where: {
      verificationMethod: {
        in: ['MANUAL', 'QR']
      }
    }
  });
  
  await prisma.evaluation.deleteMany({
    where: {
      comments: {
        contains: 'performance'
      }
    }
  });
  
  await prisma.announcement.deleteMany({
    where: {
      title: {
        in: ['Welcome to INTRAK System', 'Mid-term Evaluation Period', 'Document Submission Deadline', 'Attendance Monitoring', 'Final Presentation Schedule']
      }
    }
  });

  // Create users (with upsert to handle existing data)
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Administrator',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@example.com' },
    update: {},
    create: {
      email: 'coordinator@example.com',
      name: 'John Coordinator',
      passwordHash,
      role: 'COORDINATOR'
    }
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {},
    create: {
      email: 'instructor@example.com',
      name: 'Jane Instructor',
      passwordHash,
      role: 'INSTRUCTOR'
    }
  });

  // Create multiple student users
  const studentUser1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      name: 'Maria Santos',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const studentUser2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      name: 'John Michael Cruz',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const studentUser3 = await prisma.user.upsert({
    where: { email: 'student3@example.com' },
    update: {},
    create: {
      email: 'student3@example.com',
      name: 'Sarah Johnson',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const studentUser4 = await prisma.user.upsert({
    where: { email: 'student4@example.com' },
    update: {},
    create: {
      email: 'student4@example.com',
      name: 'Carlos Rodriguez',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const studentUser5 = await prisma.user.upsert({
    where: { email: 'student5@example.com' },
    update: {},
    create: {
      email: 'student5@example.com',
      name: 'Ana Garcia',
      passwordHash,
      role: 'STUDENT'
    }
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner1@example.com' },
    update: {},
    create: {
      email: 'partner1@example.com',
      name: 'Tech Company HR',
      passwordHash,
      role: 'INDUSTRY_PARTNER'
    }
  });

  // Create companies
  let company1 = await prisma.company.findFirst({
    where: { name: 'Tech Innovations Inc.' }
  });
  if (!company1) {
    company1 = await prisma.company.create({
    data: {
      name: 'Tech Innovations Inc.',
      address: 'Urdaneta City, Pangasinan',
      contactPerson: 'Robert Manager',
      contactEmail: 'robert@techinnovations.com',
      contactNumber: '09171234567',
      latitude: 15.9759,
      longitude: 120.5711,
      radiusMeters: 100
    }
  });
  }

  let company2 = await prisma.company.findFirst({
    where: { name: 'Digital Solutions Corp.' }
  });
  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        name: 'Digital Solutions Corp.',
        address: 'Dagupan City, Pangasinan',
        contactPerson: 'Lisa Chen',
        contactEmail: 'lisa@digitalsolutions.com',
        contactNumber: '09171234568',
        latitude: 16.0439,
        longitude: 120.3327,
        radiusMeters: 100
      }
    });
  }

  let company3 = await prisma.company.findFirst({
    where: { name: 'Software Development Hub' }
  });
  if (!company3) {
    company3 = await prisma.company.create({
    data: {
        name: 'Software Development Hub',
        address: 'San Fernando, La Union',
        contactPerson: 'Mark Thompson',
        contactEmail: 'mark@softwarehub.com',
        contactNumber: '09171234569',
        latitude: 16.6159,
        longitude: 120.3166,
        radiusMeters: 100
      }
    });
  }

  // Create students
  const student1 = await prisma.student.upsert({
    where: { studentNumber: '2021-12345' },
    update: {},
    create: {
      userId: studentUser1.id,
      studentNumber: '2021-12345',
      program: 'Computer Engineering',
      year: 4,
      section: 'A',
      companyId: company1.id,
      supervisorName: 'Engr. Juan Dela Cruz',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-09-30'),
      totalHours: 500,
      completedHours: 120
    }
  });

  const student2 = await prisma.student.upsert({
    where: { studentNumber: '2021-12346' },
    update: {},
    create: {
      userId: studentUser2.id,
      studentNumber: '2021-12346',
      program: 'Information Technology',
      year: 3,
      section: 'B',
      companyId: company2.id,
      supervisorName: 'Ms. Lisa Chen',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-10-31'),
      totalHours: 400,
      completedHours: 80
    }
  });

  const student3 = await prisma.student.upsert({
    where: { studentNumber: '2021-12347' },
    update: {},
    create: {
      userId: studentUser3.id,
      studentNumber: '2021-12347',
      program: 'Computer Science',
      year: 4,
      section: 'A',
      companyId: company3.id,
      supervisorName: 'Mr. Mark Thompson',
      startDate: new Date('2024-05-15'),
      endDate: new Date('2024-09-15'),
      totalHours: 500,
      completedHours: 200
    }
  });

  const student4 = await prisma.student.upsert({
    where: { studentNumber: '2021-12348' },
    update: {},
    create: {
      userId: studentUser4.id,
      studentNumber: '2021-12348',
      program: 'Computer Engineering',
      year: 3,
      section: 'C',
      companyId: company1.id,
      supervisorName: 'Engr. Maria Santos',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-11-30'),
      totalHours: 400,
      completedHours: 50
    }
  });

  const student5 = await prisma.student.upsert({
    where: { studentNumber: '2021-12349' },
    update: {},
    create: {
      userId: studentUser5.id,
      studentNumber: '2021-12349',
      program: 'Information Technology',
      year: 4,
      section: 'B',
      companyId: company2.id,
      supervisorName: 'Ms. Jennifer Lee',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-10-15'),
      totalHours: 500,
      completedHours: 300
    }
  });

  // Create sample documents for all students
  const documentTypes = ['APPLICATION_LETTER', 'MOA', 'ACCEPTANCE', 'EVALUATION_FORM', 'DTR_HARDCOPY'];
  const documentStatuses = ['APPROVED', 'PENDING', 'REJECTED'];
  
  // Documents for student1
  await prisma.document.createMany({
    data: [
      {
      studentId: student1.id,
      type: 'APPLICATION_LETTER',
      filename: 'application_letter.pdf',
      filepath: './uploads/sample/application_letter.pdf',
      mimeType: 'application/pdf',
      status: 'APPROVED',
      uploadedById: studentUser1.id
      },
      {
        studentId: student1.id,
        type: 'MOA',
        filename: 'moa.pdf',
        filepath: './uploads/sample/moa.pdf',
        mimeType: 'application/pdf',
        status: 'APPROVED',
        uploadedById: studentUser1.id
      },
      {
        studentId: student1.id,
        type: 'ACCEPTANCE',
        filename: 'acceptance.pdf',
        filepath: './uploads/sample/acceptance.pdf',
        mimeType: 'application/pdf',
        status: 'PENDING',
        uploadedById: studentUser1.id
      }
    ]
  });

  // Documents for student2
  await prisma.document.createMany({
    data: [
      {
        studentId: student2.id,
        type: 'APPLICATION_LETTER',
        filename: 'application_letter.pdf',
        filepath: './uploads/sample/application_letter.pdf',
        mimeType: 'application/pdf',
        status: 'APPROVED',
        uploadedById: studentUser2.id
      },
      {
        studentId: student2.id,
        type: 'MOA',
        filename: 'moa.pdf',
        filepath: './uploads/sample/moa.pdf',
        mimeType: 'application/pdf',
        status: 'REJECTED',
        uploadedById: studentUser2.id
      }
    ]
  });

  // Documents for student3
  await prisma.document.createMany({
    data: [
      {
        studentId: student3.id,
        type: 'APPLICATION_LETTER',
        filename: 'application_letter.pdf',
        filepath: './uploads/sample/application_letter.pdf',
        mimeType: 'application/pdf',
        status: 'APPROVED',
        uploadedById: studentUser3.id
      },
      {
        studentId: student3.id,
        type: 'MOA',
        filename: 'moa.pdf',
        filepath: './uploads/sample/moa.pdf',
        mimeType: 'application/pdf',
        status: 'APPROVED',
        uploadedById: studentUser3.id
      },
      {
        studentId: student3.id,
        type: 'ACCEPTANCE',
        filename: 'acceptance.pdf',
        filepath: './uploads/sample/acceptance.pdf',
        mimeType: 'application/pdf',
        status: 'APPROVED',
        uploadedById: studentUser3.id
      },
      {
        studentId: student3.id,
        type: 'DTR_HARDCOPY',
        filename: 'dtr.pdf',
        filepath: './uploads/sample/dtr.pdf',
        mimeType: 'application/pdf',
        status: 'PENDING',
        uploadedById: studentUser3.id
      }
    ]
  });

  // Create sample attendance logs for all students
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Attendance for student1
  await prisma.attendanceLog.createMany({
    data: [
      {
        studentId: student1.id,
        date: today,
        timeIn: new Date(today.setHours(8, 0, 0)),
        timeOut: new Date(today.setHours(17, 0, 0)),
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'MANUAL'
      },
      {
        studentId: student1.id,
        date: yesterday,
        timeIn: new Date(yesterday.setHours(8, 15, 0)),
        timeOut: new Date(yesterday.setHours(17, 0, 0)),
        durationMinutes: 525,
        verified: true,
        verificationMethod: 'QR'
      },
      {
      studentId: student1.id,
        date: twoDaysAgo,
        timeIn: new Date(twoDaysAgo.setHours(8, 0, 0)),
        timeOut: new Date(twoDaysAgo.setHours(17, 30, 0)),
        durationMinutes: 570,
        verified: false,
        verificationMethod: 'MANUAL'
      }
    ]
  });

  // Attendance for student2
  await prisma.attendanceLog.createMany({
    data: [
      {
        studentId: student2.id,
        date: today,
        timeIn: new Date(today.setHours(9, 0, 0)),
        timeOut: new Date(today.setHours(18, 0, 0)),
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'QR'
      },
      {
        studentId: student2.id,
        date: yesterday,
        timeIn: new Date(yesterday.setHours(8, 30, 0)),
        timeOut: new Date(yesterday.setHours(17, 30, 0)),
      durationMinutes: 540,
      verified: true,
      verificationMethod: 'MANUAL'
    }
    ]
  });

  // Attendance for student3
  await prisma.attendanceLog.createMany({
    data: [
      {
        studentId: student3.id,
        date: today,
        timeIn: new Date(today.setHours(8, 0, 0)),
        timeOut: new Date(today.setHours(17, 0, 0)),
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'QR'
      },
      {
        studentId: student3.id,
        date: yesterday,
        timeIn: new Date(yesterday.setHours(8, 0, 0)),
        timeOut: new Date(yesterday.setHours(17, 0, 0)),
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'QR'
      },
      {
        studentId: student3.id,
        date: twoDaysAgo,
        timeIn: new Date(twoDaysAgo.setHours(8, 0, 0)),
        timeOut: new Date(twoDaysAgo.setHours(17, 0, 0)),
        durationMinutes: 540,
        verified: true,
        verificationMethod: 'QR'
      }
    ]
  });

  // Create sample evaluations for all students
  await prisma.evaluation.createMany({
    data: [
      {
      studentId: student1.id,
      evaluatorId: partnerUser.id,
      evaluatorRole: 'INDUSTRY_PARTNER',
      rating: 4.5,
      comments: 'Excellent performance and initiative.',
      criteria: {
        technical: 5,
        communication: 4,
        teamwork: 5,
        punctuality: 4
      }
      },
      {
        studentId: student2.id,
        evaluatorId: partnerUser.id,
        evaluatorRole: 'INDUSTRY_PARTNER',
        rating: 4.0,
        comments: 'Good technical skills, needs improvement in communication.',
        criteria: {
          technical: 4,
          communication: 3,
          teamwork: 4,
          punctuality: 5
        }
      },
      {
        studentId: student3.id,
        evaluatorId: partnerUser.id,
        evaluatorRole: 'INDUSTRY_PARTNER',
        rating: 4.8,
        comments: 'Outstanding performance in all areas.',
        criteria: {
          technical: 5,
          communication: 5,
          teamwork: 5,
          punctuality: 4
        }
      },
      {
        studentId: student1.id,
        evaluatorId: coordinator.id,
        evaluatorRole: 'COORDINATOR',
        rating: 4.2,
        comments: 'Good progress, keep up the excellent work.',
        criteria: {
          technical: 4,
          communication: 4,
          teamwork: 4,
          punctuality: 5
        }
      }
    ]
  });

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
      title: 'Welcome to INTRAK System',
      content: 'Please submit all required documents by the end of the week.',
      audience: 'ALL',
      createdById: coordinator.id
      },
      {
        title: 'Mid-term Evaluation Period',
        content: 'Mid-term evaluations will be conducted next week. Please prepare your portfolios.',
        audience: 'STUDENTS',
        createdById: coordinator.id
      },
      {
        title: 'Document Submission Deadline',
        content: 'All internship documents must be submitted by October 15, 2024.',
        audience: 'STUDENTS',
        createdById: coordinator.id
      },
      {
        title: 'Attendance Monitoring',
        content: 'Please ensure you log your attendance daily using the QR code system.',
        audience: 'STUDENTS',
        createdById: coordinator.id
      },
      {
        title: 'Final Presentation Schedule',
        content: 'Final presentations will be held on November 20-22, 2024. Prepare your reports.',
        audience: 'STUDENTS',
      createdById: coordinator.id
    }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('\nSample accounts:');
  console.log('Admin: admin@example.com / Password123!');
  console.log('Coordinator: coordinator@example.com / Password123!');
  console.log('Instructor: instructor@example.com / Password123!');
  console.log('Industry Partner: partner1@example.com / Password123!');
  console.log('\nStudent accounts:');
  console.log('Student 1: student1@example.com / Password123! (Maria Santos - Computer Engineering)');
  console.log('Student 2: student2@example.com / Password123! (John Michael Cruz - Information Technology)');
  console.log('Student 3: student3@example.com / Password123! (Sarah Johnson - Computer Science)');
  console.log('Student 4: student4@example.com / Password123! (Carlos Rodriguez - Computer Engineering)');
  console.log('Student 5: student5@example.com / Password123! (Ana Garcia - Information Technology)');
  console.log('\nCreated:');
  console.log(`- ${5} students with different programs and companies`);
  console.log(`- ${3} companies for internships`);
  console.log(`- ${9} documents with various statuses`);
  console.log(`- ${8} attendance logs with different verification methods`);
  console.log(`- ${4} evaluations from different evaluators`);
  console.log(`- ${5} announcements for students`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });