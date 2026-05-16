export const siteConfig = {
  name: 'belutbakarsurabaya',
  shortName: 'bbs/',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://belutbakarsurabaya.com',
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
    { href: '/now', label: 'now' },
    { href: '/about', label: 'about' },
    { href: '/guestbook', label: 'guestbook' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
