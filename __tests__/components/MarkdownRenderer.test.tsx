import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-markdown', () => {
  return function DummyMarkdown({ children, components }: any) {
    return <div data-testid="markdown">{children}</div>;
  };
});
jest.mock('remark-gfm', () => () => {});
jest.mock('remark-math', () => () => {});
jest.mock('rehype-katex', () => () => {});

import MarkdownRenderer, { normalizeLaTeX } from '@/components/dashboard/MarkdownRenderer';

describe('MarkdownRenderer LaTeX normalization', () => {
  it('converts LaTeX inline delimiters \\( ... \\) to $ ... $', () => {
    const input = 'Let \\(E = mc^2\\) be energy.';
    const output = normalizeLaTeX(input);
    expect(output).toBe('Let $E = mc^2$ be energy.');
  });

  it('converts LaTeX block delimiters \\[ ... \\] to $$ ... $$', () => {
    const input = 'Formula:\n\\[\\int_0^1 x dx\\]';
    const output = normalizeLaTeX(input);
    expect(output).toContain('$$\n\\int_0^1 x dx\n$$');
  });

  it('preserves standard $ ... $ and $$ ... $$ without adding math-inline: prefixes', () => {
    const input = 'Standard $a + b = c$ and\n\n$$\\lim_{x \\to 0} f(x)$$\n\n';
    const output = normalizeLaTeX(input);
    expect(output).not.toContain('math-inline:');
    expect(output).toContain('$a + b = c$');
    expect(output).toContain('$$\\lim_{x \\to 0} f(x)$$');
  });

  it('renders content passed to MarkdownRenderer', () => {
    render(<MarkdownRenderer content="Hello \(x^2\)" />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('Hello $x^2$');
  });

  it('auto-repairs unclosed display math before heading', () => {
    const input = '$$ E = mc^2\n## Chapter 2';
    const output = normalizeLaTeX(input);
    expect(output).toContain('$$\n## Chapter 2');
  });

  it('escapes lone dollars so they do not break markdown rendering', () => {
    const input = 'Price is $100 and tax is $5.';
    const output = normalizeLaTeX(input);
    expect(output).toContain('\\$100');
    expect(output).toContain('\\$5');
  });
});
