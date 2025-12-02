import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Building2,
    Award,
    Search,
    BarChart3,
    Activity,
    Bell,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    FileText,
    TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { coordinatorService } from "../../services/coordinatorService";
import { formatDateTime } from "../../services/localeService";
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

const CoordinatorOverview: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Optimized data fetching with caching
    const { data: students = [], loading: studentsLoading } = useOptimizedData(
        () => coordinatorService.getAllStudents(),
        [],
        { ttl: 5 * 60 * 1000 } // 5 minutes cache
    );

    const {
        data: stats = {
            totalStudents: 0,
            activeInterns: 0,
            pendingApprovals: 0,
            completedInternships: 0,
            attendanceRate: 0,
            documentsPending: 0,
            tasksCompleted: 0,
            averageRating: 0,
            trends: { students: 0, attendance: 0, documents: 0, ratings: 0 },
        },
        loading: statsLoading,
    } = useOptimizedData(
        () => coordinatorService.getDashboardStats(),
        [],
        { ttl: 5 * 60 * 1000 } // 5 minutes cache
    );

    const { data: activities, loading: activitiesLoading } = useOptimizedData(
        () => coordinatorService.getRecentActivities(),
        [],
        { ttl: 2 * 60 * 1000 } // 2 minutes cache
    );

    const { data: alerts, loading: alertsLoading } = useOptimizedData(
        () => coordinatorService.getAlerts(),
        [],
        { ttl: 1 * 60 * 1000 } // 1 minute cache
    );

    const loading =
        studentsLoading ||
        statsLoading ||
        activitiesLoading ||
        alertsLoading;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active:
                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            pending:
                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
            completed:
                "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            suspended: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        };
        return colors[status] || colors.active;
    };

    const getStatusLabel = (status: string) =>
        t(`dashboard.students.statusLabels.${status.toLowerCase()}`, {
            defaultValue: status,
        });

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "warning":
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case "error":
                return <XCircle className="w-5 h-5 text-red-600" />;
            case "success":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            default:
                return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "document":
                return <FileText className="w-4 h-4" />;
            case "attendance":
                return <Clock className="w-4 h-4" />;
            case "evaluation":
                return <Award className="w-4 h-4" />;
            case "task":
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
            case "approved":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
            case "rejected":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-[#212124] dark:text-gray-300";
        }
    };

    const alertList = Array.isArray(alerts) ? alerts : [];

    const filteredStudents = (students || []).filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Section Skeleton */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-[#212124] shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                    <Skeleton className="h-7 w-48" />
                                </div>
                                <Skeleton className="h-4 w-96" />
                            </div>
                            <Skeleton className="w-24 h-24 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Students List Skeleton */}
                <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6 sm:mb-8">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <div className="flex space-x-3 w-full lg:w-auto">
                            <Skeleton className="h-10 flex-1 lg:w-64 rounded-xl" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                    </div>

                    {/* Table Skeleton */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#212124]">
                                <tr>
                                    {["Student", "Company", "Status", "Attendance", "Tasks", "Rating"].map((header) => (
                                        <th key={header} className="text-left py-4 px-6">
                                            <Skeleton className="h-4 w-20" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {[1, 2, 3, 4].map((i) => (
                                    <tr key={i}>
                                        <td className="py-6 px-6">
                                            <div className="flex items-center space-x-4">
                                                <Skeleton className="w-12 h-12 rounded-2xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-6">
                                            <Skeleton className="h-4 w-28" />
                                        </td>
                                        <td className="py-6 px-6">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </td>
                                        <td className="py-6 px-6">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                        <td className="py-6 px-6">
                                            <Skeleton className="h-4 w-16" />
                                        </td>
                                        <td className="py-6 px-6">
                                            <Skeleton className="h-4 w-12" />
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

    return (
        <div className="space-y-6">
            {/* Header Section - Responsive Dynamic Design */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
                    <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float animation-delay-1000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-50 animate-float animation-delay-2000"></div>
                    <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
                </div>

                {/* Content - Desktop Layout */}
                <div className="hidden md:block relative z-10 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold animate-fade-in">
                                    {t("dashboard.header.title")}
                                </h1>
                            </div>
                            <p className="text-blue-100 text-sm font-medium max-w-xl">
                                {t("dashboard.header.subtitle")}
                            </p>
                        </div>

                        {/* Total Students Badge - Desktop */}
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-4 border border-white/20">
                                <div className="flex flex-col items-center">
                                    <Users className="w-6 h-6 text-white mb-1" />
                                    <p className="text-white text-3xl font-bold leading-none mb-1">
                                        {stats?.totalStudents || 0}
                                    </p>
                                    <p className="text-blue-100 text-xs font-medium whitespace-nowrap">
                                        {t("dashboard.header.totalStudents")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Mobile Layout */}
                <div className="md:hidden relative z-10 p-4">
                    {/* Mobile Header with Icon */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-xl font-bold animate-fade-in">
                                    Dashboard
                                </h1>
                            </div>
                            <p className="text-blue-100 text-xs font-medium">
                                Monitor and manage activities
                            </p>
                        </div>

                        {/* Mobile Total Students Badge */}
                        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                            <div className="flex flex-col items-center">
                                <Users className="w-4 h-4 text-white mb-0.5" />
                                <p className="text-white text-lg font-bold leading-none mb-0.5">
                                    {stats?.totalStudents || 0}
                                </p>
                                <p className="text-blue-100 text-[9px] font-medium whitespace-nowrap">
                                    Total Students
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            </div>

            <div className="space-y-8">
                {/* Enhanced Students List */}
                <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 sm:space-y-6 lg:space-y-0 mb-6 sm:mb-8">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                    {t("dashboard.students.title")}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    {t("dashboard.students.subtitle")}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full lg:w-auto">
                            <div className="relative flex-1 sm:w-64 lg:w-72">
                                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder={t("dashboard.students.searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium w-full sm:w-auto"
                            >
                                <option value="all">{t("dashboard.students.filters.all")}</option>
                                <option value="active">{t("dashboard.students.filters.active")}</option>
                                <option value="pending">{t("dashboard.students.filters.pending")}</option>
                                <option value="completed">{t("dashboard.students.filters.completed")}</option>
                            </select>
                        </div>
                    </div>

                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.student")}
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.company")}
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.status")}
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.attendance")}
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.tasks")}
                                    </th>
                                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        {t("dashboard.students.table.rating")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 px-6">
                                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner">
                                                    <Users className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {t("dashboard.students.empty.title")}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                                                        {t("dashboard.students.empty.description")}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate("/coordinator/students")}
                                                    className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                                                >
                                                    {t("dashboard.students.empty.action")}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {filteredStudents.slice(0, 4).map((student) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 cursor-pointer transition-all duration-200"
                                            >
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                            {student.avatar}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-base">
                                                                {student.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {formatStudentId(student.studentNumber)} •{" "}
                                                                {student.program}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center">
                                                            <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {student.company}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <span
                                                        className={`text-xs px-4 py-2 rounded-full font-semibold ${getStatusColor(
                                                            student.status
                                                        )}`}
                                                    >
                                                        {getStatusLabel(student.status)}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-20 bg-gray-200 dark:bg-[#212124] rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className={`h-3 rounded-full transition-all duration-500 ${student.attendance >= 90
                                                                    ? "bg-gradient-to-r from-green-500 to-green-600"
                                                                    : student.attendance >= 75
                                                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                                                        : "bg-gradient-to-r from-red-500 to-red-600"
                                                                    }`}
                                                                style={{ width: `${student.attendance}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {student.attendance}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                                                            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {student.tasks.completed}/{student.tasks.total}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-lg flex items-center justify-center">
                                                            <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {student.evaluation}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                        {filteredStudents.length > 4 && (
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => navigate("/coordinator/students")}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm shadow-lg"
                                >
                                    Manage Students
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Card View - Hidden on Desktop */}
                    <div className="lg:hidden space-y-3">
                        {filteredStudents.length === 0 ? (
                            <div className="bg-white dark:bg-[#212124] rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-inner mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                                </div>
                                <div className="space-y-2 mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                        {t("dashboard.students.empty.title")}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                                        {t("dashboard.students.empty.description")}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate("/coordinator/students")}
                                    className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                                >
                                    {t("dashboard.students.empty.action")}
                                </button>
                            </div>
                        ) : (
                            <>
                                {filteredStudents.slice(0, 3).map((student) => (
                                    <div
                                        key={student.id}
                                        className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                                    >
                                        {/* Student Header */}
                                        <div className="flex items-start space-x-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {student.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                                    {student.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                                    {formatStudentId(student.studentNumber)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                                    {student.program}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Company Section */}
                                        <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                {student.company}
                                            </span>
                                        </div>

                                        {/* Status and Metrics */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">Status</span>
                                                <span
                                                    className={`text-[10px] px-2 py-1 rounded-full font-semibold ${getStatusColor(
                                                        student.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(student.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">Attendance</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 dark:bg-[#212124] rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${student.attendance >= 90
                                                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                                                : student.attendance >= 75
                                                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                                                    : "bg-gradient-to-r from-red-500 to-red-600"
                                                                }`}
                                                            style={{ width: `${student.attendance}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {student.attendance}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">Tasks</span>
                                                <div className="flex items-center space-x-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        {student.tasks.completed}/{student.tasks.total}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-300">Rating</span>
                                                <div className="flex items-center space-x-1.5">
                                                    <Award className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-300" />
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {student.evaluation}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredStudents.length > 3 && (
                                    <div className="pt-2">
                                        <button
                                            onClick={() => navigate("/coordinator/students")}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm shadow-lg"
                                        >
                                            Manage Students
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Enhanced Performance Overview */}
                <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                                {t("dashboard.performance.title")}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                {t("dashboard.performance.subtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                                    {t("dashboard.performance.attendanceRate")}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                                    {stats?.attendanceRate || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${stats?.attendanceRate || 0}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                                    {t("dashboard.performance.tasksCompleted")}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                                    {stats?.tasksCompleted || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${stats?.tasksCompleted || 0}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                                    {t("dashboard.performance.documentApproval")}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                                    {(
                                        (((stats?.totalStudents || 0) -
                                            (stats?.documentsPending || 0)) /
                                            (stats?.totalStudents || 1)) *
                                        100
                                    ).toFixed(0)}
                                    %
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${(((stats?.totalStudents || 0) -
                                            (stats?.documentsPending || 0)) /
                                            (stats?.totalStudents || 1)) *
                                            100
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                                    {t("dashboard.performance.averageRating")}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">
                                    {((stats?.averageRating || 0 / 5) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-2 sm:h-3 lg:h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 sm:h-3 lg:h-4 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${(stats?.averageRating || 0 / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Enhanced Alerts Section */}
                <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                                {t("dashboard.alerts.title")}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                {t("dashboard.alerts.subtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {(alertList || []).slice(0, 4).map((alert) => (
                            <div
                                key={alert.id}
                                className="rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-[#212124]/90 p-3 sm:p-4 lg:p-5 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                    <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                                                {alert.title}
                                            </h4>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {alert.description}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-500 font-medium whitespace-nowrap flex-shrink-0">
                                        {alert.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!alertList || alertList.length === 0) && (
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center py-4 sm:py-6">
                                {t("dashboard.alerts.empty")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Recent Activities */}
                <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                                {t("dashboard.activities.title")}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {t("dashboard.activities.subtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        {(activities || []).slice(0, 6).map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                                    <div
                                        className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm flex-shrink-0 ${getActivityColor(
                                            activity.status
                                        )}`}
                                    >
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {activity.student}
                                        </h4>
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 mt-0.5 sm:mt-1 truncate">
                                            {activity.action}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
                                    {formatDateTime(activity.timestamp)}
                                </span>
                            </div>
                        ))}
                        {(!activities || activities.length === 0) && (
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center py-4 sm:py-6">
                                {t("dashboard.activities.empty")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorOverview;
