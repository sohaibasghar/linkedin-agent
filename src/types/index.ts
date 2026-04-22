export enum PostStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export interface Post {
  id: string;
  topic: string;
  content: string;
  imageUrl: string | null;
  status: PostStatus;
  approvalMode: boolean;
  linkedInPostId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  publishedAt: Date | null;
  scheduledFor: string; // DATE as YYYY-MM-DD string
}

export interface PublishLog {
  id: string;
  postId: string;
  outcome: 'SUCCESS' | 'FAILURE';
  errorCode: string | null;
  errorDetail: string | null;
  attemptedAt: Date;
}

export interface GenerateResult {
  postId: string;
  topic: string;
  content: string;
  imageUrl: string | null;
  status: PostStatus;
  isScheduled: boolean;
  scheduledFor: string;
  createdAt: Date;
}

export interface PublishResult {
  postId: string;
  status: PostStatus;
  linkedInPostId: string | null;
  publishedAt: Date | null;
}

export interface DailyLockResult {
  acquired: boolean;
  key: string;
}
