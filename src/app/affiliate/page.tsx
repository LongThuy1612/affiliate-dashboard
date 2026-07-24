'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { affiliateApi, crawlAffiliateApi, verificationApi, AffiliateProgram, AffiliateStats, AffiliateListParams, CommissionType, AffiliateVerification, DomainTraffic, EXPORT_COLUMNS, ExportColumnKey, ExportRowCapError } from '@/lib/api';
import { StatCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import { canAny } from '@/lib/permissions';
import { PermissionSubject as S, PermissionAction as A } from '@/constants/permissions';
import { RefreshCw, ExternalLink, Trash2, Search, ChevronUp, ChevronDown, ChevronLeft, CheckSquare, Square, Minus, BadgeCheck, Sparkles, RotateCw, TrendingUp, TrendingDown, BarChart2, RefreshCcw, X, ChevronRight, Download, CalendarRange, Upload, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import ImportModal from '@/components/affiliate/ImportModal';

// ─── Verification components ─────────────────────────────────────────────────

const VERIFY_OPTS = [
  { value: 1, colorClass: 'text-emerald-400', icon: '✓' },
  { value: 2, colorClass: 'text-red-400', icon: '✗' },
  { value: 3, colorClass: 'text-amber-400', icon: '~' },
  { value: 4, colorClass: 'text-[var(--text-muted)]', icon: '?' },
] as const;

function VerifyCell({
  domain,
  verification,
  onClick,
}: {
  domain: string;
  verification: AffiliateVerification | undefined;
  onClick: () => void;
}) {
  const opt = verification ? VERIFY_OPTS.find((o) => o.value === verification.option) : null;
  return (
    <button
      onClick={onClick}
      title={verification?.note ?? (opt ? String(opt.value) : 'No verification')}
      className={clsx(
        'w-7 h-7 rounded-md border text-xs font-bold transition-colors',
        opt
          ? `border-transparent bg-[var(--surface-2)] ${opt.colorClass}`
          : 'border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
      )}
    >
      {opt ? opt.icon : '+'}
    </button>
  );
}

function VerifyModal({
  domain,
  current,
  onSave,
  onClear,
  onClose,
}: {
  domain: string;
  current: AffiliateVerification | undefined;
  onSave: (v: AffiliateVerification) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('affiliate.verify');
  const { toast } = useToast();
  const [option, setOption] = useState<number>(current?.option ?? 0);
  const [note, setNote] = useState(current?.note ?? '');
  const [saving, setSaving] = useState(false);

  const needsNote = option === 2 || option === 3 || option === 4;

  const handleSave = async () => {
    if (!option) return;
    setSaving(true);
    try {
      const result = await verificationApi.submit(domain, option, needsNote ? note : null);
      onSave(result);
      toast(t('submitted'), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', { type: 'error' });
    } finally { setSaving(false); }
  };

  const handleClear = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await verificationApi.delete(domain);
      onClear();
      toast(t('cleared'), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', { type: 'error' });
    } finally { setSaving(false); }
  };

  const OPTION_LABELS: Record<number, string> = {
    1: t('option1'),
    2: t('option2'),
    3: t('option3'),
    4: t('option4'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">{t('title', { domain })}</h2>
          <p className="mt-0.5 font-mono text-xs text-indigo-400 truncate">{domain}</p>
        </div>

        <div className="space-y-1.5">
          {([1, 2, 3, 4] as const).map((val) => (
            <label key={val} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
              <input
                type="radio"
                name="verify-option"
                checked={option === val}
                onChange={() => setOption(val)}
                className="accent-[var(--accent)]"
              />
              <span className={clsx(
                'font-medium',
                VERIFY_OPTS.find((o) => o.value === val)?.colorClass,
              )}>
                {OPTION_LABELS[val]}
              </span>
            </label>
          ))}
        </div>

        {needsNote && (
          <textarea
            className="w-full rounded-md border bg-[var(--surface-2)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] h-24 resize-y"
            placeholder={t('notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!option || saving}
            className="flex-1 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? '…' : t('submit')}
          </button>
          {current && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors disabled:opacity-50"
            >
              {t('clear')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupCell({ signedUp, onClick }: { signedUp: boolean; onClick: () => void }) {
  const t = useTranslations('affiliate.signup');
  return (
    <button
      onClick={onClick}
      title={signedUp ? t('signedUpShort') : t('markShort')}
      className={clsx(
        'w-7 h-7 rounded-md border text-xs font-bold transition-colors',
        signedUp
          ? 'border-transparent bg-[var(--surface-2)] text-emerald-400'
          : 'border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
      )}
    >
      {signedUp ? <BadgeCheck size={14} className="mx-auto" /> : '+'}
    </button>
  );
}

function SignupModal({
  domain,
  signedUpByMe,
  onMarked,
  onUnmarked,
  onClose,
}: {
  domain: string;
  signedUpByMe: boolean;
  onMarked: () => void;
  onUnmarked: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('affiliate.signup');
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleMark = async () => {
    setSaving(true);
    try {
      await affiliateApi.markSignedUp(domain);
      onMarked();
      toast(t('marked'), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setSaving(false); }
  };

  const handleUnmark = async () => {
    setSaving(true);
    try {
      await affiliateApi.unmarkSignedUp(domain);
      onUnmarked();
      toast(t('unmarked'), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">{t('title')}</h2>
          <p className="mt-0.5 font-mono text-xs text-indigo-400 truncate">{domain}</p>
        </div>

        <p className="text-sm text-[var(--text-muted)]">
          {signedUpByMe ? t('youSignedUp') : t('notSignedUpYet')}
        </p>

        <div className="flex gap-2 pt-1">
          {!signedUpByMe && (
            <button
              onClick={handleMark}
              disabled={saving}
              className="flex-1 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? '…' : t('markButton')}
            </button>
          )}
          {signedUpByMe && (
            <button
              onClick={handleUnmark}
              disabled={saving}
              className="flex-1 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors disabled:opacity-50"
            >
              {saving ? '…' : t('unmarkButton')}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportColumnsModal({
  onConfirm,
  onClose,
  exporting,
  selectedDomainCount,
}: {
  onConfirm: (columns: ExportColumnKey[], maxRows: number | undefined) => void;
  onClose: () => void;
  exporting: boolean;
  selectedDomainCount?: number;
}) {
  const t = useTranslations('affiliate.export');
  const [selected, setSelected] = useState<Set<ExportColumnKey>>(
    new Set(EXPORT_COLUMNS.map((c) => c.key)),
  );
  const [maxRows, setMaxRows] = useState('');

  const toggle = (key: ExportColumnKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleConfirm = () => {
    const parsed = maxRows.trim() ? Number(maxRows) : undefined;
    onConfirm(Array.from(selected), parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{t('title')}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {selectedDomainCount ? t('hintSelected', { count: selectedDomainCount }) : t('hint')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {EXPORT_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={selected.has(col.key)}
                onChange={() => toggle(col.key)}
                className="accent-[var(--accent)]"
              />
              <span className="font-medium text-[var(--text)]">{col.label}</span>
            </label>
          ))}
        </div>

        {!selectedDomainCount && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[var(--text-muted)]">{t('maxRows')}</label>
            <input
              type="number"
              min={1}
              placeholder={t('maxRowsPlaceholder')}
              value={maxRows}
              onChange={(e) => setMaxRows(e.target.value)}
              className="w-full sm:w-48 rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--text-muted)] opacity-70">{t('maxRowsHint')}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0 || exporting}
            className="flex-1 py-2.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? '…' : t('confirm')}
          </button>
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Compact date-range filter (presets + click-twice calendar) ──────────────

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInputValue(d);
}

function buildMonthGrid(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ─── Plain sortable header (DataTables-style) ────────────────────────────────
// A stacked-arrow (▲▼) sort indicator that's always visible, not just on
// hover/active — same convention as datatables.net's own sorting column
// headers, where both directions are always shown and the active one is
// highlighted. Click anywhere on the header to cycle asc → desc → unsorted.
// Used for columns that sort but don't also need a filter popup (e.g. Domain,
// once its own search box moved back out to the shared Filters bar).
function SortableHeader({
  label,
  sortKey,
  currentOrderBy,
  currentOrder,
  onSort,
  onClearSort,
}: {
  label: string;
  sortKey: AffiliateListParams['orderBy'];
  currentOrderBy?: AffiliateListParams['orderBy'];
  currentOrder?: 'asc' | 'desc';
  onSort: (order: 'asc' | 'desc') => void;
  onClearSort: () => void;
}) {
  const isSorted = currentOrderBy === sortKey;
  const isAsc = isSorted && currentOrder === 'asc';
  const isDesc = isSorted && currentOrder === 'desc';

  const cycle = () => {
    if (isAsc) onSort('desc');
    else if (isDesc) onClearSort();
    else onSort('asc');
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap hover:text-[var(--text)]',
        isSorted ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
      )}
      title={isAsc ? 'Sorted ascending — click for descending' : isDesc ? 'Sorted descending — click to clear' : 'Click to sort ascending'}
    >
      {label}
      <span className="inline-flex flex-col leading-none">
        <ChevronUp size={13} strokeWidth={2.5} className={isAsc ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-50'} />
        <ChevronDown size={13} strokeWidth={2.5} className={clsx('-mt-1', isDesc ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-50')} />
      </span>
    </button>
  );
}

// ─── Per-column header filter/sort popup ─────────────────────────────────────
// Replaces the old single shared "Filters" box. Each sortable/filterable
// column header now shows TWO clearly separate controls, not one overloaded
// button:
//   1. The label + sort arrows (SortableHeader) — click directly cycles
//      asc → desc → unsorted, no popup involved.
//   2. A distinct filter icon button next to it — opens a small popup with
//      that column's own filter control (passed as `children`: a dropdown or
//      a min/max range). Only rendered when the column actually has a filter.
// Mixing sort and filter into one button/icon made it unclear which click did
// what and made the controls too small to read/hit — this split mirrors how
// datatables.net keeps its sort arrows in the header text and any filter UI
// in a separate row/control.
function ColumnHeaderFilter({
  label,
  sortKey,
  currentOrderBy,
  currentOrder,
  onSort,
  onClearSort,
  active,
  children,
}: {
  label: string;
  /** Omit for columns with a filter but no backend sort support. */
  sortKey?: AffiliateListParams['orderBy'];
  currentOrderBy?: AffiliateListParams['orderBy'];
  currentOrder?: 'asc' | 'desc';
  onSort?: (order: 'asc' | 'desc') => void;
  /** Resets sort back to the default (crawledAt desc) — only rendered while this column is the active sort. */
  onClearSort?: () => void;
  /** True when this column's filter is currently narrowing the result set — shows a dot indicator. */
  active?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      // A <Select> (or DateRangePicker's calendar) inside this popup renders its
      // OWN dropdown/options through a React portal — appended to document.body,
      // outside containerRef's DOM subtree. Without this check, picking an option
      // (e.g. Commission/Type's Select) fires this mousedown handler first (the
      // click lands on the portaled content, not inside containerRef), closing —
      // and unmounting — this popup and its children BEFORE Radix's own
      // click/pointerup handler gets to run onValueChange, so the selection
      // never took effect. Confirmed live: Commission/Type filters appeared to
      // do nothing when picked from inside a column header popup.
      if ((target as Element).closest?.('[data-radix-popper-content-wrapper]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="flex items-center gap-1" ref={containerRef}>
      {sortKey && onSort && onClearSort ? (
        <SortableHeader label={label} sortKey={sortKey} currentOrderBy={currentOrderBy} currentOrder={currentOrder} onSort={onSort} onClearSort={onClearSort} />
      ) : (
        <span className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">{label}</span>
      )}

      {children && (
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            title={`Filter ${label}`}
            className={clsx(
              'inline-flex items-center justify-center rounded-md border p-1 transition-colors',
              active
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
            )}
          >
            <SlidersHorizontal size={13} />
            {active && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />}
          </button>

          {open && (
            <div className="absolute z-50 top-full left-0 mt-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-3">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple numeric min/max range filter, used inside a ColumnHeaderFilter popup. */
function RangeFilter({
  min, max, onChange, placeholder = 'Value',
}: {
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  placeholder?: string;
}) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? '');
  const [localMax, setLocalMax] = useState(max?.toString() ?? '');

  useEffect(() => { setLocalMin(min?.toString() ?? ''); }, [min]);
  useEffect(() => { setLocalMax(max?.toString() ?? ''); }, [max]);

  const commit = () => {
    onChange(
      localMin.trim() === '' ? undefined : Number(localMin),
      localMax.trim() === '' ? undefined : Number(localMax),
    );
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        placeholder={`Min ${placeholder}`}
        value={localMin}
        onChange={(e) => setLocalMin(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <span className="text-[var(--text-muted)] text-xs shrink-0">–</span>
      <input
        type="number"
        placeholder={`Max ${placeholder}`}
        value={localMax}
        onChange={(e) => setLocalMax(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
    </div>
  );
}

const SIGNUP_FILTER_KEY_LIST = ['signedUpByMe', 'notSignedUpByMe', 'anyoneSignedUp', 'noneSignedUp'] as const;
type SignupFilterKey = typeof SIGNUP_FILTER_KEY_LIST[number];

function SignupFilterPicker({
  active,
  onChange,
}: {
  active: Set<SignupFilterKey>;
  onChange: (next: Set<SignupFilterKey>) => void;
}) {
  const t = useTranslations('affiliate.filters');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (key: SignupFilterKey) => {
    const next = new Set(active);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  const LABELS: Record<SignupFilterKey, string> = {
    signedUpByMe: t('signedUp'),
    notSignedUpByMe: t('notSignedUp'),
    anyoneSignedUp: t('anyoneSignedUp'),
    noneSignedUp: t('noneSignedUp'),
  };

  const label = active.size > 0 ? t('signupFilterCount', { count: active.size }) : t('signup');

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-medium text-[var(--text-muted)]">{t('signup')}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-w-[140px]"
      >
        <span className={clsx(active.size === 0 && 'text-[var(--text-muted)]')}>{label}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-3 space-y-1.5">
          {SIGNUP_FILTER_KEY_LIST.map((key) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={active.has(key)}
                onChange={() => toggle(key)}
                className="accent-[var(--accent)]"
              />
              <span className="text-[var(--text)]">{LABELS[key]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (from: string | undefined, to: string | undefined) => void;
}) {
  const t = useTranslations('affiliate.filters');
  const [open, setOpen] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<string | undefined>(from);
  const [pendingTo, setPendingTo] = useState<string | undefined>(to);
  const [viewMonth, setViewMonth] = useState(() => (from ? new Date(from) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const togglePopover = () => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen) { setPendingFrom(from); setPendingTo(to); }
      return willOpen;
    });
  };

  const applyPreset = (fromValue: string | undefined, toValue: string | undefined) => {
    onChange(fromValue, toValue);
    setOpen(false);
  };

  const pickDay = (d: Date) => {
    const value = toDateInputValue(d);
    if (!pendingFrom || (pendingFrom && pendingTo)) {
      // Start a new range
      setPendingFrom(value);
      setPendingTo(undefined);
    } else if (value < pendingFrom) {
      setPendingFrom(value);
      setPendingTo(pendingFrom);
    } else {
      setPendingTo(value);
    }
  };

  const applyCustomRange = () => {
    onChange(pendingFrom, pendingTo);
    setOpen(false);
  };

  const clearRange = () => {
    setPendingFrom(undefined);
    setPendingTo(undefined);
    onChange(undefined, undefined);
    setOpen(false);
  };

  const label = from && to ? `${from} → ${to}` : from ? `${t('dateFrom')} ${from}` : to ? `${t('dateTo')} ${to}` : t('dateRangePlaceholder');

  const cells = buildMonthGrid(viewMonth);
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const inRange = (d: Date) => {
    const v = toDateInputValue(d);
    return !!pendingFrom && !!pendingTo && v >= pendingFrom && v <= pendingTo;
  };
  const isEndpoint = (d: Date) => {
    const v = toDateInputValue(d);
    return v === pendingFrom || v === pendingTo;
  };

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-medium text-[var(--text-muted)]">{t('dateRange')}</label>
      <button
        type="button"
        onClick={togglePopover}
        className="inline-flex items-center gap-2 rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] min-w-[160px]"
      >
        <CalendarRange size={14} className="text-[var(--text-muted)] shrink-0" />
        <span className={clsx(!from && !to && 'text-[var(--text-muted)]')}>{label}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => applyPreset(daysAgo(0), daysAgo(0))} className="px-2.5 py-1 rounded-md text-xs border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/50 transition-colors">
              {t('presetToday')}
            </button>
            <button onClick={() => applyPreset(daysAgo(7), daysAgo(0))} className="px-2.5 py-1 rounded-md text-xs border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/50 transition-colors">
              {t('preset7d')}
            </button>
            <button onClick={() => applyPreset(daysAgo(30), daysAgo(0))} className="px-2.5 py-1 rounded-md text-xs border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/50 transition-colors">
              {t('preset30d')}
            </button>
            {(from || to) && (
              <button onClick={clearRange} className="ml-auto px-2.5 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                {t('clearRange')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-[var(--text)] capitalize">{monthLabel}</span>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]">
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d} className="text-[10px] text-[var(--text-muted)] py-1">{d}</span>
            ))}
            {cells.map((d, i) => (
              <button
                key={i}
                disabled={!d}
                onClick={() => d && pickDay(d)}
                className={clsx(
                  'aspect-square w-full rounded text-xs transition-colors',
                  !d && 'invisible',
                  d && isEndpoint(d) && 'bg-[var(--accent)] text-white font-semibold',
                  d && !isEndpoint(d) && inRange(d) && 'bg-[var(--accent)]/20 text-[var(--text)]',
                  d && !isEndpoint(d) && !inRange(d) && 'text-[var(--text)] hover:bg-[var(--surface-2)]',
                )}
              >
                {d?.getDate()}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={applyCustomRange}
              disabled={!pendingFrom}
              className="flex-1 py-1.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {t('applyRange')}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-xs hover:bg-[var(--surface-2)] transition-colors"
            >
              {t('cancelRange')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function typeVariant(t: CommissionType) {
  if (t === 'recurring') return 'success';
  if (t === 'one_time') return 'accent';
  return 'muted';
}

function scoreRowBorder(score: number) {
  if (score >= 85) return 'border-l-2 border-l-emerald-500';
  if (score >= 70) return 'border-l-2 border-l-green-500';
  if (score >= 50) return 'border-l-2 border-l-amber-500';
  if (score >= 30) return 'border-l-2 border-l-orange-500';
  return 'border-l-2 border-l-red-600';
}

function CookieCell({ days }: { days: number | null }) {
  if (days == null) return <span className="text-[var(--text-muted)]">—</span>;
  const cls =
    days >= 60 ? 'text-emerald-400' :
      days >= 30 ? 'text-green-400' :
        days >= 14 ? 'text-amber-400' : 'text-orange-400';
  return <span className={clsx('font-mono text-xs', cls)}>{days}d</span>;
}

// ─── Google research link (Program Name column) ──────────────────────────────

function googleSearchUrl(domain: string, programName: string | null): string {
  const query = programName ? `${programName} affiliate program` : `${domain} affiliate program`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function GoogleResearchLink({ domain, programName }: { domain: string; programName: string | null }) {
  return (
    <a
      href={googleSearchUrl(domain, programName)}
      target="_blank"
      rel="noopener noreferrer"
      title="Research on Google"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
    >
      <Search size={11} />
    </a>
  );
}

// ─── Traffic cell (SimilarWeb, joined via GET /affiliate) ────────────────────

function formatVisits(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function TrafficCell({ traffic }: { traffic: DomainTraffic | null | undefined }) {
  if (!traffic || traffic.lastFetchStatus !== 'success') {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  const growth = traffic.last1MonthGrowth;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs text-[var(--text)]">{formatVisits(traffic.monthlyVisits)}</span>
        <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
        {growth != null && (
          growth >= 0
            ? <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-300"><TrendingUp size={10} />{growth.toFixed(1)}%</span>
            : <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-300"><TrendingDown size={10} />{growth.toFixed(1)}%</span>
        )}
      </div>
      {traffic.rank != null && (
        <span className="text-[10px] text-[var(--text-muted)]">Rank #{traffic.rank.toLocaleString()}</span>
      )}
    </div>
  );
}

function BounceRateCell({ traffic }: { traffic: DomainTraffic | null | undefined }) {
  if (!traffic || traffic.lastFetchStatus !== 'success' || traffic.bounceRate == null) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  // High bounce = mostly single-page, low-intent traffic — flag it red as a
  // quick visual cue the same way TrafficCell's growth arrow does.
  const color = traffic.bounceRate >= 70 ? 'text-red-300' : traffic.bounceRate <= 40 ? 'text-green-300' : 'text-[var(--text)]';
  return <span className={`font-mono text-xs ${color}`}>{traffic.bounceRate.toFixed(1)}%</span>;
}

function PagesPerVisitCell({ traffic }: { traffic: DomainTraffic | null | undefined }) {
  if (!traffic || traffic.lastFetchStatus !== 'success' || traffic.pagesPerVisit == null) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  return <span className="font-mono text-xs text-[var(--text)]">{traffic.pagesPerVisit.toFixed(1)}</span>;
}

function formatSeconds(sec: number | null): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function TimeOnSiteCell({ traffic }: { traffic: DomainTraffic | null | undefined }) {
  if (!traffic || traffic.lastFetchStatus !== 'success' || traffic.timeOnSite == null) {
    return <span className="text-xs text-[var(--text-muted)]">—</span>;
  }
  return <span className="font-mono text-xs text-[var(--text)]">{formatSeconds(traffic.timeOnSite)}</span>;
}

export default function AffiliatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  const isSuperAdmin = perms.includes('all:manage');
  // Gate for the "Crawl thêm" link into /affiliate/actions — that page's own
  // MENU_ITEMS already filters each individual action by permission, but a
  // plain user with neither affiliate:update nor affiliate:create would land
  // on an empty/near-empty menu there. Checking the same two permissions
  // here (the ones every MENU_ITEMS entry uses) hides the entry point
  // instead of letting a normal user click through to a page with nothing
  // they can actually run.
  const canCrawl = canAny(perms, [[S.AFFILIATE, A.UPDATE], [S.AFFILIATE, A.CREATE]]);
  const t = useTranslations('affiliate');
  const tc = useTranslations('common');
  const tExport = useTranslations('affiliate.export');
  const tImport = useTranslations('affiliate.import');

  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [items, setItems] = useState<AffiliateProgram[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingDomain, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkMarkingSignup, setBulkMarkingSignup] = useState(false);
  const [batchRecrawling, setBatchRecrawling] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recrawlModal, setRecrawlModal] = useState<{ domain: string; mode: 'web' | 'llm'; model: string } | null>(null);
  const [batchRecrawlModal, setBatchRecrawlModal] = useState<{ mode: 'web' | 'llm'; model: string } | null>(null);
  const [recrawling, setRecrawling] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<Map<string, AffiliateVerification>>(new Map());
  const [verifyModal, setVerifyModal] = useState<string | null>(null);
  const [signupModal, setSignupModal] = useState<string | null>(null);
  const [params, setParams] = useState<AffiliateListParams>({ page: 1, limit: 50, orderBy: 'crawledAt', order: 'desc' });
  const [domainSearch, setDomainSearch] = useState('');
  const [commissionFilter, setCommissionFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [signupFilters, setSignupFilters] = useState<Set<SignupFilterKey>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const TYPE_OPTIONS = [
    { value: '', label: t('filters.allTypes') },
    { value: 'one_time', label: t('badge.oneTime') },
    { value: 'recurring', label: t('badge.recurring') },
    { value: 'unknown', label: t('badge.unknown') },
  ];
  const COMMISSION_FILTER_OPTIONS = [
    { value: '', label: t('filters.allCommission') },
    { value: 'has', label: t('filters.hasCommission') },
    { value: 'none', label: t('filters.noCommission') },
  ];
  const SCORE_FILTER_OPTIONS = [
    { value: '', label: t('filters.anyScore') },
    { value: '80', label: '≥ 80 (Excellent)' },
    { value: '60', label: '≥ 60 (Good)' },
    { value: '40', label: '≥ 40 (Fair)' },
    { value: '0-39', label: '< 40 (Poor)' },
  ];
  const ORDER_BY_OPTIONS = [
    { value: 'crawledAt', label: t('filters.crawledAt') },
    { value: 'updatedAt', label: t('filters.updatedAt') },
    { value: 'confidence', label: t('filters.confidence') },
    { value: 'domain', label: t('filters.domain') },
  ];
  const DATE_FIELD_OPTIONS = [
    { value: 'crawledAt', label: t('filters.crawledAt') },
    { value: 'updatedAt', label: t('filters.updatedAt') },
  ];

  // Filtering is now fully server-side — items is already the filtered page slice.
  const filteredItems = items;

  const fetchData = useCallback(async (p: AffiliateListParams) => {
    setLoading(true);
    // Selection is intentionally NOT cleared here — it must survive page/filter/sort
    // changes so a user can tick domains across multiple pages or filter passes before
    // running one bulk action. Each bulk handler (delete/recrawl/mark signed up) clears
    // `selected` itself once its action actually completes.
    try {
      const [res, s] = await Promise.all([
        affiliateApi.list(p),
        stats ? Promise.resolve(stats) : affiliateApi.stats(),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
      if (!stats) setStats(s as AffiliateStats);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed to load', { type: 'error' });
    } finally { setLoading(false); }
  }, [stats, toast]);

  useEffect(() => { fetchData(params); }, []);

  useEffect(() => {
    verificationApi.listByUser()
      .then((list) => setVerifications(new Map(list.map((v) => [v.domain, v]))))
      .catch(() => { });
  }, []);

  const applyParams = (next: AffiliateListParams) => { setParams(next); fetchData(next); };
  const handleDomainSearch = () => applyParams({ ...params, page: 1, domain: domainSearch || undefined });

  const handleDelete = async (domain: string) => {
    if (!confirm(t('deleteConfirm', { domain }))) return;
    setDeleting(domain);
    try {
      await affiliateApi.delete(domain);
      toast(t('deleteSuccess', { domain }), { type: 'success' });
      fetchData(params);
    } catch { toast(t('deleteFailed'), { type: 'error' }); }
    finally { setDeleting(null); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(t('bulkDeleteConfirm', { count: selected.size }))) return;
    setBulkDeleting(true);
    let ok = 0; let fail = 0;
    for (const domain of selected) {
      try { await affiliateApi.delete(domain); ok++; } catch { fail++; }
    }
    setBulkDeleting(false);
    toast(t('bulkDeleteResult', { ok, fail }), { type: ok > 0 ? 'success' : 'error' });
    setSelected(new Set());
    fetchData(params);
  };

  const handleBulkMarkSignedUp = async () => {
    if (!selected.size) return;
    const domains = Array.from(selected);
    setBulkMarkingSignup(true);
    try {
      const res = await affiliateApi.markSignedUpBulk(domains);
      const markedSet = new Set(domains.filter((d) => !res.failed.includes(d)));
      setItems((prev) => prev.map((i) =>
        markedSet.has(i.domain) ? { ...i, signedUpByMe: true, anyoneSignedUp: true } : i));
      toast(
        res.failed.length > 0
          ? `Đã đánh dấu ${res.marked}/${domains.length} domain — ${res.failed.length} lỗi.`
          : `Đã đánh dấu đăng ký cho ${res.marked} domain.`,
        { type: res.marked > 0 ? 'success' : 'error' },
      );
      if (res.marked > 0) setSelected(new Set());
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Failed', { type: 'error' });
    } finally {
      setBulkMarkingSignup(false);
    }
  };

  // 'ladytools' is not a real model name passed to llmImprove — it's a sentinel
  // handled separately in handleRecrawl/handleBatchRecrawl, which call the
  // dedicated ladyToolsImprove endpoint (a real Gemini web chat that can
  // search Google, unlike the API-based Gemini models below).
  const RECRAWL_MODEL_OPTIONS = [
    { value: '', label: 'Auto (tier-based)', group: 'ollama' },
    { value: 'deepseek-coder', label: 'deepseek-coder  —  score < 40 (Low)', group: 'ollama' },
    { value: 'phi4', label: 'phi4  —  score 40–60 (Mid)', group: 'ollama' },
    { value: 'mistral', label: 'mistral  —  score ≥ 60 (High)', group: 'ollama' },
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash  —  Google (Free, Best)', group: 'gemini' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash  —  Google (Free, Fast)', group: 'gemini' },
    { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash  —  Google (Free)', group: 'gemini' },
    { value: 'gemini-1.5-flash-8b', label: 'gemini-1.5-flash-8b  —  Google (Free, Lite)', group: 'gemini' },
    { value: 'ladytools', label: 'Lady Tools  —  Gemini web chat (Highest quality, slowest)', group: 'ladytools' },
  ];

  const handleRecrawl = async () => {
    if (!recrawlModal) return;
    const { domain, mode, model } = recrawlModal;
    setRecrawlModal(null);
    setRecrawling(domain);
    try {
      if (mode === 'web') {
        await crawlAffiliateApi.crawlDomains({ domains: [domain], force: true });
        toast(`Re-crawl queued for ${domain}`, { type: 'success' });
      } else if (model === 'ladytools') {
        const res = await crawlAffiliateApi.ladyToolsImprove([domain]);
        toast(
          res.improved > 0 ? t('llmImproveSuccess', { domain }) : t('llmImproveNoChange', { domain }),
          { type: res.improved > 0 ? 'success' : 'info' },
        );
      } else {
        const res = await crawlAffiliateApi.llmImprove([domain], model || undefined);
        toast(
          res.improved > 0 ? t('llmImproveSuccess', { domain }) : t('llmImproveNoChange', { domain }),
          { type: res.improved > 0 ? 'success' : 'info' },
        );
      }
      fetchData(params);
    } catch { toast(t('llmImproveFailed'), { type: 'error' }); }
    finally { setRecrawling(null); }
  };

  const handleBatchRecrawl = async () => {
    if (!batchRecrawlModal || !selected.size) return;
    const { mode, model } = batchRecrawlModal;
    const domains = Array.from(selected);
    setBatchRecrawlModal(null);
    setBatchRecrawling(true);
    try {
      if (mode === 'web') {
        await crawlAffiliateApi.crawlDomains({ domains, force: true });
        toast(`Re-crawl queued for ${domains.length} domain${domains.length > 1 ? 's' : ''}`, { type: 'success' });
      } else if (model === 'ladytools') {
        const res = await crawlAffiliateApi.ladyToolsImprove(domains);
        toast(t('bulkLlmImproveResult', { improved: res.improved, total: res.total }), { type: 'success' });
      } else {
        const res = await crawlAffiliateApi.llmImprove(domains, model || undefined);
        toast(t('bulkLlmImproveResult', { improved: res.improved, total: res.total }), { type: 'success' });
      }
      setSelected(new Set());
      fetchData(params);
    } catch { toast(t('llmImproveFailed'), { type: 'error' }); }
    finally { setBatchRecrawling(false); }
  };

  const allSelected = filteredItems.length > 0 && filteredItems.every(i => selected.has(i.domain));
  const someSelected = filteredItems.some(i => selected.has(i.domain)) && !allSelected;
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); filteredItems.forEach(i => s.delete(i.domain)); return s; });
    else setSelected(prev => { const s = new Set(prev); filteredItems.forEach(i => s.add(i.domain)); return s; });
  };
  const toggleOne = (domain: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(domain) ? s.delete(domain) : s.add(domain); return s; });
  const refreshStats = async () => { try { setStats(await affiliateApi.stats()); } catch { } };

  const handleExport = async (columns: ExportColumnKey[], maxRows: number | undefined) => {
    setExporting(true);
    try {
      if (selected.size > 0) {
        await affiliateApi.exportXlsx({ domains: Array.from(selected), columns, maxRows });
      } else {
        const {
          commissionType, minConfidence, domain, orderBy, order,
          scoreMax, scoreMin, hasCommission, dateField, dateFrom, dateTo,
        } = params;
        await affiliateApi.exportXlsx({
          commissionType, minConfidence, domain, orderBy, order,
          scoreMax, scoreMin, hasCommission, dateField, dateFrom, dateTo,
          columns, maxRows,
        });
      }
      setShowExportModal(false);
    } catch (e: unknown) {
      if (e instanceof ExportRowCapError) {
        toast(tExport('rowCapExceeded', { total: e.total, maxRows: e.maxRows }), { type: 'error' });
      } else {
        toast(e instanceof Error ? e.message : tExport('failed'), { type: 'error' });
      }
    } finally { setExporting(false); }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />}
            onClick={() => { refreshStats(); fetchData(params); }}>
            {tc('refresh')}
          </Button>
          <Link href="/affiliate/stats">
            <Button variant="secondary" size="sm" icon={<BarChart2 size={13} />}>{t('statsButton')}</Button>
          </Link>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}
            className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600"
            onClick={() => setShowExportModal(true)}>
            {tExport('button')}
          </Button>
          {isSuperAdmin && (
            <Button variant="secondary" size="sm" icon={<Upload size={13} />}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white !border-blue-600"
              onClick={() => setShowImportModal(true)}>
              {tImport('button')}
            </Button>
          )}
          {canCrawl && (
            <Link href="/affiliate/actions">
              <Button size="sm">{t('crawlAdd')}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label={t('stats.totalPrograms')} value={stats.total.toLocaleString()} />
          <StatCard label={t('stats.withCommission')} value={stats.withCommissionRate.toLocaleString()} color="text-green-400" />
          <StatCard label={t('stats.withCookie')} value={stats.withCookieDays.toLocaleString()} color="text-amber-400" />
          <StatCard label={t('stats.avgScore')} value={`${Math.round(stats.avgConfidence * 100)}`} />
          <div className="rounded-lg border bg-[var(--surface)] border-[var(--border)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-2">{t('stats.commissionTypes')}</p>
            <div className="space-y-1.5">
              {[
                { key: 'recurring', label: t('stats.recurring'), color: 'text-green-400', dot: 'bg-green-400' },
                { key: 'one_time', label: t('stats.oneTime'), color: 'text-indigo-400', dot: 'bg-indigo-400' },
                { key: 'unknown', label: t('stats.unknown'), color: 'text-[var(--text-muted)]', dot: 'bg-[var(--border)]' },
              ].map(({ key, label, color, dot }) => {
                const count = stats.byCommissionType[key] ?? 0;
                if (!count) return null;
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <span className="text-xs text-[var(--text-muted)]">{label}</span>
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${color}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Score legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text)] shrink-0">{t('legend.title')}</span>
        {[
          { range: '85–100', label: t('legend.excellent'), color: 'bg-emerald-500', text: 'text-emerald-300' },
          { range: '70–84', label: t('legend.good'), color: 'bg-green-500', text: 'text-green-300' },
          { range: '50–69', label: t('legend.medium'), color: 'bg-amber-500', text: 'text-amber-300' },
          { range: '30–49', label: t('legend.low'), color: 'bg-orange-500', text: 'text-orange-300' },
          { range: '0–29', label: t('legend.veryLow'), color: 'bg-red-600', text: 'text-red-300' },
        ].map(({ range, label, color, text }) => (
          <div key={range} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
            <span className={text}>{range}</span>
            <span>{label}</span>
          </div>
        ))}
        <span className="ml-auto flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <span className="text-[10px] font-bold px-1 py-px rounded bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40">{t('newBadge')}</span>
            <span>{t('legend.newHint')}</span>
          </span>
          <span className="flex items-center gap-1">
            <RotateCw size={11} className="text-sky-400" />
            <span>{t('legend.recrawlHint')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full shrink-0 bg-indigo-500" />
            <span>{t('legend.anyoneSignedUpHint')}</span>
          </span>
        </span>
      </div>

      {/* Filters that don't map to a specific column (type/commission/cookie/
          traffic/signup moved into their column headers — see ColumnHeaderFilter) */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex gap-2 w-full sm:w-auto">
              <Input placeholder={t('filters.searchPlaceholder')} value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
                className="w-full sm:w-[180px] min-w-0" />
              <Button size="sm" icon={<Search size={13} />} onClick={handleDomainSearch} className="shrink-0">{tc('search')}</Button>
            </div>
            <Select label={t('filters.score')}
              value={scoreFilter}
              onValueChange={(v) => {
                setScoreFilter(v);
                applyParams({
                  ...params, page: 1,
                  scoreMin: v && v !== '0-39' ? Number(v) : undefined,
                  scoreMax: v === '0-39' ? 39 : undefined,
                });
              }}
              options={SCORE_FILTER_OPTIONS} />
            {/* crawledAt/updatedAt/confidence/affiliateScore have no dedicated column
                header (unlike domain/cookieDays/traffic fields) — kept here as the
                only way to sort by them. */}
            <Select label={t('filters.sortBy')}
              value={params.orderBy}
              onValueChange={(v) => applyParams({ ...params, page: 1, orderBy: v as AffiliateListParams['orderBy'] })}
              options={ORDER_BY_OPTIONS} />
            <Button variant="ghost" size="sm"
              icon={params.order === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              onClick={() => applyParams({ ...params, order: params.order === 'asc' ? 'desc' : 'asc' })}>
              {params.order === 'asc' ? tc('asc') : tc('desc')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <Select label={t('filters.dateField')}
              value={params.dateField ?? 'crawledAt'}
              onValueChange={(v) => applyParams({ ...params, page: 1, dateField: v as AffiliateListParams['dateField'] })}
              options={DATE_FIELD_OPTIONS} />
            <DateRangePicker
              from={params.dateFrom}
              to={params.dateTo}
              onChange={(dateFrom, dateTo) => applyParams({ ...params, page: 1, dateFrom, dateTo })}
            />
            <Select label={t('filters.perPage')}
              value={String(params.limit)}
              onValueChange={(v) => applyParams({ ...params, page: 1, limit: Number(v) })}
              options={[20, 50, 100, 200].map((n) => ({ value: String(n), label: String(n) }))} />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--accent)]/40 bg-indigo-950/30">
          <span className="text-sm text-indigo-300 font-medium">{tc('selected', { count: selected.size })}</span>
          <Button variant="secondary" size="sm" icon={<Download size={12} />}
            className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600"
            onClick={() => setShowExportModal(true)}>
            {tExport('buttonSelected')}
          </Button>
          <Button variant="secondary" size="sm" loading={bulkMarkingSignup} icon={<BadgeCheck size={12} className="text-indigo-400" />}
            onClick={handleBulkMarkSignedUp}>
            Đánh dấu đã đăng ký
          </Button>
          {isSuperAdmin && (
            <Button variant="danger" size="sm" loading={bulkDeleting} icon={<Trash2 size={12} />} onClick={handleBulkDelete}>
              {tc('deleteSelected')}
            </Button>
          )}
          {isSuperAdmin && (
            <Button variant="secondary" size="sm" loading={batchRecrawling} icon={<RefreshCcw size={12} className="text-sky-400" />} onClick={() => setBatchRecrawlModal({ mode: 'web', model: '' })}>
              Re-crawl Selected
            </Button>
          )}
          <button className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            onClick={() => setSelected(new Set())}>
            {tc('clearSelection')}
          </button>
        </div>
      )}

      {/* Table — thead is sticky (stays visible while scrolling the tbody
          vertically) and the checkbox+Domain columns are sticky left (stay
          visible while scrolling horizontally through the other 11 columns),
          same behavior as DataTables' FixedHeader/FixedColumns extensions.
          The z-index stack matters: the sticky-left cells need to sit above
          normal cells while scrolling horizontally (z-10), and the sticky
          Domain header cell needs to sit above BOTH normal header cells AND
          the sticky-left body cells while scrolling vertically (z-20). */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-auto max-h-[75vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="sticky top-0 left-0 z-20 px-3 py-3 w-8 bg-[var(--surface-2)]">
                  <button onClick={toggleAll} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                    {allSelected ? <CheckSquare size={14} className="text-[var(--accent)]" /> :
                      someSelected ? <Minus size={14} /> : <Square size={14} />}
                  </button>
                </th>
                <th className="sticky top-0 left-8 z-20 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]">
                  <SortableHeader label={t('table.domain')} sortKey="domain" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'domain' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })} />
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap bg-[var(--surface-2)]">{t('table.programName')}</th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label={t('table.commission')} active={!!commissionFilter}>
                    <Select label={t('filters.commissionRate')}
                      value={commissionFilter}
                      onValueChange={(v) => {
                        setCommissionFilter(v);
                        applyParams({ ...params, page: 1, hasCommission: v === 'has' ? true : v === 'none' ? false : undefined });
                      }}
                      options={COMMISSION_FILTER_OPTIONS} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label={t('table.type')} active={!!params.commissionType}>
                    <Select label={t('filters.type')}
                      value={params.commissionType ?? ''}
                      onValueChange={(v) => applyParams({ ...params, page: 1, commissionType: (v || undefined) as CommissionType | undefined })}
                      options={TYPE_OPTIONS} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label={t('table.cookie')} sortKey="cookieDays" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'cookieDays' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })}
                    active={params.cookieDaysMin !== undefined || params.cookieDaysMax !== undefined}>
                    <RangeFilter placeholder="days" min={params.cookieDaysMin} max={params.cookieDaysMax}
                      onChange={(cookieDaysMin, cookieDaysMax) => applyParams({ ...params, page: 1, cookieDaysMin, cookieDaysMax })} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label="Traffic" sortKey="monthlyVisits" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'monthlyVisits' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })}
                    active={params.monthlyVisitsMin !== undefined || params.monthlyVisitsMax !== undefined}>
                    <RangeFilter placeholder="visits" min={params.monthlyVisitsMin} max={params.monthlyVisitsMax}
                      onChange={(monthlyVisitsMin, monthlyVisitsMax) => applyParams({ ...params, page: 1, monthlyVisitsMin, monthlyVisitsMax })} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label="Time on Site" sortKey="timeOnSite" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'timeOnSite' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })}
                    active={params.timeOnSiteMin !== undefined || params.timeOnSiteMax !== undefined}>
                    <RangeFilter placeholder="sec" min={params.timeOnSiteMin} max={params.timeOnSiteMax}
                      onChange={(timeOnSiteMin, timeOnSiteMax) => applyParams({ ...params, page: 1, timeOnSiteMin, timeOnSiteMax })} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label="Pages/Visit" sortKey="pagesPerVisit" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'pagesPerVisit' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })}
                    active={params.pagesPerVisitMin !== undefined || params.pagesPerVisitMax !== undefined}>
                    <RangeFilter placeholder="pages" min={params.pagesPerVisitMin} max={params.pagesPerVisitMax}
                      onChange={(pagesPerVisitMin, pagesPerVisitMax) => applyParams({ ...params, page: 1, pagesPerVisitMin, pagesPerVisitMax })} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label="Bounce Rate" sortKey="bounceRate" currentOrderBy={params.orderBy} currentOrder={params.order}
                    onSort={(order) => applyParams({ ...params, order, orderBy: 'bounceRate' })}
                    onClearSort={() => applyParams({ ...params, orderBy: 'crawledAt', order: 'desc' })}
                    active={params.bounceRateMin !== undefined || params.bounceRateMax !== undefined}>
                    <RangeFilter placeholder="%" min={params.bounceRateMin} max={params.bounceRateMax}
                      onChange={(bounceRateMin, bounceRateMax) => applyParams({ ...params, page: 1, bounceRateMin, bounceRateMax })} />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left whitespace-nowrap bg-[var(--surface-2)]">
                  <ColumnHeaderFilter label={t('table.signedUp')} active={signupFilters.size > 0}>
                    <SignupFilterPicker
                      active={signupFilters}
                      onChange={(next) => {
                        setSignupFilters(next);
                        applyParams({
                          ...params, page: 1,
                          signedUpByMe: next.has('signedUpByMe') ? true : undefined,
                          notSignedUpByMe: next.has('notSignedUpByMe') ? true : undefined,
                          anyoneSignedUp: next.has('anyoneSignedUp') ? true : undefined,
                          noneSignedUp: next.has('noneSignedUp') ? true : undefined,
                        });
                      }}
                    />
                  </ColumnHeaderFilter>
                </th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap bg-[var(--surface-2)]">{t('table.verify')}</th>
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] whitespace-nowrap bg-[var(--surface-2)]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="text-center py-12 text-[var(--text-muted)]">{tc('loading')}</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-12 text-[var(--text-muted)]">{t('noResults')}</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selected.has(item.domain);
                  return (
                    <tr key={item.domain}
                      className={clsx(
                        'group border-b border-[var(--border)] transition-colors',
                        item.anyoneSignedUp && 'border-r-2 border-r-indigo-500',
                        scoreRowBorder(item.affiliateScore),
                        isSelected ? 'bg-indigo-950/30' : 'hover:bg-[var(--surface-2)]',
                      )}>
                      <td className={clsx(
                        'sticky left-0 z-10 px-3 py-3',
                        isSelected ? 'bg-indigo-950' : 'bg-[var(--surface)] group-hover:bg-[var(--surface-2)]',
                      )}>
                        <button onClick={() => toggleOne(item.domain)} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                          {isSelected ? <CheckSquare size={14} className="text-[var(--accent)]" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className={clsx(
                        'sticky left-8 z-10 px-4 py-3 font-mono text-xs max-w-[180px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]',
                        isSelected ? 'bg-indigo-950' : 'bg-[var(--surface)] group-hover:bg-[var(--surface-2)]',
                      )}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link href={`/affiliate/${encodeURIComponent(item.domain)}`}
                            className="text-indigo-400 hover:underline truncate">
                            {item.domain}
                          </Link>
                          <GoogleResearchLink domain={item.domain} programName={item.programName} />
                          {item.signupUrlVerified && <BadgeCheck size={12} className="text-emerald-400 shrink-0" />}
                          {item.llmEnriched && <Sparkles size={11} className="text-purple-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] max-w-[160px] truncate text-xs">
                        {item.programName ?? <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate" title={item.commissionRate || undefined}>
                        {item.commissionRate
                          ? <span className="text-green-400">{item.commissionRate}</span>
                          : <span className="text-[var(--text-muted)]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={typeVariant(item.commissionType)}>
                          {item.commissionType === 'one_time' ? t('badge.oneTime') :
                            item.commissionType === 'recurring' ? t('badge.recurring') : t('badge.unknown')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><CookieCell days={item.cookieDays} /></td>
                      <td className="px-4 py-3"><TrafficCell traffic={item.domainTraffic} /></td>
                      <td className="px-4 py-3"><TimeOnSiteCell traffic={item.domainTraffic} /></td>
                      <td className="px-4 py-3"><PagesPerVisitCell traffic={item.domainTraffic} /></td>
                      <td className="px-4 py-3"><BounceRateCell traffic={item.domainTraffic} /></td>
                      <td className="px-4 py-3">
                        <SignupCell signedUp={!!item.signedUpByMe} onClick={() => setSignupModal(item.domain)} />
                      </td>
                      <td className="px-4 py-3">
                        <VerifyCell
                          domain={item.domain}
                          verification={verifications.get(item.domain)}
                          onClick={() => setVerifyModal(item.domain)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {item.signupUrl && (
                            <a href={item.signupUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" icon={<ExternalLink size={12} />} />
                            </a>
                          )}
                          {isSuperAdmin && (
                            <Button variant="ghost" size="sm"
                              loading={recrawling === item.domain}
                              title="Re-crawl"
                              icon={<RefreshCcw size={12} className="text-sky-400" />}
                              onClick={() => setRecrawlModal({ domain: item.domain, mode: 'web', model: '' })} />
                          )}
                          {isSuperAdmin && (
                            <Button variant="ghost" size="sm"
                              loading={deletingDomain === item.domain}
                              icon={<Trash2 size={12} className="text-red-400" />}
                              onClick={() => handleDelete(item.domain)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={params.page ?? 1} pages={pages} total={total} limit={params.limit ?? 50}
          onChange={(p) => applyParams({ ...params, page: p })}
        />
      </div>

      {/* Export columns modal */}
      {showExportModal && (
        <ExportColumnsModal
          exporting={exporting}
          onConfirm={handleExport}
          onClose={() => setShowExportModal(false)}
          selectedDomainCount={selected.size > 0 ? selected.size : undefined}
        />
      )}

      {/* Import modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => fetchData(params)}
        />
      )}

      {/* Signup modal */}
      {signupModal && (() => {
        const target = items.find((i) => i.domain === signupModal);
        return (
          <SignupModal
            domain={signupModal}
            signedUpByMe={!!target?.signedUpByMe}
            onMarked={() => {
              setItems((prev) => prev.map((i) =>
                i.domain === signupModal
                  ? { ...i, signedUpByMe: true, anyoneSignedUp: true }
                  : i));
              setSignupModal(null);
            }}
            onUnmarked={() => {
              setItems((prev) => prev.map((i) =>
                i.domain === signupModal
                  ? { ...i, signedUpByMe: false }
                  : i));
              setSignupModal(null);
            }}
            onClose={() => setSignupModal(null)}
          />
        );
      })()}

      {/* Verify modal */}
      {verifyModal && (
        <VerifyModal
          domain={verifyModal}
          current={verifications.get(verifyModal)}
          onSave={(v) => {
            setVerifications((prev) => new Map(prev).set(v.domain, v));
            setVerifyModal(null);
          }}
          onClear={() => {
            setVerifications((prev) => { const m = new Map(prev); m.delete(verifyModal); return m; });
            setVerifyModal(null);
          }}
          onClose={() => setVerifyModal(null)}
        />
      )}

      {/* Re-crawl popup */}
      {recrawlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
            <button
              className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text)]"
              onClick={() => setRecrawlModal(null)}
            >
              <X size={16} />
            </button>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">Re-crawl</h2>
              <p className="mt-0.5 font-mono text-xs text-indigo-400 truncate">{recrawlModal.domain}</p>
            </div>
            <div className="flex gap-2 mb-4">
              {(['web', 'llm'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRecrawlModal(m => m ? { ...m, mode, model: '' } : m)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg border text-xs font-medium transition-colors',
                    recrawlModal.mode === mode
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]',
                  )}
                >
                  {mode === 'web' ? 'Web Crawl' : 'LLM Re-crawl'}
                </button>
              ))}
            </div>
            {recrawlModal.mode === 'web' ? (
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Force a fresh web crawl — re-fetches the site and extracts data without LLM.
              </p>
            ) : (
              <div className="mb-5 space-y-1">
                <p className="text-xs text-[var(--text-muted)] mb-2">Select the LLM model for extraction:</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1">Ollama (local)</p>
                {RECRAWL_MODEL_OPTIONS.filter(o => o.group === 'ollama').map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
                    <input
                      type="radio"
                      name="recrawl-model"
                      value={value}
                      checked={recrawlModal.model === value}
                      onChange={() => setRecrawlModal(m => m ? { ...m, model: value } : m)}
                      className="accent-[var(--accent)]"
                    />
                    <span className={value === '' ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}>{label}</span>
                  </label>
                ))}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 pt-2 mb-1">Gemini (Google · free · single domain only)</p>
                {RECRAWL_MODEL_OPTIONS.filter(o => o.group === 'gemini').map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
                    <input
                      type="radio"
                      name="recrawl-model"
                      value={value}
                      checked={recrawlModal.model === value}
                      onChange={() => setRecrawlModal(m => m ? { ...m, model: value } : m)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-[var(--text)]">{label}</span>
                  </label>
                ))}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 pt-2 mb-1">Lady Tools</p>
                {RECRAWL_MODEL_OPTIONS.filter(o => o.group === 'ladytools').map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
                    <input
                      type="radio"
                      name="recrawl-model"
                      value={value}
                      checked={recrawlModal.model === value}
                      onChange={() => setRecrawlModal(m => m ? { ...m, model: value } : m)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-[var(--text)]">{label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRecrawlModal(null)}>Cancel</Button>
              <Button size="sm" icon={<RefreshCcw size={12} />} onClick={handleRecrawl}>
                {recrawlModal.mode === 'web' ? 'Re-crawl' : 'Run LLM'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch re-crawl popup */}
      {batchRecrawlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
            <button
              className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text)]"
              onClick={() => setBatchRecrawlModal(null)}
            >
              <X size={16} />
            </button>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">Re-crawl Selected</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{selected.size} domain{selected.size > 1 ? 's' : ''} selected</p>
            </div>
            <div className="flex gap-2 mb-4">
              {(['web', 'llm'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBatchRecrawlModal(m => m ? { ...m, mode, model: '' } : m)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg border text-xs font-medium transition-colors',
                    batchRecrawlModal.mode === mode
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]',
                  )}
                >
                  {mode === 'web' ? 'Web Crawl' : 'LLM Re-crawl'}
                </button>
              ))}
            </div>
            {batchRecrawlModal.mode === 'web' ? (
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Force a fresh web crawl for all selected domains — no LLM.
              </p>
            ) : (
              <div className="mb-5 space-y-1">
                <p className="text-xs text-[var(--text-muted)] mb-2">Select the LLM model for extraction:</p>
                <p className="text-xs text-amber-400/80 mb-2">⚠ Gemini supports single-domain only — use Ollama for bulk.</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1">Ollama (local)</p>
                {RECRAWL_MODEL_OPTIONS.filter(o => o.group === 'ollama').map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
                    <input
                      type="radio"
                      name="batch-recrawl-model"
                      value={value}
                      checked={batchRecrawlModal.model === value}
                      onChange={() => setBatchRecrawlModal(m => m ? { ...m, model: value } : m)}
                      className="accent-[var(--accent)]"
                    />
                    <span className={value === '' ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}>{label}</span>
                  </label>
                ))}
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1 pt-2 mb-1">Lady Tools (max 50 domains)</p>
                {RECRAWL_MODEL_OPTIONS.filter(o => o.group === 'ladytools').map(({ value, label }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)]">
                    <input
                      type="radio"
                      name="batch-recrawl-model"
                      value={value}
                      checked={batchRecrawlModal.model === value}
                      onChange={() => setBatchRecrawlModal(m => m ? { ...m, model: value } : m)}
                      className="accent-[var(--accent)]"
                    />
                    <span className="text-[var(--text)]">{label}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setBatchRecrawlModal(null)}>Cancel</Button>
              <Button size="sm" icon={<RefreshCcw size={12} />} onClick={handleBatchRecrawl}>
                {batchRecrawlModal.mode === 'web' ? 'Re-crawl All' : 'Run LLM on All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
