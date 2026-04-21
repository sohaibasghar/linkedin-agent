import { kv } from '@vercel/kv';

async function getTokenStatus(): Promise<{ connected: boolean; expiresAt?: string }> {
  try {
    const token = await kv.get<string>('linkedin:access_token');
    if (!token) return { connected: false };
    const ttl = await kv.ttl('linkedin:access_token');
    const expiresAt =
      ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : undefined;
    return { connected: true, expiresAt };
  } catch {
    return { connected: false };
  }
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string; expires_at?: string };
}) {
  const { connected, expiresAt } = await getTokenStatus();
  const justConnected = searchParams.success === '1';
  const error = searchParams.error;

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '480px',
        margin: '80px auto',
        padding: '2rem',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        LinkedIn Account
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Connect your personal LinkedIn account to allow the agent to post on your behalf.
      </p>

      {/* Status */}
      {justConnected && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#15803d',
          }}
        >
          Connected! Token stored and active.
          {(searchParams.expires_at || expiresAt) && (
            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#166534' }}>
              Expires:{' '}
              {new Date(searchParams.expires_at ?? expiresAt!).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      )}

      {!justConnected && connected && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#15803d',
          }}
        >
          Account connected.
          {expiresAt && (
            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#166534' }}>
              Token expires:{' '}
              {new Date(expiresAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      )}

      {!connected && !justConnected && (
        <div
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#854d0e',
          }}
        >
          Not connected. Click the button below to authorise access.
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#dc2626',
          }}
        >
          Error: {decodeURIComponent(error)}
        </div>
      )}

      {/* Connect / Reconnect button */}
      <a
        href="/api/auth/linkedin"
        style={{
          display: 'inline-block',
          backgroundColor: '#0a66c2',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}
      >
        {connected ? 'Reconnect LinkedIn' : 'Connect LinkedIn Account'}
      </a>

      <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
        Permissions requested: <code>openid profile w_member_social</code>
        <br />
        Posts will appear on your personal LinkedIn profile.
      </p>

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
        <a href="/" style={{ fontSize: '0.875rem', color: '#0a66c2', textDecoration: 'none' }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
