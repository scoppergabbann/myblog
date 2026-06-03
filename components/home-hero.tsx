'use client';

import { useEffect, useMemo, useState } from 'react';

type HomeHeroProps = {
  monoLabel: string;
  heroIntro: string;
  heroAccent1: string;
  heroAccent2: string;
  heroAccent3: string;
  heroOutro: string;
  lead: string;
};

export function HomeHero({
  monoLabel,
  heroIntro,
  heroAccent1,
  heroAccent2,
  heroAccent3,
  heroOutro,
  lead,
}: HomeHeroProps) {
  const segments = useMemo(
    () => [
      { text: `${heroIntro} ` },
      { text: heroAccent1, accent: true },
      { text: ', ' },
      { text: heroAccent2, accent: true },
      { text: ', dan ' },
      { text: heroAccent3, accent: true },
      { text: heroOutro },
    ],
    [heroIntro, heroAccent1, heroAccent2, heroAccent3, heroOutro],
  );
  const fullText = segments.map((segment) => segment.text).join('');
  const fullLength = Array.from(fullText).length;
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisibleChars(fullLength);
      return;
    }

    setVisibleChars(0);
    const interval = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= fullLength) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 42);

    return () => window.clearInterval(interval);
  }, [fullLength]);

  let remainingChars = visibleChars;

  return (
    <>
      <div className="mb-7 flex items-center gap-2.5 font-mono text-xs tracking-wide text-[var(--color-ink-3)]">
        {monoLabel}
        <span className="h-px w-[60px] flex-1 max-w-[60px] bg-[var(--color-line)]" />
      </div>
      <h1
        className="home-typing mb-5 text-[44px] font-medium leading-[1.1] tracking-[-0.04em] text-[var(--color-ink)] max-sm:text-[32px]"
        aria-label={fullText}
      >
        <span className="home-typing-ghost" aria-hidden="true">
          {segments.map((segment, index) => {
            if (segment.accent) {
              return (
                <span key={index} className="text-[var(--color-accent)]">
                  {segment.text}
                </span>
              );
            }

            return <span key={index}>{segment.text}</span>;
          })}
        </span>
        <span className="home-typing-live" aria-hidden="true">
          {segments.map((segment, index) => {
            const chars = Array.from(segment.text);
            const visibleText = chars.slice(0, Math.max(0, remainingChars)).join('');
            remainingChars -= chars.length;

            if (!visibleText) {
              return null;
            }

            if (segment.accent) {
              return (
                <span key={index} className="text-[var(--color-accent)]">
                  {visibleText}
                </span>
              );
            }

            return <span key={index}>{visibleText}</span>;
          })}
          <span className="home-typing-cursor" />
        </span>
      </h1>
      <p className="home-lead-wave mb-6 max-w-[540px] text-[17.5px] leading-[1.65] text-[var(--color-ink-2)]">
        {lead}
      </p>
    </>
  );
}
