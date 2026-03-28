import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import PartnershipMessageThread from "../../components/PartnershipMessageThread";
import { instructorService, type InstructorStudent } from "../../services/instructorService";

const InstructorMessages: React.FC = () => {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedFromQuery = query.get("studentId");

  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(selectedFromQuery || "");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const assigned = await instructorService.getAssignedStudents();
        setStudents(assigned);
        if (!selectedStudentId && selectedFromQuery) {
          setSelectedStudentId(selectedFromQuery);
        }
        if (!selectedStudentId && !selectedFromQuery && assigned.length > 0) {
          setSelectedStudentId(assigned[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selection in sync if link navigations change query
  useEffect(() => {
    if (selectedFromQuery && selectedFromQuery !== selectedStudentId) {
      setSelectedStudentId(selectedFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromQuery]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6 font-outfit">
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Messages
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with students about partnership assistance.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-[420px]">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#212124] text-gray-900 dark:text-white"
              disabled={loading}
            >
              <option value="" disabled>
                Select a student
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : !selectedStudentId ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            No assigned students found.
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <PartnershipMessageThread
              studentId={selectedStudentId}
              studentName={selectedStudent?.name}
              currentUserRole="INSTRUCTOR"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorMessages;

