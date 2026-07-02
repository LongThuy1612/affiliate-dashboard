'use client';
import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (title: string, opts?: { description?: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: <CheckCircle2 size={16} className="text-green-400 shrink-0" />,
  error:   <AlertCircle  size={16} className="text-red-400   shrink-0" />,
  info:    <Info         size={16} className="text-indigo-400 shrink-0" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  let counter = 0;

  const toast = useCallback((title: string, opts?: { description?: string; type?: ToastType }) => {
    const id = ++counter;
    setItems((prev) => [...prev, { id, title, description: opts?.description, type: opts?.type ?? 'info' }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <Toast.Root
            key={item.id}
            defaultOpen
            duration={4000}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((i) => i.id !== item.id));
            }}
            className={clsx(
              'flex items-start gap-3 rounded-lg border p-4 shadow-xl',
              'bg-[var(--surface)] border-[var(--border)]',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
            )}
          >
            {icons[item.type]}
            <div className="flex-1 min-w-0">
              <Toast.Title className="text-sm font-medium text-[var(--text)]">{item.title}</Toast.Title>
              {item.description && (
                <Toast.Description className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-3">
                  {item.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close className="text-[var(--text-muted)] hover:text-[var(--text)] shrink-0">
              <X size={14} />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 w-80 flex flex-col gap-2" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
