import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Clock,
  Award,
  TrendingUp,
  BarChart3,
  // Filter,
  Search,
  CheckCircle,
  // FileSpreadsheet,
  Building2,
  // AlertCircle,
  Eye,
  Printer,
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: "attendance" | "evaluation" | "student" | "comprehensive";
  formats: ("pdf" | "excel" | "csv")[];
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  dateRange: string;
  fileSize: string;
  status: "ready" | "generating" | "failed";
  downloadUrl: string;
}

const CoordinatorReportsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    startDate: "",
    endDate: "",
    format: "pdf",
    includeCharts: true,
    includeComments: true,
    filterStatus: "all",
    filterCompany: "all",
  });

  const reportTemplates: ReportTemplate[] = [
    {
      id: "1",
      name: "Student Attendance Summary",
      description: "Complete attendance records with statistics and trends",
      icon: <Clock className="w-6 h-6" />,
      color: "blue",
      category: "attendance",
      formats: ["pdf", "excel", "csv"],
    },
    {
      id: "2",
      name: "Student Evaluation Report",
      description: "All evaluations with ratings and performance analysis",
      icon: <Award className="w-6 h-6" />,
      color: "yellow",
      category: "evaluation",
      formats: ["pdf", "excel"],
    },
    {
      id: "3",
      name: "Student Progress Report",
      description: "Individual student progress with tasks and hours tracking",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "green",
      category: "student",
      formats: ["pdf", "excel"],
    },
    {
      id: "4",
      name: "Company Performance Report",
      description: "Performance metrics grouped by company",
      icon: <Building2 className="w-6 h-6" />,
      color: "purple",
      category: "comprehensive",
      formats: ["pdf", "excel"],
    },
    {
      id: "5",
      name: "Comprehensive Internship Report",
      description:
        "All-in-one report with attendance, evaluations, and progress",
      icon: <FileText className="w-6 h-6" />,
      color: "orange",
      category: "comprehensive",
      formats: ["pdf"],
    },
    {
      id: "6",
      name: "Student Master List",
      description: "Complete list of all students with contact information",
      icon: <Users className="w-6 h-6" />,
      color: "teal",
      category: "student",
      formats: ["excel", "csv"],
    },
    {
      id: "7",
      name: "Attendance Analytics",
      description: "Detailed attendance analysis with charts and insights",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "indigo",
      category: "attendance",
      formats: ["pdf", "excel"],
    },
    {
      id: "8",
      name: "Evaluation Summary",
      description: "Summary of all evaluations with average ratings",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "pink",
      category: "evaluation",
      formats: ["pdf", "excel"],
    },
  ];

  const generatedReports: GeneratedReport[] = [
    {
      id: "1",
      name: "Student Attendance Summary",
      type: "Attendance Report",
      generatedDate: "2024-10-04 10:30 AM",
      dateRange: "Sept 1 - Oct 4, 2024",
      fileSize: "2.4 MB",
      status: "ready",
      downloadUrl: "#",
    },
    {
      id: "2",
      name: "Monthly Evaluation Report",
      type: "Evaluation Report",
      generatedDate: "2024-10-01 02:15 PM",
      dateRange: "September 2024",
      fileSize: "1.8 MB",
      status: "ready",
      downloadUrl: "#",
    },
    {
      id: "3",
      name: "Comprehensive Internship Report",
      type: "Comprehensive",
      generatedDate: "2024-09-30 04:45 PM",
      dateRange: "Full Semester",
      fileSize: "5.2 MB",
      status: "ready",
      downloadUrl: "#",
    },
  ];

  const stats = {
    totalReports: generatedReports.length,
    reportsThisMonth: 12,
    totalDownloads: 45,
    lastGenerated: "2 hours ago",
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      yellow:
        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
      green:
        "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
      purple:
        "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
      orange:
        "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
      teal: "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300",
      indigo:
        "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
      pink: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300",
    };
    return colors[color] || colors.blue;
  };

  const getBorderColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "border-blue-500",
      yellow: "border-yellow-500",
      green: "border-green-500",
      purple: "border-purple-500",
      orange: "border-orange-500",
      teal: "border-teal-500",
      indigo: "border-indigo-500",
      pink: "border-pink-500",
    };
    return colors[color] || colors.blue;
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowGenerateModal(true);
  };

  const handleGenerate = () => {
    if (!reportConfig.startDate || !reportConfig.endDate) {
      alert("Please select date range");
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowGenerateModal(false);
      alert(
        `Report "${
          selectedTemplate?.name
        }" generated successfully in ${reportConfig.format.toUpperCase()} format!`
      );

      // Reset config
      setReportConfig({
        startDate: "",
        endDate: "",
        format: "pdf",
        includeCharts: true,
        includeComments: true,
        filterStatus: "all",
        filterCompany: "all",
      });
    }, 2000);
  };

  const handleDownload = (report: GeneratedReport) => {
    alert(`Downloading: ${report.name}`);
  };

  const filteredTemplates = reportTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate and manage internship reports
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Available Reports
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.totalReports}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generated This Month
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.reportsThisMonth}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Downloads
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.totalDownloads}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Download className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Generated
              </p>
              <p className="text-lg font-bold text-orange-600 mt-1">
                {stats.lastGenerated}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Generate Custom Report</h3>
            <p className="text-purple-100">
              Create detailed reports with your preferred date range and format
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search report templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="attendance">Attendance</option>
            <option value="evaluation">Evaluation</option>
            <option value="student">Student</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Report Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden border-l-4 ${getBorderColor(
                template.color
              )} transition-all hover:shadow-md cursor-pointer`}
              onClick={() => handleGenerateReport(template)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${getColorClasses(
                      template.color
                    )}`}
                  >
                    {template.icon}
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full capitalize">
                    {template.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {template.formats.map((format) => (
                      <span
                        key={format}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                      >
                        {format.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium text-sm">
                    Generate →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Generated Reports */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recently Generated
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Report Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date Range
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Generated
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Size
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {generatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {report.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {report.type}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {report.dateRange}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {report.generatedDate}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {report.fileSize}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleDownload(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generate Report
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            {/* Template Info */}
            <div
              className={`p-4 rounded-xl ${getColorClasses(
                selectedTemplate.color
              )} mb-6`}
            >
              <div className="flex items-center space-x-3">
                {selectedTemplate.icon}
                <div>
                  <h4 className="font-semibold">{selectedTemplate.name}</h4>
                  <p className="text-sm opacity-90">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={reportConfig.startDate}
                    onChange={(e) =>
                      setReportConfig({
                        ...reportConfig,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={reportConfig.endDate}
                    onChange={(e) =>
                      setReportConfig({
                        ...reportConfig,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={reportConfig.format}
                  onChange={(e) =>
                    setReportConfig({ ...reportConfig, format: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {selectedTemplate.formats.map((format) => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeCharts}
                    onChange={(e) =>
                      setReportConfig({
                        ...reportConfig,
                        includeCharts: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Include charts and visualizations
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reportConfig.includeComments}
                    onChange={(e) =>
                      setReportConfig({
                        ...reportConfig,
                        includeComments: e.target.checked,
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Include comments and remarks
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors font-medium disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Generate Report</span>
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

export default CoordinatorReportsTab;
