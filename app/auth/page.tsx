export default function AuthPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', backgroundColor: '#fff',
        border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>LinkedIn AI Agent</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Connect your LinkedIn account to get started
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#dc2626',
          }}>
            {decodeURIComponent(error)}
          </div>
        )}

        {/* What it does */}
        <ul style={{ fontSize: '0.875rem', color: '#374151', paddingLeft: '1.25rem', marginBottom: '2rem', lineHeight: '1.8' }}>
          <li>Generates daily LinkedIn posts with AI</li>
          <li>Creates quote-card images with DALL·E</li>
          <li>Posts instantly or schedules for later</li>
          <li>Approval workflow before publishing</li>
        </ul>

        {/* Connect button */}
        <a
          href="/api/auth/linkedin"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
            backgroundColor: '#0a66c2', color: '#fff', padding: '12px 24px',
            borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
            width: '100%', boxSizing: 'border-box',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          Connect LinkedIn Account
        </a>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Permissions: <code>openid profile w_member_social</code>
        </p>
      </div>
    </div>
  );
}
