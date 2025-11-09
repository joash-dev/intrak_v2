import React, { useState } from "react";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Building2,
  // CheckCircle,
  // AlertTriangle,
  // X,
  Loader2,
  Eye,
  // Edit,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import {
  coordinatorService,
  type CoordinatorStudent,
} from "../../services/coordinatorService";
import { instructorService } from "../../services/instructorService";
import toast from "react-hot-toast";

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

const CoordinatorStudentManagement: React.FC = () => {
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

  // Fetch students
  const {
    data: students = [],
    loading: studentsLoading,
    refresh: refetchStudents,
  } = useOptimizedData(() => coordinatorService.getAllStudents(), [], {
    ttl: 3 * 60 * 1000,
  });

  // Fetch instructors
  const { data: instructors = [], loading: instructorsLoading } =
    useOptimizedData(() => coordinatorService.getInstructors(), [], {
      ttl: 5 * 60 * 1000,
    });

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
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setShowMassAssignModal(true);
  };

  const handleConfirmMassAssignment = async () => {
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
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
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

  const isLoading = studentsLoading || instructorsLoading;

  // Debug logging
  console.log("CoordinatorStudentManagement render:", {
    students: students?.length || 0,
    instructors: instructors?.length || 0,
    studentsLoading,
    instructorsLoading,
    isLoading,
  });

  // Early return if data is not ready
  if (!students && !instructors && isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading student management data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage student assignments and instructor assignments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
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
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Quick Assign All Unassigned
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
      {selectedStudents.length > 0 && (
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

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Loading students...
                    </p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        disabled={!!student.instructorId}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {student.name.charAt(0)}
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
                          {student.company}
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

      {/* Assignment Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Assign Student"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Assignment Modal */}
      {showMassAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
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

export default CoordinatorStudentManagement;
