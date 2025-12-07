import React from "react";
import { useNavigate, useParams } from "react-router-dom";

interface ErrorPageProps {
  errorCode?: number;
  errorMessage?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  errorCode,
  errorMessage,
}) => {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code?: string }>();

  // Determine error code from URL params or props
  const code = errorCode || (urlCode ? parseInt(urlCode, 10) : 500);
  
  // Error configurations
  const errorConfigs: Record<number, {
    title: string;
    message: string;
  }> = {
    404: {
      title: "Page Not Found",
      message: "The page you are looking doesn't exist.",
    },
    500: {
      title: "Internal Server Error",
      message: "Something went wrong on our end. We're working to fix it.",
    },
    502: {
      title: "Bad Gateway",
      message: "The server received an invalid response from an upstream server.",
    },
    503: {
      title: "Service Unavailable",
      message: "The service is temporarily unavailable due to maintenance or overload.",
    },
    504: {
      title: "Gateway Timeout",
      message: "The server didn't receive a timely response from an upstream server.",
    },
  };

  const config = errorConfigs[code] || errorConfigs[500];
  const customMessage = errorMessage || config.message;

  const handleGoHome = () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        const role = (userData?.role || "").toLowerCase();
        
        if (role === "student") navigate("/student/dashboard");
        else if (role === "coordinator") navigate("/coordinator/dashboard");
        else if (role === "instructor") navigate("/instructor/dashboard");
        else if (role === "industry_partner" || role === "supervisor") navigate("/industry-partner/dashboard");
        else if (role === "admin") navigate("/admin");
        else navigate("/login");
      } catch {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @keyframes barUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes barDownUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }

        .animate-barUpDown {
          animation: barUpDown 2s ease-in-out infinite;
        }

        .animate-barDownUp {
          animation: barDownUp 2s ease-in-out infinite;
        }
      `}</style>

      {/* Mobile top bars - INTRAK Colors */}
      <div className="absolute top-0 left-0 w-full flex md:hidden z-0">
        <div className="w-1/3 h-[60px] bg-[#2563eb] animate-barUpDown" style={{ animationDelay: '0s' }}></div>
        <div className="w-1/3 h-[60px] bg-[#6366f1] animate-barUpDown" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1/3 h-[60px] bg-[#4f46e5] animate-barUpDown" style={{ animationDelay: '0.4s' }}></div>
      </div>

      {/* Mobile bottom bars - INTRAK Colors */}
      <div className="absolute bottom-0 left-0 w-full flex md:hidden z-0">
        <div className="w-1/3 h-[60px] bg-[#6366f1] animate-barDownUp" style={{ animationDelay: '0s' }}></div>
        <div className="w-1/3 h-[60px] bg-[#4f46e5] animate-barDownUp" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1/3 h-[60px] bg-[#2563eb] animate-barDownUp" style={{ animationDelay: '0.4s' }}></div>
      </div>

      {/* Desktop left bars - INTRAK Colors */}
      <div className="hidden md:block absolute left-0 top-0 w-[60px] h-[80%] bg-[#2563eb] animate-barUpDown" style={{ animationDelay: '0s' }}></div>
      <div className="hidden md:block absolute left-[60px] top-0 w-[60px] h-full bg-[#6366f1] animate-barUpDown" style={{ animationDelay: '0.2s' }}></div>
      <div className="hidden md:block absolute left-[120px] top-0 w-[60px] h-[60%] bg-[#4f46e5] animate-barUpDown" style={{ animationDelay: '0.4s' }}></div>

      {/* Desktop right bars - INTRAK Colors */}
      <div className="hidden md:block absolute right-0 bottom-0 w-[60px] h-full bg-[#6366f1] animate-barDownUp" style={{ animationDelay: '0s' }}></div>
      <div className="hidden md:block absolute right-[60px] bottom-0 w-[60px] h-[60%] bg-[#4f46e5] animate-barDownUp" style={{ animationDelay: '0.2s' }}></div>
      <div className="hidden md:block absolute right-[120px] bottom-0 w-[60px] h-[80%] bg-[#2563eb] animate-barDownUp" style={{ animationDelay: '0.4s' }}></div>

      {/* Main content */}
      <div className="text-center px-6 z-10">
        <h1 className="text-6xl md:text-9xl font-extrabold text-gray-900">
          {code}
        </h1>
        <h2 className="text-2xl md:text-4xl font-extrabold mb-6 text-gray-900 uppercase">
          {config.title}
        </h2>
        <p className="text-gray-700 font-semibold mb-6">
          {customMessage}
        </p>
        <p className="text-gray-500 mb-6">
          If you need assistance, please contact support.
        </p>
        <button
          onClick={handleGoHome}
          className="hidden md:inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs px-6 py-2 rounded-md transition-colors duration-200 font-semibold uppercase tracking-wide"
        >
          GO HOME
        </button>
        <button
          onClick={handleGoHome}
          className="md:hidden bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs px-6 py-2 rounded-md transition-colors duration-200 font-semibold uppercase tracking-wide"
        >
          GO HOME
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;

