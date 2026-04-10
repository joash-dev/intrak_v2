import {
    Code2,
    Heart,
    Github,
    Linkedin,
    Globe,
    Mail,
} from "lucide-react";

interface Developer {
    name: string;
    role: string;
    bio: string;
    initials: string;
    photoUrl?: string;
    socialLinks: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
        email?: string;
    };
}

interface AboutUsSectionProps {
    systemName?: string;
    systemVersion?: string;
    systemDate?: string;
    systemDescription?: string;
    developers?: Developer[];
    technologies?: string[];
}

const defaultDeveloper: Developer = {
    name: "Joash Irvin M. Santos",
    role: "Computer Engineering Student • Full Stack Developer",
    bio: "A Computer Engineering student who developed INTRAK as a practical solution to help streamline OJT management for students, instructors, coordinators, and partner companies.",
    initials: "JS",
    socialLinks: {
        github: "https://github.com/joash-dev",
        linkedin: "https://www.linkedin.com/in/joash-irvin-santos-b0b63728b",
        portfolio: "https://joashsantos.vercel.app/",
    },
};

const defaultDevelopers: Developer[] = [
    defaultDeveloper,
    {
        name: "Gym Vergel M. Ramos",
        role: "Documentation Lead",
        bio: "Handled the documentation of this thesis system to ensure clear and complete project records.",
        initials: "GR",
        socialLinks: {
            linkedin: "https://www.linkedin.com/in/gym-vergel-ramos-96b4b2251/",
        },
    },
    {
        name: "Brandon S. Ilao",
        role: "Development Support",
        bio: "Contributed to INTRAK’s development by assisting with feature work, testing, and refinements in collaboration with the project team.",
        initials: "BI",
        socialLinks: {
            github: "https://github.com/MomochiServices",
            linkedin: "https://www.linkedin.com/in/brandon-ilao-0a909a3a7",
        },
    },
];

const defaultTechnologies = [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Prisma",
    "TailwindCSS",
    "Socket.IO",
    "Docker",
    "AWS EC2",
];

const AboutUsSection = ({
    systemName = "INTRAK OJT Management System",
    systemVersion = "2.0",
    systemDate = "February 2026",
    systemDescription = "A comprehensive On-the-Job Training management system designed to streamline the internship process for students, instructors, coordinators, and industry partners.",
    developers = defaultDevelopers,
    technologies = defaultTechnologies,
}: AboutUsSectionProps) => {
    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    About Us
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Meet the developer{developers.length > 1 ? "s" : ""} behind INTRAK
                </p>
            </div>

            {/* System Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Code2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {systemName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Version {systemVersion} • {systemDate}
                        </p>
                    </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    {systemDescription}
                </p>
            </div>

            {/* Developer Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Heart className="w-5 h-5 text-red-500 mr-2" />
                    Developer{developers.length > 1 ? "s" : ""}
                </h3>

                <div className="space-y-4">
                    {developers.map((developer, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                {/* Developer Photo */}
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden flex-shrink-0">
                                    {developer.photoUrl ? (
                                        <img
                                            src={developer.photoUrl}
                                            alt={developer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        developer.initials
                                    )}
                                </div>

                                {/* Developer Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {developer.name}
                                    </h4>
                                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                                        {developer.role}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        {developer.bio}
                                    </p>

                                    {/* Social Links */}
                                    <div className="flex items-center justify-center sm:justify-start space-x-3 mt-4">
                                        {developer.socialLinks.github && (
                                            <a
                                                href={developer.socialLinks.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="GitHub"
                                            >
                                                <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                            </a>
                                        )}
                                        {developer.socialLinks.linkedin && (
                                            <a
                                                href={developer.socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="LinkedIn"
                                            >
                                                <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                            </a>
                                        )}
                                        {developer.socialLinks.portfolio && (
                                            <a
                                                href={developer.socialLinks.portfolio}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Portfolio"
                                            >
                                                <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                            </a>
                                        )}
                                        {developer.socialLinks.email && (
                                            <a
                                                href={`mailto:${developer.socialLinks.email}`}
                                                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                                title="Email"
                                            >
                                                <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Technologies Used */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Built With
                </h3>
                <div className="flex flex-wrap gap-2">
                    {technologies.map((tech) => (
                        <span
                            key={tech}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Made with <Heart className="w-4 h-4 inline text-red-500" /> for
                    educational purposes
                </p>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                    © 2026 INTRAK. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default AboutUsSection;
