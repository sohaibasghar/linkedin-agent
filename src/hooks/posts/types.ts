export type PostStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'FAILED' | 'REJECTED';

export interface Post {
  postId: string;
  topic: string;
  content: string;
  imageUrl: string | null;
  status: PostStatus;
  isScheduled: boolean;
  scheduledFor: string;
  createdAt: string;
  publishedAt: string | null;
  linkedInPostId: string | null;
  errorMessage: string | null;
}

export interface GeneratedDraft {
  postId: string;
  topic: string;
  content: string;
  imageUrl: string | null;
  scheduledFor: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
}
