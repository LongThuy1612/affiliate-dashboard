import { getAccessToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.NEXT_PUBLIC_NGROK_ENABLE === 'true' ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
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
  screenshotPath?: string | null;
  screenshotAt?: string | null;
  crawledAt: string;
  updatedAt: string;
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
}

export const affiliateApi = {
  list: (params: AffiliateListParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
    return request<PaginatedResponse<AffiliateProgram>>(`/affiliate?${q}`);
  },

  get: (domain: string) => request<AffiliateProgram>(`/affiliate/${encodeURIComponent(domain)}`),

  getTree: (domain: string) => request<AffiliateProgramTree>(`/affiliate/tree/${encodeURIComponent(domain)}`),

  getSubPageScreenshot: async (id: number): Promise<string | null> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/subpage-screenshot/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(process.env.NEXT_PUBLIC_NGROK_ENABLE === 'true' ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  getScreenshot: async (domain: string): Promise<string | null> => {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/affiliate/screenshot/${encodeURIComponent(domain)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(process.env.NEXT_PUBLIC_NGROK_ENABLE === 'true' ? { 'ngrok-skip-browser-warning': 'true' } : {}),
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

  llmImprove: (domains: string[], model?: string) =>
    request<{ total: number; improved: number; errors: number }>('/crawl-affiliate/llm-improve', {
      method: 'POST',
      body: JSON.stringify({ domains, ...(model ? { model } : {}) }),
    }),

  discoverAuto: (params: {
    keywords: string[];
    limit?: number;
    cpuMin?: number; cpuMax?: number;
    ramMin?: number; ramMax?: number;
    batchSize?: number;
    skipOld?: boolean;
    autoRestart?: boolean;
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
