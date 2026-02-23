import axiosInstance from './api/axiosInstance';
import type {
  MessageResponse,
  ConversationResponse,
  SendMessageRequest,
} from '../types/message';

export const messageService = {
  /** 메시지 전송 */
  sendMessage: async (request: SendMessageRequest): Promise<MessageResponse> => {
    const response = await axiosInstance.post<MessageResponse>('/messages', request);
    return response.data;
  },

  /** 대화 목록 조회 */
  getConversations: async (): Promise<ConversationResponse[]> => {
    const response = await axiosInstance.get<ConversationResponse[]>('/messages/conversations');
    return response.data;
  },

  /** 특정 상대와의 대화 내역 조회 */
  getConversationWith: async (partnerId: number): Promise<MessageResponse[]> => {
    const response = await axiosInstance.get<MessageResponse[]>(`/messages/conversations/${partnerId}`);
    return response.data;
  },

  /** 메시지 읽음 처리 */
  markAsRead: async (messageId: number): Promise<void> => {
    await axiosInstance.patch(`/messages/${messageId}/read`);
  },

  /** 읽지 않은 메시지 수 */
  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get<number>('/messages/unread-count');
    return response.data;
  },

  /** 메시지 신고 */
  reportMessage: async (messageId: number, reason: string, description?: string): Promise<void> => {
    await axiosInstance.post('/messages/report', { messageId, reason, description });
  },
};
