/* eslint-disable @next/next/no-img-element */

export function Avatar({
  src,
  login,
  name,
  size = 36,
}: {
  src?: string;
  login: string;
  name: string;
  size?: number;
}) {
  // Lock width AND height via inline style + flex-shrink-0 so the avatar
  // never gets stretched by parent flexbox when sibling content grows.
  const dimensions = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    maxWidth: `${size}px`,
    maxHeight: `${size}px`,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} (@${login})`}
        width={size}
        height={size}
        style={dimensions}
        className="flex-shrink-0 rounded-full border border-[var(--color-line)] object-cover"
      />
    );
  }
  // Fallback: first letter on accent background
  const initial = name.charAt(0).toUpperCase() || '?';
  return (
    <div
      style={dimensions}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] font-mono text-[14px] font-medium text-[var(--color-accent)]"
    >
      {initial}
    </div>
  );
}
