'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/admin/toast';
import { updateSpotifyEmbed } from './actions';
import { parseSpotifyEmbedUrl } from '@/lib/spotify-embed';

export function SpotifyEditor({
  initialUrl,
}: {
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [, startTransition] = useTransition();
  const toast = useToast();

  const dirty = url !== (initialUrl ?? '');
  const parsedPreview = parseSpotifyEmbedUrl(url);

  const onSave = () => {
    setSaved('saving');
    startTransition(async () => {
      const result = await updateSpotifyEmbed(url);
      if (result.ok) {
        toast.success(
          url.trim() ? 'Spotify embed tersimpan.' : 'Spotify embed dihapus.'
        );
        setSaved('saved');
        setTimeout(() => setSaved('idle'), 2000);
      } else {
        toast.error(result.error);
        setSaved('idle');
      }
    });
  };

  const onClear = () => {
    setUrl('');
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-sm font-medium lowercase text-[var(--color-ink-3)]">
          // music (spotify embed)
        </h2>
        {url && (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[11px] text-[var(--color-ink-4)] transition-colors hover:text-[var(--color-accent)]"
          >
            clear
          </button>
        )}
      </div>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://open.spotify.com/playlist/... atau /track/... /album/..."
        maxLength={500}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[12.5px] text-[var(--color-ink)] transition-colors focus:border-[var(--color-accent)]"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saved === 'saving'}
          className="rounded-lg bg-[var(--color-ink)] px-3.5 py-1.5 text-[12.5px] font-medium tracking-tight text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved === 'saving' ? 'Saving...' : url.trim() ? 'Save embed' : 'Clear embed'}
        </button>

        <div className="flex items-center gap-3 text-[11.5px]">
          {url.trim() && !parsedPreview && (
            <span className="text-red-600 dark:text-red-400">
              URL tidak valid
            </span>
          )}
          {url.trim() && parsedPreview && (
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ valid
            </span>
          )}
          {saved === 'saved' && (
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ saved
            </span>
          )}
        </div>
      </div>

      {parsedPreview && (
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[11px] text-[var(--color-ink-4)] hover:text-[var(--color-ink-3)]">
            preview embed
          </summary>
          <div className="mt-2 overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper-2)]">
            <iframe
              title="Spotify embed preview"
              src={`${parsedPreview}?utm_source=generator`}
              width="100%"
              height="152"
              frameBorder={0}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ display: 'block', border: 'none' }}
            />
          </div>
        </details>
      )}

      <p className="mt-2 font-mono text-[11px] text-[var(--color-ink-4)]">
        cara: spotify → share → copy link. paste apapun (track / playlist / album / artist).
      </p>
    </div>
  );
}
