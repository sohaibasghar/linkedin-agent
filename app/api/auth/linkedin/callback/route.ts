export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';


const COOKIE_MAX_AGE = 60 * 24 * 60 * 60; // 60 days

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error)}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=no_code', request.url));
  }

  const clientId     = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const redirectUri  = `${baseUrl}/api/auth/linkedin/callback`;

  // Exchange code for token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(`token_exchange_failed: ${body}`)}`, request.url)
    );
  }

  const { access_token, expires_in, refresh_token } = await tokenRes.json();

  // Fetch LinkedIn profile
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'LinkedIn-Version': '202304',
    },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL('/auth?error=profile_fetch_failed', request.url));
  }

  const profile = await profileRes.json();
  const linkedinId = profile.sub as string;
  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 5184000) * 1000);

  // Atomic upsert — avoids race condition between concurrent OAuth callbacks
  const [upserted] = await db
    .insert(users)
    .values({
      linkedinId,
      email:          profile.email   ?? null,
      name:           profile.name    ?? null,
      avatarUrl:      profile.picture ?? null,
      accessToken:    access_token,
      refreshToken:   refresh_token   ?? null,
      tokenExpiresAt,
    })
    .onConflictDoUpdate({
      target: users.linkedinId,
      set: {
        email:          profile.email   ?? null,
        name:           profile.name    ?? null,
        avatarUrl:      profile.picture ?? null,
        accessToken:    access_token,
        refreshToken:   refresh_token   ?? null,
        tokenExpiresAt,
        updatedAt:      new Date(),
      },
    })
    .returning({ id: users.id });

  const userId = upserted.id;

  const response = NextResponse.redirect(new URL('/?connected=1', request.url));

  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  };

  response.cookies.set('li_authed',  '1',      cookieOpts);
  response.cookies.set('li_user_id', userId,   cookieOpts);
  // Keep li_token for backward-compat fallback in getAccessToken
  response.cookies.set('li_token',   access_token, { ...cookieOpts, maxAge: expires_in ?? COOKIE_MAX_AGE });

  return response;
}
