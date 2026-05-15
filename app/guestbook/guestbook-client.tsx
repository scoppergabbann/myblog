'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';

type Entry = { name: string; date: string; msg: string };

export function GuestbookClient({
  initialEntries,
}: {
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const submit = () => {
    if (!name.trim() || !msg.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    setEntries([{ name: name.trim(), date: today, msg: msg.trim() }, ...entries]);
    setName('');
    setMsg('');
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mb-9 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-paper)] p-5"
      >
        <input
          type="text"
          placeholder="Nama (atau anonim)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          className="mb-3 w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <textarea
          placeholder="Tulis sesuatu yang baik..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={280}
          required
          className="mb-3 min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-ink)] px-[18px] py-2.5 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 active:scale-[0.98]"
        >
          Kirim pesan
        </button>
      </form>

      <div className="flex flex-col">
        {entries.map((g, idx) => (
          <div
            key={idx}
            className="border-b border-[var(--color-line)] py-[18px] last:border-b-0"
          >
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[14.5px] font-medium text-[var(--color-ink)]">
                {g.name}
              </span>
              <span className="font-mono text-[11px] text-[var(--color-ink-4)]">
                {formatDate(g.date)}
              </span>
            </div>
            <p className="text-[14px] leading-[1.6] text-[var(--color-ink-2)]">
              {g.msg}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
