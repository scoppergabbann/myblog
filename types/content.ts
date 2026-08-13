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
  isPremium: boolean;
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

export type QuickLink = {
  id: number;
  label: string;
  href: string;
};

export type HomeData = {
  monoLabel: string;
  heroIntro: string;
  heroAccent1: string;
  heroAccent2: string;
  heroAccent3: string;
  heroOutro: string;
  lead: string;
  location: string;
  timezone: string;
  estYear: string;
  focusTitle: string;
  focusBody: string;
  quickLinks: QuickLink[];
};

export type StackItem = {
  id: number;
  label: string;
  value: string;
};

export type AboutData = {
  title: string;
  subtitle: string;
  content: string;
  contactEmail: string;
  contactIntro: string;
  stack: StackItem[];
};
