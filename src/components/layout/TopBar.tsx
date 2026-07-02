'use client';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

function getLocale(): string {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return match?.[1] ?? 'en';
}

function usePageTitle(): string {
  const t = useTranslations('nav');
  const tAff = useTranslations('affiliate');
  const tProxy = useTranslations('proxy');
  const tAudit = useTranslations('llmAudit');
  const tStats = useTranslations('affiliateStats');
  const tActions = useTranslations('affiliateActions');
  const tProxyActions = useTranslations('proxyActions');
  const tConfig = useTranslations('config');
  const pathname = usePathname();

  if (pathname === '/affiliate') return tAff('title');
  if (pathname === '/affiliate/llm-audit/charts') return tAudit('title') + ' — Charts';
  if (pathname === '/affiliate/llm-audit') return tAudit('title');
  if (pathname === '/affiliate/actions') return tActions('title');
  if (pathname === '/affiliate/stats') return tStats('title');
  if (pathname.startsWith('/affiliate/')) return t('allPrograms');
  if (pathname === '/proxy') return tProxy('title');
  if (pathname === '/proxy/actions') return tProxyActions('title');
  if (pathname === '/docs') return t('docs');
  if (pathname === '/config/docs') return tConfig('title') + ' — Hướng dẫn';
  if (pathname === '/config') return tConfig('title');
  return 'AffiliateCrawl';
}

export default function TopBar() {
  const t = useTranslations('topBar');
  const router = useRouter();
  const [locale, setLocale] = useState<string>('en');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const title = usePageTitle();
  const { user, logout } = useAuth();

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  const switchLocale = (next: string) => {
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    setLocale(next);
    router.refresh();
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <h1 className="text-sm font-semibold text-[var(--text)] truncate">{title}</h1>
      <div className="flex items-center gap-3 shrink-0">
        {/* Language switcher */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Globe size={13} />
          <span>{t('switchLanguage')}:</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-[var(--border)] overflow-hidden">
          {(['en', 'vi'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${locale === loc
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
            >
              {loc === 'en' ? 'EN' : 'VI'}
            </button>
          ))}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </span>
              <span className="text-xs text-[var(--text)] max-w-[120px] truncate hidden sm:block">
                {user.fullName || user.username}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--text)] truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                    {user.role && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent)]/20 text-[var(--accent)]">
                        {user.role.name}
                      </span>
                    )}
                  </div>
                  <div className="px-1 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                    >
                      <LogOut size={13} />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
