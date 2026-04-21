import { pgTable, uuid, text, boolean, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';

export const postStatusEnum = pgEnum('post_status', [
  'DRAFT',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'FAILED',
]);

export const publishOutcomeEnum = pgEnum('publish_outcome', ['SUCCESS', 'FAILURE']);

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  status: postStatusEnum('status').notNull().default('DRAFT'),
  approvalMode: boolean('approval_mode').notNull().default(false),
  linkedInPostId: text('linkedin_post_id'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
  scheduledFor: date('scheduled_for').notNull().unique(),
});

export const publishLogs = pgTable('publish_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id),
  outcome: publishOutcomeEnum('outcome').notNull(),
  errorCode: text('error_code'),
  errorDetail: text('error_detail'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});

export type PostRow = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PublishLogRow = typeof publishLogs.$inferSelect;
export type NewPublishLog = typeof publishLogs.$inferInsert;
