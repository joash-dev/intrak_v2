import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { adminService } from "./services/adminService";
import { settingsService } from "./services/settingsService";
import { SocketProvider } from "./contexts/SocketContext";
import i18n from "i18next";
import PageLoader from "./components/common/PageLoader";

// Lazy load pages
const Login = React.lazy(() => import("./pages/AuthUi/Login"));
const Dashboard = React.lazy(() => import("./pages/StudentUi/Dashboard"));
const DashboardCoordinator = React.lazy(() => import("./pages/CoordinatorUi/DashboardCoordinator"));
const DashboardInstructor = React.lazy(() => import("./pages/InstructorUi/DashboardInstructor"));
const DashboardIndustryPartner = React.lazy(() => import("./pages/SupervisorUi/SupervisorDashboard"));
const AdminPage = React.lazy(() => import("./pages/AdminUi/AdminPage"));
const MaintenancePage = React.lazy(() => import("./pages/MaintenancePage"));

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const token = localStorage.getItem("accessToken");
  const userString = localStorage.getItem("user");

  // not logged in
  if (!token || !userString) return <Navigate to="/login" replace />;

  // parse user safely and normalize role
  let role: string | null = null;
  try {
    const parsed = JSON.parse(userString);
    role = (parsed?.role || "").toString().toLowerCase();
  } catch (err) {
    // corrupted user object — clear and force re-login
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // normalize allowed roles and check
  const allowed = allowedRoles.map((r) => r.toLowerCase());
  if (!role || !allowed.includes(role)) {
    return <Navigate to="/login" replace />; // or an /unauthorized page
  }

  return <>{children}</>;
};

const MaintenanceWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await adminService.checkMaintenanceStatus();
        setMaintenanceMode(status.maintenanceMode);
      } catch (error) {
        console.error("Error checking maintenance status:", error);
        setMaintenanceMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenance();
  }, []);

  // Show loading state while checking maintenance
  if (isLoading) {
    return <PageLoader />;
  }

  // Show maintenance page if maintenance mode is enabled
  if (maintenanceMode) {
    return <MaintenancePage />;
  }

  // Show normal app if maintenance mode is disabled
  return <>{children}</>;
};

const App: React.FC = () => {
  useEffect(() => {
    const prefs = settingsService.loadAppPreferences();
    settingsService.applyTheme(prefs.theme);
    i18n.changeLanguage(prefs.language || "en");
  }, []);

  return (
    <SocketProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/student/dashboard"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Dashboard />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            />

            <Route
              path="/coordinator/dashboard"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["coordinator"]}>
                    <DashboardCoordinator />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            />

            <Route
              path="/instructor/dashboard"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["instructor"]}>
                    <DashboardInstructor />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            />

            <Route
              path="/industry-partner/dashboard"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["industry_partner"]}>
                    <DashboardIndustryPartner />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            />

            {/* Admin routes bypass maintenance mode */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* default + catch-all */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SocketProvider>
  );
};

export default App;
