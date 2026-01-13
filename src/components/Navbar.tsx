'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--card-border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="gradient-text">Transcript</span>
              <span className="text-[var(--foreground)]">App</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <span className="text-[var(--muted)] text-sm">Loading...</span>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm"
                >
                  Dashboard
                </Link>
                <span className="text-[var(--muted)] text-sm hidden sm:inline">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--input-border)] text-[var(--foreground)] hover:bg-[#292524] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)] text-[#0c0a09] font-medium hover:bg-[var(--accent-light)] transition-colors"
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
