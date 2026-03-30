import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    FileText,
    Clock,
    Star,
    TrendingUp,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle,
    Bell,
    User,
    Building2,
} from "lucide-react";
import { dashboardService, type DashboardData } from "../../services/dashboardService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { formatDuration, formatAttendanceTime } from "../../utils/attendanceCalculations";
import Skeleton from "../../components/Skeleton";
import { settingsService } from "../../services/settingsService";
import { ProfilePhoto } from "../../components/LoadingStates/ProfilePhotoSkeleton";
import { formatStudentId } from "../../utils/formatStudentId";

const defaultDashboardData: DashboardData = {
    student: {
        id: "",
        name: "",
        email: "",
        studentNumber: "",
        program: "",
        year: 0,
        section: "",
        company: "",
        supervisor: "",
        totalHours: 0,
        completedHours: 0,
    },
    documents: [],
    attendance: [],
    evaluations: [],
    announcements: [],
};

const StudentOverview = () => {
    const navigate = useNavigate();
    const { data: fetchedData, loading, error } = useOptimizedData<DashboardData>(
        () => dashboardService.getDashboardData(),
        [],
        { ttl: 30000 } // 30 seconds cache
    );

    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [isPhotoLoading, setIsPhotoLoading] = useState(true);

    const loadProfilePhoto = async () => {
        try {
            setIsPhotoLoading(true);
            const photo = await settingsService.getProfilePhoto();
            setProfilePhoto(photo);
        } catch (error) {
            console.error("Error loading profile photo", error);
        } finally {
            setIsPhotoLoading(false);
        }
    };

    useEffect(() => {
        loadProfilePhoto();

        const handleUpdate = (e: any) => {
            if (e.detail?.photoUrl) {
                setProfilePhoto(e.detail.photoUrl);
            } else {
                loadProfilePhoto();
            }
        };

        window.addEventListener("profilePhotoUpdated", handleUpdate);
        return () => window.removeEventListener("profilePhotoUpdated", handleUpdate);
    }, []);

    const data = fetchedData || defaultDashboardData;

    const initials = (data.student.name || "Student")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Welcome Banner Skeleton */}
                <div className="relative overflow-hidden rounded-2xl bg-gray-200 dark:bg-[#212124] shadow-2xl">
                    <div className="p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-10 w-64" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-8 w-32 rounded-lg" />
                                    <Skeleton className="h-8 w-40 rounded-lg" />
                                </div>
                                <Skeleton className="h-4 w-96" />
                            </div>
                            <Skeleton className="w-20 h-20 rounded-2xl" />
                        </div>
                    </div>
                </div>
                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="w-12 h-12 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load dashboard</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Please try again later.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
            </div>
        );
    }

    const progress = data.student.totalHours && data.student.totalHours > 0
        ? ((data.student.completedHours || 0) / data.student.totalHours) * 100
        : 0;
    const cappedProgress = Math.min(progress, 100);

    const requiredDocumentTypes: Array<{ type: string; required: boolean }> = [
        // PRE-DEPLOYMENT
        { type: "RECORD_FILE", required: true },
        { type: "APPLICATION_INTERNSHIP", required: true },
        { type: "MEDICAL_CERTIFICATE", required: true },
        { type: "CERTIFICATION_UNITS", required: true },
        { type: "INTERNSHIP_RESUME", required: true },
        { type: "CONSENT_FORM", required: true },
        { type: "ENDORSEMENT_LETTER", required: true }, // also satisfied by ENDORSEMENT_LETTER_MULTI
        { type: "INTERNSHIP_RELEASE", required: true },
        // UPON APPROVAL
        { type: "MOA", required: true },
        { type: "INTERNSHIP_AGREEMENT", required: true },
        { type: "TRAINING_AGREEMENT", required: false },
        // POST-OJT
        { type: "INTERNSHIP_EVALUATION", required: true },
        { type: "CERTIFICATE_COMPLETION", required: true },
        { type: "NARRATIVE_REPORT", required: true },
        { type: "DTR_PHOTOCOPY", required: true },
        { type: "TIME_FRAMES", required: true },
        { type: "WEEKLY_REPORTS", required: true },
        { type: "STUDENT_FEEDBACK", required: true },
        { type: "SUPERVISOR_FEEDBACK", required: true },
        { type: "AGENCY_SELF_EVALUATION", required: true },
        { type: "AGENCY_STUDENT_EVALUATION", required: true },
    ];

    const requiredTypes = requiredDocumentTypes.filter((d) => d.required).map((d) => d.type);
    // UI requirement: show progress as x/20 (approved required documents out of 20 total items).
    const REQUIRED_DOCUMENT_TOTAL = 20;
    const requiredTotal = REQUIRED_DOCUMENT_TOTAL;

    const approvedRequiredCount = (() => {
        const docs = Array.isArray(data.documents) ? data.documents : [];
        const hasApproved = (type: string) => docs.some((d: any) => d?.status === "APPROVED" && d?.type === type);

        return requiredTypes.filter((type) => {
            if (type === "ENDORSEMENT_LETTER") {
                // Treat multi-student endorsement as fulfilling the requirement
                return hasApproved("ENDORSEMENT_LETTER") || hasApproved("ENDORSEMENT_LETTER_MULTI");
            }
            return hasApproved(type);
        }).length;
    })();

    const documentTypeLabelMap: Record<string, string> = {
        RECORD_FILE: "Record File",
        APPLICATION_INTERNSHIP: "Application for Internship (Form FM-AA-INT-01)",
        MEDICAL_CERTIFICATE: "Medical Certificate and Psychological Test",
        CERTIFICATION_UNITS: "Certification of Units Earned (Form FM-AA-INT-02)",
        INTERNSHIP_RESUME: "Internship Resume (Form FM-AA-INT-09)",
        CONSENT_FORM: "Consent Form (Form FM-AA-INT-03)",
        ENDORSEMENT_LETTER: "Endorsement Letter (Form FM-AA-INT-05)",
        ENDORSEMENT_LETTER_MULTI: "Endorsement Letter (Form FM-AA-INT-05)",
        INTERNSHIP_RELEASE: "Internship Release Form (Form FM-AA-INT-12)",
        MOA: "Memorandum of Agreement (MOA) (Form FM-AA-INT-10)",
        INTERNSHIP_AGREEMENT: "Internship Agreement (Form FM-AA-INT-10)",
        TRAINING_AGREEMENT: "Training Agreement and Liability Waiver (Form FM-AA-INT-15)",
        INTERNSHIP_EVALUATION: "Internship Evaluation Form (Form FM-AA-INT-11)",
        CERTIFICATE_COMPLETION: "Certificate of Training Completion",
        NARRATIVE_REPORT: "Internship Narrative Report",
        DTR_PHOTOCOPY: "Photocopy of Daily Time Record",
        TIME_FRAMES: "Internship Time Frames (Form FM-AA-INT-14)",
        WEEKLY_REPORTS: "Practicum/Internship Weekly Reports (Form FM-AA-INT-16)",
        STUDENT_FEEDBACK: "Student-Trainees Feedback Form (Form FM-AA-INT-17)",
        SUPERVISOR_FEEDBACK: "Training Supervisor's Feedback Form (Form FM-AA-INT-18)",
        AGENCY_SELF_EVALUATION: "Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)",
        AGENCY_STUDENT_EVALUATION: "Evaluation Instrument of PSU Partner Agencies (Student) (Form FM-AA-INT-19c)",
    };

    const getDocumentTypeLabel = (type: string) => documentTypeLabelMap[type] || type;

    const avgRating = Array.isArray(data.evaluations) && data.evaluations.length > 0
        ? (() => {
            const validEvaluations = data.evaluations.filter(e => e.rating != null && !isNaN(e.rating));
            if (validEvaluations.length === 0) return "N/A";
            const sum = validEvaluations.reduce((sum, e) => sum + e.rating, 0);
            return (sum / validEvaluations.length).toFixed(1);
        })()
        : "N/A";

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white shadow-2xl">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 p-8 flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                            Welcome back, {data.student.name}!
                        </h2>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                                <User className="w-4 h-4 opacity-90" />
                                <p className="text-sm font-medium opacity-90">ID: {formatStudentId(data.student.studentNumber)}</p>
                            </div>
                            {data.student.company && (
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-fit">
                                    <Building2 className="w-4 h-4 opacity-90" />
                                    <p className="text-sm font-semibold opacity-90">{data.student.company}</p>
                                </div>
                            )}
                        </div>
                        {!data.student.company && (
                            <p className="mt-3 text-sm opacity-80 max-w-md">Track your internship progress and manage your requirements</p>
                        )}
                    </div>
                    <div className="hidden lg:block">
                        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                            <ProfilePhoto
                                src={profilePhoto}
                                alt={data.student.name}
                                initials={initials}
                                size="xl"
                                loading={isPhotoLoading}
                                className="!w-24 !h-24 shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#212124] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{approvedRequiredCount}/{requiredTotal}</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{approvedRequiredCount} approved (required)</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Hours Completed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.student.completedHours}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">of {data.student.totalHours} hours</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{avgRating}</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{Array.isArray(data.evaluations) ? data.evaluations.length : 0} evaluations</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Progress</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{cappedProgress.toFixed(1)}%</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">On track</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Internship Progress</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{data.student.completedHours} / {data.student.totalHours} hours</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-4">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${cappedProgress}%` }}
                    />
                </div>
                <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 text-right">
                    {cappedProgress.toFixed(1)}%
                </p>
            </div>

            {/* Requirements Checklist & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Document Status
                        </h3>
                        <button onClick={() => navigate("/student/documents")} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">View all</button>
                    </div>
                    <div className="space-y-3 flex-1">
                        {Array.isArray(data.documents) && data.documents.length > 0 ? (
                            data.documents.slice(0, 4).map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#212124] rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {doc.status === "APPROVED" && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        {doc.status === "PENDING" && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                                        {doc.status === "REJECTED" && <XCircle className="w-5 h-5 text-red-500" />}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[16rem]" title={getDocumentTypeLabel(doc.type)}>
                                                {getDocumentTypeLabel(doc.type)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${doc.status === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : doc.status === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-[#212124] dark:text-yellow-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{doc.status}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No documents uploaded yet</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate("/student/documents")} className="w-full mt-auto pt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Document</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Recent Attendance */}
                    <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                            Recent Attendance
                        </h3>
                        <div className="space-y-2">
                            {Array.isArray(data.attendance) && data.attendance.length > 0 ? (
                                data.attendance.slice(0, 3).map((log) => (
                                    <div key={log.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {log.timeIn ? formatAttendanceTime(log.timeIn) : "N/A"} - {log.timeOut ? formatAttendanceTime(log.timeOut) : "In Progress"}
                                        </span>
                                        <span className="font-medium text-blue-600">{formatDuration(log.durationMinutes)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No attendance records found</p>
                                </div>
                            )}
                        </div>
                        <button onClick={() => navigate("/student/attendance")} className="w-full mt-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">View Full Calendar</button>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Building2 className="w-5 h-5 mr-2 text-green-600" />
                            Internship Details
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{data.student.company || "Not assigned"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Supervisor</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{data.student.supervisor || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Program</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{data.student.program} - Year {data.student.year} Section {data.student.section}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcements */}
            <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Announcements
                    </h3>
                    <button
                        type="button"
                        onClick={() => navigate("/student/announcements")}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                    >
                        View all
                    </button>
                </div>
                <div className="space-y-3">
                    {Array.isArray(data.announcements) && data.announcements.length > 0 ? (
                        data.announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="p-4 bg-gray-50 dark:bg-[#1c1c1f] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-[#212124] transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{announcement.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{announcement.content}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{announcement.date}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No announcements available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentOverview;
