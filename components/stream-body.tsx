import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import { safeStreamUrl } from '@/lib/now-stream';
export async function StreamBody({ content }: { content: string }) {
  // Markdown mode disables executable JSX, imports, and expressions.
  const compiled = await compile(content, { format: 'md', outputFormat: 'function-body', remarkPlugins: [remarkGfm] });
  const { default: Content } = await run(String(compiled), runtime);
  return <div className="article-body stream-body"><Content components={{
    a: ({ href, children }) => safeStreamUrl(href ?? '') || /^\/(?!\/)|^#/.test(href ?? '') ? <a href={href}>{children}</a> : <span>{children}</span>,
    img: ({ alt }) => <span>{alt}</span>,
  }} /></div>;
}
