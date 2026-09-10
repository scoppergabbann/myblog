import type { Metadata } from 'next';
import { siteConfig } from './site-config';

export function pageMetadata(path: string, title: string, description: string): Metadata {
  const image = `${siteConfig.url}/api/og?${new URLSearchParams({ title, subtitle: description })}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title, description, type: 'website', url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name, locale: 'id_ID',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    other: { 'og:image:secure_url': image },
  };
}
