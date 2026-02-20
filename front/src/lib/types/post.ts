export type PostType = "NOTICE" | "GENERAL" | "INQUIRY";

export interface AuthorInfo {
  id: number;
  name: string;
  imageUrl?: string;
}

export interface Post {
  id: number;
  postType: PostType;
  content: string;
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
  guestName?: string;
  guestEmail?: string;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CreatePostRequest {
  postType: PostType;
  content: string;
  guestName?: string;
  guestEmail?: string;
}

export interface UpdatePostRequest {
  content?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}
