import { Response } from 'express';
import { NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';
import { notificationService } from '../services/notification.service';
import { calculateExpectedWorkingDays } from '../utils/attendanceUtils';
import { prisma } from '../config/database';

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, userId, instructorId, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (instructorId) where.instructorId = instructorId;
    if (search) {
      where.OR = [
        { studentNumber: { contains: search as string } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    if (req.user?.role === 'INDUSTRY_PARTNER') {
      const supervisorCompanies = await prisma.company.findMany({
        where: { supervisorId: req.user.id },
        select: { id: true },
      });

      if (supervisorCompanies.length === 0) {
        return res.json({
          students: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0,
          },
        });
      }

      const supervisedIds = supervisorCompanies.map((company) => company.id);

      if (where.companyId) {
        if (typeof where.companyId === 'string' && !supervisedIds.includes(where.companyId)) {
          return res.json({
            students: [],
            pagination: {
              total: 0,
              page: Number(page),
              limit: Number(limit),
              pages: 0,
            },
          });
        }
      } else {
        where.companyId = { in: supervisedIds };
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          userId: true,
          studentNumber: true,
          program: true,
          year: true,
          section: true,
          companyId: true,
          supervisorName: true,
          instructorId: true,
          startDate: true,
          endDate: true,
          totalHours: true,
          completedHours: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true, email: true } },
          company: { select: { id: true, name: true } },
          instructor: { select: { id: true, name: true, email: true } },
          evaluations: {
            select: { id: true, rating: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          supervisorFeedbacks: req.user?.role === 'INDUSTRY_PARTNER'
            ? {
              where: { supervisorId: req.user.id },
              select: { id: true },
              take: 1,
            }
            : {
              select: { id: true },
              take: 1,
            },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    const errorMessage = error?.message || 'Failed to fetch students';
    const errorDetails = process.env.NODE_ENV === 'development'
      ? {
        message: errorMessage,
        code: error?.code,
        meta: error?.meta,
      }
      : { message: errorMessage };

    res.status(500).json({
      message: 'Failed to fetch students',
      error: errorDetails
    });
  }
};

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user exists
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true }
      });
    } catch (dbError: any) {
      console.error('Database error fetching user:', dbError);
      return res.status(500).json({
        message: 'Failed to fetch user record',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let student;
    try {
      student = await prisma.student.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          company: true
        }
      });
    } catch (dbError: any) {
      console.error('Database error fetching student:', dbError);
      return res.status(500).json({
        message: 'Failed to fetch student profile',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Calculate completed hours from attendance logs with official time rounding
    let attendanceLogs: any[] = [];
    try {
      attendanceLogs = await prisma.attendanceLog.findMany({
        where: { studentId: student.id, verified: true },
        select: { durationMinutes: true }
      });
    } catch (attendanceError) {
      console.error('Error fetching attendance logs:', attendanceError);
      // Continue with empty array if attendance logs fail
      attendanceLogs = [];
    }

    // Round to official time (30-minute increments)
    const roundToOfficialTime = (minutes: number): number => {
      // Round DOWN to nearest 30-minute interval
      // Anything less than 30 minutes rounds to 0
      if (minutes < 30) {
        return 0;
      }
      // Round down to nearest 30-minute interval (30, 60, 90, 120, etc.)
      return Math.floor(minutes / 30) * 30;
    };

    const totalMinutes = attendanceLogs.reduce((sum, log) => {
      return sum + roundToOfficialTime(log.durationMinutes || 0);
    }, 0);
    // Keep decimal precision (e.g., 30 mins = 0.5 hours, not 1.0)
    const completedHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Safely access company properties
    const company = student.company || null;
    const companyType = company && (company as any).companyType ? (company as any).companyType : null;
    const workingDays = company && (company as any).workingDays ? (company as any).workingDays : null;

    res.json({
      id: student.id,
      name: student.user?.name || user.name || '',
      email: student.user?.email || user.email || '',
      studentNumber: student.studentNumber || '',
      program: student.program || '',
      year: student.year || null,
      section: student.section || '',
      company: company?.name || '',
      supervisor: student.supervisorName || '',
      totalHours: student.totalHours || 0,
      completedHours: completedHours,
      startDate: student.startDate ? student.startDate.toISOString() : null,
      endDate: student.endDate ? student.endDate.toISOString() : null,
      worksOnSaturday: (student as any).worksOnSaturday || false,
      companyType: companyType,
      workingDays: workingDays
    });
  } catch (error: any) {
    console.error('Error fetching student profile:', error);
    const errorMessage = error?.message || 'Unknown error occurred';
    const errorStack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
    res.status(500).json({
      message: 'Failed to fetch student profile',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      ...(errorStack && { stack: errorStack })
    });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        company: true,
        documents: { orderBy: { uploadedAt: 'desc' }, take: 10 },
        attendanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        evaluations: { include: { evaluator: { select: { name: true } } } }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student', error });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating student with data:', req.body);

    const {
      userId,
      studentNumber,
      program,
      year,
      section,
      companyId,
      supervisorName,
      instructorId,
      startDate,
      endDate,
      totalHours
    } = req.body;

    // Validate student number format
    if (studentNumber && !/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
      return res.status(400).json({
        message: 'Student number must be in format: 22-UR-0592'
      });
    }

    // Check if student already exists with this student number
    if (studentNumber) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentNumber }
      });
      if (existingStudent) {
        return res.status(400).json({
          message: `Student with number ${studentNumber} already exists`
        });
      }
    }

    // Check if user already has a student record
    const existingStudentByUser = await prisma.student.findUnique({
      where: { userId }
    });
    if (existingStudentByUser) {
      return res.status(400).json({
        message: 'User already has a student record'
      });
    }

    // If no instructor is specified, automatically assign to the instructor creating the student
    let assignedInstructorId = instructorId;

    if (!assignedInstructorId) {
      // If the user creating the student is an instructor, assign to them
      if (req.user?.role === 'INSTRUCTOR') {
        assignedInstructorId = req.user.id;
        console.log(`Auto-assigning student to creating instructor: ${req.user.name} (${req.user.id})`);
      } else {
        // If not an instructor, find the instructor with the least number of assigned students
        const instructors = await prisma.user.findMany({
          where: { role: 'INSTRUCTOR', active: true },
          include: {
            studentsAssigned: {
              select: { id: true }
            }
          },
          orderBy: {
            studentsAssigned: {
              _count: 'asc'
            }
          }
        });

        // If instructors exist, assign to the one with least students
        if (instructors.length > 0) {
          assignedInstructorId = instructors[0].id;
          console.log(`Auto-assigning student to instructor: ${instructors[0].name} (${instructors[0].id})`);
        } else {
          console.log('No instructors available for auto-assignment');
        }
      }
    }

    const student = await prisma.student.create({
      data: {
        userId,
        studentNumber,
        program,
        year: parseInt(year),
        section,
        companyId,
        supervisorName,
        instructorId: assignedInstructorId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        totalHours: totalHours ? parseInt(totalHours) : 240
      },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } }
      }
    });

    // Log the assignment for audit purposes
    if (assignedInstructorId) {
      await auditLog(req.user!.id, 'STUDENT_AUTO_ASSIGNED', {
        studentId: student.id,
        studentName: student.user.name,
        instructorId: assignedInstructorId,
        instructorName: student.instructor?.name || 'Unknown'
      }, req);
    }

    res.status(201).json({ student });
  } catch (error: any) {
    console.error('Error creating student:', error);

    // Provide more specific error messages
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      res.status(400).json({
        message: `Student with this ${field} already exists`,
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      res.status(400).json({
        message: 'Invalid user ID provided',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    } else {
      res.status(500).json({
        message: 'Failed to create student',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validate student number format if provided
    if (updateData.studentNumber && !/^\d{2}-[A-Z]{2}-\d{4}$/.test(updateData.studentNumber)) {
      return res.status(400).json({
        message: 'Student number must be in format: 22-UR-0592'
      });
    }

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.totalHours) updateData.totalHours = parseInt(updateData.totalHours);

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student', error });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // First, get the student record to find the associated user ID
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete all related data in the correct order to avoid foreign key constraints

    // 1. Delete attendance logs
    const attendanceResult = await prisma.attendanceLog.deleteMany({
      where: { studentId: id }
    });

    // 2. Delete document submissions
    const documentResult = await prisma.document.deleteMany({
      where: { studentId: id }
    });

    // 3. Delete evaluations
    const evaluationResult = await prisma.evaluation.deleteMany({
      where: { studentId: id }
    });

    // 4. Delete audit logs related to this student user
    const auditResult = await prisma.auditLog.deleteMany({
      where: { userId: student.userId }
    });

    // 5. Delete the student record
    await prisma.student.delete({ where: { id } });

    // 6. Finally, delete the user account
    await prisma.user.delete({ where: { id: student.userId } });

    console.log(`✅ Student deletion completed:`);
    console.log(`   • Attendance logs: ${attendanceResult.count}`);
    console.log(`   • Document submissions: ${documentResult.count}`);
    console.log(`   • Evaluations: ${evaluationResult.count}`);
    console.log(`   • Audit logs: ${auditResult.count}`);
    console.log(`   • Student record: 1`);
    console.log(`   • User account: 1`);

    res.json({
      message: 'Student and all related data deleted successfully',
      deleted: {
        attendanceLogs: attendanceResult.count,
        documents: documentResult.count,
        evaluations: evaluationResult.count,
        auditLogs: auditResult.count,
        studentRecord: 1,
        userAccount: 1
      }
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student', error });
  }
};

// Assign student to instructor
export const assignInstructor = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { instructorId } = req.body;

    // Verify instructor exists and has INSTRUCTOR role
    if (instructorId) {
      const instructor = await prisma.user.findFirst({
        where: {
          id: instructorId,
          role: 'INSTRUCTOR',
          active: true
        }
      });

      if (!instructor) {
        return res.status(400).json({ message: 'Invalid instructor ID or instructor not found' });
      }
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { instructorId },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ student });
  } catch (error: any) {
    console.error('Error assigning instructor:', error);
    res.status(500).json({ message: 'Failed to assign instructor', error });
  }
};

// Bulk assign students to instructor
export const bulkAssignInstructor = async (req: AuthRequest, res: Response) => {
  try {
    const { studentIds, instructorId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    if (!instructorId) {
      return res.status(400).json({ message: 'Instructor ID is required' });
    }

    // Verify instructor exists and has INSTRUCTOR role
    const instructor = await prisma.user.findFirst({
      where: {
        id: instructorId,
        role: 'INSTRUCTOR',
        active: true
      }
    });

    if (!instructor) {
      return res.status(400).json({ message: 'Invalid instructor ID or instructor not found' });
    }

    // Verify all students exist
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'One or more student IDs are invalid' });
    }

    // Bulk update students
    const updateResult = await prisma.student.updateMany({
      where: {
        id: { in: studentIds }
      },
      data: { instructorId }
    });

    // Get updated students with instructor info
    const updatedStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      message: `Successfully assigned ${updateResult.count} students to instructor`,
      students: updatedStudents,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email
      }
    });
  } catch (error: any) {
    console.error('Error bulk assigning instructor:', error);
    res.status(500).json({ message: 'Failed to bulk assign instructor', error });
  }
};

