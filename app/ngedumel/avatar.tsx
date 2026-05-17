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
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} (@${login})`}
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full border border-[var(--color-line)] object-cover"
      />
    );
  }
  // Fallback: first letter on accent background
  const initial = name.charAt(0).toUpperCase() || '?';
  return (
    <div
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] font-mono text-[14px] font-medium text-[var(--color-accent)]"
    >
      {initial}
    </div>
  );
}
