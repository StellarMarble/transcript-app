'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 grain">
      <div className="ambient-glow" />
      <div className="max-w-md w-full opacity-0 animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl mb-3">
            Welcome back
          </h1>
          <p className="text-[var(--muted)]">
            Sign in to your account to continue
          </p>
        </div>

        <div className="film-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="status-error">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner !w-4 !h-4 !border-[#0f0f0f]/30 !border-t-[#0f0f0f]" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm text-[var(--muted)]">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
