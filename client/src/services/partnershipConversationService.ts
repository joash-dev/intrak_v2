import api from "./api";

export type PartnershipConversationSummary = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  profilePhoto?: string | null;
  /** Unread student message for instructor/coordinator (from API). */
  unread?: boolean;
  lastMessage: null | {
    id: string;
    content: string;
    createdAt: string;
    senderName: string;
    senderRole: string;
  };
};

const partnershipConversationService = {
  async getConversations(): Promise<PartnershipConversationSummary[]> {
    const response = await api.get("/students/partnership-conversations");
    return response.data.conversations || [];
  },

  async markConversationRead(studentId: string): Promise<void> {
    await api.post("/students/partnership-conversations/read", { studentId });
  },
};

export { partnershipConversationService };

