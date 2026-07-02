'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { proxyApi, Proxy, ProxyStats } from '@/lib/api';
import { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toaster';
import { RefreshCw, Trash2, Shield, ShieldOff, Plus } from 'lucide-react';
import Link from 'next/link';

type Filter = 'all' | 'live' | 'dead';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200].map((n) => ({ value: String(n), label: String(n) }));

export default function ProxyPage() {
  const { toast } = useToast();
  const t  = useTranslations('proxy');
  const tc = useTranslations('common');

  const [stats, setStats]       = useState<ProxyStats | null>(null);
  const [proxies, setProxies]   = useState<Proxy[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(50);

  const fetchData = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const liveFilter = f === 'all' ? undefined : f === 'live';
      const [list, s] = await Promise.all([proxyApi.list(liveFilter), proxyApi.stats()]);
      setProxies(list.proxies);
      setStats(s);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failedToLoad'), { type: 'error' });
    } finally { setLoading(false); }
  }, [toast, t]);

  useEffect(() => { fetchData('all'); }, []);

  const handleFilter = (f: Filter) => { setFilter(f); setPage(1); fetchData(f); };

  const handleDelete = async (proxy: Proxy) => {
    const key = `${proxy.ip}:${proxy.port}`;
    if (!confirm(t('deleteConfirm', { key }))) return;
    setDeleting(key);
    try {
      await proxyApi.delete(proxy.ip, proxy.port);
      toast(t('deleteSuccess', { key }), { type: 'success' });
      fetchData(filter);
    } catch {
      toast(t('deleteFailed'), { type: 'error' });
    } finally { setDeleting(null); }
  };

  const liveRate = stats ? Math.round((stats.live / Math.max(stats.total, 1)) * 100) : 0;

  // Client-side pagination
  const total = proxies.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pagedProxies = useMemo(
    () => proxies.slice((page - 1) * limit, page * limit),
    [proxies, page, limit],
  );

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all',  label: t('filterAll'),  count: stats?.total ?? 0 },
    { key: 'live', label: t('filterLive'), count: stats?.live  ?? 0 },
    { key: 'dead', label: t('filterDead'), count: stats?.dead  ?? 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={() => fetchData(filter)}>
            {tc('refresh')}
          </Button>
          <Link href="/proxy/actions">
            <Button size="sm" icon={<Plus size={13} />}>{t('importActions')}</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('stats.total')}   value={stats.total.toLocaleString()} />
          <StatCard label={t('stats.live')}    value={stats.live.toLocaleString()}  color="text-green-400" />
          <StatCard label={t('stats.dead')}    value={stats.dead.toLocaleString()}  color="text-red-400" />
          <StatCard label={t('stats.liveRate')} value={`${liveRate}%`}
            color={liveRate >= 70 ? 'text-green-400' : liveRate >= 40 ? 'text-amber-400' : 'text-red-400'} />
        </div>
      )}

      {/* Pool health bar */}
      {stats && stats.total > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)]">{t('poolHealth')}</span>
            <span className="text-xs text-[var(--text-muted)]">{stats.live} {t('alive')} / {stats.dead} {t('dead')}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden flex">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${liveRate}%` }} />
            <div className="h-full bg-red-500/40 transition-all flex-1" />
          </div>
        </div>
      )}

      {/* Filter tabs + per-page */}
      <div className="flex items-end justify-between gap-3 border-b border-[var(--border)]">
        <div className="flex gap-0">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilter(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === key
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <div className="pb-1">
          <Select
            label=""
            value={String(limit)}
            onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
            options={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                {[t('table.id'), t('table.ip'), t('table.port'), t('table.username'), t('table.status'), t('table.lastCheck'), t('table.created'), t('table.actions')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">{tc('loading')}</td></tr>
              ) : pagedProxies.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">{t('noProxies')}</td></tr>
              ) : (
                pagedProxies.map((p, idx) => {
                  const key    = `${p.ip}:${p.port}`;
                  const isLive = p.isLive === 1;

                  let lastCheckEl: React.ReactNode = <span className="text-[var(--text-muted)]">—</span>;
                  if (p.lastCheck) {
                    const ageMs = Date.now() - new Date(p.lastCheck).getTime();
                    const ageCls =
                      ageMs < 3_600_000  ? 'text-green-400' :
                      ageMs < 86_400_000 ? 'text-amber-400' : 'text-red-400';
                    lastCheckEl = <span className={`text-xs ${ageCls}`}>{new Date(p.lastCheck).toLocaleString()}</span>;
                  }

                  return (
                    <tr key={p.id}
                      className={`border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors ${
                        isLive ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-600'
                      }`}>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] tabular-nums w-12">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text)]">{p.ip}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{p.port}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.username ?? '—'}</td>
                      <td className="px-4 py-3">
                        {isLive
                          ? <Badge variant="success"><Shield size={10} className="inline mr-1" />{t('status.live')}</Badge>
                          : <Badge variant="danger"><ShieldOff size={10} className="inline mr-1" />{t('status.dead')}</Badge>}
                      </td>
                      <td className="px-4 py-3">{lastCheckEl}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" loading={deleting === key}
                          icon={<Trash2 size={12} className="text-red-400" />}
                          onClick={() => handleDelete(p)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} limit={limit} onChange={setPage} />
      </div>
    </div>
  );
}
