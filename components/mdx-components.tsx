import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { ClientCodeBlock } from './client-code-block';
import { Figure, Callout } from './mdx-custom';

export const mdxComponents: MDXComponents = {
  // rehype-pretty-code wraps <pre> with data-language, etc.
  // We wrap it with a client component that adds the copy button on hover.
  pre: (props) => <ClientCodeBlock {...props} />,
  // Custom components available in MDX
  Figure,
  Callout,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, ...mdxComponents };
}
