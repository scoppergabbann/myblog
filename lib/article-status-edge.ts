// Fetch only existence before streaming; never expose content or service keys.
export async function articleStatus(slug: string, preview: string | null): Promise<200 | 404 | 503> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 503;
  try {
    let includeDraft = false;
    if (preview && process.env.ADMIN_SECRET) {
      const encoder = new TextEncoder();
      const signingKey = await crypto.subtle.importKey('raw', encoder.encode(process.env.ADMIN_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(`draft:${slug}`));
      const expected = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
      let difference = expected.length ^ preview.length;
      for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ (preview.charCodeAt(i) || 0);
      includeDraft = difference === 0;
    }
    const query = new URLSearchParams({ select: 'slug', slug: `eq.${slug}`, limit: '1' });
    if (!includeDraft) query.set('status', 'eq.published');
    const response = await fetch(`${url}/rest/v1/posts?${query}`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return 503;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return 503;
    return rows.length ? 200 : 404;
  } catch {
    return 503;
  }
}
