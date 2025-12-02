import React from "react";
import { Users, Clock, Award, TrendingUp } from "lucide-react";

interface InstructorStats {
    totalStudents: number;
    activeStudents: number;
    atRiskStudents: number;
    completedStudents: number;
    avgAttendance: number;
    avgRating: number;
    documentsPending: number;
    evaluationsPending: number;
}

interface InstructorStatsCardsProps {
    stats: InstructorStats;
}

const InstructorStatsCards: React.FC<InstructorStatsCardsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Active Students */}
            <div className="bg-white dark:bg-[#212124] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <div className="flex items-center md:justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 md:order-last mr-3 md:mr-0">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-0.5 md:mb-2">Active Students</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">{stats.activeStudents}</p>
                        <p className="text-green-600 dark:text-green-400 text-xs md:text-sm">Currently Active</p>
                    </div>
                </div>
            </div>

            {/* Avg Attendance */}
            <div className="bg-white dark:bg-[#212124] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <div className="flex items-center md:justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 md:order-last mr-3 md:mr-0">
                        <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-0.5 md:mb-2">Avg Attendance</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">{stats.avgAttendance}%</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">of 100%</p>
                    </div>
                </div>
            </div>

            {/* Avg Rating */}
            <div className="bg-white dark:bg-[#212124] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <div className="flex items-center md:justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 md:order-last mr-3 md:mr-0">
                        <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-0.5 md:mb-2">Avg Rating</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}</p>
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs md:text-sm">{stats.avgRating > 0 ? "out of 5.0" : "0 evaluations"}</p>
                    </div>
                </div>
            </div>

            {/* At Risk */}
            <div className="bg-white dark:bg-[#212124] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <div className="flex items-center md:justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 md:order-last mr-3 md:mr-0">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-0.5 md:mb-2">At Risk</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">{stats.atRiskStudents}</p>
                        <p className="text-green-600 dark:text-green-400 text-xs md:text-sm">On track</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorStatsCards;
