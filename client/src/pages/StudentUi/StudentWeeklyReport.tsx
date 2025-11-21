import React, { useState, useEffect } from "react";
import { FileText, Save, Download, Loader2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

interface WeekData {
  weekNumber: number;
  dateRange: string;
  tasksAccomplished: string;
  knowledgeSkillsValues: string;
}

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

  // Initialize 7 weeks
  useEffect(() => {
    initializeWeeks();
    loadWeeklyReport();
    initializeWeeks();
    loadWeeklyReport();
  }, []);

  const initializeWeeks = () => {
    const initialWeeks: WeekData[] = [];
    for (let i = 1; i <= 7; i++) {
      initialWeeks.push({
        weekNumber: i,
        dateRange: "",
        tasksAccomplished: "",
        knowledgeSkillsValues: "",
      });
    }
    setWeeks(initialWeeks);
  };



  const loadWeeklyReport = async () => {
    try {
      setLoading(true);
      const response = await api.get("/students/weekly-reports/me");
      if (response.data && response.data.weeks) {
        // Merge with initialized weeks to ensure all 7 weeks exist
        const loadedWeeks = response.data.weeks;
        setWeeks((prevWeeks) => {
          const mergedWeeks = prevWeeks.map((week) => {
            const loadedWeek = loadedWeeks.find((w: WeekData) => w.weekNumber === week.weekNumber);
            return loadedWeek || week;
          });
          return mergedWeeks;
        });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Error loading weekly report:", error);
        toast.error("Failed to load weekly report");
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post("/students/weekly-reports/me", { weeks });
      toast.success("Weekly report saved successfully!");
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
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading weekly report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Weekly Report (Form FM-AA-INT-17)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Fill out your tasks accomplished and knowledge, skills, values learned for each week
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Week {week.weekNumber}
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Date Range</span>
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Knowledge, Skills, Values Learned */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Knowledge, Skills, Values Learned
              </label>
              <textarea
                rows={4}
                placeholder="Enter knowledge, skills, and values learned..."
                value={week.knowledgeSkillsValues}
                onChange={(e) =>
                  handleWeekChange(week.weekNumber, "knowledgeSkillsValues", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default StudentWeeklyReport;

