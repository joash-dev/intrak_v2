import React, { useEffect, useState } from "react";
import {
  Wrench,
  Clock,
  //Mail,
  RefreshCw,
  LogOut,
} from "lucide-react";
import api from "../services/api";
import { devLog } from "../utils/devLog";

const MaintenancePage: React.FC = () => {
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in and get user info
    const userString = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (userString && token) {
      try {
        const userData = JSON.parse(userString);
        setUser(userData);
      } catch (error) {
        devLog.error("Error parsing user data:", error);
      }
    }
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      setIsChecking(true);
      const response = await api.get("/admin/maintenance-status");
      const data = response.data;

      // If maintenance mode is disabled, redirect to login
      if (!data.maintenanceMode) {
        window.location.href = "/login";
      }

      setLastChecked(new Date());
    } catch (error) {
      devLog.error("Error checking maintenance status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    try {
      devLog.log("Logging out user...");

      // Clear all localStorage items
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Clear any other potential auth-related items
      localStorage.clear();

      devLog.log("User logged out successfully");

      // Force redirect to login page
      window.location.replace("/login");
    } catch (error) {
      devLog.error("Error during logout:", error);
      // Fallback: still try to redirect
      window.location.replace("/login");
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-300 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-indigo-300 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-blue-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-indigo-400 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <img
            src="/just_logo.png"
            alt="INTRAK Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg object-cover"
          />
          <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            INTRAK
          </span>
        </div>

        {/* Logout Button Only */}
        {user && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-180px)] sm:min-h-[calc(100vh-160px)] p-4">
        <div className="max-w-xl w-full">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <div className="mx-auto w-32 h-32 flex items-center justify-center mb-3">
              <img
                src="/logo_intrak.png"
                alt="INTRAK Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">
              SYSTEM MAINTENANCE
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
              We're currently performing scheduled maintenance
            </p>
          </div>

          {/* Main Information Card */}
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-blue-200/50 dark:border-gray-700/50 p-6 mb-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Temporary Service Interruption
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                Our system is currently undergoing scheduled maintenance to
                improve performance and add new features. We apologize for any
                inconvenience this may cause.
              </p>

              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Duration: Please check back in a few hours
                </span>
                <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse"
                  style={{ width: "65%" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <button
              onClick={checkMaintenanceStatus}
              disabled={isChecking}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl font-semibold text-base shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              />
              <span>{isChecking ? "Checking..." : "Check Again"}</span>
            </button>

            {lastChecked && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          We Learn As One
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Thank you for your patience during this maintenance period.
        </p>
      </div>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Confirm Logout
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to logout? You will need to login again to
                access the system.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
