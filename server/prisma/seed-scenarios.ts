import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding specific student scenarios...');

    const passwordHash = await bcrypt.hash('Password123!', 12);

    // 1. Fetch necessary relations (Instructor, Companies)
    // We assume these exist from the main seed or will default/fail gracefully if not.
    // In a real scenario, we might want to create them if missing.
    // For now, let's try to find them, or create a fallback.

    let instructor = await prisma.user.findUnique({ where: { email: 'instructor@example.com' } });
    if (!instructor) {
        console.log('⚠️ Instructor not found, creating fallback instructor...');
        instructor = await prisma.user.create({
            data: {
                email: 'instructor@example.com',
                name: 'Jane Instructor',
                passwordHash,
                role: 'INSTRUCTOR'
            }
        });
    }

    let techCompany = await prisma.company.findFirst({ where: { name: 'Tech Innovations Inc.' } });
    if (!techCompany) {
        console.log('⚠️ Company not found, creating fallback company...');
        techCompany = await prisma.company.create({
            data: {
                name: 'Tech Innovations Inc.',
                address: 'Urdaneta City, Pangasinan',
                contactPerson: 'Robert Manager',
                contactEmail: 'robert@techinnovations.com',
                contactNumber: '09171234567',
                radiusMeters: 100
            }
        });
    }

    // --- Scenario 1: Hours Completed ---
    // Student who finished 240/240 hours
    try {
        const userCompleted = await prisma.user.upsert({
            where: { email: 'student.completed@test.com' },
            update: {},
            create: {
                email: 'student.completed@test.com',
                name: 'Student Completed',
                passwordHash,
                role: 'STUDENT'
            }
        });

        await prisma.student.upsert({
            where: { userId: userCompleted.id },
            update: {
                totalHours: 240,
                completedHours: 240,
                companyId: techCompany.id
            },
            create: {
                userId: userCompleted.id,
                studentNumber: 'TEST-001',
                program: 'BSIT',
                year: 4,
                section: 'A',
                companyId: techCompany.id,
                supervisorName: 'Mr. Supervisor',
                instructorId: instructor.id,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-05-01'),
                totalHours: 240,
                completedHours: 240
            }
        });
        console.log('✅ Created: student.completed@test.com');
    } catch (e) { console.error('Error creating completed student:', e); }

    // --- Scenario 2: Inactive / Ghosting ---
    // Started OJT but hasn't logged in recently (no logs in 7 days)
    try {
        const userInactive = await prisma.user.upsert({
            where: { email: 'student.inactive@test.com' },
            update: {},
            create: {
                email: 'student.inactive@test.com',
                name: 'Student Inactive',
                passwordHash,
                role: 'STUDENT'
            }
        });

        // Ensure specific create logic
        await prisma.student.upsert({
            where: { userId: userInactive.id },
            update: {},
            create: {
                userId: userInactive.id,
                studentNumber: 'TEST-002',
                program: 'BSIT',
                year: 4,
                section: 'A',
                companyId: techCompany.id,
                supervisorName: 'Mr. Supervisor',
                instructorId: instructor.id,
                startDate: new Date('2024-06-01'), // Started a while ago
                endDate: new Date('2024-12-01'),
                totalHours: 240,
                completedHours: 50 // Only did a bit
            }
        });
        console.log('✅ Created: student.inactive@test.com');
    } catch (e) { console.error('Error creating inactive student:', e); }

    // --- Scenario 3: Forgot Time Out ---
    // Has an open attendance log from yesterday
    try {
        const userForgot = await prisma.user.upsert({
            where: { email: 'student.forgot@test.com' },
            update: {},
            create: {
                email: 'student.forgot@test.com',
                name: 'Student ForgotTimeout',
                passwordHash,
                role: 'STUDENT'
            }
        });

        const studentForgot = await prisma.student.upsert({
            where: { userId: userForgot.id },
            update: { companyId: techCompany.id },
            create: {
                userId: userForgot.id,
                studentNumber: 'TEST-003',
                program: 'BSCS',
                year: 4,
                section: 'B',
                companyId: techCompany.id,
                supervisorName: 'Mr. Supervisor',
                instructorId: instructor.id,
                startDate: new Date(),
                totalHours: 240,
                completedHours: 100
            }
        });

        // Create the hanging log
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(8, 0, 0, 0); // 8 AM yesterday

        // Check if log exists to avoid dupes on re-run
        const existingLog = await prisma.attendanceLog.findFirst({
            where: { studentId: studentForgot.id, timeIn: yesterday, timeOut: null }
        });

        if (!existingLog) {
            await prisma.attendanceLog.create({
                data: {
                    studentId: studentForgot.id,
                    date: yesterday,
                    timeIn: yesterday,
                    timeOut: null, // Forgot to timeout
                    durationMinutes: 0,
                    verified: false
                }
            });
        }
        console.log('✅ Created: student.forgot@test.com');
    } catch (e) { console.error('Error creating forgot timeout student:', e); }


    // --- Scenario 4: Overtime / Excessive Hours ---
    // Logged 16 hours today
    try {
        const userOvertime = await prisma.user.upsert({
            where: { email: 'student.overtime@test.com' },
            update: {},
            create: {
                email: 'student.overtime@test.com',
                name: 'Student Overtime',
                passwordHash,
                role: 'STUDENT'
            }
        });

        const studentOvertime = await prisma.student.upsert({
            where: { userId: userOvertime.id },
            update: { companyId: techCompany.id },
            create: {
                userId: userOvertime.id,
                studentNumber: 'TEST-004',
                program: 'BSCpE',
                year: 4,
                section: 'C',
                companyId: techCompany.id,
                supervisorName: 'Mr. Supervisor',
                instructorId: instructor.id,
                startDate: new Date(),
                totalHours: 240,
                completedHours: 200
            }
        });

        const today = new Date();
        today.setHours(8, 0, 0, 0);
        const timeOut = new Date(today);
        timeOut.setHours(24, 0, 0, 0); // 16 hours later (midnight)

        // avoid dupe
        const existingOvertime = await prisma.attendanceLog.findFirst({
            where: { studentId: studentOvertime.id, durationMinutes: 16 * 60 }
        });

        if (!existingOvertime) {
            await prisma.attendanceLog.create({
                data: {
                    studentId: studentOvertime.id,
                    date: today,
                    timeIn: today,
                    timeOut: timeOut,
                    durationMinutes: 16 * 60, // 960 mins
                    verified: false
                }
            });
        }
        console.log('✅ Created: student.overtime@test.com');
    } catch (e) { console.error('Error creating overtime student:', e); }

    // --- Scenario 5: Rejected Application ---
    // Applied to company, got rejected
    try {
        const userRejected = await prisma.user.upsert({
            where: { email: 'student.rejected@test.com' },
            update: {},
            create: {
                email: 'student.rejected@test.com',
                name: 'Student Rejected',
                passwordHash,
                role: 'STUDENT'
            }
        });

        const studentRejected = await prisma.student.upsert({
            where: { userId: userRejected.id },
            update: { companyId: null }, // Ensure NULL company
            create: {
                userId: userRejected.id,
                studentNumber: 'TEST-005',
                program: 'BSIT',
                year: 4,
                section: 'B',
                companyId: null, // No active company
                instructorId: instructor.id,
                totalHours: 486,
                completedHours: 0
            }
        });

        // Create rejected application
        // Check existing
        const existingApp = await prisma.companyApplication.findFirst({
            where: { studentId: studentRejected.id, companyId: techCompany.id }
        });

        if (!existingApp) {
            await prisma.companyApplication.create({
                data: {
                    studentId: studentRejected.id,
                    companyId: techCompany.id,
                    status: 'REJECTED',
                    rejectionReason: 'GPA requirement not met'
                }
            });
        }
        console.log('✅ Created: student.rejected@test.com');
    } catch (e) { console.error('Error creating rejected student:', e); }

    // --- Scenario 6: New Student ---
    // Fresh account
    try {
        const userNew = await prisma.user.upsert({
            where: { email: 'student.new@test.com' },
            update: {},
            create: {
                email: 'student.new@test.com',
                name: 'Student New',
                passwordHash,
                role: 'STUDENT'
            }
        });

        await prisma.student.upsert({
            where: { userId: userNew.id },
            update: {},
            create: {
                userId: userNew.id,
                studentNumber: 'TEST-006',
                program: 'BSIT',
                year: 4,
                section: 'A',
                instructorId: instructor.id,
                totalHours: 486,
                completedHours: 0
            }
        });
        console.log('✅ Created: student.new@test.com');
    } catch (e) { console.error('Error creating new student:', e); }

    console.log('🏁 Verification Scenarios Seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
