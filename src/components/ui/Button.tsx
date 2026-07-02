import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
  secondary: 'bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)]',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
