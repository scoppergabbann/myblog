export type MonologCategorySlug =
  | 'menuju-nikah'
  | 'karier'
  | 'olahraga'
  | 'hobi'
  | 'random';

export type MonologStatus = 'draft' | 'published';

export type MonologEpisodeRecord = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  audioUrl: string;
  audioPath: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  status: MonologStatus;
  transcript: string | null;
  reflection: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type PublishedMonologEpisode = MonologEpisodeRecord & {
  status: 'published';
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
};
