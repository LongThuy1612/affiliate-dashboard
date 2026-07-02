'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { resolveApiError } from '@/lib/apiError';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const t = useTranslations('auth.register');
  const tErr = useTranslations('errors');

  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): string => {
    if (!form.username || !form.email || !form.password) return t('validationRequired');
    if (form.username.length < 3) return t('validationUsername');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return t('validationEmail');
    if (form.password.length < 8) return t('validationPassword');
    if (form.password !== form.confirmPassword) return t('validationPasswordMatch');
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName || undefined,
      });
      setSuccess(t('successMessage'));
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(resolveApiError(err, tErr));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    id: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = '',
    required = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label} {required && <span className="text-[var(--danger)]">*</span>}
      </label>
      {id === 'password' || id === 'confirmPassword' ? (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form[id]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-10 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          {id === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-xs"
            >
              {showPassword ? t('hidePassword') : t('showPassword')}
            </button>
          )}
        </div>
      ) : (
        <input
          type={type}
          autoComplete={id === 'email' ? 'email' : 'off'}
          value={form[id]}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      )}
    </div>
  );

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
          {field('username', t('username'), 'text', t('usernamePlaceholder'), true)}
          {field('email', t('email'), 'email', t('emailPlaceholder'), true)}
          {field('fullName', t('fullName'), 'text', t('fullNamePlaceholder'))}
          {field('password', t('password'), 'password', '••••••••', true)}
          {field('confirmPassword', t('confirmPassword'), 'password', '••••••••', true)}

          {error && (
            <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-[var(--success)]/10 border border-[var(--success)]/30 px-3 py-2 text-sm text-[var(--success)]">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
