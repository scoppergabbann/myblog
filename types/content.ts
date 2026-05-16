export type WritingFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft?: boolean;
};

export type Writing = WritingFrontmatter & {
  slug: string;
  content: string;
  readingTime: string;
};

export type Project = {
  title: string;
  description: string;
  stack: string[];
  status: 'live' | 'wip' | 'archived';
  url?: string;
  github?: string;
};

export type NowSection = {
  role: string;
  text: string;
};

export type NowData = {
  updated: string;
  learning: NowSection[];
  working: NowSection[];
  consuming: NowSection[];
  focus: string;
  spotifyEmbedUrl: string | null;
};

export type Heading = {
  id: string;
  text: string;
  level: number;
};
