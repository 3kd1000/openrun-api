import axiosInstance from "@/services/api/axiosInstance";
import type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  LikeResponse,
} from "@/lib/types/post";

export const getComments = async (
  clubId: number,
  postId: number
): Promise<Comment[]> => {
  const response = await axiosInstance.get<Comment[]>(
    `/clubs/${clubId}/posts/${postId}/comments`
  );
  return response.data;
};

export const createComment = async (
  clubId: number,
  postId: number,
  data: CreateCommentRequest
): Promise<Comment> => {
  const response = await axiosInstance.post<Comment>(
    `/clubs/${clubId}/posts/${postId}/comments`,
    data
  );
  return response.data;
};

export const updateComment = async (
  clubId: number,
  postId: number,
  commentId: number,
  data: UpdateCommentRequest
): Promise<Comment> => {
  const response = await axiosInstance.put<Comment>(
    `/clubs/${clubId}/posts/${postId}/comments/${commentId}`,
    data
  );
  return response.data;
};

export const deleteComment = async (
  clubId: number,
  postId: number,
  commentId: number
): Promise<void> => {
  await axiosInstance.delete(
    `/clubs/${clubId}/posts/${postId}/comments/${commentId}`
  );
};

export const toggleCommentLike = async (
  clubId: number,
  postId: number,
  commentId: number
): Promise<LikeResponse> => {
  const response = await axiosInstance.post<LikeResponse>(
    `/clubs/${clubId}/posts/${postId}/comments/${commentId}/like`
  );
  return response.data;
};
