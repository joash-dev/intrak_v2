import React, { useState, useEffect } from "react";
import {
  Star,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  X,
  Loader2,
  FileCheck,
} from "lucide-react";
import { documentService, type Document } from "../../services/documentService";
import { dashboardService } from "../../services/dashboardService";
import { supervisorService, type EvaluationExportPayload } from "../../services/supervisorService";
import { toast } from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

interface TerminationData {
  lackOfWork?: boolean;
  violationRules?: boolean;
  unfavorableHabits?: boolean;
  altercation?: boolean;
  absencesTardiness?: boolean;
  disrespectful?: boolean;
  noInterest?: boolean;
  other?: boolean;
  otherSpecify?: string;
  futureEmployment?: boolean;
  needsImprovement?: boolean;
}

interface EvaluationForm {
  id: string;
  formNumber: string;
  formName: string;
  documentType: string;
  description: string;
  document: Document | null;
  evaluation?: {
    id: string;
    evaluatorName: string;
    evaluatorRole: string;
    date: string;
    overallRating: number;
    criteria: Record<string, {
      rating: number;
      remarks?: string;
    }>;
    comments: string;
    termination?: TerminationData;
  } | null;
}


const StudentEvaluationsTab: React.FC = () => {
  const [evaluationForms, setEvaluationForms] = useState<EvaluationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<EvaluationForm | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showEvaluationDetails, setShowEvaluationDetails] = useState(false);

  useEffect(() => {
    fetchEvaluationForms();
  }, []);

  const fetchEvaluationForms = async () => {
    try {
      setLoading(true);

      // Fetch documents for all forms (including Form 11 PDF)
      const documents = await documentService.getStudentDocuments();

      // Fetch student profile to get ID
      const studentProfile = await dashboardService.getStudentProfile();

      // Fetch Form 11 evaluations from API
      const evaluations: any[] = await dashboardService.getStudentEvaluations();
      const form11Evaluation = evaluations.length > 0 ? evaluations[0] : null;

      // Fetch Form 18 feedback
      let form18Feedback = null;
      try {
        if (studentProfile?.id) {
          console.log("Fetching Form 18 feedback for student ID:", studentProfile.id);
          const feedback = await supervisorService.getSupervisorFeedback(studentProfile.id);
          if (feedback && feedback.id) {
            form18Feedback = feedback;
            console.log("✅ Form 18 feedback found:", {
              id: feedback.id,
              supervisor: feedback.supervisor?.name,
              ratings: {
                punctual: feedback.punctualRating,
                knowledge: feedback.knowledgeRating,
                teamwork: feedback.teamworkRating,
              }
            });
          } else {
            console.log("⚠️ Form 18 feedback API returned null or missing ID - feedback may not exist yet");
          }
        } else {
          console.warn("⚠️ Student profile ID not found:", studentProfile);
        }
      } catch (error: any) {
        // Only log if it's not a 404 (which means no feedback exists yet)
        if (error?.response?.status !== 404) {
          console.error("❌ Error fetching Form 18 feedback:", error);
        } else {
          console.log("ℹ️ Form 18 feedback not found (404) - supervisor hasn't submitted feedback yet for this student");
        }
      }

      // Fetch Form 19b - Agency Self Evaluation
      let form19bEvaluation = null;
      try {
        const evaluation = await supervisorService.getAgencySelfEvaluation();
        if (evaluation && evaluation.id) {
          form19bEvaluation = evaluation;
          console.log("✅ Form 19b evaluation found:", {
            id: evaluation.id,
            supervisor: evaluation.supervisor?.name,
          });
        }
      } catch (error: any) {
        // Only log if it's not a 404 (which means no evaluation exists yet)
        if (error?.response?.status !== 404) {
          console.error("❌ Error fetching Form 19b evaluation:", error);
        } else {
          console.log("ℹ️ Form 19b evaluation not found (404) - supervisor hasn't submitted it yet");
        }
      }

      // Find Form 11 DOCX document (INTERNSHIP_EVALUATION type) - for download
      const form11Document = documents.find(
        (doc) => doc.type === "INTERNSHIP_EVALUATION"
      );

      // Define the 3 evaluation forms
      const forms: EvaluationForm[] = [
        {
          id: "form-11",
          formNumber: "Form 11",
          formName: "Internship Evaluation Form",
          documentType: "INTERNSHIP_EVALUATION",
          description: "Evaluation form filled by your supervisor",
          document: form11Document || null,
          evaluation: form11Evaluation ? {
            id: form11Evaluation.id || "",
            evaluatorName: form11Evaluation.evaluatorName || "Unknown",
            evaluatorRole: form11Evaluation.evaluatorRole || "INDUSTRY_PARTNER",
            date: form11Evaluation.date || new Date().toISOString().split('T')[0],
            overallRating: form11Evaluation.overallRating || form11Evaluation.rating || 0,
            criteria: form11Evaluation.criteria || {},
            comments: form11Evaluation.comments || "",
            termination: (form11Evaluation as any).termination || undefined,
          } : null,
        },
        {
          id: "form-18",
          formNumber: "Form 18",
          formName: "Training Supervisor's Feedback Form",
          documentType: "SUPERVISOR_FEEDBACK",
          description: "Feedback form from your training supervisor",
          document: null,
          evaluation: form18Feedback ? {
            id: form18Feedback.id || "form-18-feedback",
            evaluatorName: form18Feedback.supervisor?.name || "Supervisor",
            evaluatorRole: "INDUSTRY_PARTNER",
            date: form18Feedback.updatedAt || form18Feedback.createdAt || new Date().toISOString(),
            overallRating: 0,
            criteria: {
              punctuality: { rating: form18Feedback.punctualRating || 0 },
              knowledge: { rating: form18Feedback.knowledgeRating || 0 },
              teamwork: { rating: form18Feedback.teamworkRating || 0 },
              taskPerformance: { rating: form18Feedback.taskPerformanceRating || 0 },
              policyCompliance: { rating: form18Feedback.policyComplianceRating || 0 },
              conduct: { rating: form18Feedback.conductRating || 0 },
              traits: { rating: form18Feedback.traitsRating || 0 },
            },
            comments: form18Feedback.comments || "",
          } : null,
        },
        {
          id: "form-19b",
          formNumber: "Form 19b",
          formName: "Evaluation Instrument of PSU Partner Agencies (Self Ratee)",
          documentType: "AGENCY_SELF_EVALUATION",
          description: "Agency self-evaluation form applicable to students",
          document: null,
          evaluation: form19bEvaluation ? {
            id: form19bEvaluation.id || "form-19b-evaluation",
            evaluatorName: form19bEvaluation.supervisor?.name || "Supervisor",
            evaluatorRole: "INDUSTRY_PARTNER",
            date: form19bEvaluation.updatedAt || form19bEvaluation.createdAt || new Date().toISOString(),
            overallRating: 0,
            criteria: {
              // Communication
              communicationConnectivity: { rating: form19bEvaluation.communicationConnectivity || 0 },
              communicationDialogue: { rating: form19bEvaluation.communicationDialogue || 0 },
              communicationParticipation: { rating: form19bEvaluation.communicationParticipation || 0 },
              // Ethical Dealings
              ethicalReputation: { rating: form19bEvaluation.ethicalReputation || 0 },
              ethicalCSR: { rating: form19bEvaluation.ethicalCSR || 0 },
              ethicalSupport: { rating: form19bEvaluation.ethicalSupport || 0 },
              // Student Satisfaction - PSU
              psuSupervisorQualified: { rating: form19bEvaluation.psuSupervisorQualified || 0 },
              psuSupportActivities: { rating: form19bEvaluation.psuSupportActivities || 0 },
              psuFacilities: { rating: form19bEvaluation.psuFacilities || 0 },
              // Student Satisfaction - HTE
              hteSupervision: { rating: form19bEvaluation.hteSupervision || 0 },
              hteSupervisorQualified: { rating: form19bEvaluation.hteSupervisorQualified || 0 },
              hteFeedback: { rating: form19bEvaluation.hteFeedback || 0 },
              // Quality Delivery
              qualityTimeliness: { rating: form19bEvaluation.qualityTimeliness || 0 },
              qualityObjectives: { rating: form19bEvaluation.qualityObjectives || 0 },
              qualityResources: { rating: form19bEvaluation.qualityResources || 0 },
            },
            comments: "",
          } : null,
        },
      ];

      // Match documents to forms (Form 18 and Form 19b)
      forms.forEach((form) => {
        if (form.id !== "form-11") {
          const matchingDoc = documents.find(
            (doc) => doc.type === form.documentType
          );
          if (matchingDoc) {
            form.document = matchingDoc;
          }
        }
      });

      // Debug: Log Form 18 evaluation status
      const form18 = forms.find(f => f.id === "form-18");
      console.log("Form 18 evaluation status:", {
        hasFeedback: !!form18Feedback,
        hasEvaluation: !!form18?.evaluation,
        feedback: form18Feedback,
        evaluation: form18?.evaluation
      });

      setEvaluationForms(forms);
    } catch (error) {
      console.error("Error fetching evaluation forms:", error);
      toast.error("Failed to load evaluation forms");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (form: EvaluationForm) => {
    // For Form 11, Form 18, and Form 19b, show evaluation details (scores and remarks)
    if (form.id === "form-11" || form.id === "form-18" || form.id === "form-19b") {
      if (!form.evaluation) {
        toast.error("Evaluation not available yet. Please wait for your supervisor to submit the evaluation.");
        return;
      }
      setSelectedForm(form);
      setShowEvaluationDetails(true);
      return;
    }

    // For other forms, show document preview
    if (!form.document) {
      toast.error("No document available to preview");
      return;
    }

    try {
      setPreviewLoading(true);
      setSelectedForm(form);
      const blob = await documentService.downloadDocument(form.document.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (form: EvaluationForm) => {
    // For Form 11, export the evaluation using the same endpoint as supervisor
    if (form.id === "form-11" && form.evaluation) {
      try {
        // Get student profile information
        const studentProfile = await dashboardService.getStudentProfile();

        // Calculate OJT grade
        const criteria = form.evaluation.criteria || {};
        const totalPoints = Object.values(criteria).reduce((sum, value) => {
          const rating = typeof value === 'object' && value !== null
            ? (value as { rating: number; remarks?: string }).rating
            : (typeof value === 'number' ? value : 0);
          return sum + rating;
        }, 0);
        const ojtGrade = (totalPoints * 10) + 50;

        // Transform criteria to match export payload format
        const competencies: Record<string, { rating: number; remarks: string }> = {};
        Object.entries(criteria).forEach(([key, value]) => {
          const rating = typeof value === 'object' && value !== null
            ? (value as { rating: number; remarks?: string }).rating
            : (typeof value === 'number' ? value : 0);
          const remarks = typeof value === 'object' && value !== null
            ? (value as { rating: number; remarks?: string }).remarks || ''
            : '';
          competencies[key] = { rating, remarks };
        });

        // Prepare export payload
        // studentProfile.company is a string (company name) from the API
        const companyName = studentProfile.company || 'N/A';
        // Company address is not available in student profile, use 'N/A'
        const companyAddress = 'N/A';

        const exportPayload: EvaluationExportPayload = {
          studentId: studentProfile.id,
          studentName: studentProfile.name,
          companyName,
          companyAddress,
          dateStarted: studentProfile.startDate || null,
          dateEnded: studentProfile.endDate || null,
          evaluatorName: form.evaluation.evaluatorName,
          evaluatorPosition: '', // Not available in evaluation data
          competencies,
          ojtGrade,
          termination: form.evaluation.termination,
        };

        // Export using the same method as supervisor
        await supervisorService.exportEvaluation(exportPayload);
        toast.success("Evaluation exported successfully");
      } catch (error) {
        console.error("Error exporting evaluation:", error);
        toast.error("Failed to export evaluation");
      }
      return;
    }

    // For Form 18, export using supervisor feedback export endpoint
    if (form.id === "form-18" && form.evaluation) {
      try {
        const studentProfile = await dashboardService.getStudentProfile();
        await supervisorService.exportSupervisorFeedback(studentProfile.id);
        toast.success("Feedback exported successfully");
      } catch (error) {
        console.error("Error exporting feedback:", error);
        toast.error("Failed to export feedback");
      }
      return;
    }

    // For Form 19b, export using agency self-evaluation export endpoint
    if (form.id === "form-19b" && form.evaluation) {
      try {
        await supervisorService.exportAgencySelfEvaluation();
        toast.success("Form 19b exported successfully");
      } catch (error) {
        console.error("Error exporting Form 19b:", error);
        toast.error("Failed to export Form 19b");
      }
      return;
    }

    // For other forms, download the document if available
    if (!form.document) {
      toast.error("No document available to download");
      return;
    }

    try {
      const blob = await documentService.downloadDocument(form.document.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = form.document.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const getStatusIcon = (form: EvaluationForm) => {
    if (form.id === "form-11" || (form.id === "form-18" && form.evaluation) || (form.id === "form-19b" && form.evaluation)) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }

    if (!form.document) {
      return <Clock className="w-5 h-5 text-gray-400" />;
    }
    switch (form.document.status) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "REJECTED":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (form: EvaluationForm) => {
    if (form.id === "form-11") {
      return "Export Available";
    }

    if (form.id === "form-18") {
      return form.evaluation ? "Export Available" : "Not Filled";
    }

    if (form.id === "form-19b") {
      return form.evaluation ? "Export Available" : "Not Filled";
    }

    if (!form.document) {
      return "Not Filled";
    }
    switch (form.document.status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending Review";
      case "REJECTED":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (form: EvaluationForm) => {
    if (form.id === "form-11") {
      if (form.document) {
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      }
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }

    if (form.id === "form-18" || form.id === "form-19b") {
      if (form.evaluation) {
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      }
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }

    if (!form.document) {
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
    switch (form.document.status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-6 font-outfit">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Supervisor Evaluations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View evaluations and feedback from your supervisor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="w-5 h-5 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex space-x-2 pt-4 mt-auto">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            evaluationForms.map((form) => (
              <div
                key={form.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Form Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {form.formNumber}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {form.formName}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(form)}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {form.description}
                </p>

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      form
                    )}`}
                  >
                    {getStatusText(form)}
                  </span>
                </div>

                {/* Document Info for Form 19b only (Form 18 doesn't have documents) */}
                {form.id === "form-19b" && form.document && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Uploaded:{" "}
                      {new Date(form.document.uploadedAt || "").toLocaleDateString()}
                    </p>
                    {form.document.reviewedAt && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Reviewed:{" "}
                        {new Date(form.document.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-auto">
                  {form.id === "form-11" ? (
                    form.evaluation ? (
                      <>
                        <button
                          onClick={() => handlePreview(form)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors min-w-[140px]"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        {form.document && (
                          <button
                            onClick={() => handleDownload(form)}
                            className="flex items-center justify-center px-4 py-2.5 h-10 w-10 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            title="Export"
                          >
                            <Download className="w-6 h-6" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                        Evaluation not submitted yet
                      </div>
                    )
                  ) : form.id === "form-18" ? (
                    form.evaluation ? (
                      <>
                        <button
                          onClick={() => handlePreview(form)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors min-w-[140px]"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => handleDownload(form)}
                          className="flex items-center justify-center px-4 py-2.5 h-10 w-10 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                          title="Export"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                        Not yet filled by supervisor
                      </div>
                    )
                  ) : form.id === "form-19b" ? (
                    form.evaluation ? (
                      <>
                        <button
                          onClick={() => handlePreview(form)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors min-w-[140px]"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => handleDownload(form)}
                          className="flex items-center justify-center px-4 py-2.5 h-10 w-10 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                          title="Export"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                        Not yet filled by supervisor
                      </div>
                    )
                  ) : form.document ? (
                    <>
                      <button
                        onClick={() => handlePreview(form)}
                        disabled={previewLoading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownload(form)}
                        className="flex items-center justify-center px-4 py-2.5 h-10 w-10 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                      Not yet filled by supervisor
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
      </div>

      {/* Evaluation Details Modal (Form 11) */}
      {showEvaluationDetails && selectedForm && selectedForm.evaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ marginTop: 0 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedForm.formNumber} - {selectedForm.formName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Evaluation Details
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEvaluationDetails(false);
                  setSelectedForm(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Evaluation Content */}
            <div className="flex-1 overflow-auto p-6 scrollbar-slim">
              <div className="space-y-6">
                {/* Evaluator Info */}
                <div className="bg-purple-50 dark:bg-slate-800 rounded-lg p-6 border border-purple-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Evaluator Information
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Evaluator:</span>{" "}
                      <span className="text-gray-900 dark:text-white">{selectedForm.evaluation.evaluatorName}</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Date:</span>{" "}
                      <span className="text-gray-900 dark:text-white">{new Date(selectedForm.evaluation.date).toLocaleDateString()}</span>
                    </p>
                    {selectedForm.id === "form-11" && (
                      <>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Overall Rating:</span>{" "}
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {selectedForm.evaluation.overallRating.toFixed(1)} / 5.0
                          </span>
                        </p>
                        {/* OJT Grade Calculation - Only for Form 11 */}
                        {(() => {
                          const criteria = selectedForm.evaluation.criteria || {};
                          const totalPoints = Object.values(criteria).reduce((sum, value) => {
                            const rating = typeof value === 'object' && value !== null
                              ? (value as { rating: number; remarks?: string }).rating
                              : (typeof value === 'number' ? value : 0);
                            return sum + rating;
                          }, 0);
                          const ojtGrade = (totalPoints * 10) + 50;
                          return (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">OJT Grade:</span>{" "}
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {ojtGrade.toFixed(0)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                (Total Points: {totalPoints} × 10 + 50)
                              </span>
                            </p>
                          );
                        })()}
                      </>
                    )}
                    {selectedForm.id === "form-18" && (() => {
                      // Calculate average rating for Form 18
                      const criteria = selectedForm.evaluation.criteria || {};
                      const ratings = Object.values(criteria).map(value => {
                        return typeof value === 'object' && value !== null
                          ? (value as { rating: number; remarks?: string }).rating
                          : (typeof value === 'number' ? value : 0);
                      }).filter(r => r > 0);
                      const averageRating = ratings.length > 0
                        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
                        : 0;
                      return (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Average Rating:</span>{" "}
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {averageRating.toFixed(2)} / 5.0
                          </span>
                        </p>
                      );
                    })()}
                    {selectedForm.id === "form-19b" && (() => {
                      // Calculate average rating for Form 19b
                      const criteria = selectedForm.evaluation.criteria || {};
                      const ratings = Object.values(criteria).map(value => {
                        return typeof value === 'object' && value !== null
                          ? (value as { rating: number; remarks?: string }).rating
                          : (typeof value === 'number' ? value : 0);
                      }).filter(r => r > 0);
                      const averageRating = ratings.length > 0
                        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
                        : 0;
                      return (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Average Rating:</span>{" "}
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {averageRating.toFixed(2)} / 5.0
                          </span>
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Competency Ratings */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedForm.id === "form-18" ? "Feedback Ratings" : selectedForm.id === "form-19b" ? "Evaluation Criteria Ratings" : "Competency Ratings"}
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const criteria = selectedForm.evaluation.criteria || {};

                      // Form 19b criteria mapping
                      if (selectedForm.id === "form-19b") {
                        const form19bCriteria: Array<{ key: string; label: string; section: string }> = [
                          // Communication
                          { key: "communicationConnectivity", label: "High connectivity through electronic communication.", section: "I. Communication" },
                          { key: "communicationDialogue", label: "Management accepts requests for dialogue.", section: "I. Communication" },
                          { key: "communicationParticipation", label: "Management participates in university activities.", section: "I. Communication" },
                          // Ethical Dealings
                          { key: "ethicalReputation", label: "High reputation and stature.", section: "II. Ethical Dealings" },
                          { key: "ethicalCSR", label: "Established Corporate Social Responsibility (CSR).", section: "II. Ethical Dealings" },
                          { key: "ethicalSupport", label: "Support for educational institution mandate.", section: "II. Ethical Dealings" },
                          // Student Satisfaction - PSU
                          { key: "psuSupervisorQualified", label: "Qualified supervisors are provided by the university.", section: "III. Student Satisfaction - PSU" },
                          { key: "psuSupportActivities", label: "University provides support for activities.", section: "III. Student Satisfaction - PSU" },
                          { key: "psuFacilities", label: "Availability of facilities for student-interns.", section: "III. Student Satisfaction - PSU" },
                          // Student Satisfaction - HTE
                          { key: "hteSupervision", label: "Required supervision is provided by the Host Training Establishment (HTE).", section: "IV. Student Satisfaction - HTE" },
                          { key: "hteSupervisorQualified", label: "Qualified host training supervisors are provided.", section: "IV. Student Satisfaction - HTE" },
                          { key: "hteFeedback", label: "Feedback and coaching are provided to student-interns.", section: "IV. Student Satisfaction - HTE" },
                          // Quality Delivery
                          { key: "qualityTimeliness", label: "Timeliness are strictly observed.", section: "V. Quality Delivery" },
                          { key: "qualityObjectives", label: "Objectives specified in Internship Plan are met.", section: "V. Quality Delivery" },
                          { key: "qualityResources", label: "Adequate resources needed for the Internship purpose are made accessible and provided.", section: "V. Quality Delivery" },
                        ];

                        let currentSection = "";
                        let itemIndex = 0;
                        return form19bCriteria.map(({ key, label, section }) => {
                          const value = criteria[key];
                          if (!value) return null;

                          const rating = typeof value === 'object' && value !== null
                            ? (value as { rating: number; remarks?: string }).rating
                            : (typeof value === 'number' ? value : 0);

                          if (rating === 0) return null;

                          // Show section header when section changes
                          const showSectionHeader = currentSection !== section;
                          if (showSectionHeader) {
                            currentSection = section;
                            itemIndex = 0;
                          }
                          itemIndex++;

                          return (
                            <div key={key}>
                              {showSectionHeader && (
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-4 first:mt-0">
                                  {section}
                                </h4>
                              )}
                              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 mr-4">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                      {itemIndex}. {label}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300 dark:text-gray-600"
                                          }`}
                                      />
                                    ))}
                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                      {rating} / 5
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      }

                      // Form 18 criteria mapping
                      if (selectedForm.id === "form-18") {
                        const form18Criteria: Array<{ key: string; label: string }> = [
                          { key: "punctuality", label: "The student-trainee is punctual in attending works and assignments" },
                          { key: "knowledge", label: "The student-trainee has sufficient knowledge to contribute in the organization" },
                          { key: "teamwork", label: "The student-trainee knows how to work with the group" },
                          { key: "taskPerformance", label: "The student-trainee performs tasks as prescribed in the Internship Training Plan" },
                          { key: "policyCompliance", label: "The student-trainee follows and abides with the policies of the company" },
                          { key: "conduct", label: "The student-trainee maintains an upright conduct while in the company" },
                          { key: "traits", label: "The student-trainee shows desirable traits, virtues, and work habits" },
                        ];

                        return form18Criteria.map(({ key, label }, index) => {
                          const value = criteria[key];
                          if (!value) return null;

                          const rating = typeof value === 'object' && value !== null
                            ? (value as { rating: number; remarks?: string }).rating
                            : (typeof value === 'number' ? value : 0);
                          const remarks = typeof value === 'object' && value !== null
                            ? (value as { rating: number; remarks?: string }).remarks
                            : '';

                          if (rating === 0) return null;

                          return (
                            <div
                              key={key}
                              className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 mr-4">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {index + 1}. {label}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-5 h-5 ${star <= rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                        }`}
                                    />
                                  ))}
                                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {rating} / 5
                                  </span>
                                </div>
                              </div>
                              {remarks && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Remarks:</span> {remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        });
                      }

                      // Form 11 competency order and mapping
                      const competencyOrder: Array<{ key: string; displayName: string }> = [
                        { key: "abilityToLearn", displayName: "ABILITY TO LEARN" },
                        { key: "workAttitude", displayName: "WORK ATTITUDE" },
                        { key: "conduct", displayName: "CONDUCT" },
                        { key: "motivationInitiative", displayName: "MOTIVATION/INITIATIVE" },
                        { key: "qualityAccuracy", displayName: "QUALITY AND ACCURACY" },
                        { key: "quantityOfWork", displayName: "QUANTITY OF WORK" },
                        { key: "safetyPractices", displayName: "SAFETY PRACTICES" },
                        { key: "appearanceHygiene", displayName: "APPEARANCE/HYGIENE" },
                      ];

                      return competencyOrder.map(({ key, displayName }) => {
                        const value = criteria[key];
                        if (!value) return null;

                        const rating = typeof value === 'object' && value !== null
                          ? (value as { rating: number; remarks?: string }).rating
                          : (typeof value === 'number' ? value : 0);
                        const remarks = typeof value === 'object' && value !== null
                          ? (value as { rating: number; remarks?: string }).remarks
                          : '';

                        return (
                          <div
                            key={key}
                            className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {displayName}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <= rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300 dark:text-gray-600"
                                      }`}
                                  />
                                ))}
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                  {rating} / 5
                                </span>
                              </div>
                            </div>
                            {remarks && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Remarks:</span> {remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Overall Comments */}
                {selectedForm.evaluation.comments && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Overall Comments
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedForm.evaluation.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEvaluationDetails(false);
                  setSelectedForm(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
              {(selectedForm.document || (selectedForm.id === "form-18" && selectedForm.evaluation)) && (
                <button
                  onClick={() => {
                    handleDownload(selectedForm);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-6 h-6" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal (Form 18 and Form 19b) */}
      {selectedForm && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ marginTop: 0 }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedForm.formNumber} - {selectedForm.formName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Preview Document
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedForm(null);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[500px] rounded-lg border border-gray-200 dark:border-gray-700"
                  title="Document Preview"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSelectedForm(null);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedForm.document && (
                <button
                  onClick={() => handleDownload(selectedForm)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-6 h-6" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEvaluationsTab;