// Get students assigned to a specific instructor
export const getStudentsByInstructor = async (req: AuthRequest, res: Response) => {
  try {
    const { instructorId } = req.params;
    const { search, page = 1, limit = 20 } = req.query;

    const where: any = { instructorId };

    if (search) {
      where.OR = [
        { studentNumber: { contains: search as string } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { name: true } },
          instructor: { select: { id: true, name: true, email: true } }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students by instructor', error });
  }
};

// Get students assigned to current instructor (for instructor dashboard)
export const getMyAssignedStudents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user is an instructor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'INSTRUCTOR') {
      return res.status(403).json({ message: 'Access denied. Instructor role required.' });
    }

    const { search, page = 1, limit = 50 } = req.query;

    const where: any = { instructorId: userId };

    if (search) {
      where.OR = [
        { studentNumber: { contains: search as string } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    let students: any[] = [];
    let total = 0;

    try {
      [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          select: {
            id: true,
            userId: true,
            studentNumber: true,
            program: true,
            year: true,
            section: true,
            companyId: true,
            supervisorName: true,
            instructorId: true,
            startDate: true,
            endDate: true,
            totalHours: true,
            completedHours: true,
            weeklyReportData: true,
            jobDescription: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { name: true, email: true } },
            company: {
              select: {
                name: true,
                supervisor: { select: { name: true, email: true } }
              }
            },
            instructor: { select: { id: true, name: true, email: true } },
            attendanceLogs: {
              where: { verified: true },
              select: {
                id: true,
                date: true,
                timeIn: true,
                timeOut: true,
                durationMinutes: true,
                verified: true
              },
              orderBy: { date: 'desc' },
              take: 30 // Last 30 verified attendance logs
            },
            evaluations: {
              select: {
                id: true,
                rating: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5 // Last 5 evaluations
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.student.count({ where })
      ]);
    } catch (error: any) {
      // Handle missing worksOnSaturday column error
      if (error.code === 'P2022' && error.meta?.column?.includes('worksOnSaturday')) {
        console.warn('⚠️ worksOnSaturday column not found in database. Using fallback query.');
        // Fallback: Use $queryRaw to explicitly exclude the column
        const studentIds = await prisma.student.findMany({
          where,
          select: { id: true },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        });

        total = await prisma.student.count({ where });

        // Fetch full student data without worksOnSaturday
        students = await Promise.all(
          studentIds.map(async ({ id }) => {
            const student = await prisma.student.findUnique({
              where: { id },
              select: {
                id: true,
                userId: true,
                studentNumber: true,
                program: true,
                year: true,
                section: true,
                companyId: true,
                supervisorName: true,
                instructorId: true,
                startDate: true,
                endDate: true,
                totalHours: true,
                completedHours: true,
                weeklyReportData: true,
                jobDescription: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { name: true, email: true } },
                company: { select: { name: true } },
                instructor: { select: { id: true, name: true, email: true } },
                attendanceLogs: {
                  where: { verified: true },
                  select: {
                    id: true,
                    date: true,
                    timeIn: true,
                    timeOut: true,
                    durationMinutes: true,
                    verified: true
                  },
                  orderBy: { date: 'desc' },
                  take: 30
                },
                evaluations: {
                  select: {
                    id: true,
                    rating: true,
                    createdAt: true
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 5
                }
              }
            });
            return student;
          })
        );
      } else {
        throw error;
      }
    }

    // Add worksOnSaturday as false for all students (column doesn't exist in production yet)
    const studentsWithWorksOnSaturday = students.map(student => ({
      ...student,
      worksOnSaturday: false
    }));

    // Calculate additional metrics for each student
    const studentsWithMetrics = await Promise.all(studentsWithWorksOnSaturday.map(async (student) => {
      // Calculate attendance rate based on expected working days vs actual attendance
      let attendanceRate = 0;

      // Get company information for working schedule
      let company = null;
      if (student.companyId) {
        company = await prisma.company.findUnique({
          where: { id: student.companyId }
        });
      }

      if (student.startDate && student.endDate) {
        const startDate = new Date(student.startDate);
        const endDate = new Date(student.endDate);
        const now = new Date();

        // Use current date if internship is still ongoing
        const effectiveEndDate = endDate > now ? now : endDate;

        let expectedWorkingDays = 0;

        // Use company-specific working schedule if available
        if (company && (company as any).workingDays && (company as any).workingDays.length > 0) {
          // For private companies, use student's Saturday preference (default to false if column doesn't exist)
          const worksOnSaturday = (company as any).companyType === 'PRIVATE' ? ((student as any).worksOnSaturday ?? false) : undefined;

          expectedWorkingDays = calculateExpectedWorkingDays(
            startDate,
            effectiveEndDate,
            (company as any).workingDays,
            worksOnSaturday
          );
        } else {
          // Fallback to old logic (Mon-Fri only)
          let currentDate = new Date(startDate);
          while (currentDate <= effectiveEndDate) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              expectedWorkingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        // Get actual attendance days (only on expected working days)
        const presentDays = await prisma.attendanceLog.count({
          where: {
            studentId: student.id,
            verified: true,
            timeIn: { not: null },
            date: {
              gte: startDate,
              lte: effectiveEndDate
            }
          }
        });

        // Calculate attendance rate
        if (expectedWorkingDays > 0) {
          attendanceRate = Math.round((presentDays / expectedWorkingDays) * 100);
        } else {
          attendanceRate = 0;
        }
      } else {
        // Fallback: calculate based on available attendance logs
        const totalAttendanceLogs = await prisma.attendanceLog.count({
          where: { studentId: student.id, verified: true }
        });

        const presentDays = await prisma.attendanceLog.count({
          where: {
            studentId: student.id,
            verified: true,
            timeIn: { not: null }
          }
        });

        attendanceRate = totalAttendanceLogs > 0 ? Math.round((presentDays / totalAttendanceLogs) * 100) : 0;
      }

      // Calculate completed hours
      const attendanceLogs = await prisma.attendanceLog.findMany({
        where: { studentId: student.id, verified: true },
        select: { durationMinutes: true }
      });

      // Round to official time (30-minute increments)
      const roundToOfficialTime = (minutes: number): number => {
        // Round DOWN to nearest 30-minute interval
        // Anything less than 30 minutes rounds to 0
        if (minutes < 30) {
          return 0;
        }
        // Round down to nearest 30-minute interval (30, 60, 90, 120, etc.)
        return Math.floor(minutes / 30) * 30;
      };

      const totalMinutes = attendanceLogs.reduce((sum, log) => {
        return sum + roundToOfficialTime(log.durationMinutes);
      }, 0);
      // Keep decimal precision (e.g., 30 mins = 0.5 hours, not 1.0)
      const completedHours = Math.round((totalMinutes / 60) * 10) / 10;

      const lastAttendanceDate = student.attendanceLogs[0]?.date
        ? new Date(student.attendanceLogs[0].date)
        : null;

      const startDateObj = student.startDate ? new Date(student.startDate) : null;
      const endDateObj = student.endDate ? new Date(student.endDate) : null;
      const today = new Date();
      const todayMidnight = new Date(today);
      todayMidnight.setHours(0, 0, 0, 0);

      const internshipStarted =
        !!startDateObj && todayMidnight.getTime() >= new Date(startDateObj).setHours(0, 0, 0, 0);

      let attendanceGapDays = 0;
      if (internshipStarted) {
        const referenceDate = lastAttendanceDate || startDateObj!;
        const referenceMidnight = new Date(referenceDate);
        referenceMidnight.setHours(0, 0, 0, 0);
        attendanceGapDays = Math.max(
          0,
          Math.floor((todayMidnight.getTime() - referenceMidnight.getTime()) / (1000 * 60 * 60 * 24))
        );
      }

      // Get last evaluation rating
      const lastEvaluation = student.evaluations[0]?.rating || 0;

      // Determine student status based on multiple criteria
      let status: 'active' | 'warning' | 'at_risk' | 'completed' = 'active';

      // Calculate completion percentage
      const completionPercentage =
        student.totalHours > 0 ? (completedHours / student.totalHours) * 100 : 0;

      const internshipEnded = endDateObj ? endDateObj < today : false;

      if (completionPercentage >= 100 && attendanceRate >= 75) {
        status = 'completed';
      } else if (!internshipStarted) {
        status = 'active';
      } else if (attendanceGapDays >= 5) {
        status = 'at_risk';
      } else if (attendanceGapDays >= 3) {
        status = 'warning';
      } else if (internshipEnded && completionPercentage < 100) {
        status = 'at_risk';
      } else {
        status = 'active';
      }

      // Get supervisor name - fallback to company supervisor if student supervisorName is empty
      let finalSupervisorName = student.supervisorName;
      if (!finalSupervisorName && student.company?.supervisor?.name) {
        finalSupervisorName = student.company.supervisor.name;
      }

      return {
        ...student,
        supervisorName: finalSupervisorName || null,
        attendanceRate,
        completedHours,
        lastEvaluation,
        status,
        attendanceGapDays,
        lastAttendanceDate: lastAttendanceDate ? lastAttendanceDate.toISOString() : null,
        lastActivity: student.attendanceLogs[0]?.date || student.createdAt
      };
    }));

    res.json({
      students: studentsWithMetrics,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({ message: 'Failed to fetch assigned students', error });
  }
};

// Apply to company for OJT
export const applyToCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, supervisorName, supervisorEmail, supervisorPhone, startDate, endDate, motivation, skills, expectations } = req.body;

    // Validate required fields
    if (!companyId || !supervisorName || !supervisorEmail || !startDate || !endDate || !motivation) {
      return res.status(400).json({
        message: 'Missing required fields: companyId, supervisorName, supervisorEmail, startDate, endDate, motivation'
      });
    }

    // Get the student record
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if student already has a company assigned
    if (student.companyId) {
      return res.status(400).json({
        message: 'Student already has a company assigned. Please contact your instructor to change companies.'
      });
    }

    // Update student with company information
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        companyId: companyId,
        supervisorName: supervisorName,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true, address: true } }
      }
    });

    // Log the application for audit purposes
    await auditLog(req.user!.id, 'STUDENT_COMPANY_APPLICATION', {
      studentId: student.id,
      studentName: student.user.name,
      companyId: companyId,
      companyName: company.name,
      supervisorName: supervisorName,
      startDate: startDate,
      endDate: endDate
    }, req);

    res.json({
      message: 'Application submitted successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Error applying to company:', error);
    res.status(500).json({ message: 'Failed to submit application', error });
  }
};

