import Image from 'next/image';

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/**
 * Used in MDX:
 * <Figure src="/images/my-pic.png" alt="..." caption="A caption" width={1200} height={800} />
 *
 * Place images under public/images/.
 */
export function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 800,
  priority = false,
}: FigureProps) {
  return (
    <figure className="my-7">
      <div className="overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper-2)]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="h-auto w-full"
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center font-mono text-[11.5px] text-[var(--color-ink-3)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

type CalloutKind = 'note' | 'warning' | 'tip';

/**
 * Used in MDX:
 * <Callout kind="note">Some inline text or **markdown**.</Callout>
 */
export function Callout({
  kind = 'note',
  children,
}: {
  kind?: CalloutKind;
  children: React.ReactNode;
}) {
  const styles: Record<CalloutKind, { label: string; border: string }> = {
    note: { label: 'catatan', border: 'var(--color-ink-3)' },
    warning: { label: 'perhatian', border: 'var(--color-accent)' },
    tip: { label: 'tips', border: '#10b981' },
  };
  const s = styles[kind];
  return (
    <aside
      className="my-6 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-3 text-[14.5px] leading-[1.65]"
      style={{ borderLeft: `3px solid ${s.border}` }}
    >
      <div
        className="mb-1 font-mono text-[11px] uppercase tracking-wide"
        style={{ color: s.border }}
      >
        // {s.label}
      </div>
      <div className="text-[var(--color-ink-2)]">{children}</div>
    </aside>
  );
}
