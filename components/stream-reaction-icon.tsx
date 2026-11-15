import { streamReactionOptions, type StreamReactionKind } from '@/lib/stream-reactions';

export function StreamReactionIcon({ kind }: { kind: StreamReactionKind }) {
  if (kind !== 'cheers') return <span className="text-[21px] leading-none">{streamReactionOptions.find(option => option.kind === kind)!.emoji}</span>;
  return <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <g transform="rotate(23 10 20)">
      <path d="M8 7h4v6l2 3v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V16l2-3V7Z" fill="#458b59" stroke="#25623b" strokeWidth="1.2" />
      <path d="M8 6h4v3H8z" fill="#e5b966" /><path d="M6.5 19h7v6h-7z" fill="#f3dba0" /><path d="M9 16v2M9 26v1" stroke="#9edbad" strokeLinecap="round" />
    </g>
    <g transform="rotate(-23 22 20)">
      <path d="M20 7h4v6l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V16l2-3V7Z" fill="#458b59" stroke="#25623b" strokeWidth="1.2" />
      <path d="M20 6h4v3h-4z" fill="#e5b966" /><path d="M18.5 19h7v6h-7z" fill="#f3dba0" /><path d="M21 16v2M21 26v1" stroke="#9edbad" strokeLinecap="round" />
    </g>
    <path d="M16 1v3M10.5 2.5l2 2M21.5 2.5l-2 2" stroke="#e0a544" strokeWidth="1.6" strokeLinecap="round" />
  </svg>;
}
