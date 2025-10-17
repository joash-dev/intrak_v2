import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react";
import { companyService, type Company } from "../../services/companyService";
import { dashboardService } from "../../services/dashboardService";
import api from "../../services/api";
import toast from "react-hot-toast";

interface StudentCompanySelectionProps {
  onCompanyUpdate?: () => void;
}

const StudentCompanySelection: React.FC<StudentCompanySelectionProps> = ({
  onCompanyUpdate,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    supervisorName: "",
    supervisorEmail: "",
    supervisorPhone: "",
    startDate: "",
    endDate: "",
    motivation: "",
    skills: "",
    expectations: "",
  });

  // Load companies and current student data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, studentData] = await Promise.all([
        companyService.getAllCompanies(),
        dashboardService.getDashboardData(),
      ]);

      setCompanies(companiesData);
      setCurrentStudent(studentData.student);

      // If student already has a company, set it as selected
      if (studentData.student.company) {
        const existingCompany = companiesData.find(
          (c) => c.name === studentData.student.company
        );
        if (existingCompany) {
          setSelectedCompany(existingCompany);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load companies");
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyToCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedCompany) return;

    try {
      setApplying(true);

      // Call the API to submit the application
      const result = await api.post("/students/apply-company", {
        companyId: selectedCompany.id,
        supervisorName: applicationData.supervisorName,
        supervisorEmail: applicationData.supervisorEmail,
        supervisorPhone: applicationData.supervisorPhone,
        startDate: applicationData.startDate,
        endDate: applicationData.endDate,
        motivation: applicationData.motivation,
        skills: applicationData.skills,
        expectations: applicationData.expectations,
      });

      toast.success(`Application submitted to ${selectedCompany.name}!`);
      setShowApplicationModal(false);

      // Reset form
      setApplicationData({
        supervisorName: "",
        supervisorEmail: "",
        supervisorPhone: "",
        startDate: "",
        endDate: "",
        motivation: "",
        skills: "",
        expectations: "",
      });

      // Refresh student data
      if (onCompanyUpdate) {
        onCompanyUpdate();
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading companies...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Companies
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Building2 className="w-6 h-6 mr-3 text-purple-600" />
              Company Selection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose your preferred company for OJT internship
            </p>
          </div>
          {currentStudent?.company && (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Currently assigned to: {currentStudent.company}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies by name, address, or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredCompanies.length} companies found
            </span>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {company.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="truncate">{company.address}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {company._count?.students || 0} students
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 mr-2" />
                <span>{company.contactNumber}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate">{company.contactEmail}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Contact Person:</span>{" "}
                {company.contactPerson}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleApplyToCompany(company)}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                disabled={currentStudent?.company === company.name}
              >
                {currentStudent?.company === company.name ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Company
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Companies Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria to find more companies.
          </p>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Apply to {selectedCompany.name}
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Company Details
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Address:</strong> {selectedCompany.address}
                  </p>
                  <p>
                    <strong>Contact Person:</strong>{" "}
                    {selectedCompany.contactPerson}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedCompany.contactEmail}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedCompany.contactNumber}
                  </p>
                </div>
              </div>

              {/* Application Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor Name *
                    </label>
                    <input
                      type="text"
                      value={applicationData.supervisorName}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          supervisorName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter supervisor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor Email *
                    </label>
                    <input
                      type="email"
                      value={applicationData.supervisorEmail}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          supervisorEmail: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="supervisor@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supervisor Phone
                  </label>
                  <input
                    type="tel"
                    value={applicationData.supervisorPhone}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        supervisorPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={applicationData.startDate}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={applicationData.endDate}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivation for Choosing This Company *
                  </label>
                  <textarea
                    value={applicationData.motivation}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        motivation: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Explain why you want to intern at this company..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relevant Skills
                  </label>
                  <textarea
                    value={applicationData.skills}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        skills: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="List your relevant skills and experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Learning Expectations
                  </label>
                  <textarea
                    value={applicationData.expectations}
                    onChange={(e) =>
                      setApplicationData({
                        ...applicationData,
                        expectations: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="What do you hope to learn during your internship?"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={
                  applying ||
                  !applicationData.supervisorName ||
                  !applicationData.supervisorEmail ||
                  !applicationData.startDate ||
                  !applicationData.endDate ||
                  !applicationData.motivation
                }
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
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
