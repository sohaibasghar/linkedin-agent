import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { generateTopic } from '@/lib/ai/topic';
import { generateContent } from '@/lib/ai/content';
import { generateImage } from '@/lib/ai/image';
import { uploadBlob } from '@/lib/storage/blob';
import type { GenerateResult } from '@/types';
import { PostStatus } from '@/types';

export class GenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationFailedError';
  }
}

export interface GenerateOptions {
  userId:     string;
  date?:      string;
  withImage?: boolean;
  subject?:   string;
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export async function generatePost(options: GenerateOptions): Promise<GenerateResult> {
  const targetDate = options.date ?? todayUTC();

  let topic:   string;
  let content: string;

  try {
    topic   = options.subject?.trim() || await generateTopic();
    content = await generateContent(topic);
  } catch (err) {
    throw new GenerationFailedError(err instanceof Error ? err.message : String(err));
  }

  let imageUrl: string | null = null;

  if (options.withImage) {
    const buffer = await generateImage(content, topic);
    imageUrl = await uploadBlob(buffer, `post-${targetDate}-${Date.now()}.png`);
  }

  const [inserted] = await db
    .insert(posts)
    .values({
      userId:      options.userId,
      topic,
      content,
      imageUrl,
      status:      'DRAFT',
      scheduledFor: targetDate,
    })
    .returning();

  return {
    postId:       inserted.id,
    topic:        inserted.topic,
    content:      inserted.content,
    imageUrl:     inserted.imageUrl,
    status:       PostStatus.DRAFT,
    isScheduled:  inserted.isScheduled,
    scheduledFor: inserted.scheduledFor,
    createdAt:    inserted.createdAt,
  };
}
