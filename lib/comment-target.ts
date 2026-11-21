export type CommentTargetKind = 'writing' | 'monolog';

const MONOLOG_PREFIX = 'monolog:';

export function commentStorageSlug(kind: CommentTargetKind, slug: string): string {
  return kind === 'monolog' ? `${MONOLOG_PREFIX}${slug}` : slug;
}

export function commentTargetFromStorageSlug(value: string): {
  kind: CommentTargetKind;
  slug: string;
  href: string;
  label: string;
} {
  if (value.startsWith(MONOLOG_PREFIX)) {
    const slug = value.slice(MONOLOG_PREFIX.length);
    return {
      kind: 'monolog',
      slug,
      href: `/monolog/${encodeURIComponent(slug)}#comments`,
      label: `Monolog · ${slug}`,
    };
  }

  return {
    kind: 'writing',
    slug: value,
    href: `/writing/${encodeURIComponent(value)}#comments`,
    label: `Tulisan · ${value}`,
  };
}