// Request company partnership (student will find their own company)
export const requestCompanyPartnership = async (req: AuthRequest, res: Response) => {
  try {
    // Get the student record
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Check if student already has a company assigned
    if (student.companyId) {
      return res.status(400).json({
        message: 'Student already has a company assigned. Please contact your instructor to change companies.'
      });
    }

    // Get all coordinators
    const coordinators = await prisma.user.findMany({
      where: {
        role: 'COORDINATOR',
        active: true
      },
      select: { id: true, name: true, email: true }
    });

    // Create notifications for instructor and coordinators
    const notifications: Array<{ userId: string; title: string; message: string; link: string | null; type: NotificationType }> = [];

    // Notify instructor if assigned
    if (student.instructorId && student.instructor) {
      notifications.push({
        userId: student.instructorId,
        title: 'Student Company Partnership Request',
        message: `${student.user.name} (${student.studentNumber}) wants to find their own company and process the MOA. Please review and assist with the partnership setup.`,
        link: `/instructor/students`,
        type: NotificationType.SYSTEM
      });
    }

    // Notify all coordinators
    coordinators.forEach(coordinator => {
      notifications.push({
        userId: coordinator.id,
        title: 'Student Company Partnership Request',
        message: `${student.user.name} (${student.studentNumber}) wants to find their own company and process the MOA. Please review and assist with the partnership setup.`,
        link: `/coordinator/students`,
        type: NotificationType.SYSTEM
      });
    });

    // Create all notifications
    if (notifications.length > 0) {
      await Promise.all(
        notifications.map(notification =>
          notificationService.createNotification(notification)
        )
      );
    }

    // Log the request for audit purposes
    await auditLog(req.user!.id, 'STUDENT_COMPANY_PARTNERSHIP_REQUEST', {
      studentId: student.id,
      studentName: student.user.name,
      studentNumber: student.studentNumber,
      instructorId: student.instructorId,
      coordinatorCount: coordinators.length
    }, req);

    res.json({
      message: 'Company partnership request submitted successfully. Your instructor and coordinator have been notified.',
      notified: {
        instructor: student.instructor ? true : false,
        coordinators: coordinators.length
      }
    });
  } catch (error) {
    console.error('Error requesting company partnership:', error);
    res.status(500).json({ message: 'Failed to submit company partnership request', error });
  }
};

