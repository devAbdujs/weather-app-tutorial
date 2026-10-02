import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { splitMathAndText, renderKaTeX } from '@/lib/latex';

interface MathTextProps {
  content: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = React.memo(({ content, className = '' }) => {
  if (!content) return null;

  // Split into text, inline math, and display math segments
  const parts = useMemo(() => splitMathAndText(content), [content]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part.content) return null;

        if (part.type === 'display') {
          const html = renderKaTeX(part.content, true);
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="block my-2 overflow-x-auto no-scrollbar"
            />
          );
        }

        if (part.type === 'inline') {
          const html = renderKaTeX(part.content, false);
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-block px-0.5 align-baseline"
            />
          );
        }

        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
});

MathText.displayName = 'MathText';
