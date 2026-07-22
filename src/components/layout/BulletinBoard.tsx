'use client';

import { useState } from 'react';
import { X, Bell, CheckSquare, Square, Pin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { resolveAssetUrl, type Announcement } from '@/lib/api';
import RemoteImage from '@/components/ui/RemoteImage';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function PinnedCard({ item }: { item: Announcement }) {
  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 overflow-hidden">
      {item.imageUrl && (
        <RemoteImage src={resolveAssetUrl(item.imageUrl)} alt={item.title} className="w-full h-auto block" />
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 uppercase tracking-wide flex items-center gap-1">
            <Pin size={8} />Ghim
          </span>
          <span className="text-xs text-[var(--text-muted)]">{formatDate(item.date)}</span>
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{item.content}</p>
      </div>
    </div>
  );
}

function RegularCard({ item }: { item: Announcement }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 overflow-hidden">
      {item.imageUrl && (
        <RemoteImage src={resolveAssetUrl(item.imageUrl)} alt={item.title} className="w-full h-auto block" />
      )}
      <div className="px-4 py-3">
        <span className="text-xs text-[var(--text-muted)]">{formatDate(item.date)}</span>
        <p className="text-sm font-medium text-[var(--text)] mt-0.5">{item.title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.content}</p>
      </div>
    </div>
  );
}

export default function BulletinBoard() {
  const { showBulletin, dismissBulletin } = useAuth();
  const { announcements } = useConfig();
  const [checked, setChecked] = useState(false);

  const active = announcements.filter((a) => a.active);
  const pinned = active.filter((a) => a.pinned);
  const regular = active.filter((a) => !a.pinned);

  if (!showBulletin || active.length === 0) return null;

  const handleDismiss = () => { if (checked) dismissBulletin(); };
  const handleClose  = () => dismissBulletin();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--accent)]/10">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[var(--text)] text-sm">Bảng tin hệ thống</p>
            <p className="text-[11px] text-[var(--text-muted)]">AffiliateCrawl Dashboard</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {pinned.map((item) => <PinnedCard key={item.id} item={item} />)}
          {regular.length > 0 && (
            <div className="space-y-3">
              {regular.map((item) => <RegularCard key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <button
            onClick={() => setChecked((v) => !v)}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors select-none"
          >
            {checked
              ? <CheckSquare size={15} className="text-[var(--accent)] shrink-0" />
              : <Square size={15} className="shrink-0" />}
            Đã đọc, không hiện lại lần này
          </button>
          <button
            onClick={handleDismiss}
            disabled={!checked}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] text-white hover:opacity-90 disabled:hover:opacity-40"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
