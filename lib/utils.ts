import type { Heading } from '@/types/content';

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTHS_ID_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatDate(iso: string, long = false): string {
  const d = new Date(iso);
  const months = long ? MONTHS_ID_LONG : MONTHS_ID;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hari ini';
  if (days === 1) return 'kemarin';
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}

// Slugify Indonesian text for heading anchors
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Extract H2/H3 from MDX source for TOC
export function extractToc(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      headings.push({ id: slugify(text), text, level });
    }
  }
  return headings;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format an ISO date as relative time in Indonesian.
 *   <60s          → "baru saja"
 *   <60m          → "5 menit lalu"
 *   <24h          → "3 jam lalu"
 *   <7 days       → "2 hari lalu"
 *   <30 days      → "3 minggu lalu"
 *   else          → "12 Mei 2026"
 */
export function relativeTimeId(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffSec = (Date.now() - then) / 1000;

  if (diffSec < 60) return 'baru saja';
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} menit lalu`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} jam lalu`;
  }
  if (diffSec < 86400 * 7) {
    const d = Math.floor(diffSec / 86400);
    return `${d} hari lalu`;
  }
  if (diffSec < 86400 * 30) {
    const w = Math.floor(diffSec / (86400 * 7));
    return `${w} minggu lalu`;
  }
  // Fall back to absolute date for older posts
  return formatDate(iso);
}
