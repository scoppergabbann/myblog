import { Feed } from 'feed';
import { getStreamEntries } from '@/lib/stream-queries';
import { siteConfig } from '@/lib/site-config';
export const revalidate = 60;
export async function GET() {
  try {
    const entries = await getStreamEntries();
    const feed = new Feed({ title: `${siteConfig.name} — Stream`, description: 'Proyek, pembaruan, eksperimen, dan keseharian.',
      id: `${siteConfig.url}/now`, link: `${siteConfig.url}/now`, language: 'id', copyright: siteConfig.name,
      feedLinks: { rss2: `${siteConfig.url}/now/rss.xml` } });
    for (const entry of entries) feed.addItem({ title: entry.title, id: `${siteConfig.url}/now#update-${entry.id}`,
      link: `${siteConfig.url}/now#update-${entry.id}`, description: entry.content,
      date: new Date(`${entry.published_on}T12:00:00Z`), category: [{ name: entry.category }] });
    return new Response(feed.rss2(), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
  } catch {
    return new Response('Stream sementara tidak tersedia.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
