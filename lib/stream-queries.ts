import 'server-only';
import { createSupabasePublic } from './supabase/public';
import { getNowData } from './content-queries';
import type { StreamEntry } from './now-stream';
export async function getStreamEntries(): Promise<StreamEntry[]> {
  const { data, error } = await createSupabasePublic().from('now_entries')
    .select('id, title, category, project, project_url, content, published_on, published')
    .eq('published', true).order('published_on', { ascending: false }).order('id', { ascending: false });
  if (!error) return (data ?? []) as StreamEntry[];
  if (error.code !== 'PGRST205' && error.code !== '42P01') throw new Error('Stream sementara tidak tersedia.');
  const old = await getNowData();
  const groups = [['Sedang belajar', old.learning], ['Sedang dikerjakan', old.working], ['Sedang dikonsumsi', old.consuming]] as const;
  const entries: StreamEntry[] = groups.filter(([, items]) => items.length).map(([title, items], index) => ({
    id: -(index + 1), title, category: 'life', project: '', project_url: '',
    content: items.map(item => `${item.role}: ${item.text}`).join('\n\n'), published_on: old.updated.slice(0, 10), published: true,
  }));
  if (old.focus) entries.push({ id: -4, title: 'Fokus hidup', category: 'life', project: '', project_url: '', content: old.focus, published_on: old.updated.slice(0, 10), published: true });
  return entries;
}
