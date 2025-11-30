import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  FileText,
  X,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import {
  coordinatorService,
  type CoordinatorStudent,
} from "../../services/coordinatorService";
import { instructorService } from "../../services/instructorService";
import type { Company } from "../../services/companyService";
import PartnershipMessageThread from "../../components/PartnershipMessageThread";
import { documentService } from "../../services/documentService";
import type { Document } from "../../services/documentService";
import api from "../../services/api";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

// Utility function to format student ID
const formatStudentId = (studentNumber: string) => {
  if (/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
    return studentNumber;
  }
  if (/^\d{4}-\d{5}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4);
    const number = studentNumber.substring(5, 9);
    return `${year}-UR-${number}`;
  }
  if (/^\d{4}-\d{4}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4);
    const number = studentNumber.substring(5);
    return `${year}-UR-${number}`;
  }
  return studentNumber || "22-UR-0592";
};

// Use CoordinatorStudent from the service instead of local interface
// Alias for clarity
type Student = CoordinatorStudent;

interface Instructor {
  id: string;
  name: string;
  email: string;
  studentsAssigned: number;
}

interface CoordinatorStudentManagementProps {
  bulkOperationsEnabled?: boolean;
}

const CoordinatorStudentManagement: React.FC<CoordinatorStudentManagementProps> = ({
  bulkOperationsEnabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMassAssignModal, setShowMassAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailCompanyId, setDetailCompanyId] = useState<string>("");
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Fetch students
  const {
    data: studentsData,
    loading: studentsLoading,
    refresh: refetchStudents,
  } = useOptimizedData(() => coordinatorService.getAllStudents(), [], {
    ttl: 3 * 60 * 1000,
  });
  const students = studentsData ?? [];

  // Fetch company applications to check if students are finding companies
  const [companyApplications, setCompanyApplications] = useState<any[]>([]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await api.get("/company-applications?status=PENDING");
        setCompanyApplications(response.data.applications || []);
      } catch (error) {
        console.error("Error loading company applications:", error);
        setCompanyApplications([]);
      }
    };
    loadApplications();
  }, []);

  // Get company display text based on student and applications
  const getCompanyDisplay = (student: Student): string => {
    // If student has a company, show it
    if (student.company && student.company !== 'No Company') {
      return student.company;
    }

    // Check if student has pending applications
    const hasPendingApplication = companyApplications.some(
      (app: any) => app.studentId === student.id && app.status === 'PENDING'
    );

    if (hasPendingApplication) {
      return 'Finding Company';
    }

    // Default to "No Company"
    return 'No Company';
  };

  // Check for studentId in sessionStorage to auto-open student (from notification click)
  useEffect(() => {
    const openStudentId = sessionStorage.getItem('openStudentId');
    if (openStudentId && students.length > 0) {
      const studentToOpen = students.find(s => s.id === openStudentId);
      if (studentToOpen) {
        setDetailStudent(studentToOpen);
        setShowStudentDetailsModal(true);
        // Clear the sessionStorage after opening
        sessionStorage.removeItem('openStudentId');
      }
    }
  }, [students]);

  // Fetch instructors
  const { data: instructorsData, loading: instructorsLoading } = useOptimizedData(
    () => coordinatorService.getInstructors(),
    [],
    {
      ttl: 5 * 60 * 1000,
    }
  );
  const instructors = instructorsData ?? [];

  const {
    data: companiesData,
    loading: companiesLoading,
    refresh: refreshCompanies,
  } = useOptimizedData(() => coordinatorService.getAllCompanies(), [], {
    ttl: 5 * 60 * 1000,
  });
  const companies = companiesData ?? [];

  const handleAssignStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowAssignModal(true);
  };

  const handleUnassignStudent = (student: Student) => {
    if (!student.instructorId) return;
    setSelectedStudent(student);
    setShowUnassignModal(true);
  };

  const handleConfirmUnassign = async () => {
    if (!selectedStudent || !selectedStudent.instructorId) return;

    try {
      setLoading(true);
      await instructorService.unassignStudentFromInstructor(selectedStudent.id);
      toast.success(
        `Student ${selectedStudent.name} unassigned from instructor successfully`
      );
      setShowUnassignModal(false);
      setSelectedStudent(null);
      await refetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to unassign student");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedStudent || !selectedInstructor) return;

    try {
      setLoading(true);
      await instructorService.assignStudentToInstructor(
        selectedStudent.id,
        selectedInstructor
      );
      toast.success(
        `Student ${selectedStudent.name} assigned to instructor successfully`
      );
      setShowAssignModal(false);
      setSelectedStudent(null);
      setSelectedInstructor("");
      await refetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign student to instructor");
    } finally {
      setLoading(false);
    }
  };

  const handleMassAssignment = () => {
    if (!bulkOperationsEnabled) {
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setShowMassAssignModal(true);
  };

  const handleConfirmMassAssignment = async () => {
    if (!bulkOperationsEnabled) {
      return;
    }
    if (selectedStudents.length === 0 || !selectedInstructor) return;

    try {
      setLoading(true);

      // Use the new bulk assignment API
      const success = await instructorService.bulkAssignStudentsToInstructor(
        selectedStudents,
        selectedInstructor
      );

      if (success) {
        toast.success(
          `${selectedStudents.length} students assigned to instructor successfully`
        );
        setShowMassAssignModal(false);
        setSelectedStudents([]);
        setSelectedInstructor("");
        await refetchStudents();
      } else {
        toast.error("Failed to assign students to instructor");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign students to instructor");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    if (!bulkOperationsEnabled) {
      return;
    }
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (!bulkOperationsEnabled) {
      return;
    }
    const unassignedStudents = filteredStudents.filter(
      (student: Student) => !student.instructorId
    );
    if (selectedStudents.length === unassignedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(
        unassignedStudents.map((student: Student) => student.id)
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Filter students
  const filteredStudents = (students || []).filter((student: Student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.status.toLowerCase() === statusFilter;

    const matchesInstructor =
      instructorFilter === "all" ||
      (instructorFilter === "assigned" && student.instructorId) ||
      (instructorFilter === "unassigned" && !student.instructorId) ||
      student.instructorId === instructorFilter;

    return matchesSearch && matchesStatus && matchesInstructor;
  });

  const combinedLoading =
    studentsLoading || instructorsLoading || companiesLoading;

  // Debug logging
  console.log("CoordinatorStudentManagement render:", {
    students: students?.length || 0,
    instructors: instructors?.length || 0,
    studentsLoading,
    instructorsLoading,
    combinedLoading,
  });

  useEffect(() => {
    if (!bulkOperationsEnabled) {
      setSelectedStudents([]);
      setShowMassAssignModal(false);
    }
  }, [bulkOperationsEnabled]);

  // Early return if data is not ready
  // Early return if data is not ready
  if (!students && !instructors && combinedLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#212124] border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {["Student", "Company", "Instructor", "Status", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const columnCount = bulkOperationsEnabled ? 6 : 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="group relative bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 sm:space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Student Management
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                  Manage and monitor student progress
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto">
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{filteredStudents.length} students</span>
              </div>
              {filteredStudents.filter(
                (student: Student) => !student.instructorId
              ).length > 0 && (
                  <button
                    onClick={() => {
                      const unassignedStudents = filteredStudents.filter(
                        (student: Student) => !student.instructorId
                      );
                      setSelectedStudents(
                        unassignedStudents.map((student: Student) => student.id)
                      );
                      setShowMassAssignModal(true);
                    }}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Quick Assign All Unassigned</span>
                    <span className="sm:hidden">Quick Assign</span>
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="group relative bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, companies, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full md:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full md:w-auto"
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              {(instructors || []).map((instructor: Instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {bulkOperationsEnabled && selectedStudents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedStudents.length} student
                {selectedStudents.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedStudents([])}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMassAssignment}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Mass Assign to Instructor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && detailStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Student Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage company assignment for {detailStudent.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStudentDetailsModal(false);
                  setDetailStudent(null);
                  setDetailError(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 space-y-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {detailStudent.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Student No: {formatStudentId(detailStudent.studentNumber)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Program: {detailStudent.program}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Assignment
                </label>
                <select
                  value={detailCompanyId}
                  onChange={(e) => setDetailCompanyId(e.target.value)}
                  disabled={companiesLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No Company (Unassigned)</option>
                  {companies.map((company: Company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {detailError && (
                <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                  {detailError}
                </div>
              )}

              {/* Partnership Documents */}
              {detailStudent && (
                <PartnershipDocumentsSection studentId={detailStudent.id} studentName={detailStudent.name} />
              )}

              {/* Partnership Communication */}
              {detailStudent && (
                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <PartnershipMessageThread
                    studentId={detailStudent.id}
                    studentName={detailStudent.name}
                    currentUserRole="COORDINATOR"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowStudentDetailsModal(false);
                  setDetailStudent(null);
                  setDetailError(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!detailStudent) return;
                  try {
                    setDetailSaving(true);
                    await coordinatorService.updateStudentCompany(
                      detailStudent.id,
                      detailCompanyId || null
                    );
                    toast.success("Student company assignment updated.");
                    setShowStudentDetailsModal(false);
                    setDetailStudent(null);
                    setDetailError(null);
                    await Promise.all([refetchStudents(), refreshCompanies()]);
                  } catch (error: any) {
                    const message =
                      error?.message ||
                      "Failed to update student company assignment.";
                    setDetailError(message);
                    toast.error(message);
                  } finally {
                    setDetailSaving(false);
                  }
                }}
                disabled={detailSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {detailSaving ? (
                  <span className="inline-flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#212124]">
              <tr>
                {bulkOperationsEnabled && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudents.length > 0 &&
                        selectedStudents.length ===
                        filteredStudents.filter(
                          (student: Student) => !student.instructorId
                        ).length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#212124] divide-y divide-gray-200 dark:divide-gray-700">
              {combinedLoading ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Loading students...
                    </p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      No students found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student: Student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {bulkOperationsEnabled && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          disabled={!!student.instructorId}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatStudentId(student.studentNumber)} •{" "}
                            {student.program}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getCompanyDisplay(student)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.instructorName ? (
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 text-green-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.instructorName}
                            </span>
                            <div className="text-xs text-gray-500">
                              {student.instructorEmail}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UserX className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">
                            Unassigned
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {student.instructorId ? (
                          <button
                            onClick={() => handleUnassignStudent(student)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Unassign from instructor"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignStudent(student)}
                            className="text-green-600 hover:text-green-900"
                            title="Assign to instructor"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDetailStudent(student);
                            setDetailCompanyId(student.companyId || "");
                            setDetailError(null);
                            setShowStudentDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="lg:hidden space-y-3">
        {combinedLoading ? (
          <div className="bg-white dark:bg-[#212124] rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Loading students...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-[#212124] rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <Users className="w-12 h-12 mx-auto text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              No students found
            </p>
          </div>
        ) : (
          filteredStudents.map((student: Student) => (
            <div
              key={student.id}
              className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              {/* Student Header */}
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                    {student.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatStudentId(student.studentNumber)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {student.program}
                  </p>
                </div>
              </div>

              {/* Company Section */}
              <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {getCompanyDisplay(student)}
                </span>
              </div>

              {/* Status and Instructor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(
                      student.status
                    )}`}
                  >
                    {student.status.replace("_", " ").toUpperCase()}
                  </span>
                  {student.instructorName ? (
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {student.instructorName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <UserX className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Unassigned</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {student.instructorId ? (
                    <button
                      onClick={() => handleUnassignStudent(student)}
                      disabled={loading}
                      className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      title="Unassign"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssignStudent(student)}
                      className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      title="Assign"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDetailStudent(student);
                      setDetailCompanyId(student.companyId || "");
                      setDetailError(null);
                      setShowStudentDetailsModal(true);
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Assign Student to Instructor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Assign{" "}
              <span className="font-semibold">{selectedStudent.name}</span> to
              an instructor
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Instructor
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose an instructor...</option>
                {(instructors || []).map((instructor: Instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.studentsAssigned} students)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStudent(null);
                  setSelectedInstructor("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedInstructor || loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Assign Student"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Assign Modal */}
      {bulkOperationsEnabled && showMassAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Mass Assign Students
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Assign{" "}
              <span className="font-semibold">
                {selectedStudents.length} students
              </span>{" "}
              to an instructor
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Instructor
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an instructor...</option>
                {(instructors || []).map((instructor: Instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.studentsAssigned} students)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected Students:
              </h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-[#212124] rounded-lg p-3">
                {selectedStudents.map((studentId) => {
                  const student = filteredStudents.find(
                    (s: Student) => s.id === studentId
                  );
                  return student ? (
                    <div
                      key={studentId}
                      className="text-sm text-gray-600 dark:text-gray-300 py-1"
                    >
                      • {student.name} ({formatStudentId(student.studentNumber)}
                      )
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowMassAssignModal(false);
                  setSelectedInstructor("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMassAssignment}
                disabled={!selectedInstructor || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Assign ${selectedStudents.length} Students`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirmation Modal */}
      {showUnassignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
              Unassign Student
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to unassign{" "}
              <span className="font-semibold">{selectedStudent.name}</span> from{" "}
              <span className="font-semibold">
                {selectedStudent.instructorName}
              </span>
              ?
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This action will remove the instructor
                assignment. The student will need to be reassigned manually.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnassignModal(false);
                  setSelectedStudent(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnassign}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Unassign Student"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Partnership Documents Section Component
const PartnershipDocumentsSection: React.FC<{ studentId: string; studentName: string }> = ({ studentId, studentName }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");

  const preDeploymentDocTypes = [
    "APPLICATION_INTERNSHIP",
    "MEDICAL_CERTIFICATE",
    "CERTIFICATION_UNITS",
    "INTERNSHIP_RESUME",
    "CONSENT_FORM",
    "ENDORSEMENT_LETTER",
    "INTERNSHIP_RELEASE",
  ];

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents?studentId=${studentId}`);
      const allDocs = response.data.documents || [];
      const preDeploymentDocs = allDocs.filter((doc: Document) => preDeploymentDocTypes.includes(doc.type));
      setDocuments(preDeploymentDocs);
    } catch (error) {
      console.error("Error loading partnership documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (document: Document) => {
    try {
      setSelectedDoc(document);
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    try {
      await documentService.approveDocument(selectedDoc.id, remarks);
      toast.success("Document approved successfully");
      setReviewAction(null);
      setRemarks("");
      setSelectedDoc(null);
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      await loadDocuments();
    } catch (error: any) {
      console.error("Error approving document:", error);
      toast.error(error.response?.data?.message || "Failed to approve document");
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    try {
      await documentService.rejectDocument(selectedDoc.id, remarks);
      toast.success("Document rejected");
      setReviewAction(null);
      setRemarks("");
      setSelectedDoc(null);
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      await loadDocuments();
    } catch (error: any) {
      console.error("Error rejecting document:", error);
      toast.error(error.response?.data?.message || "Failed to reject document");
    }
  };

  const getDocName = (type: string) => {
    const names: Record<string, string> = {
      APPLICATION_INTERNSHIP: "Application for Internship (Form FM-AA-INT-01)",
      MEDICAL_CERTIFICATE: "Medical Certificate and Psychological Test",
      CERTIFICATION_UNITS: "Certification of Units Earned (Form FM-AA-INT-02)",
      INTERNSHIP_RESUME: "Internship Resume (Form FM-AA-INT-09)",
      CONSENT_FORM: "Consent Form (Form FM-AA-INT-03)",
      ENDORSEMENT_LETTER: "Endorsement Letter (Form FM-AA-INT-05)",
      INTERNSHIP_RELEASE: "Internship Release Form (Form FM-AA-INT-12)",
    };
    return names[type] || type.replace(/_/g, " ");
  };

  return (
    <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pre-Deployment Required Documents
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and approve pre-deployment documents for {studentName}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No pre-deployment documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-lg border ${doc.status === "APPROVED"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                  : doc.status === "PENDING"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                    : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getDocName(doc.type)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${doc.status === "APPROVED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        : doc.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                      }`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.filename}
                  </p>
                  {doc.remarks && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Remarks: {doc.remarks}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handlePreview(doc)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {doc.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setReviewAction("approve");
                          setRemarks("");
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setReviewAction("reject");
                          setRemarks("");
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedDoc && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }} onClick={() => {
          setReviewAction(null);
          setRemarks("");
        }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {reviewAction === "approve" ? "Approve" : "Reject"} Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {getDocName(selectedDoc.type)}
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={reviewAction === "approve" ? "Optional remarks..." : "Reason for rejection (required)"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white mb-4"
              rows={4}
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={reviewAction === "approve" ? handleApprove : handleReject}
                disabled={reviewAction === "reject" && !remarks.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${reviewAction === "approve"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
              >
                {reviewAction === "approve" ? "Approve" : "Reject"}
              </button>
              <button
                onClick={() => {
                  setReviewAction(null);
                  setRemarks("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedDoc && previewUrl && !reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4" onClick={() => {
          setSelectedDoc(null);
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDoc.filename}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getDocName(selectedDoc.type)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
              {selectedDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={selectedDoc.filename}
                />
              ) : selectedDoc.mimeType?.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={selectedDoc.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Preview not available for this file type
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorStudentManagement;
