import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
const preprocessMath = (text: string) => {
  let p = text;
  p = p.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => `\n\`\`\`math\n${m}\n\`\`\`\n`);
  p = p.replace(/\$([^\$\n]+)\$/g, (_, m) => `\`math-inline:${m}\``);
  return p;
};

interface MarkdownRendererProps {
  content: string;
  accentBg?: string;
  accentText?: string;
}

export default function MarkdownRenderer({ content, accentBg = 'bg-primary/5', accentText = 'text-gray-900 dark:text-gray-100' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-black mt-8 mb-4 text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-black mt-8 mb-3 text-gray-900 dark:text-gray-100 tracking-tight">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{children}</h3>,
        p: ({ children }) => <p className="mb-4 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-[15px] text-gray-600 dark:text-gray-400 font-medium">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className={`pl-4 border-l-4 border-primary/20 ${accentBg} py-2 pr-4 rounded-r-xl my-5 italic text-gray-600 dark:text-gray-400`}>
            {children}
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
