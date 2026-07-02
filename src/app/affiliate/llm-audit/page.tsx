'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { affiliateApi, LlmAuditRow, LlmAuditResponse } from '@/lib/api';
import { useConfig } from '@/context/ConfigContext';
import { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toaster';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { isRecentlyUpdated } from '@/lib/freshness';

type OrderBy = 'crawledAt' | 'scoreBefore' | 'scoreAfter' | 'confidenceBefore' | 'confidenceAfter' | 'durationMs';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200].map((n) => ({ value: String(n), label: String(n) }));

function DeltaBadge({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  if (delta > 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-300 ring-1 ring-green-500/30">
      <TrendingUp size={10} />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 ring-1 ring-red-500/30">
      <TrendingDown size={10} />{delta}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] ring-1 ring-[var(--border)]">
      <Minus size={10} />0
    </span>
  );
}

function ScoreCell({ value, dim }: { value: number; dim?: boolean }) {
  if (dim) return <span className="text-xs text-[var(--text-muted)] tabular-nums">{value}</span>;
  const cls =
    value >= 85 ? 'text-emerald-300' :
    value >= 70 ? 'text-green-300'   :
    value >= 50 ? 'text-amber-300'   :
    value >= 30 ? 'text-orange-300'  : 'text-red-300';
  return <span className={clsx('text-xs font-semibold tabular-nums', cls)}>{value}</span>;
}

function ConfCell({ value, dim }: { value: number; dim?: boolean }) {
  const pct = Math.round(value * 100);
  if (dim) return <span className="text-xs text-[var(--text-muted)]">{pct}%</span>;
  const cls = pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';
  return <span className={clsx('text-xs font-medium', cls)}>{pct}%</span>;
}

function DurationCell({ ms }: { ms: number | null }) {
  if (ms == null) return <span className="text-[var(--text-muted)] text-xs">—</span>;
  const cls =
    ms < 1000 ? 'text-green-400'  :
    ms < 3000 ? 'text-amber-400'  :
    ms < 8000 ? 'text-orange-400' : 'text-red-400';
  const label = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  return <span className={clsx('text-xs font-mono', cls)}>{label}</span>;
}

function rowBorder(before: number, after: number) {
  const delta = after - before;
  if (delta > 0) return 'border-l-2 border-l-green-500';
  if (delta < 0) return 'border-l-2 border-l-red-500';
  return 'border-l-2 border-l-[var(--border)]';
}

