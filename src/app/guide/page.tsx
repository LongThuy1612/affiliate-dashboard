'use client';

import Link from 'next/link';
import {
  Search, Filter, BarChart2, ExternalLink, Star,
  MessageSquare, Send, Eye, ChevronRight,
  Percent, Clock, Globe, HelpCircle, RefreshCw,
  TrendingUp, CheckCircle2, Info, Layers, Activity,
  ShieldCheck, Link2, Camera, Code2, Network, Database,
  Hash, Users, Cpu, BadgeCheck, Sparkles,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-5 scroll-mt-6">
      {children}
    </section>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
      <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[var(--accent)]" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, color, title, desc }: {
  icon: React.ElementType; color: string; title: string; desc: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={15} className={color} />
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ColBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
      {label}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-10">

        {/* Hero */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
              <HelpCircle size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">Hướng dẫn sử dụng</h1>
              <p className="text-xs text-[var(--text-muted)]">Dành cho người dùng mới · AffiliateCrawl Dashboard</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Tài liệu này giúp bạn nhanh chóng làm quen với các tính năng chính:
            tra cứu chương trình affiliate, xem chi tiết từng domain, và gửi phản hồi.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a href="#affiliate" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors">
              <BarChart2 size={11} /> Affiliate Programs
            </a>
            <a href="#domain-detail" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-indigo-400 hover:border-indigo-400/50 transition-colors">
              <Globe size={11} /> Chi tiết Domain
            </a>
            <a href="#feedback" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors">
              <MessageSquare size={11} /> Feedback
            </a>
          </div>
        </div>

        {/* ── Affiliate Programs ──────────────────────────────────────────── */}
        <Section id="affiliate">
          <SectionTitle
            icon={BarChart2}
            title="Trang Affiliate Programs"
            subtitle="Tra cứu và khám phá các chương trình tiếp thị liên kết đã được crawl"
          />

          {/* Tổng quan */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <Info size={14} className="text-[var(--accent)]" /> Tổng quan
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trang <Link href="/affiliate" className="text-[var(--accent)] hover:underline font-medium">/affiliate</Link> hiển
              thị danh sách tất cả chương trình affiliate đã được hệ thống crawl và phân tích tự động.
              Mỗi bản ghi bao gồm thông tin hoa hồng, mạng lưới affiliate, điểm chất lượng và nhiều dữ liệu khác.
            </p>
          </div>

          {/* Các tính năng */}
          <div className="grid sm:grid-cols-2 gap-3">
            <FeatureCard
              icon={Search} color="text-blue-400"
              title="Tìm kiếm domain"
              desc="Nhập tên domain vào ô tìm kiếm để lọc nhanh. Ví dụ: gõ 'shopify' để tìm tất cả chương trình liên quan đến Shopify."
            />
            <FeatureCard
              icon={Filter} color="text-indigo-400"
              title="Lọc nâng cao"
              desc="Lọc theo điểm số (score), loại hoa hồng (recurring/one-time), mạng affiliate, có cookie hay không."
            />
            <FeatureCard
              icon={TrendingUp} color="text-green-400"
              title="Sắp xếp"
              desc="Nhấn vào tiêu đề cột để sắp xếp tăng/giảm dần. Mặc định sắp xếp theo điểm chất lượng giảm dần."
            />
            <FeatureCard
              icon={Eye} color="text-amber-400"
              title="Xem chi tiết"
              desc="Nhấn vào tên domain để mở trang chi tiết — xem toàn bộ dữ liệu, lịch sử crawl và thông tin hoa hồng."
            />
          </div>

          {/* Gợi ý bộ lọc */}
          <div className="rounded-xl border border-green-700/40 bg-green-900/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <p className="text-sm font-semibold text-green-300">Gợi ý bộ lọc cho người mới</p>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Để nhanh chóng tìm được các chương trình affiliate <strong className="text-[var(--text)]">chất lượng và đáng đăng ký</strong>,
              hãy áp dụng 2 bộ lọc sau ngay khi vào trang:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border border-green-700/30 bg-green-900/20 px-4 py-3">
                <Percent size={14} className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-300">Commission Rate = Has Commission</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    Chỉ hiển thị chương trình mà hệ thống đã xác nhận được tỷ lệ hoa hồng cụ thể.
                    Bỏ qua những domain chưa có dữ liệu hoa hồng — thường là trang chưa công bố thông tin hoặc crawl chưa đủ sâu.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-blue-700/30 bg-blue-900/20 px-4 py-3">
                <TrendingUp size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-300">Score &gt; 40</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    Score phản ánh mức độ đầy đủ và độ tin cậy của dữ liệu (0–100). Chọn &gt; 40 để loại bỏ
                    các bản ghi thiếu thông tin. Score &gt; 60 cho kết quả chính xác hơn nhưng ít chương trình hơn.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-green-400/80 flex items-center gap-1.5">
              <CheckCircle2 size={11} />
              Kết hợp 2 bộ lọc này giúp danh sách thu gọn đáng kể nhưng giữ lại những chương trình có giá trị nhất.
            </p>
          </div>

          {/* Giải thích cột */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text)]">Ý nghĩa các cột trong bảng</p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                {
                  badge: <ColBadge label="Score" color="bg-blue-900/30 border-blue-700/40 text-blue-300" />,
                  desc: 'Điểm chất lượng dữ liệu từ 0–100. Điểm cao (≥ 60) nghĩa là hệ thống tìm thấy đầy đủ thông tin hoa hồng, signup URL và cookie.',
                },
                {
                  badge: <ColBadge label="Commission" color="bg-green-900/30 border-green-700/40 text-green-300" />,
                  desc: 'Tỷ lệ hoặc giá trị hoa hồng. Ví dụ: 20%, $50/sale. Giá trị này được extract tự động từ trang web của chương trình.',
                },
                {
                  badge: <ColBadge label="Type" color="bg-purple-900/30 border-purple-700/40 text-purple-300" />,
                  desc: 'Loại hoa hồng: Recurring (hàng tháng, tái tục) hoặc One-time (một lần). Recurring thường có giá trị dài hạn cao hơn.',
                },
                {
                  badge: <ColBadge label="Cookie" color="bg-amber-900/30 border-amber-700/40 text-amber-300" />,
                  desc: 'Thời hạn cookie tính bằng ngày. Cookie càng dài, window chuyển đổi càng rộng. Ví dụ: 90 days = khách ghé thăm trong 90 ngày đều tính hoa hồng cho bạn.',
                },
                {
                  badge: <ColBadge label="Network" color="bg-slate-800 border-slate-600/40 text-slate-300" />,
                  desc: 'Mạng lưới affiliate đang quản lý chương trình (Impact, ShareASale, CJ, PartnerStack…). Nếu trống, chương trình tự quản lý (in-house).',
                },
                {
                  badge: <ColBadge label="Updated" color="bg-slate-800 border-slate-600/40 text-slate-400" />,
                  desc: 'Thời điểm hệ thống crawl và cập nhật dữ liệu gần nhất.',
                },
              ].map(({ badge, desc }, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-3">
                  <div className="pt-0.5 shrink-0">{badge}</div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bước xem chi tiết */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <p className="text-sm font-semibold text-[var(--text)]">Cách xem chi tiết một chương trình</p>
            <div className="space-y-4">
              <Step n={1} title="Tìm chương trình" desc="Dùng ô tìm kiếm hoặc bộ lọc để thu hẹp danh sách. Ví dụ lọc Score ≥ 60 để xem chỉ chương trình chất lượng cao." />
              <Step n={2} title="Nhấn vào domain" desc="Click tên domain (ví dụ: shopify.com) để mở trang chi tiết. Trang này hiển thị toàn bộ thông tin bao gồm signup URL, mô tả, lịch sử crawl." />
              <Step n={3} title="Mở trang đăng ký" desc='Nhấn nút "Signup URL" hoặc biểu tượng link bên cạnh domain để truy cập trang đăng ký affiliate trực tiếp.' />
            </div>
          </div>

          {/* Trang chi tiết domain (/affiliate/[domain]) */}
          <div id="domain-detail" className="rounded-2xl border border-indigo-700/30 bg-indigo-900/10 p-5 space-y-4 scroll-mt-6">
            <div className="flex items-center gap-3 pb-2 border-b border-indigo-700/30">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Globe size={18} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Trang Chi tiết Domain</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Đường dẫn: <code className="text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded text-[11px]">/affiliate/[domain]</code> — Hiển thị toàn bộ dữ liệu của một chương trình affiliate
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Khi nhấn vào tên domain trong bảng danh sách, bạn sẽ được chuyển đến trang chi tiết. Trang này chia thành nhiều
              section, mỗi section hiển thị một khía cạnh khác nhau của chương trình affiliate.
            </p>

            {/* Header & Badges */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <BadgeCheck size={14} className="text-emerald-400" /> Header & Status Badges
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Phía trên cùng hiển thị <strong className="text-[var(--text)]">tên domain</strong>, tên chương trình, và các nút hành động:
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                <div className="flex items-start gap-2 text-xs">
                  <ExternalLink size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                  <span className="text-[var(--text-muted)]"><strong className="text-[var(--text)]">Signup URL</strong> — Mở trang đăng ký affiliate trên tab mới</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <BadgeCheck size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-[var(--text-muted)]"><strong className="text-[var(--text)]">Verified / Unverified</strong> — URL đã được kiểm tra hay chưa</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles size={12} className="text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-[var(--text-muted)]"><strong className="text-[var(--text)]">LLM Enriched</strong> — Dữ liệu đã được bổ sung bằng AI</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Clock size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[var(--text-muted)]"><strong className="text-[var(--text)]">Recurring / One-time</strong> — Loại hoa hồng</span>
                </div>
              </div>
            </div>

            {/* Score & Confidence */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-400" /> Score & Confidence Gauges
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Hai thanh gauge hiển thị <strong className="text-[var(--text)]">Score (0–100)</strong> và
                <strong className="text-[var(--text)]"> Confidence (%)</strong>.
                Score đánh giá mức độ đầy đủ dữ liệu; Confidence phản ánh độ tin cậy.
                Bên dưới Score có bảng <strong className="text-[var(--text)]">Score Breakdown</strong> chi tiết từng yếu tố
                (Commission Rate, Network, Signup URL, Cookie Window…) cùng điểm tương ứng.
              </p>
            </div>

            {/* Main Sections Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard
                icon={BarChart2} color="text-green-400"
                title="Commission & Payout"
                desc="Hiển thị commission rate, loại hoa hồng (recurring/one-time), cookie duration, payment terms, và recurring duration. Mỗi field có tag nguồn dữ liệu: 🌐 Web, ✨ LLM, hoặc 🔗 PartnerStack."
              />
              <FeatureCard
                icon={Globe} color="text-blue-400"
                title="URLs"
                desc="Tổng hợp Signup URL (kèm trạng thái verified), Login Page URL, Network URL, và danh sách tất cả Signup URLs nếu có nhiều hơn 1."
              />
              <FeatureCard
                icon={ShieldCheck} color="text-emerald-400"
                title="Data Quality"
                desc="Nguồn dữ liệu (web_crawl/LLM/PartnerStack), affiliate network, fingerprint tier, trạng thái LLM enriched, URL verified, score, confidence, và số lần crawl."
              />
              <FeatureCard
                icon={Clock} color="text-indigo-400"
                title="Timeline"
                desc="Thời điểm crawl đầu tiên, lần cập nhật gần nhất, và lần verify cuối (nếu URL đã verified)."
              />
              <FeatureCard
                icon={Layers} color="text-purple-400"
                title="Sub Programs"
                desc="Các sub-page affiliate được phát hiện trong quá trình crawl, sắp xếp theo score. Mỗi sub-page có thể mở rộng xem chi tiết: program name, commission, cookie, signup URL và screenshot."
              />
              <FeatureCard
                icon={TrendingUp} color="text-amber-400"
                title="Rate History"
                desc="Lịch sử thay đổi commission rate qua các lần crawl. Hiển thị rate mới nhất, đánh dấu 'changed' khi có thay đổi, và nhận xét về mức độ ổn định."
              />
              <FeatureCard
                icon={Camera} color="text-rose-400"
                title="Screenshot"
                desc="Ảnh chụp trang affiliate được ghi lại lúc crawl. Nhấn 'Load' để xem. Giúp kiểm tra nhanh giao diện trang mà không cần truy cập trực tiếp."
              />
              <FeatureCard
                icon={Users} color="text-cyan-400"
                title="User Verifications"
                desc="Danh sách phản hồi từ người dùng: xác nhận đúng (✓), sai (✗), chưa chắc (~), hoặc chưa biết (?). Kèm ghi chú và ngày verify."
              />
            </div>

            {/* Developer / Debug Tools */}
            <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <Cpu size={14} /> Công cụ Debug (dành cho admin)
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Phần cuối trang chi tiết cung cấp các công cụ kỹ thuật để kiểm tra và debug dữ liệu crawl:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <Activity size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Fetch Tier Logs</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Nhật ký chi tiết từng lần fetch: tier nào thành công (T1 Axios / T2 Playwright / T3 FlareSolverr),
                      thời gian phản hồi, mã lỗi nếu có.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <Code2 size={14} className="text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Raw HTML (Tier-1 Axios)</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Fetch trực tiếp HTML qua Axios. Xem plain text (input gửi LLM) hoặc raw HTML gốc.
                      Có thể thay đổi path (vd: /affiliates, /partners) để test từng trang.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <Network size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">DOM + Network (Playwright)</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Render trang bằng Playwright, bắt toàn bộ network requests (XHR, fetch, scripts), meta tags,
                      DOM HTML, footer và nav HTML. Hữu ích khi LLM extraction bị thiếu dữ liệu.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <Database size={14} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--text)]">Raw Data & Full JSON</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Xem dữ liệu thô (rawAffiliateData) và toàn bộ JSON record trong database. Dùng để debug khi kết quả hiển thị không khớp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data source tags explanation */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tag nguồn dữ liệu</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Mỗi field trong phần Commission có tag cho biết dữ liệu đến từ đâu:
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">🌐 Web</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Crawl trực tiếp từ website</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">✨ LLM</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Bổ sung / trích xuất bằng AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">🔗 PS</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Từ PartnerStack API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Icon giải thích */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Icon thường gặp</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Star,        color: 'text-amber-400',  label: 'Điểm cao',      desc: 'Score ≥ 60 — dữ liệu đầy đủ, đáng tin cậy' },
                { icon: Percent,     color: 'text-green-400',  label: 'Có hoa hồng',   desc: 'Commission rate đã được xác nhận' },
                { icon: Clock,       color: 'text-indigo-400', label: 'Recurring',      desc: 'Hoa hồng tái tục hàng tháng' },
                { icon: Globe,       color: 'text-blue-400',   label: 'Domain',         desc: 'Nhấn để mở website thực tế' },
                { icon: ExternalLink, color: 'text-[var(--accent)]', label: 'Signup', desc: 'Nhấn để mở trang đăng ký affiliate' },
                { icon: RefreshCw,   color: 'text-[var(--text-muted)]', label: 'Reload', desc: 'Tải lại dữ liệu mới nhất' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={14} className={color} />
                  <div>
                    <span className="text-xs font-medium text-[var(--text)]">{label}</span>
                    <span className="text-[11px] text-[var(--text-muted)] ml-1.5">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/affiliate" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Vào trang Affiliate Programs <ChevronRight size={14} />
            </Link>
          </div>
        </Section>

        {/* ── Feedback ───────────────────────────────────────────────────── */}
        <Section id="feedback">
          <SectionTitle
            icon={MessageSquare}
            title="Trang Feedback"
            subtitle="Gửi góp ý, báo lỗi hoặc đề xuất tính năng mới"
          />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <Info size={14} className="text-[var(--accent)]" /> Mục đích
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Trang <Link href="/feedback" className="text-[var(--accent)] hover:underline font-medium">/feedback</Link> cho
              phép bạn gửi phản hồi trực tiếp đến nhóm quản trị. Mọi góp ý đều được ghi nhận và xem xét.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <FeatureCard icon={CheckCircle2} color="text-green-400" title="Góp ý cải thiện" desc="Đề xuất tính năng mới, cải thiện giao diện hoặc cách hiển thị dữ liệu." />
            <FeatureCard icon={HelpCircle}   color="text-amber-400" title="Báo lỗi"          desc="Phát hiện dữ liệu sai, link hỏng hoặc lỗi kỹ thuật? Gửi mô tả chi tiết để nhóm xử lý nhanh." />
            <FeatureCard icon={Star}         color="text-indigo-400" title="Yêu cầu domain"  desc="Muốn thêm một chương trình affiliate cụ thể vào hệ thống? Ghi rõ tên và URL." />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <p className="text-sm font-semibold text-[var(--text)]">Cách gửi feedback</p>
            <div className="space-y-4">
              <Step n={1} title='Vào trang Feedback' desc='Nhấn "Feedback" trong menu bên trái hoặc truy cập trực tiếp /feedback.' />
              <Step n={2} title='Điền nội dung' desc='Ghi rõ vấn đề, chức năng liên quan và (nếu có) bước tái hiện lỗi. Thông tin càng chi tiết, nhóm xử lý càng nhanh.' />
              <Step n={3} title='Gửi' desc='Nhấn nút Gửi. Feedback của bạn sẽ xuất hiện trong hàng đợi của nhóm quản trị và được phản hồi sớm.' />
            </div>
          </div>

          <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 px-4 py-3 flex items-start gap-3">
            <CheckCircle2 size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300 leading-relaxed">
              <strong>Lưu ý:</strong> Feedback không phải kênh hỗ trợ khẩn cấp. Với các vấn đề ảnh hưởng đến hoạt động,
              hãy liên hệ trực tiếp với quản trị viên qua kênh nội bộ.
            </p>
          </div>

          <div className="flex justify-end">
            <Link href="/feedback" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Vào trang Feedback <Send size={13} />
            </Link>
          </div>
        </Section>

      </div>
    </div>
  );
}
