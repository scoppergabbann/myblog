'use client';

import { startTransition, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setMonologReaction } from '@/app/monolog/[slug]/reaction-actions';
import { StreamReactionIcon } from '@/components/stream-reaction-icon';
import {
  monologReactionOptions,
  type MonologReactionKind,
  type MonologReactionStates,
} from '@/lib/monolog-reactions';

const CELEBRATION_STYLES = `
.monolog-celebration{background:rgba(10,9,7,.88);backdrop-filter:blur(10px)}
.monolog-celebration-glow{position:absolute;width:min(72vw,460px);aspect-ratio:1;border-radius:999px;background:radial-gradient(circle,color-mix(in srgb,var(--color-accent) 72%,white) 0 2%,color-mix(in srgb,var(--color-accent) 42%,transparent) 3% 20%,transparent 62%);animation:monolog-celebration-glow 1650ms ease-out both}
.monolog-celebration-card{animation:monolog-celebration-card 520ms cubic-bezier(.2,.85,.25,1) both}
.monolog-celebration-icon{display:grid;width:104px;height:104px;place-items:center;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:color-mix(in srgb,var(--color-accent) 72%,#21130c);font-size:50px;box-shadow:0 0 0 12px rgba(255,255,255,.05)}
.monolog-celebration-spark{position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:999px;background:#f6b86c;animation:monolog-celebration-spark 900ms ease-out both}
.monolog-celebration-spark-1{--spark-x:-150px;--spark-y:-120px}.monolog-celebration-spark-2{--spark-x:145px;--spark-y:-105px;animation-delay:70ms}.monolog-celebration-spark-3{--spark-x:-185px;--spark-y:20px;animation-delay:120ms}.monolog-celebration-spark-4{--spark-x:180px;--spark-y:30px;animation-delay:40ms}.monolog-celebration-spark-5{--spark-x:-105px;--spark-y:145px;animation-delay:90ms}.monolog-celebration-spark-6{--spark-x:115px;--spark-y:140px;animation-delay:150ms}
@keyframes monolog-celebration-glow{0%{opacity:0;transform:scale(.45)}28%,72%{opacity:.82;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}
@keyframes monolog-celebration-card{0%{transform:translateY(20px) scale(.78) rotate(-2deg)}55%{transform:translateY(0) scale(1.06) rotate(1deg)}100%{transform:scale(1) rotate(0)}}
@keyframes monolog-celebration-spark{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}20%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--spark-x)),calc(-50% + var(--spark-y))) scale(1.1)}}
@media (prefers-reduced-motion:reduce){.monolog-celebration,.monolog-celebration-glow,.monolog-celebration-card,.monolog-celebration-spark{animation:none}.monolog-celebration-spark{display:none}}
`;

