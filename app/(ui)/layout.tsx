export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <nav style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a66c2', textDecoration: 'none' }}>
          LinkedIn AI Agent
        </a>
        <a href="/auth" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
          LinkedIn Account
        </a>
      </nav>
      {children}
    </div>
  );
}
