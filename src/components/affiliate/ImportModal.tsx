'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { ChevronDown, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { affiliateApi, IMPORT_COLUMNS, ImportResult, ImportDryRunResult } from '@/lib/api';
import { useToast } from '@/components/ui/Toaster';

// Shared by both /affiliate and /affiliate/dev — previously each page had its
// own copy of this modal, which let them silently drift apart (confirmed
// live: the dry-run/confirm-before-import warning flow for unrecognized or
// missing columns was added to the /affiliate copy but not /affiliate/dev's,
// so testing on the dev page showed no warning even though the backend was
// already returning it correctly). One component means both pages behave
// identically by construction.
export default function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const t = useTranslations('affiliate.import');
  const { toast } = useToast();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  // Set after a dry-run finds something worth confirming (unrecognized
  // columns and/or row errors) — shows a confirm prompt before the real,
  // DB-writing import runs. A clean dry-run (no warnings) skips straight to
  // the real import instead of prompting for nothing.
  const [pendingConfirm, setPendingConfirm] = useState<ImportDryRunResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      toast(t('invalidFileType'), { type: 'error' });
      return;
    }
    setFile(f);
    setResult(null);
    setPendingConfirm(null);
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await affiliateApi.downloadImportTemplate();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('templateFailed'), { type: 'error' });
    } finally { setDownloadingTemplate(false); }
  };

  const runRealImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const res = await affiliateApi.importXlsx(file) as ImportResult;
      setResult(res);
      setPendingConfirm(null);
      if (res.created > 0 || res.updated > 0) onImported();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setImporting(false); }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const dry = await affiliateApi.importXlsx(file, { dryRun: true }) as ImportDryRunResult;
      const hasWarnings = (dry.unrecognizedHeaders?.length ?? 0) > 0 || (dry.missingHeaders?.length ?? 0) > 0 || (dry.errors?.length ?? 0) > 0;
      if (hasWarnings) {
        // Show the confirm prompt instead of writing anything yet — user
        // decides whether to proceed despite the warnings.
        setImporting(false);
        setPendingConfirm(dry);
        return;
      }
      // Clean dry-run — nothing to confirm, proceed straight to the real import.
      await runRealImport();
    } catch (e: unknown) {
      setImporting(false);
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">{t('title')}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden">
          <button
            onClick={() => setRulesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-300"
          >
            <span className="flex items-center gap-1.5">
              <ChevronDown size={14} className={clsx('transition-transform', !rulesOpen && '-rotate-90')} />
              {t('rulesTitle')}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDownloadTemplate(); } }}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 px-2.5 py-1 text-xs text-amber-200 hover:bg-amber-500/10 transition-colors"
            >
              <Download size={12} />
              {downloadingTemplate ? '…' : t('downloadTemplate')}
            </span>
          </button>
          {rulesOpen && (
            <div className="px-4 pb-4 text-xs text-amber-200/90 space-y-1.5">
              <p>{t('ruleDomain')}</p>
              <p>{t('ruleOptionalColumns', { columns: IMPORT_COLUMNS.map((c) => c.label).join(', ') })}</p>
              <p>{t('ruleCommissionType')}</p>
              <p>{t('ruleCookieDays')}</p>
              <p>{t('ruleRowCap')}</p>
              <p className="text-red-400 font-semibold">{t('ruleTextFormat')}</p>
            </div>
          )}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
            dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/50',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex flex-col items-center gap-1.5">
              <FileSpreadsheet size={28} className="text-[var(--accent)]" />
              <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{t('changeFileHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload size={28} className="text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--accent)]">{t('dropHint')}</p>
              <p className="text-xs text-[var(--text-muted)]">{t('dropSubhint')}</p>
            </div>
          )}
        </div>

        {pendingConfirm && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm font-medium text-amber-300">{t('confirmTitle')}</p>
            {pendingConfirm.unrecognizedHeaders.length > 0 && (
              <p className="text-xs text-amber-200/90">
                {t('unrecognizedColumns', { columns: pendingConfirm.unrecognizedHeaders.join(', ') })}
              </p>
            )}
            {pendingConfirm.missingHeaders.length > 0 && (
              <p className="text-xs text-amber-200/90">
                {t('missingColumns', { columns: pendingConfirm.missingHeaders.join(', ') })}
              </p>
            )}
            {pendingConfirm.errors.length > 0 && (
              <>
                <p className="text-xs text-amber-200/90">{t('resultErrors', { count: pendingConfirm.errors.length })}</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {pendingConfirm.errors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-200/70">
                      {t('errorRow', { row: err.row, domain: err.domain ?? '—', reason: err.reason })}
                    </p>
                  ))}
                </div>
              </>
            )}
            <p className="text-xs text-amber-200/90">{t('confirmProceed', { count: pendingConfirm.wouldImport })}</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPendingConfirm(null)}
                disabled={importing}
                className="flex-1 py-2 rounded-md border border-amber-500/40 text-amber-200 text-xs font-medium hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              >
                {t('confirmCancel')}
              </button>
              <button
                onClick={runRealImport}
                disabled={importing}
                className="flex-1 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {importing ? '…' : t('confirmProceedButton')}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400 font-medium">{t('resultCreated', { count: result.created })}</span>
              <span className="text-sky-400 font-medium">{t('resultUpdated', { count: result.updated })}</span>
              {result.errors.length > 0 && (
                <span className="text-red-400 font-medium">{t('resultErrors', { count: result.errors.length })}</span>
              )}
            </div>
            {result.unrecognizedHeaders && result.unrecognizedHeaders.length > 0 && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-2.5 py-1.5">
                {t('unrecognizedColumns', { columns: result.unrecognizedHeaders.join(', ') })}
              </p>
            )}
            {result.missingHeaders && result.missingHeaders.length > 0 && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-2.5 py-1.5">
                {t('missingColumns', { columns: result.missingHeaders.join(', ') })}
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-[var(--text-muted)]">
                    {t('errorRow', { row: err.row, domain: err.domain ?? '—', reason: err.reason })}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            {t('close')}
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing || !!pendingConfirm}
            className="flex-1 py-2.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {importing ? '…' : t('importButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
