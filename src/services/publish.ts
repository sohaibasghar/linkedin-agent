import { db } from '@/lib/db/client';
import { posts, publishLogs } from '@/lib/db/schema';
import { publishTextPost, publishImagePost, LinkedInAPIError } from '@/lib/linkedin/api';
import { eq } from 'drizzle-orm';
import type { PublishResult } from '@/types';
import { PostStatus } from '@/types';

export class PostNotFoundError extends Error {
  constructor(postId: string) {
    super(`No post found with id: ${postId}`);
    this.name = 'PostNotFoundError';
  }
}

export class InvalidPostStatusError extends Error {
  constructor(
    postId: string,
    public readonly currentStatus: string
  ) {
    super(`Post ${postId} is in status ${currentStatus}; publish only allowed on DRAFT or APPROVED`);
    this.name = 'InvalidPostStatusError';
  }
}

export class PublishFailedError extends Error {
  constructor(
    public readonly postId: string,
    message: string
  ) {
    super(message);
    this.name = 'PublishFailedError';
  }
}

export async function publishPost(postId: string): Promise<PublishResult> {
  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });

  if (!post) throw new PostNotFoundError(postId);

  if (post.status !== 'DRAFT' && post.status !== 'APPROVED') {
    throw new InvalidPostStatusError(postId, post.status);
  }

  let linkedInPostId: string | null = null;
  let errorMessage:   string | null = null;
  let success = false;

  try {
    const result = post.imageUrl
      ? await publishImagePost(post.content, post.imageUrl)
      : await publishTextPost(post.content);

    linkedInPostId = result.linkedInPostId;
    success = true;
  } catch (apiError) {
    const isNoToken = apiError instanceof LinkedInAPIError && apiError.code === 'NO_TOKEN';

    if (!isNoToken) {
      try {
        const { publishViaAutomation } = await import('../lib/linkedin/automation');
        const fallbackResult = await publishViaAutomation(post.content);
        linkedInPostId = fallbackResult.linkedInPostId;
        success = true;
      } catch (automationError) {
        errorMessage = `API: ${apiError instanceof Error ? apiError.message : String(apiError)}; Automation: ${automationError instanceof Error ? automationError.message : String(automationError)}`;
      }
    } else {
      errorMessage = (apiError as Error).message;
    }
  }

  const now = new Date();

  if (success && linkedInPostId) {
    await db
      .update(posts)
      .set({ status: 'PUBLISHED', linkedInPostId, publishedAt: now, errorMessage: null, updatedAt: now })
      .where(eq(posts.id, postId));

    await db.insert(publishLogs).values({
      postId,
      userId:  post.userId,
      outcome: 'SUCCESS',
    });

    return { postId, status: PostStatus.PUBLISHED, linkedInPostId, publishedAt: now };
  } else {
    await db
      .update(posts)
      .set({ status: 'FAILED', errorMessage, updatedAt: now })
      .where(eq(posts.id, postId));

    await db.insert(publishLogs).values({
      postId,
      userId:      post.userId,
      outcome:     'FAILURE',
      errorDetail: errorMessage,
    });

    throw new PublishFailedError(postId, errorMessage ?? 'Unknown publish error');
  }
}
