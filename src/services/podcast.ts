import Parser from 'rss-parser';

export interface PodcastEpisode {
  title: string;
  description?: string;
  audioUrl: string;
  pubDate?: string;
  duration?: string;
}

export interface PodcastFeed {
  title: string;
  description?: string;
  episodes: PodcastEpisode[];
}

const parser = new Parser({
  customFields: {
    item: [
      ['enclosure', 'enclosure'],
      ['itunes:duration', 'duration'],
    ],
  },
});

export async function parsePodcastFeed(feedUrl: string): Promise<PodcastFeed> {
  try {
    const feed = await parser.parseURL(feedUrl);

    const episodes: PodcastEpisode[] = feed.items
      .filter((item) => item.enclosure?.url)
      .map((item) => ({
        title: item.title || 'Untitled Episode',
        description: item.contentSnippet || item.content,
        audioUrl: item.enclosure!.url,
        pubDate: item.pubDate,
        duration: (item as unknown as { duration?: string }).duration,
      }));

    return {
      title: feed.title || 'Unknown Podcast',
      description: feed.description,
      episodes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse podcast feed: ${errorMessage}`);
  }
}

export async function getPodcastEpisodeAudioUrl(
  feedUrl: string,
  episodeIndex: number = 0
): Promise<PodcastEpisode | null> {
  try {
    const feed = await parsePodcastFeed(feedUrl);

    if (episodeIndex < 0 || episodeIndex >= feed.episodes.length) {
      return null;
    }

    return feed.episodes[episodeIndex];
  } catch {
    return null;
  }
}

export function isValidPodcastUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Check for common podcast feed patterns
    if (
      pathname.endsWith('.xml') ||
      pathname.endsWith('.rss') ||
      pathname.includes('/feed') ||
      pathname.includes('/rss') ||
      hostname.includes('feeds.') ||
      hostname.includes('rss.')
    ) {
      return true;
    }

    // Check for podcast hosting platforms
    const podcastHosts = [
      'anchor.fm',
      'feeds.buzzsprout.com',
      'feeds.simplecast.com',
      'feeds.megaphone.fm',
      'feeds.transistor.fm',
      'feeds.captivate.fm',
      'feeds.spreaker.com',
      'feeds.podbean.com',
      'omnycontent.com',
    ];

    return podcastHosts.some((host) => hostname.includes(host));
  } catch {
    return false;
  }
}
