/**
 * Parse a Spotify URL or share string and return its embed iframe URL.
 *
 * Accepts:
 * - Full URLs:
 *   https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
 *   https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
 *   https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3
 *   https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
 * - URLs with query params (?si=...) — stripped
 * - Embed URLs (https://open.spotify.com/embed/...) — passed through
 * - Bare URIs: spotify:track:4cOdK2wGLETKBW3PvgPWqT
 * - Empty/null/whitespace → returns null
 *
 * Returns null if the input is invalid or unsupported.
 */
export function parseSpotifyEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // spotify: URI scheme
  const uriMatch = raw.match(/^spotify:(track|playlist|album|artist):([A-Za-z0-9]+)$/i);
  if (uriMatch) {
    const [, kind, id] = uriMatch;
    return `https://open.spotify.com/embed/${kind.toLowerCase()}/${id}`;
  }

  // Try parse as URL
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  // Only allow open.spotify.com (no other hosts)
  if (!/^(open\.)?spotify\.com$/i.test(url.hostname)) {
    return null;
  }

  // Path can be: /track/ID, /playlist/ID, /album/ID, /artist/ID
  //              /embed/track/ID, etc.
  //              /intl-id/track/ID (locale prefixes)
  const segments = url.pathname.split('/').filter(Boolean);

  // Drop locale prefix like 'intl-id', 'intl-en'
  if (segments[0]?.startsWith('intl-')) segments.shift();

  // Drop existing 'embed' prefix; we'll add it back
  if (segments[0] === 'embed') segments.shift();

  const [kind, id] = segments;
  if (!kind || !id) return null;
  if (!['track', 'playlist', 'album', 'artist'].includes(kind.toLowerCase())) {
    return null;
  }
  // Spotify IDs are base-62 strings, typically 22 chars. Be lenient.
  if (!/^[A-Za-z0-9]+$/.test(id)) return null;

  return `https://open.spotify.com/embed/${kind.toLowerCase()}/${id}`;
}

export function getSpotifyKind(embedUrl: string): 'track' | 'playlist' | 'album' | 'artist' | null {
  const m = embedUrl.match(/\/embed\/(track|playlist|album|artist)\//);
  return (m?.[1] as 'track' | 'playlist' | 'album' | 'artist') ?? null;
}
