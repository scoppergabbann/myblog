import 'server-only';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code';
import type { MDXComponents } from 'mdx/types';
import type { ReactElement } from 'react';

const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark-dimmed' },
  keepBackground: false,
};

/**
 * Compile an MDX string into a renderable React element.
 *
 * Pipeline:
 *   1. compile() — MDX → JS string (with frontmatter pre-stripped)
 *   2. run() — JS string → React component
 *   3. invoke the component with MDXComponents
 *
 * Runs server-side only (file marked 'server-only').
 * No client bundle bloat — output is plain React tree.
 */
export async function compileMdx(
  source: string,
  components: MDXComponents
): Promise<ReactElement> {
  const compiled = await compile(source, {
    outputFormat: 'function-body',
    development: false,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, prettyCodeOptions] as never,
    ],
  });

  const { default: Content } = await run(String(compiled), {
    ...runtime,
    baseUrl: import.meta.url,
  });

  return Content({ components });
}
