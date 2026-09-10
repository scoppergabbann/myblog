import type { MetadataRoute } from 'next';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/writing',
    '/projects',
    '/library',
    '/now',
    '/guestbook',
    '/uses',
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1.0 : 0.7,
  }));

  const { data, error } = await createSupabaseAdmin()
    .from('posts').select('slug, tags, updated_at').eq('status', 'published');
  // Do not return an incomplete successful sitemap during a database outage.
  if (error) throw new Error('Unable to load published sitemap entries');
  const writings = data ?? [];
  const writingRoutes = writings.map((w) => ({
    url: `${siteConfig.url}/writing/${encodeURIComponent(w.slug)}`,
    ...(w.updated_at && Number.isFinite(Date.parse(w.updated_at))
      ? { lastModified: new Date(w.updated_at) } : {}),
    changeFrequency: 'yearly' as const,
    priority: 0.8,
  }));

  const tags = new Set<string>();
  for (const w of writings) {
    for (const tag of w.tags ?? []) tags.add(tag.toLowerCase());
  }
  return [...staticRoutes, ...writingRoutes, ...[...tags].sort().map((tag) => ({
    url: `${siteConfig.url}/writing/tag/${encodeURIComponent(tag)}`,
  }))];
}
