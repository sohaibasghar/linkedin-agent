import { put } from '@vercel/blob';

export async function uploadBlob(buffer: Buffer, filename: string): Promise<string> {
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png',
  });
  return blob.url;
}
