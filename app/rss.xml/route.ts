import { Feed } from 'feed';
import { getAllWritings } from '@/lib/posts';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 300; // Refresh feed every 5 minutes

export async function GET() {
  const writings = await getAllWritings();

  const feed = new Feed({
    title: `${siteConfig.name} — writings`,
    description: siteConfig.description,
    id: siteConfig.url,
    link: siteConfig.url,
    language: 'id',
    copyright: `© ${new Date().getFullYear()} ${siteConfig.name}`,
    updated: writings[0] ? new Date(writings[0].date) : new Date(),
    feedLinks: {
      rss2: `${siteConfig.url}/rss.xml`,
    },
    author: {
      name: siteConfig.author.name,
      email: siteConfig.author.email,
    },
  });

  for (const w of writings) {
    feed.addItem({
      title: w.title,
      id: `${siteConfig.url}/writing/${w.slug}`,
      link: `${siteConfig.url}/writing/${w.slug}`,
      description: w.summary,
      date: new Date(w.date),
      category: w.tags.map((t) => ({ name: t })),
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
