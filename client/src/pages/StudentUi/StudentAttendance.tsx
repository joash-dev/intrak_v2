import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  QrCode,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Loader2,
  Download,
  X,
} from "lucide-react";
import {
  attendanceService,
  type AttendanceLog,
  type AttendanceStats,
} from "../../services/attendanceService";
import { roundToOfficialTime } from "../../utils/attendanceCalculations";
import api from "../../services/api";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

const StudentAttendanceTab: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanSuccessModal, setShowScanSuccessModal] = useState(false);
  const [qrAction, setQrAction] = useState<'login' | 'logout' | null>(null);
  const [polling, setPolling] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrToken, setQrToken] = useState<string>("");
  const [qrExpiresAt, setQrExpiresAt] = useState<string>("");
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalHours: 0,
    completedHours: 0,
    verifiedDays: 0,
    pendingDays: 0,
    avgHoursPerDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [hasTimeInToday, setHasTimeInToday] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualTimeIn, setManualTimeIn] = useState("");
  const [manualTimeOut, setManualTimeOut] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");
  const [companyType, setCompanyType] = useState<'PUBLIC' | 'PRIVATE' | null>(null);
  const [worksOnSaturday, setWorksOnSaturday] = useState<boolean>(false);
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [showSaturdayPreferenceModal, setShowSaturdayPreferenceModal] = useState(false);
  const [saturdayPreferenceLoading, setSaturdayPreferenceLoading] = useState(false);
  const [ojtStartDate, setOjtStartDate] = useState<string | null>(null);

  const qrGeneratedAtRef = useRef<number>(0);
  const showQRModalRef = useRef(false);
  const hadOpenLogRef = useRef<boolean>(false); // Track if there was an open log before QR generation

  // Keep ref in sync with state for polling closure
  useEffect(() => {
    showQRModalRef.current = showQRModal;
  }, [showQRModal]);

  const CalendarIcon = Calendar;

  // Fetch attendance data and student/company info on component mount
  useEffect(() => {
    fetchAttendanceData();
    fetchStudentAndCompanyInfo();
  }, []);

  // Check time-in status when manual modal opens
  useEffect(() => {
    if (showManualModal) {
      checkTimeInStatus();
    }
  }, [showManualModal, manualDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const logs = await attendanceService.getAttendanceLogs();

      // Ensure logs is always an array
      const attendanceArray = Array.isArray(logs) ? logs : [];
      setAttendanceLogs(attendanceArray);

      const calculatedStats = await attendanceService.calculateStats(
        attendanceArray
      );
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Failed to load attendance data");
      // Set empty array on error to prevent crashes
      setAttendanceLogs([]);
      setStats({
        totalHours: 0,
        completedHours: 0,
        verifiedDays: 0,
        pendingDays: 0,
        avgHoursPerDay: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAndCompanyInfo = async () => {
    try {
      // Fetch student profile to get company info and Saturday preference
      const studentProfile = await api.get('/students/profile');
      const profile = studentProfile.data;
      
      if (profile.companyType !== undefined) {
        setCompanyType(profile.companyType);
      }
      if (profile.workingDays) {
        setWorkingDays(profile.workingDays);
      } else if (profile.companyType === 'PRIVATE') {
        // Default for private companies
        setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
      } else {
        // Default for public companies
        setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      }
      if (profile.worksOnSaturday !== undefined) {
        setWorksOnSaturday(profile.worksOnSaturday);
      } else if (profile.companyType === 'PRIVATE' && profile.company) {
        // Show Saturday preference modal if student is in private company and hasn't set preference
        setShowSaturdayPreferenceModal(true);
      }
      // Store OJT start date
      if (profile.startDate) {
        setOjtStartDate(profile.startDate);
      }
    } catch (error) {
      console.error("Error fetching student/company info:", error);
    }
  };

  const handleSaveSaturdayPreference = async (preference: boolean) => {
    try {
      setSaturdayPreferenceLoading(true);
      // Get student ID from profile
      const studentProfile = await api.get('/students/profile');
      const studentId = studentProfile.data.id;
      
      await attendanceService.updateSaturdayPreference(studentId, preference);
      setWorksOnSaturday(preference);
      setShowSaturdayPreferenceModal(false);
      toast.success("Saturday work preference saved successfully");
    } catch (error: any) {
      console.error("Error saving Saturday preference:", error);
      toast.error(error.message || "Failed to save Saturday preference");
    } finally {
      setSaturdayPreferenceLoading(false);
    }
  };

  const progress =
    stats.totalHours > 0 ? (stats.completedHours / stats.totalHours) * 100 : 0;

  const checkTimeInStatus = async () => {
    try {
      const hasTimeIn = await attendanceService.checkTimeInStatus(manualDate);
      setHasTimeInToday(hasTimeIn);
    } catch (error) {
      console.error("Error checking time-in status:", error);
    }
  };

  const handleManualLog = async (action: "time-in" | "time-out") => {
    try {
      setManualLoading(true);

      const logData: any = {
        studentId: "me", // Server will resolve this to the actual student ID
        date: manualDate,
        action,
        remarks: manualRemarks || undefined,
      };

      if (action === "time-in") {
        logData.timeIn = `${manualDate}T${manualTimeIn}:00`;
      } else {
        logData.timeOut = `${manualDate}T${manualTimeOut}:00`;
      }

      await attendanceService.logAttendance(logData);

      toast.success(
        `${action === "time-in" ? "Time-in" : "Time-out"} logged successfully`
      );
      setShowManualModal(false);
      setManualRemarks("");
      setManualTimeIn("");
      setManualTimeOut("");

      // Refresh attendance data
      await fetchAttendanceData();
    } catch (error) {
      console.error(`Error logging ${action}:`, error);
      toast.error(`Failed to log ${action}`);
    } finally {
      setManualLoading(false);
    }
  };

  const handleOpenManualModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setManualDate(today);
    setManualTimeIn("");
    setManualTimeOut("");
    setManualRemarks("");
    setShowManualModal(true);
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Day details modal state
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayLogs, setSelectedDayLogs] = useState<any[]>([]);

  // Helper function to check if a day is an expected working day
  const isExpectedWorkingDay = (day: number): boolean => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    
    // Map day numbers to day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Never treat Sunday as a working day
    if (dayOfWeek === 0) {
      return false;
    }
    
    // If no working days are set, default to Mon-Fri (weekdays)
    if (!workingDays || workingDays.length === 0) {
      // Default to Mon-Fri if no working days set
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    // For private companies, check Saturday preference
    if (companyType === 'PRIVATE' && dayName === 'Saturday') {
      return worksOnSaturday;
    }
    
    // If workingDays is set, check if the day is explicitly included
    // But also default weekdays (Mon-Fri) to working days if not explicitly excluded
    if (workingDays.includes(dayName)) {
      return true;
    }
    
    // Fallback: if it's a weekday (Mon-Fri) and workingDays is set but doesn't explicitly exclude it,
    // treat it as a working day (this handles cases where workingDays might be incomplete)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return true;
    }
    
    return false;
  };

  // Helper function to check if a day is absent (expected but no log)
  const isAbsentDay = (day: number): boolean => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const dayDate = new Date(dateStr);
    const dayOfWeek = dayDate.getDay();
    
    // Never mark weekends (Sunday = 0, Saturday = 6) as absent
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if date is in the future - don't mark future dates as absent
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    if (dayDate > today) {
      return false;
    }
    
    // IMPORTANT: If student doesn't have a start date, don't mark any days as absent
    if (!ojtStartDate) {
      return false;
    }
    
    // Check if OJT has started - if date is before start date, don't mark as absent
    const startDate = new Date(ojtStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    // If the day is before the OJT start date, don't mark as absent
    if (dayDate < startDate) {
      return false;
    }
    
    // Check if student has actually started OJT (today must be >= start date)
    // If today is before start date, student hasn't started yet - don't mark as absent
    if (today < startDate) {
      return false;
    }
    
    // Check if it's an expected working day
    // If workingDays is empty or not set, default to Mon-Fri (weekdays)
    // If workingDays is set, check if the day is in the array
    const isWorkingDay = isExpectedWorkingDay(day);
    if (!isWorkingDay) {
      return false;
    }
    
    // Check if there's any attendance log for this day
    if (!Array.isArray(attendanceLogs)) return true;
    
    const hasLog = attendanceLogs.some((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr;
    });
    
    return !hasLog;
  };

  const getLogForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Ensure attendanceLogs is an array before calling find
    if (!Array.isArray(attendanceLogs)) {
      return null;
    }

    // Collect all logs for this date
    const logsForDay = attendanceLogs.filter((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr;
    });

    if (logsForDay.length === 0) return null;

    // Aggregate: sum duration across segments with official time rounding; verified only if all segments verified
    const totalMinutes = logsForDay.reduce(
      (sum, l) => {
        const roundedMinutes = roundToOfficialTime(Number(l.durationMinutes) || 0);
        return sum + roundedMinutes;
      },
      0
    );
    const allVerified = logsForDay.every((l) => !!l.verified);

    // Return a merged representation compatible with existing UI
    return {
      date: dateStr,
      durationMinutes: totalMinutes,
      verified: allVerified,
      segments: logsForDay,
    } as any;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleGenerateQR = async () => {
    try {
      setQrLoading(true);
      
      // Check if there's an open log (timeIn without timeOut) before generating QR
      try {
        const logs = await attendanceService.getAttendanceLogs();
        const today = new Date().toISOString().split("T")[0];
        const todayLogs = logs.filter(
          (l) => new Date(l.date).toISOString().split("T")[0] === today
        );
        // Check if there's an open log (has timeIn but no timeOut)
        hadOpenLogRef.current = todayLogs.some(
          (l) => l.timeIn && !l.timeOut
        );
      } catch (e) {
        // If we can't check, assume no open log
        hadOpenLogRef.current = false;
      }
      
      const qrData = await attendanceService.generateQRCode();
      setQrCode(qrData.qrCode);
      setQrToken(qrData.token); // Store the token for manual entry
      setQrExpiresAt(qrData.expiresAt);
      qrGeneratedAtRef.current = Date.now();
      setShowQRModal(true);
      toast.success("QR code generated successfully");
      // Start polling to detect supervisor verification shortly after scan
      startScanPolling();
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const startScanPolling = async () => {
    if (polling) return;
    setPolling(true);
    const startTime = Date.now();
    const timeoutMs = 60000; // 60 seconds
    const poll = async () => {
      try {
        const logs = await attendanceService.getAttendanceLogs();
        const today = new Date().toISOString().split("T")[0];
        const todays = logs.filter(
          (l) => new Date(l.date).toISOString().split("T")[0] === today
        );

        // Check for any log that is verified AND was updated AFTER the QR code was generated
        const verifiedLog = todays.find((l) => {
          const logUpdatedAt = new Date(l.updatedAt).getTime();
          // Allow a small buffer (e.g. 1 sec) or just strict inequality
          // If updated time is greater than generation time, it's a new verification
          return l.verified && l.timeIn && logUpdatedAt > qrGeneratedAtRef.current;
        });

        if (verifiedLog) {
          // Determine if it was a login or logout
          // If there was an open log (timeIn without timeOut) before QR generation,
          // and the verified log now has a timeOut, it means they logged out
          // Otherwise, if there was no open log and now there's a timeIn, it's a login
          const action = hadOpenLogRef.current && verifiedLog.timeOut 
            ? 'logout' 
            : 'login';
          setQrAction(action);
          setShowScanSuccessModal(true);
          setPolling(false);
          hadOpenLogRef.current = false; // Reset for next QR generation
          return;
        }
      } catch (e) {
        // ignore polling errors
      }
      if (Date.now() - startTime < timeoutMs && showQRModalRef.current) {
        setTimeout(poll, 3000);
      } else {
        setPolling(false);
      }
    };
    setTimeout(poll, 3000);
  };

  const handleExportDTR = async () => {
    try {
      setExportLoading(true);
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = currentDate.getFullYear();

      await attendanceService.exportDTRDocx({
        month: currentMonth,
        year: currentYear,
      });
      toast.success(`DTR Word document for ${monthYear} exported successfully!`);
    } catch (error) {
      console.error("Error exporting DTR:", error);
      toast.error("Failed to export DTR. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });


  if (loading) {
    return (
      <div className="space-y-6 font-outfit">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded-full" />
        </div>

        {/* Calendar/List View Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your daily attendance and monitor your OJT progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#212124] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed Hours
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completedHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {stats.totalHours.toFixed(1)} total
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#212124] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verified Days
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.verifiedDays}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {attendanceLogs.length} days
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#212124] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pendingDays}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                awaiting verification
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#212124] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg Hours/Day
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.avgHoursPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">hours per day</p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overall Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.completedHours.toFixed(1)} / {stats.totalHours.toFixed(1)}{" "}
              hours completed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              {progress.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={handleGenerateQR}
          disabled={qrLoading}
          className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {qrLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <QrCode className="w-6 h-6 text-white" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Generate QR
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan at company location
          </p>
        </button>

        <button
          onClick={handleOpenManualModal}
          className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Manual Log
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter time manually
          </p>
        </button>

        <button
          onClick={handleExportDTR}
          disabled={exportLoading}
          className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {exportLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Download className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Export DTR
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download as Word Document (.docx)
            </p>
          </div>
        </button>

      </div>

      {/* Attendance Records Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Records
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Track your daily attendance and progress
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 sm:space-x-2 transition-colors text-sm ${viewMode === "calendar"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-[#212124] text-gray-700 dark:text-gray-300"
                }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 sm:space-x-2 transition-colors text-sm ${viewMode === "list"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-[#212124] text-gray-700 dark:text-gray-300"
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {monthYear}
            </h3>
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={previousMonth}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
              // Hide Saturday if company is public or private company but student doesn't work Saturday
              const hideSaturday = day === "Sat" && (companyType === 'PUBLIC' || (companyType === 'PRIVATE' && !worksOnSaturday));
              if (hideSaturday) {
                return <div key={day} className="hidden"></div>;
              }
              return (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-400 py-1 sm:py-2"
                >
                  {day}
                </div>
              );
            })}

            {days.map((day, index) => {
              const log = day ? getLogForDay(day) : null;
              const isAbsent = day ? isAbsentDay(day) : false;
              const isExpected = day ? isExpectedWorkingDay(day) : false;
              
              // Hide Saturday if company is public or private company but student doesn't work Saturday
              let hideSaturday = false;
              if (day) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayOfWeek = date.getDay();
                hideSaturday = dayOfWeek === 6 && (companyType === 'PUBLIC' || (companyType === 'PRIVATE' && !worksOnSaturday));
              }
              
              if (hideSaturday) {
                return <div key={index} className="hidden"></div>;
              }
              
              return (
                <div
                  key={index}
                  className={`aspect-square p-1 sm:p-2 rounded-lg text-center relative ${day
                    ? isAbsent
                      ? "bg-red-100 dark:bg-red-900 cursor-pointer hover:shadow-md"
                      : log
                        ? log.verified
                          ? "bg-green-100 dark:bg-green-900 cursor-pointer hover:shadow-md"
                          : "bg-yellow-100 dark:bg-yellow-900 cursor-pointer hover:shadow-md"
                        : isExpected
                          ? "bg-gray-50 dark:bg-[#212124]"
                          : "bg-gray-50 dark:bg-[#212124] opacity-50"
                    : ""
                    }`}
                  onClick={() => {
                    if (!day || !log) return;
                    setSelectedDate(log.date);
                    setSelectedDayLogs(log.segments || []);
                    setShowDayModal(true);
                  }}
                >
                  {day && (
                    <>
                      <div className="font-medium text-xs sm:text-base text-gray-900 dark:text-white">
                        {day}
                      </div>
                      {isAbsent && (
                        <div className="text-[8px] sm:text-xs mt-0.5 sm:mt-1">
                          <div className="text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400">
                            Absent
                          </div>
                        </div>
                      )}
                      {log && (
                        <div className="text-[8px] sm:text-xs mt-0.5 sm:mt-1">
                          <div className="font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
                            {attendanceService.formatDuration(
                              log.durationMinutes
                            )}
                          </div>
                          <div className="text-[10px] sm:hidden font-medium text-gray-700 dark:text-gray-300">
                            {(() => {
                              // Apply official time rounding for mobile view too
                              const roundedMinutes = roundToOfficialTime(log.durationMinutes || 0);
                              const hours = Math.floor(roundedMinutes / 60);
                              const mins = roundedMinutes % 60;
                              if (hours > 0) {
                                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                              }
                              return mins > 0 ? `${mins}m` : '0m';
                            })()}
                          </div>
                          {log.verified ? (
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 mx-auto mt-0.5 sm:mt-1" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-600 mx-auto mt-0.5 sm:mt-1" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 dark:bg-green-900 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Verified</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 dark:bg-red-900 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Absent</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-50 dark:bg-[#212124] rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">No entry</span>
            </div>
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {showDayModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}
          onClick={() => setShowDayModal(false)}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Details {selectedDate ? `- ${selectedDate}` : ""}
              </h3>
              <button
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                onClick={() => setShowDayModal(false)}
              >
                Close
              </button>
            </div>

            {selectedDayLogs.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No logs for this day.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-4">Time In</th>
                      <th className="py-2 pr-4">Time Out</th>
                      <th className="py-2 pr-4">Hours</th>
                      <th className="py-2 pr-4">Method</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayLogs.map((seg, idx) => {
                      const timeInLabel = seg.timeIn
                        ? new Date(seg.timeIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-";
                      const timeOutLabel = seg.timeOut
                        ? new Date(seg.timeOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-";
                      const hoursLabel = attendanceService.formatDuration(
                        seg.durationMinutes || 0
                      );
                      return (
                        <tr
                          key={seg.id || idx}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-2 pr-4">{timeInLabel}</td>
                          <td className="py-2 pr-4">{timeOutLabel}</td>
                          <td className="py-2 pr-4">{hoursLabel}</td>
                          <td className="py-2 pr-4">
                            {seg.verificationMethod || "MANUAL"}
                          </td>
                          <td className="py-2 pr-4">
                            {seg.verified ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <AlertCircle className="w-4 h-4" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#212124]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {attendanceService.formatDate(log.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {attendanceService.formatTime(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {log.timeOut ? (
                      attendanceService.formatTime(log.timeOut)
                    ) : (
                      <span className="text-blue-600">In progress</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {attendanceService.formatDuration(log.durationMinutes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {log.verificationMethod}
                  </td>
                  <td className="px-6 py-4">
                    {log.verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    )}
                    {log.remarks && (
                      <p className="text-xs text-gray-500 mt-1">
                        {log.remarks}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Your QR Code
            </h2>
            <div className="bg-white p-4 rounded-lg mb-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-full max-w-xs mx-auto"
              />
            </div>
            <div className="space-y-2 text-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show this QR code to your supervisor for verification
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Valid for 5 minutes only
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Expires at:{" "}
                {qrExpiresAt
                  ? new Date(qrExpiresAt).toLocaleTimeString()
                  : "N/A"}
              </p>
              {/* Display token for manual entry */}
              {qrToken && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-[#212124]/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Token for manual entry:
                  </p>
                  <p className="text-xs font-mono text-gray-900 dark:text-white break-all select-all">
                    {qrToken}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Scan Success Modal */}
      {showScanSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}
          onClick={() => {
            setShowScanSuccessModal(false);
            setQrAction(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {qrAction === 'logout' 
                ? 'Logged out successfully' 
                : 'Logged in successfully'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Your attendance was verified via QR scan.
            </p>
            <button
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => {
                setShowScanSuccessModal(false);
                setQrAction(null);
                window.location.reload();
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manual Log Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Manual Attendance Log
            </h2>
            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                />
              </div>

              {/* Time-in Section */}
              {!hasTimeInToday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={manualTimeIn}
                    onChange={(e) => setManualTimeIn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                  />
                </div>
              )}

              {/* Time-out Section */}
              {hasTimeInToday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={manualTimeOut}
                    onChange={(e) => setManualTimeOut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  placeholder="Add any remarks..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-[#212124] dark:text-white resize-none"
                />
              </div>

              {/* Status Indicator */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {hasTimeInToday
                    ? "You have already logged time-in for this date. Log time-out to complete your attendance."
                    : "Log your time-in for this date."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleManualLog(hasTimeInToday ? "time-out" : "time-in")
                  }
                  disabled={
                    manualLoading ||
                    (hasTimeInToday ? !manualTimeOut : !manualTimeIn)
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {manualLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Logging...
                    </>
                  ) : hasTimeInToday ? (
                    "Log Time Out"
                  ) : (
                    "Log Time In"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saturday Work Preference Modal */}
      {showSaturdayPreferenceModal && companyType === 'PRIVATE' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ margin: "0" }}
          onClick={() => setShowSaturdayPreferenceModal(false)}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saturday Work Preference
              </h3>
              <button
                onClick={() => setShowSaturdayPreferenceModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your company operates on Saturdays. Do you work on Saturdays?
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="saturdayPreference"
                  value="yes"
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  onChange={() => {}}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Yes, I work on Saturdays</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="saturdayPreference"
                  value="no"
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  onChange={() => {}}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">No, I don't work on Saturdays</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSaturdayPreferenceModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const selected = (document.querySelector('input[name="saturdayPreference"]:checked') as HTMLInputElement)?.value;
                  if (selected === 'yes') {
                    handleSaveSaturdayPreference(true);
                  } else if (selected === 'no') {
                    handleSaveSaturdayPreference(false);
                  } else {
                    toast.error("Please select an option");
                  }
                }}
                disabled={saturdayPreferenceLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saturdayPreferenceLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Preference</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceTab;
