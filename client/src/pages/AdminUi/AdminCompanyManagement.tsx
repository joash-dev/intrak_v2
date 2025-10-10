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
  Globe,
  X,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

const mockCompanies = [
  {
    id: "1",
    name: "Tech Innovations Inc.",
    industry: "Information Technology",
    address: "123 Tech Street, Makati City, Metro Manila",
    contactPerson: "Engr. Lisa Tan",
    email: "contact@techinnovations.com",
    phone: "+63-912-345-6789",
    website: "www.techinnovations.com",
    studentCount: 23,
    status: "ACTIVE",
    moaStatus: "SIGNED",
    moaExpiry: "2025-12-31",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Digital Solutions Corp.",
    industry: "Software Development",
    address: "456 Digital Ave, BGC, Taguig City",
    contactPerson: "Mr. Robert Chen",
    email: "hr@digitalsolutions.com",
    phone: "+63-912-345-6790",
    website: "www.digitalsolutions.com",
    studentCount: 18,
    status: "ACTIVE",
    moaStatus: "SIGNED",
    moaExpiry: "2025-11-30",
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    name: "Engineering Works Ltd.",
    industry: "Civil Engineering",
    address: "789 Builder Road, Quezon City",
    contactPerson: "Engr. Maria Garcia",
    email: "info@engineeringworks.com",
    phone: "+63-912-345-6791",
    website: "www.engineeringworks.com",
    studentCount: 15,
    status: "ACTIVE",
    moaStatus: "PENDING",
    moaExpiry: null,
    createdAt: "2023-03-10",
  },
  {
    id: "4",
    name: "Smart Systems Co.",
    industry: "Electronics & Automation",
    address: "321 Smart Lane, Pasig City",
    contactPerson: "Dr. John Martinez",
    email: "contact@smartsystems.com",
    phone: "+63-912-345-6792",
    website: "www.smartsystems.com",
    studentCount: 12,
    status: "ACTIVE",
    moaStatus: "SIGNED",
    moaExpiry: "2026-01-15",
    createdAt: "2023-04-05",
  },
  {
    id: "5",
    name: "Future Tech Labs",
    industry: "Research & Development",
    address: "555 Innovation Hub, Mandaluyong City",
    contactPerson: "Ms. Sarah Lee",
    email: "hr@futuretechlabs.com",
    phone: "+63-912-345-6793",
    website: "www.futuretechlabs.com",
    studentCount: 10,
    status: "ACTIVE",
    moaStatus: "SIGNED",
    moaExpiry: "2025-10-20",
    createdAt: "2023-05-12",
  },
  {
    id: "6",
    name: "Old Systems Inc.",
    industry: "Manufacturing",
    address: "999 Old Street, Manila",
    contactPerson: "Mr. Pedro Santos",
    email: "contact@oldsystems.com",
    phone: "+63-912-345-6794",
    website: "www.oldsystems.com",
    studentCount: 0,
    status: "INACTIVE",
    moaStatus: "EXPIRED",
    moaExpiry: "2024-06-30",
    createdAt: "2022-01-10",
  },
];

