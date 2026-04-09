import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { PartnershipConversationSummary } from "../services/partnershipConversationService";

type Props = {
  conversations: PartnershipConversationSummary[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const formatSidebarTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const PartnershipConversationsSidebar: React.FC<Props> = ({
  conversations,
  selectedStudentId,
  onSelectStudent,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const lastSnippet = c.lastMessage?.content || "";
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.studentNumber.toLowerCase().includes(q) ||
        lastSnippet.toLowerCase().includes(q)
      );
    });
  }, [conversations, query]);

  return (
    <div className="h-full flex flex-col">
      <div className={`border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-[#212124] ${collapsed ? "p-2" : "p-4"}`}>
        <div className={`flex items-center justify-between gap-3 ${collapsed ? "" : "mb-3"}`}>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                Conversations
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filtered.length} thread{filtered.length === 1 ? "" : "s"}
              </div>
            </div>
          )}

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={`hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${collapsed ? "ml-0" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        <div
          className={[
            "relative transition-all duration-300 ease-in-out",
            collapsed ? "opacity-0 -translate-y-1 max-h-0 overflow-hidden pointer-events-none" : "opacity-100 translate-y-0 max-h-20",
          ].join(" ")}
        >
          {!collapsed && (
            <>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name/ID"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No conversations found.
          </div>
        ) : (
          <div className="p-2 sm:p-3 space-y-1">
            {filtered.map((c) => {
              const isSelected = c.studentId === selectedStudentId;
              const last = c.lastMessage;
              const snippet = last?.content || "No messages yet";
              const initial = (c.studentName || "?").trim().charAt(0).toUpperCase();
              const hasPhoto = Boolean(c.profilePhoto);
              const unread = Boolean(c.unread);
              const unreadToken = unread ? (last?.createdAt || "unread") : "";
              const shouldPulseUnread = (() => {
                if (!unread) return false;
                try {
                  const key = `intrak:seen-unread:convo:${c.studentId}`;
                  const prev = sessionStorage.getItem(key);
                  if (prev === unreadToken) return false;
                  sessionStorage.setItem(key, unreadToken);
                  return true;
                } catch {
                  return false;
                }
              })();
              return (
                <button
                  key={c.studentId}
                  type="button"
                  onClick={() => onSelectStudent(c.studentId)}
                  className={[
                    "w-full text-left rounded-xl border transition-colors",
                    shouldPulseUnread ? "animate-attention-once" : "",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300/60 dark:border-blue-700"
                      : "bg-white dark:bg-[#212124] border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={collapsed ? `${c.studentName} (${c.studentNumber})` : undefined}
                >
                  <div className={collapsed ? "p-2 flex items-center justify-center" : "p-3 flex items-start gap-3"}>
                    {hasPhoto ? (
                      <img
                        src={c.profilePhoto as string}
                        alt={c.studentName}
                        className={[
                          "rounded-full flex-shrink-0 object-cover border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800",
                          collapsed ? "w-10 h-10" : "w-9 h-9",
                        ].join(" ")}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className={[
                          "rounded-full flex-shrink-0 flex items-center justify-center bg-blue-600 text-white",
                          collapsed ? "w-10 h-10" : "w-9 h-9",
                        ].join(" ")}
                        title={c.studentName}
                      >
                        <span className="text-sm font-semibold">{initial}</span>
                      </div>
                    )}

                    <div
                      className={[
                        "min-w-0 flex-1 transition-all duration-300 ease-in-out",
                        collapsed ? "opacity-0 -translate-x-2 pointer-events-none w-0" : "opacity-100 translate-x-0",
                      ].join(" ")}
                    >
                      {!collapsed && (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div
                                className={[
                                  "text-sm text-gray-900 dark:text-white truncate",
                                  unread ? "font-bold" : "font-semibold",
                                ].join(" ")}
                              >
                                {c.studentName}
                              </div>
                              <div
                                className={[
                                  "text-xs truncate",
                                  unread
                                    ? "font-semibold text-gray-700 dark:text-gray-200"
                                    : "text-gray-500 dark:text-gray-400",
                                ].join(" ")}
                              >
                                {c.studentNumber}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                              {unread && (
                                <span
                                  className="h-2 w-2 rounded-full bg-blue-500"
                                  title="Unread"
                                  aria-hidden
                                />
                              )}
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {last ? formatSidebarTime(last.createdAt) : ""}
                              </div>
                            </div>
                          </div>

                          <div
                            className={[
                              "mt-1 text-xs truncate",
                              unread
                                ? "font-semibold text-gray-900 dark:text-white"
                                : "text-gray-600 dark:text-gray-300",
                            ].join(" ")}
                          >
                            {snippet}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnershipConversationsSidebar;

