'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Network, ShieldCheck, BarChart2, Wrench, FlaskConical, Code2,
  Menu, X, BookOpen, Settings, UserCog, Users, MessageSquare, ClipboardList, Bell, HelpCircle,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { hasPermission, canAny } from '@/lib/permissions';
import { PermissionSubject as S, PermissionAction as A } from '@/constants/permissions';
import type { PermissionSubjectValues, PermissionActionValues } from '@/constants/permissions';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  subject?: PermissionSubjectValues;
  action?: PermissionActionValues;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  // Desktop collapse — unlike `open` (mobile drawer, always starts closed),
  // this persists across reloads/navigation via localStorage so a user who
  // collapses the sidebar (e.g. to reclaim width in fullscreen, which has no
  // OS chrome to fall back on) doesn't have to re-collapse it on every page.
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === '1');
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };
  const { user } = useAuth();
  const { llmEnabled } = useConfig();
  const perms = user?.permissions ?? [];

  const allGroups: NavGroup[] = [
    {
      label: t('affiliatePrograms'),
      items: [
        { href: '/affiliate',           icon: BarChart2,    label: t('allPrograms'), subject: S.AFFILIATE, action: A.READ, exact: true },
        { href: '/affiliate/dev',       icon: Code2,        label: t('devView'), subject: S.AFFILIATE, action: A.READ },
        ...(llmEnabled
          ? [{ href: '/affiliate/llm-audit', icon: FlaskConical, label: t('llmAudit'), subject: S.AFFILIATE, action: A.READ }]
          : []),
        ...(canAny(perms, [[S.AFFILIATE, A.MANAGE], [S.AFFILIATE, A.CREATE], [S.AFFILIATE, A.UPDATE]])
          ? [{ href: '/affiliate/actions', icon: Wrench, label: t('actionsAndCrawl') }]
          : []),
      ],
    },
    {
      label: t('proxyManagement'),
      items: canAny(perms, [[S.PROXY, A.MANAGE], [S.PROXY, A.CREATE], [S.PROXY, A.UPDATE], [S.PROXY, A.DELETE]])
        ? [
            { href: '/proxy',         icon: Network,    label: t('proxyList'), exact: true },
            { href: '/proxy/actions', icon: ShieldCheck, label: t('importAndActions') },
          ]
        : [],
    },
    {
      label: t('management'),
      items: [
        { href: '/roles', icon: UserCog,  label: t('roles'), subject: S.ROLE, action: A.READ },
        { href: '/users', icon: Users,     label: t('users'), subject: S.USER, action: A.READ },
        ...(perms.includes('all:manage')
          ? [{ href: '/config/announcements', icon: Bell, label: t('announcements') }]
          : []),
      ],
    },
    {
      label: t('other'),
      items: [
        { href: '/guide',    icon: HelpCircle,    label: t('guide') },
        { href: '/feedback', icon: MessageSquare, label: t('feedback'), exact: true },
        ...(hasPermission(perms, S.FEEDBACK, A.READ)
          ? [{ href: '/feedback/manage', icon: ClipboardList, label: t('feedbackManage') }]
          : []),
        ...(perms.includes('all:manage')
          ? [{ href: '/docs', icon: BookOpen, label: t('docs'), exact: true }]
          : []),
        { href: '/config', icon: Settings, label: t('config'), subject: S.CONFIG, action: A.MANAGE, exact: true },
      ],
    },
  ];

  // Keep only items the user has permission to see; drop empty groups
  const visibleGroups = allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(({ subject, action }) => {
        if (!subject || !action) return true;
        return hasPermission(perms, subject, action);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const content = (
    <aside className={clsx(
      'flex flex-col h-screen w-56 border-r shrink-0',
      'bg-[var(--surface)] border-[var(--border)]',
    )}>
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border)]">
        <span className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">A</span>
        <span className="font-semibold text-[var(--text)]">AffiliateCrawl</span>
        <button
          className="ml-auto hidden lg:block text-[var(--text-muted)] hover:text-[var(--text)]"
          onClick={toggleCollapsed}
          title="Collapse sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
        <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
          <X size={18} className="text-[var(--text-muted)]" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, exact }) => {
                const active =
                  pathname === href ||
                  (!exact && href !== '/' && pathname.startsWith(href + '/'));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={clsx(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
                      )}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
        {t('apiUrl')}
      </div>
    </aside>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-[var(--surface)] border border-[var(--border)]"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} className="text-[var(--text)]" />
      </button>

      {/* Floating re-open button — always on top (z-50) regardless of fullscreen
          or any other page chrome, since a collapsed sidebar has no other way
          to reopen itself once its own toggle button is gone with it. */}
      {collapsed && (
        <button
          className="hidden lg:block fixed top-4 left-3 z-50 p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] shadow-lg"
          onClick={toggleCollapsed}
          title="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      {!collapsed && <div className="hidden lg:flex">{content}</div>}

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="flex">{content}</div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
