import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";
import {
  coordinatorService,
  type CoordinatorStudent,
} from "../../services/coordinatorService";
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

  // Default fallback
  return studentNumber || "22-UR-0592";
};

// Use CoordinatorStudent type from the service
type Student = CoordinatorStudent;

const CoordinatorStudentsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [userRole, setUserRole] = useState<string>("COORDINATOR");
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
    program: "",
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

    // Get user role from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || "COORDINATOR");
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserRole("COORDINATOR");
      }
    }
  }, []);

  // Manage body class when modals are open
  useEffect(() => {
    const isModalOpen =
      showAddModal ||
      showDetailsModal ||
      showEditModal ||
      showPasswordModal ||
      showDeleteModal;

    if (isModalOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    };
  }, [
    showAddModal,
    showDetailsModal,
    showEditModal,
    showPasswordModal,
    showDeleteModal,
  ]);

  const loadStudentsData = async () => {
    try {
      setLoading(true);
      const studentsData = await coordinatorService.getAllStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students data");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    completed: students.filter((s) => s.status === "completed").length,
    suspended: students.filter((s) => s.status === "inactive").length,
    pending: students.filter((s) => s.status === "pending").length,
  };

  const companies = [...new Set(students.map((s) => s.company))];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      inactive: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <Award className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleDelete = (student: Student) => {
    // Check if user has permission to delete
    if (userRole !== "ADMIN") {
      toast.error("Only administrators can delete students");
      return;
    }

    setStudentToDelete(student);
    setDeleteConfirmationText("");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    const expectedText = `DELETE ${studentToDelete.name.toUpperCase()}`;

    if (deleteConfirmationText !== expectedText) {
      toast.error(`Please type exactly: ${expectedText}`);
      return;
    }

    try {
      await coordinatorService.deleteStudent(studentToDelete.id);

      // Remove student from local state
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));

      toast.success(`Student ${studentToDelete.name} deleted successfully!`);

      // Close modal and reset state
      setShowDeleteModal(false);
      setStudentToDelete(null);
      setDeleteConfirmationText("");
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "Failed to delete student");
    }
  };

  const handleAddStudent = async () => {
    // Clear previous errors
    setCreateError(null);
    setFieldErrors({});

    // Validate required fields
    const requiredFields = {
      studentNumber: newStudent.studentNumber,
      name: newStudent.name,
      email: newStudent.email,
      program: newStudent.program,
      startDate: newStudent.startDate,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field, _]) => field);

    if (missingFields.length > 0) {
      const errorMessage = `Please fill in the following required fields: ${missingFields.join(
        ", "
      )}`;
      setCreateError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudent.email)) {
      setFieldErrors({ email: "Please enter a valid email address" });
      setCreateError("Invalid email format");
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate student number format (should be like 22-UR-0592)
    const studentNumberRegex = /^\d{2}-[A-Z]{2}-\d{4}$/;
    if (!studentNumberRegex.test(newStudent.studentNumber)) {
      setFieldErrors({
        studentNumber:
          "Student number should be in format: YY-AA-NNNN (e.g., 22-UR-0592)",
      });
      setCreateError("Invalid student number format");
      toast.error("Student number should be in format: YY-AA-NNNN");
      return;
    }

    try {
      setIsCreating(true);

      // Create student using the API
      const result = await coordinatorService.createStudent({
        name: newStudent.name,
        email: newStudent.email,
        studentNumber: newStudent.studentNumber,
        program: newStudent.program,
        year: parseInt(String(newStudent.year).replace(/\D/g, "")) || 4,
        company: newStudent.company,
        supervisor: newStudent.supervisor,
        startDate: newStudent.startDate,
        endDate: newStudent.endDate,
        totalHours: 500,
      });

      if (result) {
        const { student: createdStudent, emailSent } = result;

        // Add the new student to the local state
        setStudents((prev) => [createdStudent, ...prev]);

        // Show success message
        if (emailSent) {
          toast.success(
            `Student ${createdStudent.name} added successfully! Welcome email sent.`
          );
        } else {
          toast.success(
            `Student ${createdStudent.name} added successfully! (Email could not be sent)`
          );
        }

        // Set student info for email confirmation modal
        setCreatedStudentInfo({
          name: createdStudent.name,
          email: createdStudent.email,
          studentNumber: createdStudent.studentNumber,
          emailSent: emailSent,
        });

        // Show email confirmation modal
        setShowPasswordModal(true);

        // Reset form
        setNewStudent({
          studentNumber: "",
          name: "",
          email: "",
          phone: "",
          program: "",
          year: "",
          company: "",
          companyAddress: "",
          supervisor: "",
          supervisorEmail: "",
          startDate: "",
          endDate: "",
        });

        setShowAddModal(false);
      }
    } catch (error: any) {
      console.error("Error creating student:", error);

      // Set error state for display in UI
      let errorMessage = "Failed to create student. Please try again.";
      let fieldError: Record<string, string> = {};

      if (error.message) {
        errorMessage = error.message;

        // Check for specific field errors
        if (
          error.message.includes("email") &&
          error.message.includes("already exists")
        ) {
          fieldError.email = "This email address is already registered";
        } else if (
          error.message.includes("student number") &&
          error.message.includes("already exists")
        ) {
          fieldError.studentNumber =
            "This student number is already registered";
        } else if (error.message.includes("Invalid user ID")) {
          errorMessage =
            "There was an issue with the user account. Please try again.";
        }
      }

      setCreateError(errorMessage);
      setFieldErrors(fieldError);

      // Show toast notification
      toast.error(errorMessage);

      // Show additional details in console for debugging
      console.error("Full error details:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    let processedValue = value;

    // Auto-format student number as user types (conservative approach)
    if (field === "studentNumber" && typeof value === "string") {
      // Only clean invalid characters, don't force formatting
      processedValue = value.replace(/[^a-zA-Z0-9-]/g, "");
    }

    setNewStudent((prev) => ({ ...prev, [field]: processedValue }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear general error when user starts typing
    if (createError) {
      setCreateError(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || student.status === filterStatus;
    const matchesCompany =
      filterCompany === "all" || student.company === filterCompany;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading students data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage student information and internship assignments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.active}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Inactive
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.suspended}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Program
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Company
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Progress
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {student.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatStudentId(student.studentNumber)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {student.program}
                    </p>
                    <p className="text-xs text-gray-500">{student.year}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {student.company}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {getStatusIcon(student.status)}
                      <span>{student.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.hoursCompleted || 0}/
                        {student.requiredHours || 400}
                      </span>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              ((student.hoursCompleted || 0) /
                                (student.requiredHours || 400)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {userRole === "ADMIN" && (
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No students found
            </p>
          </div>
        )}
      </div>

      {showDetailsModal && selectedStudent && (
        <div
          className="modal-overlay-fixed flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailsModal(false);
              setSelectedStudent(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                  {selectedStudent.avatar}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatStudentId(selectedStudent.studentNumber)}
                  </p>
                  <span
                    className={`inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium mt-2 ${getStatusColor(
                      selectedStudent.status
                    )}`}
                  >
                    {getStatusIcon(selectedStudent.status)}
                    <span>{selectedStudent.status}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </p>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedStudent.email}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Phone
                  </p>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedStudent.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Overall Evaluation
                    </p>
                    <div className="flex items-center space-x-2">
                      <Award className="w-6 h-6 text-yellow-500" />
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedStudent.evaluation}
                      </span>
                      <span className="text-gray-500">/ 5.0</span>
                    </div>
                  </div>
                  <TrendingUp className="w-12 h-12 text-yellow-500 opacity-50" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Student
              </h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center py-12">
              <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Edit functionality coming soon...
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="modal-overlay-fixed flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setCreateError(null);
              setFieldErrors({});
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New Student
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCreateError(null);
                  setFieldErrors({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Error Display */}
            {createError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 dark:text-red-200 font-medium mb-1">
                      Error Creating Student
                    </h4>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {createError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Indicator */}
            {!createError &&
              !Object.keys(fieldErrors).length &&
              newStudent.studentNumber &&
              newStudent.name &&
              newStudent.email &&
              newStudent.program &&
              newStudent.startDate && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-green-800 dark:text-green-200 font-medium mb-1">
                        Form Ready
                      </h4>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        All required fields are filled. You can now create the
                        student.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Student Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudent.studentNumber}
                      onChange={(e) =>
                        handleInputChange("studentNumber", e.target.value)
                      }
                      placeholder="e.g., 22-UR-0592"
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${
                        fieldErrors.studentNumber
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                      }`}
                    />
                    {fieldErrors.studentNumber ? (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {fieldErrors.studentNumber}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Format: YY-AA-NNNN (e.g., 22-UR-0592)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., Juan Dela Cruz"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="e.g., student@university.edu"
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${
                        fieldErrors.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-purple-500"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newStudent.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="e.g., +63 912 345 6789"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newStudent.program}
                      onChange={(e) =>
                        handleInputChange("program", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Program</option>
                      <option value="BS Computer Science">
                        BS Computer Science
                      </option>
                      <option value="BS Information Technology">
                        BS Information Technology
                      </option>
                      <option value="BS Computer Engineering">
                        BS Computer Engineering
                      </option>
                      <option value="BS Information Systems">
                        BS Information Systems
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year Level
                    </label>
                    <select
                      value={newStudent.year}
                      onChange={(e) =>
                        handleInputChange("year", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Internship Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudent.company}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                      placeholder="e.g., TechCorp Inc."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Address
                    </label>
                    <input
                      type="text"
                      value={newStudent.companyAddress}
                      onChange={(e) =>
                        handleInputChange("companyAddress", e.target.value)
                      }
                      placeholder="e.g., BGC, Taguig City"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor Name
                    </label>
                    <input
                      type="text"
                      value={newStudent.supervisor}
                      onChange={(e) =>
                        handleInputChange("supervisor", e.target.value)
                      }
                      placeholder="e.g., Engr. Juan Santos"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor Email
                    </label>
                    <input
                      type="email"
                      value={newStudent.supervisorEmail}
                      onChange={(e) =>
                        handleInputChange("supervisorEmail", e.target.value)
                      }
                      placeholder="e.g., supervisor@company.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newStudent.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newStudent.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Required Fields Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Note:</span> Fields marked
                  with <span className="text-red-500">*</span> are required.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={isCreating}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                  isCreating
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isCreating ? "Creating..." : "Add Student"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && createdStudentInfo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Student Account Created
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-300 font-medium">
                    Account Created Successfully!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Please provide the login credentials to the student securely.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student Name
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {createdStudentInfo.name}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-mono text-sm">
                      {createdStudentInfo.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student Number
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-mono text-sm">
                      {formatStudentId(createdStudentInfo.studentNumber)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Status
                  </label>
                  <div
                    className={`p-3 rounded-lg border ${
                      createdStudentInfo.emailSent
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {createdStudentInfo.emailSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="text-green-800 dark:text-green-300 font-medium text-sm">
                            Welcome email sent successfully
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          <p className="text-yellow-800 dark:text-yellow-300 font-medium text-sm">
                            Email could not be sent
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {createdStudentInfo.emailSent
                      ? "Student has received login credentials via email"
                      : "Please contact the student directly with their login credentials"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
                      Next Steps
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      {createdStudentInfo.emailSent
                        ? "The student has received their login credentials via email. They can now access the INTRAK system and should change their password after first login."
                        : "Since the email could not be sent, please contact the student directly through a secure channel to provide their login credentials."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCreatedStudentInfo(null);
                }}
                className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                Delete Student
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                  setDeleteConfirmationText("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-300 font-medium">
                    Warning: This action cannot be undone!
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400">
                  You are about to permanently delete this student and all their
                  data.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student to Delete
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {studentToDelete.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatStudentId(studentToDelete.studentNumber)} •{" "}
                      {studentToDelete.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type{" "}
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      DELETE {studentToDelete.name.toUpperCase()}
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder={`DELETE ${studentToDelete.name.toUpperCase()}`}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This action will permanently delete the student account and
                    all associated data.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                  setDeleteConfirmationText("");
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={
                  deleteConfirmationText !==
                  `DELETE ${studentToDelete.name.toUpperCase()}`
                }
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorStudentsTab;
