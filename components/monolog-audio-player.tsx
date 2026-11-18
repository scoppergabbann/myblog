'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { formatAudioDuration } from '@/lib/monolog-shared';

type AudioState = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

const WAVEFORM_BARS = [
  0.24, 0.38, 0.58, 0.42, 0.72, 0.5, 0.32, 0.64, 0.84, 0.56, 0.36,
  0.68, 0.46, 0.78, 0.6, 0.3, 0.52, 0.74, 0.4, 0.66, 0.9, 0.48,
  0.28, 0.62, 0.76, 0.42, 0.7, 0.54, 0.82, 0.44, 0.64, 0.34, 0.72,
  0.5, 0.86, 0.58, 0.38, 0.68, 0.46, 0.76, 0.56, 0.32, 0.6, 0.4,
];

export function MonologAudioPlayer({
  src,
  title,
  durationSeconds,
  variant = 'default',
}: {
  src: string;
  title: string;
  durationSeconds: number;
  variant?: 'default' | 'compact';
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerId = useId();
  const pathname = usePathname();
  const [state, setState] = useState<AudioState>('loading');
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);

  useEffect(() => {
    const pauseOtherPlayers = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== playerId) audioRef.current?.pause();
    };
    window.addEventListener('monolog:play', pauseOtherPlayers);
    return () => {
      window.removeEventListener('monolog:play', pauseOtherPlayers);
      audioRef.current?.pause();
    };
  }, [playerId]);

  useEffect(() => {
    audioRef.current?.pause();
  }, [pathname]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || state === 'error') return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      window.dispatchEvent(new CustomEvent('monolog:play', { detail: playerId }));
      setState('loading');
      await audio.play();
    } catch {
      setState('error');
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setElapsed(value);
  }

  const isPlaying = state === 'playing';
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : durationSeconds;
  const progress = safeDuration > 0 ? Math.min(1, Math.max(0, elapsed / safeDuration)) : 0;
  const playhead = Math.min(WAVEFORM_BARS.length - 1, Math.floor(progress * WAVEFORM_BARS.length));
  const statusText = state === 'error'
    ? 'Audio tidak dapat dimuat.'
    : state === 'loading'
      ? 'Memuat audio…'
      : isPlaying
        ? 'Sedang diputar'
        : 'Siap diputar';

  return (
    <div className={`monolog-player ${variant === 'compact' ? 'rounded-xl bg-[var(--color-paper-2)]/55 px-3 py-2.5' : 'rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/45 p-4'} ${isPlaying ? 'is-playing' : ''}`}>
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration) && nextDuration > 0) setDuration(nextDuration);
          setState('ready');
        }}
        onCanPlay={() => setState((current) => current === 'playing' ? current : 'ready')}
        onPlay={() => setState('playing')}
        onPlaying={() => setState('playing')}
        onPause={() => setState((current) => current === 'error' ? current : 'paused')}
        onWaiting={() => setState('loading')}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onEnded={() => {
          setElapsed(0);
          setState('ready');
        }}
        onError={() => setState('error')}
      >
        Browser Anda tidak mendukung pemutar audio HTML.
      </audio>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          disabled={state === 'error'}
          aria-label={`${isPlaying ? 'Jeda' : 'Putar'} ${title}`}
          className={`inline-flex shrink-0 items-center justify-center rounded-full border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40 ${variant === 'compact' ? 'h-10 w-10' : 'h-12 w-12'} ${isPlaying ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[0_6px_20px_color-mix(in_srgb,var(--color-accent)_24%,transparent)]' : 'border-[var(--color-line-2)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="relative h-10 overflow-hidden rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-accent)]">
            <div className="monolog-waveform pointer-events-none flex h-full items-center gap-[2px]" aria-hidden="true">
              {WAVEFORM_BARS.map((height, index) => {
                const passed = progress > 0 && index <= playhead;
                const head = progress > 0 && index === playhead;
                return (
                  <span
                    key={index}
                    className={`monolog-waveform-bar min-w-[2px] flex-1 rounded-full ${passed ? 'is-past' : ''} ${head ? 'is-head' : ''}`}
                    style={{
                      height: `${Math.round(height * 100)}%`,
                      '--wave-delay': `${-(index % 7) * 61}ms`,
                      '--wave-duration': `${620 + (index % 5) * 74}ms`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={0}
              max={safeDuration}
              step={0.1}
              value={Math.min(elapsed, safeDuration)}
              onChange={(event) => seek(Number(event.currentTarget.value))}
              disabled={state === 'error' || safeDuration <= 0}
              aria-label={`Posisi pemutaran ${title}`}
              aria-valuetext={`${formatAudioDuration(elapsed)} dari ${formatAudioDuration(safeDuration)}`}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 font-mono text-[11px] text-[var(--color-ink-4)]">
            <span>{formatAudioDuration(elapsed)} / {formatAudioDuration(safeDuration)}</span>
            <span aria-live="polite" className={state === 'error' ? 'text-[var(--color-accent)]' : ''}>
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <noscript>
        <audio controls preload="metadata" src={src} className="mt-3 w-full">
          Browser Anda tidak mendukung pemutar audio HTML.
        </audio>
      </noscript>
    </div>
  );
}

function PlayIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10-6.5z" /></svg>;
}

function PauseIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>;
}
