import React, { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageLoader from "../../components/common/PageLoader";

const roleToDocumentsPath: Record<string, string> = {
  student: "/student/documents",
  instructor: "/instructor/documents",
  coordinator: "/coordinator/documents",
};

/**
 * Public entry for email links (/documents, /documents/:id). Sends unauthenticated
 * users to login with ?next=; authenticated users go to their role documents tab.
 */
const DocumentEmailLanding: React.FC = () => {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId?: string }>();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    const nextPath = `${location.pathname}`;
    const docQuery = documentId ? `?doc=${encodeURIComponent(documentId)}` : "";

    if (!token || !userStr) {
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    let role: string;
    try {
      role = (JSON.parse(userStr)?.role || "").toString().toLowerCase();
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    const base = roleToDocumentsPath[role];
    if (base) {
      navigate(`${base}${docQuery}`, { replace: true });
      return;
    }

    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (role === "industry_partner") {
      navigate("/industry-partner/dashboard", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate, documentId, location.pathname]);

  return <PageLoader />;
};

export default DocumentEmailLanding;
