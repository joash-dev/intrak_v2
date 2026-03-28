import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ChevronDown, CornerUpLeft, X, Loader2 } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

interface PartnershipMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

type ReplyMeta = {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
};

const REPLY_PREFIX = "__reply__:";

const encodeReplyPayload = (reply: ReplyMeta, body: string) => {
  const sender = encodeURIComponent(reply.senderName);
  const role = encodeURIComponent(reply.senderRole);
  const content = encodeURIComponent(reply.content);
  return `${REPLY_PREFIX}${reply.id}:${sender}:${role}:${content}\n${body}`;
};

const parseReplyPayload = (raw: string): { reply: ReplyMeta | null; body: string } => {
  if (!raw.startsWith(REPLY_PREFIX)) {
    return { reply: null, body: raw };
  }

  const newlineIndex = raw.indexOf("\n");
  if (newlineIndex === -1) {
    return { reply: null, body: raw };
  }

  const header = raw.slice(REPLY_PREFIX.length, newlineIndex);
  const firstColon = header.indexOf(":");
  const secondColon = header.indexOf(":", firstColon + 1);
  const thirdColon = header.indexOf(":", secondColon + 1);
  if (firstColon === -1 || secondColon === -1) {
    return { reply: null, body: raw };
  }

  try {
    // New format: id:sender:role:content
    if (thirdColon !== -1) {
      const reply: ReplyMeta = {
        id: header.slice(0, firstColon),
        senderName: decodeURIComponent(header.slice(firstColon + 1, secondColon)),
        senderRole: decodeURIComponent(header.slice(secondColon + 1, thirdColon)),
        content: decodeURIComponent(header.slice(thirdColon + 1)),
      };
      return { reply, body: raw.slice(newlineIndex + 1) };
    }

    // Backward compatibility: id:sender:content
    const reply: ReplyMeta = {
      id: header.slice(0, firstColon),
      senderName: decodeURIComponent(header.slice(firstColon + 1, secondColon)),
      senderRole: "STUDENT",
      content: decodeURIComponent(header.slice(secondColon + 1)),
    };
    return { reply, body: raw.slice(newlineIndex + 1) };
  } catch {
    return { reply: null, body: raw };
  }
};

interface PartnershipMessageThreadProps {
  studentId: string;
  studentName?: string;
  currentUserRole: "INSTRUCTOR" | "COORDINATOR";
}

