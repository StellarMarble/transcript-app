import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface CaptionResult {
  success: boolean;
  transcript?: string;
  language?: string;
  source?: 'auto' | 'manual';
  error?: string;
}

function getYtDlpCommand(): string {
  return 'python -m yt_dlp';
}

/**
 * Attempts to fetch existing captions/subtitles from a video URL.
 * Uses yt-dlp's subtitle extraction which works for TikTok, Instagram, Facebook, etc.
 * Returns null if no captions are available, allowing fallback to Whisper.
 */
export async function fetchCaptions(url: string): Promise<CaptionResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'captions-'));
  const outputTemplate = path.join(tempDir, 'video');

  try {
    const ytdlp = getYtDlpCommand();

    // First, check if subtitles are available
    const listCmd = `${ytdlp} --list-subs --skip-download "${url}"`;

    let hasSubtitles = false;
    let hasAutoSubs = false;

    try {
      const { stdout } = await execAsync(listCmd, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });

      hasSubtitles = stdout.includes('Available subtitles') && !stdout.includes('no subtitles');
      hasAutoSubs = stdout.includes('Available automatic captions') || stdout.includes('auto-generated');

      if (!hasSubtitles && !hasAutoSubs) {
        return {
          success: false,
          error: 'No captions available for this video',
        };
      }
    } catch {
      // If listing fails, still try to download - some platforms don't list properly
    }

    // Try to download subtitles (prefer auto-generated for most platforms as they're usually available)
    // Formats to try: vtt, srt, json3, ttml
    const downloadCmd = `${ytdlp} --write-auto-subs --write-subs --sub-langs "en.*,en" --sub-format "vtt/srt/json3/best" --skip-download -o "${outputTemplate}" "${url}"`;

    try {
      await execAsync(downloadCmd, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      });
    } catch (error) {
      // yt-dlp may return error even if subs were downloaded
      console.warn('Subtitle download warning:', error);
    }

    // Look for downloaded subtitle files
    const files = await fs.readdir(tempDir);
    const subFile = files.find(
      (f) =>
        f.endsWith('.vtt') ||
        f.endsWith('.srt') ||
        f.endsWith('.json3') ||
        f.endsWith('.ttml')
    );

    if (!subFile) {
      return {
        success: false,
        error: 'No captions could be downloaded',
      };
    }

    const subPath = path.join(tempDir, subFile);
    const content = await fs.readFile(subPath, 'utf-8');

    // Parse subtitle file to plain text
    const transcript = parseSubtitleToText(content, subFile);

    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        error: 'Downloaded captions were empty',
      };
    }

    // Determine if auto or manual subs
    const isAuto = subFile.includes('.en-orig') || subFile.includes('auto') || hasAutoSubs;

    return {
      success: true,
      transcript: transcript.trim(),
      language: 'en',
      source: isAuto ? 'auto' : 'manual',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch captions: ${errorMessage}`,
    };
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Parses various subtitle formats to plain text
 */
function parseSubtitleToText(content: string, filename: string): string {
  if (filename.endsWith('.vtt')) {
    return parseVTT(content);
  } else if (filename.endsWith('.srt')) {
    return parseSRT(content);
  } else if (filename.endsWith('.json3')) {
    return parseJSON3(content);
  } else if (filename.endsWith('.ttml')) {
    return parseTTML(content);
  }
  return content;
}

function parseVTT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (
      line.startsWith('WEBVTT') ||
      line.includes('-->') ||
      line.match(/^\d{2}:\d{2}/) ||
      line.trim() === '' ||
      line.match(/^NOTE/) ||
      line.match(/^STYLE/)
    ) {
      continue;
    }
    // Remove VTT tags like <c>, </c>, etc.
    const cleanLine = line.replace(/<[^>]+>/g, '').trim();
    if (cleanLine) {
      textLines.push(cleanLine);
    }
  }

  // Remove duplicates (VTT often has overlapping captions)
  return removeDuplicateLines(textLines).join(' ');
}

function parseSRT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (const line of lines) {
    // Skip sequence numbers, timestamps, and empty lines
    if (
      line.match(/^\d+$/) ||
      line.includes('-->') ||
      line.trim() === ''
    ) {
      continue;
    }
    // Remove HTML-like tags
    const cleanLine = line.replace(/<[^>]+>/g, '').trim();
    if (cleanLine) {
      textLines.push(cleanLine);
    }
  }

  return textLines.join(' ');
}

function parseJSON3(content: string): string {
  try {
    const data = JSON.parse(content);
    const events = data.events || [];
    const textLines: string[] = [];

    for (const event of events) {
      if (event.segs) {
        const text = event.segs.map((seg: { utf8?: string }) => seg.utf8 || '').join('');
        if (text.trim()) {
          textLines.push(text.trim());
        }
      }
    }

    return textLines.join(' ');
  } catch {
    return '';
  }
}

function parseTTML(content: string): string {
  // Simple TTML parser - extract text content from <p> tags
  const matches = content.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
  const textLines = matches.map((match) =>
    match.replace(/<[^>]+>/g, '').trim()
  );
  return textLines.join(' ');
}

function removeDuplicateLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = line.toLowerCase().trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(line);
    }
  }

  return result;
}
