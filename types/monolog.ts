export type MonologCategorySlug =
  | 'menuju-nikah'
  | 'karier'
  | 'olahraga'
  | 'hobi'
  | 'random';

export type MonologStatus = 'draft' | 'published';

export type MonologEpisodeInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: MonologCategorySlug;
  audioUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  status: MonologStatus;
  transcript?: string | null;
  reflection?: string | null;
  tags?: readonly string[];
};

export type MonologEpisodeRecord = Omit<MonologEpisodeInput, 'tags'> & {
  tags: string[];
};

export type PublishedMonologEpisode = MonologEpisodeRecord & {
  status: 'published';
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
};