const PartnershipMessageThread: React.FC<PartnershipMessageThreadProps> = ({
  studentId,
  currentUserRole,
}) => {
  const [messages, setMessages] = useState<PartnershipMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [replyTo, setReplyTo] = useState<ReplyMeta | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (studentId) {
      loadMessages();
      
      // Set up polling for real-time updates (poll every 3 seconds)
      const pollInterval = setInterval(() => {
        loadMessages(false); // Don't show loading state on polling
      }, 3000);

      return () => {
        clearInterval(pollInterval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Initial scroll position check after messages load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        checkIfAtBottom();
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    // Check if user sent a new message (message count increased and last message is from current user)
    const userSentMessage = messages.length > lastMessageCount && 
      messages.length > 0 && 
      messages[messages.length - 1].senderRole === currentUserRole;
    
    if (userSentMessage) {
      // User sent a message - auto scroll to bottom
      scrollToBottom();
      setShowScrollToBottom(false);
    } else if (messages.length > lastMessageCount) {
      // New message arrived - check if user is at bottom
      checkIfAtBottom();
    }
    
    setLastMessageCount(messages.length);
  }, [messages, lastMessageCount, currentUserRole]);

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

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get(`/students/partnership-messages?studentId=${studentId}`);
      const newMessages = response.data.messages || [];
      
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
      console.error("Error loading messages:", error);
      if (error.response?.status !== 404 && showLoading) {
        toast.error("Failed to load messages");
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
      const payloadContent = replyTo
        ? encodeReplyPayload(replyTo, newMessage.trim())
        : newMessage.trim();
      const response = await api.post("/students/partnership-messages", {
        content: payloadContent,
        studentId: studentId,
      });

      // Add the new message immediately for instant feedback
      const updatedMessages = [...messages, response.data.message];
      setMessages(updatedMessages);
      setNewMessage("");
      setReplyTo(null);
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

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      INSTRUCTOR: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      COORDINATOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    };
    return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={messagesContainerRef}
          className={`h-[60vh] overflow-y-auto px-4 sm:px-6 py-4 space-y-2 bg-gray-50/40 dark:bg-[#19191c] transition-all duration-300 ${
            isScrolling ? "scrollbar-visible" : "scrollbar-hidden"
          }`}
        >
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {loading ? (
                <div className="flex items-center justify-center h-full py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Start a conversation
                  </div>
                  <div className="mt-2 text-sm">
                    Ask about requirements, submissions, or internship progress.
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {messages.map((message, index) => {
                const isCurrentUser = message.senderRole === currentUserRole;
                const prev = index > 0 ? messages[index - 1] : null;
                const isSameSenderAsPrev =
                  !!prev &&
                  prev.senderRole === message.senderRole &&
                  prev.senderId === message.senderId;
                const parsed = parseReplyPayload(message.content);
                const avatarClass =
                  message.senderRole === "STUDENT"
                    ? "bg-blue-500 text-white"
                    : message.senderRole === "INSTRUCTOR"
                    ? "bg-green-500 text-white"
                    : "bg-purple-500 text-white";

                return (
                  <div
                    key={message.id}
                    className={`group/message flex ${isCurrentUser ? "justify-end" : "justify-start"} ${isSameSenderAsPrev ? "mt-1" : "mt-3"}`}
                  >
                    <div className={`max-w-[90%] sm:max-w-[80%] flex items-center gap-2 ${isCurrentUser ? "justify-end" : ""}`}>
                      {isCurrentUser && (
                        <button
                          onClick={() =>
                            setReplyTo({
                              id: message.id,
                              senderName: message.senderName,
                              senderRole: message.senderRole,
                              content: parsed.body,
                            })
                          }
                          className="opacity-0 group-hover/message:opacity-100 transition-opacity duration-150 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                          title="Reply"
                          aria-label="Reply"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isCurrentUser && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarClass}`}>
                          {message.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className={`group relative flex flex-col ${isCurrentUser ? "items-end" : "items-start"} space-y-1`}>
                        {!isCurrentUser && (
                          <div className="flex items-center gap-2 justify-start">
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
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isCurrentUser
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : message.senderRole === "STUDENT"
                              ? "bg-white dark:bg-[#212124] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                              : "bg-white dark:bg-[#212124] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                          }`}
                        >
                          {parsed.reply && (
                            <div className={`mb-2 rounded-lg px-2.5 py-1.5 text-xs border ${
                              isCurrentUser
                                ? "bg-white/15 border-white/25 text-blue-50"
                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold truncate">{parsed.reply.senderName}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(parsed.reply.senderRole)}`}>
                                  {parsed.reply.senderRole}
                                </span>
                              </div>
                              <p className="truncate">{parsed.reply.content}</p>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {parsed.body}
                          </p>
                        </div>
                        <span
                          className={`absolute text-[10px] text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap ${
                            isCurrentUser
                              ? "top-1/2 -translate-y-1/2 right-full mr-14"
                              : "top-[22px] left-full ml-10"
                          }`}
                        >
                          {formatDate(message.createdAt)}
                        </span>
                      </div>

                      {!isCurrentUser && (
                        <button
                          onClick={() =>
                            setReplyTo({
                              id: message.id,
                              senderName: message.senderName,
                              senderRole: message.senderRole,
                              content: parsed.body,
                            })
                          }
                          className="opacity-0 group-hover/message:opacity-100 transition-opacity duration-150 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                          title="Reply"
                          aria-label="Reply"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10"
            title="Scroll to latest message"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#212124]">
        <div className="flex items-center gap-3">
          <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#19191c] px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            {replyTo && (
              <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Replying to {replyTo.senderName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {replyTo.content}
                  </p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                  aria-label="Cancel reply"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-2 py-1.5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 border-0 outline-none focus:outline-none resize-none max-h-28 leading-5"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="ml-2 h-9 w-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipMessageThread;

