import { useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  X,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import { adminService, type AdminCompany } from "../../services/adminService";
import toast from "react-hot-toast";

const AdminCompanyManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [moaFilter, setMoaFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(
    null
  );

  // Fetch companies with real API
  const {
    data: companiesResponse,
    loading: companiesLoading,
    refetch: refetchCompanies,
  } = useOptimizedData(
    () =>
      adminService.getCompanies({
        search: searchQuery || undefined,
      }),
    [searchQuery],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const companies = companiesResponse?.companies || [];
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    status: "ACTIVE",
    moaStatus: "PENDING",
    moaExpiry: "",
    companyType: "PUBLIC" as "PUBLIC" | "PRIVATE",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as string[],
  });

  const stats = {
    total: companies.length,
    active: companies.filter((c) => (c.students?.length ?? 0) > 0).length,
    inactive: companies.filter((c) => (c.students?.length ?? 0) === 0).length,
    totalStudents: companies.reduce(
      (sum, c) => sum + (c.students?.length ?? 0),
      0
    ),
    moaSigned: Math.floor(companies.length * 0.7), // Mock data for now
    moaPending: Math.floor(companies.length * 0.2), // Mock data for now
    moaExpired: Math.floor(companies.length * 0.1), // Mock data for now
  };

  // Filter companies locally for status and MOA filters
  const filteredCompanies = companies.filter((company) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && (company.students?.length ?? 0) > 0) ||
      (statusFilter === "INACTIVE" && (company.students?.length ?? 0) === 0);
    // MOA filter would need to be implemented based on actual MOA data
    return matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      address: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      status: "ACTIVE",
      moaStatus: "PENDING",
      moaExpiry: "",
      companyType: "PUBLIC" as "PUBLIC" | "PRIVATE",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as string[],
    });
  };

  const handleAddCompany = async () => {
    try {
      await adminService.createCompany({
        name: formData.name,
        address: formData.address,
        contactPerson: formData.contactPerson,
        contactEmail: formData.email,
        contactNumber: formData.phone,
        latitude: undefined,
        longitude: undefined,
        radiusMeters: undefined,
        companyType: formData.companyType,
        workingDays: formData.workingDays,
      });
      toast.success("Company created successfully");
      setShowAddModal(false);
      resetForm();
      refetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create company");
    }
  };

  const handleEditCompany = async () => {
    if (!selectedCompany) return;

    try {
      await adminService.updateCompany(selectedCompany.id, {
        name: formData.name,
        address: formData.address,
        contactPerson: formData.contactPerson,
        contactEmail: formData.email,
        contactNumber: formData.phone,
        industry: formData.industry,
        website: formData.website,
        status: formData.status,
        moaStatus: formData.moaStatus,
        moaExpiry: formData.moaExpiry,
        companyType: formData.companyType,
        workingDays: formData.workingDays,
      });
      toast.success("Company updated successfully");
      setShowEditModal(false);
      resetForm();
      setSelectedCompany(null);
      refetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update company");
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      await adminService.deleteCompany(selectedCompany.id);
      toast.success("Company deleted successfully");
      setShowDeleteModal(false);
      setSelectedCompany(null);
      refetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete company");
    }
  };

  const openEditModal = (company: AdminCompany) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      industry: "", // Would need to be added to the API
      address: company.address,
      contactPerson: company.contactPerson,
      email: company.contactEmail,
      phone: company.contactNumber,
      website: "", // Would need to be added to the API
      status: "ACTIVE", // Would need to be determined based on students
      moaStatus: "PENDING", // Mock data for now
      moaExpiry: "", // Mock data for now
      companyType: (company as any).companyType || "PUBLIC",
      workingDays: (company as any).workingDays || ((company as any).companyType === "PRIVATE" 
        ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    });
    setShowEditModal(true);
  };

  const getMoaBadgeColor = (status?: "SIGNED" | "PENDING" | "EXPIRED" | string) => {
    return {
      SIGNED:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }[status ?? "PENDING"];
  };

  const getMoaIcon = (status?: "SIGNED" | "PENDING" | "EXPIRED" | string) => {
    return {
      SIGNED: <CheckCircle className="w-4 h-4" />,
      PENDING: <AlertCircle className="w-4 h-4" />,
      EXPIRED: <XCircle className="w-4 h-4" />,
    }[status ?? "PENDING"];
  };

  const selectedCompanyStudentCount =
    selectedCompany?.studentCount ?? selectedCompany?.students?.length ?? 0;

  return (
    <div className="space-y-6 font-outfit">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Company Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage industry partner companies
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => refetchCompanies()}
            disabled={companiesLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${companiesLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-900 dark:text-white",
          },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Inactive", value: stats.inactive, color: "text-gray-600" },
          {
            label: "Students",
            value: stats.totalStudents,
            color: "text-blue-600",
          },
          {
            label: "MOA Signed",
            value: stats.moaSigned,
            color: "text-green-600",
          },
          {
            label: "MOA Pending",
            value: stats.moaPending,
            color: "text-yellow-600",
          },
          {
            label: "MOA Expired",
            value: stats.moaExpired,
            color: "text-red-600",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={moaFilter}
            onChange={(e) => setMoaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">All MOA</option>
            <option value="SIGNED">Signed</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCompanies.length} of {companies.length} companies
        </p>
      </div>

      {companiesLoading ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mr-3" />
          <span className="text-gray-500 dark:text-gray-400">
            Loading companies...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Industry Partner
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{company.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{company.contactEmail}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{company.contactNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>{company.contactPerson}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {company.students?.length ?? 0} students
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (company.students?.length ?? 0) > 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {(company.students?.length ?? 0) > 0 ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">MOA Status</span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getMoaBadgeColor(
                      "PENDING"
                    )}`}
                  >
                    {getMoaIcon("PENDING")}
                    <span>PENDING</span>
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowViewModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => openEditModal(company)}
                  className="flex-1 px-3 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 text-sm flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!companiesLoading && filteredCompanies.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No companies found</p>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {showAddModal ? "Add New Company" : "Edit Company"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedCompany(null);
                }}
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Industry *"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="Address *"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Contact Person *"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Phone *"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              
              {/* Company Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="companyType"
                      value="PUBLIC"
                      checked={formData.companyType === "PUBLIC"}
                      onChange={(e) => {
                        const newType = e.target.value as "PUBLIC" | "PRIVATE";
                        setFormData({
                          ...formData,
                          companyType: newType,
                          workingDays: newType === "PRIVATE"
                            ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="companyType"
                      value="PRIVATE"
                      checked={formData.companyType === "PRIVATE"}
                      onChange={(e) => {
                        const newType = e.target.value as "PUBLIC" | "PRIVATE";
                        setFormData({
                          ...formData,
                          companyType: newType,
                          workingDays: newType === "PRIVATE"
                            ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Private</span>
                  </label>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Working Days *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <label
                      key={day}
                      className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.workingDays.includes(day)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                      } ${
                        formData.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.workingDays.includes(day)}
                        onChange={(e) => {
                          if (formData.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")) {
                            return;
                          }
                          setFormData({
                            ...formData,
                            workingDays: e.target.checked
                              ? [...formData.workingDays, day]
                              : formData.workingDays.filter((d) => d !== day),
                          });
                        }}
                        disabled={formData.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                    </label>
                  ))}
                </div>
                {formData.workingDays.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">At least one working day must be selected</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <select
                  value={formData.moaStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, moaStatus: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="SIGNED">Signed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              {formData.moaStatus === "SIGNED" && (
                <input
                  type="date"
                  value={formData.moaExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, moaExpiry: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddCompany : handleEditCompany}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                {showAddModal ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Company Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCompany(null);
                }}
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCompany.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCompany.industry}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCompany.contactPerson}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCompany.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCompany.phone}
                    </p>
                  </div>
                  {selectedCompany.website && (
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedCompany.website}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCompany.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
                        (selectedCompany.status ?? "INACTIVE") === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedCompany.status ?? "INACTIVE"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {selectedCompanyStudentCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-4">MOA Information</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${getMoaBadgeColor(
                        selectedCompany.moaStatus
                      )}`}
                    >
                      {getMoaIcon(selectedCompany.moaStatus)}
                      <span>{selectedCompany.moaStatus ?? "PENDING"}</span>
                    </span>
                  </div>
                  {selectedCompany.moaExpiry && (
                    <div>
                      <p className="text-sm text-gray-500">Expiry</p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedCompany.moaExpiry}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedCompany);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">
              Delete Company
            </h3>
            <p className="text-gray-600 text-center mb-2">
              Delete{" "}
              <span className="font-semibold">{selectedCompany.name}</span>?
            </p>
            {selectedCompanyStudentCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 text-center">
                  This company has {selectedCompanyStudentCount} active
                  student(s)
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 text-center mb-6">
              This action cannot be undone. All data will be permanently
              removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCompany(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanyManagement;
