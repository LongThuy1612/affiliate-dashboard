'use client';
import { useState } from 'react';
import {
  BarChart2, Wrench, FlaskConical, Network, ShieldCheck,
  Search, Globe, Trash2, Bot, Sparkles,
  ChevronRight, BookOpen, Zap, AlertTriangle, CheckCircle,
  Database, TrendingUp, Filter, Cpu, Settings, Users,
  Layers, Camera, Shield, FileSearch, Lock, Bell, Plus, EyeOff, Pin,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// ─── Small reusable pieces ─────────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="-mt-20 pt-20 block absolute" />;
}

function Tag({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'green' | 'amber' | 'red' | 'slate' }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
    green: 'bg-green-900/40  text-green-300  border-green-700/40',
    amber: 'bg-amber-900/40  text-amber-300  border-amber-700/40',
    red: 'bg-red-900/40    text-red-300    border-red-700/40',
    slate: 'bg-slate-800/60  text-slate-300  border-slate-600/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${cls[color]}`}>
      {children}
    </span>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip: { border: 'border-green-700/50', bg: 'bg-green-950/30', icon: <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />, label: 'Mẹo' },
    warning: { border: 'border-amber-700/50', bg: 'bg-amber-950/30', icon: <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />, label: 'Lưu ý' },
    info: { border: 'border-indigo-700/50', bg: 'bg-indigo-950/30', icon: <Zap size={14} className="text-indigo-400 shrink-0 mt-0.5" />, label: 'Thông tin' },
  };
  const s = styles[type];
  return (
    <div className={`flex gap-2.5 rounded-lg border ${s.border} ${s.bg} px-4 py-3 my-4`}>
      {s.icon}
      <div className="text-sm text-[var(--text)] leading-relaxed">
        <span className="font-semibold mr-1">{s.label}:</span>
        {children}
      </div>
    </div>
  );
}

function H2({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5 mt-10">
      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[var(--accent)]" />
      </div>
      <h2 className="text-lg font-bold text-[var(--text)]">{children}</h2>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--text)] mt-6 mb-3">{children}</h3>;
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[var(--text-muted)] leading-relaxed space-y-3">{children}</div>;
}

// ─── Pipeline diagram ──────────────────────────────────────────────────────────

type PhaseSpec = {
  num: string;
  color: 'blue' | 'indigo' | 'amber' | 'red' | 'purple' | 'green' | 'cyan';
  title: string;
  items: string[];
  guards?: string[];
  conditional?: string;
  isNew?: boolean;
  isChanged?: boolean;
  last?: boolean;
};

const phasePalette: Record<string, { badge: string; card: string; bar: string; tag: string; guard: string }> = {
  blue:   { badge: 'bg-blue-900/70 text-blue-200 border-blue-500/50',   card: 'border-blue-700/30 bg-blue-950/20',   bar: 'bg-blue-600/50',   tag: 'bg-blue-900/60 text-blue-300 border-blue-600/40',   guard: 'text-blue-400'   },
  indigo: { badge: 'bg-indigo-900/70 text-indigo-200 border-indigo-500/50', card: 'border-indigo-700/30 bg-indigo-950/20', bar: 'bg-indigo-600/50', tag: 'bg-indigo-900/60 text-indigo-300 border-indigo-600/40', guard: 'text-indigo-400' },
  amber:  { badge: 'bg-amber-900/70 text-amber-200 border-amber-500/50', card: 'border-amber-600/40 bg-amber-950/25',  bar: 'bg-amber-600/50',  tag: 'bg-amber-900/60 text-amber-300 border-amber-600/40',  guard: 'text-amber-400'  },
  red:    { badge: 'bg-red-900/70 text-red-200 border-red-500/50',       card: 'border-red-700/30 bg-red-950/20',      bar: 'bg-red-600/50',    tag: 'bg-red-900/60 text-red-300 border-red-600/40',        guard: 'text-red-400'    },
  purple: { badge: 'bg-purple-900/70 text-purple-200 border-purple-500/50', card: 'border-purple-700/30 bg-purple-950/20', bar: 'bg-purple-600/50', tag: 'bg-purple-900/60 text-purple-300 border-purple-600/40', guard: 'text-purple-400' },
  green:  { badge: 'bg-green-900/70 text-green-200 border-green-500/50', card: 'border-green-700/30 bg-green-950/20',  bar: 'bg-green-600/50',  tag: 'bg-green-900/60 text-green-300 border-green-600/40',  guard: 'text-green-400'  },
  cyan:   { badge: 'bg-cyan-900/70 text-cyan-200 border-cyan-500/50',    card: 'border-cyan-700/30 bg-cyan-950/20',    bar: 'bg-cyan-600/50',   tag: 'bg-cyan-900/60 text-cyan-300 border-cyan-600/40',     guard: 'text-cyan-400'   },
};

function PhaseCard({ num, color, title, items, guards, conditional, isNew, isChanged, last }: PhaseSpec) {
  const p = phasePalette[color];
  return (
    <div className="flex flex-col items-stretch">
      <div className={`rounded-xl border p-3.5 ${p.card}`}>
        {/* header row */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 h-6 rounded-full border text-[11px] font-bold shrink-0 ${p.badge}`}>
            {num}
          </span>
          <span className="text-xs font-semibold text-[var(--text)]">{title}</span>
          <div className="flex gap-1.5 ml-auto flex-wrap">
            {isNew     && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-900/50 text-emerald-300 border-emerald-600/40">MỚI</span>}
            {isChanged && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-900/50 text-amber-300 border-amber-600/40">ĐÃ SỬA</span>}
          </div>
        </div>
        {/* conditional trigger */}
        {conditional && (
          <div className="flex items-start gap-1.5 mb-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide shrink-0 mt-0.5">Điều kiện:</span>
            <span className="text-[11px] text-amber-300">{conditional}</span>
          </div>
        )}
        {/* items */}
        <ul className="space-y-1.5 pl-0.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-1.5">
              <span className={`text-[10px] mt-0.5 shrink-0 ${p.guard}`}>›</span>
              <span className="text-[11px] text-[var(--text-muted)] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        {/* guards */}
        {guards && guards.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--border)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1.5">Guard / Rẽ nhánh</p>
            <ul className="space-y-1">
              {guards.map((g) => (
                <li key={g} className="flex items-start gap-1.5">
                  <span className="text-[10px] mt-0.5 shrink-0 text-red-500">⛔</span>
                  <span className="text-[11px] text-red-300/80 leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {!last && (
        <div className="flex flex-col items-center py-0.5">
          <div className={`w-0.5 h-3 ${p.bar}`} />
          <div className={`text-[10px] ${p.guard}`}>↓</div>
          <div className={`w-0.5 h-2 ${p.bar}`} />
        </div>
      )}
    </div>
  );
}

function PipelineDiagram() {
  const phases: PhaseSpec[] = [
    {
      num: '1A', color: 'blue',
      title: 'Probe AFFILIATE_PATHS song song',
      isChanged: true,
      items: [
        '13 path tĩnh: /affiliates, /affiliate, /partner-program, /referral, /earn, /ambassador…',
        'Concurrency: 5 requests đồng thời (PHASE1A_CONCURRENCY)',
        '✅ FIX: visitedUrls.add(url) chỉ gọi khi fetch thành công (html != null)',
        '🔄 FIX: Failed paths được re-queue vào đầu candidateUrls → Phase 2 thử lại',
      ],
      guards: [
        'Blog redirect: finalUrl khớp BLOG_URL_PATTERN → REDIRECT_BLOG, bỏ qua path đó',
        'Cross-domain redirect: rootOf(finalUrl) ≠ rootOf(url) → REDIRECT_DOMAIN',
        'isBlogContent() FIX: chỉ bypass khi có network-link / email-form, không phải chỉ đề cập "affiliate"',
        'CF challenge (7 ngôn ngữ): title match CF_TITLE_RE → CF_BLOCK, leo tier',
      ],
    },
    {
      num: '1B/C/D', color: 'blue',
      title: 'Homepage Scan + External Network Discovery',
      isChanged: true,
      items: [
        '1B Pass 1 — Anchor regex: <a href> + innerText match HREF_KEYWORDS / TEXT_KEYWORDS',
        '1B Pass 2 — _resolveAffiliateLinksFromText(): tìm <span>/<p>/<h*>/<li>/<b> có text match → trace ancestor <a> (backward) hoặc child <a> (forward)',
        '1B-ext — scanSectionForAffiliateCandidates(homepageHtml) → lọc external affiliate-network links → candidateUrls[]',
        '  ✦ Ví dụ: domain.firstpromoter.com, app.partnerstack.com vào queue ngay',
        '  ✦ Phase 2 LUÔN visit kể cả khi pageResults > 0 (không phụ thuộc Phase 2.5)',
        '1C — JS redirect: window.location, location.replace(), meta[http-equiv=refresh]',
        '1D — Login detection: LOGIN_KEYWORDS → loginPageUrl (loại khỏi signup candidates)',
      ],
    },
    {
      num: '2', color: 'indigo',
      title: 'Deep-follow Candidate URLs',
      items: [
        'Duyệt tối đa MAX_DEEP_FOLLOW=5 URL từ candidateUrls',
        'Failed Phase 1A paths được chèn ở đầu hàng đợi (unshift) → được thử trước',
        'External network links từ 1B-ext đã trong candidateUrls → visit kể cả khi pageResults > 0',
        '⚠ visitedUrls.add(url) gọi TRƯỚC khi fetch → URL CF-blocked vẫn bị đánh "đã thăm"',
        'Mỗi URL: fetchUrl() → extractFromHtml() → push vào pageResults nếu có signal',
        'One-level deeper: scan link trong page → append vào candidateUrls (mở rộng tự nhiên)',
      ],
      guards: [
        'isBlogUrl(u) → skip (không thêm vào candidateUrls)',
        'followed >= MAX_DEEP_FOLLOW → dừng loop',
      ],
    },
    {
      num: '2.5', color: 'amber',
      title: 'DOM Fallback — 2 Mode (MỚI + ĐÃ SỬA)',
      isNew: true,
      isChanged: true,
      conditional: 'Mode A: pageResults===0  |  Mode B: pageResults>0 + chưa visit network portal',
      items: [
        'Mode A — Full fallback (pageResults===0): scan tất cả links, bypass visitedUrls',
        'Mode B — External-only (pageResults>0, visitedNetworkUrls.length===0): scan FULL DOM',
        'CF retry: tối đa 2 lần, scroll → networkidle → extract footer/nav sections',
        'scanSectionForAffiliateCandidates(footer+nav) → sectionLinks[] (Pass 1 + Pass 2)',
        'Mode B thêm: page.content() → FULL Playwright DOM (1–2MB) → scan toàn bộ',
        '  ✦ _resolveAffiliateLinksFromText() trên full DOM: bắt hidden menus, JS-injected sections',
        '  ✦ Chỉ lấy external affiliate network links → merge vào sectionLinks[]',
        'Mode A: navigate tất cả sectionLinks, bypass visitedUrls (CF-blocked retry)',
        'Mode B: chỉ navigate external links chưa visit (visitedUrls.has(u) → skip)',
      ],
      guards: [
        'isBlogUrl(u) → skip',
        'Mode B: hostname === baseUrl → skip (same-domain đã xử lý bởi Phase 2)',
        'CF block cả 2 lần → fallback graceful, không crash',
      ],
    },
    {
      num: '4', color: 'purple',
      title: 'buildProgramTree() — Phân nhóm & Chọn best',
      items: [
        'Group pageResults: cùng affiliateNetwork → một nhóm | cùng programName → một nhóm',
        'aggregateResults() trên từng nhóm → merged program với dữ liệu tốt nhất',
        'bestProgram = program có affiliateScore cao nhất',
        'scoredSubPages: tính affiliateScore cho từng trang con riêng lẻ',
        'Sub-page penalty nếu avgSubScore < threshold VÀ parentScore − avg > 15:',
        '  penaltyWeight = min(0.55, 0.20 + lowRatio × 0.35)',
        '  penalized = round(parent × (1−weight) + avg × weight)',
      ],
    },
    {
      num: '4.5', color: 'purple',
      title: 'LLM Enrichment',
      conditional: 'score < 40 HOẶC confidence < 0.4 HOẶC commissionRate == null',
      items: [
        'Input: rawAffiliateData.snippets + tables + jsonLd → markdown prompt',
        'Ollama LOCAL — tự chọn tier theo score/conf:',
        '  · score<40 & conf<0.4 → OLLAMA_MODEL_LOW (mặc định: deepseek-coder)',
        '  · score<60 & conf<0.6 → OLLAMA_MODEL_MID (mặc định: phi4:latest)',
        'Gemini CLOUD — Google REST API, miễn phí, cấu hình qua GEMINI_API_KEY',
        'Claude Haiku CLOUD — Anthropic API, cấu hình qua ANTHROPIC_API_KEY',
        'Kết quả merge vào aggregated; llmEnriched = true nếu LLM cải thiện ít nhất 1 field',
      ],
    },
    {
      num: '5', color: 'red',
      title: 'PartnerStack API Fallback',
      isChanged: true,
      conditional: 'aggregated === null — KHÔNG phải khi thiếu commissionRate',
      items: [
        'TRƯỚC (cũ): trigger khi !aggregated || !aggregated.commissionRate',
        'SAU (mới): trigger khi !aggregated — không có BẤT KỲ dữ liệu nào từ crawl',
        'Gọi PartnerStack public marketplace API theo domain',
        'Nếu tìm thấy: gán commissionRate, programName, signupUrl từ API',
        'ENABLE_THIRD_PARTY_API=false → bỏ qua hoàn toàn bước này',
      ],
      guards: [
        'aggregated !== null (có dữ liệu từ crawl dù thiếu commissionRate) → SKIP PartnerStack',
        'ENABLE_THIRD_PARTY_API=false → SKIP',
      ],
    },
    {
      num: '6', color: 'green',
      title: 'Verify + Score + Screenshot + Save',
      last: true,
      items: [
        'Verify signupUrl: HTTP HEAD/GET → signupUrlVerified = true/false',
        'calcAffiliateScore(aggregated): 12 yếu tố → 0–100 điểm',
        'staleDaysFromScore(): score ≥80→30d | ≥50→14d | ≥20→7d | <20→3d',
        'takeAnnotatedScreenshot(): chụp trang nguồn + inject CSS highlight từ khóa',
        'Top 3 sub-pages by score → chụp ảnh riêng (domain__path.jpg)',
        'saveAffiliateResult(): upsert affiliate_programs + affiliate_sub_pages + fetch_logs',
        'allPaths404 = true → DELETE record + sub-pages khỏi DB',
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden my-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
          <Cpu size={14} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text)]">Sơ đồ luồng xử lý chi tiết</p>
          <p className="text-[11px] text-[var(--text-muted)]">Phase 1A → 1B/C/D★ → 2 → 2.5★ → 4 → 4.5 → 5★ → 6  ·  ★ = cơ chế mới / đã thay đổi  ·  1B-ext tích hợp trong 1B/C/D</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-900/50 text-emerald-300 border-emerald-600/40">MỚI</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-amber-900/50 text-amber-300 border-amber-600/40">ĐÃ SỬA</span>
        </div>
      </div>

      <div className="p-5">
        {/* ── Input / Output mini row ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-indigo-600/30 bg-indigo-950/15 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1.5">Input</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {['URL thủ công', 'Google CSE discovery', 'Batch queue'].map(t => (
                <span key={t} className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-green-600/30 bg-green-950/15 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1.5">Output — DB Record</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {['commissionRate + type', 'cookieDays', 'signupUrl (verified)', 'score 0–100', 'subPages[]', 'llmEnriched', 'screenshotPath'].map(f => (
                <span key={f} className="text-[11px] font-mono text-green-200/60 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500 shrink-0" />{f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Fetch Tier mini-diagram ── */}
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">fetchUrl() — 3 Tầng (dùng ở mọi Phase)</p>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: 'Tier 1: Axios', sub: 'HTTP thuần, nhanh', color: 'border-blue-600/40 bg-blue-950/20 text-blue-300' },
              { label: '→ blocked?', sub: 'CF / 403 / SPA shell', color: 'border-slate-600/30 bg-slate-900/20 text-slate-400', arrow: true },
              { label: 'Tier 2: Playwright', sub: 'JS render + stealth', color: 'border-amber-600/40 bg-amber-950/20 text-amber-300' },
              { label: '→ CF challenge?', sub: 'title match 7 ngôn ngữ', color: 'border-slate-600/30 bg-slate-900/20 text-slate-400', arrow: true },
              { label: 'CF auto-solve', sub: 'waitForFunction 8s', color: 'border-orange-600/40 bg-orange-950/20 text-orange-300' },
              { label: '→ still CF?', sub: '', color: 'border-slate-600/30 bg-slate-900/20 text-slate-400', arrow: true },
              { label: 'Tier 3: FlareSolverr', sub: 'bypass Cloudflare', color: 'border-red-600/40 bg-red-950/20 text-red-300' },
            ].map((item, i) => (
              item.arrow
                ? <div key={i} className="flex flex-col items-center shrink-0">
                    <ChevronRight size={12} className="text-[var(--text-muted)]" />
                    {item.sub && <span className="text-[9px] text-[var(--text-muted)] text-center leading-tight max-w-[64px]">{item.sub}</span>}
                  </div>
                : <div key={i} className={`rounded-lg border px-2 py-1.5 shrink-0 ${item.color}`}>
                    <p className="text-[11px] font-semibold">{item.label}</p>
                    {item.sub && <p className="text-[10px] opacity-70">{item.sub}</p>}
                  </div>
            ))}
          </div>
        </div>

        {/* ── Phase cards — 2 columns ── */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2">Các Phase Crawl</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-0">
          <div className="flex flex-col">
            {phases.slice(0, 4).map((p) => <PhaseCard key={p.num} {...p} />)}
          </div>
          <div className="flex flex-col">
            {phases.slice(4).map((p, i, arr) => <PhaseCard key={p.num} {...p} last={i === arr.length - 1} />)}
          </div>
        </div>

        {/* ── Decision summary ── */}
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Điều kiện kích hoạt quan trọng</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Phase 2.5 trigger', color: 'text-amber-400', dot: 'bg-amber-500',
                items: ['Mode A: pageResults.length === 0', 'Mode B: pageResults>0 + visitedNetworkUrls.length===0', 'Mode B: scan FULL Playwright DOM (1–2MB) không chỉ footer/nav'],
              },
              {
                label: 'PartnerStack trigger', color: 'text-red-400', dot: 'bg-red-500',
                items: ['aggregated === null (không có data)', 'Không trigger khi chỉ thiếu commissionRate', 'ENABLE_THIRD_PARTY_API=false → skip'],
              },
              {
                label: 'LLM trigger', color: 'text-purple-400', dot: 'bg-purple-500',
                items: ['score < 40 hoặc conf < 0.4', 'commissionRate == null', 'score > MID_SCORE → skip LLM'],
              },
              {
                label: 'Guard / DELETE', color: 'text-red-400', dot: 'bg-red-500',
                items: ['Blog redirect → REDIRECT_BLOG', 'Cross-domain → REDIRECT_DOMAIN', 'Editorial article markup (MỚI) → skip page', 'Soft-404 body (MỚI) → skip page', 'All paths 404 → XÓA record DB'],
              },
            ].map(({ label, color, dot, items }) => (
              <div key={label}>
                <p className={`text-[11px] font-semibold ${color} mb-1.5`}>{label}</p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-1 shrink-0`} />
                      <span className="text-[11px] text-[var(--text-muted)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const meta = {
    1: { icon: '⚡', label: 'Tier 1 – Axios', color: 'text-blue-400 border-blue-700/40 bg-blue-900/20' },
    2: { icon: '🎭', label: 'Tier 2 – Playwright', color: 'text-amber-400 border-amber-700/40 bg-amber-900/20' },
    3: { icon: '🔥', label: 'Tier 3 – FlareSolverr', color: 'text-orange-400 border-orange-700/40 bg-orange-900/20' },
  };
  const m = meta[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'pipeline', label: 'Sơ đồ luồng xử lý' },
  { id: 'crawler-phases', label: 'Các Phase Crawler' },
  { id: 'link-discovery', label: 'Link Discovery 2-Pass' },
  { id: 'cf-detection', label: 'Cloudflare Detection' },
  { id: 'affiliate-list', label: 'Danh sách chương trình' },
  { id: 'affiliate-detail', label: 'Chi tiết chương trình' },
  { id: 'sub-programs', label: 'Sub Programs / Tree' },
  { id: 'sub-page-screenshots', label: 'Bộ lọc chất lượng & Screenshots' },
  { id: 'actions', label: 'Actions & Crawl' },
  { id: 'bypass-advisor', label: 'Bypass Advisor' },
  { id: 'auto-upgrade', label: 'Auto-Upgrade Pipeline' },
  { id: 'stats', label: 'Thống kê & AI Analyst' },
  { id: 'llm-audit', label: 'LLM Audit' },
  { id: 'llm-models', label: 'LLM Model Tiers' },
  { id: 'proxy', label: 'Quản lý Proxy' },
  { id: 'fetch-tiers', label: 'Cơ chế fetchUrl()' },
  { id: 'scoring', label: 'Điểm số & Độ tin cậy' },
  { id: 'score-breakdown', label: 'Score Breakdown & Data Source' },
  { id: 'data-quality', label: 'Lọc dữ liệu chất lượng' },
  { id: 'raw-html-dom', label: 'Raw HTML & DOM Inspector' },
  { id: 'config', label: 'Cấu hình hệ thống' },
  { id: 'users', label: 'Quản lý người dùng' },
  { id: 'announcements', label: 'Bảng tin hệ thống' },
  { id: 'faq', label: 'Câu hỏi thường gặp' },
];

