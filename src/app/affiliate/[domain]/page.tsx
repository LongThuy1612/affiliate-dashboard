'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { affiliateApi, AffiliateProgram, AffiliateSubPage, DomainTrafficFull, DomainTrafficGeography, DomainTrafficKeyword, verificationApi, DomainVerification } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, ExternalLink, Trash2, CheckCircle2, XCircle,
  BadgeCheck, Sparkles, Globe, Clock, Users, Layers,
  TrendingUp, TrendingDown, Search, BarChart2, Code2,
} from 'lucide-react';
import clsx from 'clsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const EMPTY_VALUES = new Set(['', 'null', 'undefined', 'n/a', 'N/A', 'unknown']);

// ─── Google research link ──────────────────────────────────────────────────

function googleSearchUrl(domain: string, programName: string | null): string {
  const query = programName ? `${programName} affiliate program` : `${domain} affiliate program`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// ─── Row / Section ──────────────────────────────────────────────────────────

function Row({ label, value, alwaysShow }: { label: string; value: React.ReactNode; alwaysShow?: boolean }) {
  const isEmpty = value === null || value === undefined || (typeof value === 'string' && EMPTY_VALUES.has(value));
  if (isEmpty && !alwaysShow) return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-[var(--border)] last:border-0">
      <dt className="w-44 shrink-0 text-xs text-[var(--text-muted)] pt-0.5">{label}</dt>
      <dd className={clsx('flex-1 text-sm break-all', isEmpty ? 'text-[var(--text-muted)]' : 'text-[var(--text)]')}>
        {isEmpty ? '—' : value}
      </dd>
    </div>
  );
}

function SectionHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <h3 className="text-sm font-semibold text-[var(--text)] flex-1">{title}</h3>
      {right}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <SectionHeader icon={icon} title={title} />
      <dl className="px-5">{children}</dl>
    </div>
  );
}

function ExternalLink_({ href, label }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline break-all">
      {label ?? href}
      <ExternalLink size={11} className="shrink-0" />
    </a>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const cfg =
    score >= 85 ? { color: 'bg-emerald-500', text: 'text-emerald-300', label: 'Excellent' } :
    score >= 70 ? { color: 'bg-green-500',   text: 'text-green-300',   label: 'Good'      } :
    score >= 50 ? { color: 'bg-amber-500',   text: 'text-amber-300',   label: 'Fair'      } :
    score >= 30 ? { color: 'bg-orange-500',  text: 'text-orange-300',  label: 'Weak'      } :
                  { color: 'bg-red-500',     text: 'text-red-300',     label: 'Poor'      };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', cfg.color)} style={{ width: `${score}%` }} />
      </div>
      <span className={clsx('text-sm font-bold w-8 text-right tabular-nums', cfg.text)}>{score}</span>
      <span className={clsx('text-xs', cfg.text)}>{cfg.label}</span>
    </div>
  );
}

// ─── Sub-page card — labeled by inferred data source, not raw URL ────────────

function inferSubPageSource(sp: AffiliateSubPage): { label: string; cls: string } {
  if (sp.llmEnriched) return { label: 'LLM Extract', cls: 'bg-purple-900/40 text-purple-300' };
  if (sp.thirdPartySource) return { label: 'PartnerStack', cls: 'bg-emerald-900/40 text-emerald-300' };
  return { label: 'Web Crawl', cls: 'bg-blue-900/40 text-blue-300' };
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

// Table cell — dash for empty, same as Row's alwaysShow behavior but for a <td>.
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  const isEmpty = children === null || children === undefined ||
    (typeof children === 'string' && EMPTY_VALUES.has(children));
  return (
    <td className={clsx('px-3 py-2.5 text-xs align-top', mono && 'font-mono')}>
      {isEmpty ? <span className="text-[var(--text-muted)]">—</span> : children}
    </td>
  );
}

/**
 * Full 9-field table of sub-pages ("web_data" — distinct pages the crawler
 * found on this domain, each independently evaluated for affiliate content),
 * same 9 columns as the top-level "Affiliate Program Details" section so a
 * researcher can compare the parent domain's data against each individual
 * page it came from.
 */
