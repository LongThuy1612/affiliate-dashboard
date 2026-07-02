'use client';
import { useEffect, useState, useCallback } from 'react';
import { affiliateApi } from '@/lib/api';
import { StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelStat {
  model: string;
  total: number;
  improved: number;
  unchanged: number;
  degraded: number;
  improvedPct: number;
  avgScoreDelta: number;
  avgDurationMs: number;
}

interface RangeStat {
  range: string;
  count: number;
  avgDelta: number;
  improved: number;
  unchanged: number;
  degraded: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
};

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5 opacity-60">{subtitle}</p>}
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LlmChartsPage() {
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [rangeStats, setRangeStats] = useState<RangeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, avgDelta: 0, avgDuration: 0, improvedPct: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await affiliateApi.analysisLlmModels();
      setTotals({
        total: res.summary.total,
        avgDelta: res.summary.avgScoreDelta,
        avgDuration: res.summary.avgDurationMs,
        improvedPct: res.summary.improvedPct,
      });
      setModelStats(res.perModel);
      setRangeStats(res.byScoreRange);
    } catch (err) {
      console.error('[LlmChartsPage]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/affiliate/llm-audit">
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={13} />}>Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">LLM Model Analytics</h1>
            <p className="text-sm text-[var(--text-muted)]">Model usage, efficiency, and performance breakdown</p>
          </div>
        </div>
        <Button
          variant="secondary" size="sm" loading={loading}
          icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          onClick={load}
        >
          Refresh
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Audited"  value={totals.total.toLocaleString()} variant="glass" />
        <StatCard label="Avg Score Δ"   value={totals.avgDelta > 0 ? `+${totals.avgDelta}` : String(totals.avgDelta)}
          color={totals.avgDelta > 0 ? 'text-green-400' : totals.avgDelta < 0 ? 'text-red-400' : undefined} variant="glass" />
        <StatCard label="Avg Duration"  value={fmtMs(totals.avgDuration)} color="text-amber-400" variant="glass" />
        <StatCard label="Improved Rate" value={`${totals.improvedPct}%`}   color="text-green-400" variant="glass" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <RefreshCw size={32} className="animate-spin text-[var(--accent)] opacity-20" />
        </div>
      ) : (
        <>
          {/* Row 1: Usage + Score Delta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Model Usage" subtitle="Number of audit records per model">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelStats} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="model" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }}
                    formatter={(v) => [Number(v).toLocaleString(), 'Audits']} />
                  <Bar dataKey="total" name="Total audits" radius={[4, 4, 0, 0]}>
                    {modelStats.map((_, i) => <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Avg Score Improvement (Δ)" subtitle="Average score change per model after LLM enrichment">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelStats} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="model" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }}
                    formatter={(v) => [Number(v) >= 0 ? `+${v}` : String(v), 'Avg Δ']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <Bar dataKey="avgScoreDelta" name="Avg Score Δ" radius={[4, 4, 0, 0]}>
                    {modelStats.map((s, i) => (
                      <Cell key={i} fill={s.avgScoreDelta >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Improvement rate + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Improvement Rate (%)" subtitle="% of records that improved after LLM enrichment">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelStats} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="model" tick={AXIS_TICK} />
                  <YAxis domain={[0, 100]} tick={AXIS_TICK} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }}
                    formatter={(v) => [`${v}%`, 'Improved']} />
                  <Bar dataKey="improvedPct" name="Improved %" radius={[4, 4, 0, 0]}>
                    {modelStats.map((s, i) => (
                      <Cell key={i} fill={s.improvedPct >= 70 ? '#10b981' : s.improvedPct >= 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Avg Processing Duration" subtitle="Average LLM inference time per model">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelStats} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="model" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}s`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#fff' }}
                    formatter={(v) => [fmtMs(Number(v)), 'Avg Duration']} />
                  <Bar dataKey="avgDurationMs" name="Avg Duration" radius={[4, 4, 0, 0]}>
                    {modelStats.map((s, i) => (
                      <Cell key={i} fill={s.avgDurationMs < 2000 ? '#10b981' : s.avgDurationMs < 6000 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Score range impact */}
          <ChartCard
            title="LLM Impact by Starting Score Range"
            subtitle="Avg score Δ grouped by score-before bucket — shows where LLM helps most"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rangeStats} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = rangeStats.find((r) => r.range === label);
                    if (!d) return null;
                    return (
                      <div style={TOOLTIP_STYLE}>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>Score {label}</p>
                        <p style={{ color: '#94a3b8' }}>Records: {d.count}</p>
                        <p style={{ color: d.avgDelta >= 0 ? '#10b981' : '#ef4444' }}>
                          Avg Δ: {d.avgDelta >= 0 ? '+' : ''}{d.avgDelta}
                        </p>
                        <p style={{ color: '#10b981' }}>Improved: {d.improved}</p>
                        <p style={{ color: '#94a3b8' }}>Unchanged: {d.unchanged}</p>
                        <p style={{ color: '#ef4444' }}>Degraded: {d.degraded}</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="avgDelta" name="Avg Score Δ" radius={[4, 4, 0, 0]}>
                  {rangeStats.map((r, i) => (
                    <Cell key={i} fill={r.avgDelta >= 0 ? '#6366f1' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Detailed model stats table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Detailed Model Stats</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                    {['Model', 'Total', 'Improved', 'Unchanged', 'Degraded', 'Improved %', 'Avg Score Δ', 'Avg Duration'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelStats.map((s, i) => (
                    <tr key={s.model} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                          <span className="font-mono text-xs text-[var(--text)]">{s.model}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-[var(--text)]">{s.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-green-400">{s.improved.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-[var(--text-muted)]">{s.unchanged.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-red-400">{s.degraded.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        <span className={clsx(
                          s.improvedPct >= 70 ? 'text-green-400' :
                          s.improvedPct >= 40 ? 'text-amber-400' : 'text-red-400',
                        )}>
                          {s.improvedPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        <span className={s.avgScoreDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {s.avgScoreDelta >= 0 ? '+' : ''}{s.avgScoreDelta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className={clsx(
                          s.avgDurationMs < 2000 ? 'text-green-400' :
                          s.avgDurationMs < 6000 ? 'text-amber-400' : 'text-red-400',
                        )}>
                          {fmtMs(s.avgDurationMs)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {modelStats.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-[var(--text-muted)]">No model data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