export function MonologReactions({
  slug,
  title,
  initial,
  compact = false,
}: {
  slug: string;
  title: string;
  initial: MonologReactionStates;
  compact?: boolean;
}) {
  const [states, setStates] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [burst, setBurst] = useState<{ kind: MonologReactionKind; id: number } | null>(null);
  const [celebration, setCelebration] = useState<{ emoji: string; label: string; id: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pending = useRef(false);
  const headingId = useId();

  useEffect(() => setStates(initial), [initial]);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(null), 1650);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  function react(kind: MonologReactionKind) {
    if (pending.current || !states[kind].available) return;
    pending.current = true;
    const previous = states[kind];
    const active = !previous.active;
    setStates((current) => ({
      ...current,
      [kind]: { ...previous, active, count: Math.max(0, previous.count + (active ? 1 : -1)) },
    }));
    setBusy(true);
    setError('');
    setNotice('');
    setBurst((value) => ({ kind, id: (value?.id ?? 0) + 1 }));

    startTransition(() => {
      void (async () => {
        try {
          const result = await setMonologReaction(slug, kind, active);
          if (!result.ok) {
            setStates((current) => ({ ...current, [kind]: previous }));
            setError(result.error);
            return;
          }
          setStates((current) => ({
            ...current,
            [kind]: { ...current[kind], active: result.active, count: result.count ?? current[kind].count },
          }));
          setNotice(result.active ? 'Reaksi tersimpan. Terima kasih!' : 'Reaksi dibatalkan.');
          if (result.active) {
            const option = monologReactionOptions.find((item) => item.kind === kind)!;
            setCelebration((value) => ({ emoji: option.emoji, label: option.label, id: (value?.id ?? 0) + 1 }));
          }
        } catch {
          setStates((current) => ({ ...current, [kind]: previous }));
          setError('Reaksi belum tersimpan. Coba lagi, ya.');
        } finally {
          pending.current = false;
          setBusy(false);
        }
      })();
    });
  }

  return (
    <section aria-labelledby={headingId} className={compact ? 'mt-4' : 'mt-12 border-t border-[var(--color-line)] pt-7'}>
      <div className={`${compact ? 'mb-2' : 'mb-4'} flex flex-wrap items-baseline justify-between gap-2`}>
        <h2 id={headingId} className="font-mono text-[11px] font-normal text-[var(--color-ink-3)]">
          {compact ? '// kasih reaksi' : '// reaksimu setelah mendengar?'}
        </h2>
        {!compact && <span className="font-mono text-[10.5px] text-[var(--color-ink-4)]">anonymous · klik untuk react</span>}
      </div>
      <div role="group" aria-label={`Reaksi untuk Monolog ${title}`} className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {monologReactionOptions.map(({ kind, label, emoji }) => {
          const state = states[kind];
          const animated = burst?.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => react(kind)}
              disabled={busy || !state.available}
              aria-pressed={state.active}
              aria-label={`${state.active ? 'Batalkan' : 'Beri'} reaksi ${label} untuk ${title}. ${state.count} reaksi.`}
              title={state.available ? `${label}${state.active ? ' · klik untuk membatalkan' : ''}` : 'Reaksi sementara tidak tersedia'}
              className={`stream-reaction-button group relative inline-flex items-center justify-center rounded-full border text-sm transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)] ${compact ? 'min-h-9 min-w-[56px] gap-1.5 px-2.5 py-1.5' : 'min-h-11 min-w-[64px] gap-2 px-3 py-2'} ${state.active ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[var(--color-accent)] hover:bg-[var(--color-paper-2)]'}`}
            >
              <span key={animated ? burst.id : 'idle'} className={`stream-reaction-icon inline-flex ${animated ? 'reaction-wiggle' : ''}`} aria-hidden="true">
                <StreamReactionIcon kind={kind} />
              </span>
              <span className="min-w-3 text-xs tabular-nums">{state.count}</span>
              {animated && state.active && (
                <span key={`burst-${burst.id}`} aria-hidden="true" className="stream-reaction-burst pointer-events-none absolute inset-0">
                  <span>{emoji}</span><span>{emoji}</span><span>{emoji}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <span role="status" className="sr-only">{notice}</span>
      {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {monologReactionOptions.every(({ kind }) => !states[kind].available) && (
        <p className="mt-2 text-xs text-[var(--color-ink-3)]">Reaksi sementara belum tersedia.</p>
      )}
      {mounted && celebration && createPortal(
        <>
          <style>{CELEBRATION_STYLES}</style>
          <div key={celebration.id} className="monolog-celebration pointer-events-none fixed inset-0 z-[120] grid place-items-center bg-black/80 px-6 backdrop-blur-md" aria-hidden="true">
            <div className="monolog-celebration-glow" />
            <div className="monolog-celebration-card relative z-10 rounded-[30px] border border-white/15 bg-[#1b1815] px-8 py-9 text-center">
              <div className="monolog-celebration-icon mx-auto bg-[var(--color-accent)]" aria-hidden="true">{celebration.emoji}</div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">reaksi tersimpan</p>
              <p className="mt-1 text-[30px] font-medium tracking-[-0.04em] text-white">Mantap!</p>
              <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-white/70">
                {celebration.label} untuk “{title}” ikut meramaikan koleksi.
              </p>
            </div>
            <span className="monolog-celebration-spark monolog-celebration-spark-1" />
            <span className="monolog-celebration-spark monolog-celebration-spark-2" />
            <span className="monolog-celebration-spark monolog-celebration-spark-3" />
            <span className="monolog-celebration-spark monolog-celebration-spark-4" />
            <span className="monolog-celebration-spark monolog-celebration-spark-5" />
            <span className="monolog-celebration-spark monolog-celebration-spark-6" />
          </div>
        </>,
        document.body,
      )}
    </section>
  );
}
