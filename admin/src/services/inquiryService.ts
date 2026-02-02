import api from "./api";

export interface AuthorInfo {
  id: number;
  name: string;
  imageUrl?: string;
}

export interface InquiryResponse {
  id: number;
  postType: string;
  content: string;
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CommentResponse {
  id: number;
  content: string;
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * 전체 문의글 목록 조회
 */
export async function getAllInquiries(): Promise<InquiryResponse[]> {
  const { data } = await api.get<InquiryResponse[]>("/admin/inquiries");
  return data;
}

/**
 * 문의글 상세 조회
 */
export async function getInquiry(postId: number): Promise<InquiryResponse> {
  const { data } = await api.get<InquiryResponse>(`/admin/inquiries/${postId}`);
  return data;
}

/**
 * 문의글 댓글 목록 조회
 */
export async function getInquiryComments(postId: number): Promise<CommentResponse[]> {
  const { data } = await api.get<CommentResponse[]>(`/admin/inquiries/${postId}/comments`);
  return data;
}

/**
 * 문의글에 답변 작성
 */
export async function addComment(postId: number, content: string): Promise<CommentResponse> {
  const { data } = await api.post<CommentResponse>(`/admin/inquiries/${postId}/comments`, { content });
  return data;
}
