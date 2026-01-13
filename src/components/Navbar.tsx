'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--card-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0f0f0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <span className="font-display text-lg tracking-tight">
                Transcript<span className="text-[var(--accent)]">App</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="w-4 h-4 spinner" />
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings/password"
                  className="px-3 py-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Settings
                </Link>
                <div className="w-px h-4 bg-[var(--card-border)] mx-1" />
                <span className="text-xs font-mono text-[var(--muted)] hidden sm:inline max-w-[140px] truncate">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="ml-2 text-sm px-3 py-1.5 rounded-md bg-[var(--background-secondary)] border border-[var(--card-border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground-muted)] transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm px-4 py-1.5 rounded-md bg-[var(--accent)] text-[#0f0f0f] font-medium hover:bg-[var(--accent-light)] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
