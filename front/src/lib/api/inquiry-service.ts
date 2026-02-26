import axiosInstance from "@/services/api/axiosInstance";
import type { Post, Comment } from "@/lib/types/post";

export const getMyInquiries = async (): Promise<Post[]> => {
  const response = await axiosInstance.get<Post[]>("/inquiries");
  return response.data;
};

export const createInquiry = async (content: string): Promise<Post> => {
  const response = await axiosInstance.post<Post>("/inquiries", { content });
  return response.data;
};

export const getInquiry = async (postId: number): Promise<Post> => {
  const response = await axiosInstance.get<Post>(`/inquiries/${postId}`);
  return response.data;
};

export const getInquiryComments = async (
  postId: number
): Promise<Comment[]> => {
  const response = await axiosInstance.get<Comment[]>(
    `/inquiries/${postId}/comments`
  );
  return response.data;
};

export const addInquiryComment = async (
  postId: number,
  content: string
): Promise<Comment> => {
  const response = await axiosInstance.post<Comment>(
    `/inquiries/${postId}/comments`,
    { content }
  );
  return response.data;
};
