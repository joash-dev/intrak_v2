import { useState, useEffect } from "react";
import {
    Users,
    Clock,
    Award,
    AlertCircle,
    CheckCircle,
    Search,
    Eye,
    Activity,
    GraduationCap,
    FileText,
    Calendar,
    Mail,
    X,
    LayoutGrid,
    List,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { supervisorService } from "../../services/supervisorService";
import type { SupervisorStudent } from "../../services/supervisorService";

const SupervisorOverview = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [interns, setInterns] = useState<SupervisorStudent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedIntern, setSelectedIntern] = useState<SupervisorStudent | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const students = await supervisorService.getMyStudents();
            setInterns(students);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching students:", err);
            setError(err.response?.data?.message || "Failed to load students");
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalInterns: interns.length,
        activeInterns: interns.filter((i) => i.status === "active").length,
        pendingApprovals: interns.reduce(
            (sum, i) => sum + (i.pendingApprovals || 0),
            0
        ),
        avgAttendance:
            interns.length > 0
                ? (
                    interns.reduce((sum, i) => sum + i.attendanceRate, 0) /
                    interns.length
                ).toFixed(1)
                : "0.0",
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: {
                className:
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
            },
            needs_attention: {
                className:
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
            },
            completed: {
                className:
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            },
        };
        const badge = badges[status as keyof typeof badges] || badges.active;
        return (
            <span
                className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${badge.className}`}
            >
                {status.replace("_", " ")}
            </span>
        );
    };

    const filteredInterns = interns.filter((intern) => {
        const matchesSearch =
            intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intern.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterStatus === "all" || intern.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header Banner Skeleton */}
                <div className="h-48 bg-gray-200 dark:bg-[#212124] rounded-2xl w-full"></div>

                {/* Stats Row Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-gray-200 dark:bg-[#212124] rounded-xl"></div>
                    <div className="h-32 bg-gray-200 dark:bg-[#212124] rounded-xl"></div>
                </div>

                {/* List Item Skeleton (Circle + Lines) */}
                <div className="bg-white dark:bg-[#212124] p-6 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-[#212124] rounded-full"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-[#212124] rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-full"></div>
                        <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-5/6"></div>
                    </div>
                </div>

                {/* List Item Skeleton (Rectangle + Lines) */}
                <div className="bg-white dark:bg-[#212124] p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 h-32 bg-gray-200 dark:bg-[#212124] rounded-lg"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 dark:bg-[#212124] rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-full"></div>
                            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-5/6"></div>
                            <div className="h-3 bg-gray-200 dark:bg-[#212124] rounded w-4/5"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const supervisorName = user?.name || "Supervisor";
    const companyName =
        user?.companyName ||
        user?.company ||
        user?.company?.name ||
        "Company";

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Gradient Header - Responsive Dynamic Design */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
                    <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-float animation-delay-1000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-white rounded-full opacity-50 animate-float animation-delay-2000"></div>
                    <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full opacity-70 animate-float animation-delay-3000"></div>
                </div>

                {/* Content - Desktop Layout */}
                <div className="hidden md:block relative z-10 p-6 lg:p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2 animate-fade-in">
                                Welcome back, {supervisorName}!
                            </h1>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                                    <Users className="w-4 h-4 opacity-90" />
                                    <p className="text-sm font-medium opacity-90">Company: {companyName}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm opacity-80 max-w-md">
                                Supervisor Dashboard - Monitor and manage your interns
                            </p>
                        </div>

                        {/* Decorative Icon */}
                        <div className="hidden lg:block">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                                <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                                    <Activity className="w-12 h-12 text-white animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content - Mobile Layout */}
                <div className="md:hidden relative z-10 p-4">
                    {/* Mobile Header with Icon */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h1 className="text-xl font-bold mb-1 leading-tight animate-fade-in">
                                Welcome back!
                            </h1>
                            <p className="text-lg font-semibold opacity-95">
                                {supervisorName.split(' ')[0]}
                            </p>
                        </div>

                        {/* Mobile Icon */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg"></div>
                                <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                    <Activity className="w-8 h-8 text-white animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Info Cards - Stacked */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                            <Users className="w-4 h-4 opacity-90 flex-shrink-0" />
                            <p className="text-xs font-medium opacity-90 truncate">{companyName}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2">
                            <p className="text-xs opacity-75">Monitor and manage your interns</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Interns */}
                <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Total Interns
                        </p>
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                        {stats.totalInterns}
                    </p>
                    <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {stats.activeInterns} active
                    </span>
                </div>

                {/* Active Interns */}
                <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Active Interns
                        </p>
                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                        {stats.activeInterns}
                    </p>
                    <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
                        Active interns
                    </span>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Pending Approvals
                        </p>
                        <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                        {stats.pendingApprovals}
                    </p>
                    <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        {stats.pendingApprovals} pending
                    </span>
                </div>

                {/* Avg Attendance */}
                <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Avg Attendance
                        </p>
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                        {stats.avgAttendance}%
                    </p>
                    <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Average rate
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#19191c] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
                    <div className="flex-1 flex gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                            <input
                                type="text"
                                placeholder="Search interns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="needs_attention">Needs Attention</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 self-end md:self-auto">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-200 rounded-lg px-4 py-3">
                    <p>{error}</p>
                </div>
            )}

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredInterns.length} of {interns.length} interns
            </p>

            {/* Interns List/Grid */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {filteredInterns.map((intern) => (
                        <div
                            key={intern.id}
                            className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex items-start justify-between mb-2.5 sm:mb-3 lg:mb-4">
                                <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm lg:text-base flex-shrink-0">
                                        {intern.name
                                            .split(" ")
                                            .map((namePart: string) => namePart[0] ?? "")
                                            .join("")
                                            .substring(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                                            {intern.name}
                                        </h3>
                                        <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {intern.studentNumber} • {intern.program}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-1.5 sm:ml-2">
                                    {getStatusBadge(intern.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-4 mt-2.5 sm:mt-3 lg:mt-4">
                                <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                                        Attendance
                                    </p>
                                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                                        {intern.attendanceRate}%
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                                        Hours
                                    </p>
                                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                                        {intern.completedHours}/{intern.totalHours}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-2.5 lg:p-3">
                                    <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                                        Rating
                                    </p>
                                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                                        {intern.lastEvaluation
                                            ? intern.lastEvaluation.overallRating.toFixed(1)
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2.5 sm:mt-3 lg:mt-4 pt-2.5 sm:pt-3 lg:pt-4 border-t border-gray-200 dark:border-gray-700 gap-2">
                                <span className="text-[9px] sm:text-[10px] lg:text-xs text-gray-500 dark:text-gray-400">
                                    Last activity: {intern.lastActivity || "Recently"}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedIntern(intern);
                                        setShowDetailsModal(true);
                                    }}
                                    className="flex items-center justify-center sm:justify-start space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-1.5 text-[10px] sm:text-xs lg:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md sm:rounded-lg transition-colors w-full sm:w-auto"
                                >
                                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                                    <span>View Details</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intern</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Attendance</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Hours</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredInterns.map((intern) => (
                                    <tr
                                        key={intern.id}
                                        onClick={() => {
                                            setSelectedIntern(intern);
                                            setShowDetailsModal(true);
                                        }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                    {intern.name
                                                        .split(" ")
                                                        .map((namePart: string) => namePart[0] ?? "")
                                                        .join("")
                                                        .substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{intern.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{intern.studentNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(intern.status)}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">{intern.attendanceRate}%</div>
                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${intern.attendanceRate >= 90 ? 'bg-green-500' : intern.attendanceRate >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${intern.attendanceRate}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {intern.completedHours} <span className="text-gray-500 text-xs font-normal">/ {intern.totalHours}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {Math.round((intern.completedHours / Math.max(intern.totalHours, 1)) * 100)}% complete
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            {intern.lastEvaluation ? (
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-amber-500 font-bold">{intern.lastEvaluation.overallRating.toFixed(1)}</span>
                                                    <span className="text-xs text-gray-400">/ 5.0</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight className="w-5 h-5 text-gray-400 inline-block" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredInterns.length === 0 && (
                <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#19191c] rounded-lg sm:rounded-xl">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No interns found</p>
                </div>
            )}

            {/* Intern Details Modal */}
            {showDetailsModal && selectedIntern && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-3 sm:p-4"
                    onClick={() => setShowDetailsModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#19191c] rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                                    {selectedIntern.name
                                        .split(" ")
                                        .map((namePart: string) => namePart[0] ?? "")
                                        .join("")
                                        .substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                        {selectedIntern.name}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {selectedIntern.studentNumber} • {selectedIntern.program}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {/* Status Badge */}
                            <div className="mb-4 sm:mb-6">
                                {getStatusBadge(selectedIntern.status)}
                            </div>

                            {/* Progress Overview */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Attendance
                                        </p>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedIntern.attendanceRate}%
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Hours
                                        </p>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedIntern.completedHours}/{selectedIntern.totalHours}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {selectedIntern.totalHours > 0
                                            ? `${Math.round((selectedIntern.completedHours / selectedIntern.totalHours) * 100)}% completed`
                                            : "0% completed"}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Rating
                                        </p>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedIntern.lastEvaluation
                                            ? selectedIntern.lastEvaluation.overallRating.toFixed(1)
                                            : "N/A"}
                                    </p>
                                    {selectedIntern.lastEvaluation && (
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Last: {new Date(selectedIntern.lastEvaluation.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    Academic Information
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Program</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedIntern.program}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Year & Section</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                Year {selectedIntern.year} • {selectedIntern.section}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {selectedIntern.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Internship Details */}
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    Internship Details
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedIntern.startDate
                                                    ? new Date(selectedIntern.startDate).toLocaleDateString()
                                                    : "Not set"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">End Date</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedIntern.endDate
                                                    ? new Date(selectedIntern.endDate).toLocaleDateString()
                                                    : "Not set"}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedIntern.tasksCompleted !== undefined && selectedIntern.totalTasks !== undefined && (
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Tasks</p>
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                    {selectedIntern.tasksCompleted}/{selectedIntern.totalTasks} completed
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Last Activity</p>
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedIntern.lastActivity || "Recently"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorOverview;
