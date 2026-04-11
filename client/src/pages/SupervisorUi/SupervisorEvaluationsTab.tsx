import { useState, useEffect } from "react";
import {
  Award,
  AlertCircle,
  Search,
  X,
  CheckCircle,
  Loader2,
  Star,
  TrendingUp,
  FileText,
  Download,
  LayoutGrid,
  List,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type {
  SupervisorStudent,
  InternshipEvaluationData,
} from "../../services/supervisorService";
import toast from "react-hot-toast";
import { devLog } from "../../utils/devLog";

type CompetencyConfig = {
  id: string;
  title: string;
  weight: string;
  criteria: { rating: number; text: string }[];
};

const competencyList: CompetencyConfig[] = [
  {
    id: "abilityToLearn",
    title: "A. Ability to Learn (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Grasps new ideas quickly, can readily apply knowledge to new situations, flexible problem solver",
      },
      {
        rating: 4,
        text: "Learns quickly, applies past experiences",
      },
      {
        rating: 3,
        text: "Usually understands instructions; usually has good judgment and reasoning",
      },
      {
        rating: 2,
        text: "Slow to grasp concepts, sometimes does not remember important facts and procedures",
      },
      {
        rating: 1,
        text: "Does not easily understand; needs repeated instructions on the same tasks.",
      },
    ],
  },
  {
    id: "workAttitude",
    title: "B. Work Attitude (15%)",
    weight: "15%",
    criteria: [
      {
        rating: 5,
        text: "Possesses a positive perspective; always upbeat and ready to work; a pleasure to work with; always reports to work ahead of time without any absences and tardiness",
      },
      {
        rating: 4,
        text: "Accepts all work assignments; rarely complains; communicates well with superiors and coworkers; observes regularity and punctuality in attendance",
      },
      {
        rating: 3,
        text: "Takes setback in strides; pleasant and cooperative in most situations; reports to work on time with minimal absences or tardiness.",
      },
      {
        rating: 2,
        text: "Complains that many things are unfair, a whiner; reports to work but sometimes tardy and absent.",
      },
      {
        rating: 1,
        text: "Continually gripes about work assignments; disturbs others; uncooperative; temperamental; frequent absences or tardiness.",
      },
    ],
  },
  {
    id: "conduct",
    title: "C. Conduct (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Always polite; careful not to offend anyone, maintains proper composure; makes special efforts to be helpful.",
      },
      {
        rating: 4,
        text: "Mostly polite and helpful; recognizes importance of human relationships; rarely losses temper.",
      },
      {
        rating: 3,
        text: "Observes common courtesy but doesn't always recognize opportunities and/or need to be polite or helpful.",
      },
      {
        rating: 2,
        text: "Harasses others; occasionally rude, foul language; not sensitive to others.",
      },
      {
        rating: 1,
        text: "Rude; ill mannered; uses obscene language; poor control of emotions; disrespectful to others.",
      },
    ],
  },
  {
    id: "motivationInitiative",
    title: "D. Motivation / Initiative (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Curiosity goes beyond immediate job procedures; eager to learn more; works hard.",
      },
      {
        rating: 4,
        text: "Good knowledge of most procedures; anticipates next steps; goes beyond expectations and prepares ahead.",
      },
      {
        rating: 3,
        text: "Asks questions; has adequate degree of knowledge; does routine tasks without prompting; ready with tools.",
      },
      {
        rating: 2,
        text: "Does what is told; sometimes anticipates parts of the job; does no more than what is required; seems uninterested at times.",
      },
      {
        rating: 1,
        text: "Never anticipates requirements of any job or procedure; always wants or has to be told what to do; lacks initiatives, needs prodding.",
      },
    ],
  },
  {
    id: "qualityAccuracy",
    title: "E. Quality and Accuracy of Work (20%)",
    weight: "20%",
    criteria: [
      {
        rating: 5,
        text: "Work is very accurate; work meets or exceeds standards; takes pride in his/her work.",
      },
      {
        rating: 4,
        text: "Does good work; careful; makes very few mistakes; uses good judgment.",
      },
      {
        rating: 3,
        text: "Work usually meets standard or expectations; needs some extra supervision.",
      },
      {
        rating: 2,
        text: "Aims just to get by; careless; some job need to be reworked",
      },
      {
        rating: 1,
        text: "Makes frequent mistakes; wastes materials; lacks mechanical ability; needs constant supervision.",
      },
    ],
  },
  {
    id: "quantityOfWork",
    title: "F. Quantity of Work (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Highly productive; fast and accurate; when finished with assigned tasks finds others task to advance the job.",
      },
      {
        rating: 4,
        text: "Plans work well; works efficient; gets expected work on time.",
      },
      {
        rating: 3,
        text: "Does fair share; looks busy but after finishing a task usually doesn’t look for other tasks that need to be done.",
      },
      {
        rating: 2,
        text: "Does less than expected; does just enough to get by; requires additional oversight.",
      },
      {
        rating: 1,
        text: "Doesn’t plans work; slow; procedures very little; wastes time; continually visiting with others which slows down the work.",
      },
    ],
  },
  {
    id: "safetyPractices",
    title: "G. Safety Practices (15%)",
    weight: "15%",
    criteria: [
      {
        rating: 5,
        text: "Always places safety first; helps others to be safe; does not take chances which might endangered self and others.",
      },
      {
        rating: 4,
        text: "Observes safety precautions; uses correct tools and wears appropriate safety apparel.",
      },
      {
        rating: 3,
        text: "Usually follows most safety procedures; usually does the job in safe manner.",
      },
      {
        rating: 2,
        text: "Careless, takes shortcuts which can create safety hazards.",
      },
      {
        rating: 1,
        text: "A hazard to self and others; potential for putting self and others at risk because of risky and unsafe attitude.",
      },
    ],
  },
  {
    id: "appearanceHygiene",
    title: "H. Appearance / Hygiene (10%)",
    weight: "10%",
    criteria: [
      {
        rating: 5,
        text: "Clothes ideal for work; Appearance and hygiene would be acceptable to costumers and co-trainees/personnel.",
      },
      {
        rating: 4,
        text: "Arrives at work with clothes clean; showered and clean; clothes are proper, protective and safe.",
      },
      {
        rating: 3,
        text: "Clothes usually clean and appropriate for job; grooming acceptable",
      },
      {
        rating: 2,
        text: "Poorly groomed; hair disheveled; clothing barely job appropriate and unkempt.",
      },
      {
        rating: 1,
        text: "Generally not presentable: clothes dirty and not appropriate for the job; looks shabby; unclean; smells bad at times.",
      },
    ],
  },
];

