import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/AuthUi/Login";
import Dashboard from "./pages/StudentUi/Dashboard";
import DashboardCoordinator from "./pages/CoordinatorUi/DashboardCoordinator";
import DashboardInstructor from "./pages/InstructorUi/DashboardInstructor";
import DashboardIndustryPartner from "./pages/SupervisorUi/SupervisorDashboard";
import AdminPage from "./pages/AdminUi/AdminPage";

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute allowedRoles={["coordinator"]}>
              <DashboardCoordinator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["instructor"]}>
              <DashboardInstructor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/industry-partner/dashboard"
          element={
            <ProtectedRoute allowedRoles={["industry_partner"]}>
              <DashboardIndustryPartner />
            </ProtectedRoute>
          }
        />

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
    </BrowserRouter>
  );
};

export default App;
