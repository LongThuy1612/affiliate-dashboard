'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { affiliateApi, AffiliateProgram, AffiliateSubPage, AffiliateFetchLog, verificationApi, DomainVerification, RawHtmlResult, FetchDomResult, NetworkRequest } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, ExternalLink, Trash2, CheckCircle2, XCircle,
  BadgeCheck, Sparkles, Globe, Link2, Clock, RefreshCw,
  Database, Cpu, Hash, BarChart2, ShieldCheck, Activity, Users, Layers,
  TrendingUp, Camera, Code2, Network,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Fetch-tier helpers ───────────────────────────────────────────────────────

const TIER_META: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: 'Axios',        icon: '⚡', color: 'text-blue-400'   },
  2: { label: 'Playwright',   icon: '🎭', color: 'text-amber-400'  },
  3: { label: 'FlareSolverr', icon: '🔥', color: 'text-orange-400' },
};

function FetchTierBadge({ tier, success }: { tier: number; success: boolean }) {
  const meta = TIER_META[tier] ?? { label: `T${tier}`, icon: '?', color: 'text-gray-400' };
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded',
      success ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/30 text-red-300',
    )}>
      <span>{meta.icon}</span>
      <span>T{tier} {meta.label}</span>
      {success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
    </span>
  );
}

function FetchLogRow({ log }: { log: AffiliateFetchLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={clsx(
      'border-b border-[var(--border)] last:border-0 py-2 px-4 text-xs',
      log.success ? '' : 'bg-red-950/10',
    )}>
      <div className="flex items-start gap-3 flex-wrap">
        <FetchTierBadge tier={log.tier} success={log.success} />
        {log.durationMs != null && (
          <span className="text-[var(--text-muted)] tabular-nums">{log.durationMs}ms</span>
        )}
        {log.errorCode && (
          <span className="font-mono text-red-400 font-semibold">{log.errorCode}</span>
        )}
        <span className="text-[var(--text-muted)] truncate max-w-[280px]" title={log.url}>
          {log.url}
        </span>
        <span className="ml-auto text-[var(--text-muted)] shrink-0">
          {new Date(log.crawledAt).toLocaleTimeString()}
        </span>
      </div>
      {log.errorMsg && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-2 hover:underline"
        >
          {expanded ? '▲ hide msg' : '▼ show msg'}
        </button>
      )}
      {expanded && log.errorMsg && (
        <pre className="mt-1 text-[10px] font-mono text-red-300 whitespace-pre-wrap break-all bg-red-950/20 rounded p-2">
          {log.errorMsg}
        </pre>
      )}
    </div>
  );
}

const EMPTY_VALUES = new Set(['', 'null', 'undefined', 'n/a', 'N/A', 'unknown']);

// ─── Field-source helpers ─────────────────────────────────────────────────────

type FieldSrc = 'web' | 'llm' | 'partnerstack' | null;

function FieldSrcTag({ src, url }: { src: FieldSrc; url?: string }) {
  if (src === 'web')
    return (
      <span title={url ?? 'Web crawl'} className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 cursor-default shrink-0">
        🌐 Web
      </span>
    );
  if (src === 'llm')
    return (
      <span title="Added / enriched by LLM" className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 cursor-default shrink-0">
        ✨ LLM
      </span>
    );
  if (src === 'partnerstack')
    return (
      <span title="From PartnerStack API" className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 cursor-default shrink-0">
        🔗 PS
      </span>
    );
  return null;
}

