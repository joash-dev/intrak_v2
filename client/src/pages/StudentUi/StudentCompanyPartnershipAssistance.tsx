import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Search,
  FileCheck,
  Briefcase,
  ChevronDown,
  Eye,
  Download,
  FileText,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { documentService } from "../../services/documentService";
import type { Document as AppDocument } from "../../services/documentService";
import toast from "react-hot-toast";

interface PartnershipMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

interface PartnershipDocument {
  id: string;
  type: string;
  name: string;
  formNumber: string;
  description: string;
  required: boolean;
  document?: AppDocument | null;
  uploading?: boolean;
}

const StudentCompanyPartnershipAssistance = () => {
  const [messages, setMessages] = useState<PartnershipMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-deployment required documents (uploaded in Documents tab)
  const [preDeploymentDocuments, setPreDeploymentDocuments] = useState<PartnershipDocument[]>([
    {
      id: "application-internship",
      type: "APPLICATION_INTERNSHIP",
      name: "Application for Internship",
      formNumber: "Form FM-AA-INT-01",
      description: "Application form for internship program",
      required: true,
    },
    {
      id: "medical-certificate",
      type: "MEDICAL_CERTIFICATE",
      name: "Medical Certificate and Psychological Test from any government physician",
      formNumber: "From any government physician",
      description: "Medical certificate and psychological test results from any government physician",
      required: true,
    },
    {
      id: "certification-units",
      type: "CERTIFICATION_UNITS",
      name: "Certification of Units Earned",
      formNumber: "Form FM-AA-INT-02",
      description: "Certification of units earned for practicum/internship",
      required: true,
    },
    {
      id: "internship-resume",
      type: "INTERNSHIP_RESUME",
      name: "Internship Resume",
      formNumber: "Form FM-AA-INT-09",
      description: "Resume specifically formatted for internship applications",
      required: true,
    },
    {
      id: "consent-form",
      type: "CONSENT_FORM",
      name: "Consent Form",
      formNumber: "Form FM-AA-INT-03",
      description: "Consent form for internship participation",
      required: true,
    },
    {
      id: "endorsement-letter",
      type: "ENDORSEMENT_LETTER",
      name: "Endorsement Letter",
      formNumber: "Form FM-AA-INT-05",
      description: "Official endorsement letter from the university",
      required: true,
    },
    {
      id: "internship-release",
      type: "INTERNSHIP_RELEASE",
      name: "Internship Release Form",
      formNumber: "Form FM-AA-INT-12",
      description: "Form authorizing the student for internship",
      required: true,
    },
  ]);

  const [previewDoc, setPreviewDoc] = useState<AppDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Set up polling for real-time updates (poll every 3 seconds)
    const pollInterval = setInterval(() => {
      loadMessages(false); // Don't show loading state on polling
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial scroll position check after messages load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        checkIfAtBottom();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Check scroll position when messages change
  useEffect(() => {
    // Check if user sent a new message (message count increased and last message is from student)
    const userSentMessage = messages.length > lastMessageCount &&
      messages.length > 0 &&
      messages[messages.length - 1].senderRole === "STUDENT";

    if (userSentMessage) {
      // User sent a message - auto scroll to bottom
      scrollToBottom();
      setShowScrollToBottom(false);
    } else if (messages.length > lastMessageCount) {
      // New message arrived - check if user is at bottom
      setTimeout(() => {
        checkIfAtBottom();
      }, 100);
    }

    setLastMessageCount(messages.length);
  }, [messages, lastMessageCount]);

  // Handle scroll events to show/hide scrollbar
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolling(true);
      checkIfAtBottom();

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Hide scrollbar after 1 second of no scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    const handleMouseEnter = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load partnership messages
      loadMessages(true);

      // Load partnership documents
      await loadPartnershipDocuments();
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load partnership assistance data");
    } finally {
      setLoading(false);
    }
  };

  const loadPartnershipDocuments = async () => {
    try {
      // Get all student documents
      const documents = await documentService.getStudentDocuments();

      // Map documents to pre-deployment document types (only show documents uploaded in Documents tab)
      setPreDeploymentDocuments(prev => prev.map(doc => {
        const uploadedDoc = documents.find(d => d.type === doc.type);
        return {
          ...doc,
          document: uploadedDoc || null,
        };
      }));
    } catch (error: any) {
      console.error("Error loading pre-deployment documents:", error);
    }
  };

  const handlePreview = async (document: AppDocument) => {
    try {
      setPreviewDoc(document);
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error: any) {
      console.error("Error previewing document:", error);
      toast.error("Failed to preview document");
    }
  };

  const handleDownload = async (document: AppDocument) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded");
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const messagesResponse = await api.get("/students/partnership-messages");
      const newMessages = messagesResponse.data.messages || [];

      // Update messages - React will handle re-rendering only if changed
      const hasNewMessages = messages.length !== newMessages.length ||
        messages.some((msg, idx) => !newMessages[idx] || msg.id !== newMessages[idx].id);

      setMessages(prevMessages => {
        // Only update if the message count or IDs have changed
        if (prevMessages.length !== newMessages.length) {
          return newMessages;
        }
        // Check if any message IDs are different
        const hasChanges = prevMessages.some((msg, idx) =>
          !newMessages[idx] || msg.id !== newMessages[idx].id
        );
        return hasChanges ? newMessages : prevMessages;
      });

      // Check scroll position after messages update (if there were changes)
      if (hasNewMessages) {
        setTimeout(() => {
          checkIfAtBottom();
        }, 100);
      }
    } catch (error: any) {
      if (error.response?.status !== 404 && showLoading) {
        console.error("Error loading messages:", error);
      }
      if (showLoading) {
        setMessages([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setSending(true);
      const response = await api.post("/students/partnership-messages", {
        content: newMessage,
      });

      // Add the new message immediately for instant feedback
      const updatedMessages = [...messages, response.data.message];
      setMessages(updatedMessages);
      setNewMessage("");
      toast.success("Message sent successfully");

      // Auto-scroll to bottom when user sends a message
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // Reload messages to get the latest from server (in case of any sync issues)
      setTimeout(() => {
        loadMessages(false);
      }, 500);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      checkIfAtBottom();
    }, 300);
  };

  const checkIfAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 100; // 100px threshold
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      INSTRUCTOR: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      COORDINATOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    };
    return colors[role] || "bg-gray-100 text-gray-700 dark:bg-[#212124] dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Partnership Assistance</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Get guidance from your instructor and coordinator on finding a company
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Left Column - Communication */}
        <div className="lg:col-span-3 flex">
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col w-full">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Communication</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Get guidance from your instructor and coordinator
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-6 flex-1 min-h-0">

              {/* Messages */}
              <div className="relative mb-4" style={{ flex: '1 1 0', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                <div
                  ref={messagesContainerRef}
                  className={`h-full w-full overflow-y-auto transition-all duration-300 bg-white dark:bg-[#212124] rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-inner ${isScrolling ? 'scrollbar-visible' : 'scrollbar-hidden'
                    }`}
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start a conversation with your instructor or coordinator</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 py-2">
                        {messages.map((message) => {
                          const isStudent = message.senderRole === "STUDENT";
                          return (
                            <div
                              key={message.id}
                              className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                            >
                              <div className={`flex items-start space-x-2 max-w-[85%] ${isStudent ? "flex-row-reverse space-x-reverse" : ""}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${message.senderRole === "STUDENT"
                                  ? "bg-blue-500 text-white"
                                  : message.senderRole === "INSTRUCTOR"
                                    ? "bg-green-500 text-white"
                                    : "bg-purple-500 text-white"
                                  }`}>
                                  {message.senderName.charAt(0).toUpperCase()}
                                </div>

                                {/* Message Bubble */}
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      {message.senderName}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(
                                        message.senderRole
                                      )}`}
                                    >
                                      {message.senderRole}
                                    </span>
                                  </div>
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${isStudent
                                      ? "bg-indigo-600 text-white rounded-br-sm"
                                      : "bg-white dark:bg-[#212124] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm"
                                      }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                  </div>
                                  <span className={`text-[10px] text-gray-500 dark:text-gray-400 px-1 ${isStudent ? "text-right" : "text-left"}`}>
                                    {formatDate(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </>
                  )}
                </div>

                {/* Scroll to Bottom Button */}
                {showScrollToBottom && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10 animate-bounce"
                    title="Scroll to latest message"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-3 items-end bg-gray-50 dark:bg-[#19191c]/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#212124] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:transform-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Documents Checklist & Steps */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Documents Checklist */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Required Documents</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-[#212124] rounded-full h-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${(preDeploymentDocuments.filter((doc) => doc.document?.status === 'APPROVED').length / preDeploymentDocuments.length) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {preDeploymentDocuments.filter((doc) => doc.document?.status === 'APPROVED').length} / {preDeploymentDocuments.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Documents uploaded in the Documents tab will appear here
              </p>
            </div>

            <div className="p-4">
              <div className="space-y-3">
                {preDeploymentDocuments.map((doc) => {
                  const document = doc.document;
                  const isApproved = document?.status === 'APPROVED';
                  const isPending = document?.status === 'PENDING';
                  const isRejected = document?.status === 'REJECTED';
                  const isUploaded = !!document;

                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-lg border transition-all ${isApproved
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : isPending
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                          : isRejected
                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                            : "bg-gray-50 dark:bg-[#212124]/50 border-gray-200 dark:border-gray-700"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {doc.name}
                            </span>
                            {doc.required && (
                              <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                            {isApproved && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {isPending && (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            )}
                            {isRejected && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {doc.formNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.description}
                          </p>
                        </div>
                      </div>

                      {isUploaded ? (
                        <div className="mt-3 flex items-center justify-between p-2 bg-white dark:bg-[#212124] rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                              {document!.filename}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${isApproved
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : isPending
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                              }`}>
                              {document!.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handlePreview(document!)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(document!)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-white dark:bg-[#212124] rounded border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Not uploaded yet. Upload in <strong>Documents</strong> tab.
                          </p>
                        </div>
                      )}

                      {isRejected && document?.remarks && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                          <strong>Remarks:</strong> {document.remarks}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Button to open Steps Modal */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowStepsModal(true)}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <Briefcase className="w-5 h-5" />
                <span>View Steps to Find a Company</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4"
          onClick={() => {
            setPreviewDoc(null);
            if (previewUrl) {
              window.URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-[#212124] rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {previewDoc.filename}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {previewDoc.type.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  if (previewUrl) {
                    window.URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#19191c]">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title={previewDoc.filename}
                />
              ) : previewDoc.mimeType?.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={previewDoc.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Preview not available for this file type
                    </p>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Download to view
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4" style={{ marginTop: 0 }} onClick={() => setShowStepsModal(false)}>
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Steps to Find a Company</h3>
                </div>
                <button
                  onClick={() => setShowStepsModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Research Companies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Research companies in your field of interest. Look for companies that align with your career goals and offer relevant internship opportunities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Prepare Your Documents</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Complete all required documents from the checklist above. Make sure your resume, cover letter, and other documents are up-to-date and professional.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Contact Companies</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Reach out to companies via email or phone. Introduce yourself, express your interest in an internship, and inquire about available opportunities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Schedule Interviews</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      If a company shows interest, schedule an interview. Prepare for common interview questions and be ready to discuss your skills and goals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Process MOA</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Once a company agrees, work with your instructor and coordinator to process the Memorandum of Agreement (MOA). They will guide you through the necessary steps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#19191c]/50">
              <button
                onClick={() => setShowStepsModal(false)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCompanyPartnershipAssistance;

