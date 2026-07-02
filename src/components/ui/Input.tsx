import clsx from 'clsx';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function Input({ label, hint, error, className, id, ...rest }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'rounded-md border bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm',
          'text-[var(--text)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]',
          error && 'border-red-500',
          className,
        )}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-[var(--text-muted)] opacity-70">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
