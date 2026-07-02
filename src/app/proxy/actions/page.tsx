'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { proxyApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { Upload, Activity, Trash2, ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { PermissionSubject as S, PermissionAction as A } from '@/constants/permissions';

function ResultBox({ result }: { result: unknown }) {
  if (!result) return null;
  return (
    <pre className="mt-3 p-3 rounded bg-[var(--surface-2)] text-xs font-mono text-green-400 overflow-auto max-h-48 whitespace-pre-wrap">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function ImportForm() {
  const { toast } = useToast();
  const t = useTranslations('proxyActions.import');
  const [raw, setRaw]         = useState('');
  const [check, setCheck]     = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);

  const submit = async () => {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return toast(t('validationError'), { type: 'error' });
    setLoading(true); setResult(null);
    try {
      const res = await proxyApi.import({ proxies: lines, check });
      setResult(res);
      toast(t('successMessage', { count: (res as { upserted?: number }).upserted ?? '?' }), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failedMessage'), { type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Card title={t('title')}>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {t('description')}{' '}
        <code className="font-mono bg-[var(--surface-2)] px-1 rounded">ip:port</code>{' '}or{' '}
        <code className="font-mono bg-[var(--surface-2)] px-1 rounded">ip:port:user:pass</code>
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">{t('listLabel')}</label>
          <textarea
            className="w-full rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono h-40 resize-y"
            placeholder={"192.168.1.1:8080\n10.0.0.1:3128:user:pass\n..."}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="accent-[var(--accent)]" />
            {t('checkLabel')}
          </label>
          <Button icon={<Upload size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
        </div>
      </div>
      <ResultBox result={result} />
    </Card>
  );
}

function HealthCheckForm() {
  const { toast } = useToast();
  const t = useTranslations('proxyActions.healthCheck');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);

  const submit = async () => {
    if (!confirm(t('confirm'))) return;
    setLoading(true); setResult(null);
    try {
      const res = await proxyApi.healthCheck();
      setResult(res);
      toast(t('success'), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Card title={t('title')}>
      <p className="text-xs text-[var(--text-muted)] mb-4">{t('description')}</p>
      <Button icon={<Activity size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
      <ResultBox result={result} />
    </Card>
  );
}

function DeleteDeadForm() {
  const { toast } = useToast();
  const t = useTranslations('proxyActions.deleteDead');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);

  const submit = async () => {
    if (!confirm(t('confirm'))) return;
    setLoading(true); setResult(null);
    try {
      const res = await proxyApi.deleteBulk({ live: false });
      setResult(res);
      toast(t('successMessage', { count: (res as { deleted?: number }).deleted ?? '?' }), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Card title={t('title')}>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {t('description')}{' '}
        (<code className="font-mono bg-[var(--surface-2)] px-1 rounded">isLive = 0</code>)
      </p>
      <Button variant="danger" icon={<ShieldOff size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
      <ResultBox result={result} />
    </Card>
  );
}

function BulkDeleteForm() {
  const { toast } = useToast();
  const t = useTranslations('proxyActions.bulkDelete');
  const [raw, setRaw]         = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<unknown>(null);

  const submit = async () => {
    const entries = raw.split('\n').map((l) => l.trim()).filter(Boolean)
      .map((l) => { const [ip, portStr] = l.split(':'); return { ip: ip?.trim(), port: parseInt(portStr, 10) }; })
      .filter((e) => e.ip && !isNaN(e.port));
    if (!entries.length) return toast(t('validationError'), { type: 'error' });
    if (!confirm(t('confirm', { count: entries.length }))) return;
    setLoading(true); setResult(null);
    try {
      const res = await proxyApi.deleteBulk({ proxies: entries });
      setResult(res);
      toast(t('successMessage', { count: (res as { deleted?: number }).deleted ?? '?' }), { type: 'success' });
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : t('failed'), { type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Card title={t('title')}>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {t('description')}{' '}
        (<code className="font-mono bg-[var(--surface-2)] px-1 rounded">ip:port</code>)
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">{t('listLabel')}</label>
          <textarea
            className="w-full rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono h-32 resize-y"
            placeholder={"192.168.1.1:8080\n10.0.0.2:3128"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
        </div>
        <Button variant="danger" icon={<Trash2 size={13} />} loading={loading} onClick={submit}>{t('button')}</Button>
      </div>
      <ResultBox result={result} />
    </Card>
  );
}

export default function ProxyActionsPage() {
  const t = useTranslations('proxyActions');
  const { user } = useAuth();
  const perms = user?.permissions ?? [];

  const canImport      = hasPermission(perms, S.PROXY, A.CREATE);
  const canHealthCheck = hasPermission(perms, S.PROXY, A.UPDATE);
  const canDelete      = hasPermission(perms, S.PROXY, A.DELETE);

  const hasAny = canImport || canHealthCheck || canDelete;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
      </div>
      {hasAny ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {canImport      && <ImportForm />}
          {canHealthCheck && <HealthCheckForm />}
          {canDelete      && <DeleteDeadForm />}
          {canDelete      && <BulkDeleteForm />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <p className="text-base font-semibold text-[var(--text)]">Không có quyền truy cập</p>
          <p className="text-sm text-[var(--text-muted)] max-w-sm">
            Bạn cần proxy:create, proxy:update hoặc proxy:delete để sử dụng các action này.
          </p>
        </div>
      )}
    </div>
  );
}
