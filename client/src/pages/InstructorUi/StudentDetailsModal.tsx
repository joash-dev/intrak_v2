import React from "react";
import { X, Award, Activity, Clock } from "lucide-react";
import { type InstructorStudent } from "../../services/instructorService";
import { formatStudentId } from "../../utils/formatStudentId";

interface StudentDetailsModalProps {
    selectedStudent: InstructorStudent;
    onClose: () => void;
    onViewDocuments?: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
    selectedStudent,
    onClose,
    onViewDocuments,
}) => {
    const formatDisplayDate = (value?: string | null): string => {
        if (!value) return "Not set";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Not set";
        return new Intl.DateTimeFormat("en-PH", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "short",
            day: "2-digit",
        }).format(date);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-[#212124] px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {selectedStudent.avatar}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedStudent.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedStudent.program} • {selectedStudent.year}th Year
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Performance Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                    Attendance
                                </h5>
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {selectedStudent.attendanceRate}%
                                    </span>
                                    <span className="text-sm text-blue-600 dark:text-blue-400">
                                        Present
                                    </span>
                                </div>
                                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                        style={{ width: `${Math.min(selectedStudent.attendanceRate, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-green-700 dark:text-green-300">
                                    Hours Completed
                                </h5>
                                <Activity className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                                        {selectedStudent.hoursCompleted}
                                    </span>
                                    <span className="text-sm text-green-600 dark:text-green-400">
                                        / {selectedStudent.requiredHours}
                                    </span>
                                </div>
                                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                        style={{
                                            width: `${Math.min(
                                                (selectedStudent.hoursCompleted /
                                                    selectedStudent.requiredHours) *
                                                100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                    Performance
                                </h5>
                                <Award className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                        {selectedStudent.lastEvaluation
                                            ? selectedStudent.lastEvaluation.toFixed(1)
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Award
                                            key={star}
                                            className={`w-3 h-3 ${selectedStudent.lastEvaluation &&
                                                star <= Math.round(selectedStudent.lastEvaluation)
                                                ? "text-purple-600 dark:text-purple-300 fill-current"
                                                : "text-purple-200 dark:text-purple-900"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Academic Information
                            </h6>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Student ID:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatStudentId(selectedStudent.studentId)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Program:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedStudent.program}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Year:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedStudent.year}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Internship Details
                            </h6>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Company:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedStudent.company}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Supervisor:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedStudent.supervisor}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Start Date:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatDisplayDate(selectedStudent.startDate)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        End Date:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatDisplayDate(selectedStudent.endDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {onViewDocuments && (
                            <button
                                onClick={onViewDocuments}
                                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
                            >
                                View Documents
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailsModal;
