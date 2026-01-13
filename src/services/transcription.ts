import OpenAI from 'openai';
import fs from 'fs';

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  try {
    const client = getOpenAIClient();

    // Check if file exists and get its size
    const stats = fs.statSync(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    // Whisper API has a 25MB limit
    if (fileSizeMB > 25) {
      return {
        success: false,
        error: `Audio file is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 25MB. Consider splitting the audio into smaller chunks.`,
      };
    }

    const audioFile = fs.createReadStream(audioPath);

    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    });

    return {
      success: true,
      transcript: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return {
        success: false,
        error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.',
      };
    }

    if (errorMessage.includes('rate limit')) {
      return {
        success: false,
        error: 'OpenAI API rate limit exceeded. Please try again later.',
      };
    }

    return {
      success: false,
      error: `Transcription failed: ${errorMessage}`,
    };
  }
}

export async function transcribeWithTimestamps(
  audioPath: string
): Promise<TranscriptionResult & { segments?: Array<{ start: number; end: number; text: string }> }> {
  try {
    const client = getOpenAIClient();

    const stats = fs.statSync(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      return {
        success: false,
        error: `Audio file is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is 25MB.`,
      };
    }

    const audioFile = fs.createReadStream(audioPath);

    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const segments = response.segments?.map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    }));

    return {
      success: true,
      transcript: response.text,
      segments,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Transcription failed: ${errorMessage}`,
    };
  }
}
