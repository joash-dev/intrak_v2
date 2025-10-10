import { useState } from "react";
import {
  Award,
  Users,
  AlertCircle,
  Clock,
  Search,
  X,
  Download,
  Eye,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

const Evaluations = () => {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [viewMode, setViewMode] = useState("evaluate"); // evaluate or history

  const [ratings, setRatings] = useState({
    technicalSkills: 0,
    workEthic: 0,
    communication: 0,
    teamwork: 0,
    problemSolving: 0,
    initiative: 0,
    punctuality: 0,
    qualityOfWork: 0,
  });
  const [comments, setComments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const interns = [
    {
      id: "1",
      studentId: "2021-001",
      name: "Maria Santos",
      avatar: "MS",
      program: "BS Computer Science",
      university: "Tech University",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      hoursCompleted: 352,
      requiredHours: 400,
      evaluationStatus: "pending",
      lastEvaluation: null,
      evaluationsDue: 1,
      tasksCompleted: 18,
      totalTasks: 20,
      attendanceRate: 96,
    },
    {
      id: "2",
      studentId: "2021-002",
      name: "Juan Dela Cruz",
      avatar: "JD",
      program: "BS Information Technology",
      university: "Tech University",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      hoursCompleted: 328,
      requiredHours: 400,
      evaluationStatus: "completed",
      lastEvaluation: {
        date: "2024-09-15",
        overallRating: 4.2,
        technicalSkills: 4,
        workEthic: 5,
        communication: 4,
        teamwork: 4,
        problemSolving: 4,
        initiative: 4,
        punctuality: 5,
        qualityOfWork: 4,
        comments: "Excellent performance and dedication to work.",
        strengths: "Strong technical skills and great work ethic.",
        improvements: "Could improve communication with team members.",
      },
      evaluationsDue: 0,
      tasksCompleted: 15,
      totalTasks: 18,
      attendanceRate: 92,
    },
    {
      id: "3",
      studentId: "2021-003",
      name: "Ana Reyes",
      avatar: "AR",
      program: "BS Computer Engineering",
      university: "Tech University",
      startDate: "2024-08-15",
      endDate: "2024-12-15",
      hoursCompleted: 312,
      requiredHours: 400,
      evaluationStatus: "overdue",
      lastEvaluation: null,
      evaluationsDue: 2,
      tasksCompleted: 12,
      totalTasks: 16,
      attendanceRate: 88,
    },
  ];

  const evaluationHistory = [
    {
      id: "1",
      studentName: "Juan Dela Cruz",
      studentId: "2021-002",
      avatar: "JD",
      date: "2024-09-15",
      type: "Mid-term Evaluation",
      overallRating: 4.2,
      evaluator: "You",
      status: "submitted",
    },
    {
      id: "2",
      studentName: "Maria Santos",
      studentId: "2021-001",
      avatar: "MS",
      date: "2024-09-10",
      type: "Initial Evaluation",
      overallRating: 4.5,
      evaluator: "You",
      status: "submitted",
    },
    {
      id: "3",
      studentName: "Ana Reyes",
      studentId: "2021-003",
      avatar: "AR",
      date: "2024-08-20",
      type: "Initial Evaluation",
      overallRating: 4.0,
      evaluator: "You",
      status: "submitted",
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      completed:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status] || colors["pending"];
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || intern.evaluationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRatingChange = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const calculateOverallRating = () => {
    const values = Object.values(ratings).filter((v) => v > 0);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? (sum / values.length).toFixed(1) : "0.0";
  };

  const handleSubmitEvaluation = () => {
    const overallRating = calculateOverallRating();
    if (overallRating === "0.0") {
      alert("⚠️ Please provide ratings for all categories");
      return;
    }
    if (!comments.trim()) {
      alert("⚠️ Please provide general comments");
      return;
    }
    alert(
      `✅ Evaluation submitted successfully!\n\nIntern: ${selectedIntern.name}\nOverall Rating: ${overallRating}/5.0\n\nThe evaluation has been sent to the coordinator for review.`
    );
    setShowEvaluationForm(false);
    setSelectedIntern(null);
    setRatings({
      technicalSkills: 0,
      workEthic: 0,
      communication: 0,
      teamwork: 0,
      problemSolving: 0,
      initiative: 0,
      punctuality: 0,
      qualityOfWork: 0,
    });
    setComments("");
    setStrengths("");
    setImprovements("");
    setRecommendation("");
  };

  const RatingStars = ({ value, onChange, readonly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            className={`text-2xl ${
              star <= value
                ? "text-yellow-500"
                : "text-gray-300 dark:text-gray-600"
            } ${
              !readonly && "hover:text-yellow-400 cursor-pointer"
            } transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const stats = {
    totalInterns: interns.length,
    pendingEvaluations: interns.filter((i) => i.evaluationStatus === "pending")
      .length,
    overdueEvaluations: interns.filter((i) => i.evaluationStatus === "overdue")
      .length,
    avgRating:
      interns.filter((i) => i.lastEvaluation).length > 0
        ? (
            interns
              .filter((i) => i.lastEvaluation)
              .reduce((sum, i) => sum + i.lastEvaluation.overallRating, 0) /
            interns.filter((i) => i.lastEvaluation).length
          ).toFixed(1)
        : "N/A",
  };

  const handleExportReport = () => {
    alert("📊 Exporting evaluation reports to PDF...");
  };

  const handleViewDetails = (intern) => {
    if (intern.lastEvaluation) {
      setSelectedIntern(intern);
      setViewMode("history");
      setShowEvaluationForm(true);
    } else {
      alert("No evaluation history available for this intern.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Intern Evaluations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Rate and evaluate intern performance
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Reports</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Interns
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.totalInterns}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {stats.pendingEvaluations}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {stats.overdueEvaluations}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Rating
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {stats.avgRating}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search interns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interns List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Interns to Evaluate
              </h2>
              <div className="space-y-4">
                {filteredInterns.map((intern) => (
                  <div
                    key={intern.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {intern.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {intern.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {intern.studentId} • {intern.program}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {intern.university}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                          intern.evaluationStatus
                        )}`}
                      >
                        {intern.evaluationStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Progress
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {intern.hoursCompleted}/{intern.requiredHours}h
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Tasks
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {intern.tasksCompleted}/{intern.totalTasks}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Attendance
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    {intern.lastEvaluation && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Last Evaluation
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {intern.lastEvaluation.overallRating}/5.0
                            </p>
                            <p className="text-xs text-gray-500">
                              {intern.lastEvaluation.date}
                            </p>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i <
                                  Math.round(
                                    intern.lastEvaluation.overallRating
                                  )
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs">
                        {intern.evaluationsDue > 0 && (
                          <span className="text-yellow-600 font-medium">
                            {intern.evaluationsDue} evaluation(s) due
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {intern.lastEvaluation && (
                          <button
                            onClick={() => handleViewDetails(intern)}
                            className="flex items-center space-x-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedIntern(intern);
                            setViewMode("evaluate");
                            setShowEvaluationForm(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          <span className="text-sm">Evaluate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredInterns.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No interns found
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Try adjusting your filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evaluation History Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Recent Evaluations
              </h3>
              <div className="space-y-3">
                {evaluationHistory.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {evaluation.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {evaluation.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {evaluation.type}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < Math.round(evaluation.overallRating)
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {evaluation.overallRating}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {evaluation.date}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {evaluation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">💡 Evaluation Tips</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Be specific and constructive in your feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Rate based on actual performance and behavior</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Highlight both strengths and areas for growth</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Submit evaluations on time to help students improve
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Evaluation Form Modal */}
        {showEvaluationForm && selectedIntern && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {selectedIntern.avatar}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {viewMode === "evaluate"
                          ? `Evaluate ${selectedIntern.name}`
                          : `Evaluation Details - ${selectedIntern.name}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedIntern.studentId} • {selectedIntern.program}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEvaluationForm(false);
                      setSelectedIntern(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {viewMode === "evaluate" ? (
                  <>
                    {/* Rating Categories */}
                    <div className="space-y-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        Performance Ratings
                      </h4>

                      {[
                        {
                          key: "technicalSkills",
                          label: "Technical Skills",
                          desc: "Ability to apply technical knowledge and skills",
                        },
                        {
                          key: "workEthic",
                          label: "Work Ethic & Professionalism",
                          desc: "Dedication, responsibility, and professional behavior",
                        },
                        {
                          key: "communication",
                          label: "Communication Skills",
                          desc: "Clarity in verbal and written communication",
                        },
                        {
                          key: "teamwork",
                          label: "Teamwork & Collaboration",
                          desc: "Ability to work effectively with others",
                        },
                        {
                          key: "problemSolving",
                          label: "Problem Solving",
                          desc: "Critical thinking and finding solutions",
                        },
                        {
                          key: "initiative",
                          label: "Initiative & Proactivity",
                          desc: "Self-starter attitude and going beyond requirements",
                        },
                        {
                          key: "punctuality",
                          label: "Punctuality & Attendance",
                          desc: "Consistent attendance and time management",
                        },
                        {
                          key: "qualityOfWork",
                          label: "Quality of Work",
                          desc: "Accuracy, thoroughness, and attention to detail",
                        },
                      ].map((category) => (
                        <div
                          key={category.key}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-gray-900 dark:text-white">
                                {category.label}
                              </label>
                              <p className="text-xs text-gray-500 mt-1">
                                {category.desc}
                              </p>
                            </div>
                            <RatingStars
                              value={ratings[category.key]}
                              onChange={(value) =>
                                handleRatingChange(category.key, value)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Rating Display */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Overall Rating (Average)
                          </p>
                          <p className="text-4xl font-bold text-purple-600">
                            {calculateOverallRating()} / 5.0
                          </p>
                        </div>
                        <Award className="w-16 h-16 text-purple-600 opacity-30" />
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        Written Feedback
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          General Comments{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={4}
                          placeholder="Provide your overall assessment of the intern's performance during this period..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Key Strengths
                        </label>
                        <textarea
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          rows={3}
                          placeholder="What are the intern's key strengths? What did they do exceptionally well?"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Areas for Improvement
                        </label>
                        <textarea
                          value={improvements}
                          onChange={(e) => setImprovements(e.target.value)}
                          rows={3}
                          placeholder="What areas should the intern focus on improving? Be specific and constructive."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recommendation
                        </label>
                        <select
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select a recommendation...</option>
                          <option value="highly_recommend">
                            Highly Recommend for Future Employment
                          </option>
                          <option value="recommend">
                            Recommend for Future Employment
                          </option>
                          <option value="satisfactory">
                            Satisfactory Performance
                          </option>
                          <option value="needs_improvement">
                            Needs Improvement
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowEvaluationForm(false);
                          setSelectedIntern(null);
                        }}
                        className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitEvaluation}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Submit Evaluation</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode - Show Previous Evaluation */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Overall Rating
                            </p>
                            <p className="text-4xl font-bold text-purple-600">
                              {selectedIntern.lastEvaluation.overallRating} /
                              5.0
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Evaluated on {selectedIntern.lastEvaluation.date}
                            </p>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-3xl ${
                                  i <
                                  Math.round(
                                    selectedIntern.lastEvaluation.overallRating
                                  )
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">
                          Performance Ratings
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              key: "technicalSkills",
                              label: "Technical Skills",
                            },
                            { key: "workEthic", label: "Work Ethic" },
                            { key: "communication", label: "Communication" },
                            { key: "teamwork", label: "Teamwork" },
                            { key: "problemSolving", label: "Problem Solving" },
                            { key: "initiative", label: "Initiative" },
                            { key: "punctuality", label: "Punctuality" },
                            { key: "qualityOfWork", label: "Quality of Work" },
                          ].map((category) => (
                            <div
                              key={category.key}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {category.label}
                                </label>
                                <div className="flex items-center space-x-2">
                                  <RatingStars
                                    value={
                                      selectedIntern.lastEvaluation[
                                        category.key
                                      ] || 0
                                    }
                                    onChange={() => {}}
                                    readonly={true}
                                  />
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {selectedIntern.lastEvaluation[
                                      category.key
                                    ] || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          Written Feedback
                        </h4>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            General Comments
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedIntern.lastEvaluation.comments}
                          </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                            ✓ Key Strengths
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedIntern.lastEvaluation.strengths}
                          </p>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                            ⚡ Areas for Improvement
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedIntern.lastEvaluation.improvements}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setShowEvaluationForm(false);
                            setSelectedIntern(null);
                          }}
                          className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluations;
