import { useState, useEffect } from "react";
import {
  Upload,
  Download,
  FileText,
  Trash2,
  //Eye,
  Plus,
  Search,
  //Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface DocumentTemplate {
  id: string;
  name: string;
  category: "pre-deployment" | "upon-approval" | "post-ojt";
  description: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  required: boolean;
}

const DocumentTemplatesTab = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "pre-deployment" as const,
    description: "",
    required: true,
  });

  // Predefined document templates based on requirements
  const predefinedTemplates = [
    // PRE-DEPLOYMENT REQUIREMENTS
    {
      name: "Record File",
      category: "pre-deployment" as const,
      description: "Student's academic record file",
      required: true,
    },
    {
      name: "Application for Internship (Form FM-AA-INT-01)",
      category: "pre-deployment" as const,
      description: "Official application form for internship",
      required: true,
    },
    {
      name: "Medical Certificate",
      category: "pre-deployment" as const,
      description: "Medical certificate from government physician",
      required: true,
    },
    {
      name: "Psychological Test",
      category: "pre-deployment" as const,
      description: "Psychological test from government physician",
      required: true,
    },
    {
      name: "Certification of Units Earned (Form FM-AA-INT-02)",
      category: "pre-deployment" as const,
      description: "Certification of units earned for practicum/internship",
      required: true,
    },
    {
      name: "Internship Resume (Form FM-AA-INT-03)",
      category: "pre-deployment" as const,
      description: "Student's internship resume",
      required: true,
    },
    {
      name: "Consent Form (Form FM-AA-INT-04/05/06)",
      category: "pre-deployment" as const,
      description: "Consent form for internship participation",
      required: true,
    },
    {
      name: "Endorsement Letter (Form FM-AA-INT-07)",
      category: "pre-deployment" as const,
      description: "Official endorsement letter for internship",
      required: true,
    },
    {
      name: "Internship Release Form (Form FM-AA-INT-08)",
      category: "pre-deployment" as const,
      description: "Form for internship release",
      required: true,
    },
    // UPON APPROVAL OF COMPANY
    {
      name: "Memorandum of Agreement (Form FM-AA-INT-10)",
      category: "upon-approval" as const,
      description: "MOA between university and company",
      required: true,
    },
    {
      name: "Internship Permit (Form FM-AA-INT-09)",
      category: "upon-approval" as const,
      description: "Official internship permit",
      required: true,
    },
    {
      name: "Training Agreement and Liability Waiver (Form FM-AA-INT-15)",
      category: "upon-approval" as const,
      description: "Training agreement for overtime cases",
      required: true,
    },
    // POST-OJT REQUIREMENTS
    {
      name: "Internship Evaluation Form (Form FM-AA-INT-11)",
      category: "post-ojt" as const,
      description: "Evaluation form for internship completion",
      required: true,
    },
    {
      name: "Certificate of Training Completion",
      category: "post-ojt" as const,
      description: "Certificate from HTE/Agency",
      required: true,
    },
    {
      name: "Internship Narrative Report",
      category: "post-ojt" as const,
      description: "Narrative report by student-intern",
      required: true,
    },
    {
      name: "Photocopy of Daily Time Record",
      category: "post-ojt" as const,
      description: "DTR photocopy for attendance verification",
      required: true,
    },
    {
      name: "Internship Time Frames (Form FM-AA-INT-14)",
      category: "post-ojt" as const,
      description: "Time frames documentation",
      required: true,
    },
    {
      name: "Weekly Reports (Form FM-AA-INT-16)",
      category: "post-ojt" as const,
      description: "Practicum/internship weekly reports",
      required: true,
    },
    {
      name: "Student-Trainee's Feedback Form (Form FM-AA-INT-17)",
      category: "post-ojt" as const,
      description: "Feedback form from student-trainee",
      required: true,
    },
    {
      name: "Training Supervisor's Feedback Form (Form FM-AA-INT-18)",
      category: "post-ojt" as const,
      description: "Feedback form from training supervisor",
      required: true,
    },
    {
      name: "Evaluation Instrument - Self Rate (Form FM-AA-INT-19a)",
      category: "post-ojt" as const,
      description: "Self-evaluation instrument for PSU partner agencies",
      required: true,
    },
    {
      name: "Evaluation Instrument - Student (Form FM-AA-INT-19b)",
      category: "post-ojt" as const,
      description: "Student evaluation instrument for PSU partner agencies",
      required: true,
    },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // For now, use predefined templates
      // Later this can be replaced with API call to fetch uploaded templates
      const templateData = predefinedTemplates.map((template, index) => ({
        id: `template-${index}`,
        name: template.name,
        category: template.category,
        description: template.description,
        fileName: `${template.name}.pdf`,
        fileSize: "0 KB", // Will be updated when file is uploaded
        uploadedAt: new Date().toISOString(),
        required: template.required,
      }));
      setTemplates(templateData);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load document templates");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !newTemplate.name) {
      toast.error("Please select a file and enter template name");
      return;
    }

    try {
      setUploading(true);

      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newTemplateData: DocumentTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplate.name,
        category: newTemplate.category,
        description: newTemplate.description,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(2)} KB`,
        uploadedAt: new Date().toISOString(),
        required: newTemplate.required,
      };

      setTemplates((prev) => [...prev, newTemplateData]);
      toast.success("Document template uploaded successfully!");

      // Reset form
      setNewTemplate({
        name: "",
        category: "pre-deployment",
        description: "",
        required: true,
      });
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Error uploading template:", error);
      toast.error("Failed to upload document template");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (template: DocumentTemplate) => {
    // Simulate download
    toast.success(`Downloading ${template.fileName}...`);
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("Template deleted successfully!");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "pre-deployment":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "upon-approval":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "post-ojt":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pre-deployment":
        return <AlertCircle className="w-4 h-4" />;
      case "upon-approval":
        return <CheckCircle className="w-4 h-4" />;
      case "post-ojt":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: templates.length,
    preDeployment: templates.filter((t) => t.category === "pre-deployment")
      .length,
    uponApproval: templates.filter((t) => t.category === "upon-approval")
      .length,
    postOjt: templates.filter((t) => t.category === "post-ojt").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading document templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage document templates that students need to fill out
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Templates
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pre-Deployment
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.preDeployment}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upon Approval
              </p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.uponApproval}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Post-OJT
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.postOjt}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <XCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-80"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="pre-deployment">Pre-Deployment</option>
            <option value="upon-approval">Upon Approval</option>
            <option value="post-ojt">Post-OJT</option>
          </select>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  <span
                    className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(
                      template.category
                    )}`}
                  >
                    {getCategoryIcon(template.category)}
                    <span>{template.category.replace("-", " ")}</span>
                  </span>
                </div>
                {template.required && (
                  <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
                    Required
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{template.fileName}</span>
                <span>{template.fileSize}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(template)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No templates found
          </p>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upload Document Template
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter template name..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      category: e.target.value as any,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pre-deployment">Pre-Deployment</option>
                  <option value="upon-approval">Upon Approval</option>
                  <option value="post-ojt">Post-OJT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter template description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={newTemplate.required}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="required"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  This document is required for students
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading || !selectedFile || !newTemplate.name}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Template</span>
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

export default DocumentTemplatesTab;
