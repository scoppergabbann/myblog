import type { StreamCategory } from '@/lib/now-stream';
export function StreamIcon({ category }: { category: StreamCategory }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {category === 'maintenance' ? <path d="m4 3 17 17-2 2L2 5l2-2Zm11 0a5 5 0 0 0-5 6L3 16a2 2 0 0 0 3 3l7-7a5 5 0 0 0 6-6l-3 3-3-3 3-3Z" /> : category === 'release' ? <><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5" /></> : <path d="M7 15h10l-2 7H9l-2-7ZM5 11h14v4H5zM12 11V5M12 8C7 8 6 5 6 2c4 0 6 2 6 6ZM12 10c0-5 2-7 6-7 0 4-2 7-6 7Z" />}
  </svg>;
}
