import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Trash2,
  UserPlus,
  Upload,
  Award,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Eye,
  Building2,
  Clock,
  Activity,
} from "lucide-react";
import {
  instructorService,
  type InstructorStudent,
} from "../../services/instructorService";
import PartnershipMessageThread from "../../components/PartnershipMessageThread";
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [createdStudentInfo, setCreatedStudentInfo] = useState<{
    name: string;
    email: string;
    studentNumber: string;
    emailSent: boolean;
  } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
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
    status: "active",
    emailSent: false,
  });

  // Bulk add state
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<
    Array<{ studentNumber: string; name: string; email: string; year: string; phone?: string }>
  >([]);
  const [bulkErrors, setBulkErrors] = useState<string | null>(null);
  const [bulkFileLoading, setBulkFileLoading] = useState(false);

  // CSV parser (reusable for paste or file upload)
  const parseCsvText = (text: string) => {
    setBulkErrors(null);
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) {
        setBulkParsed([]);
        return;
      }
      // Detect header or assume no header
      const maybeHeader =
        lines[0].toLowerCase().includes("student") &&
        lines[0].toLowerCase().includes("name");
      const dataLines = maybeHeader ? lines.slice(1) : lines;
      const rows: Array<any> = [];
      for (const line of dataLines) {
        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < 3) {
          throw new Error(
            "Each row must have at least 3 columns: studentNumber,name,email[,year][,phone]"
          );
        }
        const row = {
          studentNumber: cols[0],
          name: cols[1],
          email: cols[2],
          year: cols[3] || "4",
          phone: cols[4] || "",
        };
        // Basic validation
        if (!/^\d{2}-[A-Z]{2}-\d{4}$/.test(row.studentNumber)) {
          throw new Error(`Invalid student number: ${row.studentNumber}`);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          throw new Error(`Invalid email: ${row.email}`);
        }
        rows.push(row);
      }
      setBulkParsed(rows);
      toast.success(`Parsed ${rows.length} rows`);
    } catch (err: any) {
      setBulkParsed([]);
      setBulkErrors(err.message || "Failed to parse CSV");
    }
  };

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
      status: "active",
      emailSent: false,
    });
    console.log("Add student modal opened - cleared all validation errors");
  };

  const clearValidationError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Also clear general create error when user starts typing
    if (createError) {
      setCreateError(null);
    }
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    console.log("Form validation starting...");
    if (!validateForm()) {
      console.log("Form validation failed:", fieldErrors);
      return;
    }
    console.log("Form validation passed");

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

      console.log("Starting student creation process with data:", {
        studentNumber: newStudent.studentNumber,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        program: newStudent.program,
        year: newStudent.year,
      });

      // Create the student using the instructor service
      const result = await instructorService.createStudent({
        studentNumber: newStudent.studentNumber,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        program: newStudent.program,
        year: newStudent.year,
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
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Handle specific error messages
      let errorMessage = "Failed to create student";
      if (error.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      console.log("Displaying error message:", errorMessage);
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
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
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
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>

        {/* Search/Filter Skeleton */}
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="h-12 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"></div>
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm md:text-base">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Student Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Track progress and review assigned students
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleAddStudent}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Student</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Bulk Add</span>
              <span className="sm:hidden">Bulk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
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
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
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
                Warning
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {students.filter((s) => s.status === "warning").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
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
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
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
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Stacked View */}
      <div className="md:hidden space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {students.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {students.filter((s) => s.status === "active").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Warning
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {students.filter((s) => s.status === "warning").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                At Risk
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {students.filter((s) => s.status === "at_risk").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <X className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {students.filter((s) => s.status === "completed").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[140px]"
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

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
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
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
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
                            width: `${(student.hoursCompleted / student.requiredHours) *
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
                          setSelectedStudent(student);
                          setShowStudentModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "No Students Found"
                : "No Students Assigned"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto px-4">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "Try adjusting your search criteria or filters to find students."
                : "You don't have any students assigned to you yet. Click the 'Add Student' button to create your first student profile."}
            </p>
            {!searchQuery &&
              filterStatus === "all" &&
              filterCompany === "all" && (
                <button
                  onClick={handleAddStudent}
                  className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Your First Student
                </button>
              )}
          </div>
        )}
      </div>

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="lg:hidden space-y-3">
        {filteredStudents.map((student) => {
          const attendancePercent = 0; // You may need to calculate this from student data
          const hoursProgress = `${student.hoursCompleted}/${student.requiredHours}`;
          const performanceRating = 3.5; // You may need to get this from student data

          return (
            <div
              key={student.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {student.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status === "active" ? "ACTIVE" : student.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatStudentId(student.studentId)} • {student.program.split(" ")[0] === "BS" ? "BS" : student.program.split(" ")[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {student.program}
                    </p>
                    <div className="flex items-center mt-1">
                      <Building2 className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {student.company}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics - Stacked Rectangles */}
              <div className="space-y-2 mb-3">
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Attendance</p>
                  <p className="text-base font-bold text-blue-600 dark:text-blue-400">{attendancePercent}%</p>
                </div>
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Hours Progress</p>
                  <p className="text-base font-bold text-green-600 dark:text-green-400">{hoursProgress}</p>
                </div>
                <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Performance</p>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-base font-bold text-orange-600 dark:text-orange-400">{performanceRating}</p>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className={`w-2 h-2 rounded ${star <= Math.floor(performanceRating)
                              ? "bg-orange-500"
                              : star === Math.ceil(performanceRating) && performanceRating % 1 !== 0
                                ? "bg-orange-300"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Hours Progress</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {Math.round((student.hoursCompleted / student.requiredHours) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(student.hoursCompleted / student.requiredHours) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last activity: {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setStudentToDelete(student);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowStudentModal(true);
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "No Students Found"
                : "No Students Assigned"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterStatus !== "all" || filterCompany !== "all"
                ? "Try adjusting your search criteria or filters."
                : "Click 'Add Student' to create your first student profile."}
            </p>
            {!searchQuery &&
              filterStatus === "all" &&
              filterCompany === "all" && (
                <button
                  onClick={handleAddStudent}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-xs font-medium"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add Your First Student
                </button>
              )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ margin: "0" }}
        >
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
                  onChange={(e) => {
                    setNewStudent({
                      ...newStudent,
                      studentNumber: e.target.value,
                    });
                    clearValidationError("studentNumber");
                  }}
                  placeholder="22-UR-0592"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${fieldErrors.studentNumber
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
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, name: e.target.value });
                    clearValidationError("name");
                  }}
                  placeholder="Juan Dela Cruz"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${fieldErrors.name
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
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, email: e.target.value });
                    clearValidationError("email");
                  }}
                  placeholder="juan.delacruz@email.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${fieldErrors.email
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
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, phone: e.target.value });
                    clearValidationError("phone");
                  }}
                  placeholder="+63 912 345 6789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${fieldErrors.phone
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
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, year: e.target.value });
                    clearValidationError("year");
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${fieldErrors.year
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
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

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Add Students</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Paste CSV with headers: <span className="font-semibold">studentNumber,name,email,year,phone</span></p>
              <pre className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg overflow-x-auto scrollbar-slim">
                22-UR-0592,Juan Dela Cruz,juan@example.com,4,+63 912 345 6789
                22-UR-0123,Ana Rodriguez,ana@example.com,3,+63 987 654 3210</pre>
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBulkFileLoading(true);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setBulkFileLoading(false);
                        parseCsvText(String(reader.result || ""));
                      };
                      reader.onerror = () => {
                        setBulkFileLoading(false);
                        setBulkErrors("Failed to read file");
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Upload CSV</span>
                </label>
                {bulkFileLoading && (
                  <span className="text-xs text-gray-500">Reading file…</span>
                )}
              </div>
            </div>

            {bulkErrors && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {bulkErrors}
              </div>
            )}

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste your CSV rows here…"
              className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white scrollbar-slim"
            />

            {/* Preview */}
            {bulkParsed.length > 0 && (
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Student No.</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bulkParsed.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2">{r.studentNumber}</td>
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2">{r.email}</td>
                        <td className="px-3 py-2">{r.year}</td>
                        <td className="px-3 py-2">{r.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => parseCsvText(bulkText)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Preview
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (bulkParsed.length === 0) {
                      setBulkErrors("Please paste CSV and click Preview first.");
                      return;
                    }
                    try {
                      setIsBulkCreating(true);
                      const result = await instructorService.bulkCreateStudents(bulkParsed);
                      toast.success(`Added ${result.success} students`);
                      if (result.failed > 0) {
                        toast.error(`${result.failed} failed. Check console for details.`);
                        console.table(result.errors);
                      }
                      setShowBulkModal(false);
                      setBulkParsed([]);
                      setBulkText("");
                      await loadStudentsData();
                    } catch (e: any) {
                      toast.error(e?.message || "Bulk add failed");
                    } finally {
                      setIsBulkCreating(false);
                    }
                  }}
                  disabled={isBulkCreating}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkCreating ? "Adding..." : "Add Students"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
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

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowStudentModal(false)}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            margin: "0",
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              margin: "20px",
            }}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Student Details
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Student Header */}
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2)}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${selectedStudent.status === "completed"
                        ? "bg-green-500"
                        : selectedStudent.status === "at_risk"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formatStudentId(selectedStudent.studentId)} • {selectedStudent.program}
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedStudent.company}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        selectedStudent.status
                      )}`}
                    >
                      {selectedStudent.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Attendance Rate
                    </h5>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {selectedStudent.attendanceRate || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${(selectedStudent.attendanceRate || 0) >= 90
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : (selectedStudent.attendanceRate || 0) >= 75
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : "bg-gradient-to-r from-red-500 to-red-600"
                          }`}
                        style={{ width: `${selectedStudent.attendanceRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Hours Completed
                    </h5>
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {selectedStudent.hoursCompleted}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        / {selectedStudent.requiredHours}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (selectedStudent.hoursCompleted /
                              selectedStudent.requiredHours) *
                            100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      Performance
                    </h5>
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {selectedStudent.lastEvaluation
                          ? selectedStudent.lastEvaluation.toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Award
                          key={star}
                          className={`w-3 h-3 ${selectedStudent.lastEvaluation &&
                              star <= Math.round(selectedStudent.lastEvaluation)
                              ? "text-purple-600 dark:text-purple-300 fill-current"
                              : "text-purple-200 dark:text-purple-900"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Academic Information
                  </h6>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Student ID:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatStudentId(selectedStudent.studentId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Program:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.program}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Year:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.year}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Internship Details
                  </h6>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Company:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.company}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Supervisor:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.supervisor}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Start Date:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.startDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        End Date:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.endDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partnership Communication */}
              {selectedStudent && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <PartnershipMessageThread
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.name}
                    currentUserRole="INSTRUCTOR"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Close
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
