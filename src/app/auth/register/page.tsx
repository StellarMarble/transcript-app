'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Client-side password validation (mirrors server-side)
function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('One number');
  }

  return { valid: errors.length === 0, errors };
}

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; score: number } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', score };
  if (score <= 4) return { level: 'medium', score };
  return { level: 'strong', score };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'One lowercase letter', met: /[a-z]/.test(password) },
    { text: 'One number', met: /\d/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValidation.valid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push('/auth/login?registered=true');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = {
    weak: 'bg-[var(--error)]',
    medium: 'bg-[var(--warning)]',
    strong: 'bg-[var(--success)]',
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 grain">
      <div className="ambient-glow" />
      <div className="max-w-md w-full opacity-0 animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl mb-3">
            Create an account
          </h1>
          <p className="text-[var(--muted)]">
            Start transcribing in seconds
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
              <label htmlFor="name" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Name <span className="normal-case">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
              />
            </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowRequirements(true)}
                className="input-field"
                placeholder="Create a strong password"
              />

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score
                            ? strengthColors[passwordStrength.level]
                            : 'bg-[var(--background-tertiary)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`font-mono text-xs ${
                    passwordStrength.level === 'weak' ? 'text-[var(--error)]' :
                    passwordStrength.level === 'medium' ? 'text-[var(--warning)]' :
                    'text-[var(--success)]'
                  }`}>
                    {passwordStrength.level.toUpperCase()}
                  </p>
                </div>
              )}

              {/* Password requirements */}
              {showRequirements && (
                <div className="mt-3 p-3 bg-[var(--background)] rounded-lg border border-[var(--card-border)]">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Requirements</p>
                  <ul className="space-y-1.5">
                    {requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          req.met ? 'bg-[var(--success)]' : 'bg-[var(--background-tertiary)]'
                        }`}>
                          {req.met && (
                            <svg className="w-2 h-2 text-[#0f0f0f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={req.met ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 font-mono text-xs text-[var(--error)]">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                <p className="mt-2 font-mono text-xs text-[var(--success)]">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.valid || password !== confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner !w-4 !h-4 !border-[#0f0f0f]/30 !border-t-[#0f0f0f]" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm text-[var(--muted)]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
