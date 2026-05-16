'use client';

import { useOptimistic, useState, useTransition } from 'react';
import {
  createNowItem,
  updateNowItem,
  deleteNowItem,
  moveNowItem,
} from './actions';

type Item = {
  id: number;
  section: 'learning' | 'working' | 'consuming';
  role: string;
  content: string;
  display_order: number;
};

type Action =
  | { type: 'add'; item: Item }
  | { type: 'update'; id: number; role: string; content: string }
  | { type: 'delete'; id: number }
  | { type: 'move'; id: number; direction: 'up' | 'down' };

export function NowSectionEditor({
  title,
  section,
  items: initial,
}: {
  title: string;
  section: 'learning' | 'working' | 'consuming';
  items: Item[];
}) {
  const [optimistic, applyOptimistic] = useOptimistic<Item[], Action>(
    initial,
    (state, action) => {
      switch (action.type) {
        case 'add':
          return [action.item, ...state];
        case 'update':
          return state.map((i) =>
            i.id === action.id
              ? { ...i, role: action.role, content: action.content }
              : i
          );
        case 'delete':
          return state.filter((i) => i.id !== action.id);
        case 'move': {
          const idx = state.findIndex((i) => i.id === action.id);
          if (idx < 0) return state;
          const targetIdx = action.direction === 'up' ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= state.length) return state;
          const next = [...state];
          [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
          return next;
        }
      }
    }
  );

  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newContent, setNewContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onAdd = () => {
    if (!newRole.trim() || !newContent.trim()) {
      setError('Role dan content wajib diisi.');
      return;
    }
    setError(null);
    const tempId = -Date.now(); // negative to avoid conflict with real ids
    startTransition(async () => {
      applyOptimistic({
        type: 'add',
        item: {
          id: tempId,
          section,
          role: newRole.trim(),
          content: newContent.trim(),
          display_order: 999999,
        },
      });
      const result = await createNowItem(section, newRole, newContent);
      if (!result.ok) {
        setError(result.error);
      } else {
        setNewRole('');
        setNewContent('');
        setAdding(false);
      }
    });
  };

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
          // {title}
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="font-mono text-[11.5px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-accent)]"
        >
          {adding ? 'cancel' : '+ add item'}
        </button>
      </div>

      {adding && (
        <div className="mb-3 rounded-[10px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper)] p-3">
          <div className="mb-2 flex gap-2 max-sm:flex-col">
            <input
              type="text"
              placeholder="role (e.g., reading, course)"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              maxLength={50}
              className="w-[180px] rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)] max-sm:w-full"
            />
            <input
              type="text"
              placeholder="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onAdd();
              }}
              className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={onAdd}
              className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 font-mono text-[12px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-85"
            >
              add
            </button>
          </div>
          {error && (
            <p className="text-[11.5px] text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}

      {optimistic.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-[var(--color-line)] px-4 py-6 text-center text-[13px] text-[var(--color-ink-3)]">
          Belum ada item. Klik &ldquo;+ add item&rdquo; di atas.
        </p>
      ) : (
        <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)]">
          {optimistic.map((item, idx) => (
            <NowItemRow
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === optimistic.length - 1}
              onMove={(dir) => {
                startTransition(async () => {
                  applyOptimistic({ type: 'move', id: item.id, direction: dir });
                  await moveNowItem(item.id, dir);
                });
              }}
              onSave={(role, content) => {
                startTransition(async () => {
                  applyOptimistic({
                    type: 'update',
                    id: item.id,
                    role,
                    content,
                  });
                  await updateNowItem(item.id, role, content);
                });
              }}
              onDelete={() => {
                if (!confirm('Hapus item ini?')) return;
                startTransition(async () => {
                  applyOptimistic({ type: 'delete', id: item.id });
                  await deleteNowItem(item.id);
                });
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NowItemRow({
  item,
  isFirst,
  isLast,
  onMove,
  onSave,
  onDelete,
}: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: 'up' | 'down') => void;
  onSave: (role: string, content: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(item.role);
  const [content, setContent] = useState(item.content);

  const save = () => {
    if (!role.trim() || !content.trim()) return;
    onSave(role.trim(), content.trim());
    setEditing(false);
  };
  const cancel = () => {
    setRole(item.role);
    setContent(item.content);
    setEditing(false);
  };

  return (
    <div className="border-b border-[var(--color-line)] last:border-b-0">
      {editing ? (
        <div className="flex gap-2 p-3 max-sm:flex-col">
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={50}
            className="w-[180px] rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 font-mono text-[12px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)] max-sm:w-full"
          />
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
            autoFocus
            className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-2.5 py-1.5 text-[13px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
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
        <div className="group flex items-start gap-3 px-4 py-3">
          <span className="mt-0.5 min-w-[70px] flex-shrink-0 font-mono text-[11.5px] text-[var(--color-ink-4)]">
            {item.role}
          </span>
          <p className="flex-1 text-[14px] leading-[1.6] text-[var(--color-ink-2)]">
            {item.content}
          </p>
          <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconBtn
              disabled={isFirst}
              onClick={() => onMove('up')}
              title="Move up"
            >
              ↑
            </IconBtn>
            <IconBtn
              disabled={isLast}
              onClick={() => onMove('down')}
              title="Move down"
            >
              ↓
            </IconBtn>
            <IconBtn onClick={() => setEditing(true)} title="Edit">
              ✎
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete" variant="danger">
              ×
            </IconBtn>
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