function SubPagesTable({ subPages }: { subPages: AffiliateSubPage[] }) {
  const sorted = [...subPages].sort((a, b) => b.affiliateScore - a.affiliateScore);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
            {['Score', 'Page URL', 'Program Name', 'Signup URL', 'Commission Rate', 'Commission Type', 'Recurring Duration', 'Cookie Duration', 'Payment Terms', 'Affiliate Network'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(sp => {
            const src = inferSubPageSource(sp);
            const scoreColor = sp.affiliateScore >= 70 ? 'text-emerald-400' : sp.affiliateScore >= 40 ? 'text-amber-400' : 'text-red-400';
            return (
              <tr key={sp.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                <td className="px-3 py-2.5 align-top">
                  <span className={clsx('text-xs font-bold tabular-nums', scoreColor)}>{sp.affiliateScore}</span>
                </td>
                <td className="px-3 py-2.5 align-top max-w-[220px]">
                  <a href={sp.pageUrl} target="_blank" rel="noopener noreferrer" title={sp.pageUrl}
                    className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1 hover:opacity-80', src.cls)}>
                    web_data
                    <ExternalLink size={9} className="opacity-60" />
                  </a>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">{sp.pagePath}</p>
                </td>
                <Td>{sp.programName}</Td>
                <Td>{sp.signupUrl ? <ExternalLink_ href={sp.signupUrl} label={safeHostname(sp.signupUrl)} /> : null}</Td>
                <Td mono>{sp.commissionRate ? <span className="text-green-400 font-semibold">{sp.commissionRate}</span> : null}</Td>
                <Td>{sp.commissionType && !EMPTY_VALUES.has(sp.commissionType) ? sp.commissionType : null}</Td>
                <Td>{sp.recurringDuration}</Td>
                <Td>{sp.cookieDays != null ? `${sp.cookieDays}d` : null}</Td>
                <Td>{sp.paymentTerms}</Td>
                <Td>{sp.affiliateNetwork}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── SimilarWeb section — charts + tables ─────────────────────────────────────

function formatVisits(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatSeconds(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];

function TrafficSourcesChart({ sources }: { sources: Record<string, number> }) {
  // Backend's formattedData.trafficSources already returns 0-100 percentages
  // (e.g. { Direct: 65.75, Referral: 17.94 }), not 0-1 fractions — no *100 here.
  const data = Object.entries(sources)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
  if (data.length === 0) return <p className="text-xs text-[var(--text-muted)] px-5 py-4">No traffic source data.</p>;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-4">
      <div style={{ width: 160, height: 160 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5 w-full">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-[var(--text)] capitalize flex-1">{d.name.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-[var(--text-muted)] tabular-nums">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeywordList({ title, keywords }: { title: string; keywords: DomainTrafficKeyword[] | null | undefined }) {
  if (!keywords || keywords.length === 0) return null;
  const top = [...keywords].sort((a, b) => b.volume - a.volume).slice(0, 10);
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-muted)] mb-2">{title}</p>
      <div className="space-y-1">
        {top.map((k) => (
          <div key={k.keyword} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text)] truncate">{k.keyword}</span>
            <span className="text-[var(--text-muted)] font-mono shrink-0">{formatVisits(k.volume)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ trendData }: { trendData: number[] }) {
  if (trendData.length === 0) return null;
  const data = trendData.map((v, i) => ({
    label: `M-${trendData.length - 1 - i}`,
    visits: v,
  }));
  return (
    <div className="px-5 py-4" style={{ height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => formatVisits(v)} width={48} />
          <Tooltip
            formatter={(v) => formatVisits(Number(v))}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Top countries by traffic share — Filters.country carries the id→name map
// SimilarWeb already resolved for this exact response, so no separate
// ISO-code table is needed on our side.
function GeographyTable({ geography }: { geography: DomainTrafficGeography }) {
  const nameById = new Map<string, string>(
    (geography.Filters?.country ?? []).map(c => [c.id, c.formattedText || c.text]),
  );
  const rows = [...(geography.Data ?? [])].sort((a, b) => b.Share - a.Share).slice(0, 10);
  if (rows.length === 0) return <p className="text-xs text-[var(--text-muted)] px-5 py-4">No geography data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Country', 'Share', 'Change', 'Bounce Rate', 'Pages/Visit', 'Avg Duration'].map(h => (
              <th key={h} className="px-5 py-2 text-left font-medium text-[var(--text-muted)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-0">
              <td className="px-5 py-2 text-[var(--text)]">{nameById.get(String(row.Country)) ?? `#${row.Country}`}</td>
              <td className="px-5 py-2 font-mono text-[var(--text)]">{(row.Share * 100).toFixed(1)}%</td>
              <td className="px-5 py-2 font-mono">
                {row.Change >= 0
                  ? <span className="text-green-300">+{(row.Change * 100).toFixed(1)}%</span>
                  : <span className="text-red-300">{(row.Change * 100).toFixed(1)}%</span>}
              </td>
              <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{(row.BounceRate * 100).toFixed(1)}%</td>
              <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{row.PagePerVisit.toFixed(1)}</td>
              <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{formatSeconds(row.AvgVisitDuration)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimilarWebSection({ traffic }: { traffic: DomainTrafficFull | null }) {
  if (!traffic || traffic.lastFetchStatus !== 'success') {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <SectionHeader icon={<BarChart2 size={14} />} title="SimilarWeb Traffic" />
        <p className="px-5 py-4 text-xs text-[var(--text-muted)]">
          {traffic?.lastFetchStatus === 'error'
            ? `No traffic data — last sync failed (${traffic.lastFetchError ?? 'unknown error'}).`
            : traffic?.lastFetchStatus === 'not_found'
              ? 'No traffic data — domain not found on SimilarWeb.'
              : 'No traffic data synced yet for this domain.'}
        </p>
      </div>
    );
  }

  const growth = traffic.last1MonthGrowth;
  const companyInfo = traffic.companyInfo ?? {};

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <SectionHeader
        icon={<BarChart2 size={14} />}
        title="SimilarWeb Traffic"
        right={traffic.fetchedAt && (
          <span className="text-[10px] text-[var(--text-muted)]">
            Synced {new Date(traffic.fetchedAt).toLocaleDateString()}
          </span>
        )}
      />

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 border-b border-[var(--border)]">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Monthly Visits</p>
          <p className="text-lg font-semibold text-[var(--text)] font-mono">{formatVisits(traffic.monthlyVisits ? Number(traffic.monthlyVisits) : null)}</p>
          {growth != null && (
            growth >= 0
              ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-300"><TrendingUp size={11} />{growth.toFixed(1)}%</span>
              : <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-300"><TrendingDown size={11} />{growth.toFixed(1)}%</span>
          )}
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Global Rank</p>
          <p className="text-lg font-semibold text-[var(--text)] font-mono">{traffic.rank != null ? `#${traffic.rank.toLocaleString()}` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Bounce Rate</p>
          <p className="text-lg font-semibold text-[var(--text)] font-mono">{traffic.bounceRate != null ? `${traffic.bounceRate.toFixed(1)}%` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Time on Site</p>
          <p className="text-lg font-semibold text-[var(--text)] font-mono">{formatSeconds(traffic.timeOnSite)}</p>
        </div>
      </div>

      {/* Trend chart */}
      {Array.isArray(traffic.trendData) && traffic.trendData.length > 0 && (
        <div className="border-b border-[var(--border)]">
          <p className="px-5 pt-3 text-xs font-medium text-[var(--text-muted)]">Visits trend (last {traffic.trendData.length} months)</p>
          <TrendChart trendData={traffic.trendData} />
        </div>
      )}

      {/* Traffic sources */}
      {traffic.trafficSources && Object.keys(traffic.trafficSources).length > 0 && (
        <div className="border-b border-[var(--border)]">
          <p className="px-5 pt-3 text-xs font-medium text-[var(--text-muted)]">Traffic sources</p>
          <TrafficSourcesChart sources={traffic.trafficSources} />
        </div>
      )}

      {/* Top keywords — organic vs paid search terms driving traffic */}
      {((traffic.organicKeywords?.length ?? 0) > 0 || (traffic.paidKeywords?.length ?? 0) > 0) && (
        <div className="border-b border-[var(--border)] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KeywordList title="Top Organic Keywords" keywords={traffic.organicKeywords} />
          <KeywordList title="Top Paid Keywords" keywords={traffic.paidKeywords} />
        </div>
      )}

      {/* Engagement metrics — from rawData.engagement, deeper than the top-level columns */}
      {(() => {
        const eng = traffic.rawData?.engagement?.Data?.[0];
        if (!eng) return null;
        return (
          <div className="border-b border-[var(--border)] px-5 py-4">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Engagement</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Unique Users</p>
                <p className="text-sm font-semibold text-[var(--text)] font-mono">{eng.UniqueUsers != null ? formatVisits(Math.round(eng.UniqueUsers)) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Visits / User</p>
                <p className="text-sm font-semibold text-[var(--text)] font-mono">{eng.VisitsPerUser != null ? eng.VisitsPerUser.toFixed(2) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Total Page Views</p>
                <p className="text-sm font-semibold text-[var(--text)] font-mono">{eng.TotalPagesViews != null ? formatVisits(Math.round(eng.TotalPagesViews)) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Avg Visit Duration</p>
                <p className="text-sm font-semibold text-[var(--text)] font-mono">{eng.AvgVisitDuration != null ? formatSeconds(eng.AvgVisitDuration) : '—'}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Geography — top countries by traffic share */}
      {traffic.geography && (
        <div className="border-b border-[var(--border)]">
          <p className="px-5 pt-3 pb-1 text-xs font-medium text-[var(--text-muted)]">Top countries</p>
          <GeographyTable geography={traffic.geography} />
        </div>
      )}

      {/* Category / description / company info */}
      <dl className="px-5 py-3">
        <Row alwaysShow label="Category" value={traffic.category} />
        <Row alwaysShow label="Category Rank" value={traffic.rawData?.categoryRanking != null ? `#${traffic.rawData.categoryRanking.toLocaleString()}` : null} />
        <Row alwaysShow label="Company Size" value={companyInfo.employeeRange ?? null} />
        <Row alwaysShow label="Founded" value={companyInfo.yearFounded ?? null} />
        <Row alwaysShow label="Description" value={traffic.description} />
      </dl>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AffiliateDetailPage() {
  const { domain } = useParams<{ domain: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = (user?.permissions ?? []).includes('all:manage');
  const t  = useTranslations('affiliateDetail');
  const tc = useTranslations('common');

  const [program, setProgram]   = useState<AffiliateProgram | null>(null);
  const [traffic, setTraffic]   = useState<DomainTrafficFull | null>(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);

  const decoded = decodeURIComponent(domain);

  useEffect(() => {
    affiliateApi.get(decoded)
      .then(setProgram)
      .catch((e: Error) => toast(e.message, { type: 'error' }))
      .finally(() => setLoading(false));
    affiliateApi.getDomainTraffic(decoded).then(setTraffic).catch(() => {});
    verificationApi.listByDomain(decoded)
      .then(setVerifications)
      .catch(() => {});
  }, [decoded]);

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm', { domain: decoded }))) return;
    setDeleting(true);
    try {
      await affiliateApi.delete(decoded);
      toast(t('deleteSuccess'), { type: 'success' });
      router.push('/affiliate');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Delete failed', { type: 'error' });
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">{tc('loading')}</div>
  );

  if (!program) return (
    <div className="p-6 space-y-3">
      <p className="text-red-400">{t('notFound')} <span className="font-mono">{decoded}</span></p>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => router.push('/affiliate')}>
        {tc('back')}
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => router.push('/affiliate')}>
          {tc('back')}
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold font-mono text-[var(--text)]">{program.domain}</h1>
            {program.signupUrlVerified && <BadgeCheck size={18} className="text-emerald-400" />}
            {program.llmEnriched && <Sparkles size={15} className="text-purple-400" />}
            <a
              href={googleSearchUrl(program.domain, program.programName)}
              target="_blank"
              rel="noopener noreferrer"
              title="Research on Google"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              <Search size={15} />
            </a>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{program.programName ?? t('unknownProgram')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {program.signupUrl && (
            <a href={program.signupUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>{t('signup')}</Button>
            </a>
          )}
          {isSuperAdmin && (
            <Button variant="ghost" size="sm" icon={<Code2 size={13} />} onClick={() => router.push(`/affiliate/dev/${encodeURIComponent(decoded)}`)}>
              Dev View
            </Button>
          )}
          {isSuperAdmin && (
            <Button variant="danger" size="sm" loading={deleting} icon={<Trash2 size={13} />} onClick={handleDelete}>
              {tc('delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Score + status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">{t('labels.score')}</p>
          <ScoreGauge score={program.affiliateScore} />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">{t('labels.status')}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={program.commissionType === 'recurring' ? 'success' : program.commissionType === 'one_time' ? 'accent' : 'muted'}>
              {program.commissionType === 'one_time' ? 'One-time' : program.commissionType === 'recurring' ? 'Recurring' : 'Unknown type'}
            </Badge>
            <Badge variant={program.signupUrlVerified ? 'success' : 'muted'}>
              {program.signupUrlVerified
                ? <span className="flex items-center gap-1"><CheckCircle2 size={11} />{t('urlVerified')}</span>
                : <span className="flex items-center gap-1"><XCircle size={11} />{t('urlUnverified')}</span>}
            </Badge>
            {program.llmEnriched && <Badge variant="accent"><span className="flex items-center gap-1"><Sparkles size={10} />{t('llmEnriched')}</span></Badge>}
            {program.affiliateNetwork && <Badge variant="default">{program.affiliateNetwork}</Badge>}
          </div>
        </div>
      </div>

      {/* 9 core affiliate content fields */}
      <Section icon={<Globe size={14} />} title="Affiliate Program Details">
        <Row alwaysShow label="Program Name" value={program.programName} />
        <Row alwaysShow label={t('labels.signupUrl')} value={program.signupUrl ? (
          <span className="flex items-center gap-2 flex-wrap">
            <ExternalLink_ href={program.signupUrl} />
            {program.signupUrlVerified
              ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300"><CheckCircle2 size={9} />Verified</span>
              : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300"><XCircle size={9} />Unverified</span>}
          </span>
        ) : null} />
        <Row alwaysShow label={t('labels.commissionRate')} value={program.commissionRate ? <span className="text-green-400 font-semibold">{program.commissionRate}</span> : null} />
        <Row alwaysShow label={t('labels.commissionType')} value={program.commissionType && !EMPTY_VALUES.has(program.commissionType) ? program.commissionType : null} />
        <Row alwaysShow label={t('labels.recurringDuration')} value={program.recurringDuration && !EMPTY_VALUES.has(program.recurringDuration) ? program.recurringDuration : null} />
        <Row alwaysShow label={t('labels.cookieDuration')} value={program.cookieDays != null ? (
          <span className={program.cookieDays >= 60 ? 'text-emerald-400' : program.cookieDays >= 30 ? 'text-green-400' : program.cookieDays >= 14 ? 'text-amber-400' : 'text-orange-400'}>
            {t('days', { count: program.cookieDays })}
          </span>
        ) : null} />
        <Row alwaysShow label={t('labels.paymentTerms')} value={program.paymentTerms && !EMPTY_VALUES.has(program.paymentTerms) ? program.paymentTerms : null} />
        <Row alwaysShow label={t('labels.affiliateNetwork')} value={program.affiliateNetwork} />
        <Row alwaysShow label={t('labels.networkUrl')} value={program.affiliateNetworkUrl ? <ExternalLink_ href={program.affiliateNetworkUrl} label={program.affiliateNetwork ?? program.affiliateNetworkUrl} /> : null} />
      </Section>

      {/* SimilarWeb traffic analysis */}
      <SimilarWebSection traffic={traffic} />

      {/* Sub programs (web_data) — same 9 fields as the parent, per discovered page */}
      {Array.isArray(program.subPages) && program.subPages.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader
            icon={<Layers size={14} />}
            title={`Sub Programs — web_data (${program.subPages.length}${program.subProgramCount && program.subProgramCount > program.subPages.length ? ` of ${program.subProgramCount}` : ''})`}
          />
          <SubPagesTable subPages={program.subPages} />
        </div>
      )}

      {/* Timeline + user verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader icon={<Clock size={14} />} title={t('sections.timeline')} />
          <dl className="px-5">
            <Row label={t('labels.firstCrawled')} value={program.crawledAt ? new Date(program.crawledAt).toLocaleString() : null} />
            <Row label={t('labels.lastUpdated')}  value={program.updatedAt  ? new Date(program.updatedAt).toLocaleString()  : null} />
            {program.signupUrlVerified && (
              <Row label={t('labels.lastVerified')} value={program.lastVerifiedAt ? new Date(program.lastVerifiedAt).toLocaleString() : null} />
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader icon={<Users size={14} />} title={t('sections.userVerifications')} />
          {verifications.length === 0 ? (
            <p className="px-5 py-4 text-xs text-[var(--text-muted)]">{t('noVerifications')}</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {verifications.map((v) => {
                const optionColors: Record<number, string> = {
                  1: 'text-emerald-400', 2: 'text-red-400', 3: 'text-amber-400', 4: 'text-[var(--text-muted)]',
                };
                const optionIcons: Record<number, string> = { 1: '✓', 2: '✗', 3: '~', 4: '?' };
                return (
                  <div key={v.userId} className="flex items-start gap-3 px-5 py-3 text-sm">
                    <span className={clsx('text-base font-bold w-5 shrink-0 text-center', optionColors[v.option])}>
                      {optionIcons[v.option]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--text)]">{v.username}</span>
                        <span className={clsx('text-xs font-semibold', optionColors[v.option])}>
                          {t(`verify.option${v.option}`)}
                        </span>
                      </div>
                      {v.note && <p className="mt-0.5 text-xs text-[var(--text-muted)] break-words">{v.note}</p>}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums">
                      {new Date(v.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
