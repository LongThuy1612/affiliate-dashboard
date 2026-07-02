import clsx from 'clsx';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

const variants: Record<Variant, string> = {
  default:  'bg-[var(--surface-2)] text-[var(--text)]',
  success:  'bg-green-900/40 text-green-400',
  warning:  'bg-amber-900/40 text-amber-400',
  danger:   'bg-red-900/40 text-red-400',
  accent:   'bg-indigo-900/40 text-indigo-300',
  muted:    'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
