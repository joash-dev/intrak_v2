import { useEffect, useMemo, useState } from "react";
import { documentService } from "../../services/documentService";
import type {
  DocumentFeedbackEntry,
  DocumentFeedbackType,
} from "../../services/documentService";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface DocumentFeedbackPanelProps {
  documentId: string;
  allowFeedback?: boolean;
  defaultType?: DocumentFeedbackType;
  className?: string;
  onFeedbackAdded?: (entry: DocumentFeedbackEntry) => void;
  hideHeader?: boolean;
  showRequiresActionToggle?: boolean;
  typeOptions?: DocumentFeedbackType[];
  allowTypeSelection?: boolean;
  submitLabel?: string;
  messagePlaceholder?: string;
  compact?: boolean;
}

const FEEDBACK_TYPE_OPTIONS: Array<{
  value: DocumentFeedbackType;
  label: string;
  description: string;
}> = [
  {
    value: "COMMENT",
    label: "Comment",
    description: "Share general notes without changing document status.",
  },
  {
    value: "REQUEST_CHANGES",
    label: "Request Changes",
    description:
      "Requires student updates and moves the document to resubmission requested.",
  },
  {
    value: "APPROVAL_NOTE",
    label: "Approval Note",
    description: "Capture context when approving or closing out a review.",
  },
  {
    value: "STUDENT_RESPONSE",
    label: "Student Response",
    description: "Student follow-up or clarification on the feedback given.",
  },
];

const TYPE_COLORS: Record<
  DocumentFeedbackType,
  { badge: string; text: string }
> = {
  COMMENT: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-300",
  },
  REQUEST_CHANGES: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-300",
  },
  APPROVAL_NOTE: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  STUDENT_RESPONSE: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    text: "text-purple-600 dark:text-purple-300",
  },
};

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleString();
};

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

const DOCUMENT_ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinator",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
  SUPERVISOR: "Supervisor",
  INDUSTRY_PARTNER: "Industry Partner",
};

