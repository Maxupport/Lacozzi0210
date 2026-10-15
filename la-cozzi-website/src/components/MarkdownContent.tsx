import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { getYouTubeId } from '@/lib/utils';

// 前台文章、夥伴介紹與後台即時預覽共用同一套渲染，確保「預覽 = 上線樣子」。
// 規則：單獨一行的 YouTube 網址會自動變成嵌入影片。

function YouTubeEmbed({ id }: { id: string }) {
  return (
    <span className="not-prose block aspect-video w-full rounded-organic-2 overflow-hidden border-2 border-stone-800 my-8 shadow-lg bg-stone-950">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        className="w-full h-full"
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </span>
  );
}

function onlyYouTubeLink(children: ReactNode): string {
  const arr = Array.isArray(children) ? children.filter((c) => !(typeof c === 'string' && c.trim() === '')) : [children];
  if (arr.length !== 1) return '';
  const child = arr[0] as { props?: { href?: string } };
  return getYouTubeId(child?.props?.href);
}

const components: Components = {
  p({ children, node, ...props }) {
    void node;
    const id = onlyYouTubeLink(children);
    if (id) return <YouTubeEmbed id={id} />;
    return <p {...props}>{children}</p>;
  },
  a({ href, children, node, ...props }) {
    void node;
    const external = !!href && /^https?:\/\//.test(href);
    return (
      <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  },
  img({ src, alt, node, ...props }) {
    void node;
    if (!src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" {...props} />
    );
  },
};

export default function MarkdownContent({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
