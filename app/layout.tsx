import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'LinkedIn AI Content Agent',
  description: 'Automated LinkedIn post generation and publishing',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
