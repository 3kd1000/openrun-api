import axiosInstance from "@/services/api/axiosInstance";
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  LikeResponse,
} from "@/lib/types/post";

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getPosts = async (
  clubId: number,
  postType?: string,
  page: number = 0,
  size: number = 30
): Promise<PageResponse<Post>> => {
  const response = await axiosInstance.get<PageResponse<Post>>(
    `/clubs/${clubId}/posts`,
    { params: { postType, page, size } }
  );
  return response.data;
};

export const getPost = async (
  clubId: number,
  postId: number
): Promise<Post> => {
  const response = await axiosInstance.get<Post>(
    `/clubs/${clubId}/posts/${postId}`
  );
  return response.data;
};

export const createPost = async (
  clubId: number,
  data: CreatePostRequest
): Promise<Post> => {
  const response = await axiosInstance.post<Post>(
    `/clubs/${clubId}/posts`,
    data
  );
  return response.data;
};

export const updatePost = async (
  clubId: number,
  postId: number,
  data: UpdatePostRequest
): Promise<Post> => {
  const response = await axiosInstance.put<Post>(
    `/clubs/${clubId}/posts/${postId}`,
    data
  );
  return response.data;
};

export const deletePost = async (
  clubId: number,
  postId: number
): Promise<void> => {
  await axiosInstance.delete(`/clubs/${clubId}/posts/${postId}`);
};

export const togglePostLike = async (
  clubId: number,
  postId: number
): Promise<LikeResponse> => {
  const response = await axiosInstance.post<LikeResponse>(
    `/clubs/${clubId}/posts/${postId}/like`
  );
  return response.data;
};
