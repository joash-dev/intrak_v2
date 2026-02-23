import React, { useState, useEffect, useMemo } from "react";
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
  Download,
  Edit3,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  Send,
  BarChart3,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  instructorService,
  type InstructorStudent,
  type TimelineEntry,
} from "../../services/instructorService";
import PartnershipMessageThread from "../../components/PartnershipMessageThread";
import toast from "react-hot-toast";
import { devLog } from "../../utils/devLog";
import { formatStudentId } from "../../utils/formatStudentId";

// Use InstructorStudent type from the service
type Student = InstructorStudent;

// Sort configuration type
type SortField = "name" | "program" | "company" | "status" | "progress";
type SortDirection = "asc" | "desc";

// Helper: status dot color
const getStatusDotColor = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    warning: "bg-yellow-500",
    at_risk: "bg-red-500",
    inactive: "bg-gray-400",
  };
  return map[status] || "bg-gray-400";
};

const ITEMS_PER_PAGE = 10;

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

  // Edit student state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    year: "",
    startDate: "",
    endDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Timeline & Reminder state
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  // Monitoring charts state (merged from Student Monitoring tab)
  const [detailLoading, setDetailLoading] = useState(false);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<{ week: string; rate: number }[]>([]);
  const [weeklyHoursData, setWeeklyHoursData] = useState<{ label: string; hours: number }[]>([]);
  const [evaluationHistory, setEvaluationHistory] = useState<{ date: string; rating: number; evaluator: string }[]>([]);

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

  // Check for openStudentId from notification click
  useEffect(() => {
    const openStudentId = sessionStorage.getItem('openStudentId');
    if (openStudentId && students.length > 0) {
      const studentToOpen = students.find(s => s.id === openStudentId);
      if (studentToOpen) {
        setSelectedStudent(studentToOpen);
        setShowStudentModal(true);
        loadTimeline(studentToOpen.id);
        loadMonitoringData(studentToOpen.id);
        setShowReminderInput(false);
        sessionStorage.removeItem('openStudentId');
      }
    }
  }, [students]);

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
    devLog.log("Add student modal opened - cleared all validation errors");
  };

  const clearValidationError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
    if (!newStudent.name.trim()) errors.name = "Full name is required";
    if (!newStudent.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      errors.email = "Invalid email format";
    }
    if (!newStudent.phone.trim()) errors.phone = "Phone number is required";
    if (!newStudent.year.trim()) errors.year = "Year level is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    devLog.log("Form validation starting...");
    if (!validateForm()) {
      devLog.log("Form validation failed:", fieldErrors);
      return;
    }
    if (isCreating) return;

    try {
      setIsCreating(true);
      setCreateError(null);
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
      let errorMessage = "Failed to create student";
      if (error.message) errorMessage = error.message;
      else if (error?.response?.data?.message) errorMessage = error.response.data.message;
      setCreateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete || deleteConfirmationText !== "DELETE") return;
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

  // Edit student handlers
  const handleOpenEdit = (student: Student) => {
    setEditStudent(student);
    setEditData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      year: String(student.year || ""),
      startDate: student.startDate ? student.startDate.split('T')[0] : "",
      endDate: student.endDate ? student.endDate.split('T')[0] : "",
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    if (!editData.name.trim()) errors.name = "Full name is required";
    if (!editData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.email = "Invalid email format";
    }
    if (!editData.year.trim()) errors.year = "Year level is required";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editStudent || !validateEditForm()) return;
    if (isEditing) return;

    try {
      setIsEditing(true);
      const payload: any = {
        year: parseInt(editData.year),
      };
      if (editData.startDate) payload.startDate = editData.startDate;
      if (editData.endDate) payload.endDate = editData.endDate;

      const success = await instructorService.updateStudent(editStudent.id, payload);
      if (success) {
        toast.success("Student updated successfully!");
        setShowEditModal(false);
        setEditStudent(null);
        await loadStudentsData();
      } else {
        toast.error("Failed to update student");
      }
    } catch (error: any) {
      console.error("Error updating student:", error);
      toast.error(error?.message || "Failed to update student");
    } finally {
      setIsEditing(false);
    }
  };

  // Load timeline when student details modal opens
  const loadTimeline = async (studentId: string) => {
    setTimelineLoading(true);
    try {
      const data = await instructorService.getStudentTimeline(studentId);
      setTimeline(data);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Load monitoring chart data when student details modal opens
  const loadMonitoringData = async (studentId: string) => {
    setDetailLoading(true);
    try {
      // Compute weekly attendance and hours from logs (last 4 weeks)
      const logs: any[] = await instructorService.getStudentAttendance(studentId);
      const verified = (logs || []).filter((l) => l && l.verified);

      const startOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        date.setDate(date.getDate() + diff);
        date.setHours(0, 0, 0, 0);
        return date;
      };

      const ranges: { start: Date; end: Date; label: string }[] = [];
      const now = new Date();
      const thisMon = startOfWeek(now);
      for (let i = 3; i >= 0; i--) {
        const start = new Date(thisMon);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const monthShort = start.toLocaleString(undefined, { month: "short" });
        const weekInMonth = Math.ceil(start.getDate() / 7);
        ranges.push({ start, end, label: `${monthShort} W${weekInMonth}` });
      }

      const rates: { week: string; rate: number }[] = [];
      const hours: { label: string; hours: number }[] = [];
      for (const r of ranges) {
        const daySet = new Set<string>();
        let minutes = 0;
        verified.forEach((log: any) => {
          const dt = new Date(log.date || log.timeIn || log.createdAt);
          if (dt >= r.start && dt < r.end) {
            const dow = dt.getDay();
            if (dow >= 1 && dow <= 5) {
              daySet.add(dt.toISOString().split("T")[0]);
            }
            minutes += Number(log.durationMinutes || 0);
          }
        });
        rates.push({ week: r.label, rate: Math.min(100, Math.round((daySet.size / 5) * 100)) });
        hours.push({ label: r.label, hours: Math.round((minutes / 60) * 10) / 10 });
      }
      setWeeklyAttendanceData(rates);
      setWeeklyHoursData(hours);

      // Evaluations
      const evals = await instructorService.getStudentEvaluationHistory(studentId);
      const mappedEvals = (evals || []).map((e: any) => ({
        date: new Date(e.createdAt || e.date || Date.now()).toLocaleDateString(),
        rating: e.rating || 0,
        evaluator: e.evaluator?.name || e.evaluatorRole || "Evaluator",
      }));
      setEvaluationHistory(mappedEvals.slice(0, 5));
    } catch {
      setWeeklyAttendanceData([]);
      setWeeklyHoursData([]);
      setEvaluationHistory([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Send attendance reminder
  const handleSendReminder = async (student: Student) => {
    if (sendingReminder) return;
    setSendingReminder(true);
    try {
      const success = await instructorService.sendAttendanceReminder(
        student.id,
        reminderMessage.trim() || undefined
      );
      if (success) {
        toast.success(`Reminder sent to ${student.name}`);
        setShowReminderInput(false);
        setReminderMessage("");
      } else {
        toast.error("Failed to send reminder");
      }
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export");
      return;
    }
    const headers = ["Student ID", "Name", "Email", "Program", "Year", "Company", "Supervisor", "Status", "Hours Completed", "Required Hours", "Attendance Rate"];
    const rows = filteredStudents.map((s) => [
      formatStudentId(s.studentId),
      s.name,
      s.email,
      s.program,
      s.year,
      s.company,
      s.supervisor,
      s.status.replace("_", " "),
      s.hoursCompleted,
      s.requiredHours,
      `${s.attendanceRate}%`,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${filteredStudents.length} students`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      at_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors.active;
  };

  // Filtering
  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || student.status === filterStatus;
      const matchesCompany = filterCompany === "all" || student.company === filterCompany;
    return matchesSearch && matchesStatus && matchesCompany;
  });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "program":
          cmp = a.program.localeCompare(b.program) || a.year - b.year;
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "progress":
          cmp = (a.hoursCompleted / a.requiredHours) - (b.hoursCompleted / b.requiredHours);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [students, searchQuery, filterStatus, filterCompany, sortField, sortDirection]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterCompany]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueCompanies = Array.from(
    new Set(students.map((student) => student.company))
  );

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    warning: students.filter((s) => s.status === "warning").length,
    atRisk: students.filter((s) => s.status === "at_risk").length,
    completed: students.filter((s) => s.status === "completed").length,
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDirection === "asc"
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm overflow-hidden">
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
    <div className="space-y-6 text-sm md:text-base min-h-screen dark:bg-[#19191c]">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Students
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Manage, monitor, and track student progress
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleAddStudent}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

      {/* Stats Cards - Single Responsive Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Total Students", value: stats.total, icon: Users, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-300" },
          { label: "Active", value: stats.active, icon: CheckCircle, bg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-300" },
          { label: "Warning", value: stats.warning, icon: AlertTriangle, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-300" },
          { label: "At Risk", value: stats.atRisk, icon: X, bg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-300" },
          { label: "Completed", value: stats.completed, icon: Award, bg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-300" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className={`p-2 ${stat.bg} rounded-lg w-fit mb-2`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {stat.label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stat.value}
              </p>
            </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, ID, email or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[140px]"
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
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[140px]"
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

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-[#212124] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  { field: "name" as SortField, label: "Student" },
                  { field: "program" as SortField, label: "Program" },
                  { field: "company" as SortField, label: "Company" },
                  { field: "status" as SortField, label: "Status" },
                  { field: "progress" as SortField, label: "Progress" },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.label}</span>
                      <SortIcon field={col.field} />
                    </div>
                </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={student.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={student.profilePhoto ? 'hidden' : ''}>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </span>
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
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}
                    >
                      {student.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (student.hoursCompleted / student.requiredHours) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
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
                          loadTimeline(student.id);
                          loadMonitoringData(student.id);
                          setShowReminderInput(false);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Edit Student"
                      >
                        <Edit3 className="w-4 h-4" />
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

        {/* Pagination */}
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
            {!searchQuery && filterStatus === "all" && filterCompany === "all" && (
                <button
                  onClick={handleAddStudent}
                  className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Your First Student
                </button>
              )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {student.profilePhoto ? (
                        <img
                          src={student.profilePhoto}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={student.profilePhoto ? 'hidden' : ''}>
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)}
                      </span>
                    </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusDotColor(student.status)} rounded-full border-2 border-white dark:border-gray-800`}></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {student.name}
                      </h3>
                      <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(student.status)}`}
                      >
                      {student.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatStudentId(student.studentId)} • Year {student.year}
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

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Attendance</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{student.attendanceRate}%</p>
                </div>
              <div className="border border-green-200 dark:border-green-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Hours</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{student.hoursCompleted}/{student.requiredHours}</p>
                </div>
              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-2.5 text-center">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Rating</p>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {student.lastEvaluation ? student.lastEvaluation.toFixed(1) : "N/A"}
                </p>
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
                    width: `${Math.min(100, (student.hoursCompleted / student.requiredHours) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 ${getStatusDotColor(student.status)} rounded-full`}></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                  {student.lastActivity || "No recent activity"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenEdit(student)}
                  className="p-1.5 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Edit Student"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
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
                    loadTimeline(student.id);
                    loadMonitoringData(student.id);
                    setShowReminderInput(false);
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                  <span>View</span>
                  </button>
                </div>
              </div>
            </div>
        ))}

        {/* Mobile Pagination */}
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between py-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="bg-white dark:bg-[#212124] rounded-xl p-8 text-center shadow-sm border border-gray-200 dark:border-gray-700">
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
            {!searchQuery && filterStatus === "all" && filterCompany === "all" && (
                <button
                  onClick={handleAddStudent}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-xs font-medium"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add Your First Student
                </button>
              )}
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
          style={{ margin: "0" }}
        >
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Number *</label>
                <input
                  type="text"
                  value={newStudent.studentNumber}
                  onChange={(e) => { setNewStudent({ ...newStudent, studentNumber: e.target.value }); clearValidationError("studentNumber"); }}
                  placeholder="22-UR-0592"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${fieldErrors.studentNumber ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {fieldErrors.studentNumber && <p className="text-xs text-red-500 mt-1">{fieldErrors.studentNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => { setNewStudent({ ...newStudent, name: e.target.value }); clearValidationError("name"); }}
                  placeholder="Juan Dela Cruz"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${fieldErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => { setNewStudent({ ...newStudent, email: e.target.value }); clearValidationError("email"); }}
                  placeholder="juan.delacruz@email.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${fieldErrors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => { setNewStudent({ ...newStudent, phone: e.target.value }); clearValidationError("phone"); }}
                  placeholder="+63 912 345 6789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${fieldErrors.phone ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program</label>
                <input
                  type="text"
                  value={newStudent.program}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year Level *</label>
                <select
                  value={newStudent.year}
                  onChange={(e) => { setNewStudent({ ...newStudent, year: e.target.value }); clearValidationError("year"); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${fieldErrors.year ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {fieldErrors.year && <p className="text-xs text-red-500 mt-1">{fieldErrors.year}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreateStudent}
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating...</span></>
                ) : (
                  <><UserPlus className="w-4 h-4" /><span>Create Student</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {createdStudentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Student Created Successfully!</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Name:</strong> {createdStudentInfo.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Student Number:</strong> {createdStudentInfo.studentNumber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Email:</strong> {createdStudentInfo.email}</p>
                {createdStudentInfo.emailSent && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ Welcome email sent to student</p>
                )}
              </div>
              <button onClick={() => setCreatedStudentInfo(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                <input
                  type="text"
                  value={formatStudentId(editStudent.studentId)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">Name changes require admin access</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Level *</label>
                <select
                  value={editData.year}
                  onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white ${editErrors.year ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {editErrors.year && <p className="text-xs text-red-500 mt-1">{editErrors.year}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                  />
                </div>
              </div>

              {/* Read-only internship info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Internship Info</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Company:</span>
                  <span className="text-gray-900 dark:text-white">{editStudent.company}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Supervisor:</span>
                  <span className="text-gray-900 dark:text-white">{editStudent.supervisor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(editStudent.status)}`}>
                    {editStudent.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isEditing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isEditing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><Edit3 className="w-4 h-4" /><span>Save Changes</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
                      reader.onload = () => { setBulkFileLoading(false); parseCsvText(String(reader.result || "")); };
                      reader.onerror = () => { setBulkFileLoading(false); setBulkErrors("Failed to read file"); };
                      reader.readAsText(file);
                    }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Upload CSV</span>
                </label>
                {bulkFileLoading && <span className="text-xs text-gray-500">Reading file…</span>}
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
              className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white scrollbar-slim"
            />

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
              <button onClick={() => parseCsvText(bulkText)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Preview
              </button>
              <div className="space-x-3">
                <button onClick={() => setShowBulkModal(false)} className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (bulkParsed.length === 0) { setBulkErrors("Please paste CSV and click Preview first."); return; }
                    try {
                      setIsBulkCreating(true);
                      const result = await instructorService.bulkCreateStudents(bulkParsed);
                      toast.success(`Added ${result.success} students`);
                      if (result.failed > 0) { toast.error(`${result.failed} failed. Check console for details.`); console.table(result.errors); }
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Student</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This action cannot be undone.
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
                  onClick={() => { setShowDeleteModal(false); setStudentToDelete(null); setDeleteConfirmationText(""); }}
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
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
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
            className="bg-white dark:bg-[#212124] rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", margin: "20px" }}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Details</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Student Header */}
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden">
                    {selectedStudent.profilePhoto ? (
                      <img src={selectedStudent.profilePhoto} alt={selectedStudent.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <span className={selectedStudent.profilePhoto ? 'hidden' : ''}>
                      {selectedStudent.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusDotColor(selectedStudent.status)}`}></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formatStudentId(selectedStudent.studentId)} • {selectedStudent.program}
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{selectedStudent.company}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedStudent.status)}`}>
                      {selectedStudent.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Attendance Rate</h5>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedStudent.attendanceRate || 0}%</span>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${(selectedStudent.attendanceRate || 0) >= 90 ? "bg-gradient-to-r from-green-500 to-green-600" : (selectedStudent.attendanceRate || 0) >= 75 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : "bg-gradient-to-r from-red-500 to-red-600"}`}
                        style={{ width: `${selectedStudent.attendanceRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-green-700 dark:text-green-300">Hours Completed</h5>
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-900 dark:text-green-100">{selectedStudent.hoursCompleted}</span>
                      <span className="text-sm text-green-600 dark:text-green-400">/ {selectedStudent.requiredHours}</span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{ width: `${Math.min((selectedStudent.hoursCompleted / selectedStudent.requiredHours) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300">Performance</h5>
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="space-y-2">
                      <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {selectedStudent.lastEvaluation ? selectedStudent.lastEvaluation.toFixed(1) : "N/A"}
                      </span>
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Award
                          key={star}
                          className={`w-3 h-3 ${selectedStudent.lastEvaluation && star <= Math.round(selectedStudent.lastEvaluation) ? "text-purple-600 dark:text-purple-300 fill-current" : "text-purple-200 dark:text-purple-900"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Charts (from Monitoring) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weekly Attendance */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Attendance
                  </h4>
                  {detailLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      ))}
                    </div>
                  ) : weeklyAttendanceData.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No attendance data</p>
                  ) : (
                    <div className="space-y-3">
                      {weeklyAttendanceData.map((week, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{week.week}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{week.rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${week.rate}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weekly Hours */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Hours
                  </h4>
                  {detailLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      ))}
                    </div>
                  ) : weeklyHoursData.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hours data</p>
                  ) : (
                    <div className="space-y-3">
                      {weeklyHoursData.map((week, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{week.label}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{week.hours} hrs</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (week.hours / Math.max(1, Math.max(...weeklyHoursData.map(w => w.hours)))) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Evaluation History */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Evaluation History
                </h4>
                {detailLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading evaluations...</div>
                ) : evaluationHistory.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No evaluation history</div>
                ) : (
                  <div className="space-y-2">
                    {evaluationHistory.map((evaluation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-[#212124] rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Rating: {evaluation.rating}</p>
                            <p className="text-xs text-gray-500">{evaluation.evaluator}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{evaluation.date}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Information</h6>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Student ID:</span><span className="font-medium text-gray-900 dark:text-white">{formatStudentId(selectedStudent.studentId)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Program:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.program}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Year:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.year}</span></div>
                    </div>
                    </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Internship Details</h6>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Company:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.company}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Supervisor:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.supervisor}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Start Date:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.startDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">End Date:</span><span className="font-medium text-gray-900 dark:text-white">{selectedStudent.endDate}</span></div>
                    </div>
                  </div>
                </div>

              {/* Send Reminder Section */}
              {selectedStudent && (selectedStudent.status === 'warning' || selectedStudent.status === 'at_risk') && (
                <div className={`rounded-xl p-4 border ${selectedStudent.status === 'at_risk' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Bell className={`w-4 h-4 ${selectedStudent.status === 'at_risk' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                      <h6 className={`text-sm font-semibold ${selectedStudent.status === 'at_risk' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {selectedStudent.status === 'at_risk' ? 'Student At Risk' : 'Attendance Warning'}
                        {selectedStudent.attendanceGapDays ? ` — ${selectedStudent.attendanceGapDays} days without attendance` : ''}
                  </h6>
                    </div>
                    {!showReminderInput && (
                      <button
                        onClick={() => setShowReminderInput(true)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors ${
                          selectedStudent.status === 'at_risk'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Reminder</span>
                      </button>
                    )}
                  </div>
                  {showReminderInput && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        placeholder="Optional custom message (leave blank for default reminder)..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] dark:text-white resize-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => { setShowReminderInput(false); setReminderMessage(""); }}
                          className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReminder(selectedStudent)}
                          disabled={sendingReminder}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          {sendingReminder ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          <span>{sendingReminder ? 'Sending...' : 'Send'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Timeline */}
              <div className="bg-white dark:bg-[#212124] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h6 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Recent Activity</span>
                </h6>
                {timelineLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start space-x-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                    </div>
                    ))}
                    </div>
                ) : timeline.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity found</p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {timeline.slice(0, 15).map((entry) => (
                      <div key={entry.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.type === 'attendance' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          entry.type === 'document' ? 'bg-green-100 dark:bg-green-900/30' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {entry.type === 'attendance' ? (
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          ) : entry.type === 'document' ? (
                            <FileText className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Activity className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{entry.title}</p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                              {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                          {entry.description && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{entry.description}</p>
                          )}
                  </div>
                </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partnership Communication */}
              {selectedStudent && (
                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
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
                  onClick={() => { setShowStudentModal(false); handleOpenEdit(selectedStudent); }}
                  className="px-6 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
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