type CompetencyFormState = Record<
  string,
  {
    rating: number;
    remarks: string;
  }
>;

const createInitialCompetencyState = (): CompetencyFormState =>
  competencyList.reduce((acc, competency) => {
    acc[competency.id] = { rating: 0, remarks: "" };
    return acc;
  }, {} as CompetencyFormState);

const SupervisorEvaluation = () => {
  const [activeTab, setActiveTab] = useState<"form11" | "form18" | "form19b">("form11");
  const [selectedIntern, setSelectedIntern] =
    useState<SupervisorStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [interns, setInterns] = useState<SupervisorStudent[]>([]);

  const [competencyRatings, setCompetencyRatings] = useState<CompetencyFormState>(
    createInitialCompetencyState()
  );

  const [terminationData, setTerminationData] = useState({
    lackOfWork: false,
    violationRules: false,
    unfavorableHabits: false,
    altercation: false,
    absencesTardiness: false,
    disrespectful: false,
    noInterest: false,
    other: false,
    otherSpecify: "",
    futureEmployment: false,
    needsImprovement: false,
  });

  const [overallComments, setOverallComments] = useState("");

  // Form 18 - Supervisor Feedback state
  const [form18Ratings, setForm18Ratings] = useState({
    punctualRating: 0,
    knowledgeRating: 0,
    teamworkRating: 0,
    taskPerformanceRating: 0,
    policyComplianceRating: 0,
    conductRating: 0,
    traitsRating: 0,
  });
  const [form18Comments, setForm18Comments] = useState("");
  const [form18Loading, setForm18Loading] = useState(false);
  const [form18Submitting, setForm18Submitting] = useState(false);
  const [form18Exporting, setForm18Exporting] = useState(false);
  const [form18SuccessModal, setForm18SuccessModal] = useState(false);
  const [studentFeedbackStatus, setStudentFeedbackStatus] = useState<Record<string, boolean>>({});

  // Form 19b - Agency Self Evaluation state
  const [form19bInfo, setForm19bInfo] = useState({
    unitDivision: "",
    age: "",
    sex: "",
  });
  const [form19bRatings, setForm19bRatings] = useState({
    // Communication (3 criteria)
    communicationConnectivity: 0,
    communicationDialogue: 0,
    communicationParticipation: 0,
    // Ethical Dealings (3 criteria)
    ethicalReputation: 0,
    ethicalCSR: 0,
    ethicalSupport: 0,
    // Student Satisfaction - PSU (3 criteria)
    psuSupervisorQualified: 0,
    psuSupportActivities: 0,
    psuFacilities: 0,
    // Student Satisfaction - HTE (3 criteria)
    hteSupervision: 0,
    hteSupervisorQualified: 0,
    hteFeedback: 0,
    // Quality Delivery (3 criteria)
    qualityTimeliness: 0,
    qualityObjectives: 0,
    qualityResources: 0,
  });
  const [form19bLoading, setForm19bLoading] = useState(false);
  const [form19bSubmitting, setForm19bSubmitting] = useState(false);
  const [form19bExporting, setForm19bExporting] = useState(false);
  const [form19bSuccessModal, setForm19bSuccessModal] = useState(false);

  useEffect(() => {
    fetchInterns();
    loadForm19bData();
  }, []);

  // Load existing Form 19b data if available
  const loadForm19bData = async () => {
    try {
      setForm19bLoading(true);
      const data = await supervisorService.getAgencySelfEvaluation();
      if (data) {
        setForm19bInfo({
          unitDivision: data.unitDivision || "",
          age: data.age || "",
          sex: data.sex || "",
        });
        setForm19bRatings({
          communicationConnectivity: data.communicationConnectivity || 0,
          communicationDialogue: data.communicationDialogue || 0,
          communicationParticipation: data.communicationParticipation || 0,
          ethicalReputation: data.ethicalReputation || 0,
          ethicalCSR: data.ethicalCSR || 0,
          ethicalSupport: data.ethicalSupport || 0,
          psuSupervisorQualified: data.psuSupervisorQualified || 0,
          psuSupportActivities: data.psuSupportActivities || 0,
          psuFacilities: data.psuFacilities || 0,
          hteSupervision: data.hteSupervision || 0,
          hteSupervisorQualified: data.hteSupervisorQualified || 0,
          hteFeedback: data.hteFeedback || 0,
          qualityTimeliness: data.qualityTimeliness || 0,
          qualityObjectives: data.qualityObjectives || 0,
          qualityResources: data.qualityResources || 0,
        });
      }
    } catch (error) {
      devLog.log("No existing Form 19b data found");
    } finally {
      setForm19bLoading(false);
    }
  };

  const userString =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userString ? JSON.parse(userString) : null;
  const companyName =
    user?.companyName ||
    user?.company ||
    user?.company?.name ||
    "Company";
  const companyAddress =
    user?.companyAddress ||
    (user?.company && user.company.address) ||
    "Not Provided";

  const fetchInterns = async () => {
    try {
      setLoading(true);
      const students = await supervisorService.getMyStudents();
      setInterns(students);

      // Initialize feedback status from backend data
      const feedbackStatus: Record<string, boolean> = {};
      students.forEach((student) => {
        if (student.hasSupervisorFeedback) {
          feedbackStatus[student.id] = true;
        }
      });
      setStudentFeedbackStatus(feedbackStatus);
    } catch (error) {
      devLog.error("Error fetching interns:", error);
      toast.error("Failed to load interns");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalInterns: interns.length,
    pendingEvaluations: interns.filter((i) => !i.lastEvaluation).length,
    avgRating:
      interns.length > 0
        ? (
          interns.reduce(
            (sum, i) => sum + (i.lastEvaluation?.overallRating || 0),
            0
          ) / interns.length
        ).toFixed(1)
        : "0.0",
  };

  const resetForm = () => {
    setCompetencyRatings(createInitialCompetencyState());
    setOverallComments("");
    setTerminationData({
      lackOfWork: false,
      violationRules: false,
      unfavorableHabits: false,
      altercation: false,
      absencesTardiness: false,
      disrespectful: false,
      noInterest: false,
      other: false,
      otherSpecify: "",
      futureEmployment: false,
      needsImprovement: false,
    });
  };

  const handleStartEvaluation = (intern: SupervisorStudent) => {
    setSelectedIntern(intern);
    resetForm();
    setShowEvaluationForm(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedIntern) return;

    // Validation
    const allRated = Object.values(competencyRatings).every(
      (entry) => entry.rating > 0
    );
    if (!allRated) {
      toast.error("Please rate all categories");
      return;
    }

    try {
      setSubmitting(true);

      const totalPoints = Object.values(competencyRatings).reduce(
        (sum, entry) => sum + entry.rating,
        0
      );
      const ojtGrade = totalPoints * 10 + 50;

      const evaluationData: InternshipEvaluationData = {
        studentId: selectedIntern.id,
        competencies: competencyRatings,
        overallComments: overallComments || undefined,
        evaluatorName: user?.name || "",
        evaluatorPosition: user?.position || "",
        ojtGrade,
        termination: terminationData,
      };

      await supervisorService.submitEvaluation(evaluationData);

      toast.success(`Evaluation submitted for ${selectedIntern.name}`);
      setShowEvaluationForm(false);
      setShowSuccessModal(true);
      setSelectedIntern(null);
      resetForm();

      // Refetch all data from backend to get updated evaluation status
      await fetchInterns();
    } catch (error) {
      devLog.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportOfficialForm = async () => {
    if (!selectedIntern) return;
    const allRated = Object.values(competencyRatings).every(
      (entry) => entry.rating > 0
    );
    if (!allRated) {
      toast.error(
        "Please provide ratings for all competencies before exporting."
      );
      return;
    }

    try {
      setExporting(true);
      const totalPoints = Object.values(competencyRatings).reduce(
        (sum, entry) => sum + entry.rating,
        0
      );
      const ojtGrade = totalPoints * 10 + 50;

      await supervisorService.exportEvaluation({
        studentId: selectedIntern.id,
        termination: terminationData,
        studentName: selectedIntern.name,
        companyName,
        companyAddress,
        dateStarted: selectedIntern.startDate,
        dateEnded: selectedIntern.endDate,
        competencies: competencyRatings,
        evaluatorName: user?.name || "",
        evaluatorPosition: user?.position || "",
        ojtGrade,
      });
      toast.success("Official evaluation form downloaded.");
    } catch (error) {
      devLog.error("Error exporting official form:", error);
      toast.error("Failed to export official form.");
    } finally {
      setExporting(false);
    }
  };

  // Form 18 - Supervisor Feedback handlers
  const handleLoadForm18Feedback = async (intern: SupervisorStudent) => {
    setSelectedIntern(intern);
    setForm18Loading(true);
    try {
      const feedback = await supervisorService.getSupervisorFeedback(intern.id);
      if (feedback) {
        setForm18Ratings({
          punctualRating: feedback.punctualRating,
          knowledgeRating: feedback.knowledgeRating,
          teamworkRating: feedback.teamworkRating,
          taskPerformanceRating: feedback.taskPerformanceRating,
          policyComplianceRating: feedback.policyComplianceRating,
          conductRating: feedback.conductRating,
          traitsRating: feedback.traitsRating,
        });
        setForm18Comments(feedback.comments || "");
      } else {
        // Reset form for new feedback
        setForm18Ratings({
          punctualRating: 0,
          knowledgeRating: 0,
          teamworkRating: 0,
          taskPerformanceRating: 0,
          policyComplianceRating: 0,
          conductRating: 0,
          traitsRating: 0,
        });
        setForm18Comments("");
      }
    } catch (error) {
      devLog.error("Error loading feedback:", error);
      toast.error("Failed to load existing feedback");
    } finally {
      setForm18Loading(false);
    }
  };

  const handleSubmitForm18 = async () => {
    if (!selectedIntern) return;

    // Validate all ratings
    const allRated = Object.values(form18Ratings).every((rating) => rating > 0);
    if (!allRated) {
      toast.error("Please rate all criteria (1-5)");
      return;
    }

    try {
      setForm18Submitting(true);
      await supervisorService.submitSupervisorFeedback({
        studentId: selectedIntern.id,
        ...form18Ratings,
        comments: form18Comments,
      });

      // Immediately update the status to show "Completed" badge
      setStudentFeedbackStatus((prev) => ({
        ...prev,
        [selectedIntern.id]: true,
      }));

      setForm18SuccessModal(true);
      setSelectedIntern(null);

      // Refetch data to ensure everything is in sync
      await fetchInterns();
    } catch (error: any) {
      devLog.error("Error submitting feedback:", error);
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setForm18Submitting(false);
    }
  };

  const handleExportForm18 = async () => {
    if (!selectedIntern) return;

    const allRated = Object.values(form18Ratings).every((rating) => rating > 0);
    if (!allRated) {
      toast.error("Please rate all criteria before exporting");
      return;
    }

    try {
      setForm18Exporting(true);
      await supervisorService.exportSupervisorFeedback(selectedIntern.id);
      toast.success("Supervisor feedback exported successfully!");
    } catch (error: any) {
      devLog.error("Error exporting feedback:", error);
      toast.error(error.response?.data?.message || "Failed to export feedback");
    } finally {
      setForm18Exporting(false);
    }
  };

  // Form 19b - Agency Self Evaluation handlers
  const handleSubmitForm19b = async () => {
    // Validate all ratings
    const allRated = Object.values(form19bRatings).every((rating) => rating > 0);
    if (!allRated) {
      toast.error("Please rate all criteria (1-5)");
      return;
    }

    try {
      setForm19bSubmitting(true);
      await supervisorService.submitAgencySelfEvaluation({
        ...form19bInfo,
        ...form19bRatings,
      });

      toast.success("Form 19b submitted successfully!");
      setForm19bSuccessModal(true);

      // Don't reset form - keep data for potential edits
    } catch (error: any) {
      devLog.error("Error submitting Form 19b:", error);
      toast.error(error.response?.data?.message || "Failed to submit Form 19b");
    } finally {
      setForm19bSubmitting(false);
    }
  };

  const handleExportForm19b = async () => {
    const allRated = Object.values(form19bRatings).every((rating) => rating > 0);
    if (!allRated) {
      toast.error("Please rate all criteria before exporting");
      return;
    }

    try {
      setForm19bExporting(true);
      await supervisorService.exportAgencySelfEvaluation();
      toast.success("Form 19b exported successfully!");
    } catch (error: any) {
      devLog.error("Error exporting Form 19b:", error);
      toast.error(error.response?.data?.message || "Failed to export Form 19b");
    } finally {
      setForm19bExporting(false);
    }
  };

  const getStatusBadge = (intern: SupervisorStudent) => {
    let isCompleted = false;

    if (activeTab === "form11") {
      isCompleted = !!intern.lastEvaluation;
    } else if (activeTab === "form18") {
      isCompleted = !!intern.hasSupervisorFeedback;
    }

    if (isCompleted) {
      return (
        <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Finished
        </span>
      );
    } else {
      return (
        <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
          Pending
        </span>
      );
    }
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === "pending") {
      matchesFilter = !intern.lastEvaluation;
    } else if (filterStatus === "completed") {
      matchesFilter = !!intern.lastEvaluation;
    }

    return matchesSearch && matchesFilter;
  });

  const allCompetenciesRated = Object.values(competencyRatings).every(
    (entry) => entry.rating > 0
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-32 bg-gray-200 dark:bg-[#212124] rounded-xl sm:rounded-2xl w-full"></div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#212124] rounded-lg sm:rounded-xl"></div>
          ))}
        </div>

        {/* Tabs/Filter Skeleton */}
        <div className="h-12 bg-gray-200 dark:bg-[#212124] rounded-xl w-full"></div>

        {/* Interns List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#212124] rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1.5 sm:mb-2">Intern Evaluations</h1>
        <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-0.5 sm:mb-1">Company: {companyName}</p>
        <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
          Evaluate and track intern performance - Rate skills and provide
          feedback
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Interns */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Interns
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                {stats.totalInterns}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Total interns
              </span>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Interns
              </p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalInterns}
            </p>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Total interns
            </span>
          </div>
        </div>

        {/* Pending Evaluation */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Pending Evaluation
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                {stats.pendingEvaluations}
              </p>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                {stats.pendingEvaluations} pending
              </span>
            </div>
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Pending Evaluation
              </p>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.pendingEvaluations}
            </p>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              {stats.pendingEvaluations} pending
            </span>
          </div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Avg Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                {stats.avgRating}
              </p>
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                Average score
              </span>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Avg Rating
              </p>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.avgRating}
            </p>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Average score
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Form Tabs */}
      <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("form11")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "form11"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              Form 11 - Internship Evaluation
            </button>
            <button
              onClick={() => setActiveTab("form18")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "form18"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              Form 18 - Supervisor Feedback
            </button>
            <button
              onClick={() => setActiveTab("form19b")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "form19b"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              Form 19b - Agency Self-Evaluation
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "form11" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-[#19191c] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
              <div className="flex-1 flex gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search interns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Evaluated</option>
                </select>
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 self-end md:self-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredInterns.length} of {interns.length} interns
          </p>

          {/* Interns Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {filteredInterns.map((intern) => (
                <div
                  key={intern.id}
                  className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                        {intern.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                          {intern.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {intern.studentNumber}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{intern.program}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getStatusBadge(intern)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                    <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                        Hours
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {intern.completedHours}/{intern.totalHours}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#212124] rounded-md sm:rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                        Attendance
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        {intern.attendanceRate}%
                      </p>
                    </div>
                  </div>

                  {intern.lastEvaluation && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md sm:rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            Last Evaluation
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                            {new Date(
                              intern.lastEvaluation.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                            {intern.lastEvaluation.overallRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartEvaluation(intern)}
                    className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>
                      {intern.lastEvaluation ? "Re-evaluate" : "Evaluate Now"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intern</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Hours</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Attendance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Last Evaluation</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredInterns.map((intern) => (
                      <tr key={intern.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {intern.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{intern.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{intern.studentNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(intern)}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {intern.completedHours} <span className="text-gray-500 text-xs font-normal">/ {intern.totalHours}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round((intern.completedHours / Math.max(intern.totalHours, 1)) * 100)}% complete
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">{intern.attendanceRate}%</div>
                          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${intern.attendanceRate >= 90 ? 'bg-green-500' : intern.attendanceRate >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                              style={{ width: `${intern.attendanceRate}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {intern.lastEvaluation ? (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium text-gray-900 dark:text-white">{intern.lastEvaluation.overallRating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({new Date(intern.lastEvaluation.date).toLocaleDateString()})</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not evaluated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleStartEvaluation(intern)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {intern.lastEvaluation ? "Re-evaluate" : "Evaluate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredInterns.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl">
              <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No interns found</p>
            </div>
          )}

          {/* Evaluation Form Modal */}
          {showEvaluationForm && selectedIntern && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4 overflow-y-auto"
              style={{ marginTop: "0px" }}
              onClick={() => !submitting && setShowEvaluationForm(false)}
            >
              <div
                className="bg-white dark:bg-[#212124] rounded-xl max-w-3xl w-full p-6 my-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Evaluate Intern
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedIntern?.name} - {selectedIntern?.studentNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => !submitting && setShowEvaluationForm(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    disabled={submitting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-slim">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Internship Evaluation Competencies
                    </h4>

                    {competencyList.map((competency) => {
                      const state = competencyRatings[competency.id];
                      return (
                        <div
                          key={competency.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="text-sm uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                {competency.weight}
                              </p>
                              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {competency.title}
                              </h5>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-200">
                              Rate 1 (lowest) - 5 (highest)
                            </span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Criteria
                              </p>
                              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                {competency.criteria.map((criterion) => (
                                  <li
                                    key={`${competency.id}-${criterion.rating}`}
                                    className="flex space-x-2"
                                  >
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {criterion.rating}.
                                    </span>
                                    <span>{criterion.text}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Select Rating
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={`${competency.id}-${rating}`}
                                      type="button"
                                      onClick={() =>
                                        setCompetencyRatings((prev) => ({
                                          ...prev,
                                          [competency.id]: {
                                            ...prev[competency.id],
                                            rating,
                                          },
                                        }))
                                      }
                                      className={`w-12 h-12 rounded-lg border-2 transition-all ${state.rating === rating
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                        }`}
                                    >
                                      {rating}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Remarks
                                  </p>
                                </div>
                                <textarea
                                  value={state.remarks}
                                  onChange={(e) =>
                                    setCompetencyRatings((prev) => ({
                                      ...prev,
                                      [competency.id]: {
                                        ...prev[competency.id],
                                        remarks: e.target.value,
                                      },
                                    }))
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter remarks for this competency..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall Comments Section */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Overall Comments
                        </label>
                      </div>
                      <textarea
                        value={overallComments}
                        onChange={(e) => setOverallComments(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter overall evaluation comments..."
                      />
                    </div>
                  </div>

                  {/* Termination Section */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                      Termination Information
                    </h4>
                    <p className="text-xs italic font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      The Internship Practicum was terminated:
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {/* Termination Reasons - Compact */}
                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.lackOfWork}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              lackOfWork: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          due "only" for lack of work
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.absencesTardiness}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              absencesTardiness: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          too much absences and tardiness
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.violationRules}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              violationRules: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          violation of Company Rules
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.disrespectful}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              disrespectful: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          disrespectful to co-trainee or personnel
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.unfavorableHabits}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              unfavorableHabits: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          unfavorable work habits and practices
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.noInterest}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              noInterest: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          does not demonstrate interest and desire to learn
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.altercation}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              altercation: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          altercation on the job
                        </span>
                      </label>

                      <div className="space-y-1">
                        <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={terminationData.other}
                            onChange={(e) =>
                              setTerminationData((prev) => ({
                                ...prev,
                                other: e.target.checked,
                              }))
                            }
                            className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                            other(s), please specify
                          </span>
                        </label>
                        {terminationData.other && (
                          <input
                            type="text"
                            value={terminationData.otherSpecify}
                            onChange={(e) =>
                              setTerminationData((prev) => ({
                                ...prev,
                                otherSpecify: e.target.value,
                              }))
                            }
                            placeholder="Specify other reason..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Additional Statements */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.futureEmployment}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              futureEmployment: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          We would be pleased to employ this <em>Student-Trainee</em> in the future
                        </span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={terminationData.needsImprovement}
                          onChange={(e) =>
                            setTerminationData((prev) => ({
                              ...prev,
                              needsImprovement: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          He/She needs to improve his/her performance.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col md:flex-row gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowEvaluationForm(false)}
                    className="w-full md:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm md:text-base"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExportOfficialForm}
                    disabled={!allCompetenciesRated || exporting}
                    className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        <span>Export Official Form</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={!allCompetenciesRated || submitting}
                    className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showSuccessModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
              style={{ margin: "0" }}
            >
              <div className="bg-white dark:bg-[#212124] rounded-xl w-full max-w-md p-6 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Intern Evaluated
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The evaluation has been submitted and marked as finished.
                </p>
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form 18 - Training Supervisor's Feedback Form */}
      {activeTab === "form18" && (
        <div className="space-y-4 sm:space-y-6">
          {!selectedIntern ? (
            <>
              {/* Filters */}
              <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search interns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 self-end md:self-auto">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600"}`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredInterns.length} of {interns.length} interns
              </p>

              {/* Interns Grid/List */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {filteredInterns.map((intern) => (
                    <div
                      key={intern.id}
                      className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                            {intern.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                              {intern.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                              {intern.studentNumber}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                              {intern.program}
                            </p>
                          </div>
                        </div>
                        {/* Status Badge */}
                        {studentFeedbackStatus[intern.id] && (
                          <span className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex-shrink-0">
                            Completed
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleLoadForm18Feedback(intern)}
                        className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Provide Feedback</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intern</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredInterns.map((intern) => (
                          <tr key={intern.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {intern.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{intern.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{intern.studentNumber}</div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{intern.program}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {studentFeedbackStatus[intern.id] ? (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  Completed
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleLoadForm18Feedback(intern)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end space-x-1 ml-auto"
                              >
                                <span>Provide Feedback</span>
                                <FileText className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredInterns.length === 0 && (
                <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    No interns found
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Feedback Form */
            <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Training Supervisor's Feedback Form
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedIntern?.name} - {selectedIntern?.studentNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIntern(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {form18Loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rating Criteria */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Rate the following criteria (1 = Strongly Disagree, 5 = Strongly Agree)
                    </h4>

                    {[
                      { key: "punctualRating", label: "The student-trainee is punctual in attending works and assignments" },
                      { key: "knowledgeRating", label: "The student-trainee has sufficient knowledge to contribute in the organization" },
                      { key: "teamworkRating", label: "The student-trainee knows how to work with the group" },
                      { key: "taskPerformanceRating", label: "The student-trainee performs tasks as prescribed in the Internship Training Plan" },
                      { key: "policyComplianceRating", label: "The student-trainee follows and abides with the policies of the company" },
                      { key: "conductRating", label: "The student-trainee maintains an upright conduct while in the company" },
                      { key: "traitsRating", label: "The student-trainee shows desirable traits, virtues, and work habits" },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm18Ratings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form18Ratings[criterion.key as keyof typeof form18Ratings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Strongly Disagree</span>
                          <span>Strongly Agree</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Other Comments and Suggestions
                      </label>
                    </div>
                    <textarea
                      value={form18Comments}
                      onChange={(e) => setForm18Comments(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter any additional comments or suggestions..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setSelectedIntern(null)}
                      className="w-full md:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={form18Submitting || form18Exporting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExportForm18}
                      disabled={form18Exporting || Object.values(form18Ratings).some((r) => r === 0)}
                      className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {form18Exporting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>Export Form</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSubmitForm18}
                      disabled={form18Submitting || Object.values(form18Ratings).some((r) => r === 0)}
                      className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {form18Submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Submit Feedback</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form 19b - Evaluation Instrument of PSU Partner Agencies (Self Ratee) - One to All */}
      {activeTab === "form19b" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  One-to-All Evaluation Form
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This evaluation form applies to all students. Fill it out once and it will be associated with all interns.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#212124] rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            {form19bLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Evaluation Instrument of PSU Partner Agencies (Self Ratee)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Form FM-AA-INT-19b
                  </p>
                </div>

                {/* Personal Information */}
                <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unit/Division
                      </label>
                      <input
                        type="text"
                        value={form19bInfo.unitDivision}
                        onChange={(e) => setForm19bInfo((prev) => ({ ...prev, unitDivision: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter unit/division"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={form19bInfo.age}
                        onChange={(e) => setForm19bInfo((prev) => ({ ...prev, age: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter age"
                        min="1"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sex
                      </label>
                      <select
                        value={form19bInfo.sex}
                        onChange={(e) => setForm19bInfo((prev) => ({ ...prev, sex: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rating Criteria */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Rate the following criteria (1 = Not Satisfied, 5 = Extremely Satisfied)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Please rate each criterion based on your level of satisfaction
                    </p>
                  </div>

                  {/* Communication Category */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      COMMUNICATION
                    </h5>
                    {[
                      { key: "communicationConnectivity", label: "Is there high connectivity through electronic communication of the host-training agency?" },
                      { key: "communicationDialogue", label: "Does the management frequently accept request for dialogue and interaction as needed?" },
                      { key: "communicationParticipation", label: "Is the management willing to participate in the university activities and programs when they are invited?" },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm19bRatings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form19bRatings[criterion.key as keyof typeof form19bRatings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Not Satisfied</span>
                          <span>Extremely Satisfied</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ethical Dealings Category */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      ETHICAL DEALINGS
                    </h5>
                    {[
                      { key: "ethicalReputation", label: "High reputations and stature of the industry." },
                      { key: "ethicalCSR", label: "Established Corporate Social Responsibility of the industry." },
                      { key: "ethicalSupport", label: "Manifested support for the mandate and program of the educational institution." },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm19bRatings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form19bRatings[criterion.key as keyof typeof form19bRatings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Not Satisfied</span>
                          <span>Extremely Satisfied</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Student Satisfaction - PSU Category */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      STUDENT SATISFACTION - PSU
                    </h5>
                    {[
                      { key: "psuSupervisorQualified", label: "The assigned Internship or Practicum Supervisor are qualified and competent." },
                      { key: "psuSupportActivities", label: "The University provides support to various activities concerning internship." },
                      { key: "psuFacilities", label: "Availability of facilities for student-interns to use." },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm19bRatings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form19bRatings[criterion.key as keyof typeof form19bRatings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Not Satisfied</span>
                          <span>Extremely Satisfied</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Student Satisfaction - HTE Category */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      STUDENT SATISFACTION - HOST TRAINING ESTABLISHMENT
                    </h5>
                    {[
                      { key: "hteSupervision", label: "The partner-agencies provides the required supervision and conduct monitoring of trainees." },
                      { key: "hteSupervisorQualified", label: "The assigned Host Training Supervisors are qualified and competent to handle student-interns." },
                      { key: "hteFeedback", label: "Provide feedback and coaching or monitoring activities to further improve performance of student-interns." },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm19bRatings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form19bRatings[criterion.key as keyof typeof form19bRatings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Not Satisfied</span>
                          <span>Extremely Satisfied</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quality Delivery Category */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                      QUALITY DELIVERY
                    </h5>
                    {[
                      { key: "qualityTimeliness", label: "Timeliness are strictly observed." },
                      { key: "qualityObjectives", label: "Objectives specified in Internship Plan are met." },
                      { key: "qualityResources", label: "Adequate resources needed for the Internship purpose are made accessible and provided." },
                    ].map((criterion, index) => (
                      <div
                        key={criterion.key}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {index + 1}. {criterion.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setForm19bRatings((prev) => ({
                                  ...prev,
                                  [criterion.key]: rating,
                                }))
                              }
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${form19bRatings[criterion.key as keyof typeof form19bRatings] === rating
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400"
                                }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>Not Satisfied</span>
                          <span>Extremely Satisfied</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleExportForm19b}
                    disabled={form19bExporting || Object.values(form19bRatings).some((r) => r === 0)}
                    className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {form19bExporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Export Form</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitForm19b}
                    disabled={form19bSubmitting || Object.values(form19bRatings).some((r) => r === 0)}
                    className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {form19bSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form 18 Success Modal */}
      {form18SuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#212124] rounded-xl p-8 shadow-xl max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Feedback Submitted Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your supervisor feedback has been saved. The student's card will now show as "Completed".
              </p>
              <button
                onClick={() => setForm18SuccessModal(false)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form 19b Success Modal */}
      {form19bSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#212124] rounded-xl p-8 shadow-xl max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Form 19b Submitted Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your agency self-evaluation has been saved and will be associated with all interns.
              </p>
              <button
                onClick={() => setForm19bSuccessModal(false)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorEvaluation;
