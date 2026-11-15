'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { formatAudioDuration } from '@/lib/monolog';

type AudioState = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export function MonologAudioPlayer({
  src,
  title,
  durationSeconds,
}: {
  src: string;
  title: string;
  durationSeconds: number;
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
  const statusText = state === 'error'
    ? 'Audio tidak dapat dimuat.'
    : state === 'loading'
      ? 'Memuat audio…'
      : isPlaying
        ? 'Sedang diputar'
        : 'Siap diputar';

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)]/45 p-3.5">
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
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-line-2)] bg-[var(--color-paper)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="min-w-0 flex-1">
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
            className="h-6 w-full cursor-pointer [accent-color:var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed"
          />
          <div className="mt-0.5 flex items-center justify-between gap-3 font-mono text-[11px] text-[var(--color-ink-4)]">
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
