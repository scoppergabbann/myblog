import { getSpotifyKind } from '@/lib/spotify-embed';

type Props = {
  embedUrl: string;
};

/**
 * Compact Spotify embed (~152px). Mirrors the small "player" style
 * with album art + track list scroll on the right.
 *
 * Uses lazy loading so the iframe doesn't block the rest of /now.
 * Adds title attribute for screen readers.
 */
export function SpotifyEmbed({ embedUrl }: Props) {
  const kind = getSpotifyKind(embedUrl);
  const label =
    kind === 'track'
      ? 'Spotify track'
      : kind === 'album'
        ? 'Spotify album'
        : kind === 'artist'
          ? 'Spotify artist'
          : 'Spotify playlist';

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--color-line)] bg-[var(--color-paper-2)]">
      <iframe
        title={label}
        src={`${embedUrl}?utm_source=generator`}
        width="100%"
        height="152"
        frameBorder={0}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ display: 'block', border: 'none' }}
      />
    </div>
  );
}
