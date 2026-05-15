import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { ClientCodeBlock } from './client-code-block';

export const mdxComponents: MDXComponents = {
  // rehype-pretty-code wraps <pre> with data-language, etc.
  // We wrap it with a client component that adds the copy button on hover.
  pre: (props) => <ClientCodeBlock {...props} />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components, ...mdxComponents };
}
