import { useState } from "react";
import {
  Award,
  Star,
  Send,
  Search,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  company: string;
  program: string;
  lastEvaluation: string | null;
  lastRating: number | null;
  pendingEvaluation: boolean;
}

const InstructorEvaluationsTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [evaluation, setEvaluation] = useState({
    type: "mid_term",
    technicalSkills: 0,
    communication: 0,
    teamwork: 0,
    punctuality: 0,
    initiative: 0,
    professionalism: 0,
    strengths: "",
    improvements: "",
    comments: "",
  });

  const students: Student[] = [
    {
      id: "1",
      studentId: "2021-001",
      name: "Maria Santos",
      avatar: "MS",
      company: "TechCorp Inc.",
      program: "BS Computer Science",
      lastEvaluation: "2024-09-15",
      lastRating: 4.5,
      pendingEvaluation: false,
    },
    {
      id: "2",
      studentId: "2021-002",
      name: "Juan Dela Cruz",
      avatar: "JD",
      company: "InnovateLab",
      program: "BS Information Technology",
      lastEvaluation: "2024-09-10",
      lastRating: 4.2,
      pendingEvaluation: true,
    },
    {
      id: "3",
      studentId: "2021-003",
      name: "Ana Reyes",
      avatar: "AR",
      company: "DataSystems Corp",
      program: "BS Computer Engineering",
      lastEvaluation: "2024-09-05",
      lastRating: 4.0,
      pendingEvaluation: true,
    },
    {
      id: "4",
      studentId: "2021-004",
      name: "Carlos Martinez",
      avatar: "CM",
      company: "CloudTech Solutions",
      program: "BS Computer Science",
      lastEvaluation: "2024-09-20",
      lastRating: 4.8,
      pendingEvaluation: false,
    },
  ];

  const stats = {
    total: students.length,
    pending: students.filter((s) => s.pendingEvaluation).length,
    completed: students.filter((s) => !s.pendingEvaluation).length,
    avgRating: (
      students.reduce((sum, s) => sum + (s.lastRating || 0), 0) /
      students.length
    ).toFixed(1),
  };

  const criteriaLabels: Record<string, string> = {
    technicalSkills: "Technical Skills",
    communication: "Communication",
    teamwork: "Teamwork",
    punctuality: "Punctuality",
    initiative: "Initiative",
    professionalism: "Professionalism",
  };

  const handleStartEvaluation = (student: Student) => {
    setSelectedStudent(student);
    setShowEvaluateModal(true);
    setEvaluation({
      type: "mid_term",
      technicalSkills: 0,
      communication: 0,
      teamwork: 0,
      punctuality: 0,
      initiative: 0,
      professionalism: 0,
      strengths: "",
      improvements: "",
      comments: "",
    });
  };

  const handleRatingChange = (criterion: string, rating: number) => {
    setEvaluation({ ...evaluation, [criterion]: rating });
  };

  const calculateOverallRating = () => {
    const ratings = [
      evaluation.technicalSkills,
      evaluation.communication,
      evaluation.teamwork,
      evaluation.punctuality,
      evaluation.initiative,
      evaluation.professionalism,
    ];
    const sum = ratings.reduce((acc, val) => acc + val, 0);
    return ratings.every((r) => r > 0)
      ? (sum / ratings.length).toFixed(1)
      : "0.0";
  };

  const handleSubmit = () => {
    const allRatingsGiven = Object.keys(criteriaLabels).every(
      (key) => Number(evaluation[key as keyof typeof evaluation]) > 0
    );

    if (!allRatingsGiven) {
      alert("Please provide ratings for all criteria");
      return;
    }

    if (!evaluation.comments.trim()) {
      alert("Please provide overall comments");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert(
        `Evaluation submitted successfully for ${
          selectedStudent?.name
        }!\nOverall Rating: ${calculateOverallRating()}`
      );
      setShowEvaluateModal(false);
      setSelectedStudent(null);
    }, 1500);
  };

  const renderStars = (
    currentRating: number,
    onRate: (rating: number) => void,
    interactive = true
  ) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate(star)}
            disabled={!interactive}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && student.pendingEvaluation) ||
      (filterStatus === "completed" && !student.pendingEvaluation);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Evaluations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Submit performance evaluations and ratings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Students", value: stats.total, icon: Award, bg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-300" },
          { label: "Pending", value: stats.pending, icon: Clock, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-300" },
          { label: "Completed", value: stats.completed, icon: CheckCircle, bg: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-300" },
          { label: "Avg Rating", value: stats.avgRating, icon: Star, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-300" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className={`p-2 ${stat.bg} rounded-lg w-fit mb-2`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {stat.label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students..."
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
            <option value="all">All Students</option>
            <option value="pending">Pending Evaluation</option>
            <option value="completed">Recently Evaluated</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {student.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({student.studentId})
                      </span>
                      {student.pendingEvaluation && (
                        <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full font-medium">
                          Evaluation Due
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {student.program}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {student.company}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {student.lastRating ? (
                    <>
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {student.lastRating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Last Rating</p>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Not yet evaluated
                    </span>
                  )}
                </div>
              </div>

              {student.lastEvaluation && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Last evaluated:{" "}
                        {new Date(student.lastEvaluation).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>View History</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleStartEvaluation(student)}
                  className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Evaluation</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No students found</p>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluateModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Submit Evaluation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedStudent.name} • {selectedStudent.company}
                </p>
              </div>
              <button
                onClick={() => setShowEvaluateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Evaluation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evaluation Type
                </label>
                <select
                  value={evaluation.type}
                  onChange={(e) =>
                    setEvaluation({ ...evaluation, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="mid_term">Mid-term Evaluation</option>
                  <option value="final">Final Evaluation</option>
                  <option value="monthly">Monthly Progress</option>
                  <option value="quarterly">Quarterly Review</option>
                </select>
              </div>

              {/* Rating Criteria */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Criteria
                </h4>
                <div className="space-y-4">
                  {Object.entries(criteriaLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                      </span>
                      {renderStars(
                        evaluation[key as keyof typeof evaluation] as number,
                        (rating) => handleRatingChange(key, rating)
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Rating Display */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Rating
                  </span>
                  <div className="flex items-center space-x-2">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {calculateOverallRating()}
                    </span>
                    <span className="text-gray-500">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Strengths (Optional)
                </label>
                <textarea
                  value={evaluation.strengths}
                  onChange={(e) =>
                    setEvaluation({ ...evaluation, strengths: e.target.value })
                  }
                  placeholder="List the student's key strengths and positive qualities..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Areas for Improvement */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Areas for Improvement (Optional)
                  </label>
                </div>
                <textarea
                  value={evaluation.improvements}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      improvements: e.target.value,
                    })
                  }
                  placeholder="Provide constructive feedback on areas where the student can improve..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Overall Comments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Comments <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  value={evaluation.comments}
                  onChange={(e) =>
                    setEvaluation({ ...evaluation, comments: e.target.value })
                  }
                  placeholder="Provide your overall assessment and feedback..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    This evaluation will be visible to the student, coordinator,
                    and industry partner. Please provide constructive and
                    professional feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEvaluateModal(false)}
                disabled={submitting}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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

export default InstructorEvaluationsTab;