export default function LlmAuditPage() {
  const { llmEnabled, configLoading } = useConfig();
  const { toast } = useToast();
  const t  = useTranslations('llmAudit');
  const tc = useTranslations('common');

  if (configLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">
        Loading…
      </div>
    );
  }

  if (!llmEnabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-amber-900/20 border border-amber-700/30 flex items-center justify-center">
          <BarChart2 size={28} className="text-amber-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--text)]">LLM Extraction đang tắt</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
            Trang này chỉ hiển thị khi LLM Extraction được bật. Vào{' '}
            <a href="/config" className="text-[var(--accent)] underline underline-offset-2">Cài đặt</a>{' '}
            để bật tính năng này.
          </p>
        </div>
      </div>
    );
  }

  const [data, setData]                 = useState<LlmAuditResponse | null>(null);
  const [loading, setLoading]           = useState(true);
  const [domain, setDomain]             = useState('');
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(50);
  const [improvedOnly, setImprovedOnly] = useState(false);
  const [orderBy, setOrderBy]           = useState<OrderBy>('crawledAt');
  const [order, setOrder]               = useState<'asc' | 'desc'>('desc');
  const [llmModel, setLlmModel]         = useState('');
  const [models, setModels]             = useState<string[]>([]);

  const fetchAudit = useCallback(async (
    p: number, d: string, io: boolean, ob: OrderBy, o: 'asc' | 'desc', m: string, lim: number,
  ) => {
    setLoading(true);
    try {
      const res = await affiliateApi.llmAudit({
        page: p, limit: lim,
        domain: d || undefined,
        improvedOnly: io || undefined,
        orderBy: ob, order: o,
        llmModel: m || undefined,
      });
      setData(res);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to load', { type: 'error' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => {
    fetchAudit(1, '', false, 'crawledAt', 'desc', '', 50);
    affiliateApi.llmAuditModels().then(setModels).catch(() => {});
  }, []);

  const apply = (p: number, d: string, io: boolean, ob: OrderBy, o: 'asc' | 'desc', m: string, lim = limit) => {
    setPage(p);
    fetchAudit(p, d, io, ob, o, m, lim);
  };
  const summary = data?.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/affiliate/llm-audit/charts">
            <Button variant="secondary" size="sm" icon={<BarChart2 size={13} />}>
              Model Analytics
            </Button>
          </Link>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />}
            onClick={() => fetchAudit(page, domain, improvedOnly, orderBy, order, llmModel, limit)}>
            {tc('refresh')}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label={t('stats.totalAudited')} value={data!.total.toLocaleString()} />
          <StatCard label={t('stats.improved')}     value={summary.improved}  color="text-green-400" />
          <StatCard label={t('stats.unchanged')}    value={summary.unchanged} color="text-[var(--text-muted)]" />
          <StatCard label={t('stats.degraded')}     value={summary.degraded}  color="text-red-400" />
          <StatCard label={t('stats.improvedPct')}  value={`${summary.improvedPct}%`} color="text-green-400" />
          <StatCard
            label={t('stats.avgScoreDelta')}
            value={summary.avgScoreDelta > 0 ? `+${summary.avgScoreDelta}` : String(summary.avgScoreDelta)}
            color={summary.avgScoreDelta > 0 ? 'text-green-400' : summary.avgScoreDelta < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}
          />
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap gap-3 items-end">
        <Input
          label={t('filters.domainLabel')}
          placeholder={t('filters.domainPlaceholder')}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply(1, domain, improvedOnly, orderBy, order, llmModel)}
          className="w-48"
        />
        <Select
          label={t('filters.modelLabel')}
          value={llmModel}
          onValueChange={(v) => { setLlmModel(v); apply(1, domain, improvedOnly, orderBy, order, v); }}
          options={[
            { value: '', label: t('filters.allModels') },
            ...models.map(m => ({ value: m, label: m })),
          ]}
        />
        <Select
          label={tc('sortBy')}
          value={orderBy}
          onValueChange={(v) => { setOrderBy(v as OrderBy); apply(1, domain, improvedOnly, v as OrderBy, order, llmModel); }}
          options={[
            { value: 'crawledAt',        label: t('filters.sortDate') },
            { value: 'scoreAfter',       label: t('filters.sortScoreAfter') },
            { value: 'scoreBefore',      label: t('filters.sortScoreBefore') },
            { value: 'confidenceAfter',  label: t('filters.sortConfAfter') },
            { value: 'confidenceBefore', label: t('filters.sortConfBefore') },
            { value: 'durationMs',       label: t('filters.sortDuration') },
          ]}
        />
        <Button variant="ghost" size="sm"
          icon={order === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          onClick={() => { const o = order === 'asc' ? 'desc' : 'asc'; setOrder(o); apply(1, domain, improvedOnly, orderBy, o, llmModel); }}>
          {order === 'asc' ? tc('asc') : tc('desc')}
        </Button>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] pb-2">
          <input type="checkbox" checked={improvedOnly}
            onChange={(e) => { setImprovedOnly(e.target.checked); apply(1, domain, e.target.checked, orderBy, order, llmModel); }}
            className="accent-[var(--accent)]" />
          {t('filters.improvedOnly')}
        </label>
        <Select
          label={tc('perPage')}
          value={String(limit)}
          onValueChange={(v) => {
            const newLimit = Number(v);
            setLimit(newLimit);
            setPage(1);
            fetchAudit(1, domain, improvedOnly, orderBy, order, llmModel, newLimit);
          }}
          options={PAGE_SIZE_OPTIONS}
        />
        <Button size="sm" onClick={() => apply(1, domain, improvedOnly, orderBy, order, llmModel)}>{tc('apply')}</Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                {[t('table.id'), t('table.domain'), t('table.scoreBefore'), t('table.scoreAfter'), t('table.scoreDelta'), t('table.confBefore'), t('table.confAfter'), t('table.model'), t('table.duration'), t('table.date')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-[var(--text-muted)]">{tc('loading')}</td></tr>
              ) : !data?.rows?.length ? (
                <tr><td colSpan={10} className="text-center py-12 text-[var(--text-muted)]">{t('noRecords')}</td></tr>
              ) : (
                data.rows.map((row: LlmAuditRow, idx: number) => (
                  <tr key={row.id}
                    className={clsx('border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors', rowBorder(row.scoreBefore, row.scoreAfter))}>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] tabular-nums w-12">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[160px] truncate">
                      <Link href={`/affiliate/${encodeURIComponent(row.domain)}`}
                        className="text-indigo-400 hover:underline hover:text-indigo-300">
                        {row.domain}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><ScoreCell value={row.scoreBefore} dim /></td>
                    <td className="px-4 py-3"><ScoreCell value={row.scoreAfter} /></td>
                    <td className="px-4 py-3"><DeltaBadge before={row.scoreBefore} after={row.scoreAfter} /></td>
                    <td className="px-4 py-3"><ConfCell value={row.confidenceBefore} dim /></td>
                    <td className="px-4 py-3"><ConfCell value={row.confidenceAfter} /></td>
                    <td className="px-4 py-3"><Badge variant="accent">{row.llmModel ?? '—'}</Badge></td>
                    <td className="px-4 py-3"><DurationCell ms={row.durationMs} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {new Date(row.crawledAt).toLocaleDateString()}
                        {isRecentlyUpdated(row.crawledAt) && (
                          <span className="text-[10px] font-bold px-1 py-px rounded bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40">
                            {t('newBadge')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <Pagination page={page} pages={data.pages} total={data.total} limit={limit}
            onChange={(p) => apply(p, domain, improvedOnly, orderBy, order, llmModel)} />
        )}
      </div>
    </div>
  );
}
