import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { adminService } from "./services/adminService";
import { settingsService } from "./services/settingsService";
import { SocketProvider } from "./contexts/SocketContext";
import i18n from "i18next";
import PageLoader from "./components/common/PageLoader";

// Lazy load pages
const Login = React.lazy(() => import("./pages/AuthUi/Login"));
const StudentLayout = React.lazy(() => import("./pages/StudentUi/StudentLayout"));
const StudentOverview = React.lazy(() => import("./pages/StudentUi/StudentOverview"));
const StudentDocumentsTab = React.lazy(() => import("./pages/StudentUi/StudentDocumentsTab"));
const StudentTemplates = React.lazy(() => import("./pages/StudentUi/StudentTemplates"));
const StudentCompanySelection = React.lazy(() => import("./pages/StudentUi/StudentCompanySelection"));
const StudentCompanyPartnershipAssistance = React.lazy(() => import("./pages/StudentUi/StudentCompanyPartnershipAssistance"));
const StudentAttendanceTab = React.lazy(() => import("./pages/StudentUi/StudentAttendance"));
const StudentEvaluationsTab = React.lazy(() => import("./pages/StudentUi/StudentEvaluation"));
const StudentReportsTab = React.lazy(() => import("./pages/StudentUi/StudentReport"));
const StudentSettings = React.lazy(() => import("./pages/StudentUi/Settings"));
const StudentNotifications = React.lazy(() => import("./pages/StudentUi/StudentNotifications"));
const CoordinatorLayout = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorLayout"));
const CoordinatorOverview = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorOverview"));
const CoordinatorDocumentsTab = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorDocumentsTab"));
const CoordinatorCompanyManagement = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorCompanyManagement"));
const CoordinatorAnnouncementsTab = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorAnnouncement"));
const CoordinatorSettingsTab = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorSettings"));
const CoordinatorStudentManagement = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorStudentManagement"));
const CoordinatorReportsTab = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorReportsTab"));
const CoordinatorNotifications = React.lazy(() => import("./pages/CoordinatorUi/CoordinatorNotifications"));
const SupervisorLayout = React.lazy(() => import("./pages/SupervisorUi/SupervisorLayout"));
const SupervisorOverview = React.lazy(() => import("./pages/SupervisorUi/SupervisorOverview"));
const SupervisorAttendanceTab = React.lazy(() => import("./pages/SupervisorUi/SupervisorAttendanceTab"));
const SupervisorDocumentsTab = React.lazy(() => import("./pages/SupervisorUi/SupervisorDocumentsTab"));
const SupervisorEvaluationsTab = React.lazy(() => import("./pages/SupervisorUi/SupervisorEvaluationsTab"));
const SupervisorSettingsTab = React.lazy(() => import("./pages/SupervisorUi/SupervisorSettingsTab"));
const SupervisorNotifications = React.lazy(() => import("./pages/SupervisorUi/SupervisorNotifications"));
const AdminPage = React.lazy(() => import("./pages/AdminUi/AdminPage"));
const MaintenancePage = React.lazy(() => import("./pages/MaintenancePage"));

// Instructor Pages
const InstructorLayout = React.lazy(() => import("./pages/InstructorUi/InstructorLayout"));
const InstructorOverview = React.lazy(() => import("./pages/InstructorUi/InstructorOverview"));
const InstructorDocumentsTab = React.lazy(() => import("./pages/InstructorUi/InstructorDocuments"));
const InstructorStudentManagement = React.lazy(() => import("./pages/InstructorUi/InstructorStudentManagement"));
const InstructorApplications = React.lazy(() => import("./pages/InstructorUi/InstructorApplications"));
const InstructorTemplateManagement = React.lazy(() => import("./pages/InstructorUi/InstructorTemplateManagement"));
const DocumentChecklistTab = React.lazy(() => import("./pages/InstructorUi/InstructorDocumentChecklist"));
const InstructorMonitoringTab = React.lazy(() => import("./pages/InstructorUi/InstructorStudent"));
const InstructorReportsTab = React.lazy(() => import("./pages/InstructorUi/InstructorReportsTab"));
const InstructorSettings = React.lazy(() => import("./pages/InstructorUi/InstructorSettings"));
const InstructorNotifications = React.lazy(() => import("./pages/InstructorUi/InstructorNotifications"));

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
              path="/student"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentLayout />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentOverview />} />
              <Route path="documents" element={<StudentDocumentsTab />} />
              <Route path="templates" element={<StudentTemplates />} />
              <Route path="companies" element={<StudentCompanySelection />} />
              <Route path="partnership-assistance" element={<StudentCompanyPartnershipAssistance />} />
              <Route path="attendance" element={<StudentAttendanceTab />} />
              <Route path="evaluations" element={<StudentEvaluationsTab />} />
              <Route path="reports" element={<StudentReportsTab />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="notifications" element={<StudentNotifications />} />
            </Route>

            <Route
              path="/coordinator"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["coordinator"]}>
                    <CoordinatorLayout />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CoordinatorOverview />} />
              <Route path="students" element={<CoordinatorStudentManagement />} />
              <Route path="documents" element={<CoordinatorDocumentsTab />} />
              <Route path="companies" element={<CoordinatorCompanyManagement />} />
              <Route path="announcements" element={<CoordinatorAnnouncementsTab />} />
              <Route path="reports" element={<CoordinatorReportsTab />} />
              <Route path="settings" element={<CoordinatorSettingsTab />} />
              <Route path="notifications" element={<CoordinatorNotifications />} />
            </Route>

            <Route
              path="/instructor"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["instructor"]}>
                    <InstructorLayout />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<InstructorOverview />} />
              <Route path="students" element={<InstructorStudentManagement />} />
              <Route path="documents" element={<InstructorDocumentsTab />} />
              <Route path="applications" element={<InstructorApplications />} />
              <Route path="templates" element={<InstructorTemplateManagement />} />
              <Route path="checklist" element={<DocumentChecklistTab />} />
              <Route path="monitoring" element={<InstructorMonitoringTab />} />
              <Route path="reports" element={<InstructorReportsTab />} />
              <Route path="settings" element={<InstructorSettings />} />
              <Route path="notifications" element={<InstructorNotifications />} />
            </Route>

            <Route
              path="/industry-partner"
              element={
                <MaintenanceWrapper>
                  <ProtectedRoute allowedRoles={["industry_partner"]}>
                    <SupervisorLayout />
                  </ProtectedRoute>
                </MaintenanceWrapper>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SupervisorOverview />} />
              <Route path="attendance" element={<SupervisorAttendanceTab />} />
              <Route path="documents" element={<SupervisorDocumentsTab />} />
              <Route path="evaluations" element={<SupervisorEvaluationsTab />} />
              <Route path="settings" element={<SupervisorSettingsTab />} />
              <Route path="notifications" element={<SupervisorNotifications />} />
            </Route>

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
