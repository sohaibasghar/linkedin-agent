import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=no_code', request.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(`token_exchange_failed: ${body}`)}`, request.url)
    );
  }

  const tokenData = await tokenRes.json();
  const { access_token, expires_in, refresh_token } = tokenData;

  // Store in KV if available
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      await kv.set('linkedin:access_token', access_token, { ex: expires_in ?? 5184000 });
      if (refresh_token) {
        await kv.set('linkedin:refresh_token', refresh_token, { ex: 365 * 24 * 60 * 60 });
      }
    }
  } catch {
    // KV unavailable — token won't be persisted in KV
  }

  const expiresAt = new Date(Date.now() + (expires_in ?? 5184000) * 1000).toISOString();

  return NextResponse.redirect(
    new URL(`/auth?success=1&expires_at=${encodeURIComponent(expiresAt)}`, request.url)
  );
}
