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
            placeholder="Paste any video URL..."
            style={{ paddingRight: isValidPlatform ? '140px' : undefined }}
            className="input-field font-mono text-sm"
            disabled={loading}
          />
          {isValidPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PlatformBadge platform={parsed.platform} size="sm" />
            </div>
          )}
        </div>

        {error && (
          <div className="status-error text-sm">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--background-tertiary)] border border-[var(--card-border)]">
            <div className="spinner !w-4 !h-4" />
            <span className="text-sm text-[var(--foreground-muted)]">{status}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner !w-4 !h-4 !border-[#0f0f0f]/30 !border-t-[#0f0f0f]" />
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Get Transcript
            </>
          )}
        </button>
      </div>
    </form>
  );
}
