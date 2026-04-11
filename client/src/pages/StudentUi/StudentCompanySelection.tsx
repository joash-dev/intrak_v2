import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle,
  Search,
  Loader2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  X,
  Info,
  UserMinus,
  FileWarning,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { companyService, type Company } from "../../services/companyService";
import { dashboardService } from "../../services/dashboardService";
import { documentService } from "../../services/documentService";
import api from "../../services/api";
import Skeleton from "../../components/Skeleton";
import toast from "react-hot-toast";

interface StudentCompanySelectionProps {
  onCompanyUpdate?: () => void;
}

interface CompanyApplication {
  id: string;
  companyId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  message?: string;
  rejectionReason?: string;
  appliedAt: string;
  reviewedAt?: string;
  company: Company;
  reviewer?: {
    name: string;
    email: string;
  };
}

const StudentCompanySelection: React.FC<StudentCompanySelectionProps> = () => {
  const { refreshStudentData } = useOutletContext<{ refreshStudentData: () => void }>() || { refreshStudentData: () => { } };

  const [companies, setCompanies] = useState<Company[]>([]);
  const [myApplications, setMyApplications] = useState<CompanyApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(false);
  const [resigning, setResigning] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const PRE_DEPLOYMENT_SLOTS: readonly { types: string[]; label: string }[] = [
    { types: ["APPLICATION_INTERNSHIP"], label: "Application for Internship" },
    { types: ["MEDICAL_CERTIFICATE"], label: "Medical Certificate" },
    { types: ["CERTIFICATION_UNITS"], label: "Certification of Units Earned" },
    { types: ["INTERNSHIP_RESUME"], label: "Internship Resume" },
    { types: ["CONSENT_FORM"], label: "Consent Form" },
    { types: ["ENDORSEMENT_LETTER", "ENDORSEMENT_LETTER_MULTI"], label: "Endorsement Letter" },
    { types: ["INTERNSHIP_RELEASE"], label: "Internship Release Form" },
    { types: ["RECORD_FILE"], label: "Record File" },
  ];

  const missingPreDeploymentDocs = useMemo(() => {
    const approvedTypes = new Set(
      myDocuments.filter((d) => d.status === "APPROVED").map((d) => d.type)
    );
    return PRE_DEPLOYMENT_SLOTS.filter(
      (slot) => !slot.types.some((t) => approvedTypes.has(t))
    );
  }, [myDocuments]);

  // Load companies, applications, and current student data
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onSync = () => {
      void loadData();
    };
    window.addEventListener("intrak:student-portal-sync", onSync);
    return () => window.removeEventListener("intrak:student-portal-sync", onSync);
  }, []);

  // Load company details when student has a company
  useEffect(() => {
    if (currentStudent?.company) {
      loadCompanyDetails();
    }
  }, [currentStudent?.company]);

  const loadCompanyDetails = async () => {
    if (!currentStudent?.company) return;

    try {
      setLoadingCompanyDetails(true);
      // Find company by name from the companies list
      const companiesData = await companyService.getAllCompanies();
      const foundCompany = companiesData.find(
        (c) => c.name === currentStudent.company
      );

      if (foundCompany) {
        // Fetch full company details by ID
        const fullDetails = await companyService.getCompanyById(foundCompany.id);
        setCompanyDetails(fullDetails);
      }
    } catch (err: any) {
      console.error("Error loading company details:", err);
      // Don't show error toast, just log it
    } finally {
      setLoadingCompanyDetails(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, studentData, applicationsData, docsData] = await Promise.all([
        companyService.getAllCompanies(),
        dashboardService.getDashboardData(),
        api.get("/company-applications/my-applications"),
        documentService.getStudentDocuments().catch(() => [] as any[]),
      ]);

      setCompanies(companiesData);
      setCurrentStudent(studentData.student);
      setMyApplications(applicationsData.data.applications || []);
      setMyDocuments(docsData);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load companies");
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (company: Company) => {
    setSelectedCompany(company);
    setApplicationMessage("");
    setApplicationError(null);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedCompany) return;

    try {
      setApplying(true);
      await api.post("/company-applications/apply", {
        companyId: selectedCompany.id,
        message: applicationMessage,
      });

      toast.success(`Application submitted to ${selectedCompany.name}!`);
      setShowApplicationModal(false);
      setSelectedCompany(null);
      setApplicationMessage("");

      // Reload data
      await loadData();
      if (refreshStudentData) {
        refreshStudentData();
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      const msg =
        error.response?.data?.message || "Failed to submit application";
      setApplicationError(msg);
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    try {
      await api.patch(`/company-applications/${applicationId}/withdraw`);
      toast.success("Application withdrawn successfully");
      await loadData();
      if (refreshStudentData) {
        refreshStudentData();
      }
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error(
        error.response?.data?.message || "Failed to withdraw application"
      );
    }
  };

  const handleResignFromPlacement = async () => {
    try {
      setResigning(true);
      await api.post("/company-applications/resign-placement");
      toast.success("You have resigned from your placement.");
      setShowResignModal(false);
      await loadData();
      if (refreshStudentData) {
        refreshStudentData();
      }
    } catch (error: any) {
      console.error("Error resigning from placement:", error);
      toast.error(
        error.response?.data?.message || "Failed to resign from placement"
      );
    } finally {
      setResigning(false);
    }
  };

  const getApplicationStatus = (companyId: string) => {
    return myApplications.find((app) => app.companyId === companyId);
  };

  const getAvailableSlots = (company: Company) => {
    const currentStudents = company.students?.length || 0;
    const maxSlots = company.maxSlots || 10;
    return maxSlots - currentStudents;
  };

  // Filter companies
  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Companies Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if student already has a company
  if (currentStudent?.company) {
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return "Not set";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const hoursProgress = currentStudent.totalHours
      ? Math.round(
        (currentStudent.completedHours / currentStudent.totalHours) * 100
      )
      : 0;

    return (
      <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            Company Assigned!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            You are currently assigned to:
          </p>

          {/* Company Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {currentStudent.company}
                </h4>
                {companyDetails?.industry && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md mb-2">
                    {companyDetails.industry}
                  </span>
                )}
              </div>
            </div>

            {/* Company Details */}
            {loadingCompanyDetails ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {companyDetails?.address && (
                  <div className="flex items-start space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {companyDetails.address}
                    </span>
                  </div>
                )}

                {companyDetails?.contactPerson && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Contact Person:</strong> {companyDetails.contactPerson}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {companyDetails?.contactEmail && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <a
                        href={`mailto:${companyDetails.contactEmail}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {companyDetails.contactEmail}
                      </a>
                    </div>
                  )}

                  {companyDetails?.contactNumber && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <a
                        href={`tel:${companyDetails.contactNumber}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {companyDetails.contactNumber}
                      </a>
                    </div>
                  )}
                </div>

                {companyDetails?.description && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {companyDetails.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supervisor Information */}
          {currentStudent.supervisor && (
            <div className="bg-gray-50 dark:bg-[#212124]/50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Supervisor
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {currentStudent.supervisor}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Internship Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-[#212124]/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Start Date
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {formatDate(currentStudent.startDate)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#212124]/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                End Date
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {formatDate(currentStudent.endDate)}
              </p>
            </div>
          </div>

          {/* Hours Progress */}
          {currentStudent.totalHours && (
            <div className="bg-gray-50 dark:bg-[#212124]/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Hours Progress
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentStudent.completedHours || 0} / {currentStudent.totalHours} hours
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-[#212124] rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(hoursProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {hoursProgress}% completed
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You can resign to leave this placement and apply elsewhere, or contact your instructor if you need help.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowResignModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              Resign from placement
            </button>
          </div>
        </div>
      </div>

      {showResignModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 overflow-y-auto"
          style={{ margin: "0" }}
        >
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6 max-h-[min(90vh,100%)] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-2">
                Resign from placement
              </h3>
              <button
                type="button"
                onClick={() => !resigning && setShowResignModal(false)}
                disabled={resigning}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Resign from this internship placement? Your assignment will be
                  cleared and you can apply to companies again.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 sm:space-y-0 space-y-2">
              <button
                type="button"
                onClick={() => setShowResignModal(false)}
                disabled={resigning}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResignFromPlacement}
                disabled={resigning}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {resigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resigning…
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Yes, resign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Company Applications
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Browse available companies and apply for your internship
            </p>
          </div>
        </div>
      </div>

      {/* My Applications Section */}
      {myApplications.length > 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Applications
          </h3>
          <div className="space-y-3">
            {myApplications.map((application) => (
              <div
                key={application.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 break-words">
                      {application.company.name}
                    </h4>
                    <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">
                        {application.company.address}
                      </span>
                    </div>
                    {application.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 max-h-48 overflow-y-auto overscroll-contain break-words whitespace-pre-wrap">
                        <strong>Message:</strong> {application.message}
                      </p>
                    )}
                    {application.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 max-h-40 overflow-y-auto overscroll-contain break-words whitespace-pre-wrap">
                        <strong>Rejection Reason:</strong>{" "}
                        {application.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Applied:{" "}
                      {new Date(application.appliedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {application.status === "PENDING" && (
                      <>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                        <button
                          onClick={() => handleWithdraw(application.id)}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Withdraw
                        </button>
                      </>
                    )}
                    {application.status === "APPROVED" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </span>
                    )}
                    {application.status === "REJECTED" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </span>
                    )}
                    {application.status === "WITHDRAWN" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        <X className="w-3 h-3 mr-1" />
                        Withdrawn
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies by name, location, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No companies found
            </p>
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const availableSlots = getAvailableSlots(company);
            const application = getApplicationStatus(company.id);
            const blocksReapply =
              application?.status === "PENDING" ||
              application?.status === "APPROVED";
            const canApply = !blocksReapply && availableSlots > 0;

            return (
              <div
                key={company.id}
                className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div className="flex-1 min-h-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {company.name}
                        </h3>
                        {company.industry && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {company.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <div className="space-y-2">
                  <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{company.address}</span>
                  </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{company.contactNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{company.contactEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>
                        {availableSlots > 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {availableSlots} slot{availableSlots !== 1 ? "s" : ""}{" "}
                            available
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            No slots available
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 shrink-0">
                  {blocksReapply ? (
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      {application!.status === "PENDING" && (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 w-full justify-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Application Pending
                        </span>
                      )}
                      {application!.status === "APPROVED" && (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 w-full justify-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approved
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {application?.status === "REJECTED" && (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 w-full justify-center text-sm">
                          <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          Rejected — you can apply again
                        </span>
                      )}
                      {application?.status === "WITHDRAWN" && (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 w-full justify-center text-sm">
                          <X className="w-4 h-4 mr-2 flex-shrink-0" />
                          Withdrawn — you can apply again
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleApply(company)}
                        disabled={!canApply}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${canApply
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 dark:bg-[#212124] text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        {availableSlots > 0 ? "Apply Now" : "No Slots"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 overflow-y-auto" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full p-6 max-h-[min(90vh,100%)] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Apply to {selectedCompany.name}
              </h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your application will be reviewed by your instructor. You'll
                    be notified once it's approved or rejected.
                  </p>
                </div>
              </div>

              {missingPreDeploymentDocs.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <FileWarning className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Incomplete pre-deployment documents
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                        Your instructor won't be able to approve this application until all pre-deployment documents are submitted and approved. Missing:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
                        {missingPreDeploymentDocs.map((slot) => (
                          <li key={slot.types[0]}>{slot.label}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Application Message (Optional)
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Why do you want to intern at this company? (Optional)"
                rows={4}
                maxLength={4000}
                className="w-full min-h-[6rem] max-h-60 resize-y overflow-y-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent break-words"
              />
            </div>

            {applicationError && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg p-3.5 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                  {applicationError}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                disabled={applying}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={applying}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCompanySelection;
