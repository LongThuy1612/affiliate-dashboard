'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { crawlAffiliateApi, affiliateApi, systemStatsApi, autoDiscoverKeywordsApi, websitesLinksApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { PermissionSubject as S, PermissionAction as A } from '@/constants/permissions';
import type { PermissionSubjectValues, PermissionActionValues } from '@/constants/permissions';
import type {
  BypassAnalysisResponse,
  BypassProposal,
  BypassStructuredResponse,
  BypassExperimentResult,
  BypassConfigState,
  DiscoverAutoStatus,
  DiscoverSearchStatus,
  SystemStats,
} from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toaster';
import {
  Play, Search, RefreshCw, Globe, Layers, Plus, Bot, Sparkles, TrendingUp,
  BookOpen, Lightbulb, Zap, Shield, ChevronRight, Files, Pencil,
  CheckCircle2, AlertTriangle, Send, Download, Link2,
} from 'lucide-react';

// ─── Gemini models available for all AI selects ───────────────────────────────

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

function useAllModels() {
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  useEffect(() => {
    affiliateApi.ollamaModels().then(setOllamaModels).catch(() => {});
  }, []);
  return [
    ...ollamaModels,
    ...GEMINI_MODELS.filter((g) => !ollamaModels.includes(g)),
  ];
}

// ─── Error message hook ───────────────────────────────────────────────────────

function useApiError() {
  const t = useTranslations('errors');
  return (e: unknown): string => {
    const raw = e instanceof Error ? e.message : String(e);
    const lower = raw.toLowerCase();
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('econnaborted'))
      return t('API_TIMEOUT');
    if (lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('network error'))
      return t('API_NETWORK');
    if (/http 5\d\d/.test(lower))
      return t('API_SERVER');
    if (lower.includes('http 401') || lower.includes('http 403'))
      return t('UNAUTHORIZED');
    // Meaningful server message — return as-is rather than a generic fallback
    if (raw.length > 0 && raw.length < 300 && !raw.startsWith('HTTP '))
      return raw;
    return t('UNKNOWN');
  };
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function ResultBox({ result }: { result: unknown }) {
  if (!result) return null;
  return (
    <pre className="mt-3 p-3 rounded bg-[var(--surface-2)] text-xs font-mono text-green-400 overflow-auto max-h-48 whitespace-pre-wrap">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--text-muted)] opacity-70 mt-0.5">{children}</p>;
}

// ─── Tabs inside each action panel ───────────────────────────────────────────

type ActionTab = 'guide' | 'examples' | 'action';

function ActionTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ActionTab;
  onTabChange: (tab: ActionTab) => void;
}) {
  const tabs: { id: ActionTab; label: string; icon: React.ReactNode }[] = [
    { id: 'guide',    label: 'Hướng dẫn', icon: <BookOpen size={13} /> },
    { id: 'examples', label: 'Ví dụ',     icon: <Lightbulb size={13} /> },
    { id: 'action',   label: 'Thực hiện', icon: <Zap size={13} /> },
  ];
  return (
    <div className="flex gap-1 mb-5 border-b border-[var(--border)] pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function GuideBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)] leading-relaxed space-y-3">
      {children}
    </div>
  );
}

