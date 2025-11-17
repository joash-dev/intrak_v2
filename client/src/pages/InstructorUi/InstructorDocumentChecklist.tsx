import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Download,
  Eye,
  AlertCircle,
  CheckSquare,
  User,
  Loader2,
  ClipboardList,
  X,
} from "lucide-react";
import { instructorService, type InstructorDocument } from "../../services/instructorService";
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

      // Fetch documents visible to instructor (assigned students)
      const docs = await instructorService.getDocumentsForReview();

      // Map requirement id -> backend document type
      const requirementToType: Record<string, string> = {
        "record-file": "RECORD_FILE",
        "application-form": "APPLICATION_INTERNSHIP",
        "medical-certificate": "MEDICAL_CERTIFICATE",
        "psychological-test": "MEDICAL_CERTIFICATE", // fallback: share same bucket
        "units-certification": "CERTIFICATION_UNITS",
        "internship-resume": "INTERNSHIP_RESUME",
        "consent-form": "CONSENT_FORM",
        "endorsement-letter": "ENDORSEMENT_LETTER",
        "release-form": "INTERNSHIP_RELEASE",
        "moa": "INTERNSHIP_AGREEMENT",
        "internship-permit": "INTERNSHIP_RESUME", // no exact type in schema; fallback
        "training-agreement": "TRAINING_AGREEMENT",
        "evaluation-form": "INTERNSHIP_EVALUATION",
        "completion-certificate": "CERTIFICATE_COMPLETION",
        "narrative-report": "NARRATIVE_REPORT",
        "dtr-photocopy": "DTR_PHOTOCOPY",
        "time-frames": "TIME_FRAMES",
        "weekly-reports": "WEEKLY_REPORTS",
        "student-feedback": "STUDENT_FEEDBACK",
        "supervisor-feedback": "SUPERVISOR_FEEDBACK",
        "evaluation-self": "AGENCY_SELF_EVALUATION",
        "evaluation-student": "AGENCY_STUDENT_EVALUATION",
      };

      // Build map: studentName -> documents
      const studentNameToDocs = docs.reduce<Record<string, InstructorDocument[]>>((acc, d) => {
        const key = (d.studentName || "").trim();
        if (!acc[key]) acc[key] = [];
        acc[key].push(d);
        return acc;
      }, {});

      // Generate checklists from real documents
      const generatedChecklists = studentsData.map((student) => {
        const studentDocs = studentNameToDocs[student.name] || [];

        const documents: DocumentStatus[] = documentRequirements.map((req) => {
          const backendType = requirementToType[req.id];
          const candidates = backendType
            ? studentDocs.filter((d) => d.documentType === backendType)
            : [];

          // Choose newest by submittedDate (string like '1 hour ago' or date) – fallback to array order
          const latest = candidates[0] || null;

          // Map backend status to checklist status:
          // - None => pending
          // - PENDING => submitted
          // - APPROVED => approved
          // - REJECTED or RESUBMISSION_REQUESTED => rejected
          let status: DocumentStatus["status"] = "pending";
          if (latest) {
            const s = (latest.status || "PENDING").toUpperCase();
            if (s === "PENDING") status = "submitted";
            else if (s === "APPROVED") status = "approved";
            else if (s === "REJECTED" || s === "RESUBMISSION_REQUESTED") status = "rejected";
          }

          return {
            id: req.id,
            name: req.name,
            category: req.category,
            required: req.required,
            status,
            submittedDate: latest ? latest.submittedDate : undefined,
            reviewedDate: latest ? latest.reviewedDate : undefined,
            remarks: latest?.remarks || undefined,
          };
        });

        return {
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.studentId,
          company: student.company,
          documents,
          overallProgress: calculateProgress(documents),
        };
      });

      setChecklists(generatedChecklists);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load student document checklists");
    } finally {
      setLoading(false);
    }
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
        return null; // no leading mark for submitted; badge on the right suffices
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null; // pending: no mark
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
      <div className="flex items-center justify-center min-h-screen font-outfit">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading document checklists...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Please wait while we fetch student data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-outfit">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-blue-100 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Document Checklist
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                Track document submission status for each student
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Complete
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.complete}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                High Progress
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.highProgress}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Low Progress
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.lowProgress}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[160px] font-medium"
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
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full sm:w-auto sm:min-w-[160px] font-medium"
            >
              <option value="all">All Categories</option>
              <option value="pre-deployment">Pre-Deployment</option>
              <option value="upon-approval">Upon Approval</option>
              <option value="post-ojt">Post-OJT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3.5 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            <div className="col-span-4">Student</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredChecklists.map((checklist) => (
            <div
              key={checklist.studentId}
              className="px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-150"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Student Info */}
                <div className="col-span-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {checklist.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {checklist.studentName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                      {checklist.studentNumber}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="col-span-2">
                  <div className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                    {checklist.overallProgress}%
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(
                        checklist.overallProgress
                      )}`}
                      style={{ width: `${checklist.overallProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
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
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                      checklist.overallProgress === 100
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : checklist.overallProgress >= 80
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : checklist.overallProgress >= 40
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
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
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {checklist.company}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center space-x-1.5">
                  <button
                    onClick={() =>
                      setExpandedStudent(
                        expandedStudent === checklist.studentId
                          ? null
                          : checklist.studentId
                      )
                    }
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
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

      {/* Mobile Card View - Hidden on Desktop */}
      <div className="lg:hidden space-y-3">
        {filteredChecklists.map((checklist) => (
          <div
            key={checklist.studentId}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4"
          >
            {/* Student Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {checklist.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {checklist.studentName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    {checklist.studentNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  onClick={() =>
                    setExpandedStudent(
                      expandedStudent === checklist.studentId
                        ? null
                        : checklist.studentId
                    )
                  }
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                  title="Download Report"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {checklist.overallProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                    checklist.overallProgress
                  )}`}
                  style={{ width: `${checklist.overallProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {
                  checklist.documents.filter((d) => d.status === "approved")
                    .length
                }{" "}
                / {checklist.documents.length} documents
              </p>
            </div>

            {/* Status and Company Row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Company:
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                  {checklist.company}
                </span>
              </div>
              <span
                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  checklist.overallProgress === 100
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : checklist.overallProgress >= 80
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : checklist.overallProgress >= 40
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
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
          </div>
        ))}
      </div>

      {/* Expanded Student Details Modal */}
      {expandedStudent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ margin: "0" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-5xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  Document Checklist Details
                </h3>
                <button
                  onClick={() => setExpandedStudent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1">
              {(() => {
                const checklist = checklists.find(
                  (c) => c.studentId === expandedStudent
                );
                if (!checklist) return null;

                return (
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                    {/* Pre-Deployment Documents */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                      <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span>Pre-Deployment Documents</span>
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {checklist.documents
                          .filter((doc) => doc.category === "pre-deployment")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(doc.status)}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold uppercase flex-shrink-0 ml-2 ${getStatusColor(
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
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                      <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-yellow-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span>Upon Approval Documents</span>
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {checklist.documents
                          .filter((doc) => doc.category === "upon-approval")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(doc.status)}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold uppercase flex-shrink-0 ml-2 ${getStatusColor(
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
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                      <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 lg:mb-6 flex items-center">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <span>Post-OJT Documents</span>
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {checklist.documents
                          .filter((doc) => doc.category === "post-ojt")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(doc.status)}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                                  {doc.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold uppercase flex-shrink-0 ml-2 ${getStatusColor(
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-12 text-center shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            No students match your current search criteria
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your search terms or filters to find students
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentChecklistTab;
