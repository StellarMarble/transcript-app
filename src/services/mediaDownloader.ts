import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Sanitize URL to prevent command injection
function sanitizeUrl(url: string): string {
  // Remove any shell metacharacters that could escape quotes
  return url.replace(/[`$\\!"';&|<>(){}[\]]/g, '');
}

export interface DownloadResult {
  success: boolean;
  audioPath?: string;
  title?: string;
  duration?: number;
  error?: string;
}

export interface MediaInfo {
  title: string;
  duration: number;
  description?: string;
}

async function checkYtDlp(): Promise<boolean> {
  try {
    // Try python module first (more reliable cross-platform)
    await execAsync('python -m yt_dlp --version');
    return true;
  } catch {
    try {
      // Fall back to direct command
      await execAsync('yt-dlp --version');
      return true;
    } catch {
      return false;
    }
  }
}

function getYtDlpCommand(): string {
  // Use python module for better cross-platform compatibility
  return 'python -m yt_dlp';
}

async function checkFfmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

export async function getMediaInfo(url: string): Promise<MediaInfo | null> {
  const hasYtDlp = await checkYtDlp();
  if (!hasYtDlp) {
    throw new Error('yt-dlp is not installed. Please install it to download media.');
  }

  try {
    const ytdlp = getYtDlpCommand();
    const safeUrl = sanitizeUrl(url);
    const { stdout } = await execAsync(
      `${ytdlp} --dump-json --no-download "${safeUrl}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    const info = JSON.parse(stdout);
    return {
      title: info.title || 'Unknown',
      duration: info.duration || 0,
      description: info.description,
    };
  } catch (error) {
    console.error('Failed to get media info:', error);
    return null;
  }
}

export async function downloadAudio(url: string): Promise<DownloadResult> {
  const hasYtDlp = await checkYtDlp();
  if (!hasYtDlp) {
    return {
      success: false,
      error: 'yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation',
    };
  }

  const hasFfmpeg = await checkFfmpeg();

  // Create a unique temp directory for this download
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'transcript-'));
  const outputTemplate = path.join(tempDir, '%(id)s.%(ext)s');

  try {
    // Get media info first
    const info = await getMediaInfo(url);

    const ytdlp = getYtDlpCommand();
    const safeUrl = sanitizeUrl(url);
    let downloadCmd: string;

    if (hasFfmpeg) {
      // If ffmpeg is available, convert to mp3
      downloadCmd = `${ytdlp} -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${safeUrl}"`;
    } else {
      // Without ffmpeg, download best audio in native format (m4a/webm/etc)
      // OpenAI Whisper accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm
      downloadCmd = `${ytdlp} -f "bestaudio[ext=m4a]/bestaudio" -o "${outputTemplate}" "${safeUrl}"`;
    }

    const { stderr } = await execAsync(downloadCmd, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 300000, // 5 minute timeout
    });

    // Log any warnings but don't fail
    if (stderr) {
      console.warn('yt-dlp warnings:', stderr);
    }

    // Find the downloaded file (could be mp3, m4a, webm, etc.)
    const files = await fs.readdir(tempDir);
    const audioFile = files.find((f) =>
      ['.mp3', '.m4a', '.webm', '.wav', '.mp4', '.mpeg', '.mpga'].some((ext) =>
        f.endsWith(ext)
      )
    );

    if (!audioFile) {
      return {
        success: false,
        error: 'Failed to download audio - no audio file created',
      };
    }

    const audioPath = path.join(tempDir, audioFile);

    return {
      success: true,
      audioPath,
      title: info?.title,
      duration: info?.duration,
    };
  } catch (error) {
    // Clean up temp directory on error
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to download audio: ${errorMessage}`,
    };
  }
}

export async function cleanupAudioFile(audioPath: string): Promise<void> {
  try {
    // Delete the file
    await fs.unlink(audioPath);

    // Try to remove the parent temp directory if empty
    const dir = path.dirname(audioPath);
    if (dir.includes('transcript-')) {
      const files = await fs.readdir(dir);
      if (files.length === 0) {
        await fs.rmdir(dir);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
