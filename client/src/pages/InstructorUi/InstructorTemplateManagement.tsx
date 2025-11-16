import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { templateService } from "../../services/templateService";
import type { DocumentTemplate } from "../../services/templateService";
import { toast } from "react-hot-toast";

const InstructorTemplateManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    category?: boolean;
    files?: boolean;
  }>({});

  type TemplateUploadEntry = {
    id: string;
    file: File;
    name: string;
    type: string;
  };

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    description: "",
    category:
      (category as "PRE_DEPLOYMENT" | "UPON_APPROVAL" | "POST_OJT") ||
      "PRE_DEPLOYMENT",
    files: [] as TemplateUploadEntry[],
  });

  const [fileValidationMap, setFileValidationMap] = useState<
    Record<string, { name?: boolean; type?: boolean }>
  >({});

  const generateUploadEntryId = () =>
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const documentTypeOptions =
    templateService.getDocumentTypeOptionsByCategory(uploadForm.category);

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setUploadForm((prev) => ({
      ...prev,
      files: [
        ...prev.files,
        ...selectedFiles.map((file) => ({
          id: generateUploadEntryId(),
          file,
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: "",
        })),
      ],
    }));
    clearValidationError("files");
    event.target.value = "";
  };

  const handleRemoveFile = (id: string) => {
    if (uploadForm.files.length === 1) {
      clearValidationError("files");
    }

    setUploadForm((prev) => ({
      ...prev,
      files: prev.files.filter((entry) => entry.id !== id),
    }));
    setFileValidationMap((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleFileFieldChange = (
    id: string,
    field: "name" | "type",
    value: string
  ) => {
    setUploadForm((prev) => ({
      ...prev,
      files: prev.files.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));

    setFileValidationMap((prev) => {
      if (!prev[id]) return prev;
      const entryErrors = { ...prev[id] };
      if (value.trim()) {
        delete entryErrors[field];
      } else {
        entryErrors[field] = true;
      }

      const updated = { ...prev };
      if (Object.keys(entryErrors).length === 0) {
        delete updated[id];
      } else {
        updated[id] = entryErrors;
      }
      return updated;
    });
  };

  const handleCategoryChange = (
    value: "PRE_DEPLOYMENT" | "UPON_APPROVAL" | "POST_OJT"
  ) => {
    setUploadForm((prev) => ({
      ...prev,
      category: value,
      files: prev.files.map((entry) => ({ ...entry, type: "" })),
    }));
    setFileValidationMap({});
    clearValidationError("category");
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update upload form category when URL category changes
  useEffect(() => {
    setUploadForm((prev) => ({
      ...prev,
      category:
        (category as "PRE_DEPLOYMENT" | "UPON_APPROVAL" | "POST_OJT") ||
        "PRE_DEPLOYMENT",
    }));
  }, [category]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const fetchedTemplates = await templateService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      toast.error("Failed to fetch templates");
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    const fileErrors: Record<string, { name?: boolean; type?: boolean }> = {};

    if (!uploadForm.category) {
      errors.category = true;
    }

    if (uploadForm.files.length === 0) {
      errors.files = true;
    }

    uploadForm.files.forEach((entry) => {
      const entryErrors: { name?: boolean; type?: boolean } = {};
      if (!entry.name.trim()) {
        entryErrors.name = true;
      }
      if (!entry.type.trim()) {
        entryErrors.type = true;
      }
      if (Object.keys(entryErrors).length > 0) {
        fileErrors[entry.id] = entryErrors;
      }
    });

    setValidationErrors(errors);
    setFileValidationMap(fileErrors);

    return (
      Object.keys(errors).length === 0 && Object.keys(fileErrors).length === 0
    );
  };

  const clearValidationError = (field: keyof typeof validationErrors) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setUploading(true);

      await Promise.all(
        uploadForm.files.map((entry) =>
          templateService.uploadTemplate({
            name: entry.name.trim(),
            description: uploadForm.description.trim() || undefined,
            category: uploadForm.category,
            type: entry.type.trim(),
            file: entry.file,
          })
        )
      );

      toast.success(
        uploadForm.files.length > 1
          ? `${uploadForm.files.length} templates uploaded successfully`
          : "Template uploaded successfully"
      );
      setShowUploadModal(false);
      setValidationErrors({});
      setFileValidationMap({});
      setUploadForm({
        description: "",
        category: "PRE_DEPLOYMENT",
        files: [],
      });
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload template");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    try {
      await templateService.updateTemplate(selectedTemplate.id, {
        name: editForm.name,
        description: editForm.description,
        isActive: editForm.isActive,
      });

      toast.success("Template updated successfully");
      setShowEditModal(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update template");
    }
  };

  const handleDelete = async (template: DocumentTemplate) => {
    if (
      !window.confirm(`Are you sure you want to delete "${template.name}"?`)
    ) {
      return;
    }

    try {
      await templateService.deleteTemplate(template.id);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete template");
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

  const openEditModal = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      isActive: template.isActive,
    });
    setShowEditModal(true);
  };

  const filteredTemplates = category
    ? templates.filter((template) => template.category === category)
    : templates;

  // Group templates by category for display
  const groupedTemplates = filteredTemplates
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .reduce((acc, template) => {
      const category = template.category || "OTHER";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {} as Record<string, DocumentTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {category && (
              <button
                onClick={() => setSearchParams({})}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {category
                  ? `${category
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())} Documents`
                  : "Document Templates"}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {category
                  ? `Manage ${category
                      .replace("_", " ")
                      .toLowerCase()} document templates`
                  : "Manage document templates for students"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
            setUploadForm({
              description: "",
              category:
                (category as "PRE_DEPLOYMENT" | "UPON_APPROVAL" | "POST_OJT") ||
                "PRE_DEPLOYMENT",
              files: [],
            });
            setValidationErrors({});
            setFileValidationMap({});
            setShowUploadModal(true);
          }}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Template</span>
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* View All Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            !category
              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
          }`}
          onClick={() => setSearchParams({})}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              All Templates
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </p>
          </div>
          </div>
          <div className="w-full mt-10 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-center font-medium text-sm">
            View All
          </div>
        </div>

        {/* Pre-deployment Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            category === "PRE_DEPLOYMENT"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
          onClick={() => setSearchParams({ category: "PRE_DEPLOYMENT" })}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Pre-deployment Documents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {
                  templates.filter((t) => t.category === "PRE_DEPLOYMENT")
                    .length
                }{" "}
                template
                {templates.filter((t) => t.category === "PRE_DEPLOYMENT")
                  .length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUploadForm({
                description: "",
                category: "PRE_DEPLOYMENT",
                files: [],
              });
              setValidationErrors({});
              setFileValidationMap({});
              setShowUploadModal(true);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm"
          >
            Upload Template
          </button>
        </div>

        {/* Upon Approval Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            category === "UPON_APPROVAL"
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-yellow-300"
          }`}
          onClick={() => setSearchParams({ category: "UPON_APPROVAL" })}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Upon Approval Documents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {templates.filter((t) => t.category === "UPON_APPROVAL").length}{" "}
                template
                {templates.filter((t) => t.category === "UPON_APPROVAL")
                  .length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUploadForm({
                description: "",
                category: "UPON_APPROVAL",
                files: [],
              });
              setValidationErrors({});
              setFileValidationMap({});
              setShowUploadModal(true);
            }}
            className="w-full px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg transition-colors font-medium text-sm"
          >
            Upload Template
          </button>
        </div>

        {/* Post-OJT Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            category === "POST_OJT"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-green-300"
          }`}
          onClick={() => setSearchParams({ category: "POST_OJT" })}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Post-OJT Documents
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {templates.filter((t) => t.category === "POST_OJT").length}{" "}
                template
                {templates.filter((t) => t.category === "POST_OJT").length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUploadForm({
                description: "",
                category: "POST_OJT",
                files: [],
              });
              setValidationErrors({});
              setFileValidationMap({});
              setShowUploadModal(true);
            }}
            className="w-full px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium text-sm"
          >
            Upload Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-6">
        {filteredTemplates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No Templates Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {category
                  ? `No templates found in the ${category
                      .replace("_", " ")
                      .toLowerCase()} category.`
                  : "Upload your first document template to help students with standardized document formats."}
              </p>
              {!category && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Upload Your First Template
                </button>
              )}
            </div>
          </div>
        ) : (
          Object.entries(groupedTemplates).map(
            ([category, categoryTemplates]) => (
              <div
                key={category}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
              >
                {/* Category Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryTemplates.length} template
                        {categoryTemplates.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Templates Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
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
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {categoryTemplates.map((template) => (
                        <tr
                          key={template.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
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
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
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
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDownload(template)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(template)}
                                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(template)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload Document Template
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Choose the appropriate category, optionally add a description, then upload one or more files. Each file can be renamed and assigned a document type before submission.
              </p>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Category *
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value as
                        | "PRE_DEPLOYMENT"
                        | "UPON_APPROVAL"
                        | "POST_OJT"
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validationErrors.category
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {templateService.getCategoryOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="text-red-500 text-sm mt-1">
                    Document category is required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Enter template description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Files *
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelection}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validationErrors.files
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
                {validationErrors.files && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select at least one file to upload
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX. You can select multiple files.
                </p>
              </div>

              {uploadForm.files.length > 0 && (
                <div className="space-y-4">
                  {uploadForm.files.map((entry, index) => {
                    const entryErrors = fileValidationMap[entry.id] || {};
                    return (
                      <div
                        key={entry.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/40 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              File {index + 1}: {entry.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {(entry.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(entry.id)}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Template Name *
                            </label>
                            <input
                              type="text"
                              value={entry.name}
                              onChange={(e) =>
                                handleFileFieldChange(entry.id, "name", e.target.value)
                              }
                              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                entryErrors.name
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-600"
                              }`}
                              placeholder="Enter template name"
                            />
                            {entryErrors.name && (
                              <p className="text-red-500 text-xs mt-1">
                                Template name is required
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Document Type *
                            </label>
                            <select
                              value={entry.type}
                              onChange={(e) =>
                                handleFileFieldChange(entry.id, "type", e.target.value)
                              }
                              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                entryErrors.type
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <option value="">Select document type</option>
                              {documentTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {entryErrors.type && (
                              <p className="text-red-500 text-xs mt-1">
                                Document type is required
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setValidationErrors({});
                  setFileValidationMap({});
                  setUploadForm({
                    description: "",
                    category:
                      (category as
                        | "PRE_DEPLOYMENT"
                        | "UPON_APPROVAL"
                        | "POST_OJT") || "PRE_DEPLOYMENT",
                    files: [],
                  });
                }}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Template
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Active (available for students to download)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Update Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorTemplateManagement;
