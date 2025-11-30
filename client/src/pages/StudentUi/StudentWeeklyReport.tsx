import React, { useState, useEffect } from "react";
import { FileText, Save, Download, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Skeleton from "../../components/Skeleton";
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";

interface WeekData {
  weekNumber: number;
  dateRange: string;
  tasksAccomplished: string;
  knowledgeSkillsValues: string;
}

const StudentWeeklyReport: React.FC = () => {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadWeeklyReport();
  }, []);

  const loadWeeklyReport = async () => {
    try {
      setLoading(true);
      const response = await api.get("/students/weekly-reports/me");
      if (response.data && response.data.weeks && response.data.weeks.length > 0) {
        setWeeks(response.data.weeks);
      } else {
        // Initialize with just 1 week if no data exists
        setWeeks([{
          weekNumber: 1,
          dateRange: "",
          tasksAccomplished: "",
          knowledgeSkillsValues: "",
        }]);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error loading weekly report:", error);
        toast.error("Failed to load weekly report");
      } else {
        // If 404 (not found), initialize with 1 week
        setWeeks([{
          weekNumber: 1,
          dateRange: "",
          tasksAccomplished: "",
          knowledgeSkillsValues: "",
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (weekNumber: number, field: keyof WeekData, value: string) => {
    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.weekNumber === weekNumber ? { ...week, [field]: value } : week
      )
    );
  };

  const handleAddWeek = () => {
    setWeeks((prevWeeks) => {
      const nextWeekNumber = prevWeeks.length + 1;
      return [
        ...prevWeeks,
        {
          weekNumber: nextWeekNumber,
          dateRange: "",
          tasksAccomplished: "",
          knowledgeSkillsValues: "",
        },
      ];
    });
    toast.success("New week added!");
  };

  const handleDeleteWeek = (weekNumber: number) => {
    if (window.confirm("Are you sure you want to delete this week?")) {
      setWeeks((prevWeeks) => {
        const filtered = prevWeeks.filter((w) => w.weekNumber !== weekNumber);
        // Re-index weeks to ensure sequential order (1, 2, 3...)
        return filtered.map((w, index) => ({ ...w, weekNumber: index + 1 }));
      });
      toast.success("Week deleted");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/students/weekly-reports/me", { weeks });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error saving weekly report:", error);
      toast.error(error.response?.data?.message || "Failed to save weekly report");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get("/students/weekly-reports/export/me", {
        responseType: "blob",
      });

      // Check if response is actually an error (JSON error response disguised as blob)
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await (response.data as Blob).text();
        const errorData = JSON.parse(text);
        throw new Error(
          errorData.message ||
          errorData.details?.message ||
          "Failed to export weekly report"
        );
      }

      // Create blob link to download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Weekly_Report_${new Date().toISOString().split("T")[0]}.docx`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast.success("Weekly report exported successfully!");
    } catch (error: any) {
      console.error("Error exporting weekly report:", error);
      toast.error(error.message || "Failed to export weekly report");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2 w-full sm:w-1/2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Week Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="line-clamp-2 sm:line-clamp-1">Weekly Report (Form FM-AA-INT-17)</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              Fill out your tasks accomplished and knowledge, skills, values learned for each week
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{exporting ? "Exporting..." : "Export"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weeks.map((week) => (
          <div
            key={week.weekNumber}
            className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Week {week.weekNumber}
              </h3>
              <button
                onClick={() => handleDeleteWeek(week.weekNumber)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Week"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <input
                type="text"
                placeholder="e.g., June 17 – June 20, 2025"
                value={week.dateRange}
                onChange={(e) =>
                  handleWeekChange(week.weekNumber, "dateRange", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tasks Accomplished */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tasks Accomplished
              </label>
              <textarea
                rows={4}
                placeholder="Enter tasks accomplished for this week..."
                value={week.tasksAccomplished}
                onChange={(e) =>
                  handleWeekChange(week.weekNumber, "tasksAccomplished", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Knowledge, Skills, Values Learned */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Knowledge, Skills, Values Learned
                </label>
                {(week.tasksAccomplished || week.knowledgeSkillsValues) && (
                  <AIGenerateButton
                    onGenerate={async () => {
                      return aiService.generateWeeklyReportSummary({
                        tasksAccomplished: week.tasksAccomplished || '',
                        knowledgeSkillsValues: week.knowledgeSkillsValues || ''
                      });
                    }}
                    onSuccess={(generatedText) => {
                      handleWeekChange(week.weekNumber, "knowledgeSkillsValues", generatedText);
                      toast.success('Summary generated successfully');
                    }}
                    size="sm"
                    variant="outline"
                  />
                )}
              </div>
              <textarea
                rows={4}
                placeholder="Enter knowledge, skills, and values learned..."
                value={week.knowledgeSkillsValues}
                onChange={(e) =>
                  handleWeekChange(week.weekNumber, "knowledgeSkillsValues", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        ))}

        {/* Add Week Button */}
        <button
          onClick={handleAddWeek}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group min-h-[400px]"
        >
          <div className="p-4 bg-gray-100 dark:bg-[#212124] rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors mb-4">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-purple-600 dark:text-gray-500 dark:group-hover:text-purple-400" />
          </div>
          <span className="text-lg font-medium text-gray-500 group-hover:text-purple-700 dark:text-gray-400 dark:group-hover:text-purple-300">
            Add Week {weeks.length + 1}
          </span>
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Weekly Report Guidelines
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Fill out each week with your tasks accomplished and what you learned</li>
              <li>• Be specific and detailed in your descriptions</li>
              <li>• Save your progress regularly</li>
              <li>• Export the report when all weeks are completed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#212124] rounded-xl p-8 shadow-xl max-w-md w-full mx-4 transform transition-all scale-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Save className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Saved Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your weekly report progress has been saved. You can continue editing or come back later.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWeeklyReport;

