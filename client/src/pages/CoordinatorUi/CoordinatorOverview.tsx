import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Building2,
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
    Megaphone,
    ArrowRight,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { coordinatorService } from "../../services/coordinatorService";
import { announcementService } from "../../services/announcementService";
import Skeleton from "../../components/Skeleton";
import { formatStudentId } from "../../utils/formatStudentId";

const STUDENTS_PER_PAGE = 5;

const CoordinatorOverview: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [studentPage, setStudentPage] = useState(1);

    // Data fetching — useOptimizedData returns null (not undefined) while loading,
    // so we use ?? to provide safe defaults instead of destructuring defaults.
    const { data: rawStudents, loading: studentsLoading } = useOptimizedData(
        () => coordinatorService.getAllStudents(),
        [],
        { ttl: 5 * 60 * 1000 }
    );
    const students = rawStudents ?? [];

    const { data: rawActivities, loading: activitiesLoading } = useOptimizedData(
        () => coordinatorService.getRecentActivities(),
        [],
        { ttl: 2 * 60 * 1000 }
    );
    const activities = rawActivities ?? [];

    const { data: rawAnnouncements, loading: announcementsLoading } = useOptimizedData(
        () => coordinatorService.getAnnouncements(),
        [],
        { ttl: 3 * 60 * 1000 }
    );
    const announcements = rawAnnouncements ?? [];

    const { data: rawDocStats, loading: docStatsLoading } = useOptimizedData(
        () => coordinatorService.getDocumentStats(),
        [],
        { ttl: 3 * 60 * 1000 }
    );
    const docStats = rawDocStats ?? { total: 0, pending: 0, approved: 0, rejected: 0 };

    const { data: rawCompanyCount, loading: companyLoading } = useOptimizedData(
        () => coordinatorService.getCompanyCount(),
        [],
        { ttl: 5 * 60 * 1000 }
    );
    const companyCount = rawCompanyCount ?? 0;

    const loading = studentsLoading || activitiesLoading || announcementsLoading || docStatsLoading || companyLoading;

    // Computed data
    const alerts = useMemo(() => {
        if (studentsLoading) return [];
        return coordinatorService.computeAlerts(students, docStats.pending);
    }, [students, docStats, studentsLoading]);

    const filteredStudents = useMemo(() => {
        return (students || []).filter((student) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                filterStatus === "all" || student.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    }, [students, searchQuery, filterStatus]);

    const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
    const paginatedStudents = filteredStudents.slice(
        (studentPage - 1) * STUDENTS_PER_PAGE,
        studentPage * STUDENTS_PER_PAGE
    );

    useEffect(() => { setStudentPage(1); }, [searchQuery, filterStatus]);

    // Stat values
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const completedStudents = students.filter(s => s.status === 'completed').length;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
            pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
            completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
            inactive: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        };
        return colors[status] || colors.active;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            active: "Active",
            pending: "Pending",
            completed: "Completed",
            inactive: "Inactive",
        };
        return labels[status] || status;
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case "error": return <XCircle className="w-5 h-5 text-red-600" />;
            case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
            default: return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const getAlertBg = (type: string) => {
        switch (type) {
            case "warning": return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
            case "error": return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
            case "success": return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
            default: return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
        }
    };

    const getActivityStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
            case "approved": return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
            case "rejected": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    const getAnnouncementTypeColor = (type: string) => {
        switch (type) {
            case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
            case "warning": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
            case "success": return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
            default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
        }
    };

    // Stats cards config
    const statsCards = [
        {
            label: "Total Students",
            value: totalStudents,
            icon: Users,
            iconBg: "bg-blue-100 dark:bg-blue-900/40",
            iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
            label: "Active Interns",
            value: activeStudents,
            icon: Activity,
            iconBg: "bg-green-100 dark:bg-green-900/40",
            iconColor: "text-green-600 dark:text-green-400",
        },
        {
            label: "Pending Documents",
            value: docStats.pending,
            icon: FileText,
            iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
            iconColor: "text-yellow-600 dark:text-yellow-400",
        },
        {
            label: "Companies",
            value: companyCount,
            icon: Building2,
            iconBg: "bg-purple-100 dark:bg-purple-900/40",
            iconColor: "text-purple-600 dark:text-purple-400",
        },
    ];

    // Quick actions config
    const quickActions = [
        {
            label: "Review Documents",
            description: `${docStats.pending} pending`,
            icon: ClipboardList,
            iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
            iconColor: "text-yellow-600 dark:text-yellow-400",
            path: "/coordinator/documents",
        },
        {
            label: "Manage Students",
            description: `${totalStudents} total`,
            icon: Users,
            iconBg: "bg-blue-100 dark:bg-blue-900/40",
            iconColor: "text-blue-600 dark:text-blue-400",
            path: "/coordinator/students",
        },
        {
            label: "Company Management",
            description: `${companyCount} companies`,
            icon: Building2,
            iconBg: "bg-purple-100 dark:bg-purple-900/40",
            iconColor: "text-purple-600 dark:text-purple-400",
            path: "/coordinator/companies",
        },
        {
            label: "Announcements",
            description: `${announcements.length} total`,
            icon: Megaphone,
            iconBg: "bg-green-100 dark:bg-green-900/40",
            iconColor: "text-green-600 dark:text-green-400",
            path: "/coordinator/announcements",
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                </div>
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-10" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <Skeleton className="h-6 w-40" />
                            {[1, 2, 3].map(j => <Skeleton key={j} className="h-14 w-full rounded-lg" />)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Clean Header ── */}
            <div className="bg-white dark:bg-[#212124] rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {t("dashboard.header.title", { defaultValue: "Coordinator Dashboard" })}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("dashboard.header.subtitle", { defaultValue: "Monitor and manage internship activities" })}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statsCards.map((card) => (
                    <div key={card.label} className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => navigate(action.path)}
                        className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group"
                    >
                        <div className="flex items-center space-x-3 mb-2">
                            <div className={`p-2 rounded-lg ${action.iconBg}`}>
                                <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                    </button>
                ))}
            </div>

            {/* ── Alerts & Announcements Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Alerts */}
                <div className="bg-white dark:bg-[#212124] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alerts</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Action items needing your attention</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`rounded-xl border p-3.5 ${getAlertBg(alert.type)}`}>
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{alert.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{alert.description || alert.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Announcements */}
                <div className="bg-white dark:bg-[#212124] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-xl">
                                <Megaphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Announcements</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Latest announcements posted</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/coordinator/announcements")}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-3">
                        {announcements.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                No announcements yet
                            </div>
                        ) : (
                            announcements.slice(0, 4).map((ann) => (
                                <div
                                    key={ann.id}
                                    className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    onClick={() => navigate("/coordinator/announcements")}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ann.title}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getAnnouncementTypeColor(ann.type)}`}>
                                                    {ann.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {ann.content || ann.message}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                                            {announcementService.formatDate(ann.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent Activities ── */}
            <div className="bg-white dark:bg-[#212124] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activities</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Latest document submissions from students</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/coordinator/documents")}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        View all
                    </button>
                </div>
                {(activities || []).length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No recent activities
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(activities || []).slice(0, 6).map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${getActivityStatusColor(activity.status)}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.student}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.action}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${getActivityStatusColor(activity.status)}`}>
                                        {activity.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                        {announcementService.formatDate(activity.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Student Overview Table ── */}
            <div className="bg-white dark:bg-[#212124] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-5">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Students Overview
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-56">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructor</th>
                                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 px-5">
                                        <div className="flex flex-col items-center space-y-3 text-center">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                                <Users className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                                    {student.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatStudentId(student.studentNumber)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center space-x-2">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{student.company}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(student.status)}`}>
                                                {getStatusLabel(student.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {student.instructorName || <span className="text-gray-400 italic">Not assigned</span>}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{student.program}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                    {paginatedStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl inline-flex mb-3">
                                <Users className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
                        </div>
                    ) : (
                        paginatedStudents.map((student) => (
                            <div key={student.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-start space-x-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">
                                        {student.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatStudentId(student.studentNumber)} • {student.program}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(student.status)}`}>
                                        {getStatusLabel(student.status)}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Company</span>
                                        <span className="text-gray-700 dark:text-gray-300">{student.company}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Instructor</span>
                                        <span className="text-gray-700 dark:text-gray-300">{student.instructorName || 'Not assigned'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalStudentPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Showing {(studentPage - 1) * STUDENTS_PER_PAGE + 1}–{Math.min(studentPage * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
                        </p>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                disabled={studentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {studentPage} / {totalStudentPages}
                            </span>
                            <button
                                onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                                disabled={studentPage === totalStudentPages}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Manage Students Button */}
                {filteredStudents.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => navigate("/coordinator/students")}
                            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                            Manage All Students
                        </button>
                    </div>
                )}
            </div>

            {/* ── Performance Overview (only real metrics) ── */}
            <div className="bg-white dark:bg-[#212124] rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview Metrics</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quick snapshot of system status</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active % */}
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Active Students</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%
                        </p>
                        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{activeStudents} of {totalStudents}</p>
                    </div>

                    {/* Documents Approved */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Documents Approved</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {docStats.total > 0 ? Math.round((docStats.approved / docStats.total) * 100) : 0}%
                        </p>
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${docStats.total > 0 ? (docStats.approved / docStats.total) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{docStats.approved} of {docStats.total}</p>
                    </div>

                    {/* Pending Documents */}
                    <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Pending Review</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{docStats.pending}</p>
                        <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${docStats.total > 0 ? (docStats.pending / docStats.total) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">of {docStats.total} documents</p>
                    </div>

                    {/* Completed Internships */}
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Completed Internships</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{completedStudents}</p>
                        <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-purple-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{completedStudents} of {totalStudents}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorOverview;