const AdminCompanyManagement = () => {
  const [companies, setCompanies] = useState(mockCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [moaFilter, setMoaFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
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
  });

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.status === "ACTIVE").length,
    inactive: companies.filter((c) => c.status === "INACTIVE").length,
    totalStudents: companies.reduce((sum, c) => sum + c.studentCount, 0),
    moaSigned: companies.filter((c) => c.moaStatus === "SIGNED").length,
    moaPending: companies.filter((c) => c.moaStatus === "PENDING").length,
    moaExpired: companies.filter((c) => c.moaStatus === "EXPIRED").length,
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || company.status === statusFilter;
    const matchesMoa = moaFilter === "ALL" || company.moaStatus === moaFilter;
    return matchesSearch && matchesStatus && matchesMoa;
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
    });
  };

  const handleAddCompany = () => {
    setCompanies([
      ...companies,
      {
        id: String(companies.length + 1),
        ...formData,
        studentCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditCompany = () => {
    setCompanies(
      companies.map((c) =>
        c.id === selectedCompany.id ? { ...c, ...formData } : c
      )
    );
    setShowEditModal(false);
    resetForm();
    setSelectedCompany(null);
  };

  const handleDeleteCompany = () => {
    setCompanies(companies.filter((c) => c.id !== selectedCompany.id));
    setShowDeleteModal(false);
    setSelectedCompany(null);
  };

  const openEditModal = (company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry,
      address: company.address,
      contactPerson: company.contactPerson,
      email: company.email,
      phone: company.phone,
      website: company.website,
      status: company.status,
      moaStatus: company.moaStatus,
      moaExpiry: company.moaExpiry || "",
    });
    setShowEditModal(true);
  };

  const getMoaBadgeColor = (status) => {
    return {
      SIGNED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }[status];
  };

  const getMoaIcon = (status) => {
    return {
      SIGNED: <CheckCircle className="w-4 h-4" />,
      PENDING: <AlertCircle className="w-4 h-4" />,
      EXPIRED: <XCircle className="w-4 h-4" />,
    }[status];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Company Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage industry partner companies
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900 dark:text-white" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Inactive", value: stats.inactive, color: "text-gray-600" },
          { label: "Students", value: stats.totalStudents, color: "text-blue-600" },
          { label: "MOA Signed", value: stats.moaSigned, color: "text-green-600" },
          { label: "MOA Pending", value: stats.moaPending, color: "text-yellow-600" },
          { label: "MOA Expired", value: stats.moaExpired, color: "text-red-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{company.industry}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{company.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{company.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{company.phone}</span>
              </div>
              {company.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{company.website}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {company.studentCount} students
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                company.status === "ACTIVE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}>
                {company.status}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">MOA Status</span>
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getMoaBadgeColor(company.moaStatus)}`}>
                  {getMoaIcon(company.moaStatus)}
                  <span>{company.moaStatus}</span>
                </span>
              </div>
              {company.moaExpiry && (
                <p className="text-xs text-gray-500">Expires: {company.moaExpiry}</p>
              )}
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

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No companies found</p>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {showAddModal ? "Add New Company" : "Edit Company"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); setSelectedCompany(null); }}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Industry *"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="Address *"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Contact Person *"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Phone *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <select
                  value={formData.moaStatus}
                  onChange={(e) => setFormData({ ...formData, moaStatus: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, moaExpiry: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={showAddModal ? handleAddCompany : handleEditCompany} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {showAddModal ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Company Details</h3>
              <button onClick={() => { setShowViewModal(false); setSelectedCompany(null); }}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCompany.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedCompany.industry}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="text-gray-900 dark:text-white">{selectedCompany.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 dark:text-white">{selectedCompany.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 dark:text-white">{selectedCompany.phone}</p>
                  </div>
                  {selectedCompany.website && (
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="text-gray-900 dark:text-white">{selectedCompany.website}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 dark:text-white">{selectedCompany.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedCompany.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>{selectedCompany.status}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="text-2xl font-bold text-indigo-600">{selectedCompany.studentCount}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-4">MOA Information</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${getMoaBadgeColor(selectedCompany.moaStatus)}`}>
                      {getMoaIcon(selectedCompany.moaStatus)}
                      <span>{selectedCompany.moaStatus}</span>
                    </span>
                  </div>
                  {selectedCompany.moaExpiry && (
                    <div>
                      <p className="text-sm text-gray-500">Expiry</p>
                      <p className="text-gray-900 dark:text-white">{selectedCompany.moaExpiry}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
              <button onClick={() => { setShowViewModal(false); openEditModal(selectedCompany); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Delete Company</h3>
            <p className="text-gray-600 text-center mb-2">
              Delete <span className="font-semibold">{selectedCompany.name}</span>?
            </p>
            {selectedCompany.studentCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 text-center">
                  This company has {selectedCompany.studentCount} active student(s)
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 text-center mb-6">
              This action cannot be undone. All data will be permanently removed.
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