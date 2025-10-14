import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { auditLog } from '../services/audit.service';

const prisma = new PrismaClient();

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
    res.status(500).json({ message: 'Failed to fetch students', error });
  }
};

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const student = await prisma.student.findFirst({
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
        company: { 
          select: { 
            id: true,
            name: true,
            address: true
          } 
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Calculate completed hours from attendance logs
    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: { studentId: student.id, verified: true },
      select: { durationMinutes: true }
    });

    const completedHours = Math.round(attendanceLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60);

    res.json({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      studentNumber: student.studentNumber,
      program: student.program,
      year: student.year,
      section: student.section,
      company: student.company?.name || '',
      supervisor: student.supervisorName || '',
      totalHours: student.totalHours,
      completedHours: completedHours,
      startDate: student.startDate,
      endDate: student.endDate
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Failed to fetch student profile', error });
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

    // If no instructor is specified, automatically assign one
    let assignedInstructorId = instructorId;
    
    if (!assignedInstructorId) {
      // Find the instructor with the least number of assigned students
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

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          company: { select: { name: true } },
          instructor: { select: { id: true, name: true, email: true } },
          attendanceLogs: {
            select: {
              id: true,
              date: true,
              timeIn: true,
              timeOut: true,
              durationMinutes: true,
              verified: true
            },
            orderBy: { date: 'desc' },
            take: 30 // Last 30 attendance logs
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

    // Calculate additional metrics for each student
    const studentsWithMetrics = await Promise.all(students.map(async (student) => {
      // Calculate attendance rate based on expected working days vs actual attendance
      let attendanceRate = 0;
      
      if (student.startDate && student.endDate) {
        // Calculate expected working days (excluding weekends)
        const startDate = new Date(student.startDate);
        const endDate = new Date(student.endDate);
        const now = new Date();
        
        // Use current date if internship is still ongoing
        const effectiveEndDate = endDate > now ? now : endDate;
        
        let expectedWorkingDays = 0;
        let currentDate = new Date(startDate);
        
        while (currentDate <= effectiveEndDate) {
          // Count only weekdays (Monday = 1, Sunday = 0)
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            expectedWorkingDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Get actual attendance days
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

      const completedHours = Math.round(attendanceLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60);

      // Get last evaluation rating
      const lastEvaluation = student.evaluations[0]?.rating || 0;

      // Determine student status based on multiple criteria
      let status = 'active';
      
      // Check if internship period has ended
      const now = new Date();
      const endDate = student.endDate ? new Date(student.endDate) : null;
      const hasEnded = endDate && endDate < now;
      
      // Calculate completion percentage
      const completionPercentage = (completedHours / student.totalHours) * 100;
      
      if (hasEnded && completionPercentage >= 100 && attendanceRate >= 75) {
        // Internship ended and student met all requirements
        status = 'completed';
      } else if (hasEnded && (completionPercentage < 100 || attendanceRate < 75)) {
        // Internship ended but student didn't meet requirements
        status = 'at_risk';
      } else if (!hasEnded && attendanceRate < 75) {
        // Internship ongoing but attendance is poor
        status = 'at_risk';
      } else if (!hasEnded && attendanceRate >= 75 && completionPercentage >= 100) {
        // Internship ongoing but student has already completed all hours
        status = 'completed';
      } else {
        // Default active status
        status = 'active';
      }

      return {
        ...student,
        attendanceRate,
        completedHours,
        lastEvaluation,
        status,
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