import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_CHARS = 3000;

const SYSTEM_PROMPT = `You are a professional LinkedIn ghostwriter. Write engaging LinkedIn posts that:
- Start with a powerful hook (1-2 sentences that stop the scroll)
- Include 3 body paragraphs with actionable insights or a compelling story
- End with a strong CTA (call to action)
- Use short sentences and line breaks for readability
- Stay under ${MAX_CHARS} characters total
- Sound authentic and human, not corporate

Respond with only the post content — no meta-commentary.`;

async function callOpenAI(topic: string, truncate: boolean): Promise<string> {
  const userMessage = truncate
    ? `Write a LinkedIn post about: "${topic}". CRITICAL: The total response MUST be under ${MAX_CHARS} characters. Be concise.`
    : `Write a LinkedIn post about: "${topic}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }
  return content;
}

export async function generateContent(topic: string): Promise<string> {
  let content = await callOpenAI(topic, false);

  if (content.length > MAX_CHARS) {
    content = await callOpenAI(topic, true);
  }

  if (content.length > MAX_CHARS) {
    throw new Error(
      `Generated content exceeds ${MAX_CHARS} characters after retry (got ${content.length})`
    );
  }

  return content;
}
