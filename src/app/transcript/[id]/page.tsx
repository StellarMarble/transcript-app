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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center grain">
        <div className="ambient-glow" />
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] grain">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="status-error mb-6">
            {error}
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="min-h-[calc(100vh-64px)] grain">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-[var(--muted)] mb-4">Transcript not found</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (transcript.status === 'failed') {
    return (
      <div className="min-h-[calc(100vh-64px)] grain">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-light)] mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="film-card p-8 border-l-4 !border-l-[var(--error)]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--error)]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display text-xl text-[var(--error)] mb-2">
                  Transcript Failed
                </h2>
                <p className="text-[var(--muted)] mb-4">
                  {transcript.error || 'An unknown error occurred while processing this transcript.'}
                </p>
                <a
                  href={transcript.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-[var(--accent)] hover:text-[var(--accent-light)] break-all transition-colors"
                >
                  {transcript.url}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (transcript.status === 'processing') {
    return (
      <div className="min-h-[calc(100vh-64px)] grain">
        <div className="ambient-glow" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-light)] mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="film-card p-12 text-center">
            <div className="spinner mx-auto mb-6" />
            <h2 className="font-display text-2xl mb-3">
              Processing Transcript
            </h2>
            <p className="text-[var(--muted)] max-w-sm mx-auto">
              This may take a few minutes depending on the length of the media. Please check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] grain">
      <div className="ambient-glow" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </Link>
        <TranscriptViewer transcript={transcript} />
      </div>
    </div>
  );
}
