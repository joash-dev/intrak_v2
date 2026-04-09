import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Loader2, ArrowLeft, Info } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import PartnershipMessageThread from "../../components/PartnershipMessageThread";
import PartnershipConversationsSidebar from "../../components/PartnershipConversationsSidebar";
import StudentChatDetailsDrawer from "../../components/StudentChatDetailsDrawer";
import {
  partnershipConversationService,
  type PartnershipConversationSummary,
} from "../../services/partnershipConversationService";
import { requestInstructorNavBadgesRefresh } from "../../services/instructorService";

const InstructorMessages: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFromQuery = searchParams.get("studentId") || "";

  const [conversations, setConversations] = useState<
    PartnershipConversationSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    selectedFromQuery || ""
  );
  const [showMobileThread, setShowMobileThread] = useState<boolean>(
    Boolean(selectedFromQuery)
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const conv = await partnershipConversationService.getConversations();
      setConversations(conv);
      requestInstructorNavBadgesRefresh();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    let cancelled = false;
    (async () => {
      try {
        await partnershipConversationService.markConversationRead(selectedStudentId);
        if (!cancelled) {
          setConversations((prev) =>
            prev.map((c) =>
              c.studentId === selectedStudentId ? { ...c, unread: false } : c
            )
          );
          requestInstructorNavBadgesRefresh();
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshConversations();
    }, 12000);
    return () => window.clearInterval(id);
  }, [refreshConversations]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const conv = await partnershipConversationService.getConversations();
        setConversations(conv);

        const hasSelected =
          !!selectedFromQuery && conv.some((c) => c.studentId === selectedFromQuery);

        if (hasSelected) {
          setSelectedStudentId(selectedFromQuery);
          setShowMobileThread(true);
          return;
        }

        if (conv.length > 0) {
          const fallbackId = conv[0].studentId;
          setSelectedStudentId(fallbackId);
          setShowMobileThread(true);
          const next = new URLSearchParams(location.search);
          next.set("studentId", fallbackId);
          setSearchParams(next);
        } else {
          setSelectedStudentId("");
          setShowMobileThread(false);
        }
      } finally {
        setLoading(false);
        requestInstructorNavBadgesRefresh();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedFromQuery && selectedFromQuery !== selectedStudentId) {
      setSelectedStudentId(selectedFromQuery);
      setShowMobileThread(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFromQuery]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.studentId === selectedStudentId),
    [conversations, selectedStudentId]
  );

  return (
    <div className="space-y-6 font-outfit">
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Messages
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with students about partnership assistance.
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            Use the sidebar to switch conversations.
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-260px)] min-h-[560px]">
            <aside
              className={[
                `w-full ${sidebarCollapsed ? "lg:w-[92px]" : "lg:w-[420px]"} border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700 h-full overflow-hidden transition-[width] duration-300 ease-in-out`,
                showMobileThread ? "hidden lg:block" : "block",
              ].join(" ")}
            >
              <PartnershipConversationsSidebar
                conversations={conversations}
                selectedStudentId={selectedStudentId}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
                onSelectStudent={(id) => {
                  setSelectedStudentId(id);
                  setShowMobileThread(true);
                  const next = new URLSearchParams(location.search);
                  next.set("studentId", id);
                  setSearchParams(next);
                }}
              />
            </aside>

            <main
              className={[
                "flex-1 p-3 sm:p-4 h-full min-h-0",
                showMobileThread ? "block" : "hidden lg:block",
              ].join(" ")}
            >
              {!selectedStudentId ? (
                <div className="h-full flex items-center justify-center">
                  <div className="max-w-sm text-center px-6">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      No conversation selected
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Choose a student from the sidebar to view messages, or wait for
                      a new student message to start a thread.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-0 flex flex-col">
                  {/* Thread header */}
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => setShowMobileThread(false)}
                        className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {selectedConversation?.studentName || "Student"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {selectedConversation?.studentNumber || "—"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      aria-label="Open student details"
                      title="Student details"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <PartnershipMessageThread
                      studentId={selectedStudentId}
                      studentName={selectedConversation?.studentName}
                      currentUserRole="INSTRUCTOR"
                      onConversationUpdated={refreshConversations}
                    />
                  </div>

                  <StudentChatDetailsDrawer
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    studentId={selectedStudentId}
                    fallbackName={selectedConversation?.studentName}
                    fallbackStudentNumber={selectedConversation?.studentNumber}
                  />
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorMessages;

