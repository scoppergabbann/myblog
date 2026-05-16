'use client';

import { useTransition } from 'react';
import { exportSubscribersCsv } from './actions';

export function ExportButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await exportSubscribersCsv();
      if (!result.ok) {
        alert(`Export failed: ${result.error}`);
        return;
      }
      // Trigger browser download
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3.5 py-2 text-[13px] text-[var(--color-ink-3)] transition-all hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {pending ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
