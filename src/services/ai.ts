import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  topics: string[];
}

export interface AIContentResult {
  blogPost: string;
  twitterThread: string[];
  linkedInPost: string;
  showNotes: string;
}

export async function generateSummary(transcript: string): Promise<AISummaryResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that summarizes transcripts.
Return a JSON object with:
- "summary": A concise 2-3 paragraph summary
- "keyPoints": An array of 5-7 key takeaways as bullet points
- "topics": An array of main topics/themes discussed`
      },
      {
        role: 'user',
        content: `Summarize this transcript:\n\n${transcript.slice(0, 15000)}`
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  return JSON.parse(content);
}

export async function generateContent(transcript: string, title?: string): Promise<AIContentResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `You are a content repurposing expert. Given a transcript, create multiple content pieces.
Return a JSON object with:
- "blogPost": A well-formatted blog post (500-800 words) with headers and paragraphs
- "twitterThread": An array of 5-7 tweets (each under 280 chars) as a thread
- "linkedInPost": A professional LinkedIn post (200-300 words)
- "showNotes": Bullet-point show notes with timestamps if available`
      },
      {
        role: 'user',
        content: `Title: ${title || 'Untitled'}\n\nTranscript:\n${transcript.slice(0, 15000)}`
      }
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  return JSON.parse(content);
}

export async function generateCustomContent(
  transcript: string,
  prompt: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that transforms transcripts based on user instructions.'
      },
      {
        role: 'user',
        content: `Transcript:\n${transcript.slice(0, 15000)}\n\nUser request: ${prompt}`
      }
    ],
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}
