import axiosInstance from './api/axiosInstance';
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  LikeResponse
} from '../types/post';

export const commentService = {
  /**
   * 댓글 목록 조회
   */
  getComments: async (clubId: number, postId: number): Promise<Comment[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/posts/${postId}/comments`);
    return response.data;
  },

  /**
   * 댓글 작성
   */
  createComment: async (clubId: number, postId: number, data: CreateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/posts/${postId}/comments`, data);
    return response.data;
  },

  /**
   * 댓글 수정
   */
  updateComment: async (clubId: number, postId: number, commentId: number, data: UpdateCommentRequest): Promise<Comment> => {
    const response = await axiosInstance.put(`/clubs/${clubId}/posts/${postId}/comments/${commentId}`, data);
    return response.data;
  },

  /**
   * 댓글 삭제
   */
  deleteComment: async (clubId: number, postId: number, commentId: number): Promise<void> => {
    await axiosInstance.delete(`/clubs/${clubId}/posts/${postId}/comments/${commentId}`);
  },

  /**
   * 댓글 좋아요 토글
   */
  toggleLike: async (clubId: number, postId: number, commentId: number): Promise<LikeResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  }
};
