export default function AuthPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf9f6] font-['Inter',sans-serif]">
      <main className="w-full max-w-[480px] flex flex-col items-center">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#0077b5] rounded-xl flex items-center justify-center shadow-lg mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2v-2zm1-10c-1.66 0-3 1.34-3 3h2c0-.55.45-1 1-1s1 .45 1 1c0 1-2 .88-2 3h2c0-1.36 2-1.5 2-3 0-1.66-1.34-3-3-3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight">
            LinkedIn AI Agent
          </h1>
          <p className="text-sm text-[#404850] mt-2 text-center">
            Your professional presence, automated with intelligence.
          </p>
        </div>

        {/* Auth Card */}
        <section className="w-full bg-white border border-[#bfc7d1] rounded-xl shadow-sm p-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 mb-6 text-sm text-red-600">
              {decodeURIComponent(error)}
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#d9e4ea] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#005d8f">
                  <path d="M19 9l-7 7-7-7" stroke="#005d8f" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#005d8f" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1b1c1a]">
                  Generates daily LinkedIn posts with AI
                </h3>
                <p className="text-xs text-[#404850]">
                  Stay consistent without the creative burnout using GPT-4 models tailored to your voice.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#d9e4ea] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#005d8f">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1b1c1a]">
                  Creates quote-card images
                </h3>
                <p className="text-xs text-[#404850]">
                  Automatically transform key insights into high-engagement visual assets.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#d9e4ea] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#005d8f">
                  <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1b1c1a]">
                  Approval workflow before publishing
                </h3>
                <p className="text-xs text-[#404850]">
                  You remain in full control. Review, edit, and schedule posts through a simple dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <a
            href="/api/auth/linkedin"
            className="w-full bg-[#0077b5] text-white font-semibold text-sm py-4 px-6 rounded-lg flex items-center justify-center gap-3 shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <svg className="flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            Connect LinkedIn Account
          </a>

          {/* Footer compliance */}
          <p className="mt-6 text-center text-xs text-[#404850] opacity-60">
            Secure OAuth integration. We never share your credentials.
          </p>
        </section>

        {/* Preview bento grid */}
        <div className="grid grid-cols-2 gap-4 mt-8 w-full">
          <div className="bg-[#efeeeb] border border-[#bfc7d1] rounded-lg p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold tracking-wider text-[#005d8f] bg-[#d9e4ea] px-2 py-1 rounded w-fit mb-2">
              AI-GEN
            </span>
            <div className="space-y-2">
              <div className="h-2 w-full bg-[#bfc7d1] rounded-full opacity-30" />
              <div className="h-2 w-3/4 bg-[#bfc7d1] rounded-full opacity-30" />
            </div>
          </div>
          <div className="bg-[#efeeeb] border border-[#bfc7d1] rounded-lg p-4 flex items-center justify-center overflow-hidden relative">
            <span className="text-xs font-semibold tracking-wider text-[#1b1c1a]">
              Live Preview
            </span>
          </div>
        </div>

        {/* Footer links */}
        <footer className="mt-12 flex gap-6">
          <a href="#" className="text-xs text-[#404850] hover:text-[#005d8f] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-xs text-[#404850] hover:text-[#005d8f] transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-xs text-[#404850] hover:text-[#005d8f] transition-colors">
            Help Center
          </a>
        </footer>
      </main>
    </div>
  );
}
