import { useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  Cpu,
  HardDrive,
  Database,
  Server,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import {
  adminService,
  type SystemInfo,
} from "../../services/adminService";
import { AdminOverviewSkeleton } from "../../components/LoadingStates/AdminSkeleton";

// Overview Component
const AdminOverview = () => {
  const [adminProfile] = useState<{ name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return { name: parsed.name || "Admin", email: parsed.email || "admin@intrak.com" };
        }
      }
    } catch (error) {
      console.error("Failed to parse stored user profile:", error);
    }
    return null;
  });

  // Fetch system info and stats
  const { data: systemInfo, loading: systemInfoLoading } = useOptimizedData<SystemInfo>(
    () => adminService.getSystemInfo(),
    [],
    { ttl: 30 * 1000 } // 30 seconds cache for real-time feel
  );

  const { data: stats, loading: statsLoading } = useOptimizedData(
    () => adminService.getDashboardStats(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: activities, loading: activitiesLoading } = useOptimizedData(
    () => adminService.getRecentActivities(),
    [],
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { data: alerts, loading: alertsLoading } = useOptimizedData(
    () => adminService.getSystemAlerts(),
    [],
    { ttl: 1 * 60 * 1000 } // 1 minute cache
  );

  const safeStats = stats || {
    totalStudents: 0,
    activeStudents: 0,
    totalCompanies: 0,
    totalCoordinators: 0,
    totalInstructors: 0,
    totalIndustryPartners: 0,
    pendingAttendance: 0,
    pendingDocuments: 0,
    systemUptime: "99.9%",
    recentRegistrations: 0,
    monthlyActiveUsers: 0,
  };

  const safeActivities = activities || [];
  const safeAlerts = alerts || [];

  const loading = systemInfoLoading || statsLoading || activitiesLoading || alertsLoading;

  const displayName = adminProfile?.name || "Admin User";

  // Generate simple sparkline data (mock for now, can be enhanced with real historical data)
  const generateSparkline = (value: number) => {
    const points = 20;
    const data = [];
    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * 10;
      data.push(Math.max(0, Math.min(100, value + variation)));
    }
    return data;
  };

  // Show loading state
  if (loading) {
    return <AdminOverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {displayName}!
        </h2>
        <p className="text-sm opacity-80">System Overview - Monitor system resources and performance</p>
      </div>

      {/* System Resource Metrics - Similar to VPS Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.serverLoad || 0}%
            </p>
          </div>
          {/* Simple sparkline */}
          <div className="h-12 w-full flex items-end space-x-0.5">
            {generateSparkline(systemInfo?.serverLoad || 0).map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-purple-500 rounded-t"
                style={{ height: `${val}%`, minHeight: '2px' }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {systemInfo?.cpuModel || 'Unknown'} ({systemInfo?.cpuCount || 0} cores)
          </p>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-gray-400">Memory Usage</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.memoryUsage || 0}%
            </p>
          </div>
          {/* Simple sparkline */}
          <div className="h-12 w-full flex items-end space-x-0.5">
            {generateSparkline(systemInfo?.memoryUsage || 0).map((val, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t"
                style={{ height: `${val}%`, minHeight: '2px' }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {systemInfo?.usedMemory || 0}GB / {systemInfo?.totalMemory || 0}GB
          </p>
        </div>

        {/* Disk Usage */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-green-400" />
              <p className="text-sm text-gray-400">Disk Usage</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.diskUsage || 0}%
            </p>
          </div>
          {/* Circular progress */}
          <div className="relative w-16 h-16 mx-auto">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - (systemInfo?.diskUsage || 0) / 100)}`}
                className="text-green-500 transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {systemInfo?.diskUsage || 0}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {systemInfo?.usedDisk || 0}GB / {systemInfo?.totalDisk || 0}GB
          </p>
        </div>

        {/* Database Size */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-400">Database</p>
            </div>
            <p className="text-lg font-bold text-white">
              {systemInfo?.databaseSize || '0 MB'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className={`text-sm font-semibold ${systemInfo?.databaseStatus === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {systemInfo?.databaseStatus === 'online' ? '✓ Online' : '✗ Offline'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Documents</p>
              <p className="text-sm font-semibold text-white">{systemInfo?.totalDocuments || 0}</p>
            </div>
          </div>
        </div>

        {/* System Uptime */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-gray-400">System Uptime</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-2">
            {systemInfo?.systemUptime || "0 days, 0 hours"}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div>
              <p>Version</p>
              <p className="text-white font-semibold">{systemInfo?.version || "2.1.3"}</p>
            </div>
            <div>
              <p>Environment</p>
              <p className="text-white font-semibold">{systemInfo?.environment || "production"}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <p className="text-sm text-gray-400">Active Users</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemInfo?.activeUsers || 0}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Total Students</span>
              <span className="text-white font-semibold">{safeStats.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Companies</span>
              <span className="text-white font-semibold">{safeStats.totalCompanies}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-400" />
              Recent Activities
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-admin-purple">
            {safeActivities.length > 0 ? (
              safeActivities.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
                      {activity.description}
                    </p>
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.user}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No Recent Activity</h4>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  System activity will appear here as users interact with the platform.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white dark:bg-[#19191c] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              System Alerts
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-admin-purple">
            {safeAlerts.length > 0 ? (
              safeAlerts.slice(0, 10).map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.priority === 'high' || alert.priority === 'critical'
                      ? 'bg-red-900/20 border border-red-800'
                      : alert.priority === 'medium'
                      ? 'bg-orange-900/20 border border-orange-800'
                      : 'bg-blue-900/20 border border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                      {alert.title}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.priority === 'high' || alert.priority === 'critical'
                        ? 'bg-red-900 text-red-300'
                        : alert.priority === 'medium'
                        ? 'bg-orange-900 text-orange-300'
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      {alert.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {alert.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">All Systems Operational</h4>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  No system alerts at this time. All services are running smoothly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
