import type { MetadataRoute } from 'next';
import { getAllWritings } from '@/lib/posts';
import { siteConfig } from '@/lib/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/writing',
    '/projects',
    '/now',
    '/guestbook',
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1.0 : 0.7,
  }));

  const writings = await getAllWritings();
  const writingRoutes = writings.map((w) => ({
    url: `${siteConfig.url}/writing/${w.slug}`,
    lastModified: new Date(w.date),
    changeFrequency: 'yearly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...writingRoutes];
}
