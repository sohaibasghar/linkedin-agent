import { pgTable, uuid, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const postStatusEnum = pgEnum('post_status', [
  'DRAFT',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'FAILED',
]);

export const publishOutcomeEnum = pgEnum('publish_outcome', ['SUCCESS', 'FAILURE']);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  linkedinId:     text('linkedin_id').notNull().unique(),
  email:          text('email'),
  name:           text('name'),
  avatarUrl:      text('avatar_url'),
  accessToken:    text('access_token'),
  refreshToken:   text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable('posts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  topic:          text('topic').notNull(),
  content:        text('content').notNull(),
  imageUrl:       text('image_url'),
  status:         postStatusEnum('status').notNull().default('DRAFT'),
  isScheduled:    boolean('is_scheduled').notNull().default(false),
  linkedInPostId: text('linkedin_post_id'),
  errorMessage:   text('error_message'),
  scheduledFor:   timestamp('scheduled_for').notNull(),
  publishedAt:    timestamp('published_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
});

// ─── Publish Logs ─────────────────────────────────────────────────────────────

export const publishLogs = pgTable('publish_logs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  postId:      uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  outcome:     publishOutcomeEnum('outcome').notNull(),
  errorCode:   text('error_code'),
  errorDetail: text('error_detail'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRow       = typeof users.$inferSelect;
export type NewUser       = typeof users.$inferInsert;
export type PostRow       = typeof posts.$inferSelect;
export type NewPost       = typeof posts.$inferInsert;
export type PublishLogRow = typeof publishLogs.$inferSelect;
export type NewPublishLog = typeof publishLogs.$inferInsert;
