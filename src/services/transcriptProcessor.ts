import { parseURL, Platform, platformSupportsDownload } from './urlParser';
import { getYouTubeTranscript } from './youtube';
import { downloadAudio, cleanupAudioFile, getMediaInfo } from './mediaDownloader';
import { transcribeAudio } from './transcription';
import { parsePodcastFeed, PodcastEpisode } from './podcast';
import { fetchCaptions } from './captions';

export interface ProcessingResult {
  success: boolean;
  transcript?: string;
  title?: string;
  duration?: number;
  platform: Platform;
  method?: 'captions' | 'whisper';
  error?: string;
}

export interface ProcessingStatus {
  status: 'pending' | 'downloading' | 'transcribing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

export async function processURL(
  url: string,
  onProgress?: (status: ProcessingStatus) => void
): Promise<ProcessingResult> {
  const parsed = parseURL(url);

  if (parsed.platform === 'unknown') {
    return {
      success: false,
      platform: 'unknown',
      error: 'Unsupported URL. Please provide a supported platform URL (YouTube, TikTok, Instagram, X/Twitter, Threads, Bluesky, etc.)',
    };
  }

  // Check if platform is supported for download
  if (!platformSupportsDownload(parsed.platform) && parsed.platform !== 'podcast') {
    return {
      success: false,
      platform: parsed.platform,
      error: `${parsed.platform} is recognized but not yet fully supported for transcription`,
    };
  }

  onProgress?.({ status: 'pending', message: `Processing ${parsed.platform} URL...` });

  try {
    switch (parsed.platform) {
      case 'youtube':
        return await processYouTube(url, onProgress);

      case 'podcast':
        return await processPodcast(url, onProgress);

      case 'tiktok':
      case 'instagram':
      case 'facebook':
        // These platforms often have auto-captions - try to fetch them first
        return await processWithCaptionFallback(url, parsed.platform, onProgress);

      case 'twitter':
      case 'threads':
      case 'bluesky':
      case 'vimeo':
      case 'twitch':
      case 'reddit':
      case 'linkedin':
      case 'snapchat':
      case 'rumble':
      case 'dailymotion':
        // These platforms - try captions first, then fall back to Whisper
        return await processWithCaptionFallback(url, parsed.platform, onProgress);

      default:
        return {
          success: false,
          platform: parsed.platform,
          error: 'Platform not yet supported',
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      platform: parsed.platform,
      error: errorMessage,
    };
  }
}

async function processYouTube(
  url: string,
  onProgress?: (status: ProcessingStatus) => void
): Promise<ProcessingResult> {
  onProgress?.({ status: 'pending', message: 'Checking for existing captions...' });

  // First try to get existing captions via YouTube-specific method
  const captionsResult = await getYouTubeTranscript(url);

  if (captionsResult.success && captionsResult.transcript) {
    return {
      success: true,
      transcript: captionsResult.transcript,
      platform: 'youtube',
      method: 'captions',
    };
  }

  // No captions available, fall back to Whisper
  onProgress?.({ status: 'downloading', message: 'No captions found. Downloading audio...' });

  return await downloadAndTranscribe(url, 'youtube', onProgress);
}

async function processPodcast(
  url: string,
  onProgress?: (status: ProcessingStatus) => void
): Promise<ProcessingResult> {
  onProgress?.({ status: 'pending', message: 'Parsing podcast feed...' });

  try {
    // Try to parse as RSS feed first
    const feed = await parsePodcastFeed(url);

    if (feed.episodes.length === 0) {
      return {
        success: false,
        platform: 'podcast',
        error: 'No episodes found in podcast feed',
      };
    }

    // Get the most recent episode
    const episode: PodcastEpisode = feed.episodes[0];

    onProgress?.({
      status: 'downloading',
      message: `Downloading: ${episode.title}...`,
    });

    return await downloadAndTranscribe(episode.audioUrl, 'podcast', onProgress, episode.title);
  } catch {
    // If RSS parsing fails, try direct audio download
    return await downloadAndTranscribe(url, 'podcast', onProgress);
  }
}

/**
 * Process platforms that may have auto-captions available.
 * Tries to fetch captions first (free), falls back to Whisper (paid).
 */
async function processWithCaptionFallback(
  url: string,
  platform: Platform,
  onProgress?: (status: ProcessingStatus) => void
): Promise<ProcessingResult> {
  onProgress?.({ status: 'pending', message: `Checking for captions on ${platform}...` });

  // Try to fetch existing captions first (free)
  const captionResult = await fetchCaptions(url);

  if (captionResult.success && captionResult.transcript) {
    // Get title/metadata
    let title: string | undefined;
    let duration: number | undefined;

    try {
      const info = await getMediaInfo(url);
      title = info?.title;
      duration = info?.duration;
    } catch {
      // Ignore metadata errors
    }

    return {
      success: true,
      transcript: captionResult.transcript,
      title,
      duration,
      platform,
      method: 'captions',
    };
  }

  // No captions available - fall back to Whisper
  onProgress?.({
    status: 'downloading',
    message: `No captions found on ${platform}. Downloading audio for transcription...`,
  });

  return await downloadAndTranscribe(url, platform, onProgress);
}

async function downloadAndTranscribe(
  url: string,
  platform: Platform,
  onProgress?: (status: ProcessingStatus) => void,
  title?: string
): Promise<ProcessingResult> {
  // Get media info if not provided
  if (!title) {
    try {
      const info = await getMediaInfo(url);
      title = info?.title;
    } catch {
      // Ignore info errors
    }
  }

  // Download audio
  const downloadResult = await downloadAudio(url);

  if (!downloadResult.success || !downloadResult.audioPath) {
    return {
      success: false,
      platform,
      error: downloadResult.error || 'Failed to download audio',
    };
  }

  const audioPath = downloadResult.audioPath;

  try {
    onProgress?.({ status: 'transcribing', message: 'Transcribing audio with Whisper...' });

    // Transcribe with Whisper
    const transcriptionResult = await transcribeAudio(audioPath);

    if (!transcriptionResult.success || !transcriptionResult.transcript) {
      return {
        success: false,
        platform,
        title: title || downloadResult.title,
        duration: downloadResult.duration,
        error: transcriptionResult.error || 'Transcription failed',
      };
    }

    return {
      success: true,
      transcript: transcriptionResult.transcript,
      title: title || downloadResult.title,
      duration: downloadResult.duration,
      platform,
      method: 'whisper',
    };
  } finally {
    // Clean up audio file
    await cleanupAudioFile(audioPath);
  }
}
