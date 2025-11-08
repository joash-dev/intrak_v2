import api from "./api";

interface AttendanceReportStudent {
  id: string;
  name: string;
  email: string;
  studentNumber: string;
  program: string;
  companyName?: string | null;
  companyAddress?: string | null;
  supervisorName?: string | null;
  totalHoursRequired: number;
  completedHours: number;
}

export interface AttendanceReportLog {
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  durationMinutes: number;
  verificationMethod: string | null;
  verified: boolean;
  remarks: string | null;
}

export interface AttendanceReportSummary {
  totalLogs: number;
  totalMinutes: number;
  totalHours: number;
  verifiedLogs: number;
  pendingLogs: number;
  averageHoursPerDay: number;
}

export interface AttendanceReportResponse {
  student: AttendanceReportStudent;
  logs: AttendanceReportLog[];
  summary: AttendanceReportSummary;
}

export interface ComplianceReportItem {
  studentName: string;
  studentNumber: string;
  email: string;
  companyName?: string | null;
  completedHours: number;
  totalHours: number;
  progress: number;
  documentsSubmitted: number;
  documentsApproved: number;
  evaluationsCompleted: number;
  averageRating: number | null;
}

export interface ComplianceReportResponse {
  generatedAt: string;
  companyFilter?: string;
  items: ComplianceReportItem[];
}

type AttendanceReportFormat = "pdf" | "excel";
type ComplianceReportFormat = "excel";

interface AttendanceReportParams {
  studentId?: string;
  from?: string;
  to?: string;
}

interface ComplianceReportParams {
  companyId?: string;
}

const extractFilename = (contentDisposition?: string): string | null => {
  if (!contentDisposition) return null;
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
  return match ? match[1] : null;
};

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

class ReportService {
  async fetchAttendanceReport(
    params: AttendanceReportParams = {}
  ): Promise<AttendanceReportResponse> {
    const response = await api.get<AttendanceReportResponse>("/reports/attendance", {
      params: {
        ...params,
        format: "json",
      },
    });

    const data = response.data;
    return {
      ...data,
      logs: data.logs.map((log) => ({
        ...log,
        date: log.date,
        timeIn: log.timeIn,
        timeOut: log.timeOut,
      })),
    };
  }

  async downloadAttendanceReport(
    params: AttendanceReportParams = {},
    format: AttendanceReportFormat = "pdf"
  ): Promise<void> {
    const response = await api.get<Blob>("/reports/attendance", {
      params: {
        ...params,
        format,
      },
      responseType: "blob",
    });

    const defaultName = format === "pdf" ? "attendance-report.pdf" : "attendance-report.xlsx";
    const filename =
      extractFilename(response.headers["content-disposition"]) || defaultName;

    triggerBrowserDownload(response.data, filename);
  }

  async fetchComplianceReport(
    params: ComplianceReportParams = {}
  ): Promise<ComplianceReportResponse> {
    const response = await api.get<ComplianceReportResponse>("/reports/compliance", {
      params: {
        ...params,
        format: "json",
      },
    });

    return response.data;
  }

  async downloadComplianceReport(
    params: ComplianceReportParams = {},
    format: ComplianceReportFormat = "excel"
  ): Promise<void> {
    const response = await api.get<Blob>("/reports/compliance", {
      params: {
        ...params,
        format,
      },
      responseType: "blob",
    });

    const defaultName = "compliance-report.xlsx";
    const filename =
      extractFilename(response.headers["content-disposition"]) || defaultName;

    triggerBrowserDownload(response.data, filename);
  }
}

export const reportService = new ReportService();

