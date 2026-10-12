import {
  cleanCorruptedLaTeX,
  normalizeMarkdownLaTeX,
  splitMathAndText,
  renderKaTeX,
  repairUnclosedMath,
  repairUnclosedSingleDollars,
  autoWrapAlignedDisplay,
  cleanMermaidBlocks,
} from '@/lib/latex';

describe('LaTeX Normalization & Formatting Suite', () => {
  describe('repairUnclosedMath', () => {
    it('auto-closes unclosed $$ block before a markdown heading', () => {
      const input = '$$ f(x) = x^2\n## Next Chapter\nContent';
      const output = repairUnclosedMath(input);
      expect(output).toContain('$$\n## Next Chapter');
    });

    it('auto-closes unclosed $$ at end of text', () => {
      const input = 'Formula is:\n$$ y = mx + b';
      const output = repairUnclosedMath(input);
      expect(output.endsWith('$$')).toBe(true);
    });
  });

  describe('repairUnclosedSingleDollars', () => {
    it('escapes lone currency dollar values without treating as math', () => {
      const input = 'Cost is $20 and discount is $0.25.';
      const output = repairUnclosedSingleDollars(input);
      expect(output).toContain('\\$20');
      expect(output).toContain('\\$0.25');
    });

    it('escapes trailing lone dollar at end of sentence', () => {
      const input = 'In this definition, we say $\n\nNext line';
      const output = repairUnclosedSingleDollars(input);
      expect(output).toContain('we say \\$');
    });
  });

  describe('autoWrapAlignedDisplay', () => {
    it('wraps multi-line aligned equations in begin{aligned}', () => {
      const input = '$$\na &= b + c \\\\\nd &= e\n$$';
      const output = autoWrapAlignedDisplay(input);
      expect(output).toContain('\\begin{aligned}');
      expect(output).toContain('\\end{aligned}');
    });

    it('does not double-wrap if already wrapped in begin{aligned}', () => {
      const input = '$$\n\\begin{aligned}\na &= b \\\\\nc &= d\n\\end{aligned}\n$$';
      const output = autoWrapAlignedDisplay(input);
      const count = (output.match(/\\begin\{aligned\}/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('cleanCorruptedLaTeX', () => {
    it('fixes unescaped form-feed \\x0crac control characters from JSON', () => {
      const corrupted = 'The formula is \\( \x0crac{1}{2} \\)';
      expect(cleanCorruptedLaTeX(corrupted)).toBe('The formula is \\( \\frac{1}{2} \\)');
    });

    it('fixes unescaped tab characters in \\text and \\times', () => {
      const corrupted = 'To find mass: \\( \text{mass} = \text{molarity} \times \text{volume} \\)';
      const cleaned = cleanCorruptedLaTeX(corrupted);
      expect(cleaned).toContain('\\text{mass}');
      expect(cleaned).toContain('\\text{molarity}');
      expect(cleaned).toContain('\\times');
    });

    it('normalizes multi-escaped backslashes', () => {
      const corrupted = '\\\\( M = \\\\frac{wL^2}{8} \\\\)';
      expect(cleanCorruptedLaTeX(corrupted)).toBe('\\( M = \\frac{wL^2}{8} \\)');
    });

    it('fixes bare frac{ and sqrt{ missing backslashes', () => {
      const bare = 'The fraction is frac{3}{4} and root is sqrt{x}';
      expect(cleanCorruptedLaTeX(bare)).toBe('The fraction is \\frac{3}{4} and root is \\sqrt{x}');
    });

    it('converts parenthesized fraction expressions into \\( ... \\)', () => {
      const expr = '(frac{16}{5})';
      expect(cleanCorruptedLaTeX(expr)).toBe('\\(\\frac{16}{5}\\)');
    });

    it('converts parenthesized equation expressions into \\( ... \\)', () => {
      const expr = '( y = frac{4}{3} + Ce^{3x} )';
      expect(cleanCorruptedLaTeX(expr)).toBe('\\(y = \\frac{4}{3} + Ce^{3x}\\)');
    });
  });

  describe('normalizeMarkdownLaTeX', () => {
    it('converts LaTeX inline delimiters \\( ... \\) to $ ... $', () => {
      const input = 'Let \\(E = mc^2\\) be energy.';
      expect(normalizeMarkdownLaTeX(input)).toBe('Let $E = mc^2$ be energy.');
    });

    it('converts LaTeX block delimiters \\[ ... \\] to $$ ... $$', () => {
      const input = 'Formula:\n\\[\\int_0^1 x dx\\]';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\n\\int_0^1 x dx\n$$');
    });

    it('converts equation and align environments to $$ ... $$ blocks', () => {
      const input = 'System:\n\\begin{align}\n2x + y &= 5\\\\\nx - y &= 1\n\\end{align}';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\n\\begin{align}\n2x + y &= 5\\\\\nx - y &= 1\n\\end{align}\n$$');
    });

    it('wraps isolated bare \\frac and \\sqrt without delimiters in $...$', () => {
      const input = 'The mass is \\frac{1}{2} kg and root is \\sqrt{gL}.';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$\\frac{1}{2}$');
      expect(output).toContain('$\\sqrt{gL}$');
    });

    it('preserves inner matrix environments inside $$ without duplicate wrapping', () => {
      const input = '$$\nA = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}\n$$';
      const output = normalizeMarkdownLaTeX(input);
      // Ensure no nested $$ inside $$
      expect(output).not.toContain('$$A = $$');
      expect(output).toContain('\\begin{pmatrix}');
    });

    it('strips outer markdown code fences wrapping the entire note', () => {
      const input = '```markdown\n# Chapter 1: Introduction\n\nContent here.\n```';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toBe('# Chapter 1: Introduction\n\nContent here.');
      expect(output).not.toContain('```');
    });

    it('strips conversational preamble and outer markdown code fences', () => {
      const input = 'Here is the summary of the chapter:\n```markdown\n# Chapter 1: Vectors\n\nStudy content.\n```\nHope this helps!';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toBe('# Chapter 1: Vectors\n\nStudy content.');
      expect(output).not.toContain('```');
      expect(output).not.toContain('Here is the summary');
      expect(output).not.toContain('Hope this helps');
    });

    it('strips unclosed opening markdown code fences from truncated AI outputs', () => {
      const input = '```markdown\n# Chapter 2: Kinematics\n\nVelocity and acceleration formulas...';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toBe('# Chapter 2: Kinematics\n\nVelocity and acceleration formulas...');
      expect(output).not.toContain('```');
    });

    it('preserves legitimate internal code blocks inside the markdown document', () => {
      const input = '```markdown\n# Computer Science\n\nCode snippet:\n```python\nprint("Hello")\n```\nEnd of note.\n```';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('```python\nprint("Hello")\n```');
      expect(output.startsWith('# Computer Science')).toBe(true);
    });

    it('converts standalone matrix environments (pmatrix, bmatrix, cases) to $$ ... $$', () => {
      const input = 'Consider the transformation matrix:\n\\begin{pmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{pmatrix}\n\nAnd piecewise function:\n\\begin{cases}\nx & x > 0 \\\\\n-x & x \\le 0\n\\end{cases}';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\n\\begin{pmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{pmatrix}\n$$');
      expect(output).toContain('$$\n\\begin{cases}\nx & x > 0 \\\\\n-x & x \\le 0\n\\end{cases}\n$$');
    });

    it('converts subsequent standalone math environments even when preceded by $$ blocks', () => {
      const input = '$$\nE = mc^2\n$$\n\nNext formula:\n\\begin{align}\na &= b + c \\\\\nd &= e\n\\end{align}';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\nE = mc^2\n$$');
      expect(output).toContain('$$\n\\begin{align}\na &= b + c \\\\\nd &= e\n\\end{align}\n$$');
    });

    it('safely converts literal \\n newlines without corrupting LaTeX commands like \\neq and \\nabla', () => {
      const input = '## Chapter 1\\n\\nIntroduction\\n- Item 1\\nx \\neq y and \\nabla f\\nNext paragraph';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('## Chapter 1');
      expect(output).toContain('\n\nIntroduction');
      expect(output).toContain('- Item 1');
      expect(output).toContain('\\neq');
      expect(output).toContain('\\nabla');
      expect(output).toContain('\nNext paragraph');
    });

    it('preserves math formulas starting with numbers without escaping as currency', () => {
      const input = 'Solve the equation $1 + x = 2$ and find circumference $2\\pi r$.';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$1 + x = 2$');
      expect(output).toContain('$2\\pi r$');
      expect(output).not.toContain('\\$1');
      expect(output).not.toContain('\\$2');
    });

    it('preserves multi-line $$ display math delimiters without degrading to single $', () => {
      const input = '$$\n\\frac{a}{b} = c\n$$';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\n\\frac{a}{b} = c\n$$');
      // Ensure opening and closing are both double dollars
      const doubleDollars = (output.match(/\$\$/g) || []).length;
      expect(doubleDollars).toBe(2);
    });

    it('converts double-escaped block math \\\\[ ... \\\\] to $$ ... $$', () => {
      const input = 'Formula:\n\\\\[x^2 + y^2 = 1\\\\]';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('$$\nx^2 + y^2 = 1\n$$');
    });

    it('unescapes literal escaped headings', () => {
      const input = '\\# Chapter 1: Vectors\n\n\\## 1.1 Intro';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('# Chapter 1: Vectors');
      expect(output).toContain('## 1.1 Intro');
    });
  });

  describe('splitMathAndText', () => {
    it('splits inline \\( ... \\) and text accurately', () => {
      const input = 'Temperatures \\( T_H = 500 K \\) and \\( T_C = 300 K \\).';
      const parts = splitMathAndText(input);
      expect(parts).toHaveLength(5);
      expect(parts[0]).toEqual({ type: 'text', content: 'Temperatures ' });
      expect(parts[1]).toEqual({ type: 'inline', content: 'T_H = 500 K' });
      expect(parts[2]).toEqual({ type: 'text', content: ' and ' });
      expect(parts[3]).toEqual({ type: 'inline', content: 'T_C = 300 K' });
      expect(parts[4]).toEqual({ type: 'text', content: '.' });
    });

    it('splits display block \\[ ... \\] accurately', () => {
      const input = 'Formula:\n\\[\\frac{a}{b}\\]\nDone.';
      const parts = splitMathAndText(input);
      expect(parts).toHaveLength(3);
      expect(parts[0]).toEqual({ type: 'text', content: 'Formula:\n' });
      expect(parts[1]).toEqual({ type: 'display', content: '\\frac{a}{b}' });
      expect(parts[2]).toEqual({ type: 'text', content: '\nDone.' });
    });

    it('preserves currency without falsely treating it as math', () => {
      const input = 'A car charges $20 per day plus $0.25 per mile.';
      const parts = splitMathAndText(input);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ type: 'text', content: input });
    });

    it('wraps bare math exam options without delimiters into math', () => {
      const option = '\\sqrt{2gH}';
      const parts = splitMathAndText(option);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ type: 'inline', content: '\\sqrt{2gH}' });
    });

    it('wraps bare fraction options like 2\\sqrt{2}/3', () => {
      const option = '2\\sqrt{2}/3';
      const parts = splitMathAndText(option);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ type: 'inline', content: '2\\sqrt{2}/3' });
    });
  });

  describe('renderKaTeX', () => {
    it('renders valid KaTeX HTML string', () => {
      const html = renderKaTeX('E = mc^2', false);
      expect(html).toContain('katex');
      expect(html).toContain('mc');
    });

    it('renders display math with katex-display class', () => {
      const html = renderKaTeX('\\frac{1}{2}', true);
      expect(html).toContain('katex-display');
    });

    it('memoizes output on repeated calls', () => {
      const html1 = renderKaTeX('\\sqrt{x}', false);
      const html2 = renderKaTeX('\\sqrt{x}', false);
      expect(html1).toBe(html2);
    });
  });

  describe('cleanMermaidBlocks', () => {
    it('transforms Mermaid classDiagram into readable Markdown callout', () => {
      const input = '```mermaid\nclassDiagram\nclass Matter {\n+Solid\n+Liquid\n+Gas\n}\n```';
      const output = cleanMermaidBlocks(input);
      expect(output).toContain('> 📊 **Summary Flow / Classification:**');
      expect(output).toContain('> **Matter**');
      expect(output).toContain('> • Solid');
      expect(output).toContain('> • Liquid');
      expect(output).toContain('> • Gas');
      expect(output).not.toContain('```mermaid');
    });

    it('transforms Mermaid flowchart into readable Markdown callout', () => {
      const input = '```mermaid\ngraph LR\nReactants --> Intermediates --> Products\n```';
      const output = cleanMermaidBlocks(input);
      expect(output).toContain('> • Reactants ➔ Intermediates ➔ Products');
      expect(output).not.toContain('```mermaid');
    });

    it('is executed automatically inside normalizeMarkdownLaTeX', () => {
      const input = '## Reaction Pathways\n\n```mermaid\ngraph TD\nA --> B\n```\n\nNote text.';
      const output = normalizeMarkdownLaTeX(input);
      expect(output).toContain('> • A ➔ B');
      expect(output).not.toContain('```mermaid');
    });
  });
});
