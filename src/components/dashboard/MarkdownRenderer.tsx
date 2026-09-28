import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { NoteHighlight, HighlightColor } from '@/types';

export const HIGHLIGHT_STYLE_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-amber-300/85 text-amber-950 dark:bg-amber-400/35 dark:text-amber-100',
  green:  'bg-emerald-300/85 text-emerald-950 dark:bg-emerald-400/35 dark:text-emerald-100',
  blue:   'bg-sky-300/85 text-sky-950 dark:bg-sky-400/35 dark:text-sky-100',
  purple: 'bg-purple-300/85 text-purple-950 dark:bg-purple-400/35 dark:text-purple-100',
  orange: 'bg-orange-300/85 text-orange-950 dark:bg-orange-400/35 dark:text-orange-100',
};

const preprocessMath = (text: string) => {
  let p = text;
  p = p.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\n\`\`\`math\n${m}\n\`\`\`\n`);
  p = p.replace(/\$([^\$\n]+)\$/g, (_, m) => `\`math-inline:${m}\``);
  return p;
};

// Extracts plain text from any node or element tree
function getPlainText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getPlainText).join('');
  if (React.isValidElement(node) && node.props && (node.props as any).children) {
    return getPlainText((node.props as any).children);
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
          className={`${colorClass} px-1 py-0.5 rounded-[4px] font-inherit cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] border-b border-black/10 dark:border-white/10 select-text inline`}
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

export default function MarkdownRenderer({
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
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-black mt-8 mb-4 text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{wrap(children)}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-black mt-8 mb-3 text-gray-900 dark:text-gray-100 tracking-tight">{wrap(children)}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{wrap(children)}</h3>,
        p: ({ children }) => <p className="mb-4 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{wrap(children)}</ol>,
        li: ({ children }) => <li className="pl-1">{wrap(children)}</li>,
        strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
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
