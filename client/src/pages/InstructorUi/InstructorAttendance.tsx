import { AlertCircle } from "lucide-react";

const InstructorAttendance = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Attendance Verification Unavailable
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Instructor-level attendance verification has been removed.
              Please contact the supervisor or coordinator assigned to your
              students if attendance adjustments are required.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          What changed?
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li>
            • Instructors now have a read-only dashboard for attendance;
            approval actions are disabled.
          </li>
          <li>
            • Supervisors or coordinators should handle any verification or
            corrections.
          </li>
          <li>
            • You can still monitor student progress from other tabs such as
            Documents or Evaluations.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default InstructorAttendance;

