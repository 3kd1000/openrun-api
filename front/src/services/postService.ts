import axiosInstance from './api/axiosInstance';
import type {
  Post,
  PostType,
  CreatePostRequest,
  UpdatePostRequest,
  LikeResponse,
  PageResponse
} from '../types/post';

export const postService = {
  /**
   * 게시글 목록 조회 (페이징)
   */
  getPosts: async (
    clubId: number,
    postType?: PostType,
    page: number = 0,
    size: number = 30
  ): Promise<PageResponse<Post>> => {
    const params: Record<string, string | number> = { page, size };
    if (postType) {
      params.postType = postType;
    }
    const response = await axiosInstance.get(`/clubs/${clubId}/posts`, { params });
    return response.data;
  },

  /**
   * 게시글 상세 조회
   */
  getPost: async (clubId: number, postId: number): Promise<Post> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/posts/${postId}`);
    return response.data;
  },

  /**
   * 게시글 생성
   */
  createPost: async (clubId: number, data: CreatePostRequest): Promise<Post> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/posts`, data);
    return response.data;
  },

  /**
   * 게시글 수정
   */
  updatePost: async (clubId: number, postId: number, data: UpdatePostRequest): Promise<Post> => {
    const response = await axiosInstance.put(`/clubs/${clubId}/posts/${postId}`, data);
    return response.data;
  },

  /**
   * 게시글 삭제
   */
  deletePost: async (clubId: number, postId: number): Promise<void> => {
    await axiosInstance.delete(`/clubs/${clubId}/posts/${postId}`);
  },

  /**
   * 게시글 좋아요 토글
   */
  toggleLike: async (clubId: number, postId: number): Promise<LikeResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/posts/${postId}/like`);
    return response.data;
  }
};
