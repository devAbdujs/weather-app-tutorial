import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { NoteHighlight, HighlightColor } from '@/types';
import { normalizeMarkdownLaTeX as normalizeLaTeX, renderKaTeX } from '@/lib/latex';

export const HIGHLIGHT_STYLE_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-amber-300/85 text-amber-950 dark:bg-amber-400/35 dark:text-amber-100',
  green:  'bg-emerald-300/85 text-emerald-950 dark:bg-emerald-400/35 dark:text-emerald-100',
  blue:   'bg-sky-300/85 text-sky-950 dark:bg-sky-400/35 dark:text-sky-100',
  purple: 'bg-purple-300/85 text-purple-950 dark:bg-purple-400/35 dark:text-purple-100',
  orange: 'bg-orange-300/85 text-orange-950 dark:bg-orange-400/35 dark:text-orange-100',
};

export { normalizeLaTeX };

// Extracts plain text from any node or element tree, skipping code and KaTeX math nodes
function getPlainText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getPlainText).join('');
  if (React.isValidElement(node)) {
    const props = node.props as any;
    const type = (node as any).type;
    if (type === 'code' || props?.className?.includes?.('katex')) {
      return '';
    }
    if (props && props.children) {
      return getPlainText(props.children);
    }
  }
  return '';
}

interface HighlightRange {
  start: number;
  end: number;
  highlight: NoteHighlight;
}

function findHighlightRanges(text: string, highlights: NoteHighlight[]): HighlightRange[] {
  if (!highlights || highlights.length === 0 || !text) return [];
  const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const ranges: HighlightRange[] = [];

  for (const h of highlights) {
    if (!h.text || h.text.trim().length < 2) continue;
    // Build regex that matches the statement words across any whitespace (including newlines and extra spaces)
    const wordsPattern = escapeRegex(h.text.trim()).replace(/\s+/g, '\\s+');
    try {
      const re = new RegExp(wordsPattern, 'gi');
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
          highlight: h,
        });
        if (!re.global) break;
      }
    } catch {}
  }

  // Sort by start position, then longest match first
  ranges.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Deduplicate and filter out nested/overlapping intervals
  const nonOverlapping: HighlightRange[] = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      nonOverlapping.push(r);
      lastEnd = r.end;
    }
  }

  return nonOverlapping;
}

function sliceTextIntoSegments(
  text: string,
  offset: number,
  ranges: HighlightRange[],
  onHighlightClick?: (h: NoteHighlight) => void
): React.ReactNode {
  const textEnd = offset + text.length;
  const overlapping = ranges.filter(r => r.start < textEnd && r.end > offset);
  if (overlapping.length === 0) return text;

  const result: React.ReactNode[] = [];
  let cursor = 0;

  for (const r of overlapping) {
    const localStart = Math.max(0, r.start - offset);
    const localEnd = Math.min(text.length, r.end - offset);

    if (localStart > cursor) {
      result.push(text.slice(cursor, localStart));
    }
    if (localEnd > localStart) {
      const matchedText = text.slice(localStart, localEnd);
      const colorClass = HIGHLIGHT_STYLE_MAP[r.highlight.color] || HIGHLIGHT_STYLE_MAP.yellow;
      result.push(
        <mark
          key={`mark-${r.highlight.id}-${offset + localStart}`}
          data-highlight-id={r.highlight.id}
          className={`${colorClass} px-1 py-0.5 rounded font-inherit cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] border-b border-black/10 dark:border-white/10 select-text inline`}
          onClick={(e) => {
            e.stopPropagation();
            onHighlightClick?.(r.highlight);
          }}
          title="Tap to change color or remove"
        >
          {matchedText}
        </mark>
      );
    }
    cursor = Math.max(cursor, localEnd);
  }

  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}

function renderTreeWithRanges(
  node: React.ReactNode,
  offset: number,
  ranges: HighlightRange[],
  onHighlightClick?: (h: NoteHighlight) => void
): React.ReactNode {
  if (typeof node === 'string') {
    return sliceTextIntoSegments(node, offset, ranges, onHighlightClick);
  }
  if (!node) return node;

  if (Array.isArray(node)) {
    let cur = offset;
    return node.map((child, idx) => {
      const rendered = renderTreeWithRanges(child, cur, ranges, onHighlightClick);
      cur += getPlainText(child).length;
      return <React.Fragment key={idx}>{rendered}</React.Fragment>;
    });
  }

  if (React.isValidElement(node)) {
    const type = (node as any).type;
    // Skip code and math elements
    if (type === 'code' || (node.props as any).className?.includes('katex')) {
      return node;
    }

    if (node.props && (node.props as any).children) {
      const childProp = (node.props as any).children;
      let cur = offset;
      let newChildren: React.ReactNode;

      if (Array.isArray(childProp)) {
        newChildren = childProp.map((child, idx) => {
          const rendered = renderTreeWithRanges(child, cur, ranges, onHighlightClick);
          cur += getPlainText(child).length;
          return <React.Fragment key={idx}>{rendered}</React.Fragment>;
        });
      } else {
        newChildren = renderTreeWithRanges(childProp, cur, ranges, onHighlightClick);
      }

      return React.cloneElement(node, {
        ...(node.props as any),
        children: newChildren,
      });
    }
  }

  return node;
}

