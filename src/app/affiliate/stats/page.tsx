'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { affiliateApi, AffiliateStats, FetchLogStats } from '@/lib/api';
import { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { RefreshCw, ArrowLeft, Bot, Send } from 'lucide-react';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const SCORE_COLORS   = ['#10b981', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];
const SOURCE_COLORS  = ['#6366f1', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
const CAT_COLORS     = ['#6366f1', '#f59e0b', '#ef4444', '#64748b'];
// T1 Axios=blue, T2 Playwright=amber, T3 FlareSolverr=orange, failed=red
const TIER_COLORS    = ['#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

function PieCard({
  title, data, colors,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
      <div className="flex-1 flex items-center justify-center py-10">
        <p className="text-sm text-[var(--text-muted)] opacity-50">No data available</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
              itemStyle={{ color: '#fff', fontWeight: 500 }}
              formatter={(value) => {
                const n = Number(value ?? 0);
                const pct = ((n / total) * 100).toFixed(1);
                return [`${n.toLocaleString()} items (${pct}%)`, ''];
              }}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '11px',
                fontWeight: 500,
              }}
              formatter={(value, entry: any) => {
                const val = entry.payload?.value ?? 0;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <span className="text-[var(--text)] whitespace-nowrap">
                    {value} <span className="text-[var(--text-muted)] ml-1 font-mono">({pct}%)</span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type ChatMsg = { role: 'user' | 'ai'; text: string };

function AffiliateAnalyst() {
  const [models, setModels]   = useState<string[]>([]);
  const [model, setModel]     = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    affiliateApi.ollamaModels().then((ms) => {
      setModels(ms);
      if (ms.length > 0) setModel(ms[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Skip on mount (history starts as []) — scrollIntoView's default
    // `block: 'end'` walks up to the nearest scrollable ANCESTOR, which is
    // this page's own <main> (not just the chat's own overflow-y-auto div),
    // so it silently scrolled the whole /affiliate/stats page to the bottom
    // on every load, before the user ever sent a message. `block: 'nearest'`
    // keeps the scroll contained to the chat's own scroll container once
    // there's an actual reason to scroll (a new message).
    if (history.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [history]);

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setHistory((h) => [...h, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await affiliateApi.aiAnalyst(q, model || undefined);
      setHistory((h) => [...h, { role: 'ai', text: res.answer }]);
    } catch (e: unknown) {
      setHistory((h) => [...h, { role: 'ai', text: `Error: ${e instanceof Error ? e.message : 'Failed'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-indigo-950/30">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-indigo-400" />
          <span className="text-sm font-semibold text-[var(--text)]">AI Analyst</span>
          <span className="text-[11px] text-[var(--text-muted)]">— ask questions about your affiliate data</span>
        </div>
        {models.length > 0 && (
          <select
            className="rounded border bg-[var(--surface)] border-[var(--border)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Chat history */}
      <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto min-h-[120px]">
        {history.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
            Ask anything — e.g. "Which programs have the highest scores?", "How many recurring programs are there?"
          </p>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-indigo-600/30 text-indigo-100 border border-indigo-700/40'
                : 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]'
            }`}>
              {msg.role === 'ai' && (
                <span className="flex items-center gap-1 mb-1 text-[10px] text-indigo-400 font-medium">
                  <Bot size={9} /> AI
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <RefreshCw size={11} className="animate-spin text-indigo-400" />
              <span className="text-xs text-[var(--text-muted)]">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] px-3 py-2.5 flex gap-2">
        <input
          className="flex-1 rounded-lg border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="Ask a question about your affiliate programs…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
          disabled={loading}
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

export default function AffiliateStatsPage() {
  const { toast } = useToast();
  const t  = useTranslations('affiliateStats');
  const tc = useTranslations('common');

  const [stats, setStats]           = useState<AffiliateStats | null>(null);
  const [fetchLogStats, setFetchLogStats] = useState<FetchLogStats | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await affiliateApi.analysisStats();
      setStats(res.programs);
      setFetchLogStats(res.fetchTier);
    }
    catch (e: unknown) { toast(e instanceof Error ? e.message : 'Failed', { type: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const scoreData = stats ? [
    { name: t('score.excellent'), value: stats.scoreDistribution.excellent },
    { name: t('score.good'),      value: stats.scoreDistribution.good },
    { name: t('score.medium'),    value: stats.scoreDistribution.medium },
    { name: t('score.low'),       value: stats.scoreDistribution.low },
    { name: t('score.veryLow'),   value: stats.scoreDistribution.veryLow },
  ] : [];

  const sourceData = stats
    ? Object.entries(stats.byDataSource).map(([name, value]) => ({ name, value: value as number }))
    : [];

  const CAT_LABEL: Record<string, string> = {
    saas_ai:  t('category.saas_ai'),
    physical: t('category.physical'),
    vpcs:     t('category.vpcs'),
    unknown:  t('category.unknown'),
  };
  const catData = stats
    ? Object.entries(stats.byProductCategory).map(([name, value]) => ({
        name: CAT_LABEL[name] ?? name,
        value: value as number,
      }))
    : [];

  // Fetch-tier pie: successes per tier
  const tierData = fetchLogStats ? [
    ...fetchLogStats.byTier.map(t => ({ name: `T${t.tier} ${t.tierName} ✓`, value: t.success })),
    { name: 'All failed ✗', value: fetchLogStats.byTier.reduce((s, t) => s + t.failed, 0) },
  ].filter(d => d.value > 0) : [];

  // Per-tier failure breakdown — which tier fails most
  const tierFailData = fetchLogStats
    ? fetchLogStats.byTier.map(t => ({ name: `T${t.tier} ${t.tierName}`, value: t.failed })).filter(d => d.value > 0)
    : [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/affiliate">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={13} />}>{tc('back')}</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">{t('title')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          loading={loading}
          onClick={fetchStats}
        >
          {tc('refresh')}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t('total')}      value={stats.total.toLocaleString()} variant="glass" />
          <StatCard label={t('withComm')}   value={stats.withCommissionRate.toLocaleString()} color="text-emerald-400" variant="glass" />
          <StatCard label={t('withCookie')} value={stats.withCookieDays.toLocaleString()} color="text-amber-400" variant="glass" />
          <StatCard label={t('avgConf')}    value={`${Math.round(stats.avgConfidence * 100)}%`} variant="glass" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={32} className="animate-spin text-[var(--accent)] opacity-20" />
            <span className="text-sm font-medium text-[var(--text-muted)]">{tc('loading')}...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PieCard title={t('charts.score')}    data={scoreData}  colors={SCORE_COLORS} />
            <PieCard title={t('charts.source')}   data={sourceData} colors={SOURCE_COLORS} />
            <PieCard title={t('charts.category')} data={catData}    colors={CAT_COLORS} />
          </div>

          {/* Fetch-tier section */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              fetchUrl() Tier Diagnostics
            </h2>
            {fetchLogStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total fetch attempts" value={fetchLogStats.total.toLocaleString()} variant="glass" />
                <StatCard label="Avg duration" value={`${fetchLogStats.avgDurationMs} ms`} color="text-amber-400" variant="glass" />
                <StatCard
                  label="Top error"
                  value={fetchLogStats.byErrorCode[0]?.errorCode ?? '—'}
                  sub={fetchLogStats.byErrorCode[0] ? `${fetchLogStats.byErrorCode[0].count} times` : undefined}
                  color="text-red-400"
                  variant="glass"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PieCard title="fetchUrl() Success by Tier" data={tierData} colors={TIER_COLORS} />
              <PieCard
                title="Failures by Tier"
                data={tierFailData}
                colors={['#ef4444', '#f97316', '#f59e0b']}
              />
              {fetchLogStats && fetchLogStats.byErrorCode.length > 0 && (
                <PieCard
                  title="Failure Error Codes"
                  data={fetchLogStats.byErrorCode.slice(0, 8).map(e => ({ name: e.errorCode, value: e.count }))}
                  colors={['#ef4444','#f97316','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#64748b','#374151']}
                />
              )}
            </div>
          </div>

          {/* AI Analyst */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              AI Analyst
            </h2>
            <AffiliateAnalyst />
          </div>
        </>
      )}
    </div>
  );
}
