import React, { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import { useOptimizedData } from "../../hooks/useOptimizedData";

// Import types from the service
import type { Company, MOA } from "../../services/companyService";

const CoordinatorCompanyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moaStatusFilter, setMoaStatusFilter] = useState("all");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddMOA, setShowAddMOA] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedMOA, setSelectedMOA] = useState<MOA | null>(null);

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
  });

  // Optimized data fetching with caching
  const { data: companies = [], loading: companiesLoading } = useOptimizedData(
    () => coordinatorService.getAllCompanies(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: moas = [], loading: moasLoading } = useOptimizedData(
    () => coordinatorService.getAllMOAs(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const loading = companiesLoading || moasLoading;

  // Filter companies based on search and status
  const filteredCompanies = (companies || []).filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    // Since companies don't have a status field in the current schema, we'll show all
    return matchesSearch;
  });

  // Filter MOAs based on search and status
  const filteredMOAs = (moas || []).filter((moa) => {
    const matchesSearch =
      moa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (moa.student?.company?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      moaStatusFilter === "all" || moa.status === moaStatusFilter;
    return matchesSearch && matchesStatus;
  });

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
      await coordinatorService.approveMOA(moaId, "Approved by coordinator");
      // The data will be refreshed automatically due to the useOptimizedData hook
    } catch (error) {
      console.error("Error approving MOA:", error);
      // You could add a toast notification here
    }
  };

  // Handle MOA rejection
  const handleRejectMOA = async (moaId: string) => {
    try {
      const reason = prompt("Please provide a reason for rejection:");
      if (reason) {
        await coordinatorService.rejectMOA(moaId, reason);
        // The data will be refreshed automatically due to the useOptimizedData hook
      }
    } catch (error) {
      console.error("Error rejecting MOA:", error);
      // You could add a toast notification here
    }
  };

  // Handle Add Company form submission
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });
      // Data will be refreshed automatically
    } catch (error) {
      console.error("Error creating company:", error);
      alert("Failed to create company. Please try again.");
    }
  };

  // Handle Add MOA form submission
  const handleAddMOA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moaForm.file) {
      alert("Please select a file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", moaForm.title);
      formData.append("description", moaForm.description);
      formData.append("studentId", moaForm.studentId);
      formData.append("file", moaForm.file);
      formData.append("type", "MOA");

      await coordinatorService.uploadMOA(formData);
      setShowAddMOA(false);
      setMoaForm({
        title: "",
        description: "",
        studentId: "",
        file: null,
      });
      // Data will be refreshed automatically
    } catch (error) {
      console.error("Error uploading MOA:", error);
      alert("Failed to upload MOA. Please try again.");
    }
  };

  // Handle file selection for MOA
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMoaForm((prev) => ({ ...prev, file }));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-purple-600" />
              <span>Company & MOA Management</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage companies and their Memorandum of Agreement (MOA) documents
              in one place
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddMOA(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Add MOA</span>
            </button>
            <button
              onClick={() => setShowAddCompany(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search companies or MOAs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Companies</option>
              <option value="active">Active</option>
            </select>
            <select
              value={moaStatusFilter}
              onChange={(e) => setMoaStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All MOAs</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOA Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <span>MOA Alerts</span>
        </h3>
        <div className="space-y-3">
          {moas
            .filter(
              (moa) =>
                isExpiringSoon(moa.uploadedAt) || isExpired(moa.uploadedAt)
            )
            .map((moa) => (
              <div
                key={moa.id}
                className={`p-4 rounded-lg border-l-4 ${
                  isExpired(moa.uploadedAt)
                    ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                    : "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {moa.title} -{" "}
                      {moa.student?.company?.name || "Unknown Company"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isExpired(moa.uploadedAt) ? "Expired" : "Expiring soon"}{" "}
                      - Uploaded {new Date(moa.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      View
                    </button>
                    {!isExpired(moa.uploadedAt) && (
                      <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                        Renew
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {moas.filter(
            (moa) => isExpiringSoon(moa.uploadedAt) || isExpired(moa.uploadedAt)
          ).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No MOA alerts at this time
            </p>
          )}
        </div>
      </div>

      {/* Companies with MOAs - Unified Cards */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-purple-600" />
          <span>Companies & MOAs</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCompanies.map((company) => {
            // Get MOAs for this company
            const companyMOAs = (moas || []).filter(
              (moa) => moa.student?.company?.id === company.id
            );

            // Check for urgent MOAs (expiring or expired)
            const urgentMOAs = companyMOAs.filter(
              (moa) =>
                isExpiringSoon(moa.uploadedAt) || isExpired(moa.uploadedAt)
            );

            return (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* Company Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                          <span className="truncate">{company.address}</span>
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
                                      {isExpiredMOA ? "Expired" : "Expiring"}
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
                                      onClick={() => handleApproveMOA(moa.id)}
                                      className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectMOA(moa.id)}
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
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={companyForm.latitude}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          latitude: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={companyForm.longitude}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0.000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Radius (meters)
                    </label>
                    <input
                      type="number"
                      value={companyForm.radiusMeters}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          radiusMeters: parseInt(e.target.value) || 100,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="100"
                    />
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
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add MOA Modal */}
      {showAddMOA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedMOA ? "MOA Preview" : "Add New MOA"}
              </h3>
              <button
                onClick={() => {
                  setShowAddMOA(false);
                  setSelectedMOA(null);
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
                    <select
                      required
                      value={moaForm.studentId}
                      onChange={(e) =>
                        setMoaForm((prev) => ({
                          ...prev,
                          studentId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select a student</option>
                      {/* You would populate this with actual students from your data */}
                      <option value="student1">John Doe - Company A</option>
                      <option value="student2">Jane Smith - Company B</option>
                    </select>
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
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Upload MOA
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorCompanyManagement;
