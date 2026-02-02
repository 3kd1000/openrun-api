import axiosInstance from './api/axiosInstance';
import type { Post, Comment } from '../types/post';

export interface CreateInquiryRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
}

export const inquiryService = {
  /**
   * 내 문의글 목록 조회
   */
  getMyInquiries: async (): Promise<Post[]> => {
    const response = await axiosInstance.get('/inquiries');
    return response.data;
  },

  /**
   * 문의글 작성
   */
  createInquiry: async (content: string): Promise<Post> => {
    const response = await axiosInstance.post('/inquiries', { content });
    return response.data;
  },

  /**
   * 문의글 상세 조회
   */
  getInquiry: async (postId: number): Promise<Post> => {
    const response = await axiosInstance.get(`/inquiries/${postId}`);
    return response.data;
  },

  /**
   * 문의글 댓글 목록 조회
   */
  getInquiryComments: async (postId: number): Promise<Comment[]> => {
    const response = await axiosInstance.get(`/inquiries/${postId}/comments`);
    return response.data;
  },

  /**
   * 문의글에 댓글 작성
   */
  addComment: async (postId: number, content: string): Promise<Comment> => {
    const response = await axiosInstance.post(`/inquiries/${postId}/comments`, { content });
    return response.data;
  }
};
