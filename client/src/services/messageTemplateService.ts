import api from "./api";

export type MessageTemplateRole = "STUDENT" | "INSTRUCTOR" | "COORDINATOR";

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  targetRoles: MessageTemplateRole[];
  sortOrder: number;
}

class MessageTemplateService {
  async getTemplates(category?: string): Promise<MessageTemplate[]> {
    try {
      const response = await api.get("/message-templates", {
        params: {
          category: category?.trim() || undefined,
        },
      });

      const templates = response.data?.templates;
      return Array.isArray(templates) ? templates : [];
    } catch (error: any) {
      console.error("Error fetching message templates:", error);
      const message =
        error?.response?.data?.message || "Failed to load message templates";
      throw new Error(message);
    }
  }
}

export const messageTemplateService = new MessageTemplateService();

