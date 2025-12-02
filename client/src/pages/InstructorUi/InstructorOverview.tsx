import React, { useState } from "react";
import {
    Users,
    Clock,
    Award,
    TrendingUp,
    Megaphone,
    Activity,
    CalendarDays,
    FileText,
    CheckCircle,
    Building2,
    Search,
    Eye,
    Calendar,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { instructorService, type InstructorStudent, type InstructorActivity } from "../../services/instructorService";
import { type Announcement } from "../../services/announcementService";
import { type NotificationItem } from "../../services/notificationService";
import InstructorStatsCards from "./InstructorStatsCards.tsx";
import StudentDetailsModal from "./StudentDetailsModal.tsx";

const InstructorOverview: React.FC = () => {
    const navigate = useNavigate();
    const { notifications } = useOutletContext<{ notifications: NotificationItem[] }>() || { notifications: [] };
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedStudent, setSelectedStudent] = useState<InstructorStudent | null>(null);
    const [showStudentModal, setShowStudentModal] = useState(false);

    // Data Fetching
    const { data: studentsData, loading: studentsLoading } = useOptimizedData(
        () => instructorService.getAssignedStudents(),
        [],
        { ttl: 60 * 1000 }
    );

    const { data: statsData, loading: statsLoading } = useOptimizedData(
        () => instructorService.getDashboardStats(),
        [],
        { ttl: 2 * 60 * 1000 }
    );

    const { data: activitiesData, loading: activitiesLoading } = useOptimizedData(
        () => instructorService.getRecentActivities(),
        [],
        { ttl: 60 * 1000 }
    );

    const { data: announcementsData, loading: announcementsLoading } = useOptimizedData<Announcement[]>(
        () => instructorService.getAnnouncements(),
        [],
        { ttl: 2 * 60 * 1000 }
    );

    const students = studentsData || [];
    const stats = statsData || {
        totalStudents: 0,
        activeStudents: 0,
        atRiskStudents: 0,
        completedStudents: 0,
        avgAttendance: 0,
        avgRating: 0,
        documentsPending: 0,
        evaluationsPending: 0,
    };
    const activities = activitiesData || [];
    const announcements = announcementsData || [];
    const latestAnnouncements = announcements.slice(0, 3);

    const loading = studentsLoading || statsLoading || activitiesLoading || announcementsLoading;

    // Handlers
    const handleAnnouncementClick = async (announcementId: string) => {
        try {
            await instructorService.trackAnnouncementView(announcementId);
        } catch (error) {
            console.warn("Failed to track announcement view", error);
        }
    };

    const handleViewStudentDetails = (student: InstructorStudent) => {
        setSelectedStudent(student);
        setShowStudentModal(true);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
            completed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            at_risk: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        };
        return colors[status] || colors.active;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "submission": return <FileText className="w-4 h-4" />;
            case "attendance": return <Clock className="w-4 h-4" />;
            case "task": return <CheckCircle className="w-4 h-4" />;
            case "evaluation": return <Award className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "submission": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
            case "attendance": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
            case "task": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
            case "evaluation": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    // Filter Logic
    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Activity Feed Logic
    const notificationActivities: InstructorActivity[] = (notifications || []).map((notification) => {
        let type: InstructorActivity["type"] = "task";
        if (notification.type === "DOCUMENT") type = "submission";
        else if (notification.type === "ATTENDANCE") type = "attendance";

        return {
            id: `notification-${notification.id}`,
            studentName: notification.title,
            action: notification.message,
            type,
            timestamp: notification.createdAt,
        };
    });

    const activityFeed = [...activities, ...notificationActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    const compactActivityFeed = activityFeed.slice(0, 5);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl w-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl"></div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
                <div className="hidden md:block absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
                <div className="hidden md:block relative z-10 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold animate-fade-in">Dashboard Overview</h1>
                            </div>
                            <p className="text-blue-100 text-sm font-medium max-w-xl">
                                Monitor and evaluate BS Computer Engineering students
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl px-5 py-4 border border-white/20">
                                <div className="flex flex-col items-center">
                                    <Users className="w-6 h-6 text-white mb-1" />
                                    <p className="text-white text-3xl font-bold leading-none mb-1">{stats.totalStudents}</p>
                                    <p className="text-blue-100 text-xs font-medium whitespace-nowrap">Total Students</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:hidden relative z-10 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-xl font-bold animate-fade-in">Dashboard</h1>
                            </div>
                            <p className="text-blue-100 text-xs font-medium">Monitor and evaluate students</p>
                        </div>
                        <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
                            <div className="flex flex-col items-center">
                                <Users className="w-4 h-4 text-white mb-0.5" />
                                <p className="text-white text-lg font-bold leading-none mb-0.5">{stats.totalStudents}</p>
                                <p className="text-blue-100 text-[9px] font-medium whitespace-nowrap">Total Students</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <InstructorStatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Students List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 sm:space-y-4 md:space-y-0 mb-4 sm:mb-6">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Student Management</h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Track progress and review assigned students</p>
                            </div>
                            <div className="flex flex-col md:flex-row space-y-2 sm:space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or student ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                        aria-label="Search students"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full md:w-auto md:min-w-[140px]"
                                    aria-label="Filter by status"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="warning">Warning</option>
                                    <option value="at_risk">At Risk</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.slice(0, 3).map((student) => (
                                    <div key={student.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-[#212124]">
                                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                                            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                                        {student.avatar}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white dark:border-gray-800 ${student.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{student.name}</h3>
                                                        <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-full font-semibold flex-shrink-0 ${getStatusColor(student.status)}`}>
                                                            {student.status.replace("_", " ").toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">{student.studentId} • {student.program}</p>
                                                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                                                        <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{student.company}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Metrics */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                                            <div className="rounded-lg p-2 sm:p-3 border border-blue-500 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300">Attendance</p>
                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                                                </div>
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    <p className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-200">{student.attendanceRate}%</p>
                                                    <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-1 sm:h-1.5">
                                                        <div className="bg-blue-600 dark:bg-blue-400 h-1 sm:h-1.5 rounded-full transition-all duration-500" style={{ width: `${student.attendanceRate}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-lg p-2 sm:p-3 border border-green-500 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300">Hours</p>
                                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-300 flex-shrink-0" />
                                                </div>
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-200">{student.hoursCompleted}/{student.requiredHours}</p>
                                                    <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-1 sm:h-1.5">
                                                        <div className="bg-green-600 dark:bg-green-400 h-1 sm:h-1.5 rounded-full transition-all duration-500" style={{ width: `${student.requiredHours ? (student.hoursCompleted / student.requiredHours) * 100 : 0}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-lg p-2 sm:p-3 border border-amber-500 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <p className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300">Rating</p>
                                                    <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                                                </div>
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    <p className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-200">{student.lastEvaluation ? student.lastEvaluation.toFixed(1) : "N/A"}</p>
                                                    <div className="flex items-center space-x-0.5">
                                                        <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 dark:text-amber-300 fill-current" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Last activity: {student.lastActivity}</span>
                                            </div>
                                            <button onClick={() => handleViewStudentDetails(student)} className="w-full sm:w-auto flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium">
                                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span>View Details</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Students Assigned</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">You don't have any students assigned to you yet.</p>
                                    <button onClick={() => navigate("/instructor/students")} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                                        <Users className="w-5 h-5 mr-2" />
                                        Manage Students
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button onClick={() => navigate("/instructor/students")} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl">
                                {filteredStudents.length > 3 ? "View More Students" : filteredStudents.length > 0 ? "Manage Students" : "Add Students"}
                                <Users className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Announcements */}
                    <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                                    <Megaphone className="w-4 h-4 text-white" />
                                </span>
                                <span>Announcements</span>
                            </h3>
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">{announcements.length} total</span>
                        </div>
                        <div className="space-y-3">
                            {latestAnnouncements.length > 0 ? (
                                latestAnnouncements.map((announcement) => (
                                    <button key={announcement.id} onClick={() => handleAnnouncementClick(announcement.id)} className="w-full text-left rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 px-4 py-3 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{announcement.title}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{announcement.message || announcement.content}</p>
                                            </div>
                                            <div className="flex flex-col items-end space-y-1">
                                                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 dark:text-amber-200">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    <span>{announcement.createdDate ? new Date(announcement.createdDate).toLocaleDateString() : new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                                    <Megaphone className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                    No announcements yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                                <Award className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button onClick={() => navigate("/instructor/documents")} className="w-full flex items-center space-x-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 border border-green-200 dark:border-green-700 group">
                                <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors"><FileText className="w-4 h-4 text-white" /></div>
                                <div className="text-left"><span className="text-sm font-semibold block text-green-900 dark:text-green-100">Review Documents</span><span className="text-xs text-green-600 dark:text-green-300">Check submitted files</span></div>
                            </button>
                            <button onClick={() => navigate("/instructor/applications")} className="w-full flex items-center space-x-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 border border-blue-200 dark:border-blue-700 group">
                                <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors"><Building2 className="w-4 h-4 text-white" /></div>
                                <div className="text-left"><span className="text-sm font-semibold block text-blue-900 dark:text-blue-100">Company Applications</span><span className="text-xs text-blue-600 dark:text-blue-300">Approve or reject placements</span></div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-white" />
                                </span>
                                <span>Recent Activities</span>
                            </h3>
                            <button onClick={() => navigate("/instructor/monitoring")} className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700" aria-label="View all activities">View all</button>
                        </div>
                        <div className="space-y-3">
                            {compactActivityFeed.length > 0 ? (
                                compactActivityFeed.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activity.studentName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.action}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">No recent activity yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Details Modal */}
            {showStudentModal && selectedStudent && (
                <StudentDetailsModal
                    selectedStudent={selectedStudent}
                    onClose={() => setShowStudentModal(false)}
                    onViewDocuments={() => {
                        navigate("/instructor/documents");
                        setShowStudentModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default InstructorOverview;
