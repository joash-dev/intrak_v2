import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Trash2,
  UserPlus,
  Award,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import {
  instructorService,
  type InstructorStudent,
} from "../../services/instructorService";
import toast from "react-hot-toast";

// Utility function to format student ID
const formatStudentId = (studentNumber: string) => {
  // If already in correct format, return as is
  if (/^\d{2}-[A-Z]{2}-\d{4}$/.test(studentNumber)) {
    return studentNumber;
  }

  // If it's in format like "2021-12345", convert to "21-UR-1234"
  if (/^\d{4}-\d{5}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5, 9); // Get first 4 digits of the number part
    return `${year}-UR-${number}`;
  }

  // If it's in format like "2021-1234", convert to "21-UR-1234"
  if (/^\d{4}-\d{4}$/.test(studentNumber)) {
    const year = studentNumber.substring(2, 4); // Get last 2 digits of year
    const number = studentNumber.substring(5); // Get the number part
    return `${year}-UR-${number}`;
  }

  // Default fallback - return as is if it doesn't match any pattern
  return studentNumber || "22-UR-0592";
};

// Use InstructorStudent type from the service
type Student = InstructorStudent;

const InstructorStudentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [createdStudentInfo, setCreatedStudentInfo] = useState<{
    name: string;
    email: string;
    studentNumber: string;
    emailSent: boolean;
  } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentNumber: "",
    name: "",
    email: "",
    phone: "",
    program: "BS Computer Engineering", // Hardcoded for BSCOE students only
    year: "",
    company: "",
    companyAddress: "",
    supervisor: "",
    supervisorEmail: "",
    startDate: "",
    endDate: "",
  });

  // Load students data on component mount
  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    try {
      setLoading(true);
      const studentsData = await instructorService.getAssignedStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setShowAddModal(true);
    setCreateError(null);
    setFieldErrors({});
    setNewStudent({
      studentNumber: "",
      name: "",
      email: "",
      phone: "",
      program: "BS Computer Engineering",
      year: "",
      company: "",
      companyAddress: "",
      supervisor: "",
      supervisorEmail: "",
      startDate: "",
      endDate: "",
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newStudent.studentNumber.trim()) {
      errors.studentNumber = "Student number is required";
    } else if (!/^\d{2}-[A-Z]{2}-\d{4}$/.test(newStudent.studentNumber)) {
      errors.studentNumber = "Student number must be in format: 22-UR-0592";
    }

    if (!newStudent.name.trim()) {
      errors.name = "Full name is required";
    }

    if (!newStudent.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      errors.email = "Invalid email format";
    }

    if (!newStudent.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!newStudent.year.trim()) {
      errors.year = "Year level is required";
    }

    if (!newStudent.company.trim()) {
      errors.company = "Company name is required";
    }

    if (!newStudent.companyAddress.trim()) {
      errors.companyAddress = "Company address is required";
    }

    if (!newStudent.supervisor.trim()) {
      errors.supervisor = "Supervisor name is required";
    }

    if (!newStudent.supervisorEmail.trim()) {
      errors.supervisorEmail = "Supervisor email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.supervisorEmail)) {
      errors.supervisorEmail = "Invalid supervisor email format";
    }

    if (!newStudent.startDate.trim()) {
      errors.startDate = "Start date is required";
    }

    if (!newStudent.endDate.trim()) {
      errors.endDate = "End date is required";
    } else if (
      newStudent.startDate &&
      new Date(newStudent.endDate) <= new Date(newStudent.startDate)
    ) {
      errors.endDate = "End date must be after start date";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    if (!validateForm()) {
      return;
    }

    // Prevent multiple submissions
    if (isCreating) {
      console.log(
        "Student creation already in progress, ignoring duplicate request"
      );
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      console.log("Starting student creation process...");

      // Create the student using the instructor service
      const result = await instructorService.createStudent({
        studentNumber: newStudent.studentNumber,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        program: newStudent.program,
        year: newStudent.year,
        company: newStudent.company,
        companyAddress: newStudent.companyAddress,
        supervisor: newStudent.supervisor,
        supervisorEmail: newStudent.supervisorEmail,
        startDate: newStudent.startDate,
        endDate: newStudent.endDate,
      });

      setCreatedStudentInfo({
        name: result.name,
        email: result.email,
        studentNumber: result.studentNumber,
        emailSent: result.emailSent || false,
      });

      toast.success("Student created successfully!");
      setShowAddModal(false);
      await loadStudentsData();
    } catch (error: any) {
      console.error("Error creating student:", error);

      // Handle specific error messages
      let errorMessage = "Failed to create student";
      if (error.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setCreateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete || deleteConfirmationText !== "DELETE") {
      return;
    }

    try {
      await instructorService.deleteStudent(studentToDelete.id);
      toast.success("Student deleted successfully!");
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setDeleteConfirmationText("");
      await loadStudentsData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      at_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.active;
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || student.status === filterStatus;
    const matchesCompany =
      filterCompany === "all" || student.company === filterCompany;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const uniqueCompanies = Array.from(
    new Set(students.map((student) => student.company))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading students data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your assigned students and their information
              </p>
            </div>
          </div>
          <button
            onClick={handleAddStudent}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {students.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {students.filter((s) => s.status === "active").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                At Risk
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {students.filter((s) => s.status === "at_risk").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {students.filter((s) => s.status === "completed").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Companies</option>
            {uniqueCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatStudentId(student.studentId)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {student.program}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Year {student.year}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {student.company}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.supervisor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (student.hoursCompleted / student.requiredHours) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {student.hoursCompleted}/{student.requiredHours}h
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setStudentToDelete(student);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "No Students Found"
                : "No Students Assigned"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "Try adjusting your search criteria or filters to find students."
                : "You don't have any students assigned to you yet. Click the 'Add Student' button to create your first student profile."}
            </p>
            {!searchQuery &&
              filterStatus === "all" &&
              filterCompany === "all" && (
                <button
                  onClick={handleAddStudent}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Your First Student
                </button>
              )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {createError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Student Number *
                </label>
                <input
                  type="text"
                  value={newStudent.studentNumber}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      studentNumber: e.target.value,
                    })
                  }
                  placeholder="22-UR-0592"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.studentNumber
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.studentNumber && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.studentNumber}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  placeholder="Juan Dela Cruz"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  placeholder="juan.delacruz@email.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.email
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, phone: e.target.value })
                  }
                  placeholder="+63 912 345 6789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.phone
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Program
                </label>
                <input
                  type="text"
                  value={newStudent.program}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year Level *
                </label>
                <select
                  value={newStudent.year}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, year: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.year
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {fieldErrors.year && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.year}
                  </p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={newStudent.company}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, company: e.target.value })
                  }
                  placeholder="ABC Corporation"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.company
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.company && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.company}
                  </p>
                )}
              </div>

              {/* Company Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Address *
                </label>
                <input
                  type="text"
                  value={newStudent.companyAddress}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      companyAddress: e.target.value,
                    })
                  }
                  placeholder="123 Business St, City, Province"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.companyAddress
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.companyAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.companyAddress}
                  </p>
                )}
              </div>

              {/* Supervisor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supervisor *
                </label>
                <input
                  type="text"
                  value={newStudent.supervisor}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, supervisor: e.target.value })
                  }
                  placeholder="Maria Santos"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.supervisor
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.supervisor && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.supervisor}
                  </p>
                )}
              </div>

              {/* Supervisor Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supervisor Email *
                </label>
                <input
                  type="email"
                  value={newStudent.supervisorEmail}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      supervisorEmail: e.target.value,
                    })
                  }
                  placeholder="maria.santos@company.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.supervisorEmail
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.supervisorEmail && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.supervisorEmail}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={newStudent.startDate}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, startDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.startDate
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.startDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={newStudent.endDate}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, endDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    fieldErrors.endDate
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {fieldErrors.endDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStudent}
                disabled={isCreating}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {createdStudentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Student Created Successfully!
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Name:</strong> {createdStudentInfo.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Student Number:</strong>{" "}
                  {createdStudentInfo.studentNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {createdStudentInfo.email}
                </p>
                {createdStudentInfo.emailSent && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ Welcome email sent to student
                  </p>
                )}
              </div>
              <button
                onClick={() => setCreatedStudentInfo(null)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Delete Student
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete{" "}
                <strong>{studentToDelete.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStudentToDelete(null);
                    setDeleteConfirmationText("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={deleteConfirmationText !== "DELETE"}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorStudentManagement;
