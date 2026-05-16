'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useToast } from '@/components/admin/toast';
import {
  createQuickLink,
  updateQuickLink,
  deleteQuickLink,
  moveQuickLink,
} from './actions';

type Link = { id: number; label: string; href: string };

type Action =
  | { type: 'add'; item: Link }
  | { type: 'update'; id: number; label: string; href: string }
  | { type: 'delete'; id: number }
  | { type: 'move'; id: number; direction: 'up' | 'down' };

export function QuickLinksEditor({ initial }: { initial: Link[] }) {
  const [optimistic, applyOptimistic] = useOptimistic<Link[], Action>(
    initial,
    (state, action) => {
      switch (action.type) {
        case 'add':
          return [action.item, ...state];
        case 'update':
          return state.map((l) =>
            l.id === action.id
              ? { ...l, label: action.label, href: action.href }
              : l
          );
        case 'delete':
          return state.filter((l) => l.id !== action.id);
        case 'move': {
          const idx = state.findIndex((l) => l.id === action.id);
          if (idx < 0) return state;
          const target = action.direction === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= state.length) return state;
          const next = [...state];
          [next[idx], next[target]] = [next[target], next[idx]];
          return next;
        }
      }
    }
  );

  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');
  const toast = useToast();

  const onAdd = () => {
    if (!newLabel.trim() || !newHref.trim()) {
      toast.error('Label dan href wajib diisi.');
      return;
    }
    const tempId = -Date.now();
    startTransition(async () => {
      applyOptimistic({
        type: 'add',
        item: { id: tempId, label: newLabel.trim(), href: newHref.trim() },
      });
      const result = await createQuickLink(newLabel, newHref);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success('Quick link ditambahkan.');
        setNewLabel('');
        setNewHref('');
        setAdding(false);
      }
    });
  };

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
          // quick links
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          {adding ? 'cancel' : '+ add link'}
        </button>
      </div>

      {adding && (
        <div className="mb-3 rounded-[10px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper)] p-3">
          <div className="flex gap-2 max-sm:flex-col">
            <input
              type="text"
              placeholder="label (e.g., tentang saya)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={60}
              className="w-[200px] rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)] max-sm:w-full"
            />
            <input
              type="text"
              placeholder="href (e.g., /about or https://...)"
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd();
              }}
              className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={onAdd}
              className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 font-mono text-[12px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              add
            </button>
          </div>
        </div>
      )}

      {optimistic.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[var(--color-line)] px-4 py-6 text-center text-[13px] text-[var(--color-ink-3)]">
          Belum ada quick link.
        </p>
      ) : (
        <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)]">
          {optimistic.map((link, idx) => (
            <LinkRow
              key={link.id}
              link={link}
              isFirst={idx === 0}
              isLast={idx === optimistic.length - 1}
              onMove={(dir) => {
                startTransition(async () => {
                  applyOptimistic({ type: 'move', id: link.id, direction: dir });
                  await moveQuickLink(link.id, dir);
                });
              }}
              onSave={(label, href) => {
                startTransition(async () => {
                  applyOptimistic({
                    type: 'update',
                    id: link.id,
                    label,
                    href,
                  });
                  const r = await updateQuickLink(link.id, label, href);
                  if (!r.ok) toast.error(r.error);
                  else toast.success('Link diperbarui.');
                });
              }}
              onDelete={() => {
                if (!confirm(`Hapus link "${link.label}"?`)) return;
                startTransition(async () => {
                  applyOptimistic({ type: 'delete', id: link.id });
                  const r = await deleteQuickLink(link.id);
                  if (!r.ok) toast.error(r.error);
                });
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LinkRow({
  link,
  isFirst,
  isLast,
  onMove,
  onSave,
  onDelete,
}: {
  link: Link;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: 'up' | 'down') => void;
  onSave: (label: string, href: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(link.label);
  const [href, setHref] = useState(link.href);

  const save = () => {
    if (!label.trim() || !href.trim()) return;
    onSave(label.trim(), href.trim());
    setEditing(false);
  };
  const cancel = () => {
    setLabel(link.label);
    setHref(link.href);
    setEditing(false);
  };

  return (
    <div className="border-b border-[var(--color-line)] last:border-b-0">
      {editing ? (
        <div className="flex gap-2 p-3 max-sm:flex-col">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            className="w-[200px] rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)] max-sm:w-full"
          />
          <input
            type="text"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
            autoFocus
            className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-[var(--color-ink)] px-2.5 py-1.5 font-mono text-[11px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-[var(--color-line)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex items-center gap-3 px-4 py-2.5">
          <span className="min-w-[180px] flex-shrink-0 text-[13.5px] text-[var(--color-ink)]">
            {link.label}
          </span>
          <span className="flex-1 truncate font-mono text-[11.5px] text-[var(--color-ink-3)]">
            {link.href}
          </span>
          <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconBtn disabled={isFirst} onClick={() => onMove('up')} title="Move up">↑</IconBtn>
            <IconBtn disabled={isLast} onClick={() => onMove('down')} title="Move down">↓</IconBtn>
            <IconBtn onClick={() => setEditing(true)} title="Edit">✎</IconBtn>
            <IconBtn onClick={onDelete} title="Delete" variant="danger">×</IconBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  disabled,
  onClick,
  title,
  variant = 'default',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        variant === 'danger'
          ? 'text-[var(--color-ink-3)] hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
          : 'text-[var(--color-ink-3)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-accent)]'
      }`}
    >
      {children}
    </button>
  );
}
