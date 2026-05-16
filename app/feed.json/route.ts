import { getAllWritings } from '@/lib/posts';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export async function GET() {
  const writings = await getAllWritings();

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: siteConfig.name,
    home_page_url: siteConfig.url,
    feed_url: `${siteConfig.url}/feed.json`,
    description: siteConfig.description,
    icon: `${siteConfig.url}/apple-icon.png`,
    favicon: `${siteConfig.url}/favicon-32.png`,
    language: siteConfig.locale.startsWith('id') ? 'id' : 'en',
    authors: [
      {
        name: siteConfig.author.name,
        url: siteConfig.url,
      },
    ],
    items: writings.map((w) => ({
      id: `${siteConfig.url}/writing/${w.slug}`,
      url: `${siteConfig.url}/writing/${w.slug}`,
      title: w.title,
      summary: w.summary,
      content_text: w.summary, // Plain text fallback
      date_published: new Date(w.date).toISOString(),
      tags: w.tags,
      author: {
        name: siteConfig.author.name,
      },
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'content-type': 'application/feed+json; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
