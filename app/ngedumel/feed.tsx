'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from './avatar';
import { deleteDumel } from './actions';
import { relativeTimeId, formatDate } from '@/lib/utils';

type Dumel = {
  id: number;
  content: string;
  created_at: string;
};

export function DumelFeed({
  initialDumels,
  avatarUrl,
  displayName,
  login,
}: {
  initialDumels: Dumel[];
  avatarUrl?: string;
  displayName: string;
  login: string;
}) {
  const [optimistic, applyOptimistic] = useOptimistic<Dumel[], { type: 'delete'; id: number }>(
    initialDumels,
    (state, action) => state.filter((d) => d.id !== action.id)
  );
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (optimistic.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[var(--color-line-2)] bg-[var(--color-paper)] px-6 py-12 text-center">
        <div className="mb-2 font-mono text-[11.5px] uppercase tracking-wide text-[var(--color-ink-3)]">
          // belum ada dumel
        </div>
        <p className="text-sm text-[var(--color-ink-3)]">
          Tulis sesuatu di atas. Hanya kamu yang bisa lihat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {optimistic.map((d) => (
        <DumelCard
          key={d.id}
          dumel={d}
          avatarUrl={avatarUrl}
          displayName={displayName}
          login={login}
          onDelete={() => {
            if (!confirm('Hapus dumel ini?')) return;
            startTransition(async () => {
              applyOptimistic({ type: 'delete', id: d.id });
              const result = await deleteDumel(d.id);
              if (result.ok) {
                router.refresh();
              }
            });
          }}
        />
      ))}
    </div>
  );
}

function DumelCard({
  dumel,
  avatarUrl,
  displayName,
  login,
  onDelete,
}: {
  dumel: Dumel;
  avatarUrl?: string;
  displayName: string;
  login: string;
  onDelete: () => void;
}) {
  return (
    <article className="group rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition-colors hover:border-[var(--color-line-2)] sm:p-4">
      <header className="mb-2 flex items-start gap-2.5 sm:gap-3">
        <Avatar src={avatarUrl} login={login} name={displayName} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-medium text-[var(--color-ink)] sm:text-[14.5px]">
              {displayName}
            </span>
            <span className="truncate font-mono text-[11.5px] text-[var(--color-ink-4)]">
              @{login}
            </span>
          </div>
          <time
            dateTime={dumel.created_at}
            title={formatDate(dumel.created_at, true)}
            className="block font-mono text-[11px] text-[var(--color-ink-4)]"
          >
            {relativeTimeId(dumel.created_at)}
          </time>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete dumel"
          title="Hapus"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-ink-4)] transition-all hover:bg-red-500/10 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:text-red-400"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </header>
      <div className="ml-0 whitespace-pre-wrap break-words text-[14.5px] leading-[1.55] text-[var(--color-ink)] sm:ml-[46px] sm:text-[15px]">
        {dumel.content}
      </div>
    </article>
  );
}