function resolveFieldSrc(
  parentVal: string | number | null | undefined,
  subVal: string | number | null | undefined,
  hasLlm: boolean,
  hasPS: boolean,
): FieldSrc {
  if (!parentVal && parentVal !== 0) return null;
  const pStr = String(parentVal).trim().toLowerCase();
  const sStr = String(subVal ?? '').trim().toLowerCase();
  // Sub-page raw extraction had the same non-empty value → came from web crawl
  if (sStr && sStr !== 'unknown' && sStr === pStr) return 'web';
  // Sub-page had nothing / "unknown" but parent has value → enriched later
  if (hasPS) return 'partnerstack';
  if (hasLlm) return 'llm';
  return 'web';
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && EMPTY_VALUES.has(value)) return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-[var(--border)] last:border-0">
      <dt className="w-44 shrink-0 text-xs text-[var(--text-muted)] pt-0.5">{label}</dt>
      <dd className={clsx('flex-1 text-sm text-[var(--text)] break-all', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}

function SubPageCard({ sp }: { sp: AffiliateSubPage }) {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const scoreColor = sp.affiliateScore >= 70 ? 'text-emerald-400' : sp.affiliateScore >= 40 ? 'text-amber-400' : 'text-red-400';

  async function loadScreenshot() {
    if (imgUrl || imgLoading) return;
    setImgLoading(true);
    const url = await affiliateApi.getSubPageScreenshot(sp.id);
    setImgUrl(url);
    setImgLoading(false);
  }

  return (
    <div className="border-b border-[var(--border)] last:border-0 px-5 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={clsx('text-xs font-bold tabular-nums w-6 text-right', scoreColor)}>{sp.affiliateScore}</span>
        <a
          href={sp.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-[var(--text)] hover:text-indigo-400 flex-1 min-w-0 truncate flex items-center gap-1"
          title={sp.pageUrl}
        >
          {sp.pageUrl}
          <ExternalLink size={10} className="shrink-0 opacity-50" />
        </a>
        {sp.hasSignupForm && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">
            {sp.signupFormType ?? 'form'}
          </span>
        )}
        {sp.affiliateNetwork && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300">{sp.affiliateNetwork}</span>
        )}
        {sp.commissionRate && (
          <span className="text-xs text-green-400 font-semibold shrink-0">{sp.commissionRate}</span>
        )}
        {sp.screenshotPath && !imgUrl && (
          <button
            onClick={() => { setOpen(true); loadScreenshot(); }}
            className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 shrink-0"
            title="Load screenshot"
          >
            <Camera size={11} />
          </button>
        )}
        <button onClick={() => setOpen(v => !v)} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-2 hover:underline shrink-0">
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        <div className="mt-2 pl-9 space-y-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {sp.programName && <><dt className="text-[var(--text-muted)]">Program</dt><dd className="text-[var(--text)]">{sp.programName}</dd></>}
            {sp.commissionType && <><dt className="text-[var(--text-muted)]">Type</dt><dd className="text-[var(--text)]">{sp.commissionType}</dd></>}
            {sp.cookieDays != null && <><dt className="text-[var(--text-muted)]">Cookie</dt><dd className="text-[var(--text)]">{sp.cookieDays}d</dd></>}
            {sp.paymentTerms && <><dt className="text-[var(--text-muted)]">Payment</dt><dd className="text-[var(--text)]">{sp.paymentTerms}</dd></>}
            {sp.signupUrl && (
              <><dt className="text-[var(--text-muted)]">Signup</dt>
              <dd><a href={sp.signupUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate block max-w-[200px]">{sp.signupUrl}</a></dd></>
            )}
            <><dt className="text-[var(--text-muted)]">Confidence</dt><dd className="text-[var(--text)]">{Math.round(sp.confidence * 100)}%</dd></>
          </dl>
          {sp.screenshotPath && (
            <div>
              {!imgUrl && !imgLoading && (
                <button
                  onClick={loadScreenshot}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-700/40 rounded px-2 py-1"
                >
                  <Camera size={12} /> Load screenshot
                </button>
              )}
              {imgLoading && <p className="text-xs text-[var(--text-muted)] animate-pulse">Loading screenshot…</p>}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={`Screenshot of ${sp.pageUrl}`}
                  className="rounded border border-[var(--border)] max-w-full mt-1"
                  style={{ maxHeight: 320, objectFit: 'cover', objectPosition: 'top' }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
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

function ConfidenceGauge({ value }: { value: number | null | undefined }) {
  if (value == null || isNaN(value)) {
    return <span className="text-sm text-[var(--text-muted)]">—</span>;
  }
  const pct   = Math.round(value * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const text  = pct >= 70 ? 'text-green-300' : pct >= 40 ? 'text-amber-300' : 'text-red-300';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={clsx('text-sm font-bold w-8 text-right tabular-nums', text)}>{pct}%</span>
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

// ─── Score breakdown ─────────────────────────────────────────────────────────

interface ScoreFactor { label: string; earned: number; max: number; color: string }

function calcScoreBreakdown(p: AffiliateProgram): ScoreFactor[] {
  const crawlCount      = p.crawlCount      ?? 0;
  const rateChangeCount = p.rateChangeCount ?? 0;
  const rateStability   = crawlCount <= 1 || rateChangeCount === 0 ? 5 : rateChangeCount === 1 ? 2 : 0;
  return [
    { label: 'Commission Rate',  earned: p.commissionRate   ? 22 : 0,  max: 22, color: 'bg-green-500'   },
    { label: 'Network Platform', earned: p.affiliateNetwork ? 15 : 0,  max: 15, color: 'bg-blue-500'    },
    { label: 'Program Name',     earned: p.programName      ?  5 : 0,  max:  5, color: 'bg-indigo-400'  },
    { label: 'Signup URL',       earned: p.signupUrl        ?  3 : 0,  max:  3, color: 'bg-cyan-500'    },
    { label: 'URL Verified',     earned: p.signupUrlVerified ?  7 : 0, max:  7, color: 'bg-emerald-500' },
    { label: 'Cookie Window',    earned: p.cookieDays ? (p.cookieDays >= 90 ? 12 : p.cookieDays >= 30 ? 8 : 4) : 0, max: 12, color: 'bg-amber-500' },
    { label: 'Commission Type',  earned: (p.commissionType && p.commissionType !== 'unknown') ? 8 : 0,  max:  8, color: 'bg-purple-500'  },
    { label: 'Recurring Terms',  earned: p.recurringDuration ? (/lifetime/i.test(p.recurringDuration) ? 8 : 5) : 0, max: 8, color: 'bg-violet-500' },
    { label: 'Payment Terms',    earned: p.paymentTerms     ?  8 : 0,  max:  8, color: 'bg-orange-500'  },
    { label: 'Data Enrichment',  earned: (p.dataSource && p.dataSource !== 'web_crawl') ? 4 : 0, max: 4, color: 'bg-pink-500'    },
    { label: 'Screenshot',       earned: p.screenshotPath   ?  3 : 0,  max:  3, color: 'bg-rose-400'    },
    { label: 'Rate Stability',   earned: rateStability,                max:  5, color: 'bg-teal-500'    },
  ];
}

function ScoreBreakdown({ program }: { program: AffiliateProgram }) {
  const factors = calcScoreBreakdown(program);
  const total = factors.reduce((s, f) => s + f.earned, 0);
  // Authoritative score comes from the backend — the FE breakdown is an approximation.
  const backendScore = program.affiliateScore ?? 0;
  const drift = Math.abs(total - backendScore);
  return (
    <div className="mt-3 space-y-1.5">
      {factors.map(f => (
        <div key={f.label} className="flex items-center gap-2 text-xs">
          <span className="w-[120px] shrink-0 text-[var(--text-muted)]">{f.label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className={clsx('h-full rounded-full', f.earned > 0 ? f.color : '')}
              style={{ width: f.max > 0 ? `${(f.earned / f.max) * 100}%` : '0%' }}
            />
          </div>
          <span className={clsx('w-10 text-right tabular-nums shrink-0', f.earned > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>
            {f.earned}/{f.max}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-xs font-semibold">
        <span className="text-[var(--text-muted)]">Total (estimate)</span>
        <div className="flex items-center gap-2">
          {drift > 5 && (
            <span className="text-[10px] text-amber-400 font-normal" title={`Backend score: ${backendScore}`}>
              ≈ (actual: {backendScore})
            </span>
          )}
          <span className={clsx(backendScore >= 70 ? 'text-emerald-300' : backendScore >= 50 ? 'text-amber-300' : 'text-red-300')}>
            {backendScore} / 100
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDetailPage() {
  const { domain } = useParams<{ domain: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = (user?.permissions ?? []).includes('all:manage');
  const t  = useTranslations('affiliateDetail');
  const tc = useTranslations('common');

  const [program, setProgram]     = useState<AffiliateProgram | null>(null);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [showRaw, setShowRaw]     = useState(false);
  const [fetchLogs, setFetchLogs] = useState<AffiliateFetchLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs]   = useState(false);
  const [verifications, setVerifications] = useState<DomainVerification[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  // Raw HTML state
  const [rawHtmlData, setRawHtmlData]       = useState<RawHtmlResult | null>(null);
  const [rawHtmlLoading, setRawHtmlLoading] = useState(false);
  const [rawHtmlTab, setRawHtmlTab]         = useState<'html' | 'text'>('text');
  const [rawHtmlPath, setRawHtmlPath]       = useState('/');

  // DOM + Network state
  const [domData, setDomData]         = useState<FetchDomResult | null>(null);
  const [domLoading, setDomLoading]   = useState(false);
  const [domTab, setDomTab]           = useState<'dom' | 'network' | 'meta' | 'footer' | 'nav'>('network');
  const [netFilter, setNetFilter]     = useState<string>('all');
  const [domPath, setDomPath]         = useState('/');

  const decoded = decodeURIComponent(domain);

  useEffect(() => {
    affiliateApi.get(decoded)
      .then(setProgram)
      .catch((e: Error) => toast(e.message, { type: 'error' }))
      .finally(() => setLoading(false));
    verificationApi.listByDomain(decoded)
      .then(setVerifications)
      .catch(() => {});
  }, [decoded]);

  const loadScreenshot = async () => {
    if (screenshotUrl) return;
    setScreenshotLoading(true);
    const url = await affiliateApi.getScreenshot(decoded).catch(() => null);
    setScreenshotUrl(url);
    setScreenshotLoading(false);
  };

  const loadFetchLogs = async () => {
    if (fetchLogs.length > 0) { setShowLogs(v => !v); return; }
    setLogsLoading(true);
    try {
      const res = await affiliateApi.fetchLogs(decoded, 100);
      setFetchLogs(res.rows);
      setShowLogs(true);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Không thể tải fetch logs', { type: 'error' });
    } finally { setLogsLoading(false); }
  };

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

  const allSignupUrls  = Array.isArray(program.allSignupUrls) ? program.allSignupUrls as string[] : [];
  const sourceUrls     = Array.isArray(program.sourceUrls)    ? program.sourceUrls    as string[] : [];
  const primaryHttpUrl = sourceUrls.find(u => u.startsWith('http'));
  const hasLlm         = sourceUrls.some(u => u.startsWith('llm:'));
  const hasPS          = sourceUrls.some(u => u.startsWith('partnerstack:'));
  const primarySubPage = primaryHttpUrl && Array.isArray(program.subPages)
    ? program.subPages.find(sp => sp.pageUrl === primaryHttpUrl)
    : undefined;

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
            <Button variant="danger" size="sm" loading={deleting} icon={<Trash2 size={13} />} onClick={handleDelete}>
              {tc('delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Overview gauges + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">{t('labels.score')}</p>
          <ScoreGauge score={program.affiliateScore} />
          <ScoreBreakdown program={program} />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">{t('labels.confidence')}</p>
          <ConfidenceGauge value={program.confidence} />
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
            <Badge variant="muted">{t('tier')}: {program.fingerprintTier}</Badge>
            <Badge variant="muted">{t('crawledTimes', { count: program.crawlCount })}</Badge>
          </div>
        </div>
      </div>

      {/* Commission & Payout */}
      <Section icon={<BarChart2 size={14} />} title={t('sections.commission')}>
        {primaryHttpUrl && (() => {
          let isMainPage = false;
          try {
            const p = new URL(primaryHttpUrl).pathname.toLowerCase();
            isMainPage = p === '/' || /^\/(affiliat|partner|refer|earn|ambassador|resell)/i.test(p);
          } catch { /* ignore */ }
          return (
            <Row label="Data from" value={
              <span className="flex items-center gap-2 flex-wrap">
                <ExternalLink_ href={primaryHttpUrl} label={(() => { try { return new URL(primaryHttpUrl).pathname || '/'; } catch { return primaryHttpUrl; } })()} />
                <span className={clsx(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  isMainPage ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'
                )}>
                  {isMainPage ? 'Main page' : 'Sub-page'}
                </span>
              </span>
            } />
          );
        })()}
        <Row label={t('labels.commissionRate')} value={program.commissionRate ? (
          <span className="flex items-center gap-2">
            <span className="text-green-400 font-semibold">{program.commissionRate}</span>
            <FieldSrcTag src={resolveFieldSrc(program.commissionRate, primarySubPage?.commissionRate, hasLlm, hasPS)} url={primaryHttpUrl} />
          </span>
        ) : null} />
        <Row label={t('labels.commissionType')} value={program.commissionType && !EMPTY_VALUES.has(program.commissionType) ? (
          <span className="flex items-center gap-2">
            {program.commissionType}
            <FieldSrcTag src={resolveFieldSrc(program.commissionType, primarySubPage?.commissionType, hasLlm, hasPS)} url={primaryHttpUrl} />
          </span>
        ) : null} />
        <Row label={t('labels.recurringDuration')} value={program.recurringDuration && !EMPTY_VALUES.has(program.recurringDuration) ? (
          <span className="flex items-center gap-2">
            {program.recurringDuration}
            <FieldSrcTag src={resolveFieldSrc(program.recurringDuration, primarySubPage?.recurringDuration, hasLlm, hasPS)} url={primaryHttpUrl} />
          </span>
        ) : null} />
        <Row label={t('labels.cookieDuration')} value={program.cookieDays != null ? (
          <span className="flex items-center gap-2">
            <span className={program.cookieDays >= 60 ? 'text-emerald-400' : program.cookieDays >= 30 ? 'text-green-400' : program.cookieDays >= 14 ? 'text-amber-400' : 'text-orange-400'}>
              {t('days', { count: program.cookieDays })}
            </span>
            <FieldSrcTag src={resolveFieldSrc(program.cookieDays, primarySubPage?.cookieDays, hasLlm, hasPS)} url={primaryHttpUrl} />
          </span>
        ) : null} />
        <Row label={t('labels.paymentTerms')} value={program.paymentTerms && !EMPTY_VALUES.has(program.paymentTerms) ? (
          <span className="flex items-center gap-2">
            {program.paymentTerms}
            <FieldSrcTag src={resolveFieldSrc(program.paymentTerms, primarySubPage?.paymentTerms, hasLlm, hasPS)} url={primaryHttpUrl} />
          </span>
        ) : null} />
      </Section>

      {/* URLs */}
      <Section icon={<Globe size={14} />} title={t('sections.urls')}>
        <Row label={t('labels.signupUrl')} value={program.signupUrl ? (
          <span className="flex items-center gap-2 flex-wrap">
            <ExternalLink_ href={program.signupUrl} />
            {program.signupUrlVerified
              ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300"><CheckCircle2 size={9} />Verified</span>
              : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300"><XCircle size={9} />Unverified</span>}
          </span>
        ) : null} />
        <Row label={t('labels.loginPage')} value={program.loginPageUrl ? <ExternalLink_ href={program.loginPageUrl} /> : null} />
        <Row label={t('labels.networkUrl')} value={program.affiliateNetworkUrl ? <ExternalLink_ href={program.affiliateNetworkUrl} label={program.affiliateNetwork ?? program.affiliateNetworkUrl} /> : null} />
        {allSignupUrls.length > 1 && (
          <Row label={t('labels.allSignupUrls', { count: allSignupUrls.length })} value={
            <ul className="space-y-1">
              {allSignupUrls.filter(u => u && u.startsWith('http')).map((u, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ExternalLink_ href={u} />
                  {u === program.signupUrl && !program.signupUrlVerified && (
                    <span className="text-[10px] text-amber-400">unverified</span>
                  )}
                </li>
              ))}
            </ul>
          } />
        )}
      </Section>

      {/* Data Quality */}
      <Section icon={<ShieldCheck size={14} />} title={t('sections.dataQuality')}>
        <Row label={t('labels.dataSource')}      value={program.dataSource} />
        <Row label={t('labels.affiliateNetwork')} value={program.affiliateNetwork} />
        <Row label={t('labels.fingerprintTier')} value={program.fingerprintTier} />
        <Row label={t('labels.llmEnriched')}     value={program.llmEnriched ? tc('yes') : tc('no')} />
        <Row label={t('labels.urlVerified')}     value={program.signupUrlVerified ? tc('yes') : tc('no')} />
        <Row label={t('labels.score')}           value={String(program.affiliateScore)} />
        <Row label={t('labels.confidence')}      value={`${Math.round(program.confidence * 100)}%`} />
        <Row label={t('labels.crawlCount')}      value={String(program.crawlCount)} />
      </Section>

      {/* Timeline */}
      <Section icon={<Clock size={14} />} title={t('sections.timeline')}>
        <Row label={t('labels.firstCrawled')} value={program.crawledAt ? new Date(program.crawledAt).toLocaleString() : null} />
        <Row label={t('labels.lastUpdated')}  value={program.updatedAt  ? new Date(program.updatedAt).toLocaleString()  : null} />
        {program.signupUrlVerified && (
          <Row label={t('labels.lastVerified')} value={program.lastVerifiedAt ? new Date(program.lastVerifiedAt).toLocaleString() : null} />
        )}
      </Section>

      {/* Source URLs */}
      {sourceUrls.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader icon={<Link2 size={14} />} title={t('sections.sourceUrls', { count: sourceUrls.length })} />
          <ul className="px-5 py-3 space-y-1.5">
            {sourceUrls.map((u, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-xs text-[var(--text-muted)] tabular-nums w-5 shrink-0 pt-0.5">{i + 1}.</span>
                {u.startsWith('http')
                  ? <ExternalLink_ href={u} />
                  : <span className="text-xs font-mono text-[var(--text-muted)] break-all">{u}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw Data */}
      {program.rawAffiliateData && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Database size={14} />
              <span className="text-sm font-semibold text-[var(--text)]">{t('sections.rawData')}</span>
            </div>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={() => setShowRaw(v => !v)}>
              {showRaw ? tc('hide') : tc('show')}
            </Button>
          </div>
          {showRaw && (
            <pre className="px-5 py-4 text-xs font-mono text-green-300 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
              {typeof program.rawAffiliateData === 'string'
                ? program.rawAffiliateData
                : JSON.stringify(program.rawAffiliateData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Fetch Tier Logs */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">Fetch Tier Logs</h3>
            {program.fetchTierReached != null && (
              <span className={clsx(
                'text-[10px] font-bold px-1.5 py-0.5 rounded ml-1',
                program.fetchTierReached === 1 ? 'bg-blue-900/40 text-blue-300' :
                program.fetchTierReached === 2 ? 'bg-amber-900/40 text-amber-300' :
                                                  'bg-orange-900/40 text-orange-300',
              )}>
                {TIER_META[program.fetchTierReached]?.icon} T{program.fetchTierReached} {TIER_META[program.fetchTierReached]?.label}
              </span>
            )}
            {program.lastFetchError && (
              <span className="text-[10px] font-mono text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded">
                {program.lastFetchError}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" loading={logsLoading}
            icon={<RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />}
            onClick={loadFetchLogs}>
            {showLogs ? 'Hide' : 'Show logs'}
          </Button>
        </div>
        {showLogs && (
          fetchLogs.length === 0
            ? (
              <div className="px-5 py-4 space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Chưa có fetch log nào cho domain này.</p>
                <p className="text-[11px] text-[var(--text-muted)] opacity-70">
                  Log được ghi khi crawl domain — nhấn <strong>Crawl</strong> để tạo log mới.
                </p>
              </div>
            )
            : <div className="divide-y divide-[var(--border)]">
                {fetchLogs.map(log => <FetchLogRow key={log.id} log={log} />)}
              </div>
        )}
      </div>

      {/* Sub Programs */}
      {Array.isArray(program.subPages) && program.subPages.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader
            icon={<Layers size={14} />}
            title={`Sub Programs (${program.subPages.length}${program.subProgramCount && program.subProgramCount > program.subPages.length ? ` of ${program.subProgramCount}` : ''})`}
          />
          <div className="text-[10px] text-[var(--text-muted)] px-5 pt-2 pb-1">
            Distinct affiliate sub-pages discovered during crawl, sorted by score.
          </div>
          <div>
            {[...program.subPages]
              .sort((a, b) => b.affiliateScore - a.affiliateScore)
              .map(sp => <SubPageCard key={sp.id} sp={sp} />)}
          </div>
        </div>
      )}

      {/* Rate History + Screenshot */}
      {(Array.isArray(program.rateHistory) && program.rateHistory.length > 0) || program.screenshotAt ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.isArray(program.rateHistory) && program.rateHistory.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <SectionHeader icon={<TrendingUp size={14} />} title={`Rate History${program.rateChangeCount ? ` — ${program.rateChangeCount} change${program.rateChangeCount > 1 ? 's' : ''}` : ' — stable'}`} />
              <div className="px-5 py-3 space-y-2">
                {program.rateHistory.map((entry, i) => {
                  const prev = program.rateHistory![i + 1];
                  const changed = prev && entry.rate !== prev.rate;
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="text-[var(--text-muted)] tabular-nums w-32 shrink-0">
                        {new Date(entry.crawledAt).toLocaleDateString()}
                      </span>
                      <span className={clsx(
                        'font-semibold font-mono',
                        entry.rate ? (i === 0 ? 'text-green-400' : 'text-[var(--text)]') : 'text-[var(--text-muted)]'
                      )}>
                        {entry.rate ?? 'n/a'}
                      </span>
                      <span className="text-[var(--text-muted)]">{entry.type}</span>
                      {changed && (
                        <span className="text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-900/30">changed</span>
                      )}
                      {i === 0 && <span className="text-[10px] text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-900/30">latest</span>}
                    </div>
                  );
                })}
                <p className="text-[10px] text-[var(--text-muted)] pt-1">
                  {program.rateChangeCount === 0
                    ? 'Rate has been consistent across all crawls — high reliability.'
                    : program.rateChangeCount! <= 2
                      ? 'Rate changed occasionally — verify before using.'
                      : 'Rate changed frequently — low reliability, manual verification recommended.'}
                </p>
              </div>
            </div>
          )}

          {program.screenshotAt && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center gap-2">
                  <Camera size={14} className="text-[var(--text-muted)]" />
                  <h3 className="text-sm font-semibold text-[var(--text)]">Screenshot</h3>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(program.screenshotAt).toLocaleString()}
                  </span>
                </div>
                <Button variant="ghost" size="sm" loading={screenshotLoading}
                  icon={<RefreshCw size={12} className={screenshotLoading ? 'animate-spin' : ''} />}
                  onClick={loadScreenshot}>
                  {screenshotUrl ? 'Reload' : 'Load'}
                </Button>
              </div>
              {screenshotUrl ? (
                <div className="p-3">
                  <img
                    src={screenshotUrl}
                    alt={`Screenshot of ${decoded}`}
                    className="w-full rounded border border-[var(--border)] object-top"
                    style={{ maxHeight: 480, objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <p className="px-5 py-4 text-xs text-[var(--text-muted)]">
                  Click &quot;Load&quot; to view the captured page screenshot.
                </p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Content Hash + User Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {program.contentHash && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <SectionHeader icon={<Hash size={14} />} title={t('sections.contentHash')} />
            <div className="px-5 py-3">
              <code className="text-xs font-mono text-[var(--text-muted)] break-all">{program.contentHash}</code>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <SectionHeader icon={<Users size={14} />} title={t('sections.userVerifications')} />
          {verifications.length === 0 ? (
            <p className="px-5 py-4 text-xs text-[var(--text-muted)]">{t('noVerifications')}</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {verifications.map((v) => {
              const optionColors: Record<number, string> = {
                1: 'text-emerald-400',
                2: 'text-red-400',
                3: 'text-amber-400',
                4: 'text-[var(--text-muted)]',
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
                    {v.note && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] break-words">{v.note}</p>
                    )}
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

      {/* ── Raw HTML Viewer ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <Code2 size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">Raw HTML (Tier-1 Axios)</h3>
            {rawHtmlData && (
              <span className={clsx(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                rawHtmlData.status === 200 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300',
              )}>
                HTTP {rawHtmlData.status ?? 'err'} · {(rawHtmlData.htmlLength / 1024).toFixed(1)} KB
                {rawHtmlData.truncated && ' (truncated)'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="rounded border bg-[var(--surface)] border-[var(--border)] px-2 py-1 text-xs text-[var(--text)] w-28 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="path e.g. /affiliates"
              value={rawHtmlPath}
              onChange={e => setRawHtmlPath(e.target.value)}
            />
            <Button variant="ghost" size="sm" loading={rawHtmlLoading}
              icon={<RefreshCw size={12} className={rawHtmlLoading ? 'animate-spin' : ''} />}
              onClick={async () => {
                setRawHtmlLoading(true);
                try { setRawHtmlData(await affiliateApi.rawHtml(decoded, rawHtmlPath || '/')); }
                catch (e: unknown) { toast(e instanceof Error ? e.message : 'Failed', { type: 'error' }); }
                finally { setRawHtmlLoading(false); }
              }}>
              Fetch
            </Button>
          </div>
        </div>
        {rawHtmlData && (
          <div>
            <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-[var(--border)]">
              {(['text', 'html'] as const).map(tab => (
                <button key={tab} onClick={() => setRawHtmlTab(tab)}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors',
                    rawHtmlTab === tab
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
                  )}>
                  {tab === 'text' ? 'Plain Text (LLM input)' : 'Raw HTML'}
                </button>
              ))}
            </div>
            {rawHtmlData.errorMsg && (
              <p className="px-5 py-2 text-xs text-red-400 font-mono">{rawHtmlData.errorMsg}</p>
            )}
            {rawHtmlData.finalUrl !== rawHtmlData.url && (
              <p className="px-5 py-1.5 text-[11px] text-amber-400">
                Redirected → <span className="font-mono">{rawHtmlData.finalUrl}</span>
              </p>
            )}
            <pre className="px-5 py-4 text-xs font-mono text-green-300 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap break-all">
              {rawHtmlTab === 'text'
                ? (rawHtmlData.plainText || '(no text extracted)')
                : (rawHtmlData.html      || '(no HTML returned)')}
            </pre>
            <p className="px-5 pb-3 text-[10px] text-[var(--text-muted)]">
              Fetched {new Date(rawHtmlData.fetchedAt).toLocaleString()} · {rawHtmlData.htmlLength.toLocaleString()} bytes raw
              {rawHtmlData.truncated && ' · truncated at 150 KB'}
            </p>
          </div>
        )}
        {!rawHtmlData && !rawHtmlLoading && (
          <p className="px-5 py-4 text-xs text-[var(--text-muted)]">
            Click <strong>Fetch</strong> to live-fetch the page via Axios (Tier 1) and see exactly what the crawler receives — the same text that gets sent to LLM extraction.
          </p>
        )}
      </div>

      {/* ── DOM + Network Inspector ───────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">DOM + Network (Playwright)</h3>
            {domData && (
              <span className={clsx(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                domData.status === 'ok'           ? 'bg-emerald-900/40 text-emerald-300'
                : domData.status === 'cf_challenge' ? 'bg-orange-900/40 text-orange-300'
                : 'bg-red-900/40 text-red-300',
              )}>
                {domData.status === 'ok' ? '✓ OK' : domData.status === 'cf_challenge' ? '⚠ CF Challenge' : '✗ Error'} · {domData.network.totalRequests} requests
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="rounded border bg-[var(--surface)] border-[var(--border)] px-2 py-1 text-xs text-[var(--text)] w-28 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="path e.g. /affiliates"
              value={domPath}
              onChange={e => setDomPath(e.target.value)}
            />
            <Button variant="ghost" size="sm" loading={domLoading}
              icon={<RefreshCw size={12} className={domLoading ? 'animate-spin' : ''} />}
              onClick={async () => {
                setDomLoading(true);
                try { setDomData(await affiliateApi.fetchDom(decoded, domPath || '/')); }
                catch (e: unknown) { toast(e instanceof Error ? e.message : 'Failed', { type: 'error' }); }
                finally { setDomLoading(false); }
              }}>
              Fetch DOM
            </Button>
          </div>
        </div>
        {domData && (
          <div>
            {/* Title + redirect */}
            <div className="px-5 pt-3 pb-2 flex flex-wrap gap-3 text-xs">
              {domData.title && <span className="text-[var(--text)] font-medium">&quot;{domData.title}&quot;</span>}
              {domData.finalUrl !== domData.url && (
                <span className="text-amber-400 font-mono">→ {domData.finalUrl}</span>
              )}
              {domData.navError && <span className="text-red-400">{domData.navError}</span>}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 border-b border-[var(--border)] flex-wrap">
              {([
                { key: 'network', label: `Network (${domData.network.totalRequests})` },
                { key: 'meta',    label: `Meta (${domData.metaTags.length})` },
                { key: 'dom',     label: domData.domTruncated ? `DOM HTML (trunc ${(150_000 / 1024).toFixed(0)}KB / ${(domData.domHtmlLength / 1024).toFixed(0)}KB)` : 'DOM HTML' },
                ...(domData.footerHtml ? [{ key: 'footer', label: 'Footer' }] : []),
                ...(domData.navHtml    ? [{ key: 'nav',    label: 'Nav/Header' }] : []),
              ] as { key: typeof domTab; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setDomTab(key)}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors',
                    domTab === key
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
                  )}>
                  {label}
                </button>
              ))}
            </div>

            {/* Network tab */}
            {domTab === 'network' && (
              <div>
                {/* Type summary chips */}
                <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-[var(--border)]">
                  {(['all', ...Object.keys(domData.network.byType)] as string[]).map(type => (
                    <button key={type} onClick={() => setNetFilter(type)}
                      className={clsx(
                        'px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors',
                        netFilter === type
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]',
                      )}>
                      {type}{type !== 'all' ? ` (${domData.network.byType[type]})` : ` (${domData.network.totalRequests})`}
                    </button>
                  ))}
                </div>
                <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto font-mono text-[11px]">
                  {domData.network.requests
                    .filter((r: NetworkRequest) => netFilter === 'all' || r.type === netFilter)
                    .map((r: NetworkRequest, i: number) => (
                      <div key={i} className="px-4 py-1.5 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx(
                            'text-[10px] font-semibold px-1 py-0.5 rounded shrink-0',
                            r.type === 'xhr' || r.type === 'fetch' ? 'bg-indigo-900/40 text-indigo-300'
                              : r.type === 'script' ? 'bg-amber-900/40 text-amber-300'
                              : r.type === 'document' ? 'bg-emerald-900/40 text-emerald-300'
                              : 'bg-[var(--surface-2)] text-[var(--text-muted)]',
                          )}>{r.type}</span>
                          <span className={clsx('text-[10px] font-bold shrink-0', r.method === 'POST' ? 'text-orange-400' : 'text-blue-400')}>{r.method}</span>
                          {r.response && (
                            <span className={clsx('text-[10px] shrink-0', r.response.status < 300 ? 'text-green-400' : 'text-red-400')}>
                              {r.response.status}
                            </span>
                          )}
                          <span className="text-[var(--text-muted)] truncate flex-1" title={r.url}>{r.url}</span>
                        </div>
                        {r.postData && (
                          <div className="pl-2 text-[10px] text-amber-300 truncate">POST: {r.postData.slice(0, 200)}</div>
                        )}
                        {r.response?.body && (
                          <div className="pl-2 text-[10px] text-green-400 truncate">↩ {r.response.body.slice(0, 200)}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Meta tags tab */}
            {domTab === 'meta' && (
              <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto font-mono text-[11px]">
                {domData.metaTags.map((m, i) => (
                  <div key={i} className="flex gap-3 px-4 py-1.5">
                    <span className="text-indigo-400 w-48 shrink-0 truncate">{m.name ?? m.charset}</span>
                    <span className="text-[var(--text-muted)] truncate flex-1">{m.content ?? '(charset)'}</span>
                  </div>
                ))}
                {domData.metaTags.length === 0 && (
                  <p className="px-4 py-3 text-[var(--text-muted)] italic">No meta tags found.</p>
                )}
              </div>
            )}

            {/* DOM HTML tab */}
            {domTab === 'dom' && (
              <pre className="px-5 py-4 text-xs font-mono text-green-300 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap break-all">
                {domData.domHtml || '(empty)'}
                {domData.domTruncated && `\n\n… (truncated — showing first 150 KB of ${(domData.domHtmlLength / 1024).toFixed(0)} KB total. Use Footer / Nav tabs to see late-rendered sections.)`}
              </pre>
            )}

            {/* Footer HTML tab */}
            {domTab === 'footer' && (
              <pre className="px-5 py-4 text-xs font-mono text-emerald-300 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap break-all">
                {domData.footerHtml || '(no <footer> element found)'}
              </pre>
            )}

            {/* Nav/Header HTML tab */}
            {domTab === 'nav' && (
              <pre className="px-5 py-4 text-xs font-mono text-sky-300 overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap break-all">
                {domData.navHtml || '(no <nav> or <header> element found)'}
              </pre>
            )}

            <p className="px-5 py-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)]">
              Fetched {new Date(domData.fetchedAt).toLocaleString()} · DOM {(domData.domHtmlLength / 1024).toFixed(1)} KB
              {domData.domTruncated && <span className="text-amber-400 ml-1">(truncated)</span>}
            </p>
          </div>
        )}
        {!domData && !domLoading && (
          <p className="px-5 py-4 text-xs text-[var(--text-muted)]">
            Click <strong>Fetch DOM</strong> to use Playwright to fully render the page, capture all network requests (XHR/fetch/scripts), and inspect the live DOM — useful for diagnosing why LLM extraction misses certain data.
          </p>
        )}
      </div>

      {/* Full JSON */}
      <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <summary className="flex items-center gap-2 px-5 py-3 cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)] select-none bg-[var(--surface-2)]">
          <Cpu size={14} />
          <span className="font-medium ml-1">{t('sections.fullRecord')}</span>
        </summary>
        <pre className="px-5 py-4 text-xs font-mono text-[var(--text-muted)] overflow-auto max-h-96 leading-relaxed">
          {JSON.stringify(program, null, 2)}
        </pre>
      </details>
    </div>
  );
}
