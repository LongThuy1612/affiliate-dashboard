'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Settings, ChevronRight, Key, Bot, Sliders, RefreshCw,
  Globe, Table2, BookOpen, Zap, AlertTriangle, CheckCircle,
  ArrowLeft, Database, Code as CodeIcon, ArrowRight, ShieldCheck,
} from 'lucide-react';

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="-mt-20 pt-20 block absolute" />;
}

function Callout({ type, children }: { type: 'tip' | 'warning' | 'info'; children: React.ReactNode }) {
  const styles = {
    tip: { border: 'border-green-700/50', bg: 'bg-green-950/30', icon: <CheckCircle size={14} className="text-green-400  shrink-0 mt-0.5" />, label: 'Mẹo' },
    warning: { border: 'border-amber-700/50', bg: 'bg-amber-950/30', icon: <AlertTriangle size={14} className="text-amber-400  shrink-0 mt-0.5" />, label: 'Lưu ý' },
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

function H2({ icon: Icon, id, children }: { icon: React.ElementType; id: string; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center gap-2.5 mb-5 mt-10">
      <SectionAnchor id={id} />
      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-[var(--accent)]" />
      </div>
      <h2 className="text-lg font-bold text-[var(--text)]">{children}</h2>
    </div>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {id && <SectionAnchor id={id} />}
      <h3 className="text-base font-semibold text-[var(--text)] mt-7 mb-3">{children}</h3>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[var(--text-muted)] leading-relaxed space-y-3">{children}</div>;
}


function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--text)]">
      {children}
    </code>
  );
}

