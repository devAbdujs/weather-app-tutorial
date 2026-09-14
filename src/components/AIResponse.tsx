import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * AIResponse — renders Gemini's markdown output cleanly.
 *
 * Handles everything Gemini typically outputs:
 *   **bold**, *italic*, `code`, # headings, - lists, numbered lists,
 *   blank-line paragraphs, and KaTeX math ($...$ and $$...$$).
 *
 * No external markdown library needed.
 */

interface AIResponseProps {
  content: string;
  className?: string;
}

// ── KaTeX renderer ────────────────────────────────────────────
function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: false });
  } catch {
    return tex;
  }
}

// ── Inline markdown → React nodes ─────────────────────────────
// Handles: $$math$$, $math$, \(math\), \[math\], **bold**, *italic*, `code`
function renderInline(text: string, key: string): React.ReactNode[] {
  // Normalize alternate LaTeX delimiters to standard $ and $$
  let normalized = text.replace(/\\\((.*?)\\\)/g, '$$$1$$');
  normalized = normalized.replace(/\\\[(.*?)\\\]/g, '$$$$$1$$$$');

  // Regex split
  const parts = normalized.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const k = `${key}-${i}`;
    if (!part) return null;

    if (part.startsWith('$$') && part.endsWith('$$')) {
      const html = renderMath(part.slice(2, -2).trim(), true);
      return <span key={k} dangerouslySetInnerHTML={{ __html: html }} className="block my-2 overflow-x-auto no-scrollbar" />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const html = renderMath(part.slice(1, -1).trim(), false);
      return <span key={k} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={k} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={k} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={k} className="font-mono text-accent-rose bg-accent-rose/10 rounded px-1.5 py-0.5">{part.slice(1, -1)}</code>;
    }
    // Clean up any stray hash symbols that might have leaked into plain text
    const cleanText = part.replace(/^#+\s*/g, '');
    return <React.Fragment key={k}>{cleanText}</React.Fragment>;
  }).filter(Boolean) as React.ReactNode[];
}

// ── Block-level renderer ───────────────────────────────────────
export const AIResponse: React.FC<AIResponseProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  
  let listItems: React.ReactNode[] = [];
  let listIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(<ul key={`ul-${listIndex}`} className="space-y-2 my-2">{listItems}</ul>);
      listItems = [];
      listIndex++;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    
    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${i}`} className="h-1" />);
      return;
    }

    // Heading: ## or # (forgiving on spacing)
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
    if (headingMatch && headingMatch[2]) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const cls = level === 1
        ? 'text-base font-black text-primary mt-4 mb-2'
        : 'text-sm font-bold text-primary mt-3 mb-1';
      elements.push(
        <div key={`h-${i}`} className={cls}>
          {renderInline(text, `h-${i}`)}
        </div>
      );
      return;
    }

    // List Item
    const listMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    const numListMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (listMatch || numListMatch) {
      const text = listMatch ? listMatch[1] : numListMatch![2];
      const bullet = listMatch ? '•' : `${numListMatch![1]}.`;
      listItems.push(
        <li key={`li-${i}`} className="flex gap-2 text-sm text-primary leading-relaxed">
          <span className="text-accent-blue font-black mt-0.5 shrink-0">{bullet}</span>
          <span className="flex-1">{renderInline(text, `li-${i}`)}</span>
        </li>
      );
      return;
    }

    // Normal Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-primary leading-relaxed mb-1.5">
        {renderInline(trimmed, `p-${i}`)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`space-y-1 ${className}`}>
      {elements}
    </div>
  );
};
