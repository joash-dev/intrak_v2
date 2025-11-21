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
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type {
  SupervisorStudent,
  InternshipEvaluationData,
} from "../../services/supervisorService";
import toast from "react-hot-toast";

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

  useEffect(() => {
    fetchInterns();
  }, []);

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
    } catch (error) {
      console.error("Error fetching interns:", error);
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
      const averageRating =
        totalPoints / Object.keys(competencyRatings).length || 0;
      const ojtGrade = totalPoints * 10 + 50;

      const evaluationData: InternshipEvaluationData = {
        studentId: selectedIntern.id,
        competencies: competencyRatings,
        evaluatorName: user?.name || "",
        evaluatorPosition: user?.position || "",
        ojtGrade,
        termination: terminationData,
      };

      await supervisorService.submitEvaluation(evaluationData);
      const evaluationDate = new Date().toISOString();

      setInterns((prev) =>
        prev.map((intern) =>
          intern.id === selectedIntern.id
            ? {
                ...intern,
                lastEvaluation: {
                  date: evaluationDate,
                  overallRating: Number(averageRating.toFixed(1)),
                },
              }
            : intern
        )
      );

      toast.success(`Evaluation submitted for ${selectedIntern.name}`);
      setShowEvaluationForm(false);
      setShowSuccessModal(true);
      setSelectedIntern(null);
      resetForm();
      fetchInterns(); // Refresh data
    } catch (error) {
      console.error("Error submitting evaluation:", error);
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
      console.error("Error exporting official form:", error);
      toast.error("Failed to export official form.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (intern: SupervisorStudent) => {
    if (intern.lastEvaluation) {
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading evaluations...
            </p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Interns
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                {stats.totalInterns}
              </p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                Total interns
              </span>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Interns
              </p>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.totalInterns}
            </p>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Total interns
            </span>
          </div>
        </div>

        {/* Pending Evaluation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("form11")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "form11"
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Form 11 - Internship Evaluation
            </button>
            <button
              onClick={() => setActiveTab("form18")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "form18"
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Form 18 - Supervisor Feedback
            </button>
            <button
              onClick={() => setActiveTab("form19b")}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "form19b"
                  ? "bg-purple-600 text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search interns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 w-full md:w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
            <option value="completed">Evaluated</option>
            </select>
          </div>
        </div>

      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredInterns.length} of {interns.length} interns
      </p>

      {/* Interns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {filteredInterns.map((intern) => (
                  <div
                    key={intern.id}
            className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-start space-x-2.5 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
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
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-md sm:rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                  Hours
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {intern.completedHours}/{intern.totalHours}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-md sm:rounded-lg p-2 sm:p-3">
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                          Attendance
                        </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    {intern.lastEvaluation && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md sm:rounded-lg">
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
              className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-md sm:rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                {intern.lastEvaluation ? "Re-evaluate" : "Evaluate Now"}
              </span>
                        </button>
                      </div>
        ))}
                  </div>

                {filteredInterns.length === 0 && (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl">
          <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No interns found</p>
                  </div>
                )}

        {/* Evaluation Form Modal */}
        {showEvaluationForm && selectedIntern && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ marginTop: "0px" }}
          onClick={() => !submitting && setShowEvaluationForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Evaluate Intern
                      </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIntern.name} - {selectedIntern.studentNumber}
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
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-200">
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
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                    state.rating === rating
                                      ? "border-purple-600 bg-purple-600 text-white"
                                      : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-purple-400"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                          </div>
                    </div>

                      <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Remarks
                            </p>
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter remarks for this competency..."
                        />
                      </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                      className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
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
                className="w-full md:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm md:text-base"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleExportOfficialForm}
                disabled={!allCompetenciesRated || exporting}
                className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
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
                className="w-full md:flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ marginTop: "0px" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4 text-center">
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
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Form 18 - Training Supervisor's Feedback Form
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This form will be implemented soon.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Training Supervisor's Feedback Form (Form FM-AA-INT-18)
            </p>
          </div>
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

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Form 19b - Evaluation Instrument of PSU Partner Agencies (Self Ratee)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This form will be implemented soon.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Evaluation Instrument of PSU Partner Agencies (Self Ratee) (Form FM-AA-INT-19b)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                This form applies to all students - fill once for all interns
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorEvaluation;
