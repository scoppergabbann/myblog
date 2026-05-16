export default function Loading() {
  return (
    <div className="mx-auto max-w-[680px] px-6">
      <div className="py-20 pb-10">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="mb-3 h-9 w-32 rounded-md bg-[var(--color-paper-2)]" />
          <div className="h-5 w-full max-w-[480px] rounded-md bg-[var(--color-paper-2)]" />
        </div>

        {/* Search + tags skeleton */}
        <div className="mb-7 flex flex-wrap items-center gap-5 border-b border-[var(--color-line)] pb-4">
          <div className="h-9 min-w-[200px] flex-1 rounded-lg bg-[var(--color-paper-2)]" />
          <div className="flex gap-1.5">
            {[24, 32, 28, 36].map((w, i) => (
              <div
                key={i}
                className="h-6 rounded-full bg-[var(--color-paper-2)]"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        </div>

        {/* List skeleton — 6 rows */}
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-baseline gap-6 border-b border-[var(--color-line)] py-[18px] last:border-b-0 max-sm:flex-col max-sm:gap-1.5"
            >
              <div className="h-3 w-[80px] flex-shrink-0 rounded-sm bg-[var(--color-paper-2)]" />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 rounded-md bg-[var(--color-paper-2)]"
                  style={{ width: `${65 + ((i * 7) % 30)}%` }}
                />
                <div
                  className="h-3 rounded-md bg-[var(--color-paper-2)] opacity-70"
                  style={{ width: `${75 + ((i * 5) % 20)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle pulse animation on all skeleton blocks */}
      <style>{`
        .mx-auto > .py-20 [class*="bg-[var(--color-paper-2)]"] {
          animation: skeletonPulse 1.4s ease-in-out infinite;
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mx-auto > .py-20 [class*="bg-[var(--color-paper-2)]"] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