const DocumentFeedbackPanel = ({
  documentId,
  allowFeedback = false,
  defaultType = "COMMENT",
  className = "",
  onFeedbackAdded,
  hideHeader = false,
  showRequiresActionToggle = true,
  typeOptions,
  allowTypeSelection = true,
  submitLabel = "Submit feedback",
  messagePlaceholder = "Share feedback, next steps, or clarification...",
  compact = false,
}: DocumentFeedbackPanelProps) => {
  const [entries, setEntries] = useState<DocumentFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<DocumentFeedbackType>(defaultType);
  const [requiresAction, setRequiresAction] = useState(
    defaultType === "REQUEST_CHANGES"
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    const loadFeedback = async () => {
      try {
        setLoading(true);
        setError(null);
        const feedback = await documentService.getDocumentFeedback(documentId);
        setEntries(feedback);
      } catch (err: any) {
        console.error("Failed to load document feedback:", err);
        setError(
          err?.response?.data?.message ??
            "Failed to load feedback. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [documentId]);

  useEffect(() => {
    if (type !== "REQUEST_CHANGES") {
      setRequiresAction(false);
    } else if (allowFeedback) {
      setRequiresAction(true);
    }
  }, [type, allowFeedback]);

  const orderedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries]);

  const availableOptions = useMemo(() => {
    if (!typeOptions || typeOptions.length === 0) {
      return FEEDBACK_TYPE_OPTIONS;
    }
    return FEEDBACK_TYPE_OPTIONS.filter((option) =>
      typeOptions.includes(option.value)
    );
  }, [typeOptions]);

  useEffect(() => {
    const allowedValues = availableOptions.map((option) => option.value);
    if (!allowedValues.includes(type)) {
      const fallback = availableOptions[0]?.value ?? "COMMENT";
      setType(fallback);
      setRequiresAction(fallback === "REQUEST_CHANGES");
    }
  }, [availableOptions, type]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please enter feedback before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const newEntry = await documentService.addDocumentFeedback(documentId, {
        message: trimmed,
        type,
        requiresAction: type === "REQUEST_CHANGES" ? requiresAction : false,
      });

      setEntries((prev) => [newEntry, ...prev]);
      setMessage("");
      if (type === "REQUEST_CHANGES") {
        setRequiresAction(true);
      }
      toast.success("Feedback submitted.");
      onFeedbackAdded?.(newEntry);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      toast.error(
        err?.response?.data?.message ?? "Unable to submit feedback right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const bodyHeightClass = compact ? "max-h-48" : "max-h-72";

  return (
    <div
      className={`flex flex-col ${compact ? "gap-3 p-3" : "gap-4 p-4"} rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feedback History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track review notes, approvals, and change requests.
            </p>
          </div>
          <MessageSquare className="w-5 h-5 text-purple-500" />
        </div>
      )}

      {loading ? (
        <div className={`flex items-center justify-center ${compact ? "py-6" : "py-10"} ${bodyHeightClass} overflow-y-auto`}>
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span>Loading feedback...</span>
          </div>
        </div>
      ) : error ? (
        <div className={`rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 ${bodyHeightClass} overflow-y-auto`}>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Unable to load feedback</span>
          </div>
          <p className="text-sm text-red-500 dark:text-red-200 mt-1">{error}</p>
        </div>
      ) : orderedEntries.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-center ${
            compact ? "py-6" : "py-10"
          } ${bodyHeightClass} overflow-y-auto`}
        >
          <MessageSquare
            className={`mx-auto mb-3 text-gray-400 ${compact ? "w-6 h-6" : "w-8 h-8"}`}
          />
          <p className={`text-sm text-gray-500 dark:text-gray-400 ${compact ? "px-4" : ""}`}>
            No feedback has been recorded yet.
          </p>
          {allowFeedback && (
            <p className="text-xs text-gray-400 mt-1">
              Use the form below to start the conversation.
            </p>
          )}
        </div>
      ) : (
        <div
          className={`${compact ? "space-y-2" : "space-y-3"} ${bodyHeightClass} overflow-y-auto pr-1`}
        >
          {orderedEntries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 shadow-sm ${
                compact ? "p-3" : "p-4"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {entry.author?.profilePhoto ? (
                    <img
                      src={entry.author.profilePhoto}
                      alt={entry.author.name ?? "Reviewer"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-semibold">
                      {getInitials(entry.author?.name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {entry.author?.name ?? "System"}
                      </p>
                      {entry.author?.role && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          •{" "}
                          {DOCUMENT_ROLE_LABEL[entry.author.role] ??
                            entry.author.role}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(entry.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[entry.type].badge}`}
                    >
                      {entry.type === "REQUEST_CHANGES" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {entry.type === "APPROVAL_NOTE" && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {entry.type === "COMMENT" && (
                        <MessageSquare className="w-3 h-3" />
                      )}
                      {entry.type === "STUDENT_RESPONSE" && (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{entry.type.replace(/_/g, " ")}</span>
                    </span>
                    {entry.requiresAction && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Requires action
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {entry.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {allowFeedback && (
        <div
          className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 ${
            compact ? "p-3 space-y-3" : "p-4 space-y-3"
          }`}
        >
          <div className={`flex flex-col md:flex-row gap-3`}>
            <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              <span>Feedback Type</span>
              {allowTypeSelection && availableOptions.length > 1 ? (
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as DocumentFeedbackType)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {availableOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white">
                  {
                    availableOptions.find((option) => option.value === type)
                      ?.label
                  }
                </div>
              )}
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                {
                  availableOptions.find((opt) => opt.value === type)
                    ?.description
                }
              </span>
            </div>
            {type === "REQUEST_CHANGES" && showRequiresActionToggle && (
              <label className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={requiresAction}
                  onChange={(e) => setRequiresAction(e.target.checked)}
                  className="mt-1 h-4 w-4 border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="font-medium">Requires student action</p>
                  <p className="text-xs">
                    Keeps the document in a pending state until the student
                    resubmits.
                  </p>
                </div>
              </label>
            )}
          </div>

          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messagePlaceholder}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setType(defaultType);
                setRequiresAction(defaultType === "REQUEST_CHANGES");
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
              disabled={submitting}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFeedbackPanel;

