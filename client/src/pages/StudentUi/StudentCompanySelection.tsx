import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { companyService, type Company } from "../../services/companyService";
import { dashboardService } from "../../services/dashboardService";
import api from "../../services/api";
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

const StudentCompanySelection: React.FC<StudentCompanySelectionProps> = ({
  onCompanyUpdate,
}) => {
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

  // Load companies, applications, and current student data
  useEffect(() => {
    loadData();
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
      const [companiesData, studentData, applicationsData] = await Promise.all([
        companyService.getAllCompanies(),
        dashboardService.getDashboardData(),
        api.get("/company-applications/my-applications"),
      ]);

      setCompanies(companiesData);
      setCurrentStudent(studentData.student);
      setMyApplications(applicationsData.data.applications || []);
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
      if (onCompanyUpdate) {
        onCompanyUpdate();
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit application"
      );
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
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      toast.error(
        error.response?.data?.message || "Failed to withdraw application"
      );
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
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 w-full"></div>

        {/* Search Skeleton */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-16 w-full"></div>

        {/* Companies Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
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
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {currentStudent.company}
                </h4>
                {companyDetails?.industry && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md mb-2">
                    {companyDetails.industry}
                  </span>
                )}
              </div>
            </div>

            {/* Company Details */}
            {loadingCompanyDetails ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
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
                        className="text-purple-600 dark:text-purple-400 hover:underline"
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
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {companyDetails.contactNumber}
                      </a>
                    </div>
                  )}
                </div>

                {companyDetails?.description && (
                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Start Date
              </p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {formatDate(currentStudent.startDate)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Hours Progress
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentStudent.completedHours || 0} / {currentStudent.totalHours} hours
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(hoursProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {hoursProgress}% completed
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                If you need to change your company, please contact your instructor.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Company Applications
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Browse available companies and apply for your internship
        </p>
      </div>

      {/* My Applications Section */}
      {myApplications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Applications
          </h3>
          <div className="space-y-3">
            {myApplications.map((application) => (
              <div
                key={application.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {application.company.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{application.company.address}</span>
                    </div>
                    {application.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Message:</strong> {application.message}
                      </p>
                    )}
                    {application.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies by name, location, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            const hasApplied = !!application;
            const canApply = !hasApplied && availableSlots > 0;

            return (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
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

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{company.address}</span>
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

                {hasApplied ? (
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    {application.status === "PENDING" && (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 w-full justify-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Application Pending
                      </span>
                    )}
                    {application.status === "APPROVED" && (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 w-full justify-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approved
                      </span>
                    )}
                    {application.status === "REJECTED" && (
                      <span className="inline-flex items-center px-3 py-2 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 w-full justify-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejected
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(company)}
                    disabled={!canApply}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${canApply
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    {availableSlots > 0 ? "Apply Now" : "No Slots"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Application Message (Optional)
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Why do you want to intern at this company? (Optional)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

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
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
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
