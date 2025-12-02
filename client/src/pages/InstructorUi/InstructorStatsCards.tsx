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
        <>
            {/* Desktop Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Active Students</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.activeStudents}</p>
                            <p className="text-green-600 dark:text-green-400 text-sm">Currently Active</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Avg Attendance</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.avgAttendance}%</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">of 100%</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">Avg Rating</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}</p>
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm">{stats.avgRating > 0 ? "out of 5.0" : "0 evaluations"}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-2">At Risk</h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.atRiskStudents}</p>
                            <p className="text-green-600 dark:text-green-400 text-sm">On track</p>
                        </div>
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Stacked View */}
            <div className="md:hidden space-y-3">
                <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Active Students</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.activeStudents}</p>
                                <p className="text-green-600 dark:text-green-400 text-xs">Currently Active</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Avg Attendance</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.avgAttendance}%</p>
                                <p className="text-gray-600 dark:text-gray-400 text-xs">of 100%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">Avg Rating</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}</p>
                                <p className="text-yellow-600 dark:text-yellow-400 text-xs">{stats.avgRating > 0 ? "out of 5.0" : "0 evaluations"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#212124] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-1">At Risk</h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stats.atRiskStudents}</p>
                                <p className="text-green-600 dark:text-green-400 text-xs">On track</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InstructorStatsCards;
