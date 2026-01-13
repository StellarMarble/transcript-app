export type Platform =
  | 'youtube'
  | 'podcast'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'threads'
  | 'bluesky'
  | 'vimeo'
  | 'twitch'
  | 'reddit'
  | 'linkedin'
  | 'snapchat'
  | 'rumble'
  | 'dailymotion'
  | 'unknown';

export interface ParsedURL {
  platform: Platform;
  url: string;
  videoId?: string;
}

export function parseURL(url: string): ParsedURL {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId: string | undefined;

      if (hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || undefined;
        // Handle YouTube Shorts
        if (urlObj.pathname.includes('/shorts/')) {
          videoId = urlObj.pathname.split('/shorts/')[1]?.split('/')[0];
        }
      }

      return { platform: 'youtube', url, videoId };
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      return { platform: 'instagram', url };
    }

    // TikTok
    if (hostname.includes('tiktok.com')) {
      return { platform: 'tiktok', url };
    }

    // Facebook
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.com')) {
      return { platform: 'facebook', url };
    }

    // Twitter/X
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return { platform: 'twitter', url };
    }

    // Threads (Meta)
    if (hostname.includes('threads.net')) {
      return { platform: 'threads', url };
    }

    // Bluesky
    if (hostname.includes('bsky.app') || hostname.includes('bsky.social')) {
      return { platform: 'bluesky', url };
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      return { platform: 'vimeo', url };
    }

    // Twitch
    if (hostname.includes('twitch.tv') || hostname.includes('clips.twitch.tv')) {
      return { platform: 'twitch', url };
    }

    // Reddit (video posts)
    if (hostname.includes('reddit.com') || hostname.includes('v.redd.it')) {
      return { platform: 'reddit', url };
    }

    // LinkedIn (video posts)
    if (hostname.includes('linkedin.com')) {
      return { platform: 'linkedin', url };
    }

    // Snapchat
    if (hostname.includes('snapchat.com') || hostname.includes('story.snapchat.com')) {
      return { platform: 'snapchat', url };
    }

    // Rumble
    if (hostname.includes('rumble.com')) {
      return { platform: 'rumble', url };
    }

    // Dailymotion
    if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) {
      return { platform: 'dailymotion', url };
    }

    // Podcast RSS feeds (common patterns)
    if (
      url.endsWith('.xml') ||
      url.endsWith('.rss') ||
      url.includes('/feed') ||
      url.includes('/rss') ||
      hostname.includes('anchor.fm') ||
      hostname.includes('feeds.') ||
      hostname.includes('podcasts.apple.com') ||
      hostname.includes('open.spotify.com/show') ||
      hostname.includes('open.spotify.com/episode') ||
      hostname.includes('rss.') ||
      hostname.includes('podbean.com') ||
      hostname.includes('buzzsprout.com') ||
      hostname.includes('transistor.fm') ||
      hostname.includes('simplecast.com') ||
      hostname.includes('libsyn.com') ||
      hostname.includes('spreaker.com')
    ) {
      return { platform: 'podcast', url };
    }

    return { platform: 'unknown', url };
  } catch {
    return { platform: 'unknown', url };
  }
}

export function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: 'YouTube',
    podcast: 'Podcast',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    twitter: 'X/Twitter',
    threads: 'Threads',
    bluesky: 'Bluesky',
    vimeo: 'Vimeo',
    twitch: 'Twitch',
    reddit: 'Reddit',
    linkedin: 'LinkedIn',
    snapchat: 'Snapchat',
    rumble: 'Rumble',
    dailymotion: 'Dailymotion',
    unknown: 'Unknown',
  };
  return names[platform];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    youtube: 'bg-red-100 text-red-800',
    podcast: 'bg-purple-100 text-purple-800',
    instagram: 'bg-pink-100 text-pink-800',
    tiktok: 'bg-gray-100 text-gray-800',
    facebook: 'bg-blue-100 text-blue-800',
    twitter: 'bg-gray-100 text-gray-900',
    threads: 'bg-gray-100 text-gray-900',
    bluesky: 'bg-sky-100 text-sky-800',
    vimeo: 'bg-cyan-100 text-cyan-800',
    twitch: 'bg-purple-100 text-purple-800',
    reddit: 'bg-orange-100 text-orange-800',
    linkedin: 'bg-blue-100 text-blue-800',
    snapchat: 'bg-yellow-100 text-yellow-800',
    rumble: 'bg-green-100 text-green-800',
    dailymotion: 'bg-blue-100 text-blue-800',
    unknown: 'bg-gray-100 text-gray-800',
  };
  return colors[platform];
}

// Platforms that support caption/transcript fetching before falling back to Whisper
export function platformSupportsCaptions(platform: Platform): boolean {
  return ['youtube', 'tiktok', 'instagram', 'facebook', 'vimeo'].includes(platform);
}

// Platforms supported by yt-dlp for audio download
export function platformSupportsDownload(platform: Platform): boolean {
  const supported: Platform[] = [
    'youtube',
    'tiktok',
    'instagram',
    'facebook',
    'twitter',
    'vimeo',
    'twitch',
    'reddit',
    'dailymotion',
    'rumble',
    'snapchat',
    'threads',
    'bluesky',
  ];
  return supported.includes(platform);
}
