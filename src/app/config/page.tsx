'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { configApi, affiliateApi, AppConfig } from '@/lib/api';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toaster';
import Link from 'next/link';
import {
  Key, Bot, Sliders, RefreshCw, Save, Eye, EyeOff,
  Table2, ChevronRight, Settings, BookOpen, CheckCircle2,
  AlertCircle, Info, Lock, Search, Bell,
} from 'lucide-react';

// ─── Status badge ──────────────────────────────────────────────────────────────

type BadgeVariant = 'active' | 'inactive' | 'configured' | 'unconfigured' | 'info';

function StatusBadge({ variant, label }: { variant: BadgeVariant; label: string }) {
  const styles: Record<BadgeVariant, string> = {
    active:       'bg-emerald-900/30 border-emerald-700/40 text-emerald-300',
    inactive:     'bg-slate-800 border-slate-600/40 text-slate-400',
    configured:   'bg-blue-900/30 border-blue-700/40 text-blue-300',
    unconfigured: 'bg-amber-900/30 border-amber-700/40 text-amber-300',
    info:         'bg-indigo-900/30 border-indigo-700/40 text-indigo-300',
  };
  const icons: Record<BadgeVariant, React.ReactNode> = {
    active:       <CheckCircle2 size={10} />,
    inactive:     <Lock size={10} />,
    configured:   <CheckCircle2 size={10} />,
    unconfigured: <AlertCircle size={10} />,
    info:         <Info size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${styles[variant]}`}>
      {icons[variant]}
      {label}
    </span>
  );
}

// ─── Feature gate banner ───────────────────────────────────────────────────────

function FeatureBanner({
  icon: Icon,
  message,
  linkLabel,
  linkHref,
  variant = 'warning',
}: {
  icon?: React.ElementType;
  message: string;
  linkLabel?: string;
  linkHref?: string;
  variant?: 'warning' | 'info';
}) {
  const styles = {
    warning: 'bg-amber-950/20 border-amber-700/30 text-amber-300',
    info:    'bg-indigo-950/20 border-indigo-700/30 text-indigo-300',
  };
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs ${styles[variant]}`}>
      {Icon && <Icon size={13} className="shrink-0" />}
      <span className="flex-1 leading-relaxed">{message}</span>
      {linkLabel && linkHref && (
        <a href={linkHref} className="underline shrink-0 hover:opacity-80">{linkLabel}</a>
      )}
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  desc,
  badge,
  children,
  dimmed,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

// ─── Secret input ──────────────────────────────────────────────────────────────

function SecretInput({
  label, hint, value, onChange, placeholder,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const t = useTranslations('config');
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 pr-20 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
          {show ? t('hideKey') : t('showKey')}
        </button>
      </div>
      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  label, hint, checked, onChange,
}: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
        {hint && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 ${
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ─── Tier diagram ──────────────────────────────────────────────────────────────

function TierDiagram({ scoreLow, scoreMid, confLow, confMid }: {
  scoreLow: string; scoreMid: string; confLow: string; confMid: string;
}) {
  const t = useTranslations('config');
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 mt-2">
      <p className="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">{t('tierDiagram.title')}</p>
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-[var(--text-muted)]">score ≤ {scoreLow} & conf ≤ {confLow}</span>
        <ChevronRight size={12} className="text-[var(--text-muted)]" />
        <span className="px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40 font-medium">{t('tierDiagram.low')}</span>
        <span className="text-[var(--text-muted)] ml-2">score ≤ {scoreMid} & conf ≤ {confMid}</span>
        <ChevronRight size={12} className="text-[var(--text-muted)]" />
        <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-700/40 font-medium">{t('tierDiagram.mid')}</span>
        <span className="text-[var(--text-muted)] ml-2">otherwise</span>
        <ChevronRight size={12} className="text-[var(--text-muted)]" />
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-600/40 font-medium">{t('tierDiagram.skip')}</span>
      </div>
    </div>
  );
}

// ─── Table config block ────────────────────────────────────────────────────────

function TableConfigBlock({
  title, sizeKey, sizesKey, cfg, onChange,
}: {
  title: string; sizeKey: keyof AppConfig; sizesKey: keyof AppConfig;
  cfg: Partial<AppConfig>; onChange: (key: keyof AppConfig, value: string) => void;
}) {
  const t = useTranslations('config');
  const sizes = (cfg[sizesKey] ?? '20,50,100,200').split(',').map((s) => s.trim()).filter(Boolean);
  const currentDefault = cfg[sizeKey] ?? '50';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--text)]">{title}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-[var(--text-muted)]">{t('table.defaultPageSize')}:</span>
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(sizeKey, s)}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              currentDefault === s
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
            }`}
          >{s}</button>
        ))}
      </div>
      <Input
        label={t('table.availablePageSizes')}
        hint={t('table.availablePageSizesHint')}
        value={cfg[sizesKey] ?? ''}
        onChange={(e) => onChange(sizesKey, e.target.value)}
      />
    </div>
  );
}

// ─── Sub-section label ─────────────────────────────────────────────────────────

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] pb-1 border-b border-[var(--border)]">
      {children}
    </p>
  );
}

// ─── Model select (Ollama + Gemini) ───────────────────────────────────────────

const GEMINI_QUICK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

function ModelSelect({
  label, hint, value, onChange, models, placeholder,
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void;
  models: string[];
  placeholder?: string;
}) {
  const isGemini = value.startsWith('gemini-');

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">{label}</label>

      {/* Input: dropdown khi Ollama online, text khi offline */}
      {models.length > 0 ? (
        <select
          value={isGemini ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="">— chọn Ollama model —</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'e.g. mistral hoặc gemini-2.5-flash'}
          className={`w-full bg-[var(--surface-2)] border rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono ${
            isGemini ? 'border-blue-600/50 ring-1 ring-blue-600/30' : 'border-[var(--border)]'
          }`}
        />
      )}

      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
      {models.length === 0 && (
        <p className="text-[11px] text-amber-400">Ollama server chưa phản hồi — nhập tên model thủ công.</p>
      )}

      {/* Gemini quick-pick */}
      <div className="pt-1">
        <p className="text-[10px] text-[var(--text-muted)] mb-1.5">Hoặc chọn Gemini model (không cần Ollama):</p>
        <div className="flex flex-wrap gap-1.5">
          {GEMINI_QUICK_MODELS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                value === m
                  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-blue-500/40 hover:text-blue-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY: Partial<AppConfig> = {};

export default function ConfigPage() {
  const t = useTranslations('config');
  const { toast } = useToast();
  const { refetchConfig } = useConfig();
  const { user } = useAuth();
  const isSuperAdmin = (user?.permissions ?? []).includes('all:manage');
  const [cfg, setCfg] = useState<Partial<AppConfig>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  useEffect(() => {
    configApi.getAll()
      .then((data) => setCfg(data))
      .catch(() => toast('Failed to load config', { type: 'error' }))
      .finally(() => setLoading(false));
    affiliateApi.ollamaModels().then(setOllamaModels).catch(() => {});
  }, [toast]);

  const set = useCallback((key: keyof AppConfig, value: string) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.setMany(cfg as AppConfig);
      await refetchConfig();
      toast(t('saveSuccess'), { type: 'success' });
    } catch {
      toast(t('saveFailed'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Derived feature states ─────────────────────────────────────────────────
  const llmEnabled       = (cfg.enable_llm_extract ?? 'true') === 'true';
  const geminiConfigured = !!(cfg.gemini_api_key?.trim());
  const anthropicConfigured = !!(cfg.anthropic_api_key?.trim());
  const cseConfigured    = !!(cfg.google_cse_api_key?.trim() && cfg.google_cse_cx?.trim());

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
              <Settings size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">{t('title')}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSuperAdmin && (
              <Link
                href="/config/announcements"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors"
              >
                <Bell size={12} /> Bảng tin
              </Link>
            )}
            <Link
              href="/config/docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors"
            >
              <BookOpen size={12} /> Hướng dẫn
            </Link>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving
                ? <><RefreshCw size={13} className="animate-spin" />{t('saving')}</>
                : <><Save size={13} />{t('saveAll')}</>}
            </Button>
          </div>
        </div>

        {/* ── API Keys ──────────────────────────────────────────────────────── */}
        <SectionCard
          icon={Key}
          title={t('sections.apiKeys')}
          desc={t('sections.apiKeysDesc')}
          badge={
            <div className="flex gap-1.5 flex-wrap justify-end">
              {anthropicConfigured && <StatusBadge variant="configured" label="Anthropic ✓" />}
              {geminiConfigured    && <StatusBadge variant="configured" label="Gemini ✓" />}
              {cseConfigured       && <StatusBadge variant="configured" label="CSE ✓" />}
            </div>
          }
        >
          {/* Anthropic */}
          <SubLabel>Anthropic (Claude)</SubLabel>
          <FieldRow>
            <SecretInput
              label={t('fields.anthropicApiKey')}
              value={cfg.anthropic_api_key ?? ''}
              onChange={(v) => set('anthropic_api_key', v)}
            />
            <Input
              label={t('fields.anthropicModel')}
              hint={t('fields.anthropicModelHint')}
              value={cfg.anthropic_model ?? ''}
              onChange={(e) => set('anthropic_model', e.target.value)}
            />
          </FieldRow>
          {!anthropicConfigured && (
            <FeatureBanner variant="info" icon={Info}
              message="Anthropic API key chưa được cấu hình. Hệ thống sẽ dùng Ollama hoặc Gemini thay thế." />
          )}

          {/* Gemini */}
          <SubLabel>Gemini — Google AI (free)</SubLabel>
          <FieldRow>
            <SecretInput
              label={t('fields.geminiApiKey')}
              hint={t('fields.geminiApiKeyHint')}
              value={cfg.gemini_api_key ?? ''}
              onChange={(v) => set('gemini_api_key', v)}
            />
            <div className="flex flex-col justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <p className="font-medium text-xs text-[var(--text-muted)]">Model hỗ trợ:</p>
              {['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'].map((m) => (
                <code key={m} className="bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--accent)] text-[10px] w-fit">
                  {m}
                </code>
              ))}
            </div>
          </FieldRow>
          {!geminiConfigured ? (
            <FeatureBanner variant="info" icon={Info}
              message="Gemini API key chưa được cấu hình. Lấy key miễn phí tại aistudio.google.com/app/apikey" />
          ) : (
            <FeatureBanner variant="info" icon={Info}
              message="Key có hiệu lực trong 60 giây sau khi lưu. Chỉ dùng cho xử lý 1 domain (Re-crawl modal) — không hỗ trợ bulk improve." />
          )}

          {/* Google CSE */}
          <SubLabel>Google Custom Search (CSE)</SubLabel>
          <FieldRow>
            <SecretInput
              label={t('fields.googleCseApiKey')}
              value={cfg.google_cse_api_key ?? ''}
              onChange={(v) => set('google_cse_api_key', v)}
            />
            <Input
              label={t('fields.googleCseCx')}
              hint={t('fields.googleCseCxHint')}
              value={cfg.google_cse_cx ?? ''}
              onChange={(e) => set('google_cse_cx', e.target.value)}
            />
          </FieldRow>
          {!cseConfigured && (
            <FeatureBanner variant="info" icon={Info}
              message='Google CSE chưa đầy đủ — "Discover from Google" sẽ dùng Playwright scraper thay thế (chậm hơn, có CAPTCHA risk).' />
          )}
        </SectionCard>

        {/* ── LLM Models ────────────────────────────────────────────────────── */}
        <SectionCard
          icon={Bot}
          title={t('sections.llmModels')}
          desc={t('sections.llmModelsDesc')}
          badge={<StatusBadge variant={llmEnabled ? 'active' : 'inactive'} label={llmEnabled ? 'Enabled' : 'Disabled'} />}
        >
          <ToggleSwitch
            label={t('fields.enableLlmExtract')}
            hint={t('fields.enableLlmExtractHint')}
            checked={llmEnabled}
            onChange={(v) => set('enable_llm_extract', v ? 'true' : 'false')}
          />

          {!llmEnabled && (
            <FeatureBanner variant="warning" icon={AlertCircle}
              message="LLM Extraction đang tắt — các cài đặt Ollama và Gemini bên dưới không có hiệu lực. Bật toggle để kích hoạt." />
          )}

          {/* Ollama sub-section */}
          <div className={llmEnabled ? '' : 'opacity-40 pointer-events-none select-none'}>
            <SubLabel>Ollama (local — cài trên máy chủ)</SubLabel>
            <div className="space-y-4 mt-3">
              <FieldRow>
                <Input
                  label={t('fields.ollamaUrl')}
                  hint={t('fields.ollamaUrlHint')}
                  value={cfg.ollama_url ?? ''}
                  onChange={(e) => set('ollama_url', e.target.value)}
                />
                <div />
              </FieldRow>
              <FieldRow>
                <ModelSelect
                  label={t('fields.ollamaModelLow')}
                  hint={t('fields.ollamaModelLowHint')}
                  value={cfg.ollama_model_low ?? ''}
                  onChange={(v) => set('ollama_model_low', v)}
                  models={ollamaModels}
                />
                <ModelSelect
                  label={t('fields.ollamaModelMid')}
                  hint={t('fields.ollamaModelMidHint')}
                  value={cfg.ollama_model_mid ?? ''}
                  onChange={(v) => set('ollama_model_mid', v)}
                  models={ollamaModels}
                />
              </FieldRow>
              <FieldRow>
                <ModelSelect
                  label="Model HIGH"
                  hint="Dùng khi score ≥ MID threshold — model nhẹ để cleanup dữ liệu đã đủ."
                  value={cfg.ollama_model_high ?? ''}
                  onChange={(v) => set('ollama_model_high', v)}
                  models={ollamaModels}
                  placeholder="e.g. mistral hoặc gemini-1.5-flash"
                />
                <div />
              </FieldRow>
            </div>
          </div>

          {/* Gemini info (only relevant when LLM enabled) */}
          {llmEnabled && (
            <div>
              <SubLabel>Gemini (cloud — qua API key ở phần API Keys)</SubLabel>
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--text-muted)] leading-relaxed space-y-1">
                {geminiConfigured ? (
                  <span className="text-emerald-300 font-medium block">✓ Gemini API key đã được cấu hình.</span>
                ) : (
                  <span className="text-amber-300 font-medium block">⚠ Gemini API key chưa cấu hình — điền ở phần API Keys bên trên.</span>
                )}
                <span className="block">
                  Chọn model <code className="font-mono bg-[var(--surface)] px-1 rounded text-blue-300">gemini-*</code> ở các ô Model LOW / MID bên trên để pipeline tự động dùng Gemini thay Ollama — áp dụng cho cả crawl đơn lẫn bulk.
                </span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── LLM Thresholds ────────────────────────────────────────────────── */}
        <SectionCard
          icon={Sliders}
          title={t('sections.llmThresholds')}
          desc={t('sections.llmThresholdsDesc')}
          badge={<StatusBadge variant={llmEnabled ? 'active' : 'inactive'} label={llmEnabled ? 'Active' : 'LLM off'} />}
          dimmed={!llmEnabled}
        >
          {!llmEnabled && (
            <FeatureBanner variant="warning" icon={AlertCircle}
              message="Ngưỡng này chỉ có tác dụng khi LLM Extraction được bật." />
          )}
          <div className={llmEnabled ? '' : 'pointer-events-none select-none'}>
            <FieldRow>
              <Input
                label={t('fields.llmTierScoreLow')}
                hint={t('fields.llmTierScoreLowHint')}
                type="number"
                value={cfg.llm_tier_score_low ?? ''}
                onChange={(e) => set('llm_tier_score_low', e.target.value)}
              />
              <Input
                label={t('fields.llmTierScoreMid')}
                hint={t('fields.llmTierScoreMidHint')}
                type="number"
                value={cfg.llm_tier_score_mid ?? ''}
                onChange={(e) => set('llm_tier_score_mid', e.target.value)}
              />
            </FieldRow>
            <FieldRow>
              <Input
                label={t('fields.llmTierConfLow')}
                hint={t('fields.llmTierConfLowHint')}
                type="number"
                value={cfg.llm_tier_conf_low ?? ''}
                onChange={(e) => set('llm_tier_conf_low', e.target.value)}
              />
              <Input
                label={t('fields.llmTierConfMid')}
                hint={t('fields.llmTierConfMidHint')}
                type="number"
                value={cfg.llm_tier_conf_mid ?? ''}
                onChange={(e) => set('llm_tier_conf_mid', e.target.value)}
              />
            </FieldRow>
            <TierDiagram
              scoreLow={cfg.llm_tier_score_low ?? '40'}
              scoreMid={cfg.llm_tier_score_mid ?? '60'}
              confLow={cfg.llm_tier_conf_low ?? '0.4'}
              confMid={cfg.llm_tier_conf_mid ?? '0.6'}
            />
          </div>
        </SectionCard>

        {/* ── Crawl Retry ───────────────────────────────────────────────────── */}
        <SectionCard
          icon={RefreshCw}
          title={t('sections.crawlRetry')}
          desc={t('sections.crawlRetryDesc')}
          badge={<StatusBadge variant="active" label="Always active" />}
        >
          <FieldRow>
            <Input
              label={t('fields.affiliateRetryScoreMax')}
              hint={t('fields.affiliateRetryScoreMaxHint')}
              type="number"
              value={cfg.affiliate_retry_score_max ?? ''}
              onChange={(e) => set('affiliate_retry_score_max', e.target.value)}
            />
            <Input
              label={t('fields.affiliateRetryConfMax')}
              hint={t('fields.affiliateRetryConfMaxHint')}
              type="number"
              value={cfg.affiliate_retry_conf_max ?? ''}
              onChange={(e) => set('affiliate_retry_conf_max', e.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <Input
              label={t('fields.affiliateMaxCrawlRetries')}
              hint={t('fields.affiliateMaxCrawlRetriesHint')}
              type="number"
              value={cfg.affiliate_max_crawl_retries ?? ''}
              onChange={(e) => set('affiliate_max_crawl_retries', e.target.value)}
            />
            <Input
              label={t('fields.subpagePenaltyThreshold')}
              hint={t('fields.subpagePenaltyThresholdHint')}
              type="number"
              value={cfg.subpage_penalty_threshold ?? ''}
              onChange={(e) => set('subpage_penalty_threshold', e.target.value)}
            />
          </FieldRow>
        </SectionCard>

        {/* ── Google Scraper ────────────────────────────────────────────────── */}
        <SectionCard
          icon={Key}
          title={t('sections.googleScraper')}
          desc={t('sections.googleScraperDesc')}
          badge={<StatusBadge variant={cseConfigured ? 'info' : 'unconfigured'} label={cseConfigured ? 'CSE + Scraper' : 'Scraper only'} />}
        >
          {!cseConfigured && (
            <FeatureBanner variant="info" icon={Info}
              message='Google CSE key chưa cấu hình — Google Scraper (Playwright) vẫn hoạt động nhưng chậm hơn. Cấu hình CSE ở phần API Keys để dùng API nhanh hơn.' />
          )}
          <FieldRow>
            <Input
              label={t('fields.googleScrapePageDelayMs')}
              hint={t('fields.googleScrapePageDelayMsHint')}
              type="number"
              value={cfg.google_scrape_page_delay_ms ?? ''}
              onChange={(e) => set('google_scrape_page_delay_ms', e.target.value)}
            />
            <Input
              label={t('fields.googleScrapeProxyQuarantineMs')}
              hint={t('fields.googleScrapeProxyQuarantineMsHint')}
              type="number"
              value={cfg.google_scrape_proxy_quarantine_ms ?? ''}
              onChange={(e) => set('google_scrape_proxy_quarantine_ms', e.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <Input
              label={t('fields.googleScrapeQueryDelayMinMs')}
              hint={t('fields.googleScrapeQueryDelayMinMsHint')}
              type="number"
              value={cfg.google_scrape_query_delay_min_ms ?? ''}
              onChange={(e) => set('google_scrape_query_delay_min_ms', e.target.value)}
            />
            <Input
              label={t('fields.googleScrapeQueryDelayMaxMs')}
              hint={t('fields.googleScrapeQueryDelayMaxMsHint')}
              type="number"
              value={cfg.google_scrape_query_delay_max_ms ?? ''}
              onChange={(e) => set('google_scrape_query_delay_max_ms', e.target.value)}
            />
          </FieldRow>
          <FieldRow>
            <Input
              label={t('fields.googleScrapeCaptchaRespawn')}
              hint={t('fields.googleScrapeCaptchaRespawnHint')}
              type="number"
              value={cfg.google_scrape_captcha_respawn ?? ''}
              onChange={(e) => set('google_scrape_captcha_respawn', e.target.value)}
            />
            <Input
              label={t('fields.googleScrapeMaxRespawns')}
              hint={t('fields.googleScrapeMaxRespawnsHint')}
              type="number"
              value={cfg.google_scrape_max_respawns ?? ''}
              onChange={(e) => set('google_scrape_max_respawns', e.target.value)}
            />
            <Input
              label={t('fields.googleScrapeMaxPages')}
              hint={t('fields.googleScrapeMaxPagesHint')}
              type="number"
              value={cfg.google_scrape_max_pages ?? ''}
              onChange={(e) => set('google_scrape_max_pages', e.target.value)}
            />
          </FieldRow>
        </SectionCard>

        {/* ── Discover Settings ─────────────────────────────────────────────── */}
        <SectionCard
          icon={Search}
          title="Default Discover Keywords"
          desc="Danh sách keyword mặc định dùng cho Auto Discover from Google. Mỗi dòng một keyword. Bỏ trống = dùng 60+ built-in templates."
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Keywords (mỗi dòng một query)
            </label>
            <textarea
              rows={10}
              value={cfg.auto_discover_keywords ?? ''}
              onChange={(e) => set('auto_discover_keywords', e.target.value)}
              placeholder={'saas affiliate program high recurring commission\nsoftware affiliate program best payout\nemail marketing software affiliate commission\n…'}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono resize-y"
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Khi trống, hệ thống dùng 60+ keyword templates tích hợp sẵn. Khi điền, các keyword này thay thế templates — AI model sẽ bổ sung thêm nếu được chọn.
            </p>
          </div>
        </SectionCard>

        {/* ── Table Defaults ────────────────────────────────────────────────── */}
        <SectionCard icon={Table2} title={t('sections.tableDefaults')} desc={t('sections.tableDefaultsDesc')}>
          <TableConfigBlock
            title={t('table.affiliateTitle')}
            sizeKey="table_affiliate_page_size"
            sizesKey="table_affiliate_page_sizes"
            cfg={cfg} onChange={set}
          />
          <TableConfigBlock
            title={t('table.llmAuditTitle')}
            sizeKey="table_llm_audit_page_size"
            sizesKey="table_llm_audit_page_sizes"
            cfg={cfg} onChange={set}
          />
          <TableConfigBlock
            title={t('table.proxyTitle')}
            sizeKey="table_proxy_page_size"
            sizesKey="table_proxy_page_sizes"
            cfg={cfg} onChange={set}
          />
        </SectionCard>

        {/* Save footer */}
        <div className="flex justify-end pb-6">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><RefreshCw size={14} className="animate-spin" />{t('saving')}</>
              : <><Save size={14} />{t('saveAll')}</>}
          </Button>
        </div>

      </div>
    </div>
  );
}
