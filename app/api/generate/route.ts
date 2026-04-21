import { NextRequest, NextResponse } from 'next/server';
import { generatePost, DuplicateDateError, GenerationFailedError } from '@/services/generate';

export async function POST(request: NextRequest) {
  let date: string | undefined;

  try {
    const body = await request.json().catch(() => ({}));
    date = body.date;
  } catch {
    // body is optional
  }

  try {
    const result = await generatePost(date);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateDateError) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_DATE',
          message: err.message,
          existingPostId: err.existingPostId,
        },
        { status: 409 }
      );
    }

    if (err instanceof GenerationFailedError) {
      return NextResponse.json(
        {
          error: 'GENERATION_FAILED',
          message: err.message,
        },
        { status: 422 }
      );
    }

    console.error('Unexpected error in /api/generate:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