const SUB_PAGES = [
  { icon: FileSearch, label: 'Kiểm tra chất lượng dữ liệu', desc: 'Audit 2026-05-14 · 210 domain · 5 nhóm lỗi', href: '/docs/data-quality-audit' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const { user, loading } = useAuth();
  const [activeId, setActiveId] = useState('overview');

  const perms = user?.permissions ?? [];
  const isSuperAdmin = perms.includes('all:manage');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">
        Loading…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-700/30 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--text)]">Chỉ SuperAdmin mới có quyền truy cập</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
            Trang tài liệu kỹ thuật và quản trị chỉ dành cho SuperAdmin.
          </p>
        </div>
      </div>
    );
  }

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full">
      {/* Doc sidebar */}
      <aside className="hidden xl:flex flex-col w-52 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] py-6 px-3 gap-0.5 overflow-y-auto">
        <p className="px-2 mb-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
          Mục lục
        </p>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${activeId === s.id
              ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
              }`}
          >
            <ChevronRight size={10} className={activeId === s.id ? 'opacity-100' : 'opacity-0'} />
            {s.label}
          </button>
        ))}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Nhật ký</p>
          {SUB_PAGES.map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <p.icon size={10} className="shrink-0" />
              {p.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Tài liệu hướng dẫn</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-3">AffiliateCrawl – Hướng dẫn sử dụng</h1>
            <p className="text-[var(--text-muted)] text-base">
              Tất cả những gì bạn cần biết để sử dụng hệ thống quản lý chương trình affiliate, từ việc tìm kiếm dữ liệu đến phân tích bằng AI.
            </p>
          </div>

          {/* ── Overview ───────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="overview" /></div>
          <H2 icon={BarChart2}>Tổng quan hệ thống</H2>
          <Prose>
            <p>
              AffiliateCrawl là công cụ nội bộ giúp bạn <strong className="text-[var(--text)]">thu thập, lưu trữ và phân tích</strong> các chương trình affiliate trên internet.
              Hệ thống tự động truy cập trang web, đọc thông tin hoa hồng, cookie, điều khoản thanh toán — rồi lưu vào cơ sở dữ liệu để bạn tra cứu và so sánh.
            </p>
            <p>
              Bạn không cần viết code hay vận hành crawler thủ công. Mọi thứ đều có giao diện.
            </p>
          </Prose>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            {[
              { icon: BarChart2,  label: 'All Programs',  desc: 'Xem toàn bộ danh sách đã crawl',       href: '/affiliate' },
              { icon: Wrench,     label: 'Actions / Crawl', desc: 'Thêm domain, chạy crawl mới',         href: '/affiliate/actions' },
              { icon: FlaskConical, label: 'LLM Audit',   desc: 'So sánh trước/sau khi AI cải thiện',    href: '/affiliate/llm-audit' },
              { icon: BarChart2,  label: 'Charts',         desc: 'Biểu đồ phân phối điểm, nguồn',        href: '/affiliate/stats' },
              { icon: Network,    label: 'Proxy List',     desc: 'Xem pool proxy hiện tại',               href: '/proxy' },
              { icon: ShieldCheck, label: 'Proxy Actions', desc: 'Import, kiểm tra, xóa proxy',          href: '/proxy/actions' },
              { icon: FileSearch, label: 'Data Quality Audit', desc: 'Nhật ký kiểm tra batch · 2026-05-14', href: '/docs/data-quality-audit' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors">
                  <item.icon size={15} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* ── Pipeline diagram ──────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="pipeline" /></div>
          <H2 icon={Cpu}>Sơ đồ luồng xử lý toàn hệ thống</H2>
          <Prose>
            <p>
              Mỗi lần một domain được crawl, nó đi qua <strong className="text-[var(--text)]">7 bước tuần tự</strong>.
              Sơ đồ dưới đây mô tả toàn bộ hành trình từ lúc nhận input đến khi ghi kết quả vào cơ sở dữ liệu.
            </p>
          </Prose>
          <PipelineDiagram />

          {/* ── Crawler Phases ─────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="crawler-phases" /></div>
          <H2 icon={Cpu}>Các Phase của Crawler</H2>
          <Prose>
            <p>
              Mỗi lần crawl một domain chạy qua các phase tuần tự. Thứ tự và điều kiện kích hoạt được mô tả chi tiết dưới đây.
            </p>
          </Prose>
          <div className="space-y-3 my-4">
            {[
              {
                step: '1A', color: 'border-blue-700/40 bg-blue-950/20',
                title: 'Probe AFFILIATE_PATHS song song',
                desc: 'Thử 13 path tĩnh (/affiliates, /affiliate, /partner-program, /referral…) đồng thời (concurrency 5). visitedUrls chỉ được đánh dấu khi fetch THÀNH CÔNG. Path thất bại (CF block, timeout) được re-queue vào candidateUrls để Phase 2 thử lại.',
              },
              {
                step: '1B/C/D', color: 'border-blue-700/40 bg-blue-950/20',
                title: 'Homepage scan + External Network Discovery (ĐÃ SỬA)',
                desc: 'Pass 1: Anchor regex <a href>. Pass 2: _resolveAffiliateLinksFromText() — tìm text affiliate trong <span>/<p>/<h*>/<li> → trace ancestor <a> (backward) hoặc child <a> (forward). 1B-ext: scanSectionForAffiliateCandidates(homepageHtml) → lọc external affiliate-network links → vào candidateUrls để Phase 2 visit ngay kể cả khi pageResults > 0. 1C: JS redirect. 1D: Login page detection.',
              },
              {
                step: '2', color: 'border-indigo-700/40 bg-indigo-950/20',
                title: 'Deep-follow candidate URLs',
                desc: 'Duyệt tối đa 5 URL từ candidateUrls (bao gồm failed Phase 1A paths + external network links từ 1B-ext). visitedUrls.add(url) được gọi TRƯỚC khi fetch — URL CF-blocked vẫn bị đánh dấu "đã thăm".',
              },
              {
                step: '2.5', color: 'border-amber-700/40 bg-amber-950/20',
                title: 'DOM Fallback — 2 Mode (MỚI + ĐÃ SỬA)',
                desc: 'Mode A (pageResults===0): scan tất cả links, bypass visitedUrls. Mode B (pageResults>0 + chưa visit affiliate network portal): scan FULL Playwright DOM (page.content(), 1–2MB) với scanSectionForAffiliateCandidates() + _resolveAffiliateLinksFromText() — bắt được link trong lazy-rendered footer, hidden menus, JS-injected sections. Chỉ navigate external links chưa visit.',
              },
              {
                step: '4', color: 'border-purple-700/40 bg-purple-950/20',
                title: 'buildProgramTree()',
                desc: 'Gom pageResults theo program identity (affiliateNetwork / programName). Chọn bestProgram (điểm cao nhất). Tính sub-page penalty nếu avgSubScore < threshold.',
              },
              {
                step: '4.5', color: 'border-purple-700/40 bg-purple-950/20',
                title: 'LLM Enrichment (điều kiện)',
                desc: 'Chạy khi score < 40 HOẶC confidence < 0.4 HOẶC thiếu commissionRate. Hỗ trợ Ollama (3 tier model) và Gemini (Google cloud).',
              },
              {
                step: '5', color: 'border-red-700/40 bg-red-950/20',
                title: 'PartnerStack API — LAST RESORT (thay đổi)',
                desc: 'TRƯỚC: kích hoạt khi thiếu commissionRate. SAU: chỉ kích hoạt khi aggregated === null (không tìm được bất kỳ dữ liệu nào). Giữ nguyên dữ liệu crawl nếu đã có ít nhất programName, signupUrl, hoặc affiliateNetwork.',
              },
            ].map((item) => (
              <div key={item.step} className={`flex gap-4 p-3.5 rounded-xl border ${item.color}`}>
                <div className="w-8 h-6 rounded bg-white/5 flex items-center justify-center shrink-0 text-[var(--text-muted)] text-[11px] font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Callout type="warning">
            Phase 2 đánh dấu <code className="text-xs bg-[var(--surface)] px-1 rounded">visitedUrls.add(url)</code> trước khi fetch.
            Nếu URL bị CF block trong Phase 2, nó vẫn bị coi là "đã thăm" và Phase 2.5 phải dùng cơ chế riêng (bỏ qua visitedUrls, reuse Playwright page) để retry.
            External affiliate-network links (1B-ext) được xử lý ngay trong Phase 2 — không bị ảnh hưởng bởi vấn đề này vì chúng được thêm vào <code className="text-xs bg-[var(--surface)] px-1 rounded">candidateUrls</code> trước khi Phase 2 bắt đầu.
          </Callout>

          {/* ── Link Discovery ────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="link-discovery" /></div>
          <H2 icon={Search}>Cơ chế khám phá link — 2-Pass Discovery</H2>
          <Prose>
            <p>
              Cả hai hàm <code className="bg-[var(--surface-2)] px-1 rounded text-xs">scanHomepageForLinks()</code> và <code className="bg-[var(--surface-2)] px-1 rounded text-xs">scanSectionForAffiliateCandidates()</code> đều sử dụng cơ chế <strong className="text-[var(--text)]">2 pass</strong> để tìm affiliate URL, bổ sung cho nhau để bắt những trường hợp regex đơn thuần bỏ sót.
            </p>
          </Prose>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="rounded-xl border border-blue-700/40 bg-blue-950/20 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2.5">Pass 1 — Anchor-first (hiện có)</p>
              <ul className="space-y-1.5">
                {[
                  'Regex: /<a[^>]+href="..."[^>]*>([\S]*?)<\\/a>/gi',
                  'Lấy href + strip innerText (bỏ tag)',
                  'Check HREF_KEYWORDS trên pathname',
                  'Check TEXT_KEYWORDS trên visible text',
                  'Vấn đề: nested </a> khiến lazy matcher dừng sai',
                ].map(t => (
                  <li key={t} className="flex gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="text-blue-400 mt-0.5 shrink-0">›</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-600/40 bg-amber-950/20 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2.5">Pass 2 — Text-first Reverse Lookup (MỚI)</p>
              <ul className="space-y-1.5">
                {[
                  'Tìm <span>/<p>/<h*>/<li>/<b>/<label> có plain-text match TEXT_KEYWORDS',
                  'Strategy A: nhìn ngược trong HTML → tìm <a cuối chưa đóng → lấy href',
                  'Strategy B: nhìn vào trong element → tìm child <a href="...">',
                  'Bắt được: nested </a> confuse Pass 1 / affiliate text ở sibling',
                  'Ví dụ: <a href="firstpromoter.com"><span>Affiliate Program</span></a>',
                ].map(t => (
                  <li key={t} className="flex gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="text-amber-400 mt-0.5 shrink-0">›</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <H3>Phase 1B-ext — External Affiliate Network Discovery</H3>
          <Prose>
            <p>
              Sau Pass 1 + Pass 2, bước <strong className="text-[var(--text)]">1B-ext</strong> chạy thêm <code className="bg-[var(--surface-2)] px-1 rounded text-xs">scanSectionForAffiliateCandidates(homepageHtml)</code> nhưng chỉ lấy <strong className="text-[var(--text)]">external</strong> links (hostname ≠ baseUrl). Những link này được đưa thẳng vào <code className="bg-[var(--surface-2)] px-1 rounded text-xs">candidateUrls[]</code> để Phase 2 visit.
            </p>
          </Prose>

          <div className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Luồng Phase 1B-ext</p>
            <div className="flex flex-col gap-1.5">
              {([
                { type: 'node', label: 'homepageHtml', desc: 'Axios-fetched HTML của homepage (server-rendered, bao gồm footer/nav)', color: 'border-blue-600/40 bg-blue-950/20 text-blue-300' },
                { type: 'step', label: 'scanSectionForAffiliateCandidates(homepageHtml, baseUrl)' },
                { type: 'node', label: 'Tất cả affiliate links', desc: 'Same-domain + external network (firstpromoter.com, partnerstack.com…)', color: 'border-slate-600/40 bg-slate-900/20 text-slate-300' },
                { type: 'step', label: 'filter: new URL(u).hostname !== new URL(baseUrl).hostname' },
                { type: 'node', label: 'External network links', desc: 'syllaby.firstpromoter.com · domain.impact.com · app.partnerstack.com/…', color: 'border-amber-600/40 bg-amber-950/20 text-amber-300' },
                { type: 'step', label: 'candidateUrls.push(u)' },
                { type: 'node', label: 'Phase 2: fetchUrl() → extractFromHtml()', desc: 'Bất kể pageResults.length > 0 — không cần Phase 2.5', color: 'border-green-600/40 bg-green-950/20 text-green-300' },
              ] as { type: string; label: string; desc?: string; color?: string }[]).map((row, i) => (
                row.type === 'step'
                  ? <div key={i} className="flex items-center gap-2 pl-3 py-0.5 text-[10px] text-[var(--text-muted)] font-mono">
                      <div className="w-px h-3 bg-[var(--border)] shrink-0" />
                      <span>{row.label}</span>
                    </div>
                  : <div key={i} className={`rounded-lg border px-3 py-2 ${row.color}`}>
                      <p className="text-[11px] font-semibold">{row.label}</p>
                      {row.desc && <p className="text-[10px] opacity-70 mt-0.5">{row.desc}</p>}
                    </div>
              ))}
            </div>
          </div>

          <Callout type="info">
            <strong>Ví dụ thực tế (syllaby.io):</strong> Phase 2 tìm được <code className="text-xs bg-[var(--surface)] px-1 rounded">syllaby.io/partner</code> → <code className="text-xs bg-[var(--surface)] px-1 rounded">pageResults.length {'>'} 0</code>.
            Nếu Axios HTML chứa footer → 1B-ext tìm <code className="text-xs bg-[var(--surface)] px-1 rounded">syllaby.firstpromoter.com</code> → Phase 2 visit.
            Nếu footer lazy-rendered → 1B-ext bỏ sót → <code className="text-xs bg-[var(--surface)] px-1 rounded">visitedNetworkUrls.length === 0</code> → Phase 2.5 Mode B kích hoạt → Playwright fetch full DOM (1209KB) → scan toàn bộ → tìm thấy → navigate → extract commission data.
          </Callout>

          {/* ── CF Detection ─────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="cf-detection" /></div>
          <H2 icon={Shield}>Cloudflare Challenge Detection</H2>
          <Prose>
            <p>
              Hệ thống nhận diện Cloudflare Turnstile challenge qua <code className="bg-[var(--surface-2)] px-1 rounded text-xs">&lt;title&gt;</code> của trang.
              Pattern được thiết kế để bắt tất cả các ngôn ngữ mà Cloudflare hỗ trợ:
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-orange-700/40 bg-orange-950/15 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Ngôn ngữ</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Title được detect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ['Tiếng Anh', 'Just a moment · Checking your browser · Attention Required · Verifying you are human · Please wait while'],
                  ['Tiếng Pháp', 'Un instant…'],
                  ['Tiếng Đức', 'Einen Moment…'],
                  ['Tiếng Tây Ban Nha', 'Un momento…'],
                  ['Tiếng Bồ Đào Nha', 'Um momento…'],
                  ['Tiếng Ý', 'Un istante…'],
                  ['Tiếng Hà Lan', 'Één moment…'],
                ].map(([lang, title]) => (
                  <tr key={lang} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-3 py-2 text-[var(--text)]">{lang}</td>
                    <td className="px-3 py-2 font-mono text-orange-300 text-[11px]">{title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H3>Auto-solve — chờ Turnstile tự giải</H3>
          <Prose>
            <p>
              Khi phát hiện CF challenge title, Playwright dùng <code className="bg-[var(--surface-2)] px-1 rounded text-xs">page.waitForFunction()</code> chờ tối đa <strong className="text-[var(--text)]">8 giây</strong> cho Turnstile JS tự giải.
              Nếu title thay đổi khỏi pattern → trang đã pass, tiếp tục crawl. Nếu vẫn còn CF title → trả về <code className="bg-[var(--surface-2)] px-1 rounded text-xs text-red-400">CF_CHALLENGE</code>.
            </p>
          </Prose>

          <H3>fetch-dom API — CF retry và config</H3>
          <div className="space-y-2 my-3">
            {[
              ['Max attempts', 'Số lần thử Playwright tối đa. Giữa mỗi lần chờ 3.5s cho Turnstile. Mặc định: 2.'],
              ['Env var', 'AFFILIATE_DOM_FETCH_ATTEMPTS=2 trong .env'],
              ['DB config (runtime)', 'POST /api/config {"configs":{"affiliate_dom_fetch_attempts":"3"}} — hiệu lực ngay sau 60s cache TTL'],
              ['CF badge UI', 'Khi tất cả attempts đều bị CF → status:"cf_challenge" → badge cam ⚠ CF Challenge trong DOM Inspector'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Shield size={12} className="text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="tip">
            Tăng <code className="text-xs bg-[var(--surface-2)] px-1 rounded">AFFILIATE_DOM_FETCH_ATTEMPTS=3</code> nếu domain thường xuyên cần 2–3 giây để Turnstile tự giải.
            Giảm xuống 1 nếu muốn debug nhanh mà không chờ retry.
          </Callout>

          {/* ── Affiliate List ─────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="affiliate-list" /></div>
          <H2 icon={Filter}>Trang danh sách chương trình</H2>
          <Prose>
            <p>
              Đây là trang chính — <strong className="text-[var(--text)]">/affiliate</strong>. Hiển thị toàn bộ các chương trình đã được crawl, kèm bộ lọc và sắp xếp.
            </p>
          </Prose>

          <H3>Bộ lọc và tìm kiếm</H3>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Tìm kiếm domain', desc: 'Gõ một phần tên domain, hệ thống lọc theo thời gian thực.' },
              { label: 'Loại hoa hồng', desc: '"One-time" (một lần) hoặc "Recurring" (định kỳ hàng tháng).' },
              { label: 'Commission Rate', desc: 'Lọc "Has Commission" để chỉ xem chương trình đã có dữ liệu hoa hồng.' },
              { label: 'Score', desc: 'Lọc theo ngưỡng điểm (xem mục Điểm số để hiểu ý nghĩa).' },
              { label: 'Sort by', desc: 'Sắp xếp theo ngày crawl, ngày cập nhật, domain, hoặc độ tin cậy.' },
              { label: 'Per Page', desc: 'Chọn số dòng hiển thị mỗi trang: 20, 50, 100, hoặc 200.' },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Search size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{item.label}:</span>
                  <span className="text-xs text-[var(--text-muted)] ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <H3>Cột Fetch Tier trong bảng</H3>
          <Prose>
            <p>
              Cột cuối cùng trong bảng cho biết hệ thống đã dùng cách nào để lấy HTML của domain đó:
            </p>
          </Prose>
          <div className="flex flex-wrap gap-2 my-3">
            <TierBadge tier={1} />
            <TierBadge tier={2} />
            <TierBadge tier={3} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-700/40 bg-red-900/20 text-red-400 text-xs font-medium">
              ✗ CF_BLOCK
            </span>
          </div>
          <Prose>
            <p>
              Nếu hiển thị mã lỗi đỏ (ví dụ <code className="bg-[var(--surface-2)] px-1 rounded text-red-400 text-xs">CF_BLOCK</code>),
              nghĩa là tất cả các tier đều thất bại — domain đó cần xem xét thủ công hoặc cải thiện proxy.
            </p>
          </Prose>

          <Callout type="tip">
            Nhấp vào tên domain bất kỳ để mở trang chi tiết với đầy đủ thông tin hoa hồng, URL đăng ký, và lịch sử crawl.
          </Callout>

          <H3>Cột "Updated At"</H3>
          <Prose>
            <p>
              Cột <strong className="text-[var(--text)]">Updated At</strong> hiển thị thời điểm bản ghi được cập nhật lần cuối (ngày + giờ).
              Khác với <em>Crawled At</em> (thời điểm crawl), cột này phản ánh lần cuối dữ liệu thực sự thay đổi — hữu ích để biết chương trình nào vừa được AI cải thiện.
            </p>
          </Prose>

          <H3>Re-crawl theo domain</H3>
          <Prose>
            <p>
              Mỗi hàng có nút <strong className="text-[var(--text)]">Re-crawl</strong> ở cột action bên phải. Nhấp vào sẽ mở popup nhỏ cho phép chọn model LLM:
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              { label: 'Auto (tier-based)', desc: 'Hệ thống tự chọn model dựa theo điểm score của domain (mặc định).' },
              { label: 'deepseek-coder', desc: 'Model Low — dùng cho domain có score thấp (< 40).' },
              { label: 'phi4:latest', desc: 'Model Mid — dùng cho domain có score trung bình (40–60).' },
              { label: 'mistral', desc: 'Model High — dùng cho domain có score cao (≥ 60).' },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Cpu size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{item.label}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="tip">
            Dùng Re-crawl để ép LLM chạy lại ngay lập tức cho một domain cụ thể mà không cần chờ lượt batch tiếp theo. Chọn model mạnh hơn khi domain quan trọng cần dữ liệu chất lượng cao.
          </Callout>

          <H3>Sub-rows — xem Sub Programs trực tiếp trong bảng</H3>
          <Prose>
            <p>
              Các bản ghi có <strong className="text-[var(--text)]">subProgramCount {'>'} 0</strong> sẽ hiển thị badge màu indigo
              với icon <code className="bg-[var(--surface-2)] px-1 rounded text-xs text-indigo-300">⊞ N ›</code> ở cột Domain.
              Nhấp vào badge để mở rộng hàng — các sub-program xuất hiện ngay bên dưới dưới dạng sub-rows thụt lề.
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Badge ⊞ N ›', 'Icon Layers + số lượng sub-program. Mũi tên xoay 90° khi đang mở. Nhấp lần nữa để thu lại.'],
              ['Fetch khi mở lần đầu', 'Lần đầu expand gọi GET /api/affiliate/tree/:domain. Kết quả được cache — expand lần 2 không tốn request.'],
              ['Columns sub-row', 'Path trang, Program Name, Commission Rate, Type, Cookie, Score, Form badge, Network badge.'],
              ['Click path', 'Nhấp vào pagePath để mở trang thực tế trong tab mới (External Link).'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Layers size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="tip">
            Sub-rows giúp so sánh nhanh giữa các sub-program mà không cần mở từng trang chi tiết.
            Dùng khi bạn muốn xem domain có những chương trình nào khác nhau (ví dụ: Shopify Partners vs Shopify Affiliates).
          </Callout>

          <H3>Chọn nhiều và xóa hàng loạt</H3>
          <Prose>
            <p>
              Tích vào checkbox đầu hàng để chọn. Khi đã chọn, thanh công cụ phía trên bảng hiện hai nút:
            </p>
            <ul className="list-none space-y-1 pl-0">
              <li className="flex items-center gap-2">
                <Trash2 size={12} className="text-red-400" />
                <span><strong className="text-[var(--text)]">Delete Selected</strong> — xóa vĩnh viễn các dòng đã chọn.</span>
              </li>
              <li className="flex items-center gap-2">
                <Bot size={12} className="text-indigo-400" />
                <span><strong className="text-[var(--text)]">Improve with LLM</strong> — re-crawl và cho AI cải thiện dữ liệu của các domain đó.</span>
              </li>
            </ul>
          </Prose>

          {/* ── Detail ────────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="affiliate-detail" /></div>
          <H2 icon={Database}>Trang chi tiết chương trình</H2>
          <Prose>
            <p>
              Mở bằng cách nhấp vào domain trong danh sách. URL có dạng <code className="bg-[var(--surface-2)] px-1 rounded text-xs text-indigo-300">/affiliate/stripe.com</code>.
            </p>
          </Prose>

          <H3>Các thông tin hiển thị</H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
            {[
              ['Commission Rate', 'Tỷ lệ hoa hồng (ví dụ: 30%, $50 per sale)'],
              ['Commission Type', 'One-time hoặc Recurring'],
              ['Cookie Duration', 'Cookie tracking kéo dài bao nhiêu ngày'],
              ['Payment Terms', 'Điều khoản thanh toán (Net 30, Monthly…)'],
              ['Signup URL', 'Link đăng ký affiliate chính thức'],
              ['Score / Confidence', 'Điểm chất lượng và độ tin cậy dữ liệu'],
              ['Crawl Count', 'Số lần đã crawl domain này'],
              ['LLM Enriched', 'AI đã bổ sung dữ liệu cho bản ghi này chưa'],
              ['Fetch Tier Logs', 'Lịch sử từng lần fetchUrl() — tier nào thành công, tier nào lỗi'],
            ].map(([k, v]) => (
              <div key={k} className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text)]">{k}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          <Callout type="info">
            Phần <strong>Fetch Tier Logs</strong> ở cuối trang cho thấy lịch sử chi tiết: Tier mấy thành công, lỗi gì xảy ra ở Tier nào, mất bao nhiêu ms. Rất hữu ích để debug khi domain không lấy được dữ liệu.
          </Callout>

          {/* ── Sub Programs ──────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="sub-programs" /></div>
          <H2 icon={Database}>Sub Programs — Kiến trúc Tree đa chương trình</H2>
          <Prose>
            <p>
              Nhiều domain thực tế có <strong className="text-[var(--text)]">nhiều chương trình affiliate riêng biệt</strong> trên các trang con khác nhau.
              Ví dụ: <code className="bg-[var(--surface-2)] px-1 rounded text-xs">shopify.com/partners</code>, <code className="bg-[var(--surface-2)] px-1 rounded text-xs">shopify.com/affiliates</code> và <code className="bg-[var(--surface-2)] px-1 rounded text-xs">shopify.com/enterprise/partners</code>
              có thể là 3 chương trình riêng với hoa hồng khác nhau.
            </p>
            <p>
              Hệ thống sử dụng <strong className="text-[var(--text)]">buildProgramTree()</strong> để nhóm các trang con theo chương trình affiliate và lưu riêng từng trang vào bảng <code className="bg-[var(--surface-2)] px-1 rounded text-xs">affiliate_sub_pages</code>.
            </p>
          </Prose>

          <H3>Cách hoạt động</H3>
          <div className="space-y-3 my-4">
            {[
              {
                step: '1', title: 'Crawl nhiều trang con',
                desc: 'Crawler duyệt tối đa 10 trang con của domain (homepage + affiliate-related paths). Mỗi trang được phân tích độc lập.',
              },
              {
                step: '2', title: 'Phát hiện form đăng ký (detectSignupForm)',
                desc: '4 mức ưu tiên: (1) network_redirect — phát hiện link đến mạng affiliate (ShareASale, PartnerStack…); (2) embedded — form có email input; (3) external_link — nút "Sign up" / "Apply now"; (4) login-only — chỉ có form đăng nhập, không phải đăng ký.',
              },
              {
                step: '3', title: 'Gom nhóm theo chương trình',
                desc: 'Các trang dùng cùng affiliate network → cùng nhóm. Các trang khác nhóm theo tiền tố programName. Mỗi nhóm chạy aggregateResults() để chọn dữ liệu tốt nhất.',
              },
              {
                step: '4', title: 'Lưu vào affiliate_sub_pages',
                desc: 'Mỗi trang con được lưu riêng với đầy đủ: pagePath, affiliateScore, hasSignupForm, signupFormType, commissionRate, affiliateNetwork, v.v. Trang cha (affiliate_programs) nhận subProgramCount tổng số nhóm.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center shrink-0 text-[var(--accent)] text-xs font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <H3>Xem Sub Programs trên giao diện</H3>
          <Prose>
            <p>
              Trong trang chi tiết domain (<code className="bg-[var(--surface-2)] px-1 rounded text-xs">/affiliate/[domain]</code>),
              phần <strong className="text-[var(--text)]">Sub Programs</strong> hiện sau Fetch Tier Logs nếu domain có dữ liệu trang con.
              Mỗi dòng hiển thị: điểm, đường dẫn, badge form/network, hoa hồng. Nhấp <strong>▼</strong> để xem chi tiết đầy đủ.
            </p>
          </Prose>
          <Callout type="tip">
            API <code className="bg-[var(--surface-2)] px-1 rounded text-xs">GET /api/affiliate/tree/:domain</code> trả về đầy đủ cây chương trình:
            parent record, danh sách sub-pages, subProgramCount, và hasVerifiedSignup.
          </Callout>

          {/* ── Sub-page Screenshots ──────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="sub-page-screenshots" /></div>
          <H2 icon={Camera}>Bộ lọc chất lượng trang & Ảnh chụp Sub Program</H2>
          <Prose>
            <p>
              Trước khi lưu kết quả, hệ thống áp dụng nhiều lớp lọc để loại bỏ các trang chất lượng thấp — blog, trang lỗi 404, trang tổng hợp danh sách và redirect ra ngoài domain.
              Sau đó chụp ảnh màn hình trang tốt nhất kèm highlight.
            </p>
          </Prose>

          <H3>Blog URL Filter</H3>
          <Prose>
            <p>
              Tự động bỏ qua các URL có pathname thuộc nhóm blog/tin tức. Áp dụng ở hai điểm: thu thập <code className="bg-[var(--surface-2)] px-1 rounded text-xs">candidateUrls</code> từ homepage, và bên trong <code className="bg-[var(--surface-2)] px-1 rounded text-xs">buildProgramTree()</code>.
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-red-700/40 bg-red-950/20 px-4 py-3">
            <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider mb-2">Path patterns bị loại trừ</p>
            <code className="text-xs font-mono text-red-300 leading-loose">
              /blog  /news  /press  /newsroom  /media  /article  /articles<br />
              /post  /posts  /editorial  /magazine  /journal  /updates<br />
              /announcements  /stories  /insights  /tutorials  /tips<br />
              /category  /tag  /author  /podcast  /webinar  /video<br />
              /case-study  /whitepaper  /glossary  /opinion<br />
              /resources/blog  /learn/article  /2024/03/ (WordPress dates)
            </code>
          </div>

          <H3>404 / Dead-page Guard</H3>
          <Prose>
            <p>
              Hệ thống đọc thẻ <code className="bg-[var(--surface-2)] px-1 rounded text-xs">&lt;title&gt;</code> của mỗi trang và bỏ qua ngay nếu khớp pattern lỗi.
              Tránh lưu các trang trống, trang redirect thất bại, hoặc trang CMS "placeholder".
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-slate-700/40 bg-slate-900/30 px-4 py-3">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Title patterns bị loại trừ</p>
            <code className="text-xs font-mono text-slate-300 leading-loose">
              404  ·  404 Not Found  ·  Not Found  ·  Page Not Found<br />
              Oops!  ·  Uh Oh  ·  Something Went Wrong  ·  Resource Not Found<br />
              Page Unavailable  ·  We Can't Find  ·  The Page You…
            </code>
          </div>

          <H3>Aggregator / Directory Filter</H3>
          <Prose>
            <p>
              Bỏ qua các trang tổng hợp danh sách chương trình affiliate (như affpaying.com) — những trang này không mô tả một chương trình cụ thể mà liệt kê nhiều chương trình, dẫn đến dữ liệu sai.
              Pattern được kiểm tra cả trong title và 600 ký tự đầu nội dung trang.
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-amber-700/40 bg-amber-950/15 px-4 py-3">
            <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider mb-2">Ví dụ title bị loại trừ</p>
            <code className="text-xs font-mono text-amber-300 leading-loose">
              Top 50 Affiliate Programs  ·  Best Affiliate Networks List<br />
              Affiliate Program Directory  ·  Compare Affiliate Programs<br />
              10 Best Affiliate Networks  ·  Affiliate Database & Ranking
            </code>
          </div>

          <H3>Cross-domain Redirect Detection</H3>
          <Prose>
            <p>
              Khi crawl một domain bị redirect sang domain <em>hoàn toàn khác</em> (ví dụ <code className="bg-[var(--surface-2)] px-1 rounded text-xs">example.com</code> → <code className="bg-[var(--surface-2)] px-1 rounded text-xs">other-company.com</code>),
              hệ thống dừng crawl và ghi lỗi <code className="bg-[var(--surface-2)] px-1 rounded text-xs">REDIRECT_DOMAIN</code>.
              Redirect cùng domain (www ↔ non-www, HTTP → HTTPS) vẫn được chấp nhận bình thường.
            </p>
          </Prose>

          <H3>Signup URL Scoring</H3>
          <Prose>
            <p>
              Thay vì lấy URL đầu tiên tìm thấy, hệ thống chấm điểm từng link ứng viên và chọn link tốt nhất:
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-2)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Tiêu chí</th>
                  <th className="text-right px-3 py-2 text-[var(--text-muted)] font-semibold">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Link đến mạng affiliate đã biết (Impact, ShareASale…)', '+50'],
                  ['Path URL chứa từ khóa affiliate (/join, /signup, /become-an-affiliate)', '+35'],
                  ['Text CTA mạnh (Apply now, Join our affiliate program)', '+45'],
                  ['Text CTA yếu (Sign up, Apply, Register)', '+20'],
                  ['CSS class button (btn, cta, primary)', '+10'],
                ].map(([label, pts], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{label}</td>
                    <td className="px-3 py-2 text-right font-mono text-green-400 font-semibold">{pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Prose>
            <p>
              Trang có ≥ 2 trường dữ liệu (commissionRate, cookieDays, paymentTerms) được coi là "trang thông tin đầy đủ".
              Nếu không tìm được link đủ điểm, trả về <code className="bg-[var(--surface-2)] px-1 rounded text-xs">null</code> thay vì URL trang hiện tại — tránh gán nhầm trang info là signup URL.
            </p>
          </Prose>

          <H3>Sub-page Score Penalty</H3>
          <Prose>
            <p>
              Khi domain có ≥ 2 sub-page, hệ thống tính <strong className="text-[var(--text)]">avgSubScore</strong> (trung bình điểm tất cả sub-page).
              Nếu avgSubScore &lt; 40 <strong>và</strong> parent score cao hơn ≥ 15 điểm, áp dụng công thức pha trộn:
            </p>
            <pre className="my-2 rounded-lg bg-[#0d1117] border border-[var(--border)] px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto">
              parentScore = round(parentScore × 0.65 + avgSubScore × 0.35)
            </pre>
            <p>
              Ngăn parent score bị thổi phồng khi các sub-page thực tế đều kém chất lượng (LLM extract không cải thiện được nhiều).
            </p>
          </Prose>

          <H3>Ảnh chụp màn hình có Highlight</H3>
          <Prose>
            <p>
              Sau khi crawl xong, hệ thống dùng Playwright để chụp ảnh trang nguồn dữ liệu (trang chứa thông tin hoa hồng thực sự).
              Các từ khóa quan trọng được khoanh tròn bằng CSS trực tiếp trong DOM trước khi chụp.
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Trang chính', 'Ảnh chụp sourceUrls[0] — URL đầu tiên có dữ liệu hoa hồng. Highlight: commissionRate, cookieDays, paymentTerms, recurringDuration.'],
              ['Top 3 Sub-pages', 'Hệ thống chụp thêm tối đa 3 sub-page có affiliateScore cao nhất. Mỗi trang dùng highlight riêng theo dữ liệu của trang đó.'],
              ['CSS Highlight', 'Inject class .aff-hl: viền đỏ (box-shadow #EF4444) + nền đỏ mờ (rgba 15%). Áp dụng cho DOM text node chứa từ khóa.'],
              ['Lưu trữ', `JPEG quality 80%, lưu tại thư mục SCREENSHOT_DIR (mặc định: trustpilot_crawl/screenshots/). Tên file: domain.jpg hoặc domain__sub_path.jpg.`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Camera size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>

          <H3>Xem ảnh trên giao diện</H3>
          <Prose>
            <p>
              Trong trang chi tiết domain, phần <strong className="text-[var(--text)]">Screenshot</strong> có nút <em>Load screenshot</em>.
              Nhấp để tải ảnh trang chính từ API (<code className="bg-[var(--surface-2)] px-1 rounded text-xs">GET /api/affiliate/screenshot/:domain</code>).
            </p>
            <p>
              Trong phần <strong className="text-[var(--text)]">Sub Programs</strong>, mỗi sub-page có icon camera nếu đã được chụp.
              Mở rộng thẻ (nhấp ▼) và nhấn nút <em>Load screenshot</em> để tải ảnh của từng sub-page.
              API: <code className="bg-[var(--surface-2)] px-1 rounded text-xs">GET /api/affiliate/subpage-screenshot/:id</code>.
            </p>
          </Prose>
          <Callout type="warning">
            Chụp ảnh thêm ~5–15 giây vào thời gian crawl mỗi domain (mở trình duyệt + navigate + inject CSS + screenshot).
            Nếu trang dùng Cloudflare và Playwright bị chặn, ảnh sẽ không được lưu nhưng crawl vẫn tiếp tục bình thường.
          </Callout>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="actions" /></div>
          <H2 icon={Wrench}>Trang Actions / Crawl</H2>
          <Prose>
            <p>Tất cả các thao tác vận hành crawler đều ở đây — <strong className="text-[var(--text)]">/affiliate/actions</strong>.</p>
          </Prose>

          <H3>Start Batch Crawl</H3>
          <Prose>
            <p>Chạy đợt crawl hàng loạt cho tất cả domain đang chờ trong hàng đợi.</p>
          </Prose>
          <div className="flex flex-wrap gap-2 my-2">
            <Tag color="slate">Limit</Tag>
            <Tag color="slate">Force re-crawl</Tag>
          </div>
          <Prose>
            <p><strong className="text-[var(--text)]">Limit</strong>: giới hạn số domain crawl trong lần này. Để trống = không giới hạn.</p>
            <p><strong className="text-[var(--text)]">Force re-crawl</strong>: crawl lại ngay cả khi domain đã được crawl gần đây.</p>
          </Prose>

          <H3>Discover from Google + AI Keyword Suggester</H3>
          <Prose>
            <p>
              Nhập từ khóa tìm kiếm (mỗi dòng một từ khóa). Hệ thống sẽ tìm trên Google để phát hiện domain mới chưa có trong DB.
            </p>
          </Prose>
          <Callout type="tip">
            Nhấp mở phần <strong>AI Keyword Suggester</strong> ngay bên dưới textarea. Nhập một chủ đề (ví dụ: <em>"email marketing SaaS"</em>), chọn model (Auto, một model Ollama cụ thể, hoặc <strong>Lady Tools</strong> để AI tự tra Google trước khi gợi ý), nhấn <strong>Suggest</strong>.
            AI sẽ gợi ý 8–15 từ khóa tìm kiếm phù hợp. Nhấp <code className="bg-[var(--surface-2)] px-1 rounded text-xs">+</code> vào từ khóa nào để thêm vào danh sách, hoặc <strong>Add all</strong> để thêm tất cả.
            Xem thêm ở mục <strong>LLM Model Tiers → Lady Tools</strong>.
          </Callout>

          <H3>Crawl Single Domain / Multiple Domains</H3>
          <Prose>
            <p>
              Để crawl ngay một domain cụ thể, dùng <strong className="text-[var(--text)]">Crawl Single Domain</strong> — nhập domain (không có https://), nhấn Crawl. Kết quả xuất hiện sau vài giây.
            </p>
            <p>
              Để crawl nhiều domain cùng lúc, dùng <strong className="text-[var(--text)]">Crawl Multiple Domains</strong> — mỗi dòng một domain, hệ thống xếp hàng và crawl lần lượt.
            </p>
          </Prose>

          <H3>Add / Update Affiliate Program (thủ công)</H3>
          <Prose>
            <p>
              Nếu bạn đã biết thông tin hoa hồng của một chương trình và muốn nhập thủ công (không qua crawler), dùng form này.
              Chỉ cần điền <strong className="text-[var(--text)]">Domain</strong> là bắt buộc — các trường còn lại tùy chọn.
            </p>
          </Prose>

          <H3>Freshness Reset</H3>
          <Prose>
            <p>
              Đánh dấu các domain bị "cũ" (chưa được crawl lại sau X ngày) để chúng được ưu tiên crawl trong lần chạy tiếp theo.
              Để trống ô <strong className="text-[var(--text)]">Stale Days</strong> = dùng giá trị mặc định của hệ thống.
            </p>
          </Prose>

          <H3>Crawl từ Website Links <Tag color="green">MỚI</Tag></H3>
          <Prose>
            <p>
              Lấy danh sách domain từ API ngoài (<code className="bg-[var(--surface-2)] px-1 rounded text-xs">192.168.1.16:4000/api/websites/links</code>),
              xem trước toàn bộ danh sách, rồi mới crawl — quy trình 2 bước: <strong className="text-[var(--text)]">Get → Crawl</strong>.
            </p>
          </Prose>
          <div className="flex flex-wrap gap-2 my-2">
            <Tag color="green">getNew</Tag>
            <Tag color="slate">source</Tag>
            <Tag color="slate">page</Tag>
            <Tag color="slate">limit</Tag>
            <Tag color="slate">Force re-crawl</Tag>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)] my-3 text-xs overflow-hidden">
            {[
              { param: 'getNew', type: 'toggle', desc: 'Mới — chỉ domain chưa crawl. Cũ — domain đã có trong DB. Tất cả — không lọc.' },
              { param: 'source', type: 'select', desc: 'trustpilot · futurepedia · g2 · capterra · producthunt · Tất cả nguồn' },
              { param: 'page + limit', type: 'number', desc: 'Phân trang — cả hai phải điền cùng nhau. Để trống = lấy tất cả.' },
              { param: 'Force re-crawl', type: 'toggle', desc: 'Crawl lại kể cả domain đã có dữ liệu gần đây.' },
            ].map(({ param, type, desc }) => (
              <div key={param} className="flex items-start gap-3 px-3 py-2">
                <code className="shrink-0 w-32 font-mono text-[11px] text-amber-300">{param}</code>
                <span className="shrink-0 w-12 text-[10px] text-[var(--text-muted)] italic">{type}</span>
                <span className="text-[11px] text-[var(--text-muted)] leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
          <Prose>
            <p>
              Nhấn <strong className="text-[var(--text)]">Get Links</strong> để gọi API và xem danh sách URL trả về.
              Sau khi xem xét, nhấn <strong className="text-[var(--text)]">Crawl N Domains</strong> để đưa toàn bộ vào pipeline.
            </p>
          </Prose>
          <Callout type="info">
            Khi danh sách lớn (&gt;100 URL), hệ thống tự chia thành các batch 100 domain/request để tránh lỗi 413
            trên endpoint <code className="bg-[var(--surface-2)] px-1 rounded text-xs">POST /crawl-affiliate/domains</code>.
            Kết quả từ tất cả batch được gộp lại và hiển thị sau khi hoàn tất.
          </Callout>
          <Callout type="tip">
            Workflow hiệu quả: <strong>getNew = Mới</strong> + chọn source + limit = 100 → Get → Crawl.
            Sau đó tăng page lên 2, 3… để crawl theo lô mà không bị trùng.
          </Callout>

          {/* ── Bypass Advisor ────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="bypass-advisor" /></div>
          <H2 icon={ShieldCheck}>Bypass Advisor — AI phân tích thất bại fetch</H2>
          <Prose>
            <p>
              Khi nhiều domain thất bại ở các tier fetch, <strong className="text-[var(--text)]">Bypass Advisor</strong> tổng hợp lịch sử lỗi,
              hiển thị biểu đồ tier success/fail, và cho phép chat với AI để phân tích nguyên nhân.
              Tìm thấy trong <strong className="text-[var(--text)]">/affiliate/actions → AI Bypass Advisor</strong>.
            </p>
          </Prose>

          <H3>Tab Analyze</H3>
          <Prose>
            <p>
              Nhấn <strong className="text-[var(--text)]">Analyze</strong> để AI đọc thống kê fetch gần nhất và đưa ra nhận xét:
              tier nào đang thất bại nhiều, lỗi nào phổ biến, gợi ý điều chỉnh cấu hình.
            </p>
          </Prose>

          <H3>Tab Chat</H3>
          <Prose>
            <p>
              Đặt câu hỏi cụ thể về tình trạng fetch. Ví dụ:
            </p>
          </Prose>
          <div className="rounded-xl border border-indigo-700/40 bg-indigo-950/20 p-4 my-3 space-y-1.5">
            {[
              'Why is Tier 1 failing so much lately?',
              'Which domains are blocked by Cloudflare?',
              'Should I add more proxies or upgrade to Playwright?',
            ].map((q) => (
              <div key={q} className="flex items-start gap-2">
                <Sparkles size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)] italic">"{q}"</p>
              </div>
            ))}
          </div>
          <Callout type="info">
            Bypass Advisor đọc thống kê tổng hợp (số lần thành công/thất bại mỗi tier, top mã lỗi). Không truy cập từng domain — nếu muốn debug domain cụ thể, dùng trang chi tiết và xem Fetch Tier Logs.
          </Callout>

          {/* ── Auto-Upgrade ──────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="auto-upgrade" /></div>
          <H2 icon={Zap}>Auto-Upgrade Pipeline — AI đề xuất cấu hình tự động</H2>
          <Prose>
            <p>
              <strong className="text-[var(--text)]">Auto-Upgrade</strong> là tính năng nâng cao nằm trong Bypass Advisor.
              AI không chỉ phân tích — mà tạo ra các <em>đề xuất cấu hình cụ thể</em> dưới dạng JSON có thể áp dụng trực tiếp vào hệ thống.
            </p>
          </Prose>

          <H3>Quy trình 4 bước</H3>
          <div className="space-y-3 my-4">
            {[
              {
                step: '1', color: 'border-indigo-700/40 bg-indigo-950/20',
                title: 'Generate Proposals',
                desc: 'Nhấn "Generate AI Proposals". AI đọc dữ liệu fetch, chuẩn đoán vấn đề, và tạo danh sách đề xuất cụ thể (thay đổi headers T1, cấu hình Playwright T2, quy tắc leo tier, v.v.).',
              },
              {
                step: '2', color: 'border-amber-700/40 bg-amber-950/20',
                title: 'Apply Sample (Dry-run)',
                desc: 'Nhấn "Apply Sample" trên một đề xuất để chạy thử nghiệm: hệ thống lấy 5–10 domain đang thất bại, fetch chúng với cấu hình đề xuất (không ghi DB). Kết quả hiển thị success rate so sánh trước/sau.',
              },
              {
                step: '3', color: 'border-green-700/40 bg-green-950/20',
                title: 'Apply to System',
                desc: 'Nếu dry-run cải thiện success rate, nhấn "Apply to System" để lưu cấu hình vào DB (bảng app_configs). Cấu hình cũ được lưu lại làm backup (bypass_config_previous).',
              },
              {
                step: '4', color: 'border-red-700/40 bg-red-950/20',
                title: 'Rollback',
                desc: 'Nếu cấu hình mới gây vấn đề, nhấn "Force Rollback" để khôi phục ngay cấu hình cũ. "Smart Rollback" sẽ kiểm tra kết quả thực tế trước khi quyết định có rollback không.',
              },
            ].map((item) => (
              <div key={item.step} className={`flex gap-4 p-3.5 rounded-xl border ${item.color}`}>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-[var(--text-muted)] text-xs font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <H3>Loại đề xuất AI có thể tạo</H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
            {[
              ['tier1_headers', 'Thay đổi User-Agent, Referer, Accept-Language cho Axios'],
              ['tier2_config', 'Điều chỉnh timeout, viewport, stealth settings cho Playwright'],
              ['escalation_rule', 'Quy tắc khi nào leo từ T1 → T2 → T3'],
              ['retry_policy', 'Số lần retry và delay giữa các lần'],
              ['infrastructure', 'Khuyến nghị về proxy pool, FlareSolverr URL'],
            ].map(([type, desc]) => (
              <div key={type} className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <code className="text-xs text-indigo-300">{type}</code>
                <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <Callout type="warning">
            "Apply to System" ghi đè cấu hình hiện tại của hệ thống. Luôn chạy "Apply Sample" trước để xác nhận đề xuất có hiệu quả. Nếu success rate không cải thiện ít nhất 5%, không nên áp dụng.
          </Callout>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="stats" /></div>
          <H2 icon={TrendingUp}>Thống kê và AI Analyst</H2>
          <Prose>
            <p>
              Trang <strong className="text-[var(--text)]">/affiliate/stats</strong> (mở bằng nút <em>Charts</em> ở trang danh sách) hiển thị các biểu đồ tổng quan và công cụ AI hỏi đáp.
            </p>
          </Prose>

          <H3>Các biểu đồ</H3>
          <div className="space-y-2 my-3">
            {[
              ['Score Distribution', 'Phân phối điểm chất lượng — bao nhiêu chương trình đạt mức Excellent, Good, Medium…'],
              ['Data Source Distribution', 'Dữ liệu đến từ nguồn nào: crawl trực tiếp, PartnerStack, ShareASale, LLM…'],
              ['Product Category', 'Phân loại sản phẩm: SaaS/AI, Physical, VPCS, Unknown'],
              ['fetchUrl() Success by Tier', 'Tier nào thành công nhiều nhất — T1 Axios, T2 Playwright, T3 FlareSolverr, hay tất cả đều thất bại.'],
              ['Failures by Tier', 'Biểu đồ tròn riêng cho thất bại: tier nào thất bại nhiều nhất (T1✗, T2✗, T3✗). Giúp xác định điểm yếu trong chuỗi fetch.'],
              ['Failure Error Codes', 'Top 8 mã lỗi phổ biến nhất (CF_BLOCK, TIMEOUT, 403…) theo tần suất xuất hiện.'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <H3>AI Analyst — hỏi đáp dữ liệu bằng ngôn ngữ tự nhiên</H3>
          <Prose>
            <p>
              Cuộn xuống cuối trang stats để thấy ô chat <strong className="text-[var(--text)]">AI Analyst</strong>.
              Chọn model Ollama trong dropdown góc phải, rồi gõ câu hỏi bằng tiếng Anh hoặc tiếng Việt.
            </p>
          </Prose>
          <div className="rounded-xl border border-indigo-700/40 bg-indigo-950/20 p-4 my-4 space-y-2">
            <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">Ví dụ câu hỏi</p>
            {[
              'Which programs have the highest affiliate scores?',
              'How many recurring commission programs are there?',
              'What is the most common fetch error code?',
              'Tell me about stripe.com affiliate program',
              'Which tier fails most often?',
            ].map((q) => (
              <div key={q} className="flex items-start gap-2">
                <Sparkles size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)] italic">"{q}"</p>
              </div>
            ))}
          </div>
          <Callout type="warning">
            AI Analyst đọc snapshot dữ liệu (top 15 chương trình + thống kê tổng hợp), không phải toàn bộ DB. Với câu hỏi về domain cụ thể, hãy nhắc tên domain trong câu hỏi để hệ thống tự động nạp thêm thông tin của domain đó.
          </Callout>

          {/* ── LLM Audit ─────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="llm-audit" /></div>
          <H2 icon={FlaskConical}>LLM Audit</H2>
          <Prose>
            <p>
              Trang <strong className="text-[var(--text)]">/affiliate/llm-audit</strong> ghi lại mỗi lần AI chạy trên một domain: điểm trước và sau khi AI bổ sung.
            </p>
          </Prose>

          <H3>Đọc bảng audit</H3>
          <div className="space-y-2 my-3">
            {[
              ['Domain (có thể click)', 'Nhấp vào tên domain để mở trang chi tiết /affiliate/[domain] ngay lập tức.'],
              ['Score Before / After', 'Điểm chất lượng trước và sau khi LLM chạy. Nếu After > Before = AI đã cải thiện được.'],
              ['Score Δ', 'Mức tăng/giảm. Màu xanh = tốt hơn, màu đỏ = tệ hơn (hiếm gặp).'],
              ['Conf Before / After', 'Độ tin cậy dữ liệu thay đổi thế nào sau AI.'],
              ['Model', 'Model nào đã xử lý domain này — Ollama (deepseek-coder, phi4:latest, mistral), Gemini REST (gemini-1.5-flash…), hoặc ladytools-gemini.'],
              ['Duration', 'Thời gian AI xử lý — để đánh giá tốc độ model.'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 items-start p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="tip">
            Bật bộ lọc <strong>Improved only</strong> để chỉ xem những domain mà AI thực sự cải thiện được — giúp đánh giá model nào đang hoạt động tốt. Dùng <strong>Per Page</strong> để chọn hiển thị 20 / 50 / 100 / 200 dòng.
          </Callout>

          <H3>Model Analytics — biểu đồ phân tích model</H3>
          <Prose>
            <p>
              Nhấp nút <strong className="text-[var(--text)]">Model Analytics</strong> ở góc trên phải trang LLM Audit để mở trang <code className="bg-[var(--surface-2)] px-1 rounded text-xs text-indigo-300">/affiliate/llm-audit/charts</code>.
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Model Usage', 'Số lần mỗi model đã được dùng — model nào đang xử lý nhiều nhất.'],
              ['Avg Score Δ', 'Điểm cải thiện trung bình của từng model — model nào hiệu quả nhất.'],
              ['Improvement Rate %', 'Tỷ lệ phần trăm domain được cải thiện theo từng model.'],
              ['Avg Duration', 'Thời gian xử lý trung bình của từng model — model nào nhanh nhất.'],
              ['Impact by Score Range', 'Phân tích AI hiệu quả nhất ở ngưỡng điểm nào (0–29, 30–49, 50–69…).'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <BarChart2 size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── LLM Model Tiers ───────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="llm-models" /></div>
          <H2 icon={Cpu}>LLM Model Tiers — tự động chọn model</H2>
          <Prose>
            <p>
              Hệ thống hỗ trợ ba provider LLM: <strong className="text-[var(--text)]">Ollama</strong> (local, cần cài), <strong className="text-[var(--text)]">Gemini REST</strong> (Google cloud, miễn phí, không cần cài) và <strong className="text-[var(--text)]">Lady Tools</strong> (Gemini web thật, có khả năng tự search Google).
              Model được chọn tự động theo tier khi dùng Ollama; với Gemini REST và Lady Tools bạn chọn thủ công qua Re-crawl modal.
            </p>
          </Prose>

          <H3>Ollama — phân tầng tự động</H3>
          <div className="space-y-3 my-4">
            <div className="p-4 rounded-xl border border-red-700/40 bg-red-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-300 font-mono">deepseek-coder</span>
                <Tag color="red">Low tier — score &lt; 40</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Dùng cho domain có điểm thấp (score &lt; 40 <strong>và</strong> confidence &lt; 0.4). Model nhỏ, nhanh, phù hợp để cải thiện dữ liệu nghèo nàn.
                Biến môi trường: <code className="bg-[var(--surface)] px-1 rounded text-xs">OLLAMA_MODEL_LOW</code>.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-300 font-mono">phi4:latest</span>
                <Tag color="amber">Mid tier — score 40–60</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Dùng cho domain có điểm trung bình (score 40–60 <strong>và</strong> confidence 0.4–0.6). Model Microsoft 14B, cân bằng giữa tốc độ và chất lượng.
                Biến môi trường: <code className="bg-[var(--surface)] px-1 rounded text-xs">OLLAMA_MODEL_MID</code>.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-green-700/40 bg-green-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-300 font-mono">mistral</span>
                <Tag color="green">High tier — score ≥ 60</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Dùng cho domain có điểm cao (score ≥ 60 hoặc confidence ≥ 0.6). Model mạnh nhất, chậm hơn nhưng cho kết quả tốt nhất.
                Biến môi trường: <code className="bg-[var(--surface)] px-1 rounded text-xs">OLLAMA_MODEL_HIGH</code>.
              </p>
            </div>
          </div>

          <H3>Gemini — Google Generative AI (miễn phí)</H3>
          <Prose>
            <p>
              Khi chọn model <code className="bg-[var(--surface-2)] px-1 rounded text-xs font-mono">gemini-*</code> trong Re-crawl modal, hệ thống gọi trực tiếp REST API của Google thay vì Ollama.
              API key đặt trong <strong className="text-[var(--text)]">/config → API Keys → Gemini API Key</strong> — cache 60 giây, hiệu lực ngay không cần restart.
            </p>
          </Prose>
          <div className="space-y-2 my-4">
            {[
              { id: 'gemini-1.5-flash', note: 'Cân bằng — khuyến nghị cho hầu hết trường hợp' },
              { id: 'gemini-1.5-flash-8b', note: 'Nhanh nhất, nhẹ nhất — domain dữ liệu thưa' },
              { id: 'gemini-2.0-flash-exp', note: 'Mới nhất, chất lượng cao nhất' },
            ].map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-indigo-700/30 bg-indigo-950/15">
                <code className="text-sm font-mono text-indigo-300 shrink-0">{m.id}</code>
                <span className="text-sm text-[var(--text-muted)]">{m.note}</span>
                <span className="ml-auto text-[10px] font-semibold text-indigo-400 border border-indigo-700/40 rounded-full px-2 py-0.5">Free</span>
              </div>
            ))}
          </div>
          <Callout type="warning">
            Gemini REST chỉ xử lý <strong>1 domain mỗi lần</strong> qua Re-crawl modal. Bulk LLM Improve không hỗ trợ Gemini REST để tránh vượt rate limit miễn phí của Google.
          </Callout>

          <H3>Lady Tools — Gemini web thật, có search Google</H3>
          <Prose>
            <p>
              Model <code className="bg-[var(--surface-2)] px-1 rounded text-xs font-mono">ladytools-gemini</code> khác hẳn hai nhóm ở trên: thay vì gọi REST API của Google, hệ thống gửi câu hỏi tới một
              trình duyệt Gemini web thật (qua một automation server nội bộ chạy sẵn trên máy), y hệt việc một người mở gemini.google.com và tự gõ câu hỏi. Vì vậy nó có thể{' '}
              <strong className="text-[var(--text)]">tự tra cứu Google trước khi trả lời</strong> — hữu ích khi cần thông tin affiliate program hiện tại (URL đăng ký, tỷ lệ hoa hồng mới) thay vì chỉ dựa vào dữ liệu huấn luyện cũ của model.
            </p>
            <p>
              Không cần cấu hình API key (không dùng REST API của Google nên không tính vào quota Gemini REST), và không bị giới hạn "1 domain mỗi lần" như Gemini REST — hỗ trợ cả extract từng domain lẫn xử lý theo lô (batch).
            </p>
          </Prose>
          <div className="flex flex-wrap gap-2 my-2">
            <Tag color="indigo">Có search Google</Tag>
            <Tag color="green">Không cần API key</Tag>
            <Tag color="slate">Chậm hơn REST — mỗi lần gọi qua trình duyệt thật</Tag>
          </div>
          <Prose>
            <p>Lady Tools xuất hiện ở hai nơi trong hệ thống:</p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Re-crawl modal (extract dữ liệu)', 'Chọn model "Lady Tools (Gemini web, có search)" khi Re-crawl một domain cụ thể — xem mục Danh sách chương trình.'],
              ['AI Keyword Suggester (sinh từ khóa)', 'Trong /affiliate/actions, chọn Lady Tools làm model sinh keyword để AI tự tra Google tìm chủ đề/chương trình affiliate đang thời sự thay vì chỉ nhớ lại từ lúc huấn luyện.'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Sparkles size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Callout type="info">
            Trong <strong>Actions & Crawl</strong>, mục <strong>"Lady Tools tự động cải thiện điểm thấp"</strong> chạy nền song song với continuous crawl: hệ thống tự gom các domain điểm thấp (mặc định score ≤ 30) chưa từng qua LLM,
            đủ một lô thì tự gửi qua Lady Tools để cải thiện hoặc xoá nếu xác nhận không phải chương trình thật — không cần bấm "AI Improve Low-Score" thủ công.
          </Callout>

          <Callout type="info">
            Khi dùng nút <strong>Re-crawl</strong> trên từng domain, bạn có thể chọn <em>Auto</em> (Ollama tự chọn tier), chọn model Ollama cụ thể, chọn model Gemini REST, hoặc chọn Lady Tools. Các nhóm được hiển thị riêng biệt trong modal.
          </Callout>

          <Callout type="tip">
            Trang <strong>Model Analytics</strong> (<code className="bg-[var(--surface-2)] px-1 rounded text-xs">/affiliate/llm-audit/charts</code>) cho thấy hiệu quả thực tế của từng model — giúp quyết định có cần điều chỉnh ngưỡng tier hay thay đổi model mặc định không.
          </Callout>

          {/* ── Proxy ─────────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="proxy" /></div>
          <H2 icon={Network}>Quản lý Proxy</H2>
          <Prose>
            <p>
              Hệ thống dùng proxy để tránh bị chặn khi crawl. Trang <strong className="text-[var(--text)]">/proxy</strong> liệt kê toàn bộ proxy,
              trang <strong className="text-[var(--text)]">/proxy/actions</strong> cho phép import và quản lý.
            </p>
          </Prose>

          <H3>Import proxy</H3>
          <Prose>
            <p>Dán danh sách proxy vào textarea, mỗi dòng một proxy. Hỗ trợ các format:</p>
          </Prose>
          <pre className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-green-400 my-3 overflow-x-auto">
            {`ip:port
