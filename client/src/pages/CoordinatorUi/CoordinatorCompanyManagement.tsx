import React, { useState } from "react";
import {
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  // Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  // Upload,
  // RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import toast from "react-hot-toast";

// Import types from the service
import type { Company, MOA } from "../../services/companyService";

const CoordinatorCompanyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moaStatusFilter, setMoaStatusFilter] = useState("all");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddMOA, setShowAddMOA] = useState(false);
  // const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedMOA, setSelectedMOA] = useState<MOA | null>(null);
  const [selectedStudentForMOA, setSelectedStudentForMOA] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Loading states for form submissions
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isAddingMOA, setIsAddingMOA] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  // Add MOA form state
  const [moaForm, setMoaForm] = useState({
    title: "",
    description: "",
    studentId: "",
    file: null as File | null,
  });

  // Add Company form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactNumber: "",
    latitude: "",
    longitude: "",
    radiusMeters: 100,
    maxSlots: 0,
  });

  // Optimized data fetching with caching
  const {
    data: companies = [],
    loading: companiesLoading,
    refresh: refreshCompanies,
  } = useOptimizedData(
    () => coordinatorService.getAllCompanies(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const {
    data: students = [],
    loading: studentsLoading,
    refresh: refreshStudents,
  } = useOptimizedData(
    () => coordinatorService.getAllStudents(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const {
    data: moas = [],
    loading: moasLoading,
    refresh: refreshMOAs,
  } = useOptimizedData(
    () => coordinatorService.getAllMOAs(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const loading = companiesLoading || studentsLoading || moasLoading;

  // Filter companies based on search and status
  const filteredCompanies = (companies || []).filter((company) => {
    const matchesSearch =
      (company.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.contactPerson || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (company.contactEmail || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    // Since companies don't have a status field in the current schema, we'll show all
    return matchesSearch;
  });

  // Filter MOAs based on search and status
  // const filteredMOAs = (moas || []).filter((moa) => {
  //   const matchesSearch =
  //     (moa.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     (moa.student?.company?.name || "")
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());
  //   const matchesStatus =
  //     moaStatusFilter === "all" || moa.status === moaStatusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { color: "text-green-600 bg-green-100", icon: CheckCircle };
      case "PENDING":
        return { color: "text-yellow-600 bg-yellow-100", icon: Clock };
      case "REJECTED":
        return { color: "text-red-600 bg-red-100", icon: XCircle };
      default:
        return { color: "text-gray-600 bg-gray-100", icon: Clock };
    }
  };

  // Check if MOA is expiring soon (within 30 days) - using uploadedAt as proxy
  const isExpiringSoon = (uploadedAt: string) => {
    const uploaded = new Date(uploadedAt);
    const now = new Date();
    const diffTime = now.getTime() - uploaded.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 335 && diffDays <= 365; // Approaching 1 year
  };

  // Check if MOA is expired - using uploadedAt as proxy
  const isExpired = (uploadedAt: string) => {
    const uploaded = new Date(uploadedAt);
    const now = new Date();
    const diffTime = now.getTime() - uploaded.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365; // More than 1 year old
  };

  // Handle MOA approval
  const handleApproveMOA = async (moaId: string) => {
    try {
      const result = await coordinatorService.approveMOA(
        moaId,
        "Approved by coordinator"
      );
      await Promise.all([refreshMOAs(), refreshCompanies(), refreshStudents()]);

      if (
        result?.supervisorAccount?.created &&
        result.supervisorAccount.temporaryPassword
      ) {
        toast.success(
          `MOA approved. Supervisor account created for ${result.supervisorAccount.email}. Temporary password: ${result.supervisorAccount.temporaryPassword}`
        );
      } else if (result?.supervisorAccount) {
        toast.success(
          `MOA approved. Supervisor ${result.supervisorAccount.email} is linked to the company.`
        );
      } else {
        toast.success("MOA approved successfully.");
      }
    } catch (error) {
      console.error("Error approving MOA:", error);
      toast.error("Failed to approve MOA. Please try again.");
    }
  };

  // Handle MOA rejection
  const handleRejectMOA = async (moaId: string) => {
    try {
      const reason = prompt("Please provide a reason for rejection:");
      if (reason) {
        await coordinatorService.rejectMOA(moaId, reason);
        // Refresh MOAs data
        await refreshMOAs();
      }
    } catch (error) {
      console.error("Error rejecting MOA:", error);
      toast.error("Failed to reject MOA. Please try again.");
    }
  };

  // Handle Add Company form submission
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCompany(true);
    try {
      const companyData = {
        ...companyForm,
        latitude: companyForm.latitude
          ? parseFloat(companyForm.latitude)
          : undefined,
        longitude: companyForm.longitude
          ? parseFloat(companyForm.longitude)
          : undefined,
        radiusMeters: parseInt(companyForm.radiusMeters.toString()),
      };

      await coordinatorService.createCompany(companyData);
      setShowAddCompany(false);
      setCompanyForm({
        name: "",
        address: "",
        contactPerson: "",
        contactEmail: "",
        contactNumber: "",
        latitude: "",
        longitude: "",
        radiusMeters: 100,
        maxSlots: 0,
      });

      // Refresh companies data
      await refreshCompanies();
    } catch (error) {
      console.error("Error creating company:", error);
      alert("Failed to create company. Please try again.");
    } finally {
      setIsAddingCompany(false);
    }
  };

  // Handle Add MOA form submission
  const handleAddMOA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMOA(true);
    try {
      if (!moaForm.file) {
        alert("Please select a file to upload");
        return;
      }
      const formData = new FormData();
      formData.append("title", moaForm.title);
      formData.append("description", moaForm.description);
      formData.append("studentId", moaForm.studentId);
      formData.append("file", moaForm.file);
      formData.append("type", "MOA");

      await coordinatorService.uploadMOA(formData);
      setShowAddMOA(false);
      setSelectedStudentForMOA(null);
      setMoaForm({
        title: "",
        description: "",
        studentId: "",
        file: null,
      });

      // Refresh MOAs data
      await refreshMOAs();
    } catch (error) {
      console.error("Error uploading MOA:", error);
      alert("Failed to upload MOA. Please try again.");
    } finally {
      setIsAddingMOA(false);
    }
  };

  // Handle file selection for MOA
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMoaForm((prev) => ({ ...prev, file }));
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!companyToDelete || deleteConfirmText !== "delete") {
      return;
    }

    setIsDeletingCompany(true);
    try {
      await coordinatorService.deleteCompany(companyToDelete.id);
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      setDeleteConfirmText("");

      // Refresh all data to reflect the deletion
      await Promise.all([refreshCompanies(), refreshStudents(), refreshMOAs()]);
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    } finally {
      setIsDeletingCompany(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (company: Company) => {
    // Don't open modal if company has assigned students
    if (company._count?.students && company._count.students > 0) {
      alert(
        `Cannot delete company "${company.name}" because it has ${
          company._count.students
        } assigned student${
          company._count.students !== 1 ? "s" : ""
        }. Please unassign all students first.`
      );
      return;
    }

    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
    setDeleteConfirmText("");
  };

  if (loading || (!companies && !moas)) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading company management data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transition-all duration-300 hover:scale-[1.01] hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Company Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage companies and their Memorandum of Agreement (MOA)
                    documents
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => setShowAddMOA(true)}
                  className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <FileText className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add MOA</span>
                </button>
                <button
                  onClick={() => setShowAddCompany(true)}
                  className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Plus className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add Company</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="space-y-8">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search companies, contacts, or MOAs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm font-medium placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm font-medium min-w-[140px]"
                  >
                    <option value="all">All Companies</option>
                    <option value="active">Active</option>
                  </select>
                  <select
                    value={moaStatusFilter}
                    onChange={(e) => setMoaStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm font-medium min-w-[120px]"
                  >
                    <option value="all">All MOAs</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MOA Alerts */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    MOA Alerts
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor urgent MOA activities and deadlines
                  </p>
                </div>
              </div>
              <div className="mt-6">
                {moas &&
                moas.filter(
                  (moa) =>
                    isExpiringSoon(moa.uploadedAt) || isExpired(moa.uploadedAt)
                ).length > 0 ? (
                  <div className="space-y-3">
                    {moas &&
                      moas
                        .filter(
                          (moa) =>
                            isExpiringSoon(moa.uploadedAt) ||
                            isExpired(moa.uploadedAt)
                        )
                        .map((moa) => (
                          <div
                            key={moa.id}
                            className={`p-4 rounded-xl border-l-4 ${
                              isExpired(moa.uploadedAt)
                                ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                                : "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {moa.title} -{" "}
                                  {moa.student?.company?.name ||
                                    "Unknown Company"}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {isExpired(moa.uploadedAt)
                                    ? "Expired"
                                    : "Expiring soon"}{" "}
                                  - Uploaded{" "}
                                  {new Date(
                                    moa.uploadedAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                  View
                                </button>
                                {!isExpired(moa.uploadedAt) && (
                                  <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    Renew
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        All MOAs are up to date
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        No urgent alerts at this time
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Companies with MOAs - Unified Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Companies & MOAs
                </h3>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-full">
                  {filteredCompanies.length} companies
                </span>
              </div>
            </div>

            {filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => {
                  // Get MOAs for this company
                  const companyMOAs = (moas || []).filter(
                    (moa) => moa.student?.company?.id === company.id
                  );

                  // Check for urgent MOAs (expiring or expired)
                  const urgentMOAs = companyMOAs.filter(
                    (moa) =>
                      isExpiringSoon(moa.uploadedAt) ||
                      isExpired(moa.uploadedAt)
                  );

                  return (
                    <div
                      key={company.id}
                      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transition-all duration-300 hover:scale-[1.02] hover:border-purple-300 dark:hover:border-purple-600 overflow-hidden"
                    >
                      {/* Glass morphism overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Company Header */}
                      <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {company.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {company.contactPerson}
                                </p>
                                {company._count?.students &&
                                  company._count.students > 0 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {company._count.students} student
                                      {company._count.students !== 1
                                        ? "s"
                                        : ""}{" "}
                                      assigned
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span>{company.contactEmail}</span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span>{company.contactNumber}</span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                <span className="truncate">
                                  {company.address}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(company)}
                              disabled={Boolean(
                                company._count?.students &&
                                  company._count.students > 0
                              )}
                              className={`p-2 rounded-lg transition-colors ${
                                company._count?.students &&
                                company._count.students > 0
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                              title={
                                company._count?.students &&
                                company._count.students > 0
                                  ? `Cannot delete: ${company._count.students} student(s) assigned`
                                  : "Delete Company"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MOAs Section */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>MOAs ({companyMOAs.length})</span>
                            {urgentMOAs.length > 0 && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-full">
                                {urgentMOAs.length} urgent
                              </span>
                            )}
                          </h5>
                          <button className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                            View All
                          </button>
                        </div>

                        {companyMOAs.length > 0 ? (
                          <div className="space-y-3">
                            {companyMOAs.slice(0, 3).map((moa) => {
                              const statusInfo = getStatusInfo(moa.status);
                              const StatusIcon = statusInfo.icon;
                              const isExpiring = isExpiringSoon(moa.uploadedAt);
                              const isExpiredMOA = isExpired(moa.uploadedAt);

                              return (
                                <div
                                  key={moa.id}
                                  className={`p-3 rounded-lg border ${
                                    isExpiredMOA
                                      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                                      : isExpiring
                                      ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                                      : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {moa.title}
                                      </p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                                        >
                                          <StatusIcon className="w-3 h-3 mr-1" />
                                          {moa.status}
                                        </span>
                                        {(isExpiring || isExpiredMOA) && (
                                          <span
                                            className={`text-xs ${
                                              isExpiredMOA
                                                ? "text-red-600"
                                                : "text-orange-600"
                                            }`}
                                          >
                                            {isExpiredMOA
                                              ? "Expired"
                                              : "Expiring"}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {new Date(
                                          moa.uploadedAt
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex space-x-1 ml-2">
                                      <button
                                        onClick={() => {
                                          // Fire preview functionality
                                          setSelectedMOA(moa);
                                          setShowAddMOA(true); // Reuse modal for preview
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        title="Preview MOA"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      {moa.status === "PENDING" && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleApproveMOA(moa.id)
                                            }
                                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                            title="Approve"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleRejectMOA(moa.id)
                                            }
                                            className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Reject"
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        className="p-1.5 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded transition-colors"
                                        title="Download"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {companyMOAs.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                +{companyMOAs.length - 3} more MOAs
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No MOAs found for this company
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-12">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No companies found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Get started by adding your first company to manage
                      internships and MOAs.
                    </p>
                    <button
                      onClick={() => setShowAddCompany(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Your First Company
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Company Modal */}
          {showAddCompany && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              style={{ margin: "0" }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add New Company
                  </h3>
                  <button
                    onClick={() => setShowAddCompany(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleAddCompany}
                  className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.name}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.contactPerson}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter contact person name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address *
                      </label>
                      <textarea
                        required
                        value={companyForm.address}
                        onChange={(e) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={companyForm.contactEmail}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactEmail: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter contact email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={companyForm.contactNumber}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactNumber: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>

                    {/* Capacity Field */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Number of Slots
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={companyForm.maxSlots}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              maxSlots: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter available slots"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Set how many interns this company can accept.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingCompany}
                      className="group relative px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      {isAddingCompany ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="flex items-center space-x-2 relative z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Adding Company...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="relative z-10">Add Company</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add MOA Modal */}
          {showAddMOA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedMOA ? "MOA Preview" : "Add New MOA"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddMOA(false);
                      setSelectedMOA(null);
                      setSelectedStudentForMOA(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedMOA ? (
                  // MOA Preview Content (existing preview modal content)
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                      {/* MOA Header Info */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {selectedMOA.title}
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center space-x-2">
                                <Building2 className="w-4 h-4 text-purple-600" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  Company:{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {selectedMOA.student?.company?.name ||
                                      "Unknown Company"}
                                  </span>
                                </span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  Uploaded:{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {new Date(
                                      selectedMOA.uploadedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  Status:
                                  <span
                                    className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      getStatusInfo(selectedMOA.status).color
                                    }`}
                                  >
                                    {selectedMOA.status}
                                  </span>
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {selectedMOA.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => {
                                    handleApproveMOA(selectedMOA.id);
                                    setSelectedMOA(null);
                                    setShowAddMOA(false);
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleRejectMOA(selectedMOA.id);
                                    setSelectedMOA(null);
                                    setShowAddMOA(false);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MOA Content Preview */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Document Preview
                        </h5>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                          <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              MOA Document Preview
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              File: {selectedMOA.filepath}
                            </p>
                            <div className="mt-4">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Open Full Document
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MOA Details */}
                      {selectedMOA.description && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Description
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedMOA.description}
                          </p>
                        </div>
                      )}

                      {selectedMOA.remarks && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Remarks
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedMOA.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Add MOA Form
                  <form
                    onSubmit={handleAddMOA}
                    className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          MOA Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={moaForm.title}
                          onChange={(e) =>
                            setMoaForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter MOA title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={moaForm.description}
                          onChange={(e) =>
                            setMoaForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter MOA description"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Student *
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Only students assigned to companies are shown. The MOA
                          will be created for the selected student-company pair.
                        </p>
                        <select
                          required
                          value={moaForm.studentId}
                          onChange={(e) => {
                            const studentId = e.target.value;
                            const selectedStudent = students?.find(
                              (s) => s.id === studentId
                            );
                            setSelectedStudentForMOA(selectedStudent);
                            setMoaForm((prev) => ({
                              ...prev,
                              studentId: studentId,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select a student</option>
                          {students &&
                            students
                              .filter(
                                (student) =>
                                  student.company &&
                                  student.company !== "No Company"
                              )
                              .map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.name} ({student.studentNumber}) -{" "}
                                  {student.company}
                                </option>
                              ))}
                          {students &&
                            students.filter(
                              (student) =>
                                student.company &&
                                student.company !== "No Company"
                            ).length === 0 && (
                              <option value="" disabled>
                                No students assigned to companies yet
                              </option>
                            )}
                        </select>

                        {/* Show selected student's company info */}
                        {selectedStudentForMOA && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Company Assignment
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              <strong>{selectedStudentForMOA.name}</strong> is
                              assigned to{" "}
                              <strong>{selectedStudentForMOA.company}</strong>
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Student ID: {selectedStudentForMOA.studentNumber}{" "}
                              | Program: {selectedStudentForMOA.program}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          MOA Document *
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                          <div className="space-y-1 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={handleFileChange}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PDF, DOC, DOCX up to 10MB
                            </p>
                            {moaForm.file && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Selected: {moaForm.file.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setShowAddMOA(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingMOA}
                        className="group relative px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        {isAddingMOA ? (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <div className="flex items-center space-x-2 relative z-10">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading MOA...</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative z-10">Upload MOA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Delete Company Confirmation Modal */}
          {showDeleteConfirm && companyToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <span>Delete Company</span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setCompanyToDelete(null);
                      setDeleteConfirmText("");
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Are you sure you want to delete this company? This action
                      cannot be undone.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Company:{" "}
                        <span className="font-bold">
                          {companyToDelete.name}
                        </span>
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Contact: {companyToDelete.contactPerson} (
                        {companyToDelete.contactEmail})
                      </p>
                      {companyToDelete._count?.students &&
                        companyToDelete._count.students > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              ⚠️ This company has{" "}
                              {companyToDelete._count.students} assigned student
                              {companyToDelete._count.students !== 1 ? "s" : ""}
                              . You must unassign all students before deleting
                              the company.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      To confirm deletion, type{" "}
                      <span className="font-mono font-bold text-red-600">
                        delete
                      </span>{" "}
                      in the box below:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Type 'delete' to confirm"
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setCompanyToDelete(null);
                        setDeleteConfirmText("");
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteCompany}
                      disabled={
                        deleteConfirmText !== "delete" ||
                        (companyToDelete._count?.students &&
                          companyToDelete._count.students > 0) ||
                        isDeletingCompany
                      }
                      className={`group relative px-6 py-2 rounded-lg transition-all duration-300 overflow-hidden ${
                        deleteConfirmText === "delete" &&
                        (!companyToDelete._count?.students ||
                          companyToDelete._count.students === 0) &&
                        !isDeletingCompany
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {companyToDelete._count?.students &&
                      companyToDelete._count.students > 0 ? (
                        "Cannot Delete"
                      ) : isDeletingCompany ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="flex items-center space-x-2 relative z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Deleting...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="relative z-10">Delete Company</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorCompanyManagement;
