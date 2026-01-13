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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
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
    }
  }, [session]);

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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="ambient-glow" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Transcripts</h1>
          <Link href="/" className="btn-primary text-sm !py-2.5 !px-5">
            New Transcript
          </Link>
        </div>

        {error && (
          <div className="status-error mb-6">
            {error}
          </div>
        )}

        {transcripts.length === 0 ? (
          <div className="card-glow rounded-2xl p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">
              No transcripts yet
            </h2>
            <p className="text-[var(--muted)] mb-6">
              Get started by extracting a transcript from a video or podcast.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Create Your First Transcript
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className="card-glow rounded-xl p-5 flex items-center justify-between gap-4 hover:border-[var(--accent)]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <PlatformBadge platform={transcript.platform} size="sm" />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        transcript.status === 'completed'
                          ? 'bg-green-500/15 text-green-400'
                          : transcript.status === 'failed'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-yellow-500/15 text-yellow-400'
                      }`}
                    >
                      {transcript.status}
                    </span>
                  </div>
                  <h3 className="font-medium truncate mb-1">
                    {transcript.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <span>{formatDate(transcript.createdAt)}</span>
                    {transcript.duration && (
                      <span>{formatDuration(transcript.duration)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {transcript.status === 'completed' && (
                    <Link
                      href={`/transcript/${transcript.id}`}
                      className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(transcript.id)}
                    className="text-sm px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Delete
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
