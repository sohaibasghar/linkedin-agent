import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export class LinkedInAPIError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'LinkedInAPIError';
  }
}

async function getAccessToken(): Promise<string> {
  try {
    const cookieStore = cookies();

    // 1. DB lookup via user_id cookie (primary — token always up to date)
    const userId = cookieStore.get('li_user_id')?.value;
    if (userId) {
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (user?.accessToken) return user.accessToken;
    }

    // 2. li_token cookie fallback (older sessions before DB user record)
    const cookieToken = cookieStore.get('li_token')?.value;
    if (cookieToken) return cookieToken;
  } catch {
    // cookies() unavailable outside request context — fall through
  }

  // 3. Env var (for cron / CI)
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (envToken) return envToken;

  throw new LinkedInAPIError(
    'NO_TOKEN',
    'No LinkedIn access token found. Visit /auth to connect your account.'
  );
}

export interface LinkedInPostResult {
  linkedInPostId: string;
}

async function getLinkedInPersonId(accessToken: string): Promise<string> {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': '202304',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new LinkedInAPIError('USERINFO_FAILED', `Failed to get LinkedIn user info: ${body}`);
  }

  const data = await res.json();
  return data.sub as string;
}

export async function publishTextPost(content: string): Promise<LinkedInPostResult> {
  const accessToken = await getAccessToken();
  const personId    = await getLinkedInPersonId(accessToken);

  const body = {
    author:         `urn:li:person:${personId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary:    { text: content },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method:  'POST',
    headers: {
      Authorization:               `Bearer ${accessToken}`,
      'Content-Type':              'application/json',
      'LinkedIn-Version':          '202304',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new LinkedInAPIError('POST_FAILED', `LinkedIn API error ${res.status}: ${errorBody}`);
  }

  const postId = res.headers.get('x-restli-id') ?? res.headers.get('X-RestLi-Id');
  if (!postId) {
    throw new LinkedInAPIError('NO_POST_ID', 'LinkedIn did not return a post ID');
  }

  return { linkedInPostId: postId };
}

export async function publishImagePost(
  content:  string,
  imageUrl: string
): Promise<LinkedInPostResult> {
  const accessToken = await getAccessToken();
  const personId    = await getLinkedInPersonId(accessToken);

  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method:  'POST',
    headers: {
      Authorization:      `Bearer ${accessToken}`,
      'Content-Type':     'application/json',
      'LinkedIn-Version': '202304',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes:              ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner:                `urn:li:person:${personId}`,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }),
  });

  if (!registerRes.ok) return publishTextPost(content);

  const registerData = await registerRes.json();
  const uploadUrl    = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const assetId      = registerData.value?.asset;

  if (!uploadUrl || !assetId) return publishTextPost(content);

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) return publishTextPost(content);
  const imageBuffer = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body:    imageBuffer,
  });

  if (!uploadRes.ok) return publishTextPost(content);

  const postBody = {
    author:         `urn:li:person:${personId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary:    { text: content },
        shareMediaCategory: 'IMAGE',
        media:              [{ status: 'READY', description: { text: 'Post image' }, media: assetId }],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method:  'POST',
    headers: {
      Authorization:               `Bearer ${accessToken}`,
      'Content-Type':              'application/json',
      'LinkedIn-Version':          '202304',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!postRes.ok) return publishTextPost(content);

  const postId = postRes.headers.get('x-restli-id') ?? postRes.headers.get('X-RestLi-Id');
  if (!postId) return publishTextPost(content);

  return { linkedInPostId: postId };
}
