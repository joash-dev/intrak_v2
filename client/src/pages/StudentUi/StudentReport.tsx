import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Printer,
  Mail,
  Share2,
  FileSpreadsheet,
  File,
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  type:
    | "attendance"
    | "progress"
    | "evaluation"
    | "timesheet"
    | "comprehensive";
  description: string;
  dateRange: string;
  generatedDate?: string;
  status: "available" | "generating" | "scheduled";
  formats: ("pdf" | "excel" | "csv")[];
  icon: React.ReactNode;
  color: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  parameters: {
    dateRange: boolean;
    includeComments: boolean;
    includeCharts: boolean;
  };
}

const StudentReportsTab: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [generating, setGenerating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Available Reports
  const reports: Report[] = [
    {
      id: "1",
      title: "Attendance Summary Report",
      type: "attendance",
      description:
        "Complete attendance records with clock-in/out times and hours worked",
      dateRange: "September 1 - October 4, 2024",
      generatedDate: "2024-10-04",
      status: "available",
      formats: ["pdf", "excel", "csv"],
      icon: <Clock className="w-5 h-5" />,
      color: "blue",
    },
    {
      id: "2",
      title: "Progress Evaluation Report",
      type: "evaluation",
      description:
        "All evaluations with ratings, comments, and performance trends",
      dateRange: "August 15 - October 4, 2024",
      generatedDate: "2024-10-04",
      status: "available",
      formats: ["pdf", "excel"],
      icon: <TrendingUp className="w-5 h-5" />,
      color: "green",
    },
    {
      id: "3",
      title: "Comprehensive Internship Report",
      type: "comprehensive",
      description:
        "Complete report including attendance, tasks, evaluations, and achievements",
      dateRange: "Full Internship Period",
      generatedDate: "2024-10-04",
      status: "available",
      formats: ["pdf"],
      icon: <Award className="w-5 h-5" />,
      color: "purple",
    },
    {
      id: "4",
      title: "Weekly Timesheet",
      type: "timesheet",
      description:
        "Detailed breakdown of hours worked per day with task allocation",
      dateRange: "September 30 - October 4, 2024",
      generatedDate: "2024-10-04",
      status: "available",
      formats: ["pdf", "excel"],
      icon: <Calendar className="w-5 h-5" />,
      color: "orange",
    },
    {
      id: "5",
      title: "Mid-term Progress Report",
      type: "progress",
      description: "Performance assessment and learning outcomes achieved",
      dateRange: "August 15 - September 15, 2024",
      generatedDate: "2024-09-20",
      status: "available",
      formats: ["pdf"],
      icon: <CheckCircle className="w-5 h-5" />,
      color: "teal",
    },
  ];

  // Report Templates
  const templates: ReportTemplate[] = [
    {
      id: "attendance",
      name: "Attendance Report",
      description: "Generate custom attendance summary for any date range",
      icon: <Clock className="w-6 h-6" />,
      color: "blue",
      parameters: {
        dateRange: true,
        includeComments: true,
        includeCharts: true,
      },
    },
    {
      id: "evaluation",
      name: "Evaluation Summary",
      description: "Compile all evaluations with performance metrics",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "green",
      parameters: {
        dateRange: true,
        includeComments: true,
        includeCharts: true,
      },
    },
    {
      id: "progress",
      name: "Progress Report",
      description: "Detailed progress report with goals and achievements",
      icon: <FileText className="w-6 h-6" />,
      color: "purple",
      parameters: {
        dateRange: true,
        includeComments: true,
        includeCharts: true,
      },
    },
    {
      id: "comprehensive",
      name: "Complete Internship Report",
      description: "All-in-one report with all data and analytics",
      icon: <Award className="w-6 h-6" />,
      color: "orange",
      parameters: {
        dateRange: false,
        includeComments: true,
        includeCharts: true,
      },
    },
  ];

  const stats = {
    totalReports: reports.length,
    recentlyGenerated: reports.filter((r) => r.generatedDate === "2024-10-04")
      .length,
    totalDownloads: 23,
    lastGenerated: "2 hours ago",
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      green:
        "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
      purple:
        "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
      orange:
        "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
      teal: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300",
    };
    return colors[color] || colors.blue;
  };

  const getBorderColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "border-blue-500",
      green: "border-green-500",
      purple: "border-purple-500",
      orange: "border-orange-500",
      teal: "border-teal-500",
    };
    return colors[color] || colors.blue;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <File className="w-4 h-4" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "csv":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleDownload = (reportId: string, format: string) => {
    setGenerating(reportId);
    setTimeout(() => {
      setGenerating(null);
      alert(`Downloaded report in ${format.toUpperCase()} format`);
    }, 1500);
  };

  const handleGenerateReport = (templateId: string) => {
    setSelectedTemplate(templateId);
    setGenerating(templateId);
    setTimeout(() => {
      setGenerating(null);
      setShowGenerator(false);
      alert("Report generated successfully!");
    }, 2000);
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Available Reports
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalReports}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ready to download</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated Today
          </p>
          <p className="text-2xl font-bold text-green-600">
            {stats.recentlyGenerated}
          </p>
          <p className="text-xs text-gray-500 mt-1">New reports</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Downloads
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.totalDownloads}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last Generated
          </p>
          <p className="text-lg font-bold text-orange-600">
            {stats.lastGenerated}
          </p>
          <p className="text-xs text-gray-500 mt-1">Most recent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Generate Custom Report</h3>
            <p className="text-purple-100">
              Create a personalized report with your preferred date range and
              format
            </p>
          </div>
          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Report Generator Modal */}
      {showGenerator && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-purple-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Select Report Template
            </h3>
            <button
              onClick={() => setShowGenerator(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleGenerateReport(template.id)}
                disabled={generating === template.id}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${getColorClasses(
                      template.color
                    )}`}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                    {generating === template.id && (
                      <div className="mt-2 flex items-center space-x-2 text-purple-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        <span className="text-xs">Generating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Report Options
            </h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include detailed comments
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include performance charts
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded text-purple-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include supervisor signatures
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Available Reports
        </h2>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Time</option>
            <option value="current_month">Current Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_quarter">Last Quarter</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border-l-4 ${getBorderColor(
              report.color
            )} transition-all hover:shadow-md`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div
                    className={`p-3 rounded-lg ${getColorClasses(
                      report.color
                    )}`}
                  >
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center text-xs px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                        <Calendar className="w-3 h-3 mr-1" />
                        {report.dateRange}
                      </span>
                      {report.generatedDate && (
                        <span className="inline-flex items-center text-xs px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Generated{" "}
                          {new Date(report.generatedDate).toLocaleDateString()}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center text-xs px-3 py-1 rounded-full ${
                          report.status === "available"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {report.status === "available" ? "Ready" : "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                  Download as:
                </span>
                {report.formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(report.id, format)}
                    disabled={generating === report.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      format === "pdf"
                        ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                        : format === "excel"
                        ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {getFormatIcon(format)}
                    <span className="text-sm">{format.toUpperCase()}</span>
                    {generating === report.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                ))}
                <div className="flex-1"></div>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Printer className="w-4 h-4" />
                  <span className="text-sm">Print</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No reports found
          </p>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Need Help?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Reports are automatically generated based on your internship
              activities. You can download them in multiple formats for
              submission to your institution or personal records.
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• PDF format is recommended for official submissions</li>
              <li>• Excel/CSV formats allow further data analysis</li>
              <li>• Reports are updated daily with your latest activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportsTab;
