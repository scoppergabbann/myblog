export type MonologCategorySlug = string;

export type MonologCategory = {
  id: number;
  slug: MonologCategorySlug;
  label: string;
  sortOrder: number;
};

export type MonologStatus = 'draft' | 'published';

export type MonologEpisodeRecord = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  categoryLabel: string;
  audioUrl: string;
  audioPath: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  status: MonologStatus;
  transcript: string | null;
  reflection: string | null;
  tags: string[];
  isPinned: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublishedMonologEpisode = MonologEpisodeRecord & {
  status: 'published';
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
  archivedAt: null;
};
