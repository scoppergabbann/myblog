import type { StreamInput } from './now-stream';

export const activityPresets = [
  { label: 'Jogging', context: 'Olahraga · Jogging', symbol: '↗' },
  { label: 'Tenis', context: 'Olahraga · Tenis', symbol: '◉' },
  { label: 'Ngafe', context: 'Ngafe', symbol: '☕' },
  { label: 'Wisata', context: 'Wisata', symbol: '⌁' },
  { label: 'Riding', context: 'Riding', symbol: '↝' },
] as const;

export function newStreamActivity(): StreamInput {
  return {
    title: '', category: 'life', project: '', project_url: '', content: '',
    published_on: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()),
    published: true,
  };
}

export function applyActivityPreset(input: StreamInput, context: string): StreamInput {
  const preset = activityPresets.find(item => item.context === context);
  const previous = activityPresets.find(item => item.context === input.project);
  return {
    ...input, category: 'life', project: preset?.context ?? '', project_url: '',
    title: !input.title.trim() || input.title === previous?.label ? preset?.label ?? '' : input.title,
  };
}