function ExampleBlock({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
          <p className="text-xs font-semibold text-[var(--text)] mb-1">{item.label}</p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Action: Start Crawl ──────────────────────────────────────────────────────

function StartCrawlForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.startCrawl');
  const apiError = useApiError();
  const [force, setForce]   = useState(false);
  const [limit, setLimit]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const submit = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await crawlAffiliateApi.start({ force, limit: limit ? Number(limit) : undefined });
      setResult(res);
      toast(t('success'), { type: 'success' });
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="flex flex-wrap gap-4 items-start">
        <Input label={t('limitLabel')} type="number" placeholder="e.g. 50" value={limit}
          onChange={(e) => setLimit(e.target.value)} hint={t('limitHint')} className="w-36" />
        <div className="flex flex-col gap-1 pt-5">
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[var(--accent)]" />
            {t('forceLabel')}
          </label>
          <FieldHint>{t('forceHint')}</FieldHint>
        </div>
        <div className="pt-5">
          <Button icon={<Play size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
        </div>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: Discover Google ──────────────────────────────────────────────────

type LogEntry = { domain: string; score: number; updatedAt: string };
type JobState = { startedAt: Date; discovered: number; discoveredDomains: string[] } | null;

const POLL_INTERVAL_MS       = 5_000;
const SEARCH_STATUS_INTERVAL = 2_000;

function KeywordBot({ onAdd }: { onAdd: (kws: string[]) => void }) {
  const allModels               = useAllModels();
  const [model, setModel]       = useState('');
  const [topic, setTopic]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [added, setAdded]       = useState<Set<number>>(new Set());
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    if (allModels.length > 0 && !model) setModel(allModels[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allModels]);

  const suggest = async () => {
    if (!topic.trim()) return;
    setLoading(true); setKeywords([]); setAdded(new Set());
    try {
      const res = await affiliateApi.aiKeywords(topic.trim(), model || undefined);
      setKeywords(res.keywords);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const addOne = (i: number) => { onAdd([keywords[i]]); setAdded((prev) => new Set(prev).add(i)); };
  const addAll = () => {
    const toAdd = keywords.filter((_, i) => !added.has(i));
    if (toAdd.length > 0) onAdd(toAdd);
    setAdded(new Set(keywords.map((_, i) => i)));
  };

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors text-left"
      >
        <Bot size={13} className="text-indigo-400 shrink-0" />
        <span className="text-xs font-medium text-indigo-300">AI Keyword Suggester</span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3 bg-[var(--surface-2)]">
          <p className="text-[11px] text-[var(--text-muted)]">
            Describe a niche or theme — the AI will suggest affiliate search keywords you can add to the list above.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[11px] text-[var(--text-muted)] block mb-1">Topic / niche</label>
              <input
                className="w-full rounded border bg-[var(--surface)] border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="e.g. email marketing SaaS, VPN software…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && suggest()}
              />
            </div>
            {allModels.length > 0 && (
              <div className="min-w-[160px]">
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">Model</label>
                <select
                  className="w-full rounded border bg-[var(--surface)] border-[var(--border)] px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {allModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={suggest}
              disabled={loading || !topic.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              {loading ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {loading ? 'Thinking…' : 'Suggest'}
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">{keywords.length} suggestions</span>
                <button onClick={addAll} className="text-[11px] text-indigo-400 hover:text-indigo-300 underline">Add all to list</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <button
                    key={i} onClick={() => addOne(i)} disabled={added.has(i)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors ${
                      added.has(i)
                        ? 'border-green-700 bg-green-900/30 text-green-400 cursor-default'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-indigo-500 hover:text-indigo-300'
                    }`}
                  >
                    {added.has(i) ? '✓' : <Plus size={9} />}
                    <span>{kw}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiscoverGoogleForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.discoverGoogle');
  const apiError = useApiError();
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit]       = useState('');
  const [skipOld, setSkipOld]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [jobState, setJobState] = useState<JobState>(null);
  const [logEntries, setLogEntries]       = useState<LogEntry[]>([]);
  const [polling, setPolling]             = useState(false);
  const [searchStatus, setSearchStatus]   = useState<DiscoverSearchStatus | null>(null);
  const [sessionWarnings, setSessionWarnings] = useState<string[]>([]);
  const pollTimer        = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchStatusTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenDomains      = useRef<Set<string>>(new Set());

  const stopPolling = useCallback(() => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
    setPolling(false);
  }, []);

  const stopSearchStatusPoll = useCallback(() => {
    if (searchStatusTimer.current) { clearInterval(searchStatusTimer.current); searchStatusTimer.current = null; }
  }, []);

  const startSearchStatusPoll = useCallback(() => {
    searchStatusTimer.current = setInterval(async () => {
      try {
        const st = await crawlAffiliateApi.discoverSearchStatus();
        setSearchStatus(st);
      } catch { /* silent */ }
    }, SEARCH_STATUS_INTERVAL);
  }, []);

  const startPolling = useCallback((startedAt: Date) => {
    seenDomains.current = new Set(); setLogEntries([]); setPolling(true);
    pollTimer.current = setInterval(async () => {
      try {
        const res = await affiliateApi.list({ orderBy: 'updatedAt', order: 'desc', limit: 50 });
        const fresh = res.items.filter(
          (it) => new Date(it.updatedAt).getTime() > startedAt.getTime() && !seenDomains.current.has(it.domain),
        );
        if (fresh.length > 0) {
          fresh.forEach((it) => seenDomains.current.add(it.domain));
          setLogEntries((prev) => [
            ...fresh.map((it) => ({ domain: it.domain, score: it.affiliateScore, updatedAt: it.updatedAt })),
            ...prev,
          ]);
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL_MS);
  }, []);

  useEffect(() => () => { stopPolling(); stopSearchStatusPoll(); }, [stopPolling, stopSearchStatusPoll]);

  const appendKeywords = useCallback((kws: string[]) => {
    setKeywords((prev) => {
      const existing = prev.split('\n').map((k) => k.trim()).filter(Boolean);
      const toAdd = kws.filter((k) => !existing.includes(k));
      if (toAdd.length === 0) return prev;
      return prev.trimEnd() ? prev.trimEnd() + '\n' + toAdd.join('\n') : toAdd.join('\n');
    });
  }, []);

  const submit = async () => {
    const kwList = keywords.split('\n').map((k) => k.trim()).filter(Boolean);
    stopPolling(); stopSearchStatusPoll();
    setJobState(null); setLogEntries([]); setSearchStatus(null); setSessionWarnings([]);
    setLoading(true);
    startSearchStatusPoll();
    try {
      const startedAt = new Date();
      const res = await crawlAffiliateApi.discover({
        queries: kwList.length > 0 ? kwList : undefined,
        limit: limit ? Number(limit) : undefined,
        skipOld,
      }) as { discovered?: number; domains?: string[]; warnings?: string[] };
      const warns = res.warnings ?? [];
      setSessionWarnings(warns);
      setJobState({ startedAt, discovered: res.discovered ?? 0, discoveredDomains: res.domains ?? [] });
      if (warns.includes('google_proxy_unavailable')) {
        toast('Google Search không khả dụng — proxy timeout. Kết quả bị giới hạn.', { type: 'info' });
      } else if (warns.includes('google_captcha_heavy')) {
        toast('Google CAPTCHA nặng — proxy bị rate-limit. Cân nhắc đổi proxy.', { type: 'info' });
      } else {
        toast(t('successMessage', { count: kwList.length || 1 }), { type: 'success' });
      }
      startPolling(startedAt);
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally {
      stopSearchStatusPoll();
      setLoading(false);
    }
  };

  const proxyUnavailable = sessionWarnings.includes('google_proxy_unavailable');
  const captchaHeavy     = sessionWarnings.includes('google_captcha_heavy');

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">{t('keywordsLabel')}</label>
          <textarea
            className="w-full rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono h-28 resize-y"
            placeholder={t('keywordsPlaceholder')}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <FieldHint>{t('keywordsHint')}</FieldHint>
        </div>
        <div className="flex flex-wrap gap-4 items-start">
          <Input label={t('limitLabel')} type="number" placeholder="e.g. 1000" value={limit}
            onChange={(e) => setLimit(e.target.value)} hint={t('limitHint')} className="w-44" />
          <div className="flex flex-col gap-1 pt-5">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
              <input type="checkbox" checked={skipOld} onChange={(e) => setSkipOld(e.target.checked)} className="accent-[var(--accent)]" />
              Skip Old Domains
            </label>
            <FieldHint>Only crawl domains that are NOT in database</FieldHint>
          </div>
          <div className="pt-5">
            <Button icon={<Search size={13} />} loading={loading} onClick={submit}>
              {loading ? t('buttonRunning') : t('button')}
            </Button>
          </div>
        </div>
      </div>
      <KeywordBot onAdd={appendKeywords} />

      {/* Live search progress — shown while Google search is in flight */}
      {loading && searchStatus && (
        <div className="mt-4 rounded-lg border border-amber-800/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-950/30 border-b border-amber-800/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-amber-300">Google Search in progress…</span>
            {searchStatus.queriesTotal > 0 && (
              <span className="ml-auto text-[11px] text-[var(--text-muted)] font-mono">
                {searchStatus.queriesDone}/{searchStatus.queriesTotal} queries
              </span>
            )}
          </div>
          <div className="px-4 py-3 bg-[var(--surface-2)] space-y-2">
            {searchStatus.currentQuery && (
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Searching: <span className="text-[var(--text)]">&ldquo;{searchStatus.currentQuery}&rdquo;</span>
              </p>
            )}
            <div className="flex flex-wrap gap-5 font-mono text-[11px]">
              <span>
                Domains: <span className="text-green-400">{searchStatus.domainsFound}</span>
              </span>
              <span>
                CAPTCHAs:{' '}
                <span className={searchStatus.captchaTotal > 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}>
                  {searchStatus.captchaTotal}
                </span>
              </span>
              <span>
                Respawns:{' '}
                <span className={searchStatus.respawnCount > 0 ? 'text-amber-400' : 'text-[var(--text-muted)]'}>
                  {searchStatus.respawnCount}
                </span>
              </span>
              {searchStatus.networkFailCount > 0 && (
                <span>
                  Timeouts: <span className="text-red-400">{searchStatus.networkFailCount}</span>
                </span>
              )}
            </div>
            {searchStatus.captchaTotal >= 2 && (
              <p className="text-[11px] text-amber-400">
                ⚠ Heavy CAPTCHA — browser respawning with fresh proxy
              </p>
            )}
            {searchStatus.networkFailCount > 0 && searchStatus.domainsFound === 0 && (
              <p className="text-[11px] text-red-400">
                ⚠ Proxy appears unavailable — queries timing out
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result card — shown after search completes */}
      {jobState && (
        <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Warning banners */}
          {(proxyUnavailable || captchaHeavy) && (
            <div className="px-4 py-2 bg-amber-950/20 border-b border-amber-800/30 space-y-0.5">
              {proxyUnavailable && (
                <p className="text-[11px] text-red-400">
                  ⚠ Google Search unavailable — proxy timed out. Results may be limited. Check proxy health.
                </p>
              )}
              {captchaHeavy && (
                <p className="text-[11px] text-amber-400">
                  ⚠ Heavy CAPTCHA session — proxy is rate-limited by Google.
                  {searchStatus && ` (${searchStatus.captchaTotal} CAPTCHAs, ${searchStatus.respawnCount} respawns)`}
                  {' '}Consider rotating or replacing the proxy.
                </p>
              )}
            </div>
          )}

          {/* Session stats (shown when we have final search status) */}
          {searchStatus && !searchStatus.active && (
            <div className="flex flex-wrap gap-5 px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
              <span>Queries: <span className="text-[var(--text)]">{searchStatus.queriesDone}/{searchStatus.queriesTotal}</span></span>
              <span>Domains found: <span className="text-green-400">{searchStatus.domainsFound}</span></span>
              {searchStatus.captchaTotal > 0 && (
                <span>CAPTCHAs: <span className="text-red-400">{searchStatus.captchaTotal}</span></span>
              )}
              {searchStatus.respawnCount > 0 && (
                <span>Respawns: <span className="text-amber-400">{searchStatus.respawnCount}</span></span>
              )}
              {searchStatus.networkFailCount > 0 && (
                <span>Timeouts: <span className="text-red-400">{searchStatus.networkFailCount}</span></span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-950/40 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              {polling && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />}
              <span className="text-xs font-medium text-indigo-300">{t('jobDiscovered', { count: jobState.discovered })}</span>
            </div>
            <button
              onClick={() => polling ? stopPolling() : startPolling(jobState.startedAt)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-0.5 rounded border border-[var(--border)]"
            >
              {polling ? t('jobStop') : t('jobResume')}
            </button>
          </div>
          <div className="px-4 py-2 bg-[var(--surface-2)]">
            <p className="text-[11px] text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              {polling && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              {t('jobLiveLog')} — {logEntries.length} entries
            </p>
            <div className="space-y-0.5 max-h-52 overflow-y-auto font-mono text-xs">
              {logEntries.length === 0 ? (
                <p className="text-[var(--text-muted)] italic">{t('jobEmpty')}</p>
              ) : (
                logEntries.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-indigo-400 truncate flex-1">{e.domain}</span>
                    <span className={e.score >= 70 ? 'text-green-400 shrink-0' : e.score >= 50 ? 'text-amber-400 shrink-0' : 'text-red-400 shrink-0'}>
                      score:{e.score}
                    </span>
                    <span className="text-[var(--text-muted)] shrink-0 text-[10px]">{new Date(e.updatedAt).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Action: Discover Sources ─────────────────────────────────────────────────

function DiscoverSourcesForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.discoverSources');
  const apiError = useApiError();
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);
  const submit = async () => {
    setLoading(true); setResult(null);
    try { const res = await crawlAffiliateApi.discoverSources(); setResult(res); toast(t('success'), { type: 'success' }); }
    catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-3">{t('description')}</p>
      <Button icon={<Layers size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: Freshness Reset ──────────────────────────────────────────────────

function FreshnessResetForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.freshnessReset');
  const apiError = useApiError();
  const [staleDays, setStaleDays] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<unknown>(null);
  const submit = async () => {
    setLoading(true); setResult(null);
    try { const res = await crawlAffiliateApi.freshnessReset({ staleDays: staleDays ? Number(staleDays) : undefined }); setResult(res); toast(t('success'), { type: 'success' }); }
    catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="flex flex-wrap gap-4 items-start">
        <Input label={t('staleDaysLabel')} type="number" placeholder="e.g. 7" value={staleDays}
          onChange={(e) => setStaleDays(e.target.value)} hint={t('staleDaysHint')} className="w-44" />
        <div className="pt-5">
          <Button icon={<RefreshCw size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
        </div>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: Crawl Single Domain ──────────────────────────────────────────────

function CrawlDomainForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.crawlDomain');
  const apiError = useApiError();
  const [domain, setDomain] = useState('');
  const [force, setForce]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const submit = async () => {
    if (!domain.trim()) return toast(t('validationError'), { type: 'error' });
    setLoading(true); setResult(null);
    try { const res = await crawlAffiliateApi.crawlDomain({ domain: domain.trim(), force }); setResult(res); toast(t('successMessage', { domain: domain.trim() }), { type: 'success' }); }
    catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="flex flex-wrap gap-4 items-start">
        <Input label={t('domainLabel')} placeholder="e.g. stripe.com" value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          hint={t('domainHint')} className="w-60" />
        <div className="flex flex-col gap-1 pt-5">
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[var(--accent)]" />
            {t('forceLabel')}
          </label>
          <FieldHint>{t('forceHint')}</FieldHint>
        </div>
        <div className="pt-5">
          <Button icon={<Globe size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
        </div>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: Crawl Multiple Domains ──────────────────────────────────────────

function CrawlDomainsForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.crawlDomains');
  const apiError = useApiError();
  const [raw, setRaw]       = useState('');
  const [force, setForce]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const domains = raw.split('\n').map((d) => d.trim()).filter(Boolean);
  const submit = async () => {
    if (!domains.length) return toast(t('validationError'), { type: 'error' });
    setLoading(true); setResult(null);
    try { const res = await crawlAffiliateApi.crawlDomains({ domains, force }); setResult(res); toast(t('successMessage', { count: domains.length }), { type: 'success' }); }
    catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
            {t('domainsLabel')}
            {domains.length > 0 && <span className="ml-2 text-[var(--accent)]">{t('domainsCount', { count: domains.length })}</span>}
          </label>
          <textarea
            className="w-full rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono h-32 resize-y"
            placeholder={"stripe.com\npaddle.com\nshopify.com"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <FieldHint>{t('domainsHint')}</FieldHint>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[var(--accent)]" />
              {t('forceLabel')}
            </label>
            <FieldHint>{t('forceHint')}</FieldHint>
          </div>
          <Button icon={<Layers size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
        </div>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: Upsert Program ───────────────────────────────────────────────────

function UpsertForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.upsert');
  const apiError = useApiError();
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);
  const [form, setForm] = useState({
    domain: '', programName: '', signupUrl: '', commissionRate: '',
    commissionType: 'unknown', recurringDuration: '', paymentTerms: '', cookieDays: '', confidence: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.domain.trim()) return toast(t('validationError'), { type: 'error' });
    setLoading(true); setResult(null);
    try {
      const payload: Record<string, unknown> = { domain: form.domain.trim() };
      if (form.programName)       payload.programName       = form.programName;
      if (form.signupUrl)         payload.signupUrl         = form.signupUrl;
      if (form.commissionRate)    payload.commissionRate    = form.commissionRate;
      if (form.commissionType)    payload.commissionType    = form.commissionType;
      if (form.recurringDuration) payload.recurringDuration = form.recurringDuration;
      if (form.paymentTerms)      payload.paymentTerms      = form.paymentTerms;
      if (form.cookieDays)        payload.cookieDays        = Number(form.cookieDays);
      if (form.confidence)        payload.confidence        = Number(form.confidence);
      const res = await affiliateApi.upsert(payload as Parameters<typeof affiliateApi.upsert>[0]);
      setResult(res); toast(t('success'), { type: 'success' });
    } catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('domainLabel')} placeholder="stripe.com" value={form.domain} onChange={(e) => set('domain', e.target.value)} hint={t('domainHint')} />
        <Input label={t('programNameLabel')} placeholder={t('programNamePlaceholder')} value={form.programName} onChange={(e) => set('programName', e.target.value)} hint={t('programNameHint')} />
        <Input label={t('signupUrlLabel')} placeholder={t('signupUrlPlaceholder')} value={form.signupUrl} onChange={(e) => set('signupUrl', e.target.value)} hint={t('signupUrlHint')} />
        <Input label={t('commissionRateLabel')} placeholder={t('commissionRatePlaceholder')} value={form.commissionRate} onChange={(e) => set('commissionRate', e.target.value)} hint={t('commissionRateHint')} />
        <div className="flex flex-col gap-1">
          <Select label={t('commissionTypeLabel')} value={form.commissionType} onValueChange={(v) => set('commissionType', v)}
            options={[
              { value: 'unknown',   label: t('commissionTypeUnknown') },
              { value: 'one_time',  label: t('commissionTypeOneTime') },
              { value: 'recurring', label: t('commissionTypeRecurring') },
            ]} />
          <p className="text-xs text-[var(--text-muted)] opacity-70 mt-0.5">{t('commissionTypeHint')}</p>
        </div>
        <Input label={t('recurringDurationLabel')} placeholder={t('recurringDurationPlaceholder')} value={form.recurringDuration} onChange={(e) => set('recurringDuration', e.target.value)} hint={t('recurringDurationHint')} />
        <Input label={t('paymentTermsLabel')} placeholder={t('paymentTermsPlaceholder')} value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} hint={t('paymentTermsHint')} />
        <Input label={t('cookieDaysLabel')} type="number" placeholder="30" value={form.cookieDays} onChange={(e) => set('cookieDays', e.target.value)} hint={t('cookieDaysHint')} />
        <Input label={t('confidenceLabel')} type="number" step="0.01" min="0" max="1" placeholder="0.8" value={form.confidence} onChange={(e) => set('confidence', e.target.value)} hint={t('confidenceHint')} />
      </div>
      <div className="mt-4">
        <Button icon={<Plus size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
      </div>
      <ResultBox result={result} />
    </div>
  );
}

// ─── Action: LLM Improve Low Score ───────────────────────────────────────────

type ImproveLog = { domain: string; result: 'improved' | 'nochange' | 'error' };

function LlmImproveLowScoreForm() {
  const { toast } = useToast();
  const t = useTranslations('affiliateActions.improveLowScore');
  const apiError = useApiError();
  const [threshold, setThreshold] = useState('40');
  const [model, setModel]         = useState('');
  const allModels                 = useAllModels();
  const [loading, setLoading]     = useState(false);
  const [domains, setDomains]     = useState<string[] | null>(null);
  const [running, setRunning]     = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0, improved: 0 });
  const [log, setLog]             = useState<ImproveLog[]>([]);
  const stopRef                   = useRef(false);

  const FIXED = ['deepseek-coder', 'phi4', 'mistral'];
  const modelOptions = [
    { value: '', label: 'Auto' },
    ...FIXED.map((m) => ({ value: m, label: m })),
    ...allModels.filter((m) => !FIXED.includes(m)).map((m) => ({ value: m, label: m })),
  ];

  const loadDomains = async () => {
    const max = Number(threshold) || 40;
    setLoading(true); setDomains(null); setLog([]);
    try {
      let page = 1; const all: string[] = [];
      while (true) {
        const res = await affiliateApi.list({ page, limit: 200, scoreMax: max, orderBy: 'affiliateScore', order: 'asc' });
        for (const item of res.items) all.push(item.domain);
        if (res.page >= res.pages) break;
        page++;
      }
      setDomains(all);
      if (all.length === 0) toast(t('noQualifying'), { type: 'info' });
    } catch (e: unknown) { toast(apiError(e), { type: 'error' }); }
    finally { setLoading(false); }
  };

  const runSequential = async () => {
    if (!domains?.length) return;
    stopRef.current = false; setRunning(true); setLog([]);
    const total = domains.length; setProgress({ done: 0, total, improved: 0 });
    let improved = 0;
    for (let i = 0; i < domains.length; i++) {
      if (stopRef.current) break;
      const domain = domains[i];
      let result: ImproveLog['result'] = 'error';
      try {
        const res = await crawlAffiliateApi.llmImprove([domain], model || undefined);
        result = res.improved > 0 ? 'improved' : 'nochange';
        if (res.improved > 0) improved++;
      } catch { result = 'error'; }
      setLog((prev) => [{ domain, result }, ...prev.slice(0, 199)]);
      setProgress({ done: i + 1, total, improved });
    }
    setRunning(false);
    toast(t('done', { improved, total }), { type: 'success' });
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <Input label={t('thresholdLabel')} type="number" min="0" max="100" placeholder="40"
          value={threshold} onChange={(e) => setThreshold(e.target.value)} hint={t('thresholdHint')} className="w-36" />
        <Select label={t('modelLabel')} value={model} onValueChange={setModel} options={modelOptions} />
        <Button variant="secondary" loading={loading} onClick={loadDomains} disabled={running}>
          {loading ? t('loading') : t('loadButton')}
        </Button>
      </div>
      {domains !== null && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text)]">
              {domains.length > 0 ? t('qualifyingCount', { count: domains.length }) : t('noQualifying')}
            </span>
            {domains.length > 0 && !running && (
              <Button icon={<TrendingUp size={13} />} onClick={runSequential}>{t('runButton')}</Button>
            )}
            {running && (
              <Button variant="danger" onClick={() => { stopRef.current = true; }}>{t('stopButton')}</Button>
            )}
          </div>
          {(running || progress.done > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-[var(--text-muted)] shrink-0 tabular-nums">
                  {t('progress', { done: progress.done, total: progress.total, improved: progress.improved })}
                </span>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 max-h-52 overflow-y-auto space-y-0.5 font-mono text-xs">
                {log.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={entry.result === 'improved' ? 'text-green-400 shrink-0' : entry.result === 'error' ? 'text-red-400 shrink-0' : 'text-[var(--text-muted)] shrink-0'}>
                      {entry.result === 'improved' ? '↑' : entry.result === 'error' ? '✗' : '—'}
                    </span>
                    <span className="text-indigo-400 truncate flex-1">{entry.domain}</span>
                    <span className={entry.result === 'improved' ? 'text-green-400 shrink-0' : entry.result === 'error' ? 'text-red-400 shrink-0' : 'text-[var(--text-muted)] shrink-0'}>
                      {entry.result === 'improved' ? t('logImproved') : entry.result === 'error' ? t('logError') : t('logNoChange')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Auto-Upgrade Pipeline panel ─────────────────────────────────────────────

function AutoUpgradePanel() {
  const { toast } = useToast();
  const apiError  = useApiError();

  const [tab, setTab]                 = useState<ActionTab>('guide');
  const allModels                     = useAllModels();
  const [model, setModel]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [structured, setStructured]   = useState<BypassStructuredResponse | null>(null);
  const [expResults, setExpResults]   = useState<Record<string, BypassExperimentResult>>({});
  const [expLoading, setExpLoading]   = useState<Record<string, boolean>>({});
  const [applyLoading, setApplyLoading]     = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [configState, setConfigState] = useState<BypassConfigState | null>(null);

  useEffect(() => {
    if (allModels.length > 0 && !model) setModel(allModels[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allModels]);

  useEffect(() => {
    affiliateApi.bypassGetConfig().then(setConfigState).catch(() => {});
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await affiliateApi.bypassStructured({ model: model || undefined });
      setStructured(res);
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setLoading(false); }
  };

  const runExperiment = async (proposal: BypassProposal) => {
    setExpLoading((prev) => ({ ...prev, [proposal.id]: true }));
    try {
      const res = await affiliateApi.bypassRunExperiment({ proposalId: proposal.id, proposal, sampleSize: 10 });
      setExpResults((prev) => ({ ...prev, [proposal.id]: res }));
      if ('error' in res && res.error) {
        toast(res.error as string, { type: 'info' });
      } else {
        const msg = res.improvement > 0
          ? `Thử nghiệm xong! +${res.improvement}% so với baseline.`
          : `Thử nghiệm xong. Không cải thiện (${res.improvement}%).`;
        toast(msg, { type: res.improvement > 0 ? 'success' : 'info' });
      }
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally {
      setExpLoading((prev) => ({ ...prev, [proposal.id]: false }));
    }
  };

  const applyToSystem = async (proposals: BypassProposal[], experimentId?: number) => {
    setApplyLoading(true);
    try {
      await affiliateApi.bypassApplyConfig({
        proposals,
        description: `Applied ${proposals.length} AI-generated proposal${proposals.length > 1 ? 's' : ''}`,
        experimentId,
      });
      toast('Cấu hình đã được áp dụng vào hệ thống.', { type: 'success' });
      affiliateApi.bypassGetConfig().then(setConfigState).catch(() => {});
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setApplyLoading(false); }
  };

  const rollback = async (mode: 'force' | 'auto', experimentId?: number) => {
    setRollbackLoading(true);
    try {
      const res = await affiliateApi.bypassRollback({ mode, experimentId });
      if (res.action === 'kept') {
        toast(`Giữ nguyên cấu hình hiện tại (experiment cải thiện +${res.improvement}%).`, { type: 'success' });
      } else if (res.action === 'rolled_back') {
        toast('Đã rollback về cấu hình trước đó.', { type: 'success' });
      } else {
        toast('Không có cấu hình trước để rollback.', { type: 'info' });
      }
      affiliateApi.bypassGetConfig().then(setConfigState).catch(() => {});
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setRollbackLoading(false); }
  };

  const riskStyle = (r: string) =>
    r === 'low' ? 'text-green-400 border-green-800' :
    r === 'medium' ? 'text-amber-400 border-amber-800' :
    'text-red-400 border-red-800';

  const typeStyle = (t: string) => {
    const map: Record<string, string> = {
      tier1_headers:   'bg-blue-900/20 text-blue-400',
      tier2_config:    'bg-purple-900/20 text-purple-400',
      escalation_rule: 'bg-orange-900/20 text-orange-400',
      retry_policy:    'bg-cyan-900/20 text-cyan-400',
      infrastructure:  'bg-rose-900/20 text-rose-400',
    };
    return map[t] || 'bg-[var(--surface-2)] text-[var(--text-muted)]';
  };

  const modelOptions = allModels.length > 0
    ? allModels.map((m) => ({ value: m, label: m }))
    : [{ value: 'mistral', label: 'mistral' }];

  return (
    <div className="mt-6 rounded-xl border-2 border-red-800/60 overflow-hidden">
      {/* ── Danger header ── */}
      <div className="px-4 py-3 bg-red-950/40 border-b border-red-800/60 flex items-center gap-2">
        <AlertTriangle size={15} className="text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-400">Auto-Upgrade Pipeline</p>
          <p className="text-[11px] text-red-400/70">AI tự học &amp; tự nâng cấp bypass — kiểm soát hoàn toàn bởi người dùng</p>
        </div>
      </div>

      <div className="p-4">
        <ActionTabs activeTab={tab} onTabChange={setTab} />

        {/* ── Guide tab ── */}
        {tab === 'guide' && (
          <GuideBlock>
            <p>
              <strong className="text-[var(--text)]">Auto-Upgrade Pipeline</strong> cho phép AI phân tích
              log lỗi và sinh ra <em className="text-[var(--text)]">structured proposals</em> dạng JSON
              — mỗi proposal là một thay đổi cấu hình cụ thể.
            </p>
            <p><strong className="text-[var(--text)]">Quy trình kiểm soát:</strong></p>
            <ol className="list-decimal list-inside space-y-1 text-xs pl-2">
              <li><strong className="text-[var(--text)]">Generate</strong> — AI phân tích log, trả về danh sách proposal JSON.</li>
              <li><strong className="text-[var(--text)]">Apply Sample</strong> — Thử nghiệm dry-run trên ~10 domain thực tế, không ghi DB production.</li>
              <li><strong className="text-[var(--text)]">Apply to System</strong> — Xem kết quả, đồng ý → áp dụng vào hệ thống. Config cũ tự động được backup.</li>
              <li><strong className="text-[var(--text)]">Rollback</strong> — Khôi phục config cũ bất cứ lúc nào. <em>Smart Rollback</em> giữ config mới nếu experiment cho thấy cải thiện.</li>
            </ol>
            <p className="text-red-400/80 text-xs">
              ⚠️ <strong className="text-red-400">Lưu ý:</strong> &quot;Apply to System&quot; ghi vào DB. Luôn chạy Apply Sample trước.
            </p>
          </GuideBlock>
        )}

        {/* ── Examples tab ── */}
        {tab === 'examples' && (
          <ExampleBlock items={[
            { label: 'Giảm CF_BLOCK', desc: 'AI đề xuất thêm headers cho T1 axios → Apply Sample: baseline 20% → test 60% → Apply to System.' },
            { label: 'Tối ưu escalation', desc: 'AI phát hiện T1 fail 90% + T2 chậm → đề xuất rule skip T1 cho domain trong CF-blacklist.' },
            { label: 'Rollback an toàn', desc: 'Apply config mới, thấy tỉ lệ giảm → Force Rollback ngay. Hoặc Smart Rollback để AI tự quyết định.' },
            { label: 'Infrastructure', desc: 'AI đề xuất tăng FlareSolverr instances → xem proposal JSON → tự thực hiện theo hướng dẫn.' },
          ]} />
        )}

        {/* ── Action tab ── */}
        {tab === 'action' && (
          <div className="space-y-4">
            {/* Generate controls */}
            <div className="flex flex-wrap gap-3 items-end">
              <Select label="AI Model" value={model} onValueChange={setModel} options={modelOptions} />
              <div className="pt-5">
                <Button icon={<Sparkles size={13} />} loading={loading} onClick={generate}>
                  {loading ? 'Đang phân tích…' : 'Generate Proposals'}
                </Button>
              </div>
            </div>

            {/* Current config state */}
            {configState && (
              <div className={`rounded-lg border p-3 ${configState.current ? 'border-green-800/60 bg-green-950/20' : 'border-[var(--border)] bg-[var(--surface-2)]'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">
                      {configState.current ? 'Config đang hoạt động' : 'Chưa có config được áp dụng'}
                    </p>
                    {configState.current && (
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {configState.current.description} · {configState.current.proposals.length} proposals ·{' '}
                        {new Date(configState.current.appliedAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                  {configState.current && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="danger"
                        loading={rollbackLoading}
                        onClick={() => rollback('force', configState.current?.experimentId ?? undefined)}
                      >
                        Force Rollback
                      </Button>
                      {configState.current.experimentId && (
                        <Button
                          loading={rollbackLoading}
                          onClick={() => rollback('auto', configState.current!.experimentId ?? undefined)}
                        >
                          Smart Rollback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Diagnosis */}
            {structured?.diagnosis && (
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3">
                <p className="text-[11px] font-semibold text-amber-400 mb-1">AI Diagnosis</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{structured.diagnosis}</p>
              </div>
            )}

            {/* Proposal cards */}
            {structured && structured.proposals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-semibold text-[var(--text)]">
                    {structured.proposals.length} Proposals
                  </p>
                  <Button
                    loading={applyLoading}
                    icon={<CheckCircle2 size={12} />}
                    onClick={() => applyToSystem(structured.proposals)}
                  >
                    Apply All to System
                  </Button>
                </div>

                {structured.proposals.map((proposal) => {
                  const expResult = expResults[proposal.id];
                  const isRunning = expLoading[proposal.id] ?? false;
                  return (
                    <div key={proposal.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeStyle(proposal.type)}`}>
                              {proposal.type.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${riskStyle(proposal.risk)}`}>
                              risk: {proposal.risk}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                              effort: {proposal.effort}
                            </span>
                            {proposal.autoApplyEligible && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 font-medium">
                                auto-eligible
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[var(--text)]">{proposal.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{proposal.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-green-400">+{Math.round(proposal.predictedImprovement * 100)}%</p>
                          <p className="text-[10px] text-[var(--text-muted)]">predicted</p>
                        </div>
                      </div>

                      {/* Target errors + change JSON */}
                      <div className="px-4 py-3 space-y-2">
                        {Array.isArray(proposal.targetError) && proposal.targetError.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {proposal.targetError.map((err) => (
                              <span key={err} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-800 bg-red-900/20 text-[10px] text-red-400">
                                <AlertTriangle size={8} />
                                {err}
                              </span>
                            ))}
                          </div>
                        )}
                        {proposal.change && Object.keys(proposal.change).length > 0 && (
                          <pre className="text-[11px] font-mono bg-[var(--surface-2)] rounded p-2 overflow-auto max-h-20 text-[var(--text-muted)]">
                            {JSON.stringify(proposal.change, null, 2)}
                          </pre>
                        )}
                      </div>

                      {/* Experiment result */}
                      {expResult && !('error' in expResult && expResult.error) && (
                        <div className={`mx-4 mb-3 rounded-lg border p-3 ${expResult.improvement > 0 ? 'border-green-800/60 bg-green-950/20' : 'border-amber-800/50 bg-amber-950/10'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-xs font-semibold text-[var(--text)]">Kết quả thử nghiệm</p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {expResult.sampleDomains.length} domain · baseline {expResult.baselineSuccessRate}% → test {expResult.testSuccessRate}%
                              </p>
                            </div>
                            <span className={`text-base font-bold tabular-nums ${expResult.improvement > 0 ? 'text-green-400' : 'text-amber-400'}`}>
                              {expResult.improvement > 0 ? '+' : ''}{expResult.improvement}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="px-4 pb-3 flex gap-2 flex-wrap">
                        <Button loading={isRunning} icon={<Play size={11} />} onClick={() => runExperiment(proposal)}>
                          {isRunning ? 'Đang thử nghiệm…' : 'Apply Sample'}
                        </Button>
                        <Button
                          loading={applyLoading}
                          icon={<CheckCircle2 size={11} />}
                          onClick={() => applyToSystem([proposal], expResult?.experimentId)}
                        >
                          Apply to System
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bypass Advisor panel ─────────────────────────────────────────────────────

function BypassAdvisorPanel() {
  const { toast } = useToast();
  const apiError = useApiError();
  const allModels                 = useAllModels();
  const [model, setModel]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState<BypassAnalysisResponse | null>(null);
  const [question, setQuestion]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allModels.length > 0 && !model) setModel(allModels[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allModels]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const modelOptions = allModels.length > 0
    ? allModels.map((m) => ({ value: m, label: m }))
    : [{ value: 'mistral', label: 'mistral' }];

  const analyse = async () => {
    setLoading(true);
    try {
      const res = await affiliateApi.bypassAnalysis({ model: model || undefined });
      setData(res);
      setChatHistory([{ role: 'ai', text: res.suggestion }]);
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setLoading(false); }
  };

  const sendQuestion = async () => {
    const q = question.trim();
    if (!q) return;
    setQuestion('');
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);
    try {
      const res = await affiliateApi.bypassAnalysis({ model: model || undefined, question: q });
      setChatHistory((prev) => [...prev, { role: 'ai', text: res.suggestion }]);
    } catch (e: unknown) {
      setChatHistory((prev) => [...prev, { role: 'ai', text: apiError(e) }]);
    } finally { setChatLoading(false); }
  };

  const tierColor = (rate: number) =>
    rate >= 70 ? 'text-green-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-5">
      <GuideBlock>
        <p>
          <strong className="text-[var(--text)]">Bypass Advisor</strong> phân tích dữ liệu log từ pipeline fetch 3 tầng
          (Axios → Playwright → FlareSolverr), rồi dùng AI để chẩn đoán lỗi và đề xuất cải tiến cụ thể.
        </p>
        <p>Sau khi phân tích ban đầu, bạn có thể đặt câu hỏi tiếp theo để AI tư vấn thêm (ví dụ: <em className="text-[var(--text)]">&quot;Làm thế nào để cấu hình Playwright tốt hơn?&quot;</em>).</p>
      </GuideBlock>

      <div className="flex flex-wrap gap-3 items-end">
        {modelOptions.length > 0 && (
          <Select
            label="AI Model"
            value={model}
            onValueChange={setModel}
            options={modelOptions}
          />
        )}
        <div className="pt-5">
          <Button icon={<Shield size={13} />} loading={loading} onClick={analyse}>
            {loading ? 'Đang phân tích…' : 'Phân tích & Đề xuất'}
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Stats overview */}
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--text)]">Thống kê pipeline fetch</span>
              <span className="ml-3 text-[11px] text-[var(--text-muted)]">
                {data.stats.total.toLocaleString()} lần gọi · avg {data.stats.avgDurationMs} ms
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.stats.byTier.map((t) => (
                <div key={t.tier} className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--text)]">T{t.tier} {t.tierName}</span>
                    <span className={`text-sm font-bold tabular-nums ${tierColor(t.successRate)}`}>{t.successRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden mb-1">
                    <div className={`h-full transition-all ${t.successRate >= 70 ? 'bg-green-500' : t.successRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${t.successRate}%` }} />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">{t.success} ok / {t.failed} fail</p>
                </div>
              ))}
            </div>
            {data.stats.byErrorCode.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-2">Top error codes</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.stats.byErrorCode.slice(0, 10).map((e) => (
                    <span key={e.errorCode} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-800 bg-red-900/20 text-[11px] text-red-400">
                      <AlertTriangle size={9} />
                      {e.errorCode} ×{e.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat history */}
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-2.5 bg-indigo-950/30 border-b border-[var(--border)] flex items-center gap-2">
              <Bot size={13} className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">AI Bypass Advisor</span>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-[var(--surface-2)]">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={10} className="text-white" />
                    </div>
                  )}
                  <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={10} className="text-white" />
                  </div>
                  <div className="rounded-lg px-3 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                    <RefreshCw size={11} className="animate-spin inline mr-1" />Đang suy nghĩ…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-2">
              <input
                className="flex-1 rounded border bg-[var(--surface-2)] border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Hỏi tiếp: 'Làm sao tăng success rate Tier 2?', 'CF_BLOCK do đâu?'…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !chatLoading && sendQuestion()}
              />
              <button
                onClick={sendQuestion}
                disabled={chatLoading || !question.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
              >
                <Send size={11} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Auto-Upgrade Pipeline ── */}
      <AutoUpgradePanel />
    </div>
  );
}

// ─── Action: Discover Google Auto ────────────────────────────────────────────

function ResourceGauge({ label, value, warn = 70, danger = 90 }: { label: string; value: number; warn?: number; danger?: number }) {
  const color = value >= danger ? 'bg-red-500' : value >= warn ? 'bg-amber-500' : 'bg-green-500';
  const text  = value >= danger ? 'text-red-400' : value >= warn ? 'text-amber-400' : 'text-green-400';
  return (
    <div className="flex-1 min-w-[90px]">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
        <span className={`text-[10px] font-bold tabular-nums ${text}`}>{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

type AutoPhase = 'setup' | 'reviewing' | 'running' | 'done';

function DiscoverGoogleAutoPanel() {
  const { toast } = useToast();
  const apiError  = useApiError();

  // ── Params ──
  const [aiModel, setAiModel]       = useState('');
  const allModels                   = useAllModels();
  const [mode, setMode]             = useState<'auto' | 'manual'>('auto');
  const [limit, setLimit]           = useState('500');
  const [batchSize, setBatchSize]   = useState('10');
  const [cpuMax, setCpuMax]         = useState('80');
  const [ramMax, setRamMax]         = useState('80');
  const [skipOld, setSkipOld]       = useState(false);

  // ── Phase ──
  const [phase, setPhase]           = useState<AutoPhase>('setup');

  // ── Keyword review ──
  const [genLoading, setGenLoading] = useState(false);
  const [allKeywords, setAllKeywords] = useState<string[]>([]);
  const [selected, setSelected]     = useState<Set<number>>(new Set());

  // ── Server stats (auto-refresh) ──
  const [serverStats, setServerStats] = useState<SystemStats | null>(null);
  const statsTimerRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live job status ──
  const [status, setStatus]         = useState<DiscoverAutoStatus | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [stopLoading, setStopLoading]   = useState(false);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (allModels.length > 0 && !aiModel) setAiModel(allModels[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allModels]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPoll = useCallback(() => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const s = await crawlAffiliateApi.discoverAutoStatus();
        setStatus(s);
        if (!s.running && (s.phase === 'done' || s.phase === 'stopped' || s.phase === 'error')) {
          stopPoll();
          setPhase('done');
        }
      } catch { /* silent */ }
    }, 3000);
  }, [stopPoll]);

  // Auto-refresh server stats every 5 s in setup phase; stop otherwise
  const startStatsPoll = useCallback(() => {
    if (statsTimerRef.current) return;
    const tick = async () => {
      try { setServerStats(await systemStatsApi.get()); } catch { /* silent */ }
    };
    tick();
    statsTimerRef.current = setInterval(tick, 5000);
  }, []);

  const stopStatsPoll = useCallback(() => {
    if (statsTimerRef.current) { clearInterval(statsTimerRef.current); statsTimerRef.current = null; }
  }, []);

  // On mount: start auto-stats, check if a job is already running
  useEffect(() => {
    startStatsPoll();
    crawlAffiliateApi.discoverAutoStatus()
      .then((s) => {
        setStatus(s);
        if (s.running) { setPhase('running'); startPoll(); }
      })
      .catch(() => {});
    return () => { stopPoll(); stopStatsPoll(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'setup') startStatsPoll(); else stopStatsPoll();
  }, [phase, startStatsPoll, stopStatsPoll]);

  const generateKeywords = async () => {
    setGenLoading(true);
    try {
      let keywords = allKeywords;
      if (keywords.length === 0) {
        const res = await autoDiscoverKeywordsApi.generate({ aiModel: aiModel || undefined });
        keywords = res.keywords;
        setAllKeywords(keywords);
      }
      if (mode === 'auto') {
        await startJob(keywords);
      } else {
        setSelected(new Set(keywords.map((_, i) => i)));
        setPhase('reviewing');
      }
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setGenLoading(false); }
  };

  const startJob = async (keywords: string[]) => {
    setStartLoading(true);
    try {
      await crawlAffiliateApi.discoverAuto({
        keywords,
        limit: limit ? Number(limit) : undefined,
        cpuMax: cpuMax ? Number(cpuMax) : undefined,
        ramMax: ramMax ? Number(ramMax) : undefined,
        batchSize: batchSize ? Number(batchSize) : undefined,
        skipOld,
        autoRestart: mode === 'auto',
      });
      toast('Đã khởi động job auto-discover!', { type: 'success' });
      setPhase('running');
      startPoll();
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setStartLoading(false); }
  };

  const stopJob = async () => {
    setStopLoading(true);
    try {
      await crawlAffiliateApi.discoverAutoStop();
      toast('Đã gửi lệnh dừng.', { type: 'info' });
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setStopLoading(false); }
  };

  const toggleKeyword = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const modelOptions = allModels.length > 0
    ? [{ value: '', label: 'Auto (default)' }, ...allModels.map((m) => ({ value: m, label: m }))]
    : [{ value: '', label: 'Auto (default)' }];

  // ── Phase: Setup ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="space-y-5">
        {/* Mode toggle */}
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Chế độ áp dụng keyword</p>
          <div className="flex gap-2">
            {(['auto', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  mode === m
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {m === 'auto' ? '⚡ Auto Apply' : '✋ Manual Select'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
            {mode === 'auto'
              ? 'AI tự sinh keyword và crawl ngay — không cần review.'
              : 'AI sinh keyword, bạn xem và chọn trước khi bắt đầu crawl.'}
          </p>
        </div>

        {/* AI model */}
        <div>
          <Select label="Model AI sinh keyword" value={aiModel} onValueChange={setAiModel} options={modelOptions} />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Mặc định dùng Gemini để sinh keyword. Chọn model Ollama để dùng local.</p>
        </div>

        {/* Resource thresholds */}
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Ngưỡng tài nguyên (server tự tạm dừng nếu vượt)</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="CPU tối đa (%)" type="number" min="10" max="100" placeholder="80"
              value={cpuMax} onChange={(e) => setCpuMax(e.target.value)} className="w-full" />
            <Input label="RAM tối đa (%)" type="number" min="10" max="100" placeholder="80"
              value={ramMax} onChange={(e) => setRamMax(e.target.value)} className="w-full" />
          </div>
        </div>

        {/* Crawl params */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Số domain tối đa (limit)" type="number" placeholder="500"
            value={limit} onChange={(e) => setLimit(e.target.value)} hint="Tổng domain sẽ crawl." className="w-full" />
          <Input label="Batch size" type="number" placeholder="10"
            value={batchSize} onChange={(e) => setBatchSize(e.target.value)} hint="Số domain/batch trước khi kiểm tra CPU/RAM." className="w-full" />
        </div>

        {/* Skip old domains */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={skipOld}
            onChange={(e) => setSkipOld(e.target.checked)}
            className="accent-[var(--accent)] w-3.5 h-3.5"
          />
          <span className="text-xs text-[var(--text)]">Bỏ qua domain đã có trong database</span>
          <span className="text-[10px] text-[var(--text-muted)]">(skipOld)</span>
        </label>

        {/* Server stats — live auto-refresh every 5 s */}
        <div className="rounded-lg border border-[var(--border)] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-xs font-medium text-[var(--text)]">Thông số server (live)</p>
          </div>
          {serverStats ? (
            <div className="space-y-2">
              <div className="flex gap-4">
                <ResourceGauge label={`CPU (${serverStats.cpuCount} cores)`} value={serverStats.cpuPercent} />
                <ResourceGauge label={`RAM (${serverStats.ramTotalGb.toFixed(1)} GB)`} value={serverStats.ramPercent} />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                RAM: {serverStats.ramUsedGb.toFixed(1)} / {serverStats.ramTotalGb.toFixed(1)} GB · {serverStats.platform}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] italic">
              <RefreshCw size={10} className="animate-spin" /> Đang tải…
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="pt-1 space-y-2">
          {allKeywords.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <span className="text-[11px] text-[var(--text-muted)]">
                Dùng lại <span className="text-[var(--text)] font-medium">{allKeywords.length} keyword</span> đã có
              </span>
              <button
                onClick={() => { setAllKeywords([]); setSelected(new Set()); }}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline"
              >
                Generate lại
              </button>
            </div>
          )}
          <Button icon={<Sparkles size={13} />} loading={genLoading} onClick={generateKeywords}>
            {genLoading ? 'Đang tạo keyword…' : mode === 'auto' ? 'Bắt đầu Auto Discover' : 'Tạo Keyword để chọn'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Phase: Reviewing (Manual mode) ────────────────────────────────────────
  if (phase === 'reviewing') {
    const picked = allKeywords.filter((_, i) => selected.has(i));
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">{allKeywords.length} keyword được sinh ra</p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set(allKeywords.map((_, i) => i)))}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline">Chọn tất cả</button>
            <button onClick={() => setSelected(new Set())}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline">Bỏ chọn</button>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 max-h-64 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {allKeywords.map((kw, i) => (
              <button
                key={i}
                onClick={() => toggleKeyword(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors ${
                  selected.has(i)
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {selected.has(i) ? '✓' : <Plus size={9} />}
                <span>{kw}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<Play size={13} />}
            loading={startLoading}
            onClick={() => startJob(picked)}
            disabled={picked.length === 0}
          >
            {startLoading ? 'Đang khởi động…' : `Crawl ${picked.length} keyword đã chọn`}
          </Button>
          <button onClick={() => setPhase('setup')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Running ────────────────────────────────────────────────────────
  if (phase === 'running') {
    const s = status;
    const crawlPct = s && s.total > 0 ? Math.round((s.crawled / s.total) * 100) : 0;
    const phaseLabel: Record<string, string> = {
      idle: 'Chờ', discovering: 'Đang tìm domain…', crawling: 'Đang crawl…',
      paused: 'Tạm dừng (tài nguyên cao)', done: 'Hoàn thành', stopped: 'Đã dừng', error: 'Lỗi',
      refilling: 'Đang sinh keyword mới…', cooldown: 'Nghỉ giữa chu kỳ…', category_mode: 'Đang tìm theo category…',
    };
    const phaseColor: Record<string, string> = {
      idle: 'text-[var(--text-muted)]', discovering: 'text-indigo-400', crawling: 'text-blue-400',
      paused: 'text-amber-400', done: 'text-green-400', stopped: 'text-[var(--text-muted)]', error: 'text-red-400',
      refilling: 'text-purple-400', cooldown: 'text-amber-400', category_mode: 'text-indigo-400',
    };
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {s?.running && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />}
            <span className={`text-sm font-semibold ${phaseColor[s?.phase ?? 'idle']}`}>
              {phaseLabel[s?.phase ?? 'idle'] ?? s?.phase}
            </span>
          </div>
          <Button variant="danger" loading={stopLoading} onClick={stopJob}>
            Dừng
          </Button>
        </div>

        {/* Paused reason */}
        {s?.phase === 'paused' && s.pausedReason && (
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-400">
            ⏸ {s.pausedReason}
          </div>
        )}

        {/* Resource gauges */}
        {s && (
          <div className="rounded-lg border border-[var(--border)] p-3 space-y-2">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-2">Tài nguyên server</p>
            <div className="flex gap-4">
              <ResourceGauge label="CPU" value={s.cpuPercent} />
              <ResourceGauge label="RAM" value={s.ramPercent} />
            </div>
          </div>
        )}

        {/* 3-slot queue stats (continuous mode) */}
        {s && (s.domainQueuePending != null || s.keywordPoolUnused != null || s.slotAllocation != null) && (
          <div className="rounded-lg border border-[var(--border)] p-3 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <p className="text-[var(--text-muted)]">Domain queue</p>
              <p className="font-bold text-blue-400 tabular-nums">{s.domainQueuePending ?? '—'}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Keyword pool</p>
              <p className="font-bold text-purple-400 tabular-nums">{s.keywordPoolUnused ?? '—'}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Slots S/C</p>
              <p className="font-bold text-indigo-400 tabular-nums">
                {s.slotAllocation ? `${s.slotAllocation.searchSlots}/${s.slotAllocation.crawlSlots}` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Progress */}
        {s && s.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>Crawl tiến độ: {s.crawled} / {s.total} domain</span>
              <span className="tabular-nums">{crawlPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${crawlPct}%` }} />
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] text-[var(--text-muted)]">
              <span className="text-green-400">✓ {s.found} found</span>
              <span className="text-[var(--text-muted)]">⊘ {s.skipped} skipped</span>
              <span className="text-red-400">✗ {s.errors} errors</span>
              <span>Discovered: {s.discoveredCount}</span>
              {s.skippedOld > 0 && <span className="text-amber-400">⊗ {s.skippedOld} skip (old)</span>}
            </div>
          </div>
        )}

        {/* Recent domains log */}
        {s && s.recentDomains.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
            <p className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
              Log domain ({s.recentDomains.length})
            </p>
            <div className="max-h-52 overflow-y-auto font-mono text-xs">
              {s.recentDomains.map((d, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1 border-b border-[var(--border)] last:border-0">
                  <span className={d.status === 'found' ? 'text-green-400' : d.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'}>
                    {d.status === 'found' ? '✓' : d.status === 'error' ? '✗' : '—'}
                  </span>
                  <span className="text-indigo-400 flex-1 truncate">{d.domain}</span>
                  {d.score != null && (
                    <span className="text-[10px] text-amber-400 tabular-nums">{d.score.toFixed(2)}</span>
                  )}
                  <span className={`text-[10px] ${d.status === 'found' ? 'text-green-400' : d.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {s?.errorMsg && (
          <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-xs text-red-400">
            ✗ {s.errorMsg}
          </div>
        )}
      </div>
    );
  }

  // ── Phase: Done ───────────────────────────────────────────────────────────
  const s = status;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-800/50 bg-green-950/20 p-4">
        <p className="text-sm font-semibold text-green-400 mb-1">
          {s?.phase === 'error' ? '✗ Job lỗi' : s?.phase === 'stopped' ? '⏹ Job đã dừng' : '✓ Hoàn thành'}
        </p>
        {s && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              { label: 'Crawled', value: s.crawled, color: 'text-blue-400' },
              { label: 'Found', value: s.found, color: 'text-green-400' },
              { label: 'Skipped', value: s.skipped, color: 'text-[var(--text-muted)]' },
              { label: 'Errors', value: s.errors, color: 'text-red-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
        {s && s.skippedOld > 0 && (
          <p className="mt-2 text-[11px] text-amber-400">⊗ {s.skippedOld} domain bỏ qua (đã có trong DB)</p>
        )}
        {s?.errorMsg && <p className="mt-2 text-xs text-red-400">{s.errorMsg}</p>}
      </div>

      {/* Final domain log */}
      {s && s.recentDomains.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
          <p className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
            Log domain ({s.recentDomains.length})
          </p>
          <div className="max-h-52 overflow-y-auto font-mono text-xs">
            {s.recentDomains.map((d, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1 border-b border-[var(--border)] last:border-0">
                <span className={d.status === 'found' ? 'text-green-400' : d.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'}>
                  {d.status === 'found' ? '✓' : d.status === 'error' ? '✗' : '—'}
                </span>
                <span className="text-indigo-400 flex-1 truncate">{d.domain}</span>
                {d.score != null && (
                  <span className="text-[10px] text-amber-400 tabular-nums">{d.score.toFixed(2)}</span>
                )}
                <span className={`text-[10px] ${d.status === 'found' ? 'text-green-400' : d.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={() => { setPhase('setup'); setStatus(null); setAllKeywords([]); setSelected(new Set()); }}>
        ← Bắt đầu lại
      </Button>
    </div>
  );
}

// ─── Action: Crawl from Website Links ────────────────────────────────────────

const WEBSITE_SOURCES = ['trustpilot', 'futurepedia', 'g2', 'capterra', 'producthunt'] as const;
const LIMIT_OPTIONS   = [10, 25, 50, 100, 200, 500] as const;

function CrawlFromLinksForm() {
  const { toast }  = useToast();
  const t          = useTranslations('affiliateActions.crawlFromLinks');
  const apiError   = useApiError();

  const [getNew, setGetNew]       = useState<'true' | 'false' | ''>('');
  const [source, setSource]       = useState('');
  const [page, setPage]           = useState('');
  const [limit, setLimit]         = useState('');
  const [force, setForce]         = useState(false);

  const [links, setLinks]         = useState<string[] | null>(null);
  const [fetching, setFetching]   = useState(false);
  const [crawling, setCrawling]   = useState(false);
  const [crawlResult, setCrawlResult] = useState<unknown>(null);

  const getLinks = async () => {
    setFetching(true); setLinks(null); setCrawlResult(null);
    try {
      const res = await websitesLinksApi.getLinks({
        ...(getNew !== '' ? { getNew } : {}),
        ...(source ? { source } : {}),
        ...(page ? { page: Number(page) } : {}),
        ...(limit ? { limit: Number(limit) } : {}),
      });
      const data = res.data ?? [];
      setLinks(data);
      if (data.length === 0) toast(t('noLinks'), { type: 'info' });
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setFetching(false); }
  };

  const BATCH_SIZE = 100;

  const crawlLinks = async () => {
    if (!links || links.length === 0) return;
    setCrawling(true); setCrawlResult(null);
    try {
      // Batch into chunks of BATCH_SIZE to avoid 413 on large lists
      const chunks: string[][] = [];
      for (let i = 0; i < links.length; i += BATCH_SIZE) {
        chunks.push(links.slice(i, i + BATCH_SIZE));
      }
      const results = await Promise.all(
        chunks.map((chunk) => crawlAffiliateApi.crawlDomains({ domains: chunk, force }))
      );
      setCrawlResult(results.length === 1 ? results[0] : { batches: results.length, total: links.length });
      toast(t('crawlSuccess', { count: links.length }), { type: 'success' });
    } catch (e: unknown) {
      toast(apiError(e), { type: 'error' });
    } finally { setCrawling(false); }
  };

  const limitOptions = [
    { value: '', label: t('sourceAll') },
    ...LIMIT_OPTIONS.map((v) => ({ value: String(v), label: String(v) })),
  ];

  const sourceOptions = [
    { value: '', label: t('sourceAll') },
    ...WEBSITE_SOURCES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-5">{t('description')}</p>

      {/* Parameters */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 mb-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Parameters</p>

        {/* getNew toggle */}
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-2">getNew</label>
          <div className="flex gap-1.5">
            {([['', t('getNewAll')], ['true', t('getNewActive')], ['false', t('getNewInactive')]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setGetNew(val as '' | 'true' | 'false')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  getNew === val
                    ? val === 'true'
                      ? 'bg-green-600 text-white'
                      : val === 'false'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* source select */}
        <Select
          label={t('sourceLabel')}
          value={source}
          onValueChange={setSource}
          options={sourceOptions}
        />

        {/* page + limit */}
        <div className="flex flex-wrap gap-4 items-end">
          <Input
            label={t('pageLabel')}
            type="number"
            min="1"
            placeholder={t('pagePlaceholder')}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="w-28"
          />
          <Select
            label={t('limitLabel')}
            value={limit}
            onValueChange={setLimit}
            options={limitOptions}
          />
        </div>
      </div>

      {/* Get button */}
      <div className="flex items-center gap-3 mb-5">
        <Button icon={<Download size={13} />} loading={fetching} onClick={getLinks}>
          {fetching ? t('getting') : t('getButton')}
        </Button>
      </div>

      {/* Response preview */}
      {links !== null && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text)]">
                  {t('fetchedCount', { count: links.length })}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">data[]</span>
            </div>
            <div className="max-h-64 overflow-y-auto font-mono text-xs">
              {links.length === 0 ? (
                <p className="px-4 py-3 text-[var(--text-muted)]">{t('noLinks')}</p>
              ) : (
                links.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] group">
                    <span className="text-[var(--text-muted)] shrink-0 tabular-nums w-7 text-right">{i + 1}</span>
                    <span className="text-green-400 truncate flex-1">&quot;{url}&quot;</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Crawl section */}
          {links.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Crawl</p>
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[var(--accent)]" />
                {t('forceLabel')}
                <span className="text-xs text-[var(--text-muted)] opacity-70">— {t('forceHint')}</span>
              </label>
              <Button icon={<Play size={13} />} loading={crawling} onClick={crawlLinks}>
                {crawling ? t('crawling') : t('crawlButton', { count: links.length })}
              </Button>
              {crawlResult != null && (
                <pre className="mt-2 p-3 rounded bg-[var(--surface)] text-xs font-mono text-green-400 overflow-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(crawlResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Menu definition ──────────────────────────────────────────────────────────

type MenuItemId =
  | 'startCrawl'
  | 'discoverGoogle'
  | 'discoverGoogleAuto'
  | 'discoverSources'
  | 'freshnessReset'
  | 'crawlDomain'
  | 'crawlDomains'
  | 'crawlFromLinks'
  | 'improveLowScore'
  | 'upsert'
  | 'bypassAdvisor';

interface MenuItem {
  id: MenuItemId;
  labelKey: string;
  icon: React.ReactNode;
  badge?: string;
  subject: PermissionSubjectValues;
  action: PermissionActionValues;
}

// subject:action permission per item:
//   affiliate:create  → discovering / inserting new domain records
//   affiliate:update  → crawling / improving / resetting existing records
//   affiliate:manage  → covers both via hasPermission() logic
const MENU_ITEMS: MenuItem[] = [
  { id: 'startCrawl',         labelKey: 'affiliateActions.startCrawl.title',         icon: <Play size={14} />,       subject: S.AFFILIATE, action: A.UPDATE },
  { id: 'discoverGoogle',     labelKey: 'affiliateActions.discoverGoogle.title',      icon: <Search size={14} />,     subject: S.AFFILIATE, action: A.CREATE },
  { id: 'discoverGoogleAuto', labelKey: 'affiliateActions.discoverGoogleAuto.title',  icon: <Sparkles size={14} />,   subject: S.AFFILIATE, action: A.CREATE, badge: 'AUTO' },
  { id: 'discoverSources',    labelKey: 'affiliateActions.discoverSources.title',     icon: <Layers size={14} />,     subject: S.AFFILIATE, action: A.CREATE },
  { id: 'freshnessReset',     labelKey: 'affiliateActions.freshnessReset.title',      icon: <RefreshCw size={14} />,  subject: S.AFFILIATE, action: A.UPDATE },
  { id: 'crawlDomain',        labelKey: 'affiliateActions.crawlDomain.title',         icon: <Globe size={14} />,      subject: S.AFFILIATE, action: A.UPDATE },
  { id: 'crawlDomains',       labelKey: 'affiliateActions.crawlDomains.title',        icon: <Files size={14} />,      subject: S.AFFILIATE, action: A.UPDATE },
  { id: 'crawlFromLinks',     labelKey: 'affiliateActions.crawlFromLinks.title',      icon: <Link2 size={14} />,      subject: S.AFFILIATE, action: A.CREATE },
  { id: 'improveLowScore',    labelKey: 'affiliateActions.improveLowScore.title',     icon: <TrendingUp size={14} />, subject: S.AFFILIATE, action: A.UPDATE },
  { id: 'upsert',             labelKey: 'affiliateActions.upsert.title',              icon: <Pencil size={14} />,     subject: S.AFFILIATE, action: A.CREATE },
  { id: 'bypassAdvisor',      labelKey: 'affiliateActions.bypassAdvisor.title',       icon: <Shield size={14} />,     subject: S.AFFILIATE, action: A.UPDATE, badge: 'AI' },
];

// Guide & Examples content per action
const ACTION_CONTENT: Record<
  MenuItemId,
  { guide: React.ReactNode; examples: { label: string; desc: string }[] }
> = {
  startCrawl: {
    guide: (
      <>
        <p>Chạy batch crawl trên toàn bộ các domain đang chờ trong hàng đợi. Hệ thống sẽ ưu tiên các domain chưa được crawl hoặc đã hết hạn freshness.</p>
        <p><strong className="text-[var(--text)]">Limit</strong>: Giới hạn số domain xử lý trong một lần chạy — hữu ích khi muốn kiểm soát tải server.</p>
        <p><strong className="text-[var(--text)]">Force re-crawl</strong>: Bỏ qua kiểm tra freshness và crawl lại tất cả, kể cả domain vừa crawl gần đây.</p>
      </>
    ),
    examples: [
      { label: 'Crawl có kiểm soát', desc: 'Đặt Limit = 100 và bỏ Force để xử lý 100 domain đang chờ — an toàn cho production.' },
      { label: 'Full refresh', desc: 'Bật Force + để trống Limit để crawl lại toàn bộ DB, bất kể ngày cập nhật.' },
      { label: 'Test nhanh', desc: 'Đặt Limit = 5 để kiểm tra pipeline hoạt động đúng trước khi chạy batch lớn.' },
    ],
  },
  discoverGoogleAuto: {
    guide: (
      <>
        <p><strong className="text-[var(--text)]">Discover Google Auto</strong> để AI tự sinh từ khóa affiliate từ bộ template 60+ queries, sau đó tự động crawl Google và lưu domain mới.</p>
        <p>Chọn <strong className="text-[var(--text)]">Auto Apply</strong> để chạy hoàn toàn tự động, hoặc <strong className="text-[var(--text)]">Manual Select</strong> để xem và chọn keyword trước.</p>
        <p>Job chạy nền — hệ thống tự tạm dừng khi CPU/RAM vượt ngưỡng và tiếp tục khi tài nguyên ổn định.</p>
      </>
    ),
    examples: [
      { label: 'Auto hoàn toàn', desc: 'Chọn Auto Apply → Bắt đầu → AI tự sinh 60+ keyword và crawl liên tục đến khi đủ limit.' },
      { label: 'Chọn keyword thủ công', desc: 'Chọn Manual Select → xem danh sách keyword AI sinh → tick những keyword muốn → Crawl.' },
      { label: 'Kiểm tra server trước', desc: 'Nhấn "Kiểm tra" để xem CPU/RAM hiện tại trước khi chạy — tránh khởi động khi server đang bận.' },
    ],
  },
  discoverGoogle: {
    guide: (
      <>
        <p>Tìm kiếm Google theo từng keyword và trích xuất domain mới từ kết quả. Mỗi keyword cho ra một danh sách domain được thêm vào hàng đợi crawl.</p>
        <p>Dùng <strong className="text-[var(--text)]">AI Keyword Suggester</strong> để tự động gợi ý từ khóa theo chủ đề — nhập topic rồi chọn từ khóa phù hợp.</p>
        <p><strong className="text-[var(--text)]">Limit per keyword</strong>: Số domain tối đa thu thập mỗi keyword. Để trống = dùng giá trị mặc định hệ thống.</p>
      </>
    ),
    examples: [
      { label: 'SaaS affiliates', desc: '"saas affiliate program" + "recurring commission software 2024" → khám phá các chương trình SaaS trả hoa hồng định kỳ.' },
      { label: 'Dùng AI suggester', desc: 'Nhập topic "email marketing tools" vào AI Suggester → nhận 10–15 keyword cụ thể → thêm vào danh sách một click.' },
      { label: 'Giới hạn kết quả', desc: 'Đặt Limit = 50 để thu thập 50 domain/keyword, phù hợp khi kiểm tra chất lượng keyword trước khi chạy lớn.' },
    ],
  },
  discoverSources: {
    guide: (
      <>
        <p>Lấy domain từ các mạng affiliate tích hợp sẵn: <strong className="text-[var(--text)]">PartnerStack, ShareASale, Impact, CJ Affiliate, Awin, Rakuten</strong>.</p>
        <p>Không cần cấu hình — bấm một nút để quét tất cả nguồn và thêm domain mới vào hàng đợi.</p>
        <p>Phù hợp khi muốn khám phá hàng loạt mà không cần custom keyword.</p>
      </>
    ),
    examples: [
      { label: 'Khám phá hàng tuần', desc: 'Chạy mỗi tuần một lần để bổ sung domain mới từ các marketplace affiliate lớn nhất.' },
      { label: 'Kết hợp với Google', desc: 'Chạy Discover Sources trước → sau đó chạy Discover Google với keyword cụ thể để có coverage đầy đủ.' },
    ],
  },
  freshnessReset: {
    guide: (
      <>
        <p>Đánh dấu các domain là &quot;stale&quot; (hết hạn) để chúng được ưu tiên crawl trong lần chạy tiếp theo.</p>
        <p><strong className="text-[var(--text)]">Stale Days</strong>: Domain không được crawl lại trong X ngày sẽ bị đánh dấu stale. Để trống = dùng giá trị mặc định hệ thống (thường 7 ngày).</p>
        <p>Hữu ích khi bạn biết một nhóm domain đã thay đổi chương trình affiliate nhưng chưa đến ngày tự động refresh.</p>
      </>
    ),
    examples: [
      { label: 'Reset tuần', desc: 'Stale Days = 7 → đánh dấu tất cả domain chưa crawl trong 7 ngày qua, đưa vào hàng đợi ưu tiên.' },
      { label: 'Reset tháng', desc: 'Stale Days = 30 → chỉ reset domain thực sự cũ, phù hợp cho chương trình chạy monthly batch.' },
    ],
  },
  crawlDomain: {
    guide: (
      <>
        <p>Crawl ngay một domain cụ thể qua pipeline đầy đủ 3 tầng: <strong className="text-[var(--text)]">Axios → Playwright → FlareSolverr</strong>.</p>
        <p>Kết quả được lưu vào DB ngay lập tức — hữu ích để kiểm tra hoặc cập nhật một domain khẩn cấp.</p>
        <p><strong className="text-[var(--text)]">Force</strong>: Bỏ qua kiểm tra freshness, crawl lại kể cả khi dữ liệu còn mới.</p>
      </>
    ),
    examples: [
      { label: 'Crawl thủ công', desc: 'Nhập "stripe.com" → nhấn Enter → xem kết quả JSON ngay bên dưới để kiểm tra dữ liệu.' },
      { label: 'Kiểm tra sau chỉnh sửa', desc: 'Sau khi domain thay đổi trang affiliate, crawl lại ngay với Force để cập nhật dữ liệu.' },
      { label: 'Debug pipeline', desc: 'Crawl một domain biết là bị CF block để xem tier nào xử lý thành công trong log.' },
    ],
  },
  crawlDomains: {
    guide: (
      <>
        <p>Queue nhiều domain để crawl tuần tự — mỗi domain được xử lý qua pipeline đầy đủ theo thứ tự.</p>
        <p>Nhập mỗi domain trên một dòng (không cần https://) — dòng trống sẽ bị bỏ qua.</p>
        <p>Phù hợp khi có danh sách domain từ spreadsheet, nghiên cứu competitor, hoặc data import bên ngoài.</p>
      </>
    ),
    examples: [
      { label: 'Import từ spreadsheet', desc: 'Copy cột domain từ Excel, paste vào ô text — hệ thống tự parse từng dòng.' },
      { label: 'Crawl lại nhóm cụ thể', desc: 'Dán 20 domain cần refresh + bật Force để crawl lại toàn bộ ngay cả khi còn mới.' },
    ],
  },
  crawlFromLinks: {
    guide: (
      <>
        <p>Lấy danh sách domain từ API <strong className="text-[var(--text)]">websites/links</strong> (máy chủ 192.168.1.16:4000), xem trước toàn bộ danh sách, rồi mới crawl.</p>
        <p><strong className="text-[var(--text)]">getNew</strong>: Lọc theo trạng thái — <em>Mới</em> chỉ lấy domain chưa crawl, <em>Cũ</em> lấy domain đã có trong DB, <em>Tất cả</em> không lọc.</p>
        <p><strong className="text-[var(--text)]">Nguồn</strong>: Lọc theo nguồn dữ liệu — trustpilot, futurepedia, g2, capterra, producthunt. Để "Tất cả" để lấy từ mọi nguồn.</p>
        <p><strong className="text-[var(--text)]">Trang / Số lượng</strong>: Phân trang kết quả — cả hai phải được điền cùng nhau.</p>
      </>
    ),
    examples: [
      { label: 'Lấy domain mới từ Trustpilot', desc: 'getNew = Mới + Nguồn = trustpilot + Số lượng = 100 → Get → xem danh sách → Crawl.' },
      { label: 'Crawl theo trang', desc: 'Trang = 1 + Số lượng = 50 → Get → Crawl. Sau đó Trang = 2 + Crawl để lấy batch tiếp.' },
      { label: 'Crawl toàn bộ domain mới', desc: 'getNew = Mới + Tất cả nguồn → Get (bỏ giới hạn) → Crawl tất cả.' },
    ],
  },
  improveLowScore: {
    guide: (
      <>
        <p>Lấy tất cả chương trình có score thấp hơn ngưỡng và chạy LLM improvement tuần tự để cải thiện dữ liệu.</p>
        <p>LLM sẽ re-analyze HTML gốc và cố gắng trích xuất thêm: tên chương trình, signup URL, commission rate, loại hoa hồng...</p>
        <p><strong className="text-[var(--text)]">Model</strong>: <em>phi4</em> cho chất lượng tốt nhất, <em>deepseek-coder</em> cân bằng tốc độ/chất lượng, <em>mistral</em> nhanh nhất.</p>
      </>
    ),
    examples: [
      { label: 'Cải thiện batch thấp điểm', desc: 'Threshold = 40 → Load → Chạy → AI xử lý tuần tự từ score thấp nhất đến 40.' },
      { label: 'Chọn model theo nhu cầu', desc: 'Dùng phi4 cho accuracy cao nhất, hoặc mistral nếu cần xử lý nhanh nhiều domain.' },
      { label: 'Dừng giữa chừng', desc: 'Bấm Stop bất cứ lúc nào — tiến trình đã xử lý được lưu, có thể tiếp tục sau.' },
    ],
  },
  upsert: {
    guide: (
      <>
        <p>Tạo mới hoặc ghi đè một bản ghi affiliate program. Chỉ cần <strong className="text-[var(--text)]">Domain</strong> — tất cả trường khác là tuỳ chọn.</p>
        <p>Hữu ích cho các chương trình không auto-discover được qua crawler (private affiliate, invite-only programs...).</p>
        <p>Nếu domain đã tồn tại, chỉ các trường bạn điền mới bị ghi đè — trường bỏ trống giữ nguyên.</p>
      </>
    ),
    examples: [
      { label: 'Thêm program thủ công', desc: 'Điền domain + program name + signup URL + commission rate → Save để tạo record tức thì.' },
      { label: 'Cập nhật commission', desc: 'Chỉ điền domain + commissionRate mới → Save để cập nhật, các trường khác không thay đổi.' },
    ],
  },
  bypassAdvisor: {
    guide: (
      <>
        <p><strong className="text-[var(--text)]">Bypass Advisor</strong> đọc toàn bộ fetch log từ database, phân tích tỉ lệ thành công của từng tier, rồi dùng AI để chẩn đoán vấn đề.</p>
        <p>Sau khi có kết quả ban đầu, bạn có thể hỏi tiếp trong chat để được tư vấn cụ thể hơn về cấu hình, thay thế tool, hoặc chiến lược bypass.</p>
      </>
    ),
    examples: [
      { label: 'Phân tích định kỳ', desc: 'Chạy mỗi tuần để theo dõi xu hướng — nếu T1 axios tụt xuống < 30%, có thể site đang tăng cường anti-bot.' },
      { label: 'Hỏi về lỗi cụ thể', desc: 'Sau khi phân tích, gõ: "CF_BLOCK chiếm nhiều — làm gì để giảm?" để AI đề xuất cụ thể.' },
    ],
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateActionsPage() {
  const t = useTranslations('affiliateActions');
  const { user } = useAuth();
  const perms = user?.permissions ?? [];

  const visibleItems = MENU_ITEMS.filter(({ subject, action }) =>
    hasPermission(perms, subject, action),
  );

  const [activeId, setActiveId] = useState<MenuItemId>(() =>
    visibleItems[0]?.id ?? 'startCrawl',
  );
  const [activeTab, setActiveTab] = useState<ActionTab>('guide');

  useEffect(() => {
    if (visibleItems.length > 0 && !visibleItems.find((i) => i.id === activeId)) {
      setActiveId(visibleItems[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms.join(',')]);

  const handleMenuSelect = (id: MenuItemId) => {
    setActiveId(id);
    setActiveTab('guide');
  };

  const active = visibleItems.find((m) => m.id === activeId) ?? visibleItems[0];
  const content = active ? ACTION_CONTENT[active.id] : null;

  const getMenuLabel = (item: MenuItem): string => {
    // Map menu item id → translation key suffix
    const map: Record<MenuItemId, string> = {
      startCrawl:         t('startCrawl.title'),
      discoverGoogle:     t('discoverGoogle.title'),
      discoverGoogleAuto: t('discoverGoogleAuto.title'),
      discoverSources:    t('discoverSources.title'),
      freshnessReset:  t('freshnessReset.title'),
      crawlDomain:     t('crawlDomain.title'),
      crawlDomains:    t('crawlDomains.title'),
      crawlFromLinks:  t('crawlFromLinks.title'),
      improveLowScore: t('improveLowScore.title'),
      upsert:          t('upsert.title'),
      bypassAdvisor:   t('bypassAdvisor.title'),
    };
    return map[item.id];
  };

  if (visibleItems.length === 0 || !active) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-base font-semibold text-[var(--text)]">Không có quyền truy cập</p>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          Bạn cần có affiliate:create hoặc affiliate:update để sử dụng các action này.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Sidebar menu ── */}
        <nav className="w-56 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[var(--border)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Chọn action</p>
          </div>
          <ul className="py-1.5 space-y-0.5 px-1.5">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuSelect(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    activeId === item.id
                      ? 'bg-[var(--accent)] text-white font-medium'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1 leading-tight">{getMenuLabel(item)}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${activeId === item.id ? 'bg-white/20 text-white' : 'bg-indigo-900/50 text-indigo-400'}`}>
                      {item.badge}
                    </span>
                  )}
                  {activeId === item.id && <ChevronRight size={12} className="shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          <Card title={getMenuLabel(active)}>
            {activeId !== 'bypassAdvisor' && activeId !== 'discoverGoogleAuto' && (
              <ActionTabs activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            {activeTab === 'guide' && activeId !== 'bypassAdvisor' && activeId !== 'discoverGoogleAuto' && content && (
              <GuideBlock>{content.guide}</GuideBlock>
            )}

            {activeTab === 'examples' && activeId !== 'bypassAdvisor' && activeId !== 'discoverGoogleAuto' && content && (
              <ExampleBlock items={content.examples} />
            )}

            {(activeTab === 'action' || activeId === 'bypassAdvisor' || activeId === 'discoverGoogleAuto') && (
              <>
                {activeId === 'startCrawl'         && <StartCrawlForm />}
                {activeId === 'discoverGoogle'      && <DiscoverGoogleForm />}
                {activeId === 'discoverGoogleAuto'  && <DiscoverGoogleAutoPanel />}
                {activeId === 'discoverSources'     && <DiscoverSourcesForm />}
                {activeId === 'freshnessReset'      && <FreshnessResetForm />}
                {activeId === 'crawlDomain'         && <CrawlDomainForm />}
                {activeId === 'crawlDomains'        && <CrawlDomainsForm />}
                {activeId === 'crawlFromLinks'      && <CrawlFromLinksForm />}
                {activeId === 'improveLowScore'     && <LlmImproveLowScoreForm />}
                {activeId === 'upsert'              && <UpsertForm />}
                {activeId === 'bypassAdvisor'       && <BypassAdvisorPanel />}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
