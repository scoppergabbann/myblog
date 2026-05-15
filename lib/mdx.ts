import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTimeFn from 'reading-time';
import type { Writing, WritingFrontmatter } from '@/types/content';

const WRITINGS_DIR = path.join(process.cwd(), 'content', 'writings');

export function getAllWritingSlugs(): string[] {
  if (!fs.existsSync(WRITINGS_DIR)) return [];
  return fs
    .readdirSync(WRITINGS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getWritingBySlug(slug: string): Writing | null {
  const fullPath = path.join(WRITINGS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const fm = data as WritingFrontmatter;

  if (fm.draft && process.env.NODE_ENV === 'production') return null;

  const stats = readingTimeFn(content);

  return {
    ...fm,
    slug,
    content,
    readingTime: `${Math.ceil(stats.minutes)} min`,
  };
}

export function getAllWritings(): Writing[] {
  return getAllWritingSlugs()
    .map((slug) => getWritingBySlug(slug))
    .filter((w): w is Writing => w !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllWritings().forEach((w) => w.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}
