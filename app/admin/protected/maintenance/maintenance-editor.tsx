'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/components/admin/toast';
import { updateMaintenance, type MaintenanceFormState } from './actions';

type Initial = {
  maintenance_enabled: boolean;
  maintenance_title: string;
  maintenance_message: string;
  maintenance_eta: string;
  maintenance_contact: string;
};

export function MaintenanceEditor({ initial }: { initial: Initial }) {
  const toast = useToast();
  const [state, formAction] = useActionState<MaintenanceFormState, FormData>(
    async (prev, fd) => {
      const result = await updateMaintenance(prev, fd);
      if (result?.ok) {
        toast.success(result.message);
      } else if (result && !result.ok) {
        toast.error(result.error);
      }
      return result;
    },
    null
  );

  // Live preview state — kept in sync with form inputs
  const [enabled, setEnabled] = useState(initial.maintenance_enabled);
  const [title, setTitle] = useState(initial.maintenance_title);
  const [message, setMessage] = useState(initial.maintenance_message);
  const [eta, setEta] = useState(initial.maintenance_eta);
  const [contact, setContact] = useState(initial.maintenance_contact);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={formAction} className="space-y-5">
        {/* Big toggle */}
        <div
          className={`flex items-center justify-between gap-4 rounded-[12px] border p-4 transition-colors ${
            enabled
              ? 'border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] bg-[var(--color-accent-soft)]'
              : 'border-[var(--color-line)] bg-[var(--color-paper)]'
          }`}
        >
          <div className="flex-1">
            <Label noMargin>maintenance mode</Label>
            <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)]">
              {enabled ? (
                <>
                  <strong className="text-[var(--color-accent)]">ON</strong> · visitor sedang di-redirect
                </>
              ) : (
                <>
                  <strong className="text-[var(--color-ink)]">OFF</strong> · site jalan normal
                </>
              )}
            </p>
          </div>
          <Toggle
            name="maintenance_enabled"
            checked={enabled}
            onChange={setEnabled}
          />
        </div>

        <div>
          <Label>title</Label>
          <input
            type="text"
            name="maintenance_title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[15px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <Label>message</Label>
          <textarea
            name="maintenance_message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] leading-[1.55] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
          />
          <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-4)]">
            {message.length}/1000
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div>
            <Label>eta (opsional)</Label>
            <input
              type="text"
              name="maintenance_eta"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              maxLength={200}
              placeholder="kira-kira 30 menit lagi"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <Label>kontak (opsional)</Label>
            <input
              type="text"
              name="maintenance_contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder="halo@belutbakarsurabaya.com"
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--color-line)] pt-4">
          <SubmitButton />
          {state?.ok && (
            <span className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400">
              ✓ tersimpan
            </span>
          )}
        </div>
      </form>

      {/* Live preview */}
      <aside className="space-y-3">
        <div className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
          // preview tampilan visitor
        </div>
        <div className="overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="border-b border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1.5">
            <div className="font-mono text-[10px] text-[var(--color-ink-4)]">
              belutbakarsurabaya.com/maintenance
            </div>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-ink-3)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span>bbs<span className="text-[var(--color-accent)]">/</span></span>
              <span>· maintenance</span>
            </div>
            <h3 className="mb-2 text-[18px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
              {title || 'Title kosong'}
            </h3>
            <p className="mb-3 text-[13px] leading-[1.5] text-[var(--color-ink-2)]">
              {message || 'Message kosong'}
            </p>
            {(eta || contact) && (
              <div className="space-y-1.5 rounded-md border border-[var(--color-line)] p-2.5 text-[12px]">
                {eta && (
                  <div className="flex gap-2">
                    <span className="font-mono text-[10px] uppercase text-[var(--color-ink-4)]">eta</span>
                    <span className="text-[var(--color-ink-2)]">{eta}</span>
                  </div>
                )}
                {contact && (
                  <div className="flex gap-2">
                    <span className="font-mono text-[10px] uppercase text-[var(--color-ink-4)]">kontak</span>
                    <span className="break-all text-[var(--color-accent)]">{contact}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="font-mono text-[10.5px] leading-[1.5] text-[var(--color-ink-4)]">
          Toggle aktif dalam ~30 detik di sisi visitor (cache edge).
        </p>
      </aside>
    </div>
  );
}

function Label({
  children,
  noMargin,
}: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <label
      className={`block font-mono text-[11.5px] uppercase tracking-wider text-[var(--color-ink-3)] ${
        noMargin ? '' : 'mb-1.5'
      }`}
    >
      {children}
    </label>
  );
}

function Toggle({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`absolute inset-0 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-2)]'
        }`}
      />
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  );
}
