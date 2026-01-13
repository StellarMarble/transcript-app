'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TranscriptViewer from '@/components/TranscriptViewer';

interface Transcript {
  id: string;
  url: string;
  platform: string;
  title: string | null;
  content: string;
  duration: number | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && id) {
      fetchTranscript();
    }
  }, [session, id]);

  const fetchTranscript = async () => {
    try {
      const res = await fetch(`/api/transcript/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch transcript');
        return;
      }

      setTranscript(data.transcript);
    } catch {
      setError('Failed to fetch transcript');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)]">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="status-error mb-6">
            {error}
          </div>
          <Link href="/dashboard" className="text-[var(--accent)] hover:text-[var(--accent-light)]">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="min-h-[calc(100vh-64px)]">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-[var(--muted)]">Transcript not found</p>
          <Link href="/dashboard" className="text-[var(--accent)] hover:text-[var(--accent-light)]">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (transcript.status === 'failed') {
    return (
      <div className="min-h-[calc(100vh-64px)]">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/dashboard"
            className="text-[var(--accent)] hover:text-[var(--accent-light)] mb-6 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="card-glow rounded-2xl p-6 border-red-500/30">
            <h2 className="text-lg font-semibold text-red-400 mb-2">
              Transcript Failed
            </h2>
            <p className="text-[var(--muted)]">
              {transcript.error || 'An unknown error occurred while processing this transcript.'}
            </p>
            <p className="mt-4">
              <a
                href={transcript.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:text-[var(--accent-light)]"
              >
                {transcript.url}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (transcript.status === 'processing') {
    return (
      <div className="min-h-[calc(100vh-64px)]">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/dashboard"
            className="text-[var(--accent)] hover:text-[var(--accent-light)] mb-6 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="card-glow rounded-2xl p-8 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Processing Transcript
            </h2>
            <p className="text-[var(--muted)]">
              This may take a few minutes. Please check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="ambient-glow" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="text-[var(--accent)] hover:text-[var(--accent-light)] mb-6 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <TranscriptViewer transcript={transcript} />
      </div>
    </div>
  );
}
