export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(
    new URL('/auth', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  );
  response.cookies.delete('li_authed');
  response.cookies.delete('li_user_id');
  response.cookies.delete('li_token');
  return response;
}
