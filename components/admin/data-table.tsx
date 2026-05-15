'use client';

import { useState, useTransition, useMemo, type ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  width?: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export type BulkAction<T> = {
  label: string;
  variant?: 'default' | 'danger';
  onAction: (selected: T[]) => Promise<void> | void;
  confirm?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  rowId: (row: T) => string | number;
  bulkActions?: BulkAction<T>[];
  emptyMessage?: string;
  filterPlaceholder?: string;
  filterFn?: (row: T, query: string) => boolean;
};

export function DataTable<T>({
  data,
  columns,
  rowId,
  bulkActions = [],
  emptyMessage = 'Tidak ada data.',
  filterPlaceholder = 'Filter...',
  filterFn,
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query.trim() || !filterFn) return data;
    return data.filter((row) => filterFn(row, query.toLowerCase().trim()));
  }, [data, query, filterFn]);

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(rowId(r)));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(rowId)));
  };

  const toggle = (id: string | number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runBulk = async (action: BulkAction<T>) => {
    if (action.confirm && !confirm(action.confirm)) return;
    const rows = filtered.filter((r) => selected.has(rowId(r)));
    startTransition(async () => {
      await action.onAction(rows);
      setSelected(new Set());
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-3">
        <input
          type="text"
          placeholder={filterPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />

        {bulkActions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11.5px] text-[var(--color-ink-3)]">
              {someSelected ? `${selected.size} selected` : 'select rows'}
            </span>
            {bulkActions.map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={!someSelected || isPending}
                onClick={() => runBulk(a)}
                className={`rounded-md border px-2.5 py-1 font-mono text-[12px] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  a.variant === 'danger'
                    ? 'border-red-500/30 text-red-600 hover:border-red-500/60 hover:bg-red-500/5 dark:text-red-400'
                    : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[10px] border border-[var(--color-line)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-paper-2)]">
              {bulkActions.length > 0 && (
                <th className="w-[36px] px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="cursor-pointer accent-[var(--color-accent)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-3 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-3)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="px-3 py-8 text-center text-[var(--color-ink-3)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const id = rowId(row);
                const isSel = selected.has(id);
                return (
                  <tr
                    key={id}
                    className={`border-b border-[var(--color-line)] last:border-b-0 transition-colors ${
                      isSel ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-paper-2)]'
                    }`}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(id)}
                          aria-label={`Select row ${id}`}
                          className="cursor-pointer accent-[var(--color-accent)]"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-2.5 align-top text-[var(--color-ink-2)] ${col.className ?? ''}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 font-mono text-[11px] text-[var(--color-ink-4)]">
        showing {filtered.length} of {data.length}
        {isPending && ' · updating...'}
      </div>
    </div>
  );
}
