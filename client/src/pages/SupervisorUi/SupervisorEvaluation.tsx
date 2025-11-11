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
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import type {
  SupervisorStudent,
  EvaluationData,
} from "../../services/supervisorService";
import toast from "react-hot-toast";

const SupervisorEvaluation = () => {
  const [selectedIntern, setSelectedIntern] =
    useState<SupervisorStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interns, setInterns] = useState<SupervisorStudent[]>([]);

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

  useEffect(() => {
    fetchInterns();
  }, []);

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

  const handleStartEvaluation = (intern: SupervisorStudent) => {
    setSelectedIntern(intern);
    resetForm();
    setShowEvaluationForm(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedIntern) return;

    // Validation
    const allRated = Object.values(ratings).every((rating) => rating > 0);
    if (!allRated) {
      toast.error("Please rate all categories");
      return;
    }

    if (!comments.trim()) {
      toast.error("Please provide overall comments");
      return;
    }

    try {
      setSubmitting(true);

      const evaluationData: EvaluationData = {
        studentId: selectedIntern.id,
        ...ratings,
        comments: comments.trim(),
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        recommendation: recommendation.trim(),
      };

      await supervisorService.submitEvaluation(evaluationData);
      toast.success(`Evaluation submitted for ${selectedIntern.name}`);
      setShowEvaluationForm(false);
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

  const getStatusBadge = (intern: SupervisorStudent) => {
    if (intern.lastEvaluation) {
      return (
        <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Evaluated
        </span>
      );
    } else {
      return (
        <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
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

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const companyName = user?.company || "Company";

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Intern Evaluations</h1>
        <p className="text-blue-100 text-lg mb-1">Company: {companyName}</p>
        <p className="text-blue-100">
          Evaluate and track intern performance - Rate skills and provide
          feedback
        </p>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Interns */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Interns
                </p>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
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

        {/* Pending Evaluation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pending Evaluation
            </p>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
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

        {/* Avg Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Avg Rating
            </p>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
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

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
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
            <option value="completed">Evaluated</option>
            </select>
          </div>
        </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredInterns.length} of {interns.length} interns
      </p>

      {/* Interns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredInterns.map((intern) => (
                  <div
                    key={intern.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {intern.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {intern.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                    {intern.studentNumber}
                          </p>
                  <p className="text-xs text-gray-500">{intern.program}</p>
                        </div>
                      </div>
              {getStatusBadge(intern)}
                    </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Hours
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {intern.completedHours}/{intern.totalHours}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Attendance
                        </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {intern.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    {intern.lastEvaluation && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                              Last Evaluation
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(
                        intern.lastEvaluation.date
                      ).toLocaleDateString()}
                            </p>
                          </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {intern.lastEvaluation.overallRating.toFixed(1)}
                              </span>
                          </div>
                        </div>
                      </div>
                    )}

                          <button
              onClick={() => handleStartEvaluation(intern)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Award className="w-4 h-4" />
              <span>
                {intern.lastEvaluation ? "Re-evaluate" : "Evaluate Now"}
              </span>
                        </button>
                      </div>
        ))}
                  </div>

                {filteredInterns.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No interns found</p>
                  </div>
                )}

        {/* Evaluation Form Modal */}
        {showEvaluationForm && selectedIntern && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ margin: "0" }}
          onClick={() => !submitting && setShowEvaluationForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
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

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {/* Rating Categories */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                        Performance Ratings
                      </h4>

                {Object.entries(ratings).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                              </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() =>
                            setRatings({ ...ratings, [key]: rating })
                          }
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${
                            value >= rating
                              ? "border-yellow-500 bg-yellow-500 text-white"
                              : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-yellow-400"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {value > 0 ? `${value}/5` : "Not rated"}
                      </span>
                          </div>
                        </div>
                      ))}
                    </div>

              {/* Comments */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Comments *
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Provide overall feedback on the intern's performance..."
                        />
                      </div>

              {/* Strengths */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strengths (Optional)
                        </label>
                        <textarea
                          value={strengths}
                          onChange={(e) => setStrengths(e.target.value)}
                          rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="What does the intern do well?"
                        />
                      </div>

              {/* Areas for Improvement */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Areas for Improvement (Optional)
                        </label>
                        <textarea
                          value={improvements}
                          onChange={(e) => setImprovements(e.target.value)}
                          rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="What areas could the intern improve on?"
                        />
                      </div>

              {/* Recommendation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recommendation (Optional)
                        </label>
                <textarea
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Would you recommend this intern for future opportunities?"
                />
                      </div>
                    </div>

            {/* Form Actions */}
            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                onClick={() => setShowEvaluationForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitEvaluation}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default SupervisorEvaluation;