ip:port:username:password
username:password@ip:port`}
          </pre>
          <Prose>
            <p>
              Bật <strong className="text-[var(--text)]">Health-check before import</strong> để hệ thống kiểm tra proxy còn sống không trước khi lưu.
              Tắt nếu muốn import nhanh và kiểm tra sau.
            </p>
          </Prose>

          <H3>Full Health Check</H3>
          <Prose>
            <p>Kiểm tra toàn bộ pool proxy — cập nhật trạng thái Live/Dead. Có thể mất vài phút nếu pool lớn.</p>
          </Prose>

          <H3>Delete Dead Proxies</H3>
          <Prose>
            <p>Xóa tất cả proxy đã được đánh dấu Dead để dọn sạch pool. Nên chạy sau Full Health Check.</p>
          </Prose>

          {/* ── Fetch tiers ───────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="fetch-tiers" /></div>
          <H2 icon={Globe}>Cơ chế fetchUrl() — 3 tầng</H2>
          <Prose>
            <p>
              Khi crawl một domain, hệ thống thử lấy HTML qua 3 phương pháp (tier), từ nhanh đến mạnh.
              Nếu tier trước thất bại, tự động leo lên tier tiếp theo.
            </p>
          </Prose>

          <div className="space-y-3 my-5">
            <div className="p-4 rounded-xl border border-blue-700/40 bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={1} />
                <Tag color="green">Nhanh nhất</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Gửi HTTP request thông thường (như trình duyệt không có JavaScript). Phù hợp với ~60% trang web.
                Thất bại khi trang dùng Cloudflare, trả về 403/429, hoặc chỉ có JS shell rỗng.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-amber-700/40 bg-amber-950/20">
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={2} />
                <Tag color="amber">Chậm hơn ~5–15s</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Mở trình duyệt thật (Playwright + stealth plugin), chạy JavaScript đầy đủ.
                Vượt qua hầu hết SPA và bot-detection thông thường.
                Thất bại khi gặp Cloudflare challenge (trang "Just a moment…").
              </p>
            </div>
            <div className="p-4 rounded-xl border border-orange-700/40 bg-orange-950/20">
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={3} />
                <Tag color="red">Chậm nhất ~20–60s</Tag>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Dùng FlareSolverr để tự động giải Cloudflare CAPTCHA.
                Chỉ kích hoạt nếu biến môi trường <code className="bg-[var(--surface)] px-1 rounded text-xs">FLARESOLVERR_URL</code> được cấu hình.
              </p>
            </div>
          </div>

          <H3>Các mã lỗi phổ biến</H3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Mã lỗi</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Ý nghĩa</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ['CF_BLOCK', 'Cloudflare chặn, không vào được', '1'],
                  ['CF_CHALLENGE', '"Just a moment…" — cần giải CAPTCHA', '2'],
                  ['403 / 429', 'Server từ chối (forbidden / rate limit)', '1'],
                  ['TIMEOUT', 'Trang phản hồi quá chậm', '1/2'],
                  ['DNS_FAIL', 'Domain không tồn tại hoặc DNS lỗi', '1'],
                  ['CONN_REFUSED', 'Server từ chối kết nối', '1'],
                  ['FLARE_FAIL', 'FlareSolverr không giải được CAPTCHA', '3'],
                  ['NO_CONTENT', 'Lấy được HTML nhưng nội dung trống', '1/2'],
                ].map(([code, desc, tier]) => (
                  <tr key={code} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3"><code className="text-red-400 font-mono">{code}</code></td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{desc}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">T{tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Scoring ───────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="scoring" /></div>
          <H2 icon={TrendingUp}>Điểm số và Độ tin cậy</H2>

          <H3>Affiliate Score (0–100)</H3>
          <Prose>
            <p>Điểm tổng hợp đánh giá chất lượng dữ liệu của chương trình. Tổng tối đa 100 điểm, tính từ 12 yếu tố:</p>
          </Prose>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Yếu tố</th>
                  <th className="text-center py-2 px-3 text-[var(--text-muted)] font-medium w-16">Điểm tối đa</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Điều kiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ['Commission Rate', '22', 'Có giá trị hoa hồng (% hoặc $)'],
                  ['Affiliate Network', '15', 'Thuộc mạng lưới đã biết (Impact, CJ, ShareASale…)'],
                  ['Program Name', '5', 'Có tên chương trình rõ ràng'],
                  ['Signup URL', '3', 'Có bất kỳ URL đăng ký nào'],
                  ['URL Verified', '7', 'URL đăng ký còn sống (HTTP 2xx)'],
                  ['Cookie Window', '12', '≥90 ngày = 12pt | ≥30 ngày = 8pt | <30 ngày = 4pt'],
                  ['Commission Type', '8', 'one_time hoặc recurring (không phải unknown)'],
                  ['Recurring Terms', '8', 'Có thời hạn recurring: lifetime = 8pt | khác = 5pt'],
                  ['Payment Terms', '8', 'Có điều khoản thanh toán (Net 30, Monthly…)'],
                  ['Data Enrichment', '4', 'Nguồn dữ liệu là LLM hoặc PartnerStack (không phải web_crawl)'],
                  ['Screenshot', '3', 'Đã chụp ảnh màn hình trang nguồn'],
                  ['Rate Stability', '5', '0 lần thay đổi hoặc crawl đầu = 5pt | 1 lần = 2pt | >1 lần = 0pt'],
                ].map(([factor, pts, cond]) => (
                  <tr key={factor} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 font-medium text-[var(--text)]">{factor}</td>
                    <td className="py-2 px-3 text-center font-bold text-green-400">{pts}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{cond}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)]">
                  <td className="py-2 px-3 font-bold text-[var(--text)]">Tổng cộng</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-300">100</td>
                  <td className="py-2 px-3 text-[var(--text-muted)]">Math.min(tổng, 100)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 my-3">
            {[
              { label: 'Excellent', range: '85–100', color: 'bg-emerald-500' },
              { label: 'Good', range: '70–84', color: 'bg-green-500' },
              { label: 'Medium', range: '50–69', color: 'bg-amber-500' },
              { label: 'Low', range: '30–49', color: 'bg-orange-500' },
              { label: 'Very Low', range: '0–29', color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs font-medium text-[var(--text)]">{item.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{item.range}</span>
              </div>
            ))}
          </div>

          <H3>Rate Stability — độ ổn định hoa hồng</H3>
          <Prose>
            <p>
              Yếu tố mới trong công thức điểm. Hệ thống theo dõi lịch sử <strong className="text-[var(--text)]">commissionRate</strong> qua các lần crawl
              và đánh giá độ ổn định của chương trình:
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              { pts: '5pt', label: 'Ổn định', desc: 'Chưa bao giờ thay đổi rate, hoặc đây là lần crawl đầu tiên.', color: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20' },
              { pts: '2pt', label: 'Thay đổi 1 lần', desc: 'Rate đã thay đổi đúng một lần trong lịch sử crawl — chấp nhận được.', color: 'text-amber-300 border-amber-700/40 bg-amber-950/20' },
              { pts: '0pt', label: 'Không ổn định', desc: 'Rate thay đổi từ 2 lần trở lên — dữ liệu đáng ngờ, không nên tin hoàn toàn.', color: 'text-red-300 border-red-700/40 bg-red-950/20' },
            ].map((item) => (
              <div key={item.pts} className={`flex items-start gap-3 p-3 rounded-lg border ${item.color}`}>
                <span className="text-sm font-bold shrink-0 w-8">{item.pts}</span>
                <div>
                  <span className="text-xs font-semibold">{item.label}: </span>
                  <span className="text-xs">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <H3>Confidence (0–1)</H3>
          <Prose>
            <p>
              Độ tin cậy của dữ liệu — từ 0 (chưa xác minh) đến 1 (rất chắc chắn).
              <strong className="text-[var(--text)]"> 0.9</strong> nghĩa là hệ thống rất chắc chắn dữ liệu chính xác.
              <strong className="text-[var(--text)]"> 0.3</strong> nghĩa là dữ liệu chưa được xác minh kỹ.
            </p>
          </Prose>
          <Callout type="info">
            Điểm thấp (dưới 40) và confidence thấp (dưới 0.4) sẽ kích hoạt LLM tự động chạy để cải thiện dữ liệu trong lần crawl tiếp theo.
          </Callout>

          {/* ── Score Breakdown & Data Source ─────────────────────────────── */}
          <div className="relative"><SectionAnchor id="score-breakdown" /></div>
          <H2 icon={Shield}>Score Breakdown & Nguồn dữ liệu Commission</H2>
          <Prose>
            <p>
              Trang chi tiết domain (<code className="bg-[var(--surface-2)] px-1 rounded text-xs">/affiliate/[domain]</code>) có hai phần mới
              giúp bạn hiểu <strong className="text-[var(--text)]">điểm số đến từ đâu</strong> và <strong className="text-[var(--text)]">dữ liệu được lấy từ trang nào</strong>.
            </p>
          </Prose>

          <H3>Score Breakdown — phân tích từng yếu tố</H3>
          <Prose>
            <p>
              Nằm ngay bên dưới thanh điểm số (Score gauge), panel Breakdown hiển thị 12 yếu tố cấu thành điểm.
              Mỗi yếu tố có thanh tiến trình màu sắc và chỉ số <code className="bg-[var(--surface-2)] px-1 rounded text-xs">earned / max</code>.
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Thanh màu xanh lá (green)', 'Yếu tố đã đạt điểm tối đa — dữ liệu đầy đủ.'],
              ['Thanh màu vàng/cam (amber/orange)', 'Yếu tố đạt một phần điểm (ví dụ cookie < 30 ngày).'],
              ['Không có thanh', 'Yếu tố chưa có dữ liệu — 0 điểm.'],
              ['Dòng "Rate Stability"', 'Xanh = chưa thay đổi, vàng = thay đổi 1 lần, trắng = không ổn định.'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <TrendingUp size={12} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="tip">
            Dùng Score Breakdown để biết chính xác cần bổ sung gì để tăng điểm. Ví dụ nếu "URL Verified = 0/7",
            hãy kiểm tra lại signupUrl — có thể link đã chết hoặc chuyển hướng.
          </Callout>

          <H3>"Data from" — nguồn URL của Commission & Payout</H3>
          <Prose>
            <p>
              Dòng đầu tiên của phần <strong className="text-[var(--text)]">Commission & Payout</strong> hiển thị URL cụ thể mà dữ liệu hoa hồng được lấy từ đó.
              Nhấp vào link để kiểm tra trang thực tế.
            </p>
          </Prose>
          <div className="space-y-2 my-3">
            {[
              ['Main page (xanh lá)', 'Dữ liệu đến từ trang landing affiliate chính: pathname khớp với /affiliate, /partners, /refer, /earn, /ambassador, hoặc trang chủ /.'],
              ['Sub-page (vàng)', 'Dữ liệu đến từ một trang con sâu hơn — có thể là chương trình riêng biệt trong một nhóm đối tác.'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <Shield size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <Callout type="info">
            Nếu badge hiển thị "Sub-page" mà bạn nghi ngờ dữ liệu không chính xác,
            hãy mở link "Data from" để kiểm tra trang thực tế — có thể cần re-crawl hoặc nhập thủ công.
          </Callout>

          {/* ── Data Quality Filters ──────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="data-quality" /></div>
          <H2 icon={ShieldCheck}>Lọc dữ liệu chất lượng</H2>
          <Prose>
            <p>
              Hệ thống tự động loại bỏ các bản ghi dữ liệu không hợp lệ ở nhiều cấp độ:
            </p>
          </Prose>
          <H3>Lọc trang lỗi (404 / 503 / Soft-404)</H3>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Cơ chế</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {([
                  ['Title-pattern guard', 'NOT_FOUND_TITLE_RE mở rộng: "404", "Page Not Found", "Uh-oh", "Gone", "Access Denied", "Forbidden", "Content Removed", "No Longer Available", "Link Broken"… → extractFromHtml() trả null.'],
                  ['Soft-404 body guard (MỚI)', 'SOFT_404_BODY_RE kiểm tra 2 000 ký tự đầu của plain-text — bắt trang trả HTTP 200 nhưng nội dung là "this page does not exist", "we couldn\'t find the page"… → bỏ qua trang.'],
                  ['HTTP status guard', 'Trạng thái 403/429/503 → fetchWithAxios trả { blocked: true } → leo tier Playwright/FlareSolverr. 404 → { blocked: false } → bỏ qua ngay không leo tier.'],
                  ['Redirect guard', 'URL redirect sang domain khác hoặc URL blog → REDIRECT_DOMAIN / REDIRECT_BLOG, không lưu DB.'],
                  ['Aggregator guard', 'AGGREGATOR_RE bắt trang dạng "Top 50 affiliate programs" / how-to-earn / directory → trả null.'],
                ] as [string, string][]).map(([mech, desc]) => (
                  <tr key={mech} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 font-mono text-amber-300 whitespace-nowrap">{mech}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <H3>Lọc Blog / Editorial (đã sửa triệt để)</H3>
          <Callout type="warning">
            Trước đây <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">isBlogContent()</code> có exception quá rộng:
            nếu HTML chứa bất kỳ từ &quot;affiliate / commission / earn&quot; thì bypass toàn bộ kiểm tra blog —
            dẫn đến mọi bài viết blog về affiliate marketing đều lọt qua.
            Đã sửa để chỉ bypass khi trang có tín hiệu <strong className="text-[var(--text)]">cấu trúc thực sự</strong>.
          </Callout>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Lớp lọc</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {([
                  ['isBlogContent() — FIX', 'Bypass chỉ khi trang có tín hiệu CHƯƠNG TRÌNH cụ thể (không phải bài viết về affiliate): (a) link affiliate network, (b) CTA ngôi thứ nhất — "join OUR affiliate program / we pay X%", (c) "Commission rate: X%" dạng bảng. Blog dùng ngôi thứ ba ("they pay X%", "join CompanyX\'s program") → không bypass.'],
                  ['isBlogContent() — og:type', 'Nếu không có tín hiệu cấu trúc, kiểm tra <meta property="og:type" content="article"> → đây là trang editorial.'],
                  ['isBlogContent() — canonical', 'Fallback: nếu canonical URL khớp BLOG_URL_PATTERN thì cũng là trang blog.'],
                  ['isBlogUrl() — BLOG_URL_PATTERN', 'Mở rộng: thêm make-money, passive-income, money-calculator, payment-gateway, online-payment, affiliate-programs (số nhiều), referral-programs, partner-programs, ranking, salary, alternative, versus.'],
                  ['isBlogUrl() — plural list fix', '/affiliate-programs/ (số nhiều = trang liệt kê nhiều chương trình) bị chặn riêng dù URL chứa /affiliate/.'],
                  ['Editorial article guard (MỚI)', 'extractFromHtml() kiểm tra author/date markup CMS: itemprop="author/datePublished", class "byline/post-date/entry-date", <time datetime>. Nếu tìm thấy VÀ không có network link / signup form VÀ confidence=0 → trả null.'],
                  ['Subdomain guard', 'Hostname bắt đầu bằng blog. / news. / mag. → isBlogUrl() trả true ngay.'],
                ] as [string, string][]).map(([layer, logic]) => (
                  <tr key={layer} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 font-mono text-emerald-300 whitespace-nowrap">{layer}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{logic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <H3>Lọc Commission Rate không hợp lệ</H3>
          <Prose>
            <p>
              Hàm <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">sanitizeCommissionRate()</code> áp dụng sau khi regex extraction — loại bỏ:
            </p>
          </Prose>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Trường hợp</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {([
                  ['Phần trăm > 100%', 'Không thể có commission 150%, 200%… là kết quả extract nhầm từ text ("100% satisfaction guarantee").'],
                  ['Phần trăm = 0%', 'Giá trị 0% không mang thông tin hữu ích.'],
                  ['Số nguyên thuần > 100 (không có đơn vị)', 'Ví dụ "500" — mơ hồ, có thể là giá sản phẩm bị extract nhầm.'],
                ] as [string, string][]).map(([cas, reason]) => (
                  <tr key={cas} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 text-[var(--text)] whitespace-nowrap">{cas}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <H3>Penalty điểm Sub-page (tỷ lệ)</H3>
          <Prose>
            <p>
              Điểm tổng của domain cha bị giảm theo <strong className="text-[var(--text)]">tỷ lệ số sub-page có điểm thấp</strong>, không phải mức cố định:
            </p>
          </Prose>
          <pre className="my-2 rounded-lg bg-[#0d1117] border border-[var(--border)] px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto">{`// lowRatio = số subPage dưới ngưỡng / tổng subPage
