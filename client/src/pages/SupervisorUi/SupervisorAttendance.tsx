import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Eye,
  Download,
  Loader2,
  Calendar,
  QrCode,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type { AttendanceLog } from "../../services/supervisorService";
import toast from "react-hot-toast";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";

const SupervisorAttendance = () => {
  const [activeTab, setActiveTab] = useState("logs");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }
      const fetchedLogs = await supervisorService.getAttendanceLogs(filters);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      toast.error("Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  const stats = {
    pending: logs.filter((log) => log.status === "pending").length,
    approved: logs.filter((log) => log.status === "approved").length,
    rejected: logs.filter((log) => log.status === "rejected").length,
    totalHoursToday: logs
      .filter((log) => {
        const today = new Date().toISOString().split("T")[0];
        return log.date.split("T")[0] === today && log.status !== "rejected";
      })
      .reduce((sum, log) => sum + log.durationMinutes / 60, 0)
      .toFixed(2),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors["pending"];
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (log: AttendanceLog) => {
    setSelectedLog(log);
    setVerifyAction("approve");
    setRemarks("");
    setShowVerifyModal(true);
  };

  const handleReject = async (log: AttendanceLog) => {
    setSelectedLog(log);
    setVerifyAction("reject");
    setRemarks("");
    setShowVerifyModal(true);
  };

  const handleSubmitVerification = async () => {
    if (!selectedLog || !verifyAction) return;

    if (verifyAction === "reject" && !remarks.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      if (verifyAction === "approve") {
        await supervisorService.approveAttendance(selectedLog.id);
        toast.success(`Attendance approved for ${selectedLog.studentName}`);
      } else {
        await supervisorService.rejectAttendance(selectedLog.id, remarks);
        toast.success(`Attendance rejected for ${selectedLog.studentName}`);
      }
      setShowVerifyModal(false);
      setSelectedLog(null);
      setVerifyAction(null);
      setRemarks("");
      await fetchAttendanceLogs();
    } catch (error) {
      console.error(`Error ${verifyAction === "approve" ? "approving" : "rejecting"} attendance:`, error);
      toast.error(`Failed to ${verifyAction} attendance`);
    }
  };

  const [scannerKey, setScannerKey] = useState(0);
  const [showScanSuccessModal, setShowScanSuccessModal] = useState(false);
  const [qrAction, setQrAction] = useState<'login' | 'logout' | null>(null);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isProcessingRef = useRef(false);

  const stopScanner = useCallback(() => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }
    if (codeReaderRef.current) {
      try {
        const reader = codeReaderRef.current as unknown as {
          reset?: () => void;
        };
        reader.reset?.();
      } catch (error) {
        console.warn("Failed to reset QR reader", error);
      }
      codeReaderRef.current = null;
    }
  }, []);

  const requestCoordinates = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      return undefined;
    }

    return new Promise<{ latitude: number; longitude: number } | undefined>(
      (resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => resolve(undefined),
          {
            enableHighAccuracy: true,
            timeout: 5000,
          }
        );
      }
    );
  }, []);

  const handleTokenVerification = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim();
      if (!token) {
        setScanError("QR code did not contain a valid token.");
        return;
      }

      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;

      stopScanner();
      setScanLoading(true);
      setScanError(null);

      try {
        const coords = await requestCoordinates();
        const response = await supervisorService.verifyAttendanceWithQR({
          token,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        setScannedToken(token);
        setManualToken("");
        setQrAction(response.action);
        toast.success("Attendance verified via QR code");
        setShowScanSuccessModal(true);
        await fetchAttendanceLogs();
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to verify QR code");
        setScanError(message);
        toast.error(message);
        setScannedToken(null);
        setScannerKey((prev) => prev + 1);
      } finally {
        setScanLoading(false);
        isProcessingRef.current = false;
      }
    },
    [fetchAttendanceLogs, requestCoordinates, stopScanner]
  );

  const restartScanner = useCallback(() => {
    stopScanner();
    setScannedToken(null);
    setScanError(null);
    setManualToken("");
    setScannerKey((prev) => prev + 1);
    isProcessingRef.current = false;
  }, [stopScanner]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualToken.trim()) {
      setScanError("Please enter a QR token before verifying.");
      return;
    }
    handleTokenVerification(manualToken);
  };

  useEffect(() => {
    if (activeTab !== "scanner") {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      if (!videoRef.current) {
        setScanError(
          "Camera preview is not available. Please ensure your device has an active camera."
        );
        return;
      }

      setScanError(null);
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      try {
        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              handleTokenVerification(result.getText());
            }
          }
        );
        scannerControlsRef.current = controls;
      } catch (error: any) {
        const message =
          error?.message ||
          "Unable to access the camera. Please allow camera permissions and try again.";
        setScanError(message);
        toast.error(message);
        stopScanner();
      }
    };

    startScanner();

    return () => {
      stopScanner();
      isProcessingRef.current = false;
    };
  }, [activeTab, handleTokenVerification, scannerKey, stopScanner]);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-xl"></div>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
        </div>

        {/* Logs List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const companyName =
    user?.companyName ||
    user?.company ||
    user?.company?.name ||
    "Company";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1.5 sm:mb-2">Attendance Management</h1>
        <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-0.5 sm:mb-1">Company: {companyName}</p>
        <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
          Review and verify intern attendance logs - Track time and approve
          hours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Review */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Pending Review
            </p>
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.pending}
          </p>
          <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {stats.pending} pending
          </span>
        </div>

        {/* Approved */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Approved</p>
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.approved}
          </p>
          <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
            Approved logs
          </span>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Rejected</p>
            <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.rejected}
          </p>
          <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
            Rejected logs
          </span>
        </div>

        {/* Hours Today */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
              Hours Today
            </p>
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            {stats.totalHoursToday}
          </p>
          <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
            Total hours
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-sm flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm ${activeTab === "logs"
            ? "bg-purple-600 text-white shadow"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Attendance Logs</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("scanner");
            restartScanner();
          }}
          className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm ${activeTab === "scanner"
            ? "bg-purple-600 text-white shadow"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
        >
          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>QR Scanner</span>
        </button>
      </div>

      {activeTab === "scanner" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Scan Intern QR Code
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Position the intern&apos;s QR code inside the frame or enter the token manually below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative bg-black rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center">
              {!scannedToken && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
              )}
              {scannedToken && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-center px-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2 text-green-300 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      <span>QR token verified</span>
                    </div>
                    <p className="text-sm break-all">{scannedToken}</p>
                    <button
                      type="button"
                      onClick={restartScanner}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Scan Another Intern
                    </button>
                  </div>
                </div>
              )}
              {scanLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {scanError && (
                <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-900/40 dark:text-red-200 rounded-lg px-4 py-3">
                  {scanError}
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <QrCode className="w-4 h-4" />
                  <span>Manual Token Entry</span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If the camera is unavailable, type the code displayed on the intern&apos;s device.
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Enter QR token manually"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    disabled={scanLoading}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={scanLoading || !manualToken.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Token
                    </button>
                    <button
                      type="button"
                      onClick={restartScanner}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tip: Allow camera access when prompted for the most seamless scanning experience.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Verify Success Modal */}
      {showScanSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}
          onClick={() => {
            setShowScanSuccessModal(false);
            setQrAction(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {qrAction === 'logout' 
                ? 'Intern logged out successfully' 
                : 'Intern logged in successfully'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              QR verification completed and attendance recorded.
            </p>
            <button
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => {
                setShowScanSuccessModal(false);
                setQrAction(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {activeTab === "logs" && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchAttendanceLogs}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Refresh
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLogs.length} of {logs.length} logs
          </p>

          {/* Logs Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Time In/Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                            {log.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.studentNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(log.date)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatTime(log.timeIn)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(log.timeOut)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(log.durationMinutes / 60).toFixed(2)}h
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === "pending" ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApprove(log)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(log)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No attendance logs found
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ margin: "0" }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Attendance Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedLog.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLog.studentName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedLog.studentNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedLog.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                      selectedLog.status
                    )}`}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time In</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedLog.timeIn)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time Out</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(selectedLog.timeOut)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hours Worked</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(selectedLog.durationMinutes / 60).toFixed(2)} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Method</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedLog.method}
                  </p>
                </div>
              </div>

              {selectedLog.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedLog.location}
                  </p>
                  {selectedLog.coordinates && (
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {selectedLog.coordinates}
                    </p>
                  )}
                </div>
              )}

              {selectedLog.remarks && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Remarks</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedLog.remarks}
                  </p>
                </div>
              )}

              {selectedLog.status === "pending" && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedLog);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedLog);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerifyModal && selectedLog && verifyAction && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ margin: "0" }}
          onClick={() => {
            setShowVerifyModal(false);
            setSelectedLog(null);
            setVerifyAction(null);
            setRemarks("");
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {verifyAction === "approve"
                ? "Verify Attendance"
                : "Reject Attendance"}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedLog.studentName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(selectedLog.date).toLocaleDateString()}
              </p>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {verifyAction === "approve"
                    ? "Notes (Optional)"
                    : "Reason (Required)"}
                </label>
                {selectedLog && verifyAction && (
                  <AIGenerateButton
                    onGenerate={async () => {
                      return aiService.generateAttendanceNote({
                        attendanceLogId: selectedLog.id,
                        action: verifyAction,
                      });
                    }}
                    onSuccess={(generatedText) => {
                      setRemarks(generatedText);
                      toast.success('Note generated successfully');
                    }}
                    size="sm"
                    variant="outline"
                  />
                )}
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder={
                  verifyAction === "approve"
                    ? "Add verification notes..."
                    : "Enter reason for rejection..."
                }
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedLog(null);
                  setVerifyAction(null);
                  setRemarks("");
                }}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitVerification}
                disabled={verifyAction === "reject" && !remarks.trim()}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  verifyAction === "approve"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {verifyAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorAttendance;
