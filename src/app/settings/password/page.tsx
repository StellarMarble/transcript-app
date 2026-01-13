'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 grain">
      <div className="ambient-glow" />
      <div className="max-w-md w-full opacity-0 animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl mb-3">
            Change Password
          </h1>
          <p className="text-[var(--muted)]">
            Update your account password
          </p>
        </div>

        <div className="film-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="status-error">
                {error}
              </div>
            )}

            {success && (
              <div className="status-success">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
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
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm text-[var(--muted)]">
            <Link href="/dashboard" className="text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
