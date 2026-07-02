import clsx from 'clsx';

interface Props {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className, title }: Props) {
  return (
    <div className={clsx('rounded-lg border bg-[var(--surface)] border-[var(--border)]', className)}>
      {title && (
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  label, value, sub, color, variant = 'default'
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  variant?: 'default' | 'glass';
}) {
  if (variant === 'glass') {
    return (
      <div className="relative group overflow-hidden rounded-xl border border-white/[0.05] bg-slate-900/40 p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-white/[0.1] hover:bg-slate-900/60">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={clsx('text-2xl font-black tracking-tight', color ?? 'text-white')}>
            {value}
          </p>
          {sub && <span className="text-[10px] text-slate-500 font-medium">{sub}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-[var(--surface)] border-[var(--border)] p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs text-[var(--text-muted)] mb-1 font-medium">{label}</p>
      <p className={clsx('text-2xl font-bold tracking-tight', color ?? 'text-[var(--text)]')}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1 opacity-70">{sub}</p>}
    </div>
  );
}
