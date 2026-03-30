import api from "./api";

export type PartnershipConversationSummary = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  profilePhoto?: string | null;
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
};

export { partnershipConversationService };

