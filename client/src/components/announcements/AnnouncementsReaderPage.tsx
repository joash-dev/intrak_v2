import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronDown,
  Info,
  MessageSquare,
  Pin,
  Search,
} from "lucide-react";
import {
  announcementService,
  filterAnnouncementsForRole,
  type Announcement,
  type AnnouncementReaderRole,
} from "../../services/announcementService";
import Skeleton from "../Skeleton";

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "All users",
  STUDENTS: "Students",
  COORDINATORS: "Coordinators",
  INSTRUCTORS: "Instructors",
  PARTNERS: "Industry partners",
};

const ROLE_COPY: Record<
  AnnouncementReaderRole,
  { title: string; subtitle: string }
> = {
  student: {
    title: "Announcements",
    subtitle:
      "Official updates from your school and OJT coordinators. Posts for everyone or students are shown here.",
  },
  instructor: {
    title: "Announcements",
    subtitle:
      "Program-wide updates for instructors. Posts for all users or instructors only are listed below.",
  },
  supervisor: {
    title: "Announcements",
    subtitle:
      "Updates for industry partners. Posts for all users or partners only appear here.",
  },
};

export interface AnnouncementsReaderPageProps {
  role: AnnouncementReaderRole;
}

const AnnouncementsReaderPage: React.FC<AnnouncementsReaderPageProps> = ({
  role,
}) => {
  const [raw, setRaw] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await announcementService.getAnnouncements();
      const transformed = (res.announcements || []).map((a) =>
        announcementService.transformAnnouncement(a)
      );
      setRaw(transformed);
    } catch (e: unknown) {
      let msg: string | undefined;
      if (e && typeof e === "object" && "response" in e) {
        const data = (e as { response?: { data?: unknown } }).response?.data;
        if (typeof data === "object" && data && "message" in data) {
          const m = (data as { message?: unknown }).message;
          msg = typeof m === "string" ? m : undefined;
        }
      }
      setError(msg ?? "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const announcements = useMemo(
    () => filterAnnouncementsForRole(raw, role),
    [raw, role]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter((a) => {
      const body = (a.message || a.content || "").toLowerCase();
      return a.title.toLowerCase().includes(q) || body.includes(q);
    });
  }, [announcements, searchQuery]);

  const toggleExpand = async (id: string) => {
    const wasExpanded = expandedIds.has(id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!wasExpanded) {
      await announcementService.trackView(id);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-500",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-500",
      success:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-500",
      urgent:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-500",
    };
    return colors[type] || colors.info;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "urgent":
        return <Bell className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const copy = ROLE_COPY[role];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-red-800 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {copy.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-2xl">
              {copy.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="search"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#212124] rounded-xl border border-gray-200 dark:border-gray-700">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {announcements.length === 0
              ? "No announcements for you yet."
              : "No announcements match your search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const expanded = expandedIds.has(a.id);
            const type = a.type || "info";
            return (
              <li
                key={a.id}
                className={`bg-white dark:bg-[#212124] rounded-xl border overflow-hidden shadow-sm transition-[box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none ${
                  expanded
                    ? "border-blue-300/80 dark:border-blue-700/60 shadow-md ring-1 ring-blue-200/50 dark:ring-blue-900/40"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(a.id)}
                  aria-expanded={expanded}
                  className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg border transition-transform duration-300 ease-out motion-reduce:transition-none ${getTypeColor(type)} ${
                      expanded ? "scale-105" : "scale-100"
                    }`}
                  >
                    {getTypeIcon(type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {a.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {AUDIENCE_LABELS[a.audience] || a.audience}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {announcementService.formatDateTime(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white pr-2">
                      {a.title}
                    </h3>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                        expanded ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {a.message || a.content}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400 self-start pt-1">
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                        expanded ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden
                    />
                  </div>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                      <div
                        className={`pt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                          expanded ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {a.message || a.content}
                      </div>
                      {a.createdBy?.name && (
                        <p
                          className={`text-xs text-gray-500 dark:text-gray-400 mt-3 transition-opacity duration-300 ease-out delay-75 motion-reduce:transition-none motion-reduce:delay-0 ${
                            expanded ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          Posted by {a.createdBy.name}
                          {a.createdBy.role
                            ? ` · ${a.createdBy.role.replace(/_/g, " ")}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AnnouncementsReaderPage;
