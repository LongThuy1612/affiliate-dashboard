'use client';
import { useEffect, useState } from 'react';
import {
  BarChart2, ChevronRight, AlertTriangle, CheckCircle, Zap,
  FileSearch, Wrench, Database, TrendingUp, XCircle,
  ClipboardList, ArrowLeft, Calendar, ChevronDown, ChevronUp,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { auditApi, AuditBatchSummary, AuditHourPoint } from '@/lib/api';

// ─── Design primitives ────────────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="-mt-20 pt-20 block absolute" />;
}

function Tag({ children, color = 'indigo' }: { children: React.ReactNode; color?: 'indigo' | 'green' | 'amber' | 'red' | 'slate' | 'cyan' }) {
  const cls: Record<string, string> = {
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
    green:  'bg-green-900/40  text-green-300  border-green-700/40',
    amber:  'bg-amber-900/40  text-amber-300  border-amber-700/40',
    red:    'bg-red-900/40    text-red-300    border-red-700/40',
    slate:  'bg-slate-800/60  text-slate-300  border-slate-600/40',
    cyan:   'bg-cyan-900/40   text-cyan-300   border-cyan-700/40',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${cls[color]}`}>
      {children}
    </span>
  );
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const s = {
    tip:     { border: 'border-green-700/50',  bg: 'bg-green-950/30',  icon: <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />,   label: 'Mẹo' },
    warning: { border: 'border-amber-700/50',  bg: 'bg-amber-950/30',  icon: <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />, label: 'Lưu ý' },
    info:    { border: 'border-indigo-700/50', bg: 'bg-indigo-950/30', icon: <Zap size={14} className="text-indigo-400 shrink-0 mt-0.5" />,           label: 'Thông tin' },
  }[type];
  return (
    <div className={`flex gap-2.5 rounded-lg border ${s.border} ${s.bg} px-4 py-3 my-4`}>
      {s.icon}
      <div className="text-sm text-[var(--text)] leading-relaxed">
        <span className="font-semibold mr-1">{s.label}:</span>{children}
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

function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-[var(--border)]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]/40'}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[var(--text-muted)] align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Collapsible issue group ──────────────────────────────────────────────────

type IssueGroupDef = {
  num: string;
  title: string;
  color: 'red' | 'amber' | 'indigo' | 'purple' | 'slate';
  domains: { domain: string; score?: number; issue: string; note?: string }[];
};

function IssueGroup({ num, title, color, domains }: IssueGroupDef) {
  const [open, setOpen] = useState(false);
  const palette: Record<string, { card: string; badge: string; dot: string }> = {
    red:    { card: 'border-red-700/30 bg-red-950/15',       badge: 'bg-red-900/60 text-red-300 border-red-600/40',          dot: 'bg-red-500' },
    amber:  { card: 'border-amber-700/30 bg-amber-950/15',   badge: 'bg-amber-900/60 text-amber-300 border-amber-600/40',    dot: 'bg-amber-500' },
    indigo: { card: 'border-indigo-700/30 bg-indigo-950/15', badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-600/40', dot: 'bg-indigo-500' },
    purple: { card: 'border-purple-700/30 bg-purple-950/15', badge: 'bg-purple-900/60 text-purple-300 border-purple-600/40', dot: 'bg-purple-500' },
    slate:  { card: 'border-slate-600/30 bg-slate-900/20',   badge: 'bg-slate-800/60 text-slate-300 border-slate-600/40',   dot: 'bg-slate-500' },
  };
  const p = palette[color];
  return (
    <div className={`rounded-xl border ${p.card} overflow-hidden my-3`}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors">
        <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 h-6 rounded-full border text-[11px] font-bold shrink-0 ${p.badge}`}>{num}</span>
        <span className="text-sm font-semibold text-[var(--text)] flex-1">{title}</span>
        <span className="text-[11px] text-[var(--text-muted)] mr-2">{domains.length} domain</span>
        {open ? <ChevronUp size={13} className="text-[var(--text-muted)] shrink-0" /> : <ChevronDown size={13} className="text-[var(--text-muted)] shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
          {domains.map(d => (
            <div key={d.domain} className="flex items-start gap-2.5 rounded-lg bg-[var(--surface)]/60 px-3 py-2">
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot} mt-1.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-[12px] font-mono text-[var(--text)]">{d.domain}</code>
                  {d.score !== undefined && <span className="text-[10px] text-[var(--text-muted)]">score: {d.score}</span>}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{d.issue}</p>
                {d.note && <p className="text-[11px] text-amber-300/70 mt-0.5">{d.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Static qualitative notes per batch date ──────────────────────────────────
// Quantitative stats come from the API. Only the manually-curated analysis
// (issue groups, improvements made, pending issues) lives here.
// Add a new entry keyed by 'YYYY-MM-DD' after each batch audit.

type Improvement = { tag: string; tagColor: 'indigo' | 'amber' | 'slate'; title: string; desc: string; fixes: string };
type PendingIssue = { issue: string; level: 'Cao' | 'Trung bình' | 'Thấp'; note: string };

type StaticNotes = {
  issueGroups: IssueGroupDef[];
  improvements: Improvement[];
  pending: PendingIssue[];
};

const STATIC_NOTES: Record<string, StaticNotes> = {
  '2026-05-14': {
    issueGroups: [
      {
        num: '1', title: 'False positive — score cao nhưng không có chương trình affiliate', color: 'red',
        domains: [
          { domain: 'khrisdigital.com',      score: 93, issue: 'Trang blog, không có affiliate' },
          { domain: 'entrepreneurnut.com',   score: 93, issue: 'Blog, không có chương trình' },
          { domain: 'manychat.com',          score: 78, issue: 'Không có chương trình AFF' },
          { domain: 'clockify.me',           score: 73, issue: 'Không có chương trình affiliate' },
          { domain: 'quickbooks.intuit.com', score: 50, issue: 'Không có chương trình affiliate' },
          { domain: 'growann.com',           score: 50, issue: 'Không có chương trình affiliate' },
          { domain: 'xero.com',              score: 42, issue: 'Không có chương trình affiliate' },
        ],
      },
      {
        num: '2', title: 'Crawl sai path — bỏ sót path affiliate thật', color: 'amber',
        domains: [
          { domain: 'appsumo.com',     score: 42, issue: 'Bỏ sót /p/affiliates — "Earn 100% up to $50"',             note: '404' },
          { domain: 'jetbrains.com',   score: 42, issue: 'Crawl /company/partners/ (blog) thay vì trang affiliate',  note: 'SPA_SHELL' },
          { domain: 'myob.com',        score: 50, issue: 'Chương trình ở subdomain info.myob.com',                    note: '404' },
          { domain: 'acorns.com',      score: 65, issue: 'Trang bị redirect về trang chủ',                            note: '404' },
          { domain: 'il.ly',           score: 65, issue: 'Path /affiliate không tồn tại',                             note: '404' },
          { domain: 'kommunicate.io',  score: 35, issue: 'Extract sai — đúng là "No limit on commissions"',           note: '404' },
        ],
      },
      {
        num: '3', title: 'Data ẩn — không extract được từ accordion/FAQ', color: 'indigo',
        domains: [
          { domain: 'elfsight.com',       score: 58, issue: 'Commission "recurring 30%" ẩn trong FAQ accordion' },
          { domain: 'mailmodo.com',       score: 91, issue: 'Commission form ẩn trong mailmodo.firstpromoter.com' },
          { domain: 'empireflippers.com', score: 50, issue: '/partners là blog, /referral-program/ mới đúng' },
          { domain: 'linkjolt.io',        score: 74, issue: '/affiliate-program đúng, /merchant-dashboard không có data' },
        ],
      },
      {
        num: '4', title: 'Directory / aggregator bị nhầm là chương trình đơn', color: 'purple',
        domains: [
          { domain: 'affiliateotter.com',        issue: 'Liệt kê nhiều chương trình trong một trang' },
          { domain: 'topranked.io',               issue: 'Liệt kê nhiều chương trình trong một trang' },
          { domain: 'aiaffiliateprograms.ai',     issue: 'Liệt kê nhiều chương trình trong một trang' },
          { domain: 'tagaffiliatedirectory.com',  issue: 'Nhiều chương trình trong một subDomain' },
          { domain: 'referly.so',                 issue: 'Nhiều chương trình trong một trang' },
          { domain: 'affiliatevault.online',      issue: 'Nhiều chương trình trong category page' },
        ],
      },
      {
        num: '5', title: 'Kết quả một phần — một số path đúng, một số sai', color: 'slate',
        domains: [
          { domain: 'saleshandy.com', score: 70, issue: 'Subdomain khác không có affiliate ngoài /affiliate-program' },
          { domain: 'getreditus.com', score: 67, issue: '/affiliate-program đúng; /referral không có affiliate' },
          { domain: 'freshbooks.com', score: 65, issue: 'Chỉ /affiliate-program có data' },
          { domain: 'affilorama.com', score: 65, issue: '/pathwaytopassive không có hoa hồng, /affiliates mới có' },
        ],
      },
    ],
    improvements: [
      { tag: 'affiliateCrawler.js', tagColor: 'indigo', title: 'Mở rộng AFFILIATE_PATHS',       desc: 'Thêm 9 path mới: /p/affiliates, /promoters, /refer, /refer-a-friend, /resellers, /reseller-program, /partner-with-us, /grow, /revenue-share', fixes: 'Nhóm 2' },
      { tag: 'affiliateCrawler.js', tagColor: 'indigo', title: 'Phase 1A.5 — Subdomain probe',  desc: 'Sau khi Phase 1A = 0 kết quả, tự động thử affiliates.*, partners.*, partner.*, refer.*, promoters.* subdomain', fixes: 'Nhóm 2' },
      { tag: 'affiliateCrawler.js', tagColor: 'indigo', title: 'extractHiddenContent()',         desc: 'Trích xuất text từ <details>/<summary> và ARIA accordion panels — bắt data ẩn trong FAQ', fixes: 'Nhóm 3' },
      { tag: 'affiliateScore.js',   tagColor: 'amber',  title: 'Score penalty aggregator (−15)', desc: 'Trừ 15 điểm nếu domain là directory affiliate với outbound signup link trỏ ra domain khác', fixes: 'Nhóm 4' },
      { tag: 'affiliateCrawler.js', tagColor: 'slate',  title: 'Xóa debug console.log',          desc: 'Dọn sạch 6 console.log thừa trong production code', fixes: 'cleanup' },
    ],
    pending: [
      { issue: 'CF_BLOCK (6.2%) không leo được Tier 3',                 level: 'Cao',        note: 'FlareSolverr cần cấu hình và test kỹ hơn' },
      { issue: 'TIMEOUT (3.3%) trên các domain chậm',                   level: 'Trung bình', note: 'Tăng timeout hoặc thêm retry logic' },
      { issue: 'Directory domains chưa có DIRECTORY fingerprint tier',  level: 'Trung bình', note: 'Cần thêm tier mới vào domainFingerprint.js' },
      { issue: 'Subpath affiliate ẩn sau login (getlasso.co CF_BLOCK)', level: 'Thấp',       note: 'Cần FlareSolverr hoặc bỏ qua' },
    ],
  },
};

// ─── Recharts tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[11px] shadow-xl">
      <p className="font-semibold text-[var(--text)] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--surface-2)] ${className}`} />;
}

// ─── Sidebar sections ─────────────────────────────────────────────────────────

const GLOBAL_SECTIONS = [
  { id: 'trend',  label: 'Xu hướng tổng thể' },
  { id: 'sql',    label: 'SQL phân tích' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataQualityAuditPage() {
  const [activeSection, setActiveSection]     = useState('trend');
  const [batches, setBatches]                 = useState<AuditBatchSummary[]>([]);
  const [selectedDate, setSelectedDate]       = useState<string>('');
  const [hourlyData, setHourlyData]           = useState<AuditHourPoint[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingHourly, setLoadingHourly]     = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  // Fetch daily summary on mount
  useEffect(() => {
    setLoading(true);
    auditApi.getSummary(90)
      .then(data => {
        setBatches(data);
        if (data.length > 0) setSelectedDate(data[0].date);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch hourly data whenever selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingHourly(true);
    auditApi.getHourly(selectedDate)
      .then(setHourlyData)
      .catch(() => setHourlyData([]))
      .finally(() => setLoadingHourly(false));
  }, [selectedDate]);

  const batch = batches.find(b => b.date === selectedDate) ?? null;
  const notes = selectedDate ? STATIC_NOTES[selectedDate] ?? null : null;

  const verifyTotal = batch ? batch.verify.correct + batch.verify.wrong + batch.verify.partial : 0;
  const accuracyPct = verifyTotal ? Math.round(batch!.verify.correct / verifyTotal * 100) : 0;

  // Data for daily trend charts
  const dailyTrend = [...batches].reverse().map(b => {
    const tot = b.verify.correct + b.verify.wrong + b.verify.partial;
    return {
      date:     b.date.slice(5), // MM-DD
      accuracy: tot ? Math.round(b.verify.correct / tot * 100) : 0,
      verified: b.totalVerified,
      avgScore: b.avgScore,
    };
  });

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full">
      {/* ── Sidebar ── */}
      <aside className="hidden xl:flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] py-6 px-3 gap-0.5 overflow-y-auto">
        <Link href="/docs" className="flex items-center gap-1.5 px-2 mb-4 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
          <ArrowLeft size={11} /> Quay lại Docs
        </Link>

        <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Tổng thể</p>
        {GLOBAL_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              activeSection === s.id
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <ChevronRight size={10} className={activeSection === s.id ? 'opacity-100' : 'opacity-0'} />
            {s.label}
          </button>
        ))}

        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Batch theo ngày</p>
          {loading && <div className="space-y-1.5 px-2"><Skeleton className="h-6" /><Skeleton className="h-6" /></div>}
          {batches.map(b => {
            const tot = b.verify.correct + b.verify.wrong + b.verify.partial;
            const acc = tot ? Math.round(b.verify.correct / tot * 100) : 0;
            return (
              <button
                key={b.date}
                onClick={() => setSelectedDate(b.date)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  selectedDate === b.date
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <Calendar size={10} className="shrink-0" />
                <span className="flex-1">{b.date}</span>
                <span className={`text-[10px] ${acc >= 70 ? 'text-green-400' : acc >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{acc}%</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

          <Link href="/docs" className="xl:hidden inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors">
            <ArrowLeft size={12} /> Quay lại Docs
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <FileSearch size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Nhật ký kiểm tra</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-3">Kiểm tra chất lượng dữ liệu</h1>
            <p className="text-[var(--text-muted)] text-base">
              Ghi lại kết quả verify thủ công, phân tích lỗi và các cải tiến sau mỗi batch crawl.
              Số liệu được lấy trực tiếp từ DB — tự cập nhật khi có verify mới.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-700/40 bg-red-950/20 px-4 py-3 mb-6 text-sm text-red-300">
              Không thể tải dữ liệu: {error}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PHẦN 1 — XU HƯỚNG TỔNG THỂ (dữ liệu thực từ DB)
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative"><SectionAnchor id="trend" /></div>
          <H2 icon={TrendingUp}>Xu hướng tổng thể</H2>
          <Prose>
            <p>Biểu đồ tổng hợp tỷ lệ chính xác và score trung bình qua các batch. Dữ liệu thực từ <code className="text-[var(--accent)]">affiliate_programs</code> + <code className="text-[var(--accent)]">affiliate_verifications</code>.</p>
          </Prose>

          {/* Accuracy bar chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 my-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Accuracy % theo ngày</p>
            {loading ? <Skeleton className="h-48" /> : dailyTrend.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">Chưa có dữ liệu verify</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="accuracy" name="Accuracy %" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {dailyTrend.map((entry, i) => (
                        <Cell key={i} fill={entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 55 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Score + verified trend line chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 my-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Score trung bình & số domain đã verify</p>
            {loading ? <Skeleton className="h-48" /> : dailyTrend.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">Chưa có dữ liệu</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 2' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    <Line type="monotone" dataKey="avgScore" name="Score TB"  stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                    <Line type="monotone" dataKey="verified" name="Verified"  stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PHẦN 2 — SQL DÙNG CHUNG
          ══════════════════════════════════════════════════════════════ */}
          <div className="relative"><SectionAnchor id="sql" /></div>
          <H2 icon={Database}>SQL hỗ trợ phân tích</H2>
          <Prose>
            <p>Các câu truy vấn dùng chung — áp dụng cho bất kỳ ngày nào. Đây chính là SQL mà API <code className="text-[var(--accent)]">/affiliate-audit/summary</code> và <code className="text-[var(--accent)]">/affiliate-audit/hourly</code> sử dụng.</p>
          </Prose>

          <H3>Thống kê lỗi fetch theo ngày</H3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 my-3 overflow-x-auto">
            <pre className="text-[11px] text-green-300/80 font-mono leading-relaxed whitespace-pre">{`SELECT
  DATE(p.crawled_at)                                  AS crawl_date,
  COUNT(DISTINCT p.domain)                            AS total_crawled,
  COUNT(DISTINCT v.domain)                            AS total_verified,
  ROUND(AVG(p.affiliate_score), 1)                    AS avg_score,
  SUM(p.affiliate_score >= 70)                        AS high_score,
  SUM(p.affiliate_score BETWEEN 40 AND 69)            AS mid_score,
  SUM(p.affiliate_score < 40)                         AS low_score,
  COALESCE(SUM(v.option = 1), 0)                      AS verify_correct,
  COALESCE(SUM(v.option = 2), 0)                      AS verify_wrong,
  COALESCE(SUM(v.option = 3), 0)                      AS verify_partial,
  SUM(p.last_fetch_error = '404')                     AS err_404,
  SUM(p.last_fetch_error IS NULL)                     AS err_null,
  SUM(p.last_fetch_error = 'CF_BLOCK')                AS err_cf_block
FROM affiliate_programs p
LEFT JOIN affiliate_verifications v ON v.domain = p.domain
WHERE p.crawled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(p.crawled_at)
ORDER BY crawl_date DESC;`}</pre>
          </div>

          <H3>Tiến trình verify theo giờ</H3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 my-3 overflow-x-auto">
            <pre className="text-[11px] text-green-300/80 font-mono leading-relaxed whitespace-pre">{`SELECT
  LPAD(HOUR(v.created_at), 2, '0')    AS hour,
  SUM(v.option = 1)                    AS correct,
  SUM(v.option = 2)                    AS wrong,
  SUM(v.option = 3)                    AS partial,
  COUNT(*)                             AS total
FROM affiliate_verifications v
WHERE DATE(v.created_at) = '2026-05-14'  -- đổi ngày
GROUP BY HOUR(v.created_at)
ORDER BY hour;`}</pre>
          </div>

          <H3>Domain verify sai có score cao</H3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 my-3 overflow-x-auto">
            <pre className="text-[11px] text-green-300/80 font-mono leading-relaxed whitespace-pre">{`SELECT
  p.domain,
  p.affiliate_score,
  p.commission_rate,
  p.last_fetch_error,
  v.note
FROM affiliate_programs p
JOIN affiliate_verifications v ON v.domain = p.domain
WHERE v.option = 2
  AND p.affiliate_score >= 50
ORDER BY p.affiliate_score DESC
LIMIT 50;`}</pre>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              PHẦN 3 — BATCH THEO NGÀY
          ══════════════════════════════════════════════════════════════ */}
          <div className="mt-12">
            {/* Mobile date picker */}
            <div className="xl:hidden flex gap-2 flex-wrap mb-4">
              {batches.map(b => (
                <button
                  key={b.date}
                  onClick={() => setSelectedDate(b.date)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    selectedDate === b.date
                      ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)] font-medium'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Calendar size={11} />{b.date}
                </button>
              ))}
            </div>

            {/* Loading / empty state */}
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-16" />
                <div className="grid grid-cols-3 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                <Skeleton className="h-56" />
              </div>
            )}

            {!loading && !batch && !error && (
              <p className="text-sm text-[var(--text-muted)] text-center py-12">Chưa có dữ liệu crawl nào trong 90 ngày qua.</p>
            )}

            {!loading && batch && (
              <>
                {/* Batch header */}
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium mb-0.5">Batch đang xem</p>
                    <p className="text-base font-bold text-[var(--text)]">Ngày {batch.date}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Tag color="indigo">{batch.totalCrawled} domain</Tag>
                    <Tag color={accuracyPct >= 70 ? 'green' : accuracyPct >= 55 ? 'amber' : 'red'}>{accuracyPct}% chính xác</Tag>
                  </div>
                </div>

                {/* ── Tổng quan batch ── */}
                <H2 icon={BarChart2}>Tổng quan batch {batch.date}</H2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Tổng crawled',     value: String(batch.totalCrawled),                                                                  color: 'border-indigo-600/30 bg-indigo-950/15 text-indigo-300' },
                    { label: 'Đã verify',         value: `${batch.totalVerified} (${batch.totalCrawled ? Math.round(batch.totalVerified/batch.totalCrawled*100) : 0}%)`, color: 'border-blue-600/30 bg-blue-950/15 text-blue-300' },
                    { label: 'Score trung bình',  value: `${batch.avgScore} / 100`,                                                                  color: 'border-amber-600/30 bg-amber-950/15 text-amber-300' },
                    { label: 'Score ≥ 70',        value: `${batch.highScore} domain`,                                                                color: 'border-green-600/30 bg-green-950/15 text-green-300' },
                    { label: 'Score 40–69',       value: `${batch.midScore} domain`,                                                                 color: 'border-cyan-600/30 bg-cyan-950/15 text-cyan-300' },
                    { label: 'Score < 40',        value: `${batch.lowScore} domain`,                                                                 color: 'border-red-600/30 bg-red-950/15 text-red-300' },
                  ].map(stat => (
                    <div key={stat.label} className={`rounded-xl border px-4 py-3 ${stat.color}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Verify results ── */}
                <H2 icon={ClipboardList}>Kết quả Verify</H2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { emoji: '✅', label: 'Chính xác', value: batch.verify.correct, pct: verifyTotal ? Math.round(batch.verify.correct/verifyTotal*100) : 0, desc: 'Data đúng, đủ',                          color: 'border-green-600/30 bg-green-950/15' },
                    { emoji: '❌', label: 'Sai',        value: batch.verify.wrong,   pct: verifyTotal ? Math.round(batch.verify.wrong/verifyTotal*100)   : 0, desc: 'Data lỗi hoặc không có chương trình',  color: 'border-red-600/30 bg-red-950/15' },
                    { emoji: '⚠️', label: 'Phức tạp',  value: batch.verify.partial, pct: verifyTotal ? Math.round(batch.verify.partial/verifyTotal*100) : 0, desc: 'Có vấn đề cần xử lý đặc biệt',        color: 'border-amber-600/30 bg-amber-950/15' },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
                      <div className="flex items-center gap-2 mb-2"><span className="text-lg">{item.emoji}</span><span className="text-sm font-semibold text-[var(--text)]">{item.label}</span></div>
                      <p className="text-2xl font-bold text-[var(--text)] mb-1">{item.value} <span className="text-sm font-normal text-[var(--text-muted)]">({item.pct}%)</span></p>
                      <p className="text-[11px] text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* ── Hourly verify trend ── */}
                <H3>Tiến trình verify theo giờ — {batch.date}</H3>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6">
                  {loadingHourly ? <Skeleton className="h-52" /> : hourlyData.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] text-center py-12">Chưa có dữ liệu verify theo giờ</p>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                          <Bar dataKey="correct" name="Chính xác" stackId="a" fill="#10b981" />
                          <Bar dataKey="partial" name="Phức tạp"  stackId="a" fill="#f59e0b" />
                          <Bar dataKey="wrong"   name="Sai"       stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {verifyTotal > 0 && (
                  <Callout type="warning">
                    Tỷ lệ sai {Math.round(batch.verify.wrong/verifyTotal*100)}% — chủ yếu do blog/marketing page được nhận diện nhầm là trang affiliate.
                  </Callout>
                )}

                {/* ── Fetch errors ── */}
                <H2 icon={XCircle}>Phân bố lỗi fetch</H2>
                {batch.fetchErrors.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] my-4">Không có lỗi fetch được ghi nhận.</p>
                ) : (
                  <DataTable
                    headers={['Error code', 'Số lượng', '%', 'Nguyên nhân']}
                    rows={batch.fetchErrors.map(e => [
                      <code key={e.code} className="text-[var(--text)]">{e.code}</code>,
                      String(e.count),
                      `${e.pct}%`,
                      e.cause,
                    ])}
                  />
                )}

                {/* ── Static notes: issue groups, improvements, pending ── */}
                {notes ? (
                  <>
                    <H2 icon={AlertTriangle}>Nhóm lỗi phát hiện qua Verify</H2>
                    <Prose><p>Click vào từng nhóm để xem danh sách domain và chi tiết lỗi.</p></Prose>
                    <div className="mt-2">{notes.issueGroups.map(g => <IssueGroup key={g.num} {...g} />)}</div>

                    <H2 icon={Wrench}>Cải tiến đã thực hiện</H2>
                    <div className="space-y-3 my-4">
                      {notes.improvements.map(item => (
                        <div key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Tag color={item.tagColor}>{item.tag}</Tag>
                            <span className="text-sm font-semibold text-[var(--text)]">{item.title}</span>
                            <span className="ml-auto text-[11px] text-[var(--text-muted)]">→ {item.fixes}</span>
                          </div>
                          <p className="text-[12px] text-[var(--text-muted)]">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    <H2 icon={TrendingUp}>Vấn đề còn tồn đọng</H2>
                    <DataTable
                      headers={['Vấn đề', 'Mức độ', 'Ghi chú']}
                      rows={notes.pending.map(p => [
                        p.issue,
                        <Tag key={p.issue} color={p.level === 'Cao' ? 'red' : p.level === 'Trung bình' ? 'amber' : 'slate'}>{p.level}</Tag>,
                        p.note,
                      ])}
                    />
                  </>
                ) : (
                  <Callout type="info">
                    Chưa có ghi chú phân tích thủ công cho ngày {batch.date}. Thêm vào <code className="text-[var(--accent)]">STATIC_NOTES[&apos;{batch.date}&apos;]</code> trong file này.
                  </Callout>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <RefreshCw size={10} />
              Dữ liệu thực từ DB · tự cập nhật khi reload
            </div>
            <Link href="/docs" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
              <ArrowLeft size={11} /> Về trang Docs chính
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