function wrapBlockWithHighlights(
  children: React.ReactNode,
  highlights: NoteHighlight[],
  onHighlightClick?: (h: NoteHighlight) => void
): React.ReactNode {
  if (!highlights || highlights.length === 0 || !children) {
    return children;
  }

  const plainText = getPlainText(children);
  if (!plainText || plainText.length === 0) return children;

  const ranges = findHighlightRanges(plainText, highlights);
  if (ranges.length === 0) return children;

  return renderTreeWithRanges(children, 0, ranges, onHighlightClick);
}

interface MarkdownRendererProps {
  content: string;
  accentBg?: string;
  accentText?: string;
  highlights?: NoteHighlight[];
  onHighlightClick?: (highlight: NoteHighlight) => void;
}

function MarkdownRendererComponent({
  content,
  accentBg = 'bg-primary/5',
  accentText = 'text-gray-900 dark:text-gray-100',
  highlights = [],
  onHighlightClick,
}: MarkdownRendererProps) {
  const wrap = (nodes: React.ReactNode) => wrapBlockWithHighlights(nodes, highlights, onHighlightClick);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, errorColor: 'inherit' }]]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-black mt-8 mb-4 text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{wrap(children)}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-black mt-8 mb-3 text-gray-900 dark:text-gray-100 tracking-tight">{wrap(children)}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{wrap(children)}</h3>,
        p: ({ children }) => <p className="mb-4 text-regular leading-relaxed text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-regular text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-regular text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ol>,
        li: ({ children }) => <li className="pl-1">{wrap(children)}</li>,
        strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        table: ({ children }) => (
          <div className="my-6 w-full overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 shadow-sm bg-white dark:bg-card">
            <table className="w-full text-left text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-gray-100 font-semibold">{children}</thead>
        ),
        tbody: ({ children }) => <tbody className="divide-y divide-black/5 dark:divide-white/5">{children}</tbody>,
        tr: ({ children }) => <tr className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">{children}</tr>,
        th: ({ children }) => <th className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{wrap(children)}</th>,
        td: ({ children }) => <td className="px-4 py-3 text-gray-600 dark:text-gray-400 align-top">{wrap(children)}</td>,
        img: ({ src, alt, ...props }: any) => (
          <figure className="my-6 flex flex-col items-center max-w-full">
            <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 shadow-sm bg-black/5 dark:bg-white/5 max-w-full p-1 sm:p-2">
              <img
                src={src}
                alt={alt || 'Study diagram'}
                loading="lazy"
                className="max-h-[420px] w-auto max-w-full object-contain mx-auto rounded-xl cursor-zoom-in active:scale-95 transition-transform"
                onClick={() => {
                  if (typeof window !== 'undefined' && src) {
                    window.open(src, '_blank');
                  }
                }}
                {...props}
              />
            </div>
            {alt && (
              <figcaption className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center italic max-w-md px-3">
                {alt}
              </figcaption>
            )}
          </figure>
        ),
        blockquote: ({ children }) => (
          <blockquote className={`pl-4 border-l-4 border-primary/20 ${accentBg} py-2 pr-4 rounded-r-xl my-5 italic text-gray-600 dark:text-gray-400`}>
            {wrap(children)}
          </blockquote>
        ),
        pre: ({ node, children, ...props }: any) => {
          const isMath = (node?.children?.[0] as any)?.properties?.className?.includes?.('language-math');
          if (isMath) {
            return <div className="my-4 overflow-x-auto">{children}</div>;
          }
          return (
            <pre className="my-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 overflow-x-auto font-mono text-sm" {...props}>
              {children}
            </pre>
          );
        },
        code: ({ className, children, ...props }: any) => {
          const isMathDisplay = className === 'language-math';
          const childrenStr = typeof children === 'string' ? children : String(children ?? '');
          const isMathInline = className === 'language-math-inline' || childrenStr.startsWith('math-inline:');
          
          if (isMathDisplay) {
            const mathStr = childrenStr.replace(/\n$/, '');
            const html = renderKaTeX(mathStr, true);
            return (
              <div className={`my-6 px-4 py-5 rounded-2xl ${accentBg} border border-black/5 dark:border-white/10 overflow-x-auto`}>
                <div className="flex justify-center items-center" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            );
          }
          if (isMathInline) {
            const mathStr = childrenStr.replace(/^math-inline:/, '');
            const html = renderKaTeX(mathStr, false);
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
      {normalizeLaTeX(content)}
    </ReactMarkdown>
  );
}

export const MarkdownRenderer = React.memo(MarkdownRendererComponent);
export default MarkdownRenderer;
