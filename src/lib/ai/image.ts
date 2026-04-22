import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractHook(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim());
  const hook = lines[0] ?? content.slice(0, 150);
  return hook.slice(0, 150);
}

export async function generateImage(content: string, topic?: string): Promise<Buffer> {
  const hook = extractHook(content);
  const subject = topic ?? hook;

  const prompt = `A clean, modern LinkedIn quote-card image. Smooth gradient background (deep blue to purple or teal). Large elegant white text in the center reads: "${hook}". The theme is: ${subject}. Minimal design, professional aesthetic, no other elements, no logos. 1:1 aspect ratio.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('DALL-E 3 returned no image URL');
  }

  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to download generated image: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
