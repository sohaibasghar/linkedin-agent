import { NextRequest } from 'next/server';

export function getCurrentUserId(request: NextRequest): string | null {
  return request.cookies.get('li_user_id')?.value ?? null;
}

export function requireUserId(request: NextRequest): string {
  const id = getCurrentUserId(request);
  if (!id) throw new Error('UNAUTHENTICATED');
  return id;
}
