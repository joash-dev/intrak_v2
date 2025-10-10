import { useState } from "react";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Eye,
  Download,
  QrCode,
  MapPin,
  Smartphone,
  Camera,
  ScanLine,
} from "lucide-react";

// Note: Install with: npm install react-qr-scanner
// For this demo, we'll use a simulated scanner since react-qr-scanner requires additional setup
// In production, replace the SimulatedQRScanner with the real implementation shown below

const IndustryAttendanceVerification = () => {
  const [activeTab, setActiveTab] = useState("verify");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedDate, setSelectedDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const attendanceLogs = [
    {
      id: "1",
      studentId: "2021-001",
      studentName: "Maria Santos",
      avatar: "MS",
      date: "2024-10-05",
      timeIn: "08:00 AM",
      timeOut: "05:00 PM",
      hoursWorked: 8,
      status: "pending",
      method: "QR Code",
      location: "Main Office - Building A",
      coordinates: "16.4023° N, 120.5960° E",
      remarks: "On-time arrival",
      submittedAt: "2 hours ago",
    },
    {
      id: "2",
      studentId: "2021-001",
      studentName: "Maria Santos",
      avatar: "MS",
      date: "2024-10-04",
      timeIn: "08:15 AM",
      timeOut: "05:00 PM",
      hoursWorked: 7.75,
      status: "pending",
      method: "QR Code",
      location: "Main Office - Building A",
      coordinates: "16.4023° N, 120.5960° E",
      remarks: "Slightly late",
      submittedAt: "1 day ago",
    },
    {
      id: "3",
      studentId: "2021-002",
      studentName: "Juan Dela Cruz",
      avatar: "JD",
      date: "2024-10-05",
      timeIn: "08:00 AM",
      timeOut: "05:30 PM",
      hoursWorked: 8.5,
      status: "pending",
      method: "GPS",
      location: "Remote Work",
      coordinates: "16.4120° N, 120.5930° E",
      remarks: "Extra hours worked",
      submittedAt: "3 hours ago",
    },
    {
      id: "4",
      studentId: "2021-003",
      studentName: "Ana Reyes",
      avatar: "AR",
      date: "2024-10-03",
      timeIn: "08:00 AM",
      timeOut: "05:00 PM",
      hoursWorked: 8,
      status: "approved",
      method: "QR Code",
      location: "Main Office - Building A",
      coordinates: "16.4023° N, 120.5960° E",
      remarks: "Regular shift",
      submittedAt: "2 days ago",
      approvedAt: "1 day ago",
      approvedBy: "You",
    },
  ];

  const stats = {
    pending: attendanceLogs.filter((log) => log.status === "pending").length,
    approved: attendanceLogs.filter((log) => log.status === "approved").length,
    rejected: attendanceLogs.filter((log) => log.status === "rejected").length,
    totalHoursToday: attendanceLogs
      .filter((log) => log.date === "2024-10-05" && log.status !== "rejected")
      .reduce((sum, log) => sum + log.hoursWorked, 0)
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

  const getMethodIcon = (method: string) => {
    if (method === "QR Code") return <QrCode className="w-4 h-4" />;
    if (method === "GPS") return <MapPin className="w-4 h-4" />;
    return <Smartphone className="w-4 h-4" />;
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesDate = selectedDate === "all" || log.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleApprove = (log: any) => {
    if (
      window.confirm(
        `Approve attendance for ${log.studentName} on ${log.date}?`
      )
    ) {
      alert(`✅ Attendance approved for ${log.studentName}`);
      // API call here
    }
  };

  const handleReject = (log: any) => {
    const reason = prompt(
      `Reject attendance for ${log.studentName}?\n\nPlease provide a reason:`
    );
    if (reason && reason.trim()) {
      alert(`❌ Attendance rejected for ${log.studentName}\nReason: ${reason}`);
      // API call here
    }
  };

  // Handle QR code scan
  const handleScan = (data: string | null) => {
    if (data) {
      try {
        // Parse QR code data (assuming JSON format)
        const qrData = JSON.parse(data);

        // Validate QR data structure
        if (qrData.studentId && qrData.action) {
          const mockScanData = {
            studentId: qrData.studentId,
            studentName: qrData.studentName || "Unknown Student",
            avatar: qrData.studentName
              ? qrData.studentName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
              : "??",
            action: qrData.action, // "time-in" or "time-out"
            timestamp: new Date().toLocaleTimeString(),
            location: "Main Office - Building A",
            date: new Date().toISOString().split("T")[0],
          };

          setScanResult(mockScanData);
          setShowQRScanner(false);
          setScanError(null);
        } else {
          setScanError("Invalid QR code format");
        }
      } catch (error) {
        // If not JSON, treat as plain student ID
        const mockScanData = {
          studentId: data,
          studentName: "Student " + data,
          avatar: "ST",
          action: "time-in",
          timestamp: new Date().toLocaleTimeString(),
          location: "Main Office - Building A",
          date: new Date().toISOString().split("T")[0],
        };

        setScanResult(mockScanData);
        setShowQRScanner(false);
        setScanError(null);
      }
    }
  };

  // const handleScanError = (error: any) => {
  //console.error("QR Scan Error:", error);
  //setScanError("Camera access denied or error occurred");
  // };

  const handleConfirmScan = () => {
    if (scanResult) {
      alert(
        `✅ ${
          scanResult.action === "time-in" ? "Time In" : "Time Out"
        } recorded for ${scanResult.studentName} at ${scanResult.timestamp}`
      );
      // API call to record attendance
      setScanResult(null);
    }
  };

  const openQRScanner = () => {
    setScanError(null);
    setShowQRScanner(true);

    // For demo: Simulate scan after 3 seconds
    setTimeout(() => {
      const mockQRData = JSON.stringify({
        studentId: "2021-001",
        studentName: "Maria Santos",
        action: "time-in",
      });
      handleScan(mockQRData);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Attendance Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Scan QR codes and review intern attendance logs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rejected
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats.rejected}
              </p>
            </div>
            <X className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hours Today
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.totalHoursToday}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab("verify")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "verify"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>QR Code Verification</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "logs"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Attendance Logs</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* QR Verification Tab */}
          {activeTab === "verify" && (
            <div className="space-y-6">
              {/* QR Scanner Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Scan Student QR Code
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use your device camera to scan the student's attendance QR
                    code for instant time-in or time-out verification
                  </p>
                  <button
                    onClick={openQRScanner}
                    className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Open QR Scanner</span>
                  </button>

                  {scanError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {scanError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Today's Check-ins
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    12
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Currently On-site
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    8
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Today's Check-outs
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    4
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  How to Use QR Scanner
                </h4>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    Click "Open QR Scanner" button above
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    Allow camera access when prompted by your browser
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    Ask student to show their QR code from the mobile app
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">4.</span>
                    Point your camera at the QR code until it's detected
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">5.</span>
                    Confirm the student details and time-in/time-out action
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Attendance Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
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
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Dates</option>
                    <option value="2024-10-05">Today (Oct 5)</option>
                    <option value="2024-10-04">Yesterday (Oct 4)</option>
                    <option value="2024-10-03">Oct 3</option>
                  </select>
                </div>
                <button
                  onClick={() => alert("Exporting...")}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>

              {/* Logs Table */}
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
                              {log.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.studentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.studentId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(log.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {log.timeIn}
                          </p>
                          <p className="text-sm text-gray-500">{log.timeOut}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {log.hoursWorked}h
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getMethodIcon(log.method)}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {log.method}
                            </span>
                          </div>
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
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Scanning QR Code
              </h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center">
              <div className="w-64 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                {/* Simulated Camera View */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 opacity-50"></div>
                <ScanLine className="w-48 h-48 text-purple-400 animate-pulse" />
                <div className="absolute inset-0 border-4 border-purple-500 rounded-lg"></div>

                {/* In production, replace with actual QR scanner:
                <QrReader
                  delay={300}
                  onError={handleScanError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                />
                */}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Position the QR code within the frame
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Camera access required. Allow permissions if prompted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scan Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                QR Code Scanned Successfully
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4 mb-6">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {scanResult.avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {scanResult.studentName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {scanResult.studentId}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Action:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {scanResult.action.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Time:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {scanResult.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(scanResult.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Location:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">
                      {scanResult.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setScanResult(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmScan}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
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
                  {selectedLog.avatar}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLog.studentName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedLog.studentId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedLog.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
                    {selectedLog.timeIn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time Out</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedLog.timeOut}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hours Worked</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedLog.hoursWorked} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Method</p>
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(selectedLog.method)}
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.method}
                    </p>
                  </div>
                </div>
              </div>

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

              <div>
                <p className="text-sm text-gray-500 mb-1">Remarks</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.remarks}
                </p>
              </div>

              {selectedLog.status === "approved" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Approved by {selectedLog.approvedBy} •{" "}
                    {selectedLog.approvedAt}
                  </p>
                </div>
              )}

              {selectedLog.status === "pending" && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedLog);
                      setSelectedLog(null);
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedLog);
                      setSelectedLog(null);
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
    </div>
  );
};

export default IndustryAttendanceVerification;
