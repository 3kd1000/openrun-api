import api from "./api";

export interface Conversation {
  partnerId: number;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  isRead: boolean;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}

export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  regionDepth1: string | null;
  regionDepth2: string | null;
}

const adminMessageService = {
  // 운영자의 대화 목록 조회
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get<Conversation[]>("/messages/conversations");
    return res.data;
  },

  // 특정 유저와의 대화 내역 조회
  getConversationWith: async (userId: number): Promise<Message[]> => {
    const res = await api.get<Message[]>(`/messages/conversations/${userId}`);
    return res.data;
  },

  // 메시지 발송 (운영자 → 유저)
  sendMessage: async (receiverId: number, content: string): Promise<Message> => {
    const res = await api.post<Message>("/messages", { receiverId, content });
    return res.data;
  },

  // 유저 이름 검색 (DM 대상 선택용)
  searchUsers: async (keyword: string): Promise<UserSearchResult[]> => {
    const res = await api.get<UserSearchResult[]>("/admin/users/search", {
      params: { keyword },
    });
    return res.data;
  },
};

export default adminMessageService;
