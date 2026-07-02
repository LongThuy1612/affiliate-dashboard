'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { resolveApiError } from '@/lib/apiError';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations('auth.login');
  const tErr = useTranslations('errors');

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError(t('fieldRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ username: form.username, password: form.password });
      router.push('/');
    } catch (err) {
      setError(resolveApiError(err, tErr));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2 mb-8 justify-center">
        <span className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-base">
          A
        </span>
        <span className="text-lg font-semibold text-[var(--text)]">AffiliateCrawl</span>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
        <h1 className="text-lg font-semibold text-[var(--text)] mb-1">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">{t('subtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('usernameLabel')}
            </label>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder={t('usernamePlaceholder')}
              className="w-full px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-3 py-2 pr-10 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-xs"
              >
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {t('noAccount')}{' '}
          <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
            {t('registerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
