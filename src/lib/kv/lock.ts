import type { DailyLockResult } from '@/types';

const TTL_SECONDS = 25 * 60 * 60; // 25 hours

function lockKey(date: string): string {
  return `lock:${date}`;
}

function hasKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function acquireLock(date: string): Promise<DailyLockResult> {
  const key = lockKey(date);
  if (!hasKV()) {
    // No KV — always allow (no deduplication)
    return { acquired: true, key };
  }
  const kv = await getKV();
  const result = await kv.set(key, 'acquired', { nx: true, ex: TTL_SECONDS });
  return { acquired: result === 'OK', key };
}

export async function checkLock(date: string): Promise<boolean> {
  if (!hasKV()) return false;
  const kv = await getKV();
  const key = lockKey(date);
  const value = await kv.exists(key);
  return value === 1;
}

export async function releaseLock(date: string): Promise<void> {
  if (!hasKV()) return;
  const kv = await getKV();
  const key = lockKey(date);
  await kv.del(key);
}
