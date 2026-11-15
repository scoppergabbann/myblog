import type { MonologEpisodeInput } from '@/types/monolog';

/**
 * Add new Monolog episodes here. Drafts never appear on the public website.
 * See docs/monolog.md for the publishing checklist and audio hosting options.
 */
export const monologEpisodes = [
  {
    id: 'development-example',
    slug: 'contoh-draft-monolog',
    title: 'Contoh draft Monolog',
    description: 'Metadata contoh untuk pengembangan. Episode ini tidak diterbitkan.',
    category: 'random',
    audioUrl: null,
    durationSeconds: null,
    publishedAt: null,
    status: 'draft',
    transcript: null,
    reflection: null,
    tags: ['contoh'],
  },
] satisfies readonly MonologEpisodeInput[];
