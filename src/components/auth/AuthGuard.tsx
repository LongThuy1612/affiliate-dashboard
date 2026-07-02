'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import BetaMarquee from '@/components/layout/BetaMarquee';
import BulletinBoard from '@/components/layout/BulletinBoard';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
    if (user && isPublic) {
      router.replace('/');
    }
  }, [user, loading, isPublic, pathname, router]);

  // Auth pages (login / register) — render centered without shell
  if (isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 w-full">
        {children}
      </div>
    );
  }

  // Still resolving auth — show spinner
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)] text-sm">
        Loading…
      </div>
    );
  }

  // Not authenticated — redirect in progress, render nothing
  if (!user) return null;

  // Authenticated — render full dashboard shell
  return (
    <>
      <BulletinBoard />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <BetaMarquee />
        <main className="flex-1 overflow-y-auto bg-[var(--bg)]">{children}</main>
      </div>
    </>
  );
}
