import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface YouTubeTranscriptResult {
  success: boolean;
  transcript?: string;
  segments?: TranscriptSegment[];
  error?: string;
  needsWhisper?: boolean;
}

export async function getYouTubeTranscript(
  videoIdOrUrl: string
): Promise<YouTubeTranscriptResult> {
  try {
    // Extract video ID if a full URL was provided
    let videoId = videoIdOrUrl;

    if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
      try {
        const url = new URL(videoIdOrUrl);
        if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        } else {
          videoId = url.searchParams.get('v') || videoIdOrUrl;
        }
      } catch {
        // Use as-is if not a valid URL
      }
    }

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return {
        success: false,
        error: 'No captions available for this video',
        needsWhisper: true,
      };
    }

    const segments: TranscriptSegment[] = transcriptItems.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }));

    // Combine all text into a single transcript
    const transcript = segments.map((s) => s.text).join(' ');

    return {
      success: true,
      transcript,
      segments,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a "no captions" error
    if (
      errorMessage.includes('disabled') ||
      errorMessage.includes('not available') ||
      errorMessage.includes('Could not')
    ) {
      return {
        success: false,
        error: 'No captions available - will use Whisper transcription',
        needsWhisper: true,
      };
    }

    return {
      success: false,
      error: `Failed to fetch YouTube transcript: ${errorMessage}`,
      needsWhisper: true,
    };
  }
}

export function formatTranscriptWithTimestamps(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => {
      const minutes = Math.floor(segment.offset / 60000);
      const seconds = Math.floor((segment.offset % 60000) / 1000);
      const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return `[${timestamp}] ${segment.text}`;
    })
    .join('\n');
}
