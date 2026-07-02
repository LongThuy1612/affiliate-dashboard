'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, CheckCircle, MessageSquareDot } from 'lucide-react';
import { feedbackApi, type FeedbackItem } from '@/lib/feedbackApi';
import { useToast } from '@/components/ui/Toaster';
import clsx from 'clsx';

const TYPE_COLORS: Record<string, string> = {
  general:    'bg-blue-900/30 text-blue-300',
  bug:        'bg-red-900/30 text-red-300',
  suggestion: 'bg-emerald-900/30 text-emerald-300',
  other:      'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

export default function FeedbackManagePage() {
  const t = useTranslations('feedback');
  const tm = useTranslations('feedback.manage');
  const { toast } = useToast();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    feedbackApi.list()
      .then(setItems)
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Error', { type: 'error' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleMarkRead = async (id: number) => {
    try {
      const updated = await feedbackApi.markRead(id);
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      toast(tm('markReadSuccess'), { type: 'success' });
    } catch {
      toast(tm('deleteFailed'), { type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(tm('deleteConfirm'))) return;
    try {
      await feedbackApi.delete(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast(tm('deleteSuccess'), { type: 'success' });
    } catch {
      toast(tm('deleteFailed'), { type: 'error' });
    }
  };

  const filtered = items.filter((it) => {
    if (filter === 'unread') return it.status === 'unread';
    if (filter === 'read')   return it.status === 'read';
    return true;
  });

  const unreadCount = items.filter((i) => i.status === 'unread').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
          <MessageSquareDot size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-[var(--text)]">{tm('title')}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{tm('subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
            {unreadCount} {tm('unread')}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
            )}
          >
            {f === 'all' ? 'All' : f === 'unread' ? tm('unread') : tm('read')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-sm text-[var(--text-muted)] py-12 text-center">Loading…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-[var(--text-muted)] py-12 text-center">{tm('noFeedback')}</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'rounded-xl border p-4 space-y-2 transition-colors',
                item.status === 'unread'
                  ? 'border-[var(--accent)]/40 bg-indigo-950/20'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              )}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded', TYPE_COLORS[item.type] ?? TYPE_COLORS.other)}>
                  {t(`types.${item.type}` as Parameters<typeof t>[0]) ?? item.type}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{tm('from', { id: item.userId })}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                {item.status === 'unread' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">{tm('unread')}</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {item.status === 'unread' && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      title={tm('markRead')}
                      className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-emerald-400 transition-colors"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
