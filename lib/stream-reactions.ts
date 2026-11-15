export const streamReactionOptions = [
  { kind: 'heart', emoji: '❤️', label: 'Suka' },
  { kind: 'cheers', emoji: '🍾', label: 'Bersulang' },
  { kind: 'fire', emoji: '🔥', label: 'Semangat' },
  { kind: 'clap', emoji: '👏', label: 'Keren' },
] as const;
export type StreamReactionKind = (typeof streamReactionOptions)[number]['kind'];
export type StreamReactionState = { count: number; active: boolean; available: boolean };
export type StreamReactionStates = Record<StreamReactionKind, StreamReactionState>;
export type StreamReactionResult = { ok: true; active: boolean; count: number | null } | { ok: false; error: string };
export function isStreamReactionKind(value: unknown): value is StreamReactionKind {
  return streamReactionOptions.some(option => option.kind === value);
}
export function streamReactionTarget(entryId: number, kind: StreamReactionKind): { slug: string; emoji: 'love' | 'fire' } {
  const base = `/now#update-${entryId}`;
  // Preserve existing hearts. New kinds have separate namespaces and reuse the
  // existing positive-vote value, so the shared article enum needs no migration.
  return { slug: kind === 'cheers' || kind === 'clap' ? `${base}:${kind}` : base, emoji: kind === 'fire' ? 'fire' : 'love' };
}
