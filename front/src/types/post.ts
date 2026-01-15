export const PostType = {
  NOTICE: 'NOTICE',
  GENERAL: 'GENERAL',
  INQUIRY: 'INQUIRY'
} as const;

export type PostType = (typeof PostType)[keyof typeof PostType];

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
  // For INQUIRY posts from non-members
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

// Spring Data Page 응답 타입
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}
