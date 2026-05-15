import { createSupabaseServer } from './supabase/server';
import type { Project, NowData, NowSection } from '@/types/content';

type ProjectRow = {
  title: string;
  description: string;
  stack: string[];
  status: 'live' | 'wip' | 'archived';
  url: string | null;
  github_url: string | null;
};

export async function getAllProjects(): Promise<Project[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('projects')
      .select('title, description, stack, status, url, github_url')
      .order('display_order', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[projects.all]', error);
      return [];
    }
    return (data ?? []).map((r) => {
      const row = r as ProjectRow;
      return {
        title: row.title,
        description: row.description,
        stack: row.stack ?? [],
        status: row.status,
        url: row.url ?? undefined,
        github: row.github_url ?? undefined,
      };
    });
  } catch {
    return [];
  }
}

type NowItemRow = {
  section: 'learning' | 'working' | 'consuming';
  role: string;
  content: string;
};

export async function getNowData(): Promise<NowData> {
  const empty: NowData = {
    updated: new Date().toISOString(),
    learning: [],
    working: [],
    consuming: [],
    focus: '',
  };

  try {
    const supabase = await createSupabaseServer();

    const [itemsRes, metaRes] = await Promise.all([
      supabase
        .from('now_items')
        .select('section, role, content')
        .order('display_order', { ascending: false }),
      supabase.from('now_meta').select('focus, updated_at').eq('id', 1).maybeSingle(),
    ]);

    if (itemsRes.error || metaRes.error) {
      console.error('[now]', itemsRes.error || metaRes.error);
      return empty;
    }

    const learning: NowSection[] = [];
    const working: NowSection[] = [];
    const consuming: NowSection[] = [];

    for (const row of (itemsRes.data ?? []) as NowItemRow[]) {
      const item: NowSection = { role: row.role, text: row.content };
      if (row.section === 'learning') learning.push(item);
      else if (row.section === 'working') working.push(item);
      else if (row.section === 'consuming') consuming.push(item);
    }

    return {
      updated: metaRes.data?.updated_at ?? new Date().toISOString(),
      learning,
      working,
      consuming,
      focus: metaRes.data?.focus ?? '',
    };
  } catch {
    return empty;
  }
}
