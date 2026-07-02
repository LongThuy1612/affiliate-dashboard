'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, limit, onChange }: Props) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pageButtons: (number | '...')[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) pageButtons.push(i);
  } else {
    pageButtons.push(1);
    if (page > 3) pageButtons.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) pageButtons.push(i);
    if (page < pages - 2) pageButtons.push('...');
    pageButtons.push(pages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)]">
        {from}–{to} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] disabled:opacity-30"
        >
          <ChevronLeft size={14} className="text-[var(--text-muted)]" />
        </button>
        {pageButtons.map((b, i) =>
          b === '...' ? (
            <span key={`dot-${i}`} className="px-2 text-[var(--text-muted)] text-xs">…</span>
          ) : (
            <button
              key={b}
              onClick={() => onChange(b as number)}
              className={clsx(
                'w-7 h-7 rounded text-xs',
                b === page
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
              )}
            >
              {b}
            </button>
          ),
        )}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] disabled:opacity-30"
        >
          <ChevronRight size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}
