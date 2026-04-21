import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTopic(): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a LinkedIn content strategist. Generate a single, specific, relevant topic for a professional LinkedIn post today. The topic should be timely, practical, and resonate with a professional audience. Respond with only the topic — no explanation, no punctuation at the end.',
      },
      {
        role: 'user',
        content: 'Generate a topic for today\'s LinkedIn post.',
      },
    ],
    max_tokens: 100,
    temperature: 0.8,
  });

  const topic = response.choices[0]?.message?.content?.trim();
  if (!topic) {
    throw new Error('OpenAI returned empty topic');
  }
  return topic;
}