// Get partnership messages
export const getPartnershipMessages = async (req: AuthRequest, res: Response) => {
  try {
    let studentId: string;
    let student: any;

    // If user is student, get their own student record
    if (req.user!.role === 'STUDENT') {
      const studentRecord = await prisma.student.findUnique({
        where: { userId: req.user!.id },
        include: {
          instructor: { select: { id: true } }
        }
      });

      if (!studentRecord) {
        return res.status(404).json({ message: 'Student record not found' });
      }
      student = studentRecord;
      studentId = studentRecord.id;
    } else {
      // If instructor/coordinator, they can view messages for a specific student
      const { studentId: requestedStudentId } = req.query;
      if (!requestedStudentId || typeof requestedStudentId !== 'string') {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      // Get student record with instructor info for security check
      const studentRecord = await prisma.student.findUnique({
        where: { id: requestedStudentId },
        include: {
          instructor: { select: { id: true } },
          user: { select: { id: true } }
        }
      });

      if (!studentRecord) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // SECURITY CHECK: Verify user has access to this student's messages
      // Only the student, their assigned instructor, or coordinators can access
      const hasAccess =
        req.user!.role === 'COORDINATOR' || // Coordinators can access all students
        (req.user!.role === 'INSTRUCTOR' && studentRecord.instructorId === req.user!.id); // Instructors can only access their assigned students

      if (!hasAccess) {
        return res.status(403).json({
          message: 'Access denied. You do not have permission to view messages for this student.'
        });
      }

      student = studentRecord;
      studentId = requestedStudentId;
    }

    // Get messages for this student
    const messages = await prisma.partnershipMessage.findMany({
      where: { studentId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderRole: msg.sender.role,
      createdAt: msg.createdAt.toISOString()
    }));

    res.json({ messages: formattedMessages });
  } catch (error: any) {
    console.error('Error fetching partnership messages:', error);
    res.status(500).json({
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send partnership message
export const sendPartnershipMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { content, studentId: targetStudentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let studentId: string;
    let student: any;

    // If user is student, get their own student record
    if (req.user!.role === 'STUDENT') {
      const studentRecord = await prisma.student.findUnique({
        where: { userId: req.user!.id },
        include: {
          user: { select: { id: true, name: true, role: true } },
          instructor: { select: { id: true, name: true } }
        }
      });

      if (!studentRecord) {
        return res.status(404).json({ message: 'Student record not found' });
      }
      student = studentRecord;
      studentId = studentRecord.id;
    } else {
      // If instructor/coordinator, they can send messages to a specific student
      if (!targetStudentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }
      const studentRecord = await prisma.student.findUnique({
        where: { id: targetStudentId },
        include: {
          user: { select: { id: true, name: true, role: true } },
          instructor: { select: { id: true, name: true } }
        }
      });

      if (!studentRecord) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // SECURITY CHECK: Verify user has permission to send messages to this student
      // Only the student, their assigned instructor, or coordinators can send messages
      const hasPermission =
        req.user!.role === 'COORDINATOR' || // Coordinators can message any student
        (req.user!.role === 'INSTRUCTOR' && studentRecord.instructorId === req.user!.id); // Instructors can only message their assigned students

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Access denied. You do not have permission to send messages to this student.'
        });
      }

      student = studentRecord;
      studentId = targetStudentId;
    }

    // Create the message in database
    const message = await prisma.partnershipMessage.create({
      data: {
        studentId,
        senderId: req.user!.id,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Create notifications for relevant parties
    const notifications: Array<{ userId: string; title: string; message: string; link: string | null; type: NotificationType }> = [];

    if (req.user!.role === 'STUDENT') {
      // Student sent message - notify instructor and coordinators
      if (student.instructorId) {
        notifications.push({
          userId: student.instructorId,
          title: 'New Message from Student',
          message: `${student.user.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          link: `/instructor/students?studentId=${studentId}`,
          type: NotificationType.SYSTEM
        });
      }

      const coordinators = await prisma.user.findMany({
        where: { role: 'COORDINATOR', active: true },
        select: { id: true }
      });

      coordinators.forEach(coordinator => {
        notifications.push({
          userId: coordinator.id,
          title: 'New Message from Student',
          message: `${student.user.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
          link: `/coordinator/students?studentId=${studentId}`,
          type: NotificationType.SYSTEM
        });
      });
    } else {
      // Instructor/Coordinator sent message - notify student
      notifications.push({
        userId: student.userId,
        title: 'New Message from ' + (req.user!.role === 'INSTRUCTOR' ? 'Instructor' : 'Coordinator'),
        message: `${req.user!.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        link: `/student/dashboard?tab=partnership-assistance`,
        type: NotificationType.SYSTEM
      });
    }

    if (notifications.length > 0) {
      await Promise.all(
        notifications.map(notification =>
          notificationService.createNotification(notification)
        )
      );
    }

    // Return formatted message
    res.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        createdAt: message.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error sending partnership message:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta
      } : undefined
    });
  }
};

// Get partnership checklist
export const getPartnershipChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // For now, return default checklist - can be extended to store in database
    const defaultChecklist = [
      { id: '1', name: 'Resume/CV', description: 'Updated resume highlighting your skills and experience', required: true, completed: false },
      { id: '2', name: 'Cover Letter', description: 'Personalized cover letter for the company', required: true, completed: false },
      { id: '3', name: 'Transcript of Records', description: 'Official transcript from the university', required: true, completed: false },
      { id: '4', name: 'Recommendation Letter', description: 'Letter of recommendation from a professor or advisor', required: false, completed: false },
      { id: '5', name: 'Portfolio/Projects', description: 'Portfolio showcasing your work and projects', required: false, completed: false },
      { id: '6', name: 'MOA Template', description: 'Memorandum of Agreement template from the university', required: true, completed: false },
    ];

    res.json({ checklist: defaultChecklist });
  } catch (error) {
    console.error('Error fetching partnership checklist:', error);
    res.status(500).json({ message: 'Failed to fetch checklist', error });
  }
};

// Update partnership checklist
export const updatePartnershipChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { checklist } = req.body;

    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // For now, just return success - can be extended to store in database
    // This could be stored in a JSON field or a separate checklist table
    res.json({ message: 'Checklist updated successfully', checklist });
  } catch (error) {
    console.error('Error updating partnership checklist:', error);
    res.status(500).json({ message: 'Failed to update checklist', error });
  }
};

// Update student's Saturday work preference
export const updateSaturdayPreference = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { worksOnSaturday } = req.body;

    // Validate input
    if (typeof worksOnSaturday !== 'boolean') {
      return res.status(400).json({ message: 'worksOnSaturday must be a boolean value' });
    }

    // Get student with company information
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is assigned to a company
    if (!student.companyId || !student.company) {
      return res.status(400).json({ message: 'Student must be assigned to a company to set Saturday preference' });
    }

    // Only allow Saturday preference for private companies
    if ((student.company as any).companyType !== 'PRIVATE') {
      return res.status(400).json({ message: 'Saturday work preference is only available for students in private companies' });
    }

    // Update student's Saturday preference
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        worksOnSaturday
      } as any,
      include: {
        company: true
      }
    });

    await auditLog(req.user!.id, 'UPDATE_SATURDAY_PREFERENCE', {
      studentId: id,
      worksOnSaturday
    }, req);

    res.json({
      message: 'Saturday work preference updated successfully',
      student: {
        id: updatedStudent.id,
        worksOnSaturday: (updatedStudent as any).worksOnSaturday
      }
    });
  } catch (error: any) {
    console.error('Error updating Saturday preference:', error);
    res.status(500).json({ message: 'Failed to update Saturday preference', error: error.message });
  }
};