import {
  streamReactionOptions,
  type StreamReactionKind,
  type StreamReactionResult,
  type StreamReactionStates,
} from '@/lib/stream-reactions';

export const monologReactionOptions = streamReactionOptions;
export type MonologReactionKind = StreamReactionKind;
export type MonologReactionResult = StreamReactionResult;
export type MonologReactionStates = StreamReactionStates;

export function monologReactionTarget(
  slug: string,
  kind: MonologReactionKind,
): { slug: string; emoji: 'love' | 'fire' } {
  const base = `/monolog/${slug}`;
  return {
    slug: kind === 'cheers' || kind === 'clap' ? `${base}:${kind}` : base,
    emoji: kind === 'fire' ? 'fire' : 'love',
  };
}
