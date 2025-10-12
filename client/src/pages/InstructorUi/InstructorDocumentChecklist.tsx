import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckSquare,
  Square,
  User,
  Building2,
  Calendar,
  Loader2,
  ClipboardList,
  X,
} from "lucide-react";
import {
  instructorService,
  type InstructorStudent,
} from "../../services/instructorService";
import toast from "react-hot-toast";

interface DocumentStatus {
  id: string;
  name: string;
  category: "pre-deployment" | "upon-approval" | "post-ojt";
  required: boolean;
  status: "submitted" | "pending" | "approved" | "rejected";
  submittedDate?: string;
  reviewedDate?: string;
  remarks?: string;
}

interface StudentDocumentChecklist {
  studentId: string;
  studentName: string;
  studentNumber: string;
  company: string;
  documents: DocumentStatus[];
  overallProgress: number;
}

const DocumentChecklistTab = () => {
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [checklists, setChecklists] = useState<StudentDocumentChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Predefined document requirements
  const documentRequirements = [
    // PRE-DEPLOYMENT REQUIREMENTS
    {
      id: "record-file",
      name: "Record File",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "application-form",
      name: "Application for Internship (Form FM-AA-INT-01)",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "medical-certificate",
      name: "Medical Certificate",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "psychological-test",
      name: "Psychological Test",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "units-certification",
      name: "Certification of Units Earned (Form FM-AA-INT-02)",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "internship-resume",
      name: "Internship Resume (Form FM-AA-INT-03)",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "consent-form",
      name: "Consent Form (Form FM-AA-INT-04/05/06)",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "endorsement-letter",
      name: "Endorsement Letter (Form FM-AA-INT-07)",
      category: "pre-deployment" as const,
      required: true,
    },
    {
      id: "release-form",
      name: "Internship Release Form (Form FM-AA-INT-08)",
      category: "pre-deployment" as const,
      required: true,
    },

    // UPON APPROVAL OF COMPANY
    {
      id: "moa",
      name: "Memorandum of Agreement (Form FM-AA-INT-10)",
      category: "upon-approval" as const,
      required: true,
    },
    {
      id: "internship-permit",
      name: "Internship Permit (Form FM-AA-INT-09)",
      category: "upon-approval" as const,
      required: true,
    },
    {
      id: "training-agreement",
      name: "Training Agreement and Liability Waiver (Form FM-AA-INT-15)",
      category: "upon-approval" as const,
      required: true,
    },

    // POST-OJT REQUIREMENTS
    {
      id: "evaluation-form",
      name: "Internship Evaluation Form (Form FM-AA-INT-11)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "completion-certificate",
      name: "Certificate of Training Completion",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "narrative-report",
      name: "Internship Narrative Report",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "dtr-photocopy",
      name: "Photocopy of Daily Time Record",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "time-frames",
      name: "Internship Time Frames (Form FM-AA-INT-14)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "weekly-reports",
      name: "Weekly Reports (Form FM-AA-INT-16)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "student-feedback",
      name: "Student-Trainee's Feedback Form (Form FM-AA-INT-17)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "supervisor-feedback",
      name: "Training Supervisor's Feedback Form (Form FM-AA-INT-18)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "evaluation-self",
      name: "Evaluation Instrument - Self Rate (Form FM-AA-INT-19a)",
      category: "post-ojt" as const,
      required: true,
    },
    {
      id: "evaluation-student",
      name: "Evaluation Instrument - Student (Form FM-AA-INT-19b)",
      category: "post-ojt" as const,
      required: true,
    },
  ];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await instructorService.getAssignedStudents();
      setStudents(studentsData);

      // Generate checklists for each student
      const generatedChecklists = studentsData.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        studentNumber: student.studentId,
        company: student.company,
        documents: documentRequirements.map((doc) => ({
          id: doc.id,
          name: doc.name,
          category: doc.category,
          required: doc.required,
          status: getRandomDocumentStatus(), // Simulate document status
          submittedDate:
            Math.random() > 0.5 ? new Date().toISOString() : undefined,
          reviewedDate:
            Math.random() > 0.7 ? new Date().toISOString() : undefined,
          remarks: Math.random() > 0.8 ? "Document looks good" : undefined,
        })),
        overallProgress: 0,
      }));

      // Calculate overall progress
      const checklistsWithProgress = generatedChecklists.map((checklist) => ({
        ...checklist,
        overallProgress: calculateProgress(checklist.documents),
      }));

      setChecklists(checklistsWithProgress);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load student document checklists");
    } finally {
      setLoading(false);
    }
  };

  const getRandomDocumentStatus = ():
    | "submitted"
    | "pending"
    | "approved"
    | "rejected" => {
    const statuses = ["pending", "submitted", "approved", "rejected"];
    const weights = [0.3, 0.2, 0.4, 0.1]; // More approved documents
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return statuses[i] as any;
      }
    }

    return "pending";
  };

  const calculateProgress = (documents: DocumentStatus[]): number => {
    const approvedDocuments = documents.filter(
      (doc) => doc.status === "approved"
    ).length;
    return Math.round((approvedDocuments / documents.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "submitted":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "submitted":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const filteredChecklists = checklists.filter((checklist) => {
    const matchesSearch =
      checklist.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checklist.studentNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      checklist.company.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (filterStatus !== "all") {
      if (filterStatus === "complete") {
        matchesStatus = checklist.overallProgress === 100;
      } else if (filterStatus === "incomplete") {
        matchesStatus = checklist.overallProgress < 100;
      } else if (filterStatus === "high-progress") {
        matchesStatus = checklist.overallProgress >= 80;
      } else if (filterStatus === "low-progress") {
        matchesStatus = checklist.overallProgress < 40;
      }
    }

    let matchesCategory = true;
    if (filterCategory !== "all") {
      matchesCategory = checklist.documents.some(
        (doc) => doc.category === filterCategory
      );
    }

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: checklists.length,
    complete: checklists.filter((c) => c.overallProgress === 100).length,
    highProgress: checklists.filter((c) => c.overallProgress >= 80).length,
    lowProgress: checklists.filter((c) => c.overallProgress < 40).length,
    averageProgress:
      checklists.length > 0
        ? Math.round(
            checklists.reduce((sum, c) => sum + c.overallProgress, 0) /
              checklists.length
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading document checklists...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Checklist
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track document submission status for each student
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.complete}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High Progress
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.highProgress}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Low Progress
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.lowProgress}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Progress</option>
            <option value="complete">Complete (100%)</option>
            <option value="high-progress">High Progress (80%+)</option>
            <option value="incomplete">Incomplete</option>
            <option value="low-progress">Low Progress (&lt;40%)</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-w-[140px] text-sm"
          >
            <option value="all">All Categories</option>
            <option value="pre-deployment">Pre-Deployment</option>
            <option value="upon-approval">Upon Approval</option>
            <option value="post-ojt">Post-OJT</option>
          </select>
        </div>
      </div>

      {/* Student Checklist Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="col-span-4">Student</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {filteredChecklists.map((checklist) => (
            <div
              key={checklist.studentId}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Student Info */}
                <div className="col-span-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {checklist.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {checklist.studentName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {checklist.studentNumber}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {checklist.overallProgress}%
                    </div>
                    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${getProgressColor(
                          checklist.overallProgress
                        )}`}
                        style={{ width: `${checklist.overallProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {
                      checklist.documents.filter((d) => d.status === "approved")
                        .length
                    }{" "}
                    / {checklist.documents.length} documents
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      checklist.overallProgress === 100
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : checklist.overallProgress >= 80
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        : checklist.overallProgress >= 40
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {checklist.overallProgress === 100
                      ? "Complete"
                      : checklist.overallProgress >= 80
                      ? "High Progress"
                      : checklist.overallProgress >= 40
                      ? "In Progress"
                      : "Low Progress"}
                  </span>
                </div>

                {/* Company */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {checklist.company}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setExpandedStudent(
                        expandedStudent === checklist.studentId
                          ? null
                          : checklist.studentId
                      )
                    }
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Student Details Modal */}
      {expandedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Document Checklist Details
                </h3>
                <button
                  onClick={() => setExpandedStudent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const checklist = checklists.find(
                  (c) => c.studentId === expandedStudent
                );
                if (!checklist) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pre-Deployment Documents */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Pre-Deployment
                      </h4>
                      <div className="space-y-2">
                        {checklist.documents
                          .filter((doc) => doc.category === "pre-deployment")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {getStatusIcon(doc.status)}
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                  doc.status
                                )}`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Upon Approval Documents */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
                        Upon Approval
                      </h4>
                      <div className="space-y-2">
                        {checklist.documents
                          .filter((doc) => doc.category === "upon-approval")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {getStatusIcon(doc.status)}
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                  doc.status
                                )}`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Post-OJT Documents */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-green-600" />
                        Post-OJT
                      </h4>
                      <div className="space-y-2">
                        {checklist.documents
                          .filter((doc) => doc.category === "post-ojt")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {getStatusIcon(doc.status)}
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                  doc.status
                                )}`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {filteredChecklists.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No students found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentChecklistTab;
