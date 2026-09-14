import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  content: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by inline math $...$ or display math $$...$$
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="block my-2" />;
          } catch {
            return <span key={index} className="font-mono">{part}</span>;
          }
        }

        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
          } catch {
            return <span key={index} className="font-mono">{part}</span>;
          }
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
