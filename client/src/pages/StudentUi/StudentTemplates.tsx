import React, { useState, useEffect } from "react";
import { FileText, Download, Search, AlertCircle } from "lucide-react";
import Skeleton from "../../components/Skeleton";
import { templateService } from "../../services/templateService";
import type { DocumentTemplate } from "../../services/templateService";
import { toast } from "react-hot-toast";

const StudentTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Only fetch active templates for students
      const fetchedTemplates = await templateService.getTemplates(
        undefined,
        true
      );
      setTemplates(fetchedTemplates);
    } catch (error) {
      toast.error("Failed to fetch templates");
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (template: DocumentTemplate) => {
    try {
      await templateService.downloadTemplate(template.id, template.filename);
      toast.success("Template downloaded successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to download template"
      );
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Extract form number from template type display name
  const getFormNumber = (template: DocumentTemplate): number => {
    const displayName = templateService.getDocumentTypeDisplay(template.type);
    // Match patterns like "Form FM-AA-INT-01", "Form FM-AA-INT-14", etc.
    const match = displayName.match(/Form\s+FM-AA-INT-(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    // If no form number found, assign a high number to push to end
    return 999;
  };

  // Sort templates by form number
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const formNumA = getFormNumber(a);
    const formNumB = getFormNumber(b);
    return formNumA - formNumB;
  });

  // Group templates by category
  const groupedTemplates = sortedTemplates.reduce((acc, template) => {
    const category = template.category || "PRE_DEPLOYMENT";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  // Sort templates within each category by form number
  Object.keys(groupedTemplates).forEach((category) => {
    groupedTemplates[category].sort((a, b) => {
      const formNumA = getFormNumber(a);
      const formNumB = getFormNumber(b);
      return formNumA - formNumB;
    });
  });

  const categoryOptions = templateService.getCategoryOptions();

  if (loading) {
    return (
      <div className="space-y-6 font-outfit">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        {/* Templates Table Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#212124]">
                <tr>
                  {["Template Name", "Category", "Type", "Actions"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-5 h-5 rounded" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-9 w-28 rounded-lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Templates
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Download standardized templates for your document submissions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#212124] text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#212124] text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates by Category */}
      {Object.keys(groupedTemplates).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            No Templates Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery || filterCategory !== "all"
              ? "Try adjusting your search criteria or filters to find templates."
              : "No document templates are currently available. Contact your instructor for more information."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(
            ([category, categoryTemplates]) => (
              <div
                key={category}
                className="bg-white dark:bg-[#212124] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        category === "PRE_DEPLOYMENT"
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : category === "UPON_APPROVAL"
                          ? "bg-yellow-100 dark:bg-yellow-900/20"
                          : "bg-green-100 dark:bg-green-900/20"
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 ${
                          category === "PRE_DEPLOYMENT"
                            ? "text-blue-600 dark:text-blue-400"
                            : category === "UPON_APPROVAL"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {templateService.getCategoryDisplay(category)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {categoryTemplates.length} template
                        {categoryTemplates.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-[#212124]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Template Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Uploaded By
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Published
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {categoryTemplates.map((template) => (
                        <tr
                          key={template.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {template.name}
                                </div>
                                {template.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {template.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              {templateService.getDocumentTypeDisplay(
                                template.type
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {template.uploadedBy?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDownload(template)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Document Categories & How to Use Templates
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                  Document Categories:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>
                    •{" "}
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      Pre-deployment:
                    </span>{" "}
                    Documents needed before starting OJT
                  </li>
                  <li>
                    •{" "}
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      Upon Approval:
                    </span>{" "}
                    Documents required after OJT approval
                  </li>
                  <li>
                    •{" "}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Post-OJT:
                    </span>{" "}
                    Documents needed after completing OJT
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                  How to Use Templates:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>
                    1. Download the template that matches your document type
                  </li>
                  <li>2. Fill out the template with your information</li>
                  <li>
                    3. Upload the completed document through the Document
                    Submission section
                  </li>
                  <li>
                    4. Templates help ensure your documents meet the required
                    format and include all necessary information
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTemplates;
