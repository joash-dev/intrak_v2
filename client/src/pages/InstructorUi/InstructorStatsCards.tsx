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
    const cards = [
        { label: "Active Students", value: stats.activeStudents, sub: "Currently Active", subColor: "text-green-600 dark:text-green-400", icon: Users, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-300" },
        { label: "Avg Attendance", value: `${stats.avgAttendance}%`, sub: "of 100%", subColor: "text-gray-600 dark:text-gray-400", icon: Clock, bg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-300" },
        { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A", sub: stats.avgRating > 0 ? "out of 5.0" : "0 evaluations", subColor: "text-amber-600 dark:text-amber-400", icon: Award, bg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-300" },
        { label: "At Risk", value: stats.atRiskStudents, sub: "Need attention", subColor: "text-red-600 dark:text-red-400", icon: TrendingUp, bg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-300" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((card) => (
                <div key={card.label} className="bg-white dark:bg-[#212124] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className={`p-2 ${card.bg} rounded-lg w-fit mb-2`}>
                        <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {card.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                        {card.value}
                    </p>
                    <p className={`${card.subColor} text-[10px] sm:text-xs mt-0.5`}>{card.sub}</p>
                </div>
            ))}
        </div>
    );
};

export default InstructorStatsCards;
