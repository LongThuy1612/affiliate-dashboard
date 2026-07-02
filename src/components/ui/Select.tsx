'use client';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface Option { value: string; label: string }

interface Props {
  value?: string;
  onValueChange?: (v: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
}

// Radix Select.Item forbids empty-string values, so we map '' ↔ '__all__' internally.
const EMPTY_SENTINEL = '__all__';
const toInternal = (v?: string) => (v === '' || v === undefined ? EMPTY_SENTINEL : v);
const toExternal = (v: string) => (v === EMPTY_SENTINEL ? '' : v);

export default function Select({ value, onValueChange, options, placeholder, label, className }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>}
      <RadixSelect.Root
        value={toInternal(value)}
        onValueChange={(v) => onValueChange?.(toExternal(v))}
      >
        <RadixSelect.Trigger
          className={clsx(
            'inline-flex items-center justify-between gap-2 rounded-md border',
            'bg-[var(--surface)] border-[var(--border)] px-3 py-2 text-sm',
            'text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]',
            'min-w-[140px]',
            className,
          )}
        >
          <RadixSelect.Value placeholder={placeholder ?? 'Select…'} />
          <RadixSelect.Icon>
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-xl"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((o) => {
                const internal = toInternal(o.value);
                return (
                  <RadixSelect.Item
                    key={internal}
                    value={internal}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text)] rounded cursor-pointer hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)] outline-none"
                  >
                    <RadixSelect.ItemIndicator><Check size={12} /></RadixSelect.ItemIndicator>
                    <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                );
              })}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