function EnvBlock({ children }: { children: string }) {
  return (
    <pre className="my-3 rounded-lg bg-[#0d1117] border border-[var(--border)] px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  );
}

// ─── Param table ──────────────────────────────────────────────────────────────

interface ParamRow {
  key: string;
  envKey: string;
  default: string;
  type: string;
  desc: string;
}

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="my-4 rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Trường UI</th>
            <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Biến ENV tương ứng</th>
            <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Kiểu</th>
            <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Mặc định</th>
            <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
              <td className="px-4 py-2.5 font-mono text-[var(--accent)]">{r.key}</td>
              <td className="px-4 py-2.5 font-mono text-emerald-300">{r.envKey}</td>
              <td className="px-4 py-2.5 text-[var(--text-muted)]">{r.type}</td>
              <td className="px-4 py-2.5 font-mono text-amber-300">{r.default}</td>
              <td className="px-4 py-2.5 text-[var(--text-muted)]">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tier decision diagram ─────────────────────────────────────────────────────

function TierFlowDiagram() {
  return (
    <div className="my-5 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-3 font-mono text-xs">
      <p className="text-[var(--text-muted)] font-sans text-xs font-semibold uppercase tracking-wider mb-4">
        Luồng quyết định chọn mô hình LLM
      </p>

      {/* Decision box 1 */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center shrink-0">
          <span className="text-[var(--accent)] text-[10px] font-bold">1</span>
        </div>
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <span className="text-[var(--text-muted)]">Kiểm tra: </span>
          <span className="text-amber-300">score</span>
          <span className="text-[var(--text-muted)]"> &lt;= </span>
          <span className="text-purple-300">LLM_TIER_SCORE_LOW</span>
          <span className="text-[var(--text-muted)]"> AND </span>
          <span className="text-amber-300">confidence</span>
          <span className="text-[var(--text-muted)]"> &lt;= </span>
          <span className="text-purple-300">LLM_TIER_CONF_LOW</span>
        </div>
      </div>
      <div className="flex gap-6 pl-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-green-400 text-[10px]">TRUE</span>
          <div className="h-4 w-px bg-green-500/40" />
          <div className="px-3 py-1.5 rounded-lg bg-purple-900/30 border border-purple-700/40 text-purple-300">
            → Dùng <strong>Model LOW</strong> (OLLAMA_MODEL_LOW)
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-slate-400 text-[10px]">FALSE</span>
          <div className="h-4 w-px bg-slate-600/40" />
          <span className="text-[var(--text-muted)] text-[10px]">tiếp tục →</span>
        </div>
      </div>

      {/* Decision box 2 */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center shrink-0">
          <span className="text-[var(--accent)] text-[10px] font-bold">2</span>
        </div>
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <span className="text-[var(--text-muted)]">Kiểm tra: </span>
          <span className="text-amber-300">score</span>
          <span className="text-[var(--text-muted)]"> &lt;= </span>
          <span className="text-blue-300">LLM_TIER_SCORE_MID</span>
          <span className="text-[var(--text-muted)]"> AND </span>
          <span className="text-amber-300">confidence</span>
          <span className="text-[var(--text-muted)]"> &lt;= </span>
          <span className="text-blue-300">LLM_TIER_CONF_MID</span>
        </div>
      </div>
      <div className="flex gap-6 pl-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-green-400 text-[10px]">TRUE</span>
          <div className="h-4 w-px bg-green-500/40" />
          <div className="px-3 py-1.5 rounded-lg bg-blue-900/30 border border-blue-700/40 text-blue-300">
            → Dùng <strong>Model MID</strong> (OLLAMA_MODEL_MID)
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-slate-400 text-[10px]">FALSE</span>
          <div className="h-4 w-px bg-slate-600/40" />
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600/40 text-slate-400">
            → Bỏ qua LLM (dữ liệu đủ tốt)
          </div>
        </div>
      </div>

      <p className="pt-2 text-[11px] text-[var(--text-muted)] font-sans italic">
        Quy tắc này chỉ áp dụng khi <InlineCode>ENABLE_LLM_EXTRACT = true</InlineCode>. Nếu tắt, tất cả domain đều bỏ qua LLM.
      </p>
    </div>
  );
}

// ─── Retry threshold diagram ───────────────────────────────────────────────────

function RetryFlowDiagram() {
  return (
    <div className="my-5 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] font-mono text-xs space-y-3">
      <p className="text-[var(--text-muted)] font-sans text-xs font-semibold uppercase tracking-wider mb-4">
        Điều kiện để domain được retry với LLM
      </p>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="flex-1 pb-3 border-b border-[var(--border)]">
          <p className="text-[var(--text)]">
            <span className="text-amber-300">score</span>
            <span className="text-[var(--text-muted)]"> &lt;= </span>
            <span className="text-indigo-300">AFFILIATE_RETRY_SCORE_MAX</span>
            <span className="text-[var(--text-muted)]"> (mặc định: </span>
            <span className="text-green-400">40</span>
            <span className="text-[var(--text-muted)]">)</span>
          </p>
          <p className="text-[var(--text-muted)] text-[11px] mt-1 font-sans">Domain điểm quá thấp → dữ liệu chưa đủ, cần AI xử lý lại</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-8 text-[var(--text-muted)]">
        <span>AND</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="flex-1 pb-3 border-b border-[var(--border)]">
          <p className="text-[var(--text)]">
            <span className="text-amber-300">confidence</span>
            <span className="text-[var(--text-muted)]"> &lt;= </span>
            <span className="text-indigo-300">AFFILIATE_RETRY_CONF_MAX</span>
            <span className="text-[var(--text-muted)]"> (mặc định: </span>
            <span className="text-green-400">0.4</span>
            <span className="text-[var(--text-muted)]">)</span>
          </p>
          <p className="text-[var(--text-muted)] text-[11px] mt-1 font-sans">Độ tin cậy thấp → dữ liệu chưa được xác minh đủ</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-8 text-[var(--text-muted)]">
        <span>AND</span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-[var(--text)]">
            <span className="text-amber-300">crawlCount</span>
            <span className="text-[var(--text-muted)]"> &lt; </span>
            <span className="text-indigo-300">AFFILIATE_MAX_CRAWL_RETRIES</span>
            <span className="text-[var(--text-muted)]"> (mặc định: </span>
            <span className="text-green-400">3</span>
            <span className="text-[var(--text-muted)]">)</span>
          </p>
          <p className="text-[var(--text-muted)] text-[11px] mt-1 font-sans">Chưa vượt quá giới hạn retry — tránh vòng lặp vô tận</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ArrowRight size={13} className="text-green-400" />
        <span className="text-green-300 font-sans">Ba điều kiện đều đúng → domain được đưa vào hàng đợi LLM improve</span>
      </div>
    </div>
  );
}

// ─── Google scraper timing diagram ────────────────────────────────────────────

function ScraperTimingDiagram() {
  return (
    <div className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 overflow-x-auto">
      <p className="text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider mb-4 font-sans">
        Dòng thời gian một phiên tìm kiếm Google
      </p>
      <div className="flex items-center gap-0 min-w-max text-[11px] font-mono">
        {/* Keyword 1 */}
        <div className="flex flex-col items-center">
          <div className="px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-center">
            Keyword 1<br /><span className="text-[10px] text-[var(--text-muted)]">page 1</span>
          </div>
        </div>
        <div className="flex flex-col items-center mx-1">
          <div className="px-2 py-1 rounded bg-slate-800 border border-slate-600/40 text-slate-400 text-[10px] whitespace-nowrap">
            PAGE_DELAY
          </div>
          <div className="h-px w-8 bg-slate-600/40 mt-1" />
        </div>
        <div className="flex flex-col items-center">
          <div className="px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-center">
            Keyword 1<br /><span className="text-[10px] text-[var(--text-muted)]">page 2</span>
          </div>
        </div>
        <div className="flex flex-col items-center mx-1">
          <div className="px-2 py-1 rounded bg-slate-800 border border-slate-600/40 text-slate-400 text-[10px] whitespace-nowrap">
            PAGE_DELAY
          </div>
          <div className="h-px w-8 bg-slate-600/40 mt-1" />
        </div>
        <div className="flex flex-col items-center">
          <div className="px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-center">
            Keyword 1<br /><span className="text-[10px] text-[var(--text-muted)]">page N</span>
          </div>
        </div>
        {/* Between keywords gap */}
        <div className="flex flex-col items-center mx-2">
          <div className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/40 text-amber-300 text-[10px] whitespace-nowrap">
            QUERY_DELAY<br />min…max
          </div>
          <div className="h-px w-10 bg-amber-600/30 mt-1" />
        </div>
        {/* Keyword 2 */}
        <div className="flex flex-col items-center">
          <div className="px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 text-center">
            Keyword 2<br /><span className="text-[10px] text-[var(--text-muted)]">page 1</span>
          </div>
        </div>
        <div className="flex flex-col items-center mx-2 text-[var(--text-muted)]">…</div>
      </div>
    </div>
  );
}

// ─── TOC sections ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'how-save', label: 'Cách lưu & áp dụng' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'gemini-key', label: 'Gemini API Key' },
  { id: 'llm-models', label: 'LLM Models & Tiers' },
  { id: 'tier-logic', label: 'Logic phân tầng tự động' },
  { id: 'crawl-retry', label: 'Ngưỡng Crawl lại' },
  { id: 'smart-crawl', label: 'Cơ chế bảo vệ dữ liệu' },
  { id: 'google-scraper', label: 'Google Scraper' },
  { id: 'table-defaults', label: 'Mặc định bảng dữ liệu' },
  { id: 'env-reference', label: 'Bảng biến ENV' },
  { id: 'faq', label: 'Câu hỏi thường gặp' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfigDocsPage() {
  const [activeId, setActiveId] = useState('overview');

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full">

      {/* Sidebar TOC */}
      <aside className="hidden xl:flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] py-5 px-3 gap-0.5 overflow-y-auto">
        <div className="px-2 mb-4 flex items-center gap-2">
          <Settings size={13} className="text-[var(--accent)]" />
          <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Hướng dẫn Config</p>
        </div>
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
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <Link
            href="/config"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <ArrowLeft size={11} />
            Mở trang Config
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-8">
            <Link href="/config" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
              <Settings size={11} /> Cấu hình hệ thống
            </Link>
            <ChevronRight size={10} />
            <span className="text-[var(--text)]">Hướng dẫn chi tiết</span>
          </div>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={20} className="text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">Tài liệu cấu hình</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
              Hướng dẫn trang Cấu hình hệ thống
            </h1>
            <p className="text-[var(--text-muted)] text-base leading-relaxed">
              Giải thích chi tiết từng thông số cấu hình — mục đích, giá trị hợp lệ, ảnh hưởng khi thay đổi, và mối liên hệ với các biến ENV trong file <InlineCode>.env</InlineCode>.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/config"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Settings size={14} /> Mở trang Config
              </Link>
              <span className="text-xs text-[var(--text-muted)]">Thay đổi cấu hình xong, nhấn Save All để lưu.</span>
            </div>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <H2 icon={BookOpen} id="overview">Tổng quan</H2>
          <Prose>
            <p>
              Trang <strong className="text-[var(--text)]">/config</strong> tập trung mọi thông số vận hành của hệ thống vào một giao diện duy nhất.
              Thay vì phải SSH vào server và sửa file <InlineCode>.env</InlineCode>, bạn điều chỉnh trực tiếp từ trình duyệt.
            </p>
            <p>
              Mọi giá trị được lưu vào bảng <InlineCode>app_configs</InlineCode> trong MySQL theo dạng key-value.
              Khi backend khởi động, nó đọc từ <InlineCode>.env</InlineCode> trước, sau đó các giá trị trong DB sẽ <strong className="text-[var(--text)]">ghi đè</strong> nếu tồn tại —
              tức là DB luôn thắng env.
            </p>
          </Prose>

          <div className="my-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Key, color: 'text-yellow-400', label: 'API Keys', desc: '3 nhà cung cấp (Anthropic, Gemini, Google)' },
              { icon: Bot, color: 'text-purple-400', label: 'LLM Models', desc: 'Ollama (local) + Gemini (cloud)' },
              { icon: Sliders, color: 'text-blue-400', label: 'Tier Thresholds', desc: '4 ngưỡng điều chỉnh' },
              { icon: RefreshCw, color: 'text-amber-400', label: 'Crawl Retry', desc: '4 thông số retry + scoring' },
              { icon: Globe, color: 'text-indigo-400', label: 'Google Scraper', desc: '6 thông số timing' },
              { icon: Table2, color: 'text-green-400', label: 'Table Defaults', desc: '3 bảng × 2 tùy chọn' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <item.icon size={16} className={item.color} />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{item.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── How saves work ────────────────────────────────────────────── */}
          <H2 icon={Database} id="how-save">Cách lưu & áp dụng cấu hình</H2>
          <Prose>
            <p>
              Nhấn <strong className="text-[var(--text)]">Save All</strong> gửi toàn bộ form lên endpoint <InlineCode>POST /api/config</InlineCode>.
              Backend thực hiện upsert mỗi cặp key-value vào bảng <InlineCode>app_configs</InlineCode>.
            </p>
          </Prose>
          <EnvBlock>{`-- Cấu trúc bảng app_configs
CREATE TABLE app_configs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  key        VARCHAR(100) UNIQUE NOT NULL,
  value      TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`}</EnvBlock>
          <Prose>
            <p>
              Khi một service backend cần đọc cấu hình (ví dụ crawl-affiliate), nó gọi <InlineCode>app-config.getAll()</InlineCode>.
              Hàm này trả về object gộp: giá trị mặc định từ env <ArrowRight className="inline" size={11} /> bị ghi đè bởi DB nếu key tồn tại.
            </p>
          </Prose>
          <Callout type="warning">
            Thay đổi sẽ có hiệu lực ở <strong>lần crawl / xử lý tiếp theo</strong>, không áp dụng ngay cho tác vụ đang chạy.
            Muốn áp dụng ngay, dừng rồi khởi động lại tiến trình backend.
          </Callout>

          {/* ── API Keys ─────────────────────────────────────────────────── */}
          <H2 icon={Key} id="api-keys">API Keys</H2>

          <H3>Anthropic API Key & Claude Model</H3>
          <Prose>
            <p>
              Được dùng khi tính năng <strong className="text-[var(--text)]">LLM Extraction</strong> gọi Claude thay vì Ollama cục bộ.
              Hiện tại hệ thống ưu tiên Ollama; Claude chỉ được gọi khi <InlineCode>ANTHROPIC_API_KEY</InlineCode> được cấu hình và Ollama không khả dụng.
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'anthropic_api_key', envKey: 'ANTHROPIC_API_KEY', type: 'string (secret)', default: '(trống)', desc: 'API key từ console.anthropic.com' },
            { key: 'anthropic_model', envKey: 'ANTHROPIC_MODEL', type: 'string', default: 'claude-haiku-4-5-20251001', desc: 'Model ID dùng cho extraction' },
          ]} />
          <Callout type="info">
            Model hiệu quả nhất về chi phí: <InlineCode>claude-haiku-4-5-20251001</InlineCode> (~$0.0008/request).
            Dùng <InlineCode>claude-sonnet-4-6</InlineCode> nếu cần độ chính xác cao hơn.
          </Callout>

          <H3>Google CSE API Key & CX</H3>
          <Prose>
            <p>
              Bắt buộc để dùng tính năng <strong className="text-[var(--text)]">Discover from Google</strong> trên trang Actions.
              Google Custom Search Engine (CSE) cho phép tìm kiếm lập trình — tối đa 100 query/ngày miễn phí.
            </p>
            <p>
              Cách lấy: tạo project trên <InlineCode>console.cloud.google.com</InlineCode>, bật Custom Search API, tạo API key.
              Sau đó vào <InlineCode>programmablesearchengine.google.com</InlineCode> tạo search engine, lấy CX (Search Engine ID).
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'google_cse_api_key', envKey: 'GOOGLE_CSE_API_KEY', type: 'string (secret)', default: '(trống)', desc: 'API key Google Cloud' },
            { key: 'google_cse_cx', envKey: 'GOOGLE_CSE_CX', type: 'string', default: '(trống)', desc: 'Search Engine ID (dạng: xxx:yyy)' },
          ]} />
          <Callout type="tip">
            Nếu chỉ dùng Google Scraper (Playwright) thay vì CSE API, bạn không cần điền hai trường này.
            Google Scraper hoạt động độc lập — nhưng tốc độ chậm hơn và có rủi ro CAPTCHA.
          </Callout>

          <H3 id="gemini-key">Gemini API Key (Google Generative AI)</H3>
          <Prose>
            <p>
              Cho phép dùng các model Gemini miễn phí của Google thay thế hoặc bổ sung cho Ollama.
              Không cần cài thêm phần mềm — hệ thống gọi trực tiếp REST API của Google.
            </p>
            <p>
              Cách lấy key: truy cập <InlineCode>aistudio.google.com/app/apikey</InlineCode>, đăng nhập tài khoản Google, tạo API key miễn phí.
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'gemini_api_key', envKey: 'GEMINI_API_KEY', type: 'string (secret)', default: '(trống)', desc: 'API key Google Generative AI — cache 60 giây, hiệu lực ngay không cần restart' },
          ]} />
          <div className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Model Gemini miễn phí</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] font-semibold">Model ID</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] font-semibold">Đặc điểm</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'gemini-2.5-flash',     note: 'Mới nhất, mạnh nhất — khuyến nghị cho dữ liệu phức tạp' },
                  { id: 'gemini-2.0-flash',      note: 'Nhanh, chính xác tốt — lựa chọn cân bằng' },
                  { id: 'gemini-1.5-flash',      note: 'Ổn định, đã kiểm chứng — phù hợp hầu hết trường hợp' },
                  { id: 'gemini-1.5-flash-8b',   note: 'Nhẹ nhất — phù hợp domain thưa dữ liệu, tốc độ cao' },
                ].map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
                    <td className="px-4 py-2.5 font-mono text-[var(--accent)]">{m.id}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)]">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="warning">
            Gemini chỉ dùng cho <strong>xử lý đơn lẻ 1 domain</strong> qua nút Re-crawl (chọn model Gemini trong modal).
            Bulk LLM Improve sẽ báo lỗi nếu bạn truyền model Gemini với nhiều hơn 1 domain — để tránh vượt rate limit miễn phí.
          </Callout>

          {/* ── LLM Models ───────────────────────────────────────────────── */}
          <H2 icon={Bot} id="llm-models">LLM Models & Tiers</H2>
          <Prose>
            <p>
              Hệ thống hỗ trợ hai provider LLM: <strong className="text-[var(--text)]">Ollama</strong> (local, miễn phí, cần cài) và <strong className="text-[var(--text)]">Gemini</strong> (Google cloud, miễn phí, không cần cài).
              Khi model được chọn là <InlineCode>gemini-*</InlineCode>, hệ thống gọi Google REST API thay vì Ollama — API key đọc từ <InlineCode>gemini_api_key</InlineCode> (cache 60 giây).
            </p>
            <p>
              Với Ollama, AffiliateCrawl phân tầng theo chất lượng dữ liệu:
              domain dữ liệu thưa → dùng model mạnh hơn (LOW tier), domain dữ liệu khá đầy đủ → dùng model nhẹ hơn (MID tier).
            </p>
          </Prose>

          <H3>Enable LLM Extraction</H3>
          <Prose>
            <p>
              Toggle bật/tắt toàn bộ bước LLM. Khi <InlineCode>false</InlineCode>, mọi domain đều bỏ qua bước AI — hệ thống chỉ dùng regex.
              Nên tắt khi Ollama chưa chạy hoặc muốn crawl nhanh mà không cần LLM.
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'enable_llm_extract', envKey: 'ENABLE_LLM_EXTRACT', type: 'boolean', default: 'true', desc: 'true = bật LLM | false = chỉ dùng regex' },
          ]} />

          <H3>Ollama URL</H3>
          <Prose>
            <p>
              URL gốc của Ollama instance. Nếu Ollama chạy trên cùng máy với backend, giá trị mặc định <InlineCode>http://localhost:11434</InlineCode> là đúng.
              Nếu chạy Docker hoặc máy khác, điều chỉnh IP tương ứng.
            </p>
          </Prose>
          <EnvBlock>{`# Mặc định
OLLAMA_URL=http://localhost:11434

# Docker (nếu backend trong container cùng network)
OLLAMA_URL=http://ollama:11434

# Máy khác trong LAN
OLLAMA_URL=http://192.168.1.100:11434`}</EnvBlock>

          <H3>Model LOW & Model MID</H3>
          <Prose>
            <p>
              Hai mô hình được chọn tự động theo ngưỡng score/confidence. Xem phần tiếp theo để hiểu logic phân tầng.
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'ollama_model_low', envKey: 'OLLAMA_MODEL_LOW', type: 'string', default: 'deepseek-coder', desc: 'Model dùng cho dữ liệu thưa (score/conf thấp) — nặng hơn, chính xác hơn' },
            { key: 'ollama_model_mid', envKey: 'OLLAMA_MODEL_MID', type: 'string', default: 'mistral', desc: 'Model dùng cho dữ liệu bán đầy đủ — nhẹ hơn, nhanh hơn' },
          ]} />
          <Callout type="tip">
            Để xem danh sách model đang có trong Ollama, vào trang <strong>Actions / Crawl</strong> → phần AI Keyword Suggester.
            Ngoài ra chạy <InlineCode>ollama list</InlineCode> trong terminal để kiểm tra.
          </Callout>

          {/* ── Tier logic ───────────────────────────────────────────────── */}
          <H2 icon={Sliders} id="tier-logic">Logic phân tầng tự động</H2>
          <Prose>
            <p>
              Mỗi lần crawl hoàn tất, nếu điều kiện retry thỏa mãn, hệ thống chạy LLM. Trước khi gọi Ollama,
              nó chọn mô hình nào dựa trên điểm và độ tin cậy hiện tại của domain.
            </p>
          </Prose>

          <TierFlowDiagram />

          <H3>Bảng ngưỡng phân tầng</H3>
          <ParamTable rows={[
            { key: 'llm_tier_score_low', envKey: 'LLM_TIER_SCORE_LOW', type: 'integer (0–100)', default: '40', desc: 'Ngưỡng điểm LOW: score ≤ giá trị này → dùng Model LOW' },
            { key: 'llm_tier_score_mid', envKey: 'LLM_TIER_SCORE_MID', type: 'integer (0–100)', default: '60', desc: 'Ngưỡng điểm MID: score ≤ giá trị này (và > LOW) → dùng Model MID' },
            { key: 'llm_tier_conf_low', envKey: 'LLM_TIER_CONF_LOW', type: 'float (0–1)', default: '0.4', desc: 'Ngưỡng confidence LOW: conf ≤ giá trị này → dùng Model LOW' },
            { key: 'llm_tier_conf_mid', envKey: 'LLM_TIER_CONF_MID', type: 'float (0–1)', default: '0.6', desc: 'Ngưỡng confidence MID: conf ≤ giá trị này (và > LOW) → dùng Model MID' },
          ]} />

          <H3>Ví dụ thực tế</H3>
          <Prose>
            <p>Với cấu hình mặc định (score_low=40, score_mid=60, conf_low=0.4, conf_mid=0.6):</p>
          </Prose>
          <div className="my-4 space-y-2">
            {[
              { score: 20, conf: 0.2, result: 'Model LOW (deepseek-coder)', color: 'bg-purple-900/20 border-purple-700/30 text-purple-300' },
              { score: 35, conf: 0.5, result: 'Model LOW (deepseek-coder)', color: 'bg-purple-900/20 border-purple-700/30 text-purple-300', note: 'score ≤ 40, dù conf > 0.4' },
              { score: 50, conf: 0.5, result: 'Model MID (mistral)', color: 'bg-blue-900/20   border-blue-700/30   text-blue-300' },
              { score: 75, conf: 0.8, result: 'Bỏ qua LLM', color: 'bg-slate-800      border-slate-600/40  text-slate-400' },
            ].map((ex, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono">
                <div className="w-32 shrink-0 text-[var(--text-muted)]">
                  score=<span className="text-amber-300">{ex.score}</span> conf=<span className="text-amber-300">{ex.conf}</span>
                </div>
                <ArrowRight size={11} className="text-[var(--text-muted)] shrink-0" />
                <span className={`px-2.5 py-1 rounded-lg border ${ex.color}`}>{ex.result}</span>
                {ex.note && <span className="text-[var(--text-muted)] text-[11px] font-sans">{ex.note}</span>}
              </div>
            ))}
          </div>
          <Callout type="info">
            Điều kiện phân tầng dùng <strong>OR</strong> giữa score và confidence — chỉ cần một trong hai thỏa mãn ngưỡng LOW thì dùng Model LOW.
            Cụ thể: <InlineCode>score ≤ score_low OR conf ≤ conf_low</InlineCode> → LOW.
          </Callout>

          {/* ── Crawl retry ──────────────────────────────────────────────── */}
          <H2 icon={RefreshCw} id="crawl-retry">Ngưỡng Crawl lại</H2>
          <Prose>
            <p>
              Sau mỗi lần crawl, hệ thống kiểm tra xem domain có đủ điều kiện để được đưa vào hàng đợi LLM improve không.
              Ba thông số dưới đây kiểm soát điều kiện đó.
            </p>
          </Prose>

          <RetryFlowDiagram />

          <ParamTable rows={[
            { key: 'affiliate_retry_score_max', envKey: 'AFFILIATE_RETRY_SCORE_MAX', type: 'integer (0–100)', default: '40', desc: 'Domain có score ≤ giá trị này mới đủ điều kiện retry' },
            { key: 'affiliate_retry_conf_max', envKey: 'AFFILIATE_RETRY_CONF_MAX', type: 'float (0–1)', default: '0.4', desc: 'Domain có confidence ≤ giá trị này mới đủ điều kiện retry' },
            { key: 'affiliate_max_crawl_retries', envKey: 'AFFILIATE_MAX_CRAWL_RETRIES', type: 'integer', default: '3', desc: 'Giới hạn số lần retry tổng cộng. Vượt qua → domain bị đánh dấu FLAG' },
            { key: 'subpage_penalty_threshold', envKey: 'SUBPAGE_PENALTY_THRESHOLD', type: 'integer (0–100)', default: '50', desc: 'Nếu điểm trung bình sub-page thấp hơn giá trị này thì điểm parent domain sẽ bị giảm (công thức: score×0.65 + avgSub×0.35)' },
          ]} />

          <H3>Cân bằng giữa chất lượng và hiệu năng</H3>
          <Prose>
            <p>
              Tăng <InlineCode>affiliate_retry_score_max</InlineCode> lên 60 → nhiều domain hơn sẽ được LLM xử lý → dữ liệu chất lượng hơn nhưng mất nhiều thời gian hơn.
              Tăng <InlineCode>affiliate_max_crawl_retries</InlineCode> lên 5 → hệ thống cố gắng nhiều hơn trước khi từ bỏ, nhưng tốn nhiều tài nguyên hơn.
            </p>
          </Prose>
          <Callout type="warning">
            Không nên đặt <InlineCode>affiliate_max_crawl_retries</InlineCode> quá cao ({'>'}5). Một số domain không bao giờ có dữ liệu hoa hồng công khai — retry vô tận chỉ lãng phí tài nguyên.
          </Callout>

          {/* ── Smart crawl data protection ──────────────────────────────── */}
          <H2 icon={ShieldCheck} id="smart-crawl">Cơ chế bảo vệ dữ liệu tự động</H2>
          <Prose>
            <p>
              Hệ thống có bốn cơ chế tự động giúp bảo vệ chất lượng dữ liệu affiliate, ngăn chặn việc lưu dữ liệu sai hoặc lỗi thời.
              Các cơ chế này hoạt động trong quá trình crawl, không cần cấu hình thêm.
            </p>
          </Prose>

          <H3>1. Blog redirect protection (REDIRECT_BLOG) — đã tăng cường</H3>
          <Prose>
            <p>
              Khi crawl một path affiliate (ví dụ <InlineCode>/referral-program</InlineCode>), một số website redirect sang trang blog
              hoặc bài viết không liên quan (ví dụ <InlineCode>/blog/referral-programs-101/...</InlineCode>).
              Hệ thống phát hiện redirect same-domain sang URL dạng blog và từ chối lấy HTML — trả về lỗi <InlineCode>REDIRECT_BLOG</InlineCode>.
            </p>
            <p>
              <strong className="text-[var(--text)]">BLOG_URL_PATTERN mở rộng</strong> — bổ sung các pattern còn thiếu:
              <InlineCode>make-money</InlineCode>, <InlineCode>passive-income</InlineCode>, <InlineCode>money-calculator</InlineCode>,
              <InlineCode>payment-gateway</InlineCode>, <InlineCode>online-payment</InlineCode>,
              <InlineCode>affiliate-programs</InlineCode> (số nhiều = trang liệt kê), <InlineCode>referral-programs</InlineCode>,
              <InlineCode>partner-programs</InlineCode>, <InlineCode>ranking</InlineCode>, <InlineCode>salary</InlineCode>,
              <InlineCode>alternative</InlineCode>, <InlineCode>versus</InlineCode>, <InlineCode>earn-money</InlineCode>.
              Áp dụng ở cả hai tầng fetch: Axios và Playwright, và tại mọi điểm lọc URL candidate.
            </p>
            <p>
              <strong className="text-[var(--text)]">isBlogContent() đã sửa (quan trọng)</strong> — trước đây exception quá rộng:
              bất kỳ trang nào chứa từ &quot;affiliate/commission/earn&quot; đều bypass kiểm tra blog, khiến
              mọi bài viết về affiliate marketing lọt qua. Nay bypass chỉ khi trang có tín hiệu
              <em>chương trình cụ thể</em> (không phải bài viết về affiliate):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-muted)]">
              <li>Link đến affiliate network (ShareASale, Impact, Partnerstack…) — trang signup redirect</li>
              <li>CTA ngôi thứ nhất: <InlineCode>&quot;join our affiliate program&quot;</InlineCode>, <InlineCode>&quot;we pay X% commission&quot;</InlineCode> — công ty đang nói chuyện với publisher</li>
              <li>Dữ liệu cấu trúc: <InlineCode>&quot;commission rate: 20%&quot;</InlineCode> — định dạng bảng thông tin chương trình</li>
            </ul>
            <p>
              Blog dùng ngôi thứ ba (&quot;Cloudways pays 7%&quot;, &quot;join CompanyX&apos;s program&quot;) → không khớp → vẫn bị chặn.
              <InlineCode>&lt;input type=&quot;email&quot;&gt;</InlineCode> không còn là điều kiện bypass vì các trang editorial cũng có form newsletter email.
            </p>
            <p>
              <strong className="text-[var(--text)]">Editorial article guard (mới)</strong> —
              <InlineCode>extractFromHtml()</InlineCode> kiểm tra CMS markup: <InlineCode>itemprop=&quot;author&quot;</InlineCode>,
              <InlineCode>itemprop=&quot;datePublished&quot;</InlineCode>, class <InlineCode>byline/post-date/entry-date</InlineCode>,
              thẻ <InlineCode>&lt;time datetime&gt;</InlineCode>. Nếu phát hiện author+date markup mà không có network link / signup form /
              confidence &gt; 0 → trang bị bỏ qua. Bắt các blog editorial lọt qua URL filter.
            </p>
          </Prose>
          <Callout type="info">
            Cross-domain redirect (ví dụ <InlineCode>example.com</InlineCode> → <InlineCode>other.com</InlineCode>) bị chặn riêng bằng mã lỗi <InlineCode>REDIRECT_DOMAIN</InlineCode>.
          </Callout>
          <H3>1b. Soft-404 detection (mới)</H3>
          <Prose>
            <p>
              Một số trang trả HTTP 200 nhưng hiển thị nội dung &quot;trang không tồn tại&quot; — ví dụ khi domain đổi cấu trúc URL.
              <InlineCode>NOT_FOUND_TITLE_RE</InlineCode> mở rộng thêm: <InlineCode>Gone</InlineCode>, <InlineCode>Access Denied</InlineCode>,
              <InlineCode>Forbidden</InlineCode>, <InlineCode>Content Removed</InlineCode>, <InlineCode>No Longer Available</InlineCode>.
              <InlineCode>SOFT_404_BODY_RE</InlineCode> mới kiểm tra 2&nbsp;000 ký tự đầu plain-text: nếu phát hiện cụm như
              &quot;this page does not exist&quot;, &quot;we couldn&apos;t find the page&quot;, &quot;this URL is no longer valid&quot; →
              bỏ qua trang dù HTTP 200.
            </p>
          </Prose>

          <H3>2. All-paths 404 → tự động xóa domain</H3>
          <Prose>
            <p>
              Sau mỗi lần crawl, hệ thống kiểm tra xem tất cả path affiliate tiêu chuẩn (<InlineCode>AFFILIATE_PATHS</InlineCode>:
              <InlineCode>/affiliates</InlineCode>, <InlineCode>/partner-program</InlineCode>, <InlineCode>/referral-program</InlineCode>,
              v.v.) có đều trả về HTTP 404 hay không.
            </p>
            <p>
              Nếu toàn bộ path trả về 404 (không phải bị block hoặc lỗi mạng — phải là HTTP 404 thuần):
              record của domain đó và toàn bộ sub-pages sẽ bị <strong className="text-[var(--text)]">xóa khỏi database</strong>.
              Điều này ngăn dữ liệu lỗi thời từ các domain đã gỡ chương trình affiliate tồn tại trong hệ thống.
            </p>
          </Prose>
          <EnvBlock>{`# Ví dụ log khi xóa:
[crawl-affiliate] hosting.com → all affiliate paths 404, record deleted`}</EnvBlock>
          <Callout type="warning">
            Cơ chế này chỉ xóa khi <strong>tất cả</strong> path đều 404. Nếu chỉ một số path 404 và một số path hoạt động bình thường,
            hệ thống vẫn giữ nguyên record và tiếp tục crawl các path còn lại.
          </Callout>

          <H3>3. Sub-page score penalty (SUBPAGE_PENALTY_THRESHOLD)</H3>
          <Prose>
            <p>
              Khi điểm trung bình của các sub-page thấp hơn ngưỡng <InlineCode>subpage_penalty_threshold</InlineCode>,
              điểm tổng của parent domain bị giảm theo công thức:
            </p>
          </Prose>
          <EnvBlock>{`parentScore_final = parentScore × 0.65 + avgSubPageScore × 0.35

Ví dụ: parentScore=74, avgSubScore=13, threshold=50
→ 74 × 0.65 + 13 × 0.35 = 48.1 + 4.55 ≈ 52`}</EnvBlock>
          <Prose>
            <p>
              Điều này phản ánh thực tế: nếu tất cả các trang con đều có điểm thấp (ví dụ vì 404, hoặc không có dữ liệu),
              điểm tổng cao của parent (thường từ LLM extract) sẽ bị điều chỉnh xuống cho phù hợp.
            </p>
          </Prose>
          <ParamTable rows={[
            { key: 'subpage_penalty_threshold', envKey: 'SUBPAGE_PENALTY_THRESHOLD', type: 'integer (0–100)', default: '50', desc: 'Ngưỡng điểm sub-page. Nếu avgSubScore < ngưỡng này → penalty được áp dụng' },
          ]} />

          <H3>4. Bảng so sánh nhiều cột (comparison table)</H3>
          <Prose>
            <p>
              Nhiều trang affiliate hiển thị dữ liệu dưới dạng bảng so sánh nhiều cột,
              ví dụ: <em>"Feature | Cloudways | Other Hosting | SaaS Programs"</em>.
              Hệ thống tự động nhận diện và luôn lấy <strong className="text-[var(--text)]">cột thứ hai</strong> (dữ liệu của chính site đó),
              bỏ qua các cột của đối thủ.
            </p>
          </Prose>
          <div className="my-4 rounded-xl border border-[var(--border)] overflow-hidden text-xs font-mono">
            <div className="px-4 py-2 bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--text-muted)] font-sans font-semibold text-[11px] uppercase tracking-wider">
              Ví dụ bảng so sánh Cloudways
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="text-left px-4 py-2 text-[var(--text-muted)]">Feature</th>
                  <th className="text-left px-4 py-2 text-emerald-300">Cloudways ✓ được lấy</th>
                  <th className="text-left px-4 py-2 text-slate-500 line-through">Other Hosting</th>
                  <th className="text-left px-4 py-2 text-slate-500 line-through">SaaS Programs</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Flexible Commissions', val: 'Up to $350 or 12% recurring', c2: 'Up to $150–$200', c3: 'Undisclosed' },
                  { feature: 'Cookie Period',         val: '90 Days',                    c2: '60 Days',        c3: '60 Days' },
                  { feature: 'Payouts Cycle',         val: '30 Days',                    c2: '30 Days',        c3: '60 Days' },
                ].map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{r.feature}</td>
                    <td className="px-4 py-2 text-emerald-300 font-medium">{r.val}</td>
                    <td className="px-4 py-2 text-slate-500">{r.c2}</td>
                    <td className="px-4 py-2 text-slate-500">{r.c3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Google scraper ───────────────────────────────────────────── */}
          <H2 icon={Globe} id="google-scraper">Google Scraper (Anti-CAPTCHA)</H2>
          <Prose>
            <p>
              Khi dùng <strong className="text-[var(--text)]">Discover from Google</strong> bằng Playwright scraper (thay vì CSE API),
              hệ thống điều hướng Google Search như người dùng thực.
              Để tránh bị CAPTCHA, cần điều chỉnh timing phù hợp với điều kiện mạng.
            </p>
          </Prose>

          <ScraperTimingDiagram />

          <H3>Bảng thông số timing</H3>
          <ParamTable rows={[
            { key: 'google_scrape_page_delay_ms', envKey: 'GOOGLE_SCRAPE_PAGE_DELAY_MS', type: 'ms', default: '8000', desc: 'Chờ giữa page 1 → page 2 → ... trong cùng một keyword' },
            { key: 'google_scrape_query_delay_min_ms', envKey: 'GOOGLE_SCRAPE_QUERY_DELAY_MIN_MS', type: 'ms', default: '15000', desc: 'Chờ tối thiểu khi chuyển từ keyword này sang keyword khác' },
            { key: 'google_scrape_query_delay_max_ms', envKey: 'GOOGLE_SCRAPE_QUERY_DELAY_MAX_MS', type: 'ms', default: '35000', desc: 'Chờ tối đa (random trong khoảng min–max)' },
            { key: 'google_scrape_captcha_respawn', envKey: 'GOOGLE_SCRAPE_CAPTCHA_RESPAWN', type: 'integer', default: '2', desc: 'Sau N CAPTCHA liên tiếp → tắt trình duyệt, mở lại với session mới' },
            { key: 'google_scrape_max_respawns', envKey: 'GOOGLE_SCRAPE_MAX_RESPAWNS', type: 'integer', default: '3', desc: 'Tổng số respawn tối đa. Vượt qua → dừng hẳn phiên scraping' },
            { key: 'google_scrape_proxy_quarantine_ms', envKey: 'GOOGLE_SCRAPE_PROXY_QUARANTINE_MS', type: 'ms', default: '1800000', desc: 'Cách ly proxy bị Google phát hiện (mặc định: 30 phút)' },
          ]} />

          <H3>Chiến lược khuyến nghị</H3>
          <div className="my-4 rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Tình huống</th>
                  <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Page Delay</th>
                  <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Query Delay</th>
                  <th className="text-left px-4 py-2.5 text-[var(--text-muted)] font-semibold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { case: 'Ít từ khóa (<5), không vội', page: '8000', query: '15–35s', note: 'Mặc định — an toàn cho hầu hết trường hợp' },
                  { case: 'Nhiều từ khóa, mạng tốt', page: '5000', query: '10–20s', note: 'Tăng tốc nhẹ — vẫn đủ an toàn' },
                  { case: 'Hay gặp CAPTCHA', page: '12000', query: '30–60s', note: 'Tăng delay lên, đồng thời tăng quarantine' },
                  { case: 'IP bị block thường xuyên', page: '15000', query: '45–90s', note: 'Dùng proxy xoay vòng, tăng quarantine lên 1h+' },
                ].map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]'}>
                    <td className="px-4 py-2.5 text-[var(--text)]">{r.case}</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">{r.page}ms</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">{r.query}</td>
                    <td className="px-4 py-2.5 text-[var(--text-muted)]">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Table defaults ───────────────────────────────────────────── */}
          <H2 icon={Table2} id="table-defaults">Mặc định bảng dữ liệu</H2>
          <Prose>
            <p>
              Mỗi bảng dữ liệu trong hệ thống (Affiliate Programs, LLM Audit, Proxy) có thể tùy chỉnh:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-[var(--text)]">Số dòng mặc định</strong> — số dòng được chọn sẵn khi mở trang lần đầu</li>
              <li><strong className="text-[var(--text)]">Danh sách tùy chọn</strong> — các con số hiện trong dropdown "Per page"</li>
            </ul>
          </Prose>
          <ParamTable rows={[
            { key: 'table_affiliate_page_size', envKey: '(chỉ DB)', type: 'integer', default: '50', desc: 'Số dòng mặc định của bảng Affiliate Programs' },
            { key: 'table_affiliate_page_sizes', envKey: '(chỉ DB)', type: 'string', default: '20,50,100,200', desc: 'Danh sách tùy chọn, cách nhau bằng dấu phẩy' },
            { key: 'table_llm_audit_page_size', envKey: '(chỉ DB)', type: 'integer', default: '50', desc: 'Số dòng mặc định của bảng LLM Audit' },
            { key: 'table_llm_audit_page_sizes', envKey: '(chỉ DB)', type: 'string', default: '20,50,100', desc: 'Danh sách tùy chọn LLM Audit' },
            { key: 'table_proxy_page_size', envKey: '(chỉ DB)', type: 'integer', default: '50', desc: 'Số dòng mặc định của bảng Proxy' },
            { key: 'table_proxy_page_sizes', envKey: '(chỉ DB)', type: 'string', default: '20,50,100', desc: 'Danh sách tùy chọn Proxy' },
          ]} />
          <Callout type="info">
            Các thông số bảng chỉ lưu trong DB, không có ENV tương ứng — giá trị mặc định được hardcode trong <InlineCode>config.service.js</InlineCode>.
            Nhấn vào con số để chọn làm mặc định; chỉnh chuỗi bên dưới để thêm/bớt tùy chọn.
          </Callout>

          {/* ── ENV reference ────────────────────────────────────────────── */}
          <H2 icon={CodeIcon} id="env-reference">Bảng đầy đủ biến ENV ↔ khóa DB</H2>
          <Prose>
            <p>
              Khi cần khôi phục cấu hình từ DB về ENV (hoặc ngược lại), dùng bảng tham chiếu dưới đây.
              Hệ thống đọc DB trước; nếu key không có trong DB thì dùng giá trị ENV.
            </p>
          </Prose>
          <EnvBlock>{`# ── Anthropic ──────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# ── Gemini (Google) ─────────────────────────
GEMINI_API_KEY=AIzaSy...
# Models: gemini-2.5-flash | gemini-2.0-flash | gemini-1.5-flash | gemini-1.5-flash-8b

# ── Google CSE ──────────────────────────────
GOOGLE_CSE_API_KEY=AIzaSy...
GOOGLE_CSE_CX=

# ── Ollama ──────────────────────────────────
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL_LOW=deepseek-coder
OLLAMA_MODEL_MID=mistral
ENABLE_LLM_EXTRACT=true

# ── LLM Retry thresholds ────────────────────
AFFILIATE_RETRY_SCORE_MAX=40
AFFILIATE_RETRY_CONF_MAX=0.4
AFFILIATE_MAX_CRAWL_RETRIES=3

# ── Scoring & data quality ──────────────────
# Sub-page penalty: nếu avgSubScore < ngưỡng → giảm điểm parent
# Công thức: parent×0.65 + avgSub×0.35
SUBPAGE_PENALTY_THRESHOLD=50

# ── LLM Tier thresholds ─────────────────────
LLM_TIER_SCORE_LOW=40
LLM_TIER_SCORE_MID=60
LLM_TIER_CONF_LOW=0.4
LLM_TIER_CONF_MID=0.6

# ── Google Scraper ──────────────────────────
GOOGLE_SCRAPE_PAGE_DELAY_MS=8000
GOOGLE_SCRAPE_QUERY_DELAY_MIN_MS=15000
GOOGLE_SCRAPE_QUERY_DELAY_MAX_MS=35000
GOOGLE_SCRAPE_CAPTCHA_RESPAWN=2
GOOGLE_SCRAPE_MAX_RESPAWNS=3
GOOGLE_SCRAPE_PROXY_QUARANTINE_MS=1800000`}</EnvBlock>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <H2 icon={BookOpen} id="faq">Câu hỏi thường gặp</H2>

          {[
            {
              q: 'Tôi lưu rồi nhưng crawler vẫn dùng giá trị cũ?',
              a: 'Cấu hình chỉ được đọc khi tiến trình backend khởi động hoặc khi service gọi app-config.getAll(). Nếu crawl-affiliate đang chạy và cache config trong bộ nhớ, bạn cần dừng rồi khởi động lại PM2: `pm2 restart crawler`.',
            },
            {
              q: 'Có thể đặt Model LOW và Model MID là cùng một model không?',
              a: 'Hoàn toàn được. Ví dụ đặt cả hai là `mistral` nếu chỉ có một model trong Ollama. Hệ thống vẫn chạy bình thường — chỉ là luôn dùng cùng một model bất kể tier.',
            },
            {
              q: 'CAPTCHA Respawn và Max Respawns khác nhau thế nào?',
              a: 'CAPTCHA Respawn (mặc định: 2) là số CAPTCHA liên tiếp trước khi restart trình duyệt một lần. Max Respawns (mặc định: 3) là tổng số lần được phép restart trong toàn bộ phiên. Ví dụ: Respawn=2, MaxRespawns=3 → tối đa 6 CAPTCHA (2×3) trước khi dừng.',
            },
            {
              q: 'Proxy Quarantine là gì?',
              a: 'Khi một proxy bị Google phát hiện (nhận CAPTCHA quá nhiều), nó được đưa vào "quarantine" trong N millisecond. Trong thời gian đó, proxy này không được dùng cho Google scraping. Mặc định 1.800.000ms = 30 phút.',
            },
            {
              q: 'Tôi muốn reset về giá trị ENV ban đầu cho một trường?',
              a: 'Gọi DELETE /api/config/:key. Hệ thống xóa key đó khỏi bảng app_configs, và lần đọc tiếp theo sẽ fallback về giá trị ENV. Hiện chưa có nút Reset trực tiếp trong UI — có thể thêm sau.',
            },
            {
              q: 'Table Defaults có ảnh hưởng đến dữ liệu không?',
              a: 'Không. Table Defaults chỉ ảnh hưởng đến giao diện — số dòng hiện và tùy chọn trong dropdown. Dữ liệu trong DB không bị ảnh hưởng.',
            },
            {
              q: 'Domain bị xóa tự động do "all paths 404" — tôi có thể khôi phục không?',
              a: 'Hiện tại chưa có chức năng undo tự động. Để crawl lại domain đó, vào trang Actions → Crawl Domain → nhập domain. Nếu website đã có trang affiliate trở lại, hệ thống sẽ tạo record mới. Nếu vẫn 404, domain sẽ không được lưu.',
            },
            {
              q: 'Sub-page score penalty hoạt động thế nào khi không có sub-page nào?',
              a: 'Penalty chỉ áp dụng khi có ít nhất 2 sub-page được crawl (scoredSubPages.length >= 2). Nếu domain không có sub-page hoặc chỉ có 1 sub-page, điểm parent giữ nguyên không bị ảnh hưởng.',
            },
            {
              q: 'Gemini trả lỗi 400 — nguyên nhân là gì?',
              a: 'HTTP 400 từ Gemini thường do endpoint API sai phiên bản. Hệ thống hiện dùng v1beta (hỗ trợ systemInstruction cho tất cả model). Nếu vẫn lỗi 400, kiểm tra log để xem thông điệp lỗi cụ thể từ Google API — thường là content safety filter hoặc API key không hợp lệ.',
            },
            {
              q: 'Bảng so sánh nhiều cột có thể gây nhầm lẫn dữ liệu không?',
              a: 'Không — hệ thống luôn lấy cột thứ hai (index 1), là cột dữ liệu của chính website. Các cột đối thủ (index 2, 3...) bị bỏ qua. Điều kiện để lấy là header cột đầu (feature name) phải khớp với keyword affiliate như commission, cookie, payment, v.v.',
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
          <div className="mt-16 pt-6 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">AffiliateCrawl — Tài liệu cấu hình nội bộ</p>
            <Link
              href="/config"
              className="inline-flex items-center gap-2 text-xs text-[var(--accent)] hover:underline"
            >
              <Settings size={12} /> Mở trang Config
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