penaltyWeight = min(0.55,  0.20 + lowRatio × 0.35)
// 1 trang thấp / 4 trang → weight = 0.29
// 4 trang thấp / 4 trang → weight = 0.55  (penalty nặng nhất)
penalized = parent × (1 - weight) + avgSubScore × weight`}</pre>
          <Callout type="info">
            Thay đổi so với phiên bản trước: penalty áp dụng ngay từ 1 sub-page thấp (trước đây cần ≥ 2), và mức phạt tăng theo tỷ lệ thay vì cố định 0.65/0.35.
          </Callout>

          {/* ── Raw HTML & DOM/Network Inspector ──────────────────────── */}
          <div className="relative"><SectionAnchor id="raw-html-dom" /></div>
          <H2 icon={Globe}>Raw HTML & DOM / Network Inspector</H2>
          <Prose>
            <p>
              Trên trang <strong className="text-[var(--text)]">/affiliate/[domain]</strong>, hai công cụ debug giúp hiểu tại sao webcrawl và LLM extraction cho cùng kết quả:
            </p>
          </Prose>
          <H3>Raw HTML (Tier-1 Axios)</H3>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Trường trả về</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Ý nghĩa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {([
                  ['html', 'Nội dung HTML thô (tối đa 150 KB) đúng như Axios nhận được.'],
                  ['plainText', 'HTML sau khi strip tags — đây là đầu vào thực tế gửi đến LLM extraction.'],
                  ['finalUrl', 'URL sau redirect — nếu khác request URL thì domain đã redirect.'],
                  ['status', 'HTTP status code trả về. 4xx/5xx = trang lỗi, nhưng vẫn có HTML để xem.'],
                  ['truncated', 'true nếu HTML gốc > 150 KB và bị cắt bớt.'],
                ] as [string, string][]).map(([field, meaning]) => (
                  <tr key={field} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 font-mono text-blue-300 whitespace-nowrap">{field}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Prose>
            <p>
              <strong className="text-[var(--text)]">Plain Text tab</strong> — chính xác cùng text mà regex extractors (<code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">extractCommissionRate</code>, <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">extractCookieDays</code>…) và LLM snippets được tạo từ đó. Nếu text không chứa từ khóa affiliate rõ ràng, lý do LLM và webcrawl trả về kết quả giống nhau là do cùng nguồn dữ liệu thiếu.
            </p>
          </Prose>
          <H3>DOM + Network (Playwright)</H3>
          <Prose>
            <p>
              Fetch đầy đủ bằng Playwright headless browser (extraStealth), ghi lại toàn bộ network requests và extract riêng footer/nav để bắt content render muộn:
            </p>
          </Prose>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Tab</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Nội dung</th>
                  <th className="text-left py-2 px-3 text-[var(--text-muted)] font-medium">Màu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {([
                  ['Network', 'Tất cả HTTP requests: URL, method, resource type (xhr/fetch/script/image…), POST data, response body (JSON/text). Lọc theo type.', 'mặc định'],
                  ['Meta', 'Tất cả <meta> tags trong DOM sau khi JS chạy xong — og:type, description, twitter:card, v.v.', 'mặc định'],
                  ['DOM HTML', 'Full HTML sau khi JavaScript render xong (tối đa 150 KB). Nếu bị cắt, label hiển thị: "DOM HTML (trunc 146KB / 641KB)".', 'xanh lá'],
                  ['Footer ★', 'outerHTML của <footer> / [role="contentinfo"] / [class*="footer"] — tối đa 100 KB. Extract SAU KHI scroll → lazy footer được load.', 'emerald'],
                  ['Nav/Header ★', 'outerHTML của <nav> / [role="navigation"] / <header> — tối đa 50 KB.', 'sky'],
                ] as [string, string, string][]).map(([tab, content, color]) => (
                  <tr key={tab} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2 px-3 font-mono text-purple-300 whitespace-nowrap">{tab}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">{content}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-[11px]">{color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Prose>
            <p>
              <strong className="text-[var(--text)]">★ Footer / Nav/Header tabs</strong> chỉ hiện khi có data.
              Đây là cách duy nhất để thấy các phần tử render muộn — ví dụ footer React/Next.js render sau hydration, không xuất hiện trong DOM HTML bị truncate.
            </p>
          </Prose>
          <Callout type="info">
            Nếu trang dùng React/Vue/Angular, DOM HTML sẽ chứa nội dung đầy đủ, còn Raw HTML (Axios) chỉ là shell JS.
            Tab <strong>Footer</strong> và <strong>Nav/Header</strong> giúp debug khi affiliate link nằm trong footer lazy-loaded mà crawler chưa tìm thấy.
          </Callout>
          <H3>Status badge — CF Challenge</H3>
          <Prose>
            <p>
              Góc trên phải DOM Inspector hiển thị status badge:
            </p>
          </Prose>
          <div className="flex flex-wrap gap-2 my-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-700/40 bg-emerald-900/20 text-emerald-300 text-xs font-medium">✓ OK · 147 requests</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-orange-700/40 bg-orange-900/20 text-orange-300 text-xs font-medium">⚠ CF Challenge · 0 requests</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-700/40 bg-red-900/20 text-red-300 text-xs font-medium">✗ Error</span>
          </div>
          <Prose>
            <p>
              Badge cam <strong className="text-orange-300">⚠ CF Challenge</strong> xuất hiện khi tất cả {'{AFFILIATE_DOM_FETCH_ATTEMPTS}'} lần thử đều bị Cloudflare chặn.
              Tăng số lần thử hoặc chờ vài giây rồi gọi lại — lần thứ 2 thường thành công vì session browser đã warm.
            </p>
          </Prose>
          <H3>Sơ đồ cơ chế fetch dual-source</H3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 mt-2">
            <div className="flex gap-4 items-start flex-wrap">
              {/* Tier 1 box */}
              <div className="flex-1 min-w-[200px] rounded-lg border border-blue-800/60 bg-blue-950/20 p-3">
                <p className="text-xs font-bold text-blue-300 mb-2">⚡ Tier 1 — Axios</p>
                <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
                  <li>→ HTTP GET (headers + redirect follow)</li>
                  <li>→ Plain HTML string (server-rendered)</li>
                  <li>→ <code className="bg-[var(--surface)] px-1 rounded">htmlToText()</code> → Plain text</li>
                  <li>→ Regex extraction + LLM snippets</li>
                </ul>
              </div>
              <div className="flex items-center text-[var(--text-muted)] text-xl font-bold self-center">→</div>
              {/* Tier 2 box */}
              <div className="flex-1 min-w-[200px] rounded-lg border border-amber-800/60 bg-amber-950/20 p-3">
                <p className="text-xs font-bold text-amber-300 mb-2">🎭 Tier 2 — Playwright</p>
                <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
                  <li>→ Headless browser + stealth plugin</li>
                  <li>→ Full JS execution → DOM rendered</li>
                  <li>→ Network log: XHR/fetch/script/…</li>
                  <li>→ <code className="bg-[var(--surface)] px-1 rounded">page.content()</code> → Full DOM HTML</li>
                </ul>
              </div>
              <div className="flex items-center text-[var(--text-muted)] text-xl font-bold self-center">→</div>
              {/* DB box */}
              <div className="flex-1 min-w-[180px] rounded-lg border border-green-800/60 bg-green-950/20 p-3">
                <p className="text-xs font-bold text-green-300 mb-2">🗄️ Database</p>
                <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
                  <li>rawAffiliateData.snippets</li>
                  <li>rawAffiliateData.tables</li>
                  <li>rawAffiliateData.jsonLd</li>
                  <li>affiliateScore, confidence</li>
                </ul>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-3 pt-2 border-t border-[var(--border)]">
              Raw HTML viewer → Tier 1 path · DOM/Network inspector → Tier 2 path · cả hai đều live-fetch khi nhấn nút
            </p>
          </div>

          {/* ── Config ────────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="config" /></div>
          <H2 icon={Settings}>Cấu hình hệ thống</H2>
          <Prose>
            <p>
              Trang <strong className="text-[var(--text)]">/config</strong> cho phép bạn quản lý toàn bộ thông số của hệ thống từ giao diện — không cần chỉnh sửa file <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">.env</code> trực tiếp.
              Mọi thay đổi được lưu vào bảng <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">app_configs</code> trong cơ sở dữ liệu và có hiệu lực ngay lập tức ở lần chạy tiếp theo.
            </p>
          </Prose>

          <H3>API Keys</H3>
          <Prose>
            <p>
              Nhập <strong className="text-[var(--text)]">Anthropic API Key</strong> và chọn Claude model cho trích xuất LLM (mặc định: <code className="text-xs bg-[var(--surface-2)] px-1 py-0.5 rounded">claude-haiku-4-5-20251001</code>).
              Ngoài ra cấu hình <strong className="text-[var(--text)]">Google CSE API Key</strong> và <strong className="text-[var(--text)]">CX</strong> để kích hoạt tính năng khám phá domain từ Google Search.
            </p>
          </Prose>
          <Callout type="warning">
            API Key được lưu dạng plaintext trong DB nội bộ. Không chia sẻ quyền truy cập DB ra ngoài.
          </Callout>

          <H3>Mô hình LLM & Tầng (Tiers)</H3>
          <Prose>
            <p>
              Hệ thống chọn mô hình Ollama tự động dựa trên điểm và độ tin cậy của domain:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li><strong className="text-purple-300">Model LOW</strong> — dùng khi score ≤ ngưỡng LOW và confidence ≤ ngưỡng LOW (dữ liệu rất thưa, cần mô hình nặng hơn)</li>
              <li><strong className="text-blue-300">Model MID</strong> — dùng khi score/confidence nằm giữa LOW và MID</li>
              <li><strong className="text-slate-400">Bỏ qua LLM</strong> — khi dữ liệu đã đủ tốt (score và confidence cao)</li>
            </ul>
            <p>
              Bật/tắt toàn bộ trích xuất LLM bằng toggle <strong className="text-[var(--text)]">Enable LLM Extraction</strong>.
            </p>
          </Prose>

          <H3>Ngưỡng Crawl lại</H3>
          <Prose>
            <p>
              Ba thông số kiểm soát khi nào một domain được đánh dấu để crawl lại với LLM:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li><Tag color="amber">AFFILIATE_RETRY_SCORE_MAX</Tag> — domain có điểm ≤ giá trị này mới đủ điều kiện retry</li>
              <li><Tag color="amber">AFFILIATE_RETRY_CONF_MAX</Tag> — tương tự nhưng theo độ tin cậy</li>
              <li><Tag color="amber">AFFILIATE_MAX_CRAWL_RETRIES</Tag> — giới hạn tổng số lần retry trước khi domain bị đánh dấu FLAG</li>
            </ul>
          </Prose>

          <H3>fetch-dom API — Cloudflare Retry</H3>
          <Prose>
            <p>
              Số lần thử Playwright tối đa trong debug API <code className="bg-[var(--surface-2)] px-1 rounded text-xs">GET /api/affiliate/fetch-dom/:domain</code> trước khi trả về status <code className="bg-[var(--surface-2)] px-1 rounded text-xs text-orange-300">cf_challenge</code>:
            </p>
          </Prose>
          <div className="my-3 rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Cách cấu hình</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-semibold">Giá trị / Lệnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  ['.env', 'AFFILIATE_DOM_FETCH_ATTEMPTS=2'],
                  ['DB config (runtime, không restart)', 'POST /api/config  {"configs":{"affiliate_dom_fetch_attempts":"3"}}'],
                  ['Ưu tiên', 'DB config > biến môi trường .env. Cache DB: 60 giây'],
                  ['Tối thiểu', '1 (không retry). Khuyến nghị: 2–3 cho site dùng Turnstile'],
                ].map(([k, v]) => (
                  <tr key={k} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-3 py-2 font-semibold text-[var(--text)] whitespace-nowrap">{k}</td>
                    <td className="px-3 py-2 font-mono text-indigo-300 text-[11px]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="tip">
            Sau khi thay đổi qua <strong>POST /api/config</strong>, đợi tối đa 60 giây để cache hết hạn. Reload trang /config để xác nhận giá trị đã được lưu.
          </Callout>

          <H3>Sub-page Penalty Threshold</H3>
          <Prose>
            <p>Ngưỡng điểm sub-page để kích hoạt penalty cho parent domain. Cấu hình tương tự:</p>
          </Prose>
          <div className="flex gap-2 my-2 flex-wrap">
            <code className="text-xs bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 rounded text-amber-300">SUBPAGE_PENALTY_THRESHOLD=50</code>
            <span className="text-xs text-[var(--text-muted)] self-center">hoặc DB key:</span>
            <code className="text-xs bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 rounded text-indigo-300">subpage_penalty_threshold</code>
          </div>

          <H3>Google Scraper</H3>
          <Prose>
            <p>
              Các thông số chống CAPTCHA khi dùng tính năng <strong className="text-[var(--text)]">Discover from Google</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li><Tag color="indigo">Page Delay</Tag> — chờ giữa các trang kết quả trong một truy vấn</li>
              <li><Tag color="indigo">Query Delay Min/Max</Tag> — chờ ngẫu nhiên giữa các từ khóa khác nhau (lớn hơn = ít CAPTCHA hơn)</li>
              <li><Tag color="indigo">CAPTCHA Respawn After</Tag> — khởi động lại trình duyệt sau N CAPTCHA liên tiếp</li>
              <li><Tag color="indigo">Max Respawns</Tag> — giới hạn cứng để tránh vòng lặp respawn làm quá tải CPU/RAM</li>
            </ul>
          </Prose>

          <H3>Mặc định bảng dữ liệu</H3>
          <Prose>
            <p>
              Mỗi bảng dữ liệu (Affiliate Programs, LLM Audit, Proxy) có thể cấu hình:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
              <li><strong className="text-[var(--text)]">Số dòng mặc định</strong> — được tô xanh trong selector, áp dụng khi mở bảng lần đầu</li>
              <li><strong className="text-[var(--text)]">Danh sách tùy chọn</strong> — các số cách nhau bằng dấu phẩy, hiện trong dropdown "Per page"</li>
            </ul>
          </Prose>
          <Callout type="tip">
            Nhấn <strong>Save All</strong> để lưu toàn bộ cấu hình cùng lúc. Thay đổi chỉ có hiệu lực sau khi lưu.
          </Callout>

          {/* ── User Management ───────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="users" /></div>
          <H2 icon={Users}>Quản lý người dùng</H2>
          <Prose>
            <p>
              Trang <strong className="text-[var(--text)]">/users</strong> cho phép Super Admin và Admin xem danh sách tất cả tài khoản trong hệ thống,
              chỉnh sửa thông tin và phân công vai trò.
            </p>
          </Prose>

          <Callout type="info">
            Chỉ người dùng có quyền <code className="text-xs bg-[var(--surface-2)] px-1 rounded">user:read</code> mới thấy trang này.
            Các thao tác sửa và xóa yêu cầu <code className="text-xs bg-[var(--surface-2)] px-1 rounded">user:manage</code>.
          </Callout>

          <H3>Danh sách người dùng</H3>
          <div className="space-y-2 my-3">
            {[
              ['Username', 'Tên đăng nhập — không thể thay đổi.'],
              ['Full Name', 'Họ và tên đầy đủ — có thể chỉnh sửa.'],
              ['Email', 'Địa chỉ email của tài khoản.'],
              ['Role', 'Vai trò hiện tại — hiển thị dạng mã code (ví dụ: SUPERADMIN, ADMIN). Biểu tượng khiên = tài khoản hệ thống.'],
              ['Status', 'ACTIVE hoặc INACTIVE.'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-[var(--text)]">{k}: </span>
                  <span className="text-xs text-[var(--text-muted)]">{v}</span>
                </div>
              </div>
            ))}
          </div>

          <H3>Chỉnh sửa người dùng</H3>
          <Prose>
            <p>
              Nhấp vào biểu tượng <strong className="text-[var(--text)]">bút chì</strong> ở cuối hàng để mở hộp thoại. Có thể thay đổi:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-[var(--text)]">Họ và tên</strong> — tên hiển thị của tài khoản.</li>
              <li><strong className="text-[var(--text)]">Vai trò</strong> — chọn từ danh sách role có sẵn, hoặc chọn "Không có vai trò" để gỡ phân công.</li>
            </ul>
          </Prose>
          <Callout type="warning">
            Thay đổi vai trò có hiệu lực ngay lập tức ở lần đăng nhập tiếp theo của người dùng đó. Cẩn thận khi gỡ vai trò của tài khoản admin.
          </Callout>

          <H3>Xóa người dùng</H3>
          <Prose>
            <p>
              Nhấp vào biểu tượng <strong className="text-[var(--text)]">thùng rác</strong> để xóa tài khoản vĩnh viễn.
              Nút xóa bị vô hiệu hóa cho tài khoản đang đăng nhập — không thể tự xóa mình.
            </p>
          </Prose>

          {/* ── Bảng tin hệ thống ─────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="announcements" /></div>
          <H2 icon={Bell}>Bảng tin hệ thống</H2>
          <Prose>
            <p>
              Bảng tin hiển thị thông báo cho người dùng ngay khi đăng nhập. Mỗi thông báo có thể được
              <strong> ghim</strong> (hiển thị nổi bật đầu danh sách) hoặc <strong>ẩn</strong> (vẫn lưu nhưng không hiện).
            </p>
          </Prose>
          <div className="grid sm:grid-cols-3 gap-4 not-prose">
            {[
              { icon: Plus,   color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-700/30',
                title: 'Thêm thông báo', desc: 'Nhập tiêu đề, nội dung, ngày đăng và đính kèm ảnh (tuỳ chọn). Hỗ trợ JPG, PNG, GIF, WEBP ≤ 5 MB.' },
              { icon: Pin,    color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', border: 'border-[var(--accent)]/30',
                title: 'Ghim / Bỏ ghim', desc: 'Thông báo được ghim xuất hiện đầu tiên và nổi bật hơn trong modal Bảng tin.' },
              { icon: EyeOff, color: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-700/30',
                title: 'Ẩn thông báo', desc: 'Bỏ tích "Đang hiển thị" để ẩn tạm thời mà không xóa — có thể bật lại bất cứ lúc nào.' },
            ].map(({ icon: Icon, color, bg, border, title, desc }) => (
              <div key={title} className={`rounded-xl border ${border} ${bg} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} className={color} />
                  <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="not-prose mt-2">
            <Link
              href="/config/announcements"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Bell size={14} /> Quản lý Bảng tin →
            </Link>
          </div>

          {/* ── FAQ ───────────────────────────────────────────────────────── */}
          <div className="relative"><SectionAnchor id="faq" /></div>
          <H2 icon={BookOpen}>Câu hỏi thường gặp</H2>

          {[
            {
              q: 'Crawl domain xong nhưng không thấy dữ liệu hoa hồng?',
              a: 'Có thể domain dùng Cloudflare và chưa cấu hình FlareSolverr, hoặc thông tin hoa hồng nằm sau form đăng nhập. Kiểm tra cột Fetch Tier — nếu hiển thị mã lỗi đỏ, thử dùng LLM Improve hoặc nhập thủ công.',
            },
            {
              q: 'AI Keyword Suggester không hiện model nào?',
              a: 'Ollama chưa chạy hoặc chưa pull model nào. Kiểm tra Ollama đang chạy tại localhost:11434 và đã có ít nhất một model (ollama pull mistral).',
            },
            {
              q: 'AI Analyst trả lời "data not found" dù domain có trong DB?',
              a: 'AI Analyst chỉ đọc top 15 chương trình theo điểm. Với domain không nằm trong top 15, hãy nhắc tên domain rõ ràng trong câu hỏi (ví dụ: "Tell me about paddle.com"). Hệ thống sẽ tự động nạp thêm dữ liệu của domain đó.',
            },
            {
              q: 'Discover from Google không tìm thấy domain mới?',
              a: 'Từ khóa có thể quá chung. Thử dùng AI Keyword Suggester để có từ khóa cụ thể hơn, hoặc tăng Limit per keyword.',
            },
            {
              q: 'Pool proxy xuống Live Rate thấp?',
              a: 'Chạy Full Health Check để cập nhật trạng thái, sau đó Delete Dead Proxies để dọn pool. Nếu Live Rate vẫn thấp, cần import thêm proxy mới.',
            },
            {
              q: 'Sự khác biệt giữa "Crawl Single Domain" và "Add / Update Program"?',
              a: '"Crawl Single Domain" tự động truy cập trang web để lấy dữ liệu. "Add / Update Program" là nhập thủ công — bạn điền thông tin, không cần crawler. Dùng form thủ công khi bạn đã biết chắc thông tin hoa hồng.',
            },
            {
              q: 'DOM Inspector hiển thị "⚠ CF Challenge" — phải làm gì?',
              a: 'Gọi lại API lần thứ 2 sau vài giây — session browser đã warm, Turnstile thường tự giải ở lần thứ 2. Nếu vẫn bị block, tăng AFFILIATE_DOM_FETCH_ATTEMPTS=3 qua POST /api/config. Trong crawler tự động, Phase 2.5 DOM Fallback sẽ tự retry với Playwright session mới.',
            },
            {
              q: 'Source URLs chỉ có 1 URL, không tìm được link trong footer?',
              a: 'Phase 2.5 DOM Fallback tự động extract footer/nav và visit các link affiliate tìm được. Nguyên nhân phổ biến: (1) URL đã bị Phase 2 đánh dấu visitedUrls trước khi fetch thành công — Phase 2.5 bypass cơ chế này bằng cách reuse Playwright page; (2) Link affiliate trong footer redirect ra subdomain ngoài domain chính — hệ thống vẫn follow nếu là affiliate network domain.',
            },
          ].map((item, i) => (
            <details key={i} className="group border border-[var(--border)] rounded-xl mb-2 overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
                <span className="text-sm font-medium text-[var(--text)] pr-4">{item.q}</span>
                <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--text-muted)]">AffiliateCrawl — Tài liệu nội bộ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
