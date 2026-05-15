'use client';

import { useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as { props: { children?: ReactNode } };
    return extractText(el.props?.children);
  }
  return '';
}

export function ClientCodeBlock(
  props: HTMLAttributes<HTMLPreElement> & { children?: ReactNode }
) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLPreElement>(null);

  const onCopy = async () => {
    const code = ref.current?.innerText ?? extractText(props.children);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // silent
    }
  };

  return (
    <div className="group relative my-[18px]">
      <pre
        ref={ref}
        {...props}
        className={`overflow-x-auto rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4 text-[13.5px] leading-[1.65] ${
          props.className ?? ''
        }`}
      />
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy code"
        className={`absolute right-2.5 top-2.5 rounded-md border bg-[var(--color-paper)] px-2 py-1 font-mono text-[11px] opacity-0 transition-all duration-200 group-hover:opacity-100 ${
          copied
            ? 'border-emerald-500/40 text-emerald-500'
            : 'border-[var(--color-line)] text-[var(--color-ink-3)] hover:border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] hover:text-[var(--color-accent)]'
        }`}
      >
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}
