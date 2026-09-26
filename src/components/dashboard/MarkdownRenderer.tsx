import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { NoteHighlight, HighlightColor } from '@/types';

export const HIGHLIGHT_STYLE_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-amber-300/85 text-amber-950 dark:bg-amber-400/30 dark:text-amber-100',
  green:  'bg-emerald-300/85 text-emerald-950 dark:bg-emerald-400/30 dark:text-emerald-100',
  blue:   'bg-sky-300/85 text-sky-950 dark:bg-sky-400/30 dark:text-sky-100',
  purple: 'bg-purple-300/85 text-purple-950 dark:bg-purple-400/30 dark:text-purple-100',
  orange: 'bg-orange-300/85 text-orange-950 dark:bg-orange-400/30 dark:text-orange-100',
};

const preprocessMath = (text: string) => {
  let p = text;
  p = p.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\n\`\`\`math\n${m}\n\`\`\`\n`);
  p = p.replace(/\$([^\$\n]+)\$/g, (_, m) => `\`math-inline:${m}\``);
  return p;
};

function renderHighlightedText(
  text: string,
  highlights: NoteHighlight[],
  onHighlightClick?: (h: NoteHighlight) => void
): React.ReactNode {
  if (!highlights || highlights.length === 0 || !text) {
    return text;
  }

  const activeHighlights = highlights.filter(h => h.text && text.includes(h.text));
  if (activeHighlights.length === 0) {
    return text;
  }

  const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const sorted = [...activeHighlights].sort((a, b) => b.text.length - a.text.length);
  const pattern = new RegExp(`(${sorted.map(h => escapeRegex(h.text)).join('|')})`, 'g');

  const parts = text.split(pattern);
  if (parts.length <= 1) return text;

  return parts.map((part, index) => {
    const match = sorted.find(h => h.text === part);
    if (match) {
      const colorClass = HIGHLIGHT_STYLE_MAP[match.color] || HIGHLIGHT_STYLE_MAP.yellow;
      return (
        <mark
          key={`${match.id}-${index}`}
          data-highlight-id={match.id}
          className={`${colorClass} px-1 py-0.5 rounded-[4px] font-inherit cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] border-b border-black/10 dark:border-white/10 select-text inline`}
          onClick={(e) => {
            e.stopPropagation();
            onHighlightClick?.(match);
          }}
          title="Tap to edit or remove highlight"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

function wrapWithHighlights(
  children: React.ReactNode,
  highlights: NoteHighlight[],
  onHighlightClick?: (h: NoteHighlight) => void
): React.ReactNode {
  if (!highlights || highlights.length === 0 || !children) {
    return children;
  }

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return renderHighlightedText(child, highlights, onHighlightClick);
    }
    if (React.isValidElement(child)) {
      const type = (child as any).type;
      if (type === 'code' || (child.props && child.props.className?.includes('katex'))) {
        return child;
      }
      if (child.props && child.props.children) {
        return React.cloneElement(child, {
          ...child.props,
          children: wrapWithHighlights(child.props.children, highlights, onHighlightClick),
        });
      }
    }
    return child;
  });
}

interface MarkdownRendererProps {
  content: string;
  accentBg?: string;
  accentText?: string;
  highlights?: NoteHighlight[];
  onHighlightClick?: (highlight: NoteHighlight) => void;
}

export default function MarkdownRenderer({
  content,
  accentBg = 'bg-primary/5',
  accentText = 'text-gray-900 dark:text-gray-100',
  highlights = [],
  onHighlightClick,
}: MarkdownRendererProps) {
  const wrap = (nodes: React.ReactNode) => wrapWithHighlights(nodes, highlights, onHighlightClick);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-black mt-8 mb-4 text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{wrap(children)}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-black mt-8 mb-3 text-gray-900 dark:text-gray-100 tracking-tight">{wrap(children)}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{wrap(children)}</h3>,
        p: ({ children }) => <p className="mb-4 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ol>,
        li: ({ children }) => <li className="pl-1">{wrap(children)}</li>,
        strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{wrap(children)}</strong>,
        blockquote: ({ children }) => (
          <blockquote className={`pl-4 border-l-4 border-primary/20 ${accentBg} py-2 pr-4 rounded-r-xl my-5 italic text-gray-600 dark:text-gray-400`}>
            {wrap(children)}
          </blockquote>
        ),
        code: ({ inline, className, children, ...props }: any) => {
          const isMathDisplay = className === 'language-math';
          const isMathInline = className === 'language-math-inline' || (inline && typeof children === 'string' && children.startsWith('math-inline:'));
          
          if (isMathDisplay) {
            const mathStr = String(children).replace(/\n$/, '');
            const html = katex.renderToString(mathStr, {
              displayMode: true, throwOnError: false,
            });
            return (
              <div className={`my-6 px-4 py-5 rounded-2xl ${accentBg} border border-black/5 dark:border-white/10 overflow-x-auto`}>
                <div className="flex justify-center items-center" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            );
          }
          if (isMathInline) {
            const mathStr = String(children).replace('math-inline:', '');
            const html = katex.renderToString(mathStr, { displayMode: false, throwOnError: false });
            return (
              <span
                className={`mx-0.5 px-1 py-0.5 rounded ${accentBg} ${accentText} text-[0.9em]`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <code className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md text-[0.88em] font-mono text-purple-700 dark:text-purple-400" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {preprocessMath(content)}
    </ReactMarkdown>
  );
}
