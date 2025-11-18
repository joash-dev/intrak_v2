import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  User,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
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

interface PartnershipMessageThreadProps {
  studentId: string;
  studentName?: string;
  currentUserRole: "INSTRUCTOR" | "COORDINATOR";
}

const PartnershipMessageThread: React.FC<PartnershipMessageThreadProps> = ({
  studentId,
  studentName,
  currentUserRole,
}) => {
  const [messages, setMessages] = useState<PartnershipMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      const response = await api.post("/students/partnership-messages", {
        content: newMessage,
        studentId: studentId,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
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
    return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
          Partnership Communication
        </h4>
        {studentName && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            with {studentName}
          </span>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Communicate with the student about their company partnership process, required documents, and MOA setup.
        </p>

        {/* Messages */}
        <div className="relative">
          <div 
            ref={messagesContainerRef}
            className={`bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 mb-4 h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
              isScrolling ? 'scrollbar-visible' : 'scrollbar-hidden'
            }`}
          >
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation with the student</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {messages.map((message) => {
                const isCurrentUser = message.senderRole === currentUserRole;
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${isCurrentUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        message.senderRole === "STUDENT"
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
                          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isCurrentUser
                              ? "bg-indigo-600 text-white rounded-br-sm"
                              : message.senderRole === "STUDENT"
                              ? "bg-blue-50 dark:bg-blue-900/40 text-gray-900 dark:text-white border border-blue-200 dark:border-blue-800 rounded-bl-sm"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <span className={`text-[10px] text-gray-500 dark:text-gray-400 px-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
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
              className="absolute bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10 animate-bounce"
              title="Scroll to latest message"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2 items-end">
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
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnershipMessageThread;

