import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, CornerUpLeft, X } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

type PartnershipMessage = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
};

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
  if (!raw.startsWith(REPLY_PREFIX)) return { reply: null, body: raw };
  const newlineIndex = raw.indexOf("\n");
  if (newlineIndex === -1) return { reply: null, body: raw };

  const header = raw.slice(REPLY_PREFIX.length, newlineIndex);
  const firstColon = header.indexOf(":");
  const secondColon = header.indexOf(":", firstColon + 1);
  const thirdColon = header.indexOf(":", secondColon + 1);
  if (firstColon === -1 || secondColon === -1) return { reply: null, body: raw };

  try {
    // New format: id:sender:role:content
    if (thirdColon !== -1) {
      return {
        reply: {
          id: header.slice(0, firstColon),
          senderName: decodeURIComponent(header.slice(firstColon + 1, secondColon)),
          senderRole: decodeURIComponent(header.slice(secondColon + 1, thirdColon)),
          content: decodeURIComponent(header.slice(thirdColon + 1)),
        },
        body: raw.slice(newlineIndex + 1),
      };
    }

    // Backward compatibility: id:sender:content
    return {
      reply: {
        id: header.slice(0, firstColon),
        senderName: decodeURIComponent(header.slice(firstColon + 1, secondColon)),
        senderRole: "STUDENT",
        content: decodeURIComponent(header.slice(secondColon + 1)),
      },
      body: raw.slice(newlineIndex + 1),
    };
  } catch {
    return { reply: null, body: raw };
  }
};

const StudentMessages: React.FC = () => {
  const [messages, setMessages] = useState<PartnershipMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyMeta | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-PH", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
    return initials || "U";
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      INSTRUCTOR: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      COORDINATOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    };
    return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get("/students/partnership-messages");
      const serverMessages: PartnershipMessage[] = res.data.messages || [];
      setMessages(serverMessages);
      if (showLoading) {
        setTimeout(() => scrollToBottom("auto"), 50);
      }
    } catch (e) {
      if (showLoading) toast.error("Failed to load messages");
      console.error(e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
    const interval = window.setInterval(() => loadMessages(false), 3000);
    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      // Keep view near the latest messages after updates
      scrollToBottom("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      setSending(true);
      const payloadContent = replyTo
        ? encodeReplyPayload(replyTo, newMessage.trim())
        : newMessage.trim();
      const res = await api.post("/students/partnership-messages", {
        content: payloadContent,
      });
      const created: PartnershipMessage | undefined = res.data.message;
      if (created) {
        setMessages((prev) => [...prev, created]);
      } else {
        await loadMessages(false);
      }
      setNewMessage("");
      setReplyTo(null);
      setTimeout(() => scrollToBottom("smooth"), 50);
      toast.success("Message sent");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 font-outfit">
      <div className="bg-white dark:bg-[#212124] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stay connected with your instructor and coordinator.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-[60vh] overflow-y-auto px-4 sm:px-6 py-4 space-y-2 bg-gray-50/40 dark:bg-[#19191c]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Message your instructor now
              </div>
              <div className="mt-2 text-sm">
                Ask about requirements, submissions, or your internship progress.
              </div>
            </div>
          ) : (
            messages.map((m, index) => {
              const isMe = m.senderRole === "STUDENT";
              const prev = index > 0 ? messages[index - 1] : null;
              const isSameSenderAsPrev =
                !!prev &&
                prev.senderRole === m.senderRole &&
                prev.senderId === m.senderId;
              const time = formatTime(m.createdAt);
              const parsed = parseReplyPayload(m.content);
              const avatarBg =
                m.senderRole === "INSTRUCTOR"
                  ? "bg-green-600"
                  : m.senderRole === "COORDINATOR"
                  ? "bg-purple-600"
                  : "bg-blue-600";

              return (
                <div
                  key={m.id}
                  className={`group/message flex ${isMe ? "justify-end" : "justify-start"} ${isSameSenderAsPrev ? "mt-1" : "mt-3"}`}
                >
                  <div className={`max-w-[90%] sm:max-w-[75%] flex items-center gap-2 ${isMe ? "justify-end" : ""}`}>
                    {isMe && (
                      <button
                        onClick={() =>
                          setReplyTo({
                            id: m.id,
                            senderName: m.senderName,
                            senderRole: m.senderRole,
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

                    {!isMe && (
                      <div className={`w-8 h-8 rounded-full ${avatarBg} text-white flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                        {getInitials(m.senderName)}
                      </div>
                    )}

                    <div className={`group relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && (
                        <div className="mb-1 flex items-center gap-2 justify-start">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {m.senderName}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(m.senderRole)}`}>
                            {m.senderRole}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-[#212124] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                        }`}
                      >
                        {parsed.reply && (
                          <div className={`mb-2 rounded-lg px-2.5 py-1.5 text-xs border ${
                            isMe
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
                          isMe
                            ? "top-1/2 -translate-y-1/2 right-full mr-14"
                            : "top-[22px] left-full ml-10"
                        }`}
                      >
                        {time}
                      </span>
                    </div>

                    {!isMe && (
                      <button
                        onClick={() =>
                          setReplyTo({
                            id: m.id,
                            senderName: m.senderName,
                            senderRole: m.senderRole,
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
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 p-4 sm:p-5 bg-white dark:bg-[#212124]">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#19191c] px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              {replyTo && (
                <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-[#212124] px-3 py-2">
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
                    if (!sending && newMessage.trim()) handleSend();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-2 py-1.5 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 border-0 outline-none focus:outline-none resize-none max-h-28"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="ml-2 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
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
    </div>
  );
};

export default StudentMessages;

