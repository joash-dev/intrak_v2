import React, { useState } from "react";
import {
  Star,
  TrendingUp,
  Award,
  User,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart3,
} from "lucide-react";

interface Evaluation {
  id: string;
  evaluatorName: string;
  evaluatorRole: "COORDINATOR" | "INSTRUCTOR" | "INDUSTRY_PARTNER";
  type: "Mid-term" | "Final" | "Progress Check" | "Monthly";
  date: string;
  overallRating: number;
  criteria: {
    technicalSkills: number;
    communication: number;
    teamwork: number;
    punctuality: number;
    initiative: number;
    professionalism: number;
  };
  comments: string;
  strengths: string[];
  areasForImprovement: string[];
}

const StudentEvaluationsTab: React.FC = () => {
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mock data
  const evaluations: Evaluation[] = [
    {
      id: "1",
      evaluatorName: "Engr. Juan Dela Cruz",
      evaluatorRole: "INDUSTRY_PARTNER",
      type: "Mid-term",
      date: "2024-09-15",
      overallRating: 4.5,
      criteria: {
        technicalSkills: 5,
        communication: 4,
        teamwork: 5,
        punctuality: 4,
        initiative: 5,
        professionalism: 4,
      },
      comments:
        "Maria has shown excellent technical skills and initiative. She consistently delivers quality work and collaborates well with the team. Her punctuality and communication could be improved slightly.",
      strengths: [
        "Strong problem-solving skills",
        "Quick learner",
        "Team player",
        "Proactive approach",
      ],
      areasForImprovement: ["Time management", "Speaking up in meetings"],
    },
    {
      id: "2",
      evaluatorName: "Dr. Jane Smith",
      evaluatorRole: "COORDINATOR",
      type: "Progress Check",
      date: "2024-09-20",
      overallRating: 4.8,
      criteria: {
        technicalSkills: 5,
        communication: 5,
        teamwork: 5,
        punctuality: 4,
        initiative: 5,
        professionalism: 5,
      },
      comments:
        "Outstanding performance throughout the internship. Maria demonstrates strong technical competency and excellent interpersonal skills. Keep up the great work!",
      strengths: [
        "Excellent technical knowledge",
        "Great attitude",
        "Reliable",
        "Professional demeanor",
      ],
      areasForImprovement: ["Continue building confidence in presentations"],
    },
    {
      id: "3",
      evaluatorName: "Prof. Robert Garcia",
      evaluatorRole: "INSTRUCTOR",
      type: "Monthly",
      date: "2024-10-01",
      overallRating: 4.3,
      criteria: {
        technicalSkills: 4,
        communication: 4,
        teamwork: 5,
        punctuality: 4,
        initiative: 4,
        professionalism: 5,
      },
      comments:
        "Maria shows consistent improvement and maintains a positive attitude. Her documentation skills are excellent and she actively seeks feedback for growth.",
      strengths: [
        "Good documentation",
        "Seeks feedback",
        "Adaptable",
        "Detail-oriented",
      ],
      areasForImprovement: [
        "Technical depth in certain areas",
        "Time estimation",
      ],
    },
  ];

  const stats = {
    totalEvaluations: evaluations.length,
    averageRating: (
      evaluations.reduce((sum, e) => sum + e.overallRating, 0) /
      evaluations.length
    ).toFixed(1),
    highestRating: Math.max(...evaluations.map((e) => e.overallRating)),
    latestEvaluation: evaluations[0].date,
  };

  const filteredEvaluations =
    filterRole === "ALL"
      ? evaluations
      : evaluations.filter((e) => e.evaluatorRole === filterRole);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "INDUSTRY_PARTNER":
        return <Building2 className="w-5 h-5" />;
      case "COORDINATOR":
        return <Award className="w-5 h-5" />;
      case "INSTRUCTOR":
        return <User className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "INDUSTRY_PARTNER":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300";
      case "COORDINATOR":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300";
      case "INSTRUCTOR":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Evaluations
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEvaluations}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average Rating
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-600">
              {stats.averageRating}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Highest Rating
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-2xl font-bold text-green-600">
              {stats.highestRating}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Best performance</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Latest Evaluation
          </p>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {new Date(stats.latestEvaluation).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Most recent</p>
        </div>
      </div>

      {/* Performance Overview Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          Performance Trends
        </h3>
        <div className="space-y-4">
          {Object.entries(evaluations[0].criteria).map(([criterion]) => {
            const avgValue =
              evaluations.reduce(
                (sum, e) =>
                  sum + e.criteria[criterion as keyof typeof e.criteria],
                0
              ) / evaluations.length;
            const percentage = (avgValue / 5) * 100;

            return (
              <div key={criterion}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {criterion.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {avgValue.toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Evaluation History
        </h2>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Evaluators</option>
          <option value="INDUSTRY_PARTNER">Industry Partner</option>
          <option value="COORDINATOR">Coordinator</option>
          <option value="INSTRUCTOR">Instructor</option>
        </select>
      </div>

      {/* Evaluations List */}
      <div className="space-y-4">
        {filteredEvaluations.map((evaluation) => (
          <div
            key={evaluation.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all"
          >
            {/* Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-lg ${getRoleColor(
                      evaluation.evaluatorRole
                    )}`}
                  >
                    {getRoleIcon(evaluation.evaluatorRole)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {evaluation.evaluatorName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {evaluation.evaluatorRole.replace(/_/g, " ")}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(evaluation.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                        {evaluation.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(evaluation.overallRating)}
                  <p
                    className={`text-sm font-medium mt-1 ${getRatingColor(
                      evaluation.overallRating
                    )}`}
                  >
                    {evaluation.overallRating >= 4.5
                      ? "Excellent"
                      : evaluation.overallRating >= 3.5
                      ? "Good"
                      : "Needs Improvement"}
                  </p>
                </div>
              </div>

              {/* Quick Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {Object.entries(evaluation.criteria)
                  .slice(0, 3)
                  .map(([criterion, value]) => (
                    <div
                      key={criterion}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {criterion.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {value}.0
                      </span>
                    </div>
                  ))}
              </div>

              {/* Comments Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {evaluation.comments}
                </p>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => toggleExpand(evaluation.id)}
                className="w-full mt-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <span className="text-sm font-medium">
                  {expandedId === evaluation.id ? "Show Less" : "View Details"}
                </span>
                {expandedId === evaluation.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedId === evaluation.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-750 space-y-6">
                {/* All Criteria */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Detailed Ratings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(evaluation.criteria).map(
                      ([criterion, value]) => (
                        <div
                          key={criterion}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {criterion.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {renderStars(value)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Full Comments */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                    Evaluator Comments
                  </h4>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {evaluation.comments}
                    </p>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    Strengths
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {evaluation.strengths.map((strength, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-yellow-600" />
                    Areas for Improvement
                  </h4>
                  <div className="space-y-2">
                    {evaluation.areasForImprovement.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                      >
                        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">!</span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {area}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEvaluations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No evaluations found for this filter
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentEvaluationsTab;
