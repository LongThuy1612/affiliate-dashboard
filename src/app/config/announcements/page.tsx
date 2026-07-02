'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { configApi, type Announcement } from '@/lib/api';
import { useToast } from '@/components/ui/Toaster';
import Link from 'next/link';
import {
  Bell, Plus, Trash2, Pin, PinOff, Eye, EyeOff,
  ChevronLeft, RefreshCw, Lock, Edit3, X, Check, ImageIcon, Upload,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<Announcement, 'id'> = {
  title: '',
  content: '',
  date: today(),
  imageUrl: undefined,
  pinned: false,
  active: true,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, variant }: { label: string; variant: 'green' | 'slate' | 'accent' }) {
  const cls = {
    green:  'bg-emerald-900/30 border-emerald-700/40 text-emerald-300',
    slate:  'bg-slate-800 border-slate-600/40 text-slate-400',
    accent: 'bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]',
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      {children}
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

function AnnouncementModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Announcement;
  onSave: (data: Omit<Announcement, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Announcement, 'id'>>(
    initial
      ? { title: initial.title, content: initial.content, date: initial.date, imageUrl: initial.imageUrl, pinned: initial.pinned, active: initial.active }
      : { ...EMPTY_FORM, date: today() },
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload thất bại');
      set('imageUrl', json.url as string);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload thất bại');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const valid = form.title.trim() && form.content.trim() && form.date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
            <Bell size={15} className="text-[var(--accent)]" />
          </div>
          <p className="flex-1 text-sm font-semibold text-[var(--text)]">
            {initial ? 'Sửa thông báo' : 'Thêm thông báo mới'}
          </p>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)]">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <FormField label="Tiêu đề *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Nhập tiêu đề thông báo…"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </FormField>

          <FormField label="Nội dung *">
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="Nội dung chi tiết của thông báo…"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </FormField>

          {/* Image upload */}
          <FormField label="Ảnh đính kèm (tùy chọn)">
            {form.imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="preview" className="w-full h-auto block" />
                <button
                  onClick={() => set('imageUrl', undefined)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title="Xóa ảnh"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/5 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {uploading
                  ? <RefreshCw size={18} className="text-[var(--text-muted)] animate-spin" />
                  : <Upload size={18} className="text-[var(--text-muted)]" />}
                <span className="text-xs text-[var(--text-muted)]">
                  {uploading ? 'Đang tải lên…' : 'Nhấn để chọn ảnh (JPG, PNG, GIF, WEBP · tối đa 5 MB)'}
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ngày đăng">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </FormField>
            <FormField label="Tùy chọn">
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => set('pinned', e.target.checked)}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Ghim lên đầu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set('active', e.target.checked)}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Đang hiển thị</span>
                </label>
              </div>
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid || uploading}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5"
          >
            <Check size={13} />
            {initial ? 'Lưu thay đổi' : 'Thêm thông báo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { refetchConfig } = useConfig();
  const { toast } = useToast();
  const perms = user?.permissions ?? [];
  const isSuperAdmin = perms.includes('all:manage');

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; item: Announcement } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await configApi.getAll();
      const raw = cfg.system_announcements;
      if (raw?.trim()) {
        try {
          const parsed = JSON.parse(raw);
          setItems(Array.isArray(parsed) ? parsed : []);
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch {
      toast('Không thể tải thông báo', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const persist = useCallback(async (next: Announcement[]) => {
    setSaving(true);
    try {
      await configApi.setMany({ system_announcements: JSON.stringify(next) } as never);
      await refetchConfig();
      toast('Đã lưu thay đổi', { type: 'success' });
      setItems(next);
    } catch {
      toast('Lưu thất bại', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [refetchConfig, toast]);

  const handleAdd = (data: Omit<Announcement, 'id'>) => {
    const next = [{ ...data, id: uid() }, ...items];
    setModal(null);
    persist(next);
  };

  const handleEdit = (data: Omit<Announcement, 'id'>) => {
    if (modal?.mode !== 'edit') return;
    const next = items.map((a) => a.id === modal.item.id ? { ...data, id: modal.item.id } : a);
    setModal(null);
    persist(next);
  };

  const handleDelete = (id: string) => {
    const next = items.filter((a) => a.id !== id);
    setDeleteId(null);
    persist(next);
  };

  const toggleField = (id: string, field: 'pinned' | 'active') => {
    const next = items.map((a) => a.id === id ? { ...a, [field]: !a[field] } : a);
    persist(next);
  };

  // ── Access guard ──────────────────────────────────────────────────────────
  if (!user && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Đang kiểm tra quyền…
      </div>
    );
  }

  if (user && !isSuperAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
          <Lock size={22} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text)]">Chỉ SuperAdmin mới có quyền truy cập</p>
        <Link href="/config" className="text-xs text-[var(--accent)] hover:underline">← Quay lại cấu hình</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Đang tải…
      </div>
    );
  }

  const pinned  = items.filter((a) => a.pinned);
  const regular = items.filter((a) => !a.pinned);
  const ordered = [...pinned, ...regular];

  return (
    <>
      {/* Modal */}
      {modal?.mode === 'add'  && <AnnouncementModal onSave={handleAdd}  onClose={() => setModal(null)} />}
      {modal?.mode === 'edit' && <AnnouncementModal initial={modal.item} onSave={handleEdit} onClose={() => setModal(null)} />}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-4">
            <p className="text-sm font-semibold text-[var(--text)]">Xác nhận xóa thông báo?</p>
            <p className="text-xs text-[var(--text-muted)]">Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/config"
                className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <ChevronLeft size={16} />
              </Link>
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
                <Bell size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Bảng tin hệ thống</h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  Quản lý thông báo hiển thị khi đăng nhập — {items.length} thông báo
                </p>
              </div>
            </div>
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus size={13} /> Thêm thông báo
            </button>
          </div>

          {/* Info banner */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--text-muted)] leading-relaxed">
            Thông báo <span className="text-[var(--accent)] font-medium">đang hiển thị</span> sẽ xuất hiện trong modal Bảng tin mỗi lần người dùng đăng nhập.
            Thông báo được <span className="text-[var(--accent)] font-medium">ghim</span> hiển thị nổi bật ở đầu danh sách.
            Bỏ tích <em>Đang hiển thị</em> để ẩn một thông báo mà không xóa.
          </div>

          {/* Announcement list */}
          {ordered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] py-16 flex flex-col items-center gap-3 text-center">
              <Bell size={28} className="text-[var(--text-muted)] opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">Chưa có thông báo nào</p>
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Thêm thông báo đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {ordered.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-[var(--surface)] overflow-hidden transition-opacity ${
                    !item.active ? 'opacity-50' : ''
                  } ${item.pinned ? 'border-[var(--accent)]/40' : 'border-[var(--border)]'}`}
                >
                  {/* Thumbnail */}
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="w-full h-auto block border-b border-[var(--border)]" />
                  )}

                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Pin indicator */}
                    <div className={`mt-0.5 shrink-0 ${item.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-30'}`}>
                      <Pin size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-[var(--text)] truncate">{item.title}</p>
                        {item.pinned  && <Badge label="Ghim" variant="accent" />}
                        {item.active  ? <Badge label="Hiển thị" variant="green" /> : <Badge label="Ẩn" variant="slate" />}
                        {item.imageUrl && <ImageIcon size={11} className="text-[var(--text-muted)]" />}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{item.content}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{formatDate(item.date)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle pinned */}
                      <button
                        onClick={() => toggleField(item.id, 'pinned')}
                        disabled={saving}
                        title={item.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40"
                      >
                        {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>

                      {/* Toggle active */}
                      <button
                        onClick={() => toggleField(item.id, 'active')}
                        disabled={saving}
                        title={item.active ? 'Ẩn thông báo' : 'Hiển thị thông báo'}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40"
                      >
                        {item.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setModal({ mode: 'edit', item })}
                        title="Sửa thông báo"
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteId(item.id)}
                        title="Xóa thông báo"
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saving indicator */}
          {saving && (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <RefreshCw size={12} className="animate-spin" />
              Đang lưu…
            </div>
          )}

        </div>
      </div>
    </>
  );
}
