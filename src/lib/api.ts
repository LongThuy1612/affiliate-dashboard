import { getAccessToken, getRefreshToken, setTokens, clearTokens, authApi } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
// Backend origin without the /api suffix — for resolving asset paths like
// Announcement.imageUrl (served from the backend's own /uploads, not this
// Next.js app's public/uploads) into absolute URLs.
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

// Announcement.imageUrl comes back as a root-relative path (e.g.
// "/uploads/x.jpg"). Used bare in an <img src>, that resolves against this
// Next.js app's own origin, which has no /uploads route — the asset only
// exists on the backend. Absolute URLs (http://...) pass through unchanged.
export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

// Access tokens expire after 1h (see services/auth.service.js ACCESS_TOKEN_TTL).
// Without this, any request made after the token expires throws a raw 401 and
// the user has to hard-refresh the page (AuthContext only refreshes on mount)
// to keep working. Dedupe concurrent refreshes behind one shared promise —
// sequential batch actions (e.g. the "AI Improve Low-Score" loop) can fire
// several requests close together, and without dedup each one would race to
// call /auth/refresh with the same refresh token at once.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      try {
        const { accessToken, refreshToken: newRefreshToken } = await authApi.refreshToken(refreshToken);
        setTokens(accessToken, newRefreshToken);
        return accessToken;
      } catch (err) {
        clearTokens();
        throw err;
      }
    })();
    refreshPromise.finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function request<T>(path: string, options?: RequestInit, _isRetry = false): Promise<T> {
  const token = getAccessToken();
  // `...options` first — see auth.ts's authRequest for why the order matters
  // (a shallow-spread `headers` after `...options` silently drops everything
  // built above whenever a caller passes its own `options.headers`).
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401 && !_isRetry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, true);
    } catch {
      // Refresh itself failed (refresh token expired/invalid) — fall through
      // to the normal error path below so the caller sees a real 401 and the
      // app can redirect to login instead of retrying forever.
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommissionType = 'one_time' | 'recurring' | 'unknown';

export interface AffiliateSubPage {
  id: number;
  domain: string;
  pageUrl: string;
  pagePath: string;
  programName: string | null;
  signupUrl: string | null;
  commissionRate: string | null;
  commissionType: string;
  recurringDuration: string | null;
  paymentTerms: string | null;
  cookieDays: number | null;
  confidence: number;
  affiliateNetwork: string | null;
  affiliateNetworkUrl: string | null;
  productCategory: string;
  hasSignupForm: boolean;
  signupFormType: string | null;
  affiliateScore: number;
  llmEnriched: boolean;
  thirdPartySource?: boolean;
  screenshotPath?: string | null;
  screenshotAt?: string | null;
  crawledAt: string;
  updatedAt: string;
  // Present only for sub-pages written by persistVerifiedCitations (LLM
  // search citation verification) instead of the regular crawl pipeline —
  // see affiliateCrawler.js. verifiedFields lists which field(s) were
  // confirmed against this exact page; pageTextExcerpt is the evidence text
  // (first 5000 chars) a human can spot-check against the claimed value.
  rawPageData?: {
    verifiedFields?: Record<string, string | number>;
    pageTextExcerpt?: string;
    verifiedAt?: string;
  } | null;
}

export interface AffiliateProgram {
  domain: string;
  programName: string | null;
  signupUrl: string | null;
  commissionRate: string | null;
  commissionType: CommissionType;
  recurringDuration: string | null;
  paymentTerms: string | null;
  cookieDays: number | null;
  confidence: number;
  affiliateScore: number;
  signupUrlVerified: boolean;
  dataSource: string | null;
  affiliateNetwork: string | null;
  fingerprintTier: string;
  llmEnriched: boolean;
  crawlCount: number;
  crawledAt: string;
  updatedAt: string;
  affiliateNetworkUrl: string | null;
  loginPageUrl: string | null;
  allSignupUrls: string[] | null;
  sourceUrls: string[] | null;
  rawAffiliateData: string | Record<string, unknown> | null;
  contentHash: string | null;
  lastVerifiedAt: string | null;
  previousScore: number | null;
  subProgramCount?: number;
  subPages?: AffiliateSubPage[];
  rateHistory?: Array<{ rate: string | null; type: string; crawledAt: string }>;
  rateChangeCount?: number;
  rateChangedAt?: string | null;
  screenshotPath?: string | null;
  screenshotAt?: string | null;
  /** Highest fetchUrl() tier that returned HTML: 1=axios, 2=playwright, 3=flaresolverr, null=all failed */
  fetchTierReached: number | null;
  /** Error code from the last failed fetch tier */
  lastFetchError: string | null;
  llmModel?: string | null;
  /** Per-user "I signed up for this" marker — signedUpByMe is the current user's own status;
   * anyoneSignedUp is a shared/group signal (true if ANY user has marked it). See affiliate-signup-marker. */
  signedUpByMe?: boolean;
  anyoneSignedUp?: boolean;
  /** Cached SimilarWeb traffic snapshot, joined in by GET /affiliate (list) — null if never synced. */
  domainTraffic?: DomainTraffic | null;
}

/** Cached SimilarWeb traffic snapshot for a domain (list view subset) — see similarwebApi.js on the backend. */
export interface DomainTraffic {
  rank: number | null;
  /** BigInt on the backend, serialized to a string over JSON. */
  monthlyVisits: string | null;
  last1MonthGrowth: number | null;
  bounceRate: number | null;
  /** Seconds. */
  timeOnSite: number | null;
  fetchedAt: string | null;
  lastFetchStatus: string | null;
}

/** One country's traffic share within DomainTrafficFull.geography.Data. */
export interface DomainTrafficGeoEntry {
  Rank: number;
  Share: number;
  Change: number;
  /** Numeric ISO-ish country code as used by SimilarWeb, not ISO-3166 alpha. */
  Country: number;
  BounceRate: number;
  UsersShare: number;
  PagePerVisit: number;
  AvgVisitDuration: number;
}

export interface DomainTrafficGeography {
  Data: DomainTrafficGeoEntry[];
  Filters?: { country?: Array<{ id: string; text: string; formattedText: string }> };
  TotalCount?: number;
}

/** Subset of the raw SimilarWeb payload worth surfacing beyond the normalized columns. */
export interface DomainTrafficRawData {
  title?: string;
  icon?: string;
  employeeRange?: string;
  categoryRanking?: number;
  highestTrafficCountry?: number;
  engagement?: {
    Data?: Array<{
      UniqueUsers?: number;
      VisitsPerUser?: number;
      TotalPagesViews?: number;
      AvgVisitDuration?: number;
      DedupUniqueUsers?: number;
    }>;
  };
}

/** Full SimilarWeb traffic snapshot — returned by GET /affiliate/traffic/:domain. */
export interface DomainTrafficFull extends DomainTraffic {
  trendData: number[] | null;
  pagesPerVisit: number | null;
  category: string | null;
  description: string | null;
  trafficSources: Record<string, number> | null;
  organicKeywords: unknown[] | null;
  paidKeywords: unknown[] | null;
  geography: DomainTrafficGeography | null;
  companyInfo: Record<string, unknown> | null;
  fetchCount: number;
  cached: boolean;
  lastFetchError: string | null;
  rawData: DomainTrafficRawData | null;
}

export interface AffiliateProgramTree {
  domain: string;
  parent: AffiliateProgram;
  subPages: AffiliateSubPage[];
  subProgramCount: number;
  hasVerifiedSignup: boolean;
}

export interface AffiliateFetchLog {
  id: number;
  domain: string;
  url: string;
  tier: number;
  tierName: string;
  success: boolean;
  errorCode: string | null;
  errorMsg: string | null;
  durationMs: number | null;
  crawledAt: string;
}

export interface FetchLogTierStat {
  tier: number;
  tierName: string;
  success: number;
  failed: number;
}

export interface FetchLogStats {
  total: number;
  avgDurationMs: number;
  byTier: FetchLogTierStat[];
  byErrorCode: { errorCode: string; count: number }[];
}

export interface BypassTierStat extends FetchLogTierStat {
  total: number;
  successRate: number;
}

export interface BypassAnalysisResponse {
  stats: {
    total: number;
    avgDurationMs: number;
    byTier: BypassTierStat[];
    byErrorCode: { errorCode: string; count: number }[];
  };
  suggestion: string;
}

export interface BypassProposal {
  id: string;
  title: string;
  type: 'tier1_headers' | 'tier2_config' | 'escalation_rule' | 'retry_policy' | 'infrastructure';
  targetError: string[];
  change: Record<string, unknown>;
  reason: string;
  predictedImprovement: number;
  risk: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  autoApplyEligible: boolean;
}

export interface BypassStructuredResponse {
  stats: {
    total: number;
    avgDurationMs: number;
    byTier: BypassTierStat[];
    byErrorCode: { errorCode: string; count: number }[];
  };
  diagnosis: string;
  proposals: BypassProposal[];
}

export interface BypassExperimentDomainResult {
  domain: string;
  fetchSuccess: boolean;
  tierReached: number | null;
  tierName: string | null;
  logs: {
    url: string;
    tier: number;
    tierName: string;
    success: boolean;
    errorCode: string | null;
    durationMs: number | null;
  }[];
}

export interface BypassExperimentResult {
  experimentId: number;
  sampleDomains: string[];
  baselineSuccessRate: number;
  testSuccessRate: number;
  improvement: number;
  rawResults: BypassExperimentDomainResult[];
  error?: string;
}

export interface BypassConfigState {
  current: {
    proposals: BypassProposal[];
    description: string;
    appliedAt: string;
    experimentId: number | null;
  } | null;
  previous: {
    proposals: BypassProposal[];
    description: string;
    appliedAt: string;
    experimentId: number | null;
  } | null;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: T[];
}

export interface AffiliateStats {
  total: number;
  withCommissionRate: number;
  withCookieDays: number;
  avgConfidence: number;
  byCommissionType: Record<string, number>;
  scoreDistribution: { excellent: number; good: number; medium: number; low: number; veryLow: number };
  byDataSource: Record<string, number>;
  byProductCategory: Record<string, number>;
}

export interface AnalysisStatsResponse {
  programs: AffiliateStats;
  fetchTier: FetchLogStats;
}

export interface AnalysisLlmModelStat {
  model: string;
  total: number;
  improved: number;
  unchanged: number;
  degraded: number;
  improvedPct: number;
  avgScoreDelta: number;
  avgDurationMs: number;
}

export interface AnalysisLlmRangeStat {
  range: string;
  count: number;
  avgDelta: number;
  improved: number;
  unchanged: number;
  degraded: number;
}

export interface AnalysisLlmModelsResponse {
  summary: {
    total: number;
    improved: number;
    unchanged: number;
    degraded: number;
    improvedPct: number;
    avgScoreDelta: number;
    avgDurationMs: number;
  };
  perModel: AnalysisLlmModelStat[];
  byScoreRange: AnalysisLlmRangeStat[];
}

export interface LlmAuditRow {
  id: number;
  domain: string;
  scoreBefore: number;
  scoreAfter: number;
  confidenceBefore: number;
  confidenceAfter: number;
  llmModel: string | null;
  durationMs: number | null;
  crawledAt: string;
}

export interface LlmAuditResponse {
  total: number;
  page: number;
  pages: number;
  summary: {
    improved: number;
    unchanged: number;
    degraded: number;
    improvedPct: number;
    avgScoreDelta: number;
    avgDurationMs: number;
  };
  rows: LlmAuditRow[];
}

export interface Proxy {
  id: number;
  ip: string;
  port: number;
  username: string | null;
  password: string | null;
  isLive: number;
  lastCheck: string | null;
  createdAt: string;
}

export interface ProxyListResponse {
  total: number;
  proxies: Proxy[];
}

export interface ProxyStats {
  total: number;
  live: number;
  dead: number;
}

// ─── Affiliate API ────────────────────────────────────────────────────────────

export interface AffiliateListParams {
  page?: number;
  limit?: number;
  commissionType?: CommissionType;
  minConfidence?: number;
  domain?: string;
  orderBy?: 'confidence' | 'crawledAt' | 'updatedAt' | 'domain' | 'affiliateScore';
  order?: 'asc' | 'desc';
  scoreMax?: number;
  scoreMin?: number;
  hasCommission?: boolean;
  dateField?: 'crawledAt' | 'updatedAt';
  dateFrom?: string;
  dateTo?: string;
  signedUpByMe?: boolean;
  notSignedUpByMe?: boolean;
  anyoneSignedUp?: boolean;
  noneSignedUp?: boolean;
}

// Selectable Excel export columns — must mirror the backend's allowed list exactly
// (services/affiliate.service.js EXPORT_COLUMNS, trustpilot_crawl repo).
export const EXPORT_COLUMNS = [
  { key: 'programName', label: 'Program Name' },
  { key: 'signupUrl', label: 'Signup Url' },
  { key: 'commissionRate', label: 'Commission Rate' },
  { key: 'commissionType', label: 'Commission Type' },
  { key: 'recurringDuration', label: 'Recurring Duration' },
  { key: 'paymentTerms', label: 'Payment Terms' },
  { key: 'cookieDays', label: 'Cookie Days' },
  { key: 'affiliateNetwork', label: 'Affiliate Network' },
  { key: 'productCategory', label: 'Product Category' },
] as const;

export type ExportColumnKey = typeof EXPORT_COLUMNS[number]['key'];

export interface AffiliateExportParams extends Omit<AffiliateListParams, 'page' | 'limit'> {
  columns?: ExportColumnKey[];
  maxRows?: number;
  domains?: string[];
}

export class ExportRowCapError extends Error {
  total: number;
  maxRows: number;
  constructor(message: string, total: number, maxRows: number) {
    super(message);
    this.name = 'ExportRowCapError';
    this.total = total;
    this.maxRows = maxRows;
  }
}

export interface ImportRowError {
  row: number;
  domain: string | null;
  reason: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: ImportRowError[];
}

// Columns accepted by import — identical to EXPORT_COLUMNS (domain is always required and
// implicit, not part of this list). Kept as a separate export so the import rules panel can
// reference it without implying every export column is optional on import too.
export const IMPORT_COLUMNS = EXPORT_COLUMNS;

export const affiliateApi = {
  list: (params: AffiliateListParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
    return request<PaginatedResponse<AffiliateProgram>>(`/affiliate?${q}`);
  },

  get: (domain: string) => request<AffiliateProgram>(`/affiliate/${encodeURIComponent(domain)}`),

  getTree: (domain: string) => request<AffiliateProgramTree>(`/affiliate/tree/${encodeURIComponent(domain)}`),

  getDomainTraffic: (domain: string) => request<DomainTrafficFull | null>(`/affiliate/traffic/${encodeURIComponent(domain)}`),

  markSignedUp: (domain: string) =>
    request<{ domain: string; markedByUserId: number; markedByUsername: string; markedAt: string }>(
      `/affiliate/signup/${encodeURIComponent(domain)}`,
      { method: 'POST' },
    ),

  unmarkSignedUp: (domain: string) =>
    request<{ success: true; domain: string }>(
      `/affiliate/signup/${encodeURIComponent(domain)}`,
      { method: 'DELETE' },
    ),

  markSignedUpBulk: (domains: string[]) =>
    request<{ marked: number; failed: string[] }>('/affiliate/signup-bulk/mark', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    }),

  unmarkSignedUpBulk: (domains: string[]) =>
    request<{ unmarked: number; failed: string[] }>('/affiliate/signup-bulk/unmark', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    }),

  getSubPageScreenshot: async (id: number): Promise<string | null> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/subpage-screenshot/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  exportXlsx: async (params: AffiliateExportParams = {}): Promise<void> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '') return;
      if (k === 'columns') {
        (v as ExportColumnKey[]).forEach((col) => q.append('columns[]', col));
      } else if (k === 'domains') {
        (v as string[]).forEach((d) => q.append('domains[]', d));
      } else {
        q.set(k, String(v));
      }
    });

    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/export?${q}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      if (res.status === 400 && typeof body.total === 'number' && typeof body.maxRows === 'number') {
        throw new ExportRowCapError(body.error ?? 'Too many rows to export', body.total, body.maxRows);
      }
      throw new Error(body.error ?? 'Export failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `affiliate-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  importXlsx: async (file: File): Promise<ImportResult> => {
    const token = getAccessToken();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${BASE_URL}/affiliate/import`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
      body: form,
    });

    const body = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error(body.error ?? 'Import failed');
    return body as ImportResult;
  },

  downloadImportTemplate: async (): Promise<void> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/import-template`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (!res.ok) throw new Error('Failed to download template');

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'affiliate-import-template.xlsx';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  getScreenshot: async (domain: string): Promise<string | null> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/screenshot/${encodeURIComponent(domain)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  stats: () => request<AffiliateStats>('/affiliate/stats'),

  llmAudit: (params: {
    page?: number; limit?: number; domain?: string; llmModel?: string; improvedOnly?: boolean;
    orderBy?: 'crawledAt' | 'scoreBefore' | 'scoreAfter' | 'confidenceBefore' | 'confidenceAfter' | 'durationMs';
    order?: 'asc' | 'desc';
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
    return request<LlmAuditResponse>(`/affiliate/llm-audit?${q}`);
  },

  llmAuditModels: () => request<string[]>('/affiliate/llm-models'),

  fetchLogs: (domain: string, limit = 100) =>
    request<{ domain: string; total: number; rows: AffiliateFetchLog[] }>(
      `/affiliate/fetch-logs/${encodeURIComponent(domain)}?limit=${limit}`
    ),

  fetchLogStats: () => request<FetchLogStats>('/affiliate/fetch-log-stats'),

  analysisStats: () => request<AnalysisStatsResponse>('/affiliate/analysis/stats'),

  analysisLlmModels: () => request<AnalysisLlmModelsResponse>('/affiliate/analysis/llm-models'),

  ollamaModels: () => request<string[]>('/affiliate/ollama-models'),

  aiKeywords: (topic: string, model?: string) =>
    request<{ keywords: string[] }>('/affiliate/ai-keywords', {
      method: 'POST',
      body: JSON.stringify({ topic, model }),
    }),

  aiAnalyst: (question: string, model?: string) =>
    request<{ answer: string }>('/affiliate/ai-analyst', {
      method: 'POST',
      body: JSON.stringify({ question, model }),
    }),

  bypassAnalysis: (params: { model?: string; question?: string } = {}) =>
    request<BypassAnalysisResponse>('/affiliate/bypass-analysis', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  bypassStructured: (params: { model?: string } = {}) =>
    request<BypassStructuredResponse>('/affiliate/bypass-structured', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  bypassGetConfig: () =>
    request<BypassConfigState>('/affiliate/bypass-config'),

  bypassApplyConfig: (params: { proposals: BypassProposal[]; description?: string; experimentId?: number }) =>
    request<{ success: boolean; config: BypassConfigState['current'] }>('/affiliate/bypass-apply-config', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  bypassRollback: (params: { mode?: 'force' | 'auto'; experimentId?: number } = {}) =>
    request<{ success: boolean; action: string; improvement?: number; restoredConfig?: BypassConfigState['current'] }>(
      '/affiliate/bypass-rollback',
      { method: 'POST', body: JSON.stringify(params) }
    ),

  bypassRunExperiment: (params: { proposalId: string; proposal: BypassProposal; sampleSize?: number; windowHours?: number }) =>
    request<BypassExperimentResult>('/crawl-affiliate/bypass-experiment', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  upsert: (data: Partial<AffiliateProgram> & { domain: string }) =>
    request<AffiliateProgram>('/affiliate', { method: 'POST', body: JSON.stringify(data) }),

  delete: (domain: string) =>
    request<{ success: boolean }>(`/affiliate/${encodeURIComponent(domain)}`, { method: 'DELETE' }),

  rawHtml: (domain: string, path = '/') =>
    request<RawHtmlResult>(`/affiliate/raw-html/${encodeURIComponent(domain)}?path=${encodeURIComponent(path)}`),

  fetchDom: (domain: string, path = '/') =>
    request<FetchDomResult>(`/affiliate/fetch-dom/${encodeURIComponent(domain)}?path=${encodeURIComponent(path)}`),
};

// ─── Crawl Affiliate API ──────────────────────────────────────────────────────

export const crawlAffiliateApi = {
  start: (params?: { force?: boolean; limit?: number }) =>
    request<object>('/crawl-affiliate', { method: 'POST', body: JSON.stringify(params || {}) }),

  discover: (params?: { queries?: string[]; limit?: number; skipOld?: boolean }) =>
    request<object>('/crawl-affiliate/discover', { method: 'POST', body: JSON.stringify(params || {}) }),

  discoverSources: (params?: object) =>
    request<object>('/crawl-affiliate/discover-sources', { method: 'POST', body: JSON.stringify(params || {}) }),

  freshnessReset: (params?: { staleDays?: number }) =>
    request<object>('/crawl-affiliate/freshness-reset', { method: 'POST', body: JSON.stringify(params || {}) }),

  crawlDomain: (params: { domain: string; force?: boolean }) =>
    request<object>('/crawl-affiliate/domain', { method: 'POST', body: JSON.stringify(params) }),

  crawlDomains: (params: { domains: string[]; force?: boolean }) =>
    request<object>('/crawl-affiliate/domains', { method: 'POST', body: JSON.stringify(params) }),

  crawlDomainsBatch: (params: { domains: string[]; force?: boolean }) =>
    request<{ started: boolean; message: string }>(
      '/crawl-affiliate/domains-batch',
      { method: 'POST', body: JSON.stringify(params) },
    ),

  crawlDomainsBatchStatus: () => request<CrawlDomainsBatchStatus>('/crawl-affiliate/domains-batch/status'),

  crawlDomainsBatchStop: () => request<{ stopped: boolean }>(
    '/crawl-affiliate/domains-batch/stop',
    { method: 'POST', body: '{}' },
  ),

  llmImprove: (domains: string[], model?: string) =>
    request<{
      total: number; improved: number; errors: number;
      // deleted: true, no `error`/`updated` — processDomain() reconfirmed the
      // domain's score is 0 after this LLM pass and removed its record
      // (AUTO_DELETE_ZERO_SCORE). Distinct from a domain that was simply
      // left unchanged.
      results: Array<{ domain: string; found?: boolean; updated?: boolean; deleted?: boolean; error?: string }>;
    }>('/crawl-affiliate/llm-improve', {
      method: 'POST',
      body: JSON.stringify({ domains, ...(model ? { model } : {}) }),
    }),

  ladyToolsImprove: (domains: string[]) =>
    request<{
      total: number; improved: number; deleted: number; errors: number;
      results: Array<{ domain: string; updated?: boolean; deleted?: boolean; error?: string; reason?: string; affiliateScore?: number }>;
    }>('/crawl-affiliate/lady-tools-improve', {
      method: 'POST',
      body: JSON.stringify({ domains }),
    }),

  // Manually close every open AdsPower/Lady Tools browser tab — for stuck/
  // wedged Lady Tools or just freeing RAM on demand, independent of account
  // cooldown state (see DiscoverAutoStatus.ladyToolsAuto.paused for that).
  ladyToolsClose: () =>
    request<{ closed: number }>('/crawl-affiliate/lady-tools-close', {
      method: 'POST',
      body: '{}',
    }),

  // Force an immediate account-status re-check + batch attempt, skipping the
  // up-to-1-min wait for the next scheduled auto-poll tick. Meant for the
  // "Thử lại ngay" button shown while ladyToolsAuto.paused is true.
  ladyToolsRetryNow: () =>
    request<{ triggered: boolean }>('/crawl-affiliate/lady-tools-retry-now', {
      method: 'POST',
      body: '{}',
    }),

  // Turn the auto-poll Lady Tools loop off/on without touching the main domain
  // crawl — unlike ladyToolsClose (only closes whatever tab is open right now;
  // the next scheduled tick opens a new one anyway), this stops the tick from
  // opening any future tab until re-enabled. See DiscoverAutoStatus.ladyToolsAuto.disabled.
  ladyToolsAutoDisable: () =>
    request<{ disabled: boolean }>('/crawl-affiliate/lady-tools-auto-disable', {
      method: 'POST',
      body: '{}',
    }),
  ladyToolsAutoEnable: () =>
    request<{ disabled: boolean }>('/crawl-affiliate/lady-tools-auto-enable', {
      method: 'POST',
      body: '{}',
    }),

  discoverAuto: (params: {
    keywords: string[];
    limit?: number;
    cpuMin?: number; cpuMax?: number;
    ramMin?: number; ramMax?: number;
    batchSize?: number;
    skipOld?: boolean;
    autoRestart?: boolean;
    // Score threshold (inclusive) below which a domain qualifies for the auto Lady
    // Tools LLM-improve pass. Backend default 30 if omitted.
    llmScoreThreshold?: number;
    // Confidence threshold (0-100 scale, inclusive) below which a domain ALSO
    // qualifies, independent of score — catches passable-score-but-low-confidence
    // domains. Backend default 30 if omitted.
    llmConfidenceThreshold?: number;
    // Whether this session should run the auto Lady Tools LLM-improve loop at
    // all. Continuous crawl's own Phase 1A pass is always regex-only — the
    // ladyToolsAuto background poll is the ONLY place LLM enrichment happens
    // during continuous crawl, so this is the real "use LLM or not" switch for
    // a run (llmScoreThreshold/llmConfidenceThreshold above only tune WHICH
    // domains qualify once the loop is already on). Backend default true if omitted.
    enableLlmAuto?: boolean;
  }) => request<{ started: boolean; message: string }>(
    '/crawl-affiliate/discover-auto',
    { method: 'POST', body: JSON.stringify(params) },
  ),

  discoverAutoStatus: () => request<DiscoverAutoStatus>('/crawl-affiliate/discover-auto/status'),

  discoverSearchStatus: () => request<DiscoverSearchStatus>('/crawl-affiliate/discover/status'),

  discoverAutoStop: () => request<{ stopped: boolean }>(
    '/crawl-affiliate/discover-auto/stop',
    { method: 'POST', body: '{}' },
  ),
};

export interface DiscoverSearchStatus {
  active: boolean;
  currentQuery: string | null;
  queriesTotal: number;
  queriesDone: number;
  domainsFound: number;
  captchaTotal: number;
  consecutiveCaptchas: number;
  respawnCount: number;
  networkFailCount: number;
  warnings: string[];
  startedAt: number | null;
  finishedAt: number | null;
}

export interface DiscoverAutoStatus {
  running: boolean;
  stopRequested: boolean;
  phase: 'idle' | 'discovering' | 'crawling' | 'paused' | 'done' | 'stopped' | 'error' | 'refilling' | 'cooldown' | 'category_mode';
  keywords: string[];
  skipOld: boolean;
  discoveredCount: number;
  skippedOld: number;
  crawled: number;
  found: number;
  errors: number;
  skipped: number;
  total: number;
  cpuPercent: number;
  ramPercent: number;
  pausedReason: string | null;
  recentDomains: { domain: string; status: 'found' | 'skip' | 'error'; score?: number | null }[];
  startedAt: string | null;
  finishedAt: string | null;
  errorMsg: string | null;
  // continuous mode extras
  domainQueuePending?: number | null;
  keywordPoolUnused?: number | null;
  slotAllocation?: { searchSlots: number; crawlSlots: number } | null;
  cycle?: number;
  _ramPressure?: string | null;
  // Auto Lady Tools improve (continuous mode only) — accumulates low-score,
  // never-LLM'd domains and runs them through Lady Tools once enough have
  // built up. See _runContinuousCrawl's _ladyToolsAutoInterval on the backend.
  ladyToolsAuto?: {
    running: boolean;
    pendingCount: number;
    lastRunAt: string | null;
    totalImproved: number;
    totalDeleted: number;
    totalErrors: number;
    // Set when getLadyToolsAccountStatus() reports no Gmail account is
    // currently usable (all exhausted/cooling down) — the tick is skipped
    // rather than attempting a call that would fail anyway.
    paused?: boolean;
    pausedReason?: string | null;
    nextRetryAt?: string | null;
    // true when the operator has manually turned off the auto-poll loop via
    // ladyToolsAutoDisable (or started the session with enableLlmAuto:false) —
    // distinct from `paused`, which is automatic/temporary (account cooldown).
    disabled?: boolean;
  } | null;
}

export interface CrawlDomainsBatchStatus {
  running: boolean;
  stopRequested: boolean;
  phase: 'idle' | 'running' | 'done' | 'stopped' | 'error';
  total: number;
  done: number;
  found: number;
  errors: number;
  skipped: number;
  recentDomains: { domain: string; status: 'found' | 'skip' | 'error'; message?: string | null }[];
  startedAt: string | null;
  finishedAt: string | null;
  errorMsg: string | null;
}

export interface RawHtmlResult {
  domain: string;
  url: string;
  finalUrl: string;
  status: number | null;
  html: string | null;
  htmlLength: number;
  truncated: boolean;
  plainText: string;
  errorMsg: string | null;
  fetchedAt: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  type: string;
  postData: string | null;
  response: { status: number; contentType: string; body: string | null } | null;
}

export interface FetchDomResult {
  domain: string;
  url: string;
  finalUrl: string;
  title: string;
  status: 'ok' | 'error' | 'cf_challenge';
  navError: string | null;
  domHtml: string;
  domHtmlLength: number;
  domTruncated: boolean;
  footerHtml: string | null;
  navHtml: string | null;
  metaTags: { name: string | null; content: string | null; charset: string | null }[];
  network: {
    totalRequests: number;
    byType: Record<string, number>;
    requests: NetworkRequest[];
  };
  fetchedAt: string;
}

export interface SystemStats {
  cpuPercent: number;
  cpuCount: number;
  ramPercent: number;
  ramUsedGb: number;
  ramFreeGb: number;
  ramTotalGb: number;
  loadAvg: [number, number, number];
  platform: string;
}

// Re-export so actions page can import from one place
export const systemStatsApi = {
  get: () => request<SystemStats>('/system/stats'),
};

export const autoDiscoverKeywordsApi = {
  generate: (params: { aiModel?: string }) =>
    request<{ keywords: string[]; total: number; fromAi: boolean }>(
      '/affiliate/auto-discover-keywords',
      { method: 'POST', body: JSON.stringify(params) },
    ),
};

// ─── Websites Links API (external server at 192.168.1.16:4000) ───────────────

const WEBSITES_API_URL = 'http://192.168.1.16:4000/api';

export interface WebsiteLinksParams {
  getNew?: 'true' | 'false';
  source?: string;
  page?: number;
  limit?: number;
}

export interface WebsiteLinksResponse {
  data: string[];
}

export const websitesLinksApi = {
  getLinks: async (params: WebsiteLinksParams = {}): Promise<WebsiteLinksResponse> => {
    const q = new URLSearchParams();
    if (params.getNew !== undefined) q.set('getNew', params.getNew);
    if (params.source) q.set('source', params.source);
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    const qs = q.toString();
    const res = await fetch(`${WEBSITES_API_URL}/websites/links${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

// ─── Config API ───────────────────────────────────────────────────────────────

export interface AppConfig {
  anthropic_api_key: string;
  anthropic_model: string;
  gemini_api_key: string;
  google_cse_api_key: string;
  google_cse_cx: string;
  ollama_url: string;
  ollama_model_low: string;
  ollama_model_mid: string;
  ollama_model_high: string;
  enable_llm_extract: string;
  affiliate_retry_score_max: string;
  affiliate_retry_conf_max: string;
  affiliate_max_crawl_retries: string;
  llm_tier_score_low: string;
  llm_tier_score_mid: string;
  llm_tier_conf_low: string;
  llm_tier_conf_mid: string;
  google_scrape_page_delay_ms: string;
  google_scrape_query_delay_min_ms: string;
  google_scrape_query_delay_max_ms: string;
  google_scrape_captcha_respawn: string;
  google_scrape_max_respawns: string;
  google_scrape_proxy_quarantine_ms: string;
  google_scrape_max_pages: string;
  subpage_penalty_threshold: string;
  table_affiliate_page_size: string;
  table_affiliate_page_sizes: string;
  table_llm_audit_page_size: string;
  table_llm_audit_page_sizes: string;
  table_proxy_page_size: string;
  table_proxy_page_sizes: string;
  auto_discover_keywords: string;
  system_announcements: string; // JSON: Announcement[]
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;       // YYYY-MM-DD
  imageUrl?: string;  // /uploads/filename.ext — served from public/uploads/
  pinned: boolean;
  active: boolean;
}

export const configApi = {
  getAll: () => request<AppConfig>('/config'),
  setMany: (configs: Partial<AppConfig>) =>
    request<{ success: boolean; count: number }>('/config', {
      method: 'POST',
      body: JSON.stringify({ configs }),
    }),
  reset: (key: keyof AppConfig) =>
    request<{ success: boolean; defaultValue: string | null }>(`/config/${key}`, { method: 'DELETE' }),
};

// ─── Upload API ───────────────────────────────────────────────────────────────
// Backed by the crawler backend's real filesystem (services/upload.service.js),
// not a Next.js API route — Vercel's serverless filesystem is read-only and
// non-persistent, so writing uploads there always failed once deployed there.

export const uploadApi = {
  image: async (file: File): Promise<{ url: string }> => {
    const token = getAccessToken();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
      body: form,
    });

    const body = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok) throw new Error(body.error ?? 'Upload thất bại');
    return body as { url: string };
  },
};

// ─── Affiliate Verification API ──────────────────────────────────────────────

export interface AffiliateVerification {
  domain: string;
  option: 1 | 2 | 3 | 4;
  note: string | null;
  updatedAt: string;
}

export interface DomainVerification {
  userId: number;
  username: string;
  option: 1 | 2 | 3 | 4;
  note: string | null;
  updatedAt: string;
}

export const verificationApi = {
  listByUser: () =>
    request<AffiliateVerification[]>('/affiliate-verification'),

  listByDomain: (domain: string) =>
    request<DomainVerification[]>(`/affiliate-verification/domain/${encodeURIComponent(domain)}`),

  submit: (domain: string, option: number, note?: string | null) =>
    request<AffiliateVerification>('/affiliate-verification', {
      method: 'POST',
      body: JSON.stringify({ domain, option, note: note || null }),
    }),

  delete: (domain: string) =>
    request<{ success: boolean }>(`/affiliate-verification/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
    }),
};

// ─── Proxy API ────────────────────────────────────────────────────────────────

export const proxyApi = {
  list: (live?: boolean) => {
    const q = live !== undefined ? `?live=${live}` : '';
    return request<ProxyListResponse>(`/proxy${q}`);
  },

  stats: () => request<ProxyStats>('/proxy/stats'),

  import: (data: { proxies: string[]; check?: boolean }) =>
    request<object>('/proxy/import', { method: 'POST', body: JSON.stringify(data) }),

  healthCheck: () =>
    request<object>('/proxy/health-check', { method: 'POST', body: JSON.stringify({}) }),

  delete: (ip: string, port: number) =>
    request<{ success: boolean }>('/proxy', { method: 'DELETE', body: JSON.stringify({ ip, port }) }),

  deleteBulk: (params: { proxies?: { ip: string; port: number }[]; live?: boolean }) =>
    request<{ success: boolean; deleted: number }>('/proxies', { method: 'DELETE', body: JSON.stringify(params) }),
};

// ─── Audit API ────────────────────────────────────────────────────────────────

export interface AuditFetchError {
  code: string;
  count: number;
  pct: number;
  cause: string;
}

export interface AuditBatchSummary {
  date: string;
  totalCrawled: number;
  totalVerified: number;
  avgScore: number;
  highScore: number;
  midScore: number;
  lowScore: number;
  verify: {
    correct: number;
    wrong: number;
    partial: number;
  };
  fetchErrors: AuditFetchError[];
}

export interface AuditHourPoint {
  hour: string;
  correct: number;
  wrong: number;
  partial: number;
  total: number;
}

export const auditApi = {
  getSummary: (days = 90) =>
    request<AuditBatchSummary[]>(`/affiliate-audit/summary?days=${days}`),

  getHourly: (date: string) =>
    request<AuditHourPoint[]>(`/affiliate-audit/hourly?date=${encodeURIComponent(date)}`),
};
