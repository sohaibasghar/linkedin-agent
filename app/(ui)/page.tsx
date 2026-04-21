import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function approvePost(formData: FormData) {
  'use server';
  const postId = formData.get('postId') as string;
  const action = formData.get('action') as string;

  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, action }),
  });

  revalidatePath('/');
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: '#6b7280',
    APPROVED: '#2563eb',
    PUBLISHED: '#16a34a',
    FAILED: '#dc2626',
    REJECTED: '#9ca3af',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: colors[status] ?? '#6b7280',
        color: '#fff',
      }}
    >
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.scheduledFor));

  const drafts = allPosts.filter((p) => p.status === 'DRAFT');
  const history = allPosts.filter((p) => p.status !== 'DRAFT');

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Operator Dashboard
      </h1>

      {/* Draft Approval Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Pending Drafts ({drafts.length})
        </h2>

        {drafts.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No pending drafts.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {drafts.map((post) => (
              <div
                key={post.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  backgroundColor: '#f9fafb',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{post.topic}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                      Scheduled: {post.scheduledFor} · Created:{' '}
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={post.status} />
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '120px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    borderLeft: '3px solid #e5e7eb',
                    paddingLeft: '0.75rem',
                  }}
                >
                  {post.content.slice(0, 300)}
                  {post.content.length > 300 ? '…' : ''}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <form action={approvePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="action" value="approve" />
                    <button
                      type="submit"
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </button>
                  </form>
                  <form action={approvePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="action" value="reject" />
                    <button
                      type="submit"
                      style={{
                        padding: '6px 16px',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Post History Section */}
      <section>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Post History ({history.length})
        </h2>

        {history.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No post history yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>Topic</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  Scheduled For
                </th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  Published At
                </th>
                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {history.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.topic}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <StatusBadge status={post.status} />
                  </td>
                  <td style={{ padding: '8px 12px' }}>{post.scheduledFor}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : '—'}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      color: '#dc2626',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.errorMessage ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
