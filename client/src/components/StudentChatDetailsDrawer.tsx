import React, { useEffect, useMemo, useState } from "react";
import { Info, Loader2, X } from "lucide-react";
import api from "../services/api";

type StudentDetails = {
  id: string;
  studentNumber?: string;
  program?: string;
  year?: number;
  section?: string;
  supervisorName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  user?: { name?: string; email?: string };
  company?: { name?: string; address?: string } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  studentId: string;
  fallbackName?: string;
  fallbackStudentNumber?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </div>
    <div className="text-sm text-gray-900 dark:text-white text-right break-words">
      {value}
    </div>
  </div>
);

const StudentChatDetailsDrawer: React.FC<Props> = ({
  open,
  onClose,
  studentId,
  fallbackName,
  fallbackStudentNumber,
}) => {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !studentId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/students/${studentId}`);
        if (cancelled) return;
        setStudent(response.data.student || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.message || "Failed to load student details");
        setStudent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  const displayName = useMemo(
    () => student?.user?.name || fallbackName || "Student",
    [student, fallbackName]
  );
  const displayNumber = useMemo(
    () => student?.studentNumber || fallbackStudentNumber || "—",
    [student, fallbackStudentNumber]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={[
          "fixed top-0 right-0 z-[90] h-full w-[90vw] sm:w-[420px] bg-white dark:bg-[#212124] border-l border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Student details"
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {displayNumber}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors flex items-center justify-center"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Profile
                  </div>
                  <Row label="Name" value={student?.user?.name || displayName} />
                  <Row label="Email" value={student?.user?.email || "—"} />
                  <Row label="Student No." value={student?.studentNumber || displayNumber} />
                  <Row label="Program" value={student?.program || "—"} />
                  <Row label="Year" value={typeof student?.year === "number" ? student.year : "—"} />
                  <Row label="Section" value={student?.section || "—"} />
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Company
                  </div>
                  <Row label="Company" value={student?.company?.name || "—"} />
                  <Row label="Address" value={student?.company?.address || "—"} />
                  <Row label="Supervisor" value={student?.supervisorName || "—"} />
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">
                    Internship dates
                  </div>
                  <Row label="Start" value={formatDate(student?.startDate)} />
                  <Row label="End" value={formatDate(student?.endDate)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentChatDetailsDrawer;

