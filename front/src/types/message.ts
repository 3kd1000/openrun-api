export interface MessageResponse {
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

export interface ConversationResponse {
  partnerId: number;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
  referenceType?: string;
  referenceId?: number;
}
