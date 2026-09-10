function productionOrigin() {
  const fallback = 'https://belutbakarsurabaya.com';
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || fallback);
    if (url.protocol !== 'https:' || url.hostname === 'localhost' ||
        url.hostname.endsWith('.vercel.app') || /^[\d.]+$/.test(url.hostname)) {
      return fallback;
    }
    return url.origin;
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: 'belutbakarsurabaya',
  shortName: 'bbs/',
  url: productionOrigin(),
  description:
    'A quiet corner on the internet. Catatan, proyek, dan refleksi dari seorang software engineer, writer, dan investor muda.',
  tagline: 'a quiet corner on the internet',
  locale: 'id-ID',
  author: {
    name: 'Penulis',
    email: 'halo@belutbakarsurabaya.com',
    twitter: '@belutbakar',
    github: 'belutbakar',
  },
  nav: [
    { href: '/writing', label: 'writing' },
    { href: '/projects', label: 'projects' },
    { href: '/library', label: 'library' },
    { href: '/now', label: 'now' },
    { href: '/about', label: 'about' },
    { href: '/guestbook', label: 'guestbook' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
