'use client';

import { useEffect, useState } from 'react';
import { incrementView } from '@/app/writing/[slug]/reaction-actions';

export function ViewCounter({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    incrementView(slug).then((newCount) => {
      if (!cancelled && newCount !== null) setCount(newCount);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <span>
      {count.toLocaleString('id-ID')} {count === 1 ? 'view' : 'views'}
    </span>
  );
}
