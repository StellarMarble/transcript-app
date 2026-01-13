'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseURL } from '@/services/urlParser';
import PlatformBadge from '@/components/PlatformBadge';

interface URLFormProps {
  onSuccess?: (transcriptId: string) => void;
}

export default function URLForm({ onSuccess }: URLFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const parsed = url ? parseURL(url) : null;
  const isValidPlatform = parsed && parsed.platform !== 'unknown';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidPlatform) {
      setError('Unsupported URL. Please enter a supported platform URL.');
      return;
    }

    setLoading(true);
    setStatus('Processing your request...');

    try {
      const res = await fetch('/api/transcript/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to process URL');
        return;
      }

      if (data.success) {
        setUrl('');
        if (onSuccess) {
          onSuccess(data.transcript.id);
        } else {
          router.push(`/transcript/${data.transcript.id}`);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any video URL (YouTube, TikTok, X, Threads, etc.)..."
            style={{ paddingRight: isValidPlatform ? '140px' : undefined }}
            className="input-field"
            disabled={loading}
          />
          {isValidPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PlatformBadge platform={parsed.platform} size="sm" />
            </div>
          )}
        </div>

        {error && (
          <div className="status-error">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="status-info flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary w-full"
        >
          {loading ? 'Processing...' : 'Get Transcript'}
        </button>

        <p className="text-center text-sm text-[var(--muted)]">
          Supports YouTube, TikTok, Instagram, X/Twitter, Threads, Bluesky, Vimeo, Twitch, Reddit, and more
        </p>
      </div>
    </form>
  );
}
