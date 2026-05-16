'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback to no-op in case provider is missing — don't crash
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), kind === 'error' ? 5000 : 3000);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast('success', m),
    error: (m) => toast('error', m),
    info: (m) => toast('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[300] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const styles: Record<ToastKind, { border: string; bg: string; accent: string; label: string }> = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-[var(--color-paper)]',
      accent: 'text-emerald-600 dark:text-emerald-400',
      label: '✓',
    },
    error: {
      border: 'border-red-500/40',
      bg: 'bg-[var(--color-paper)]',
      accent: 'text-red-600 dark:text-red-400',
      label: '×',
    },
    info: {
      border: 'border-[var(--color-line-2)]',
      bg: 'bg-[var(--color-paper)]',
      accent: 'text-[var(--color-ink-3)]',
      label: '·',
    },
  };
  const s = styles[toast.kind];

  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border ${s.border} ${s.bg} px-3.5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-250`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(6px)',
        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <span
        className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center font-mono text-[14px] leading-none ${s.accent}`}
      >
        {s.label}
      </span>
      <p className="flex-1 text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-mono text-[14px] text-[var(--color-ink-4)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink-2)]"
      >
        ×
      </button>
    </div>
  );
}
