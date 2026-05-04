export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';

export async function PATCH(request: NextRequest) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  const body = await request.json();
  const { publishTime } = body as { publishTime?: string };

  if (!publishTime || !/^\d{2}:\d{2}$/.test(publishTime)) {
    return NextResponse.json({ error: 'INVALID_INPUT', message: 'publishTime must be HH:MM (UTC)' }, { status: 400 });
  }

  const [h, m] = publishTime.split(':').map(Number);
  if (h! > 23 || m! > 59) {
    return NextResponse.json({ error: 'INVALID_INPUT', message: 'Invalid time value' }, { status: 400 });
  }

  await db.update(users).set({ publishTime, updatedAt: new Date() }).where(eq(users.id, userId));

  return NextResponse.json({ publishTime });
}
