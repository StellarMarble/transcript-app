'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlatformBadge from '@/components/PlatformBadge';

interface Transcript {
  id: string;
  url: string;
  platform: string;
  title: string | null;
  duration: number | null;
  status: string;
  error: string | null;
  createdAt: string;
}

interface Usage {
  used: number;
  limit: number | null;
  remaining: number | null;
  isAdmin?: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTranscripts();
      fetchUsage();
    }
  }, [session]);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/user/usage');
      const data = await res.json();
      if (res.ok) {
        setUsage(data);
      }
    } catch {
      // Silently fail - usage display is not critical
    }
  };

  const fetchTranscripts = async () => {
    try {
      const res = await fetch('/api/transcript/list');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch transcripts');
        return;
      }

      setTranscripts(data.transcripts);
    } catch {
      setError('Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcript?')) {
      return;
    }

    try {
      const res = await fetch(`/api/transcript/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete transcript');
        return;
      }

      setTranscripts(transcripts.filter((t) => t.id !== id));
    } catch {
      alert('Failed to delete transcript');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center grain">
        <div className="ambient-glow" />
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grain">
      <div className="ambient-glow" />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl mb-2">Your Transcripts</h1>
            <p className="text-[var(--muted)]">Manage and view your saved transcripts</p>
          </div>
          <Link href="/" className="btn-primary text-sm">
            + New Transcript
          </Link>
        </div>

        {/* Usage Card */}
        {usage && (
          <div className="film-card p-6 mb-8">
            {usage.isAdmin ? (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">Monthly Usage</h2>
                  <p className="text-lg">
                    <span className="font-mono text-2xl font-bold text-[var(--foreground)]">{usage.used}</span>
                    <span className="text-[var(--muted)]"> transcripts this month</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-md bg-[var(--accent-glow)] text-[var(--accent)] font-mono text-sm">
                    UNLIMITED
                  </span>
                  <p className="text-xs text-[var(--muted)] mt-1">admin account</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">Monthly Usage</h2>
                    <p className="text-lg">
                      <span className="font-mono text-2xl font-bold text-[var(--foreground)]">{usage.used}</span>
                      <span className="text-[var(--muted)]"> / {usage.limit} transcripts</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-3xl font-bold ${usage.remaining === 0 ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>
                      {usage.remaining}
                    </p>
                    <p className="text-xs text-[var(--muted)]">remaining</p>
                  </div>
                </div>
                <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.remaining === 0 ? 'bg-[var(--error)]' : (usage.remaining ?? 0) <= 2 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'
                    }`}
                    style={{ width: `${(usage.used / (usage.limit ?? 1)) * 100}%` }}
                  />
                </div>
                {usage.remaining === 0 && (
                  <p className="mt-4 text-sm text-[var(--error)]">
                    You&apos;ve reached your free limit. Upgrade for unlimited transcripts.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="status-error mb-6">
            {error}
          </div>
        )}

        {transcripts.length === 0 ? (
          <div className="film-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl mb-2">No transcripts yet</h2>
            <p className="text-[var(--muted)] mb-8 max-w-sm mx-auto">
              Get started by extracting a transcript from any video or podcast.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Create Your First Transcript
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transcripts.map((transcript, i) => (
              <div
                key={transcript.id}
                className="film-card p-5 flex items-center justify-between gap-4 opacity-0 animate-slideUp"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <PlatformBadge platform={transcript.platform} size="sm" />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                        transcript.status === 'completed'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : transcript.status === 'failed'
                            ? 'bg-[var(--error)]/10 text-[var(--error)]'
                            : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                      }`}
                    >
                      {transcript.status}
                    </span>
                  </div>
                  <h3 className="font-medium truncate mb-1.5">
                    {transcript.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-4 font-mono text-xs text-[var(--muted)]">
                    <span>{formatDate(transcript.createdAt)}</span>
                    {transcript.duration && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--muted)]" />
                        <span>{formatDuration(transcript.duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {transcript.status === 'completed' && (
                    <Link
                      href={`/transcript/${transcript.id}`}
                      className="text-sm px-4 py-2 rounded-md bg-[var(--accent)] text-[#0f0f0f] font-medium hover:bg-[var(--accent-light)] transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(transcript.id)}
                    className="text-sm px-3 py-2 rounded-md text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
