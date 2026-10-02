import katex from 'katex';

// In-memory LRU cache for rendered math HTML to prevent repeated KaTeX compilation
const mathCache = new Map<string, string>();
const MAX_CACHE_SIZE = 2000;

/**
 * Safely renders LaTeX string to KaTeX HTML with memoization.
 */
export function renderKaTeX(tex: string, displayMode: boolean): string {
  const trimmed = tex.trim();
  if (!trimmed) return '';
  const cacheKey = `${displayMode ? 'D' : 'I'}:${trimmed}`;
  
  const cached = mathCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
    if (mathCache.size >= MAX_CACHE_SIZE) {
      // Clear oldest 25% of entries
      const keysToDelete = Array.from(mathCache.keys()).slice(0, 500);
      for (const k of keysToDelete) mathCache.delete(k);
    }
    mathCache.set(cacheKey, html);
    return html;
  } catch {
    return trimmed;
  }
}

/**
 * Cleans corruptions that occur during JSON serialization / scraping:
 * - Unescaped control characters (\f, \t, \r)
 * - Multi-escaped backslashes (\\\\( -> \(, \\frac -> \frac)
 */
export function cleanCorruptedLaTeX(text: string): string {
  if (!text) return '';
  let p = text;

  // 1. Control character corruptions from unescaped JSON strings:
  // \f -> form feed \x0c or \u000c
  p = p.replace(/[\x0c\u000c]rac/g, '\\frac');
  // \t -> tab followed by common LaTeX words
  p = p.replace(/\t(ext|imes|au|heta|an|o|op|extbf|extit|ilde|frac)/g, '\\t$1');
  // \r -> carriage return followed by common LaTeX words
  p = p.replace(/\r(ho|ight)/g, '\\r$1');

  // 2. Normalize 4-backslash and 2-backslash delimiters and commands
  // \\\\( -> \(, \\\\) -> \), \\\\frac -> \frac
  p = p.replace(/\\\\\\\\([()[\]a-zA-Z]+)/g, '\\$1');
  p = p.replace(/\\\\([()[\]a-zA-Z]+)/g, '\\$1');

  // 3. Fix bare frac{ or sqrt{ missing backslash
  p = p.replace(/(?<![\\a-zA-Z])frac\{/g, '\\frac{');
  p = p.replace(/(?<![\\a-zA-Z])sqrt\{/g, '\\sqrt{');

  // 4. Convert ( frac{...}{...} ) or ( y = ... ) to \( ... \)
  p = p.replace(/\(\s*(\\frac\{[^{}]*\}\{[^{}]*\})\s*\)/g, '\\($1\\)');
  p = p.replace(/\(\s*([a-zA-Z0-9\s=+\-*\/^_{}]+?\\(?:frac|sqrt|times|cdot|pm|int|sum)[a-zA-Z0-9\s=+\-*\/^_{}]*?)\s*\)/g, '\\($1\\)');

  return p;
}

/**
 * Auto-repairs unclosed display math ($$) blocks in markdown.
 * If a line opens $$ and reaches another heading (##), horizontal rule (---),
 * or another block without closing, auto-closes the $$ to avoid crashing KaTeX.
 */
export function repairUnclosedMath(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  let inDisplay = false;
  let displayStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const count = (trimmed.match(/\$\$/g) || []).length;
    if (count % 2 === 1) {
      if (!inDisplay) {
        inDisplay = true;
        displayStartLine = i;
      } else {
        inDisplay = false;
        displayStartLine = -1;
      }
    }

    if (inDisplay && i > displayStartLine) {
      if (trimmed.startsWith('#') || trimmed.startsWith('---') || (trimmed.startsWith('$$') && count === 1)) {
        lines[i - 1] = lines[i - 1] + '\n$$';
        inDisplay = trimmed.startsWith('$$');
        displayStartLine = inDisplay ? i : -1;
      }
    }
  }

  if (inDisplay && displayStartLine >= 0) {
    lines.push('$$');
  }

  return lines.join('\n');
}

/**
 * Escapes currency amounts ($20, $0.25) and lone trailing dollars ("We say $")
 * so they don't pair up with formulas across distant lines.
 */
export function repairUnclosedSingleDollars(text: string): string {
  if (!text) return '';
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  for (let p = 0; p < parts.length; p++) {
    if (parts[p].startsWith('$$')) continue;
    const lines = parts[p].split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Escape currency amounts: $20, $0.25, $5,000
      line = line.replace(/\$(\d+(?:\.\d+)?(?:\s|$|[,\.]))/g, '\\$$$1');
      // Check for trailing lone dollar e.g. "We say $"
      if (/(?<!\\)\$\s*$/.test(line) && (line.match(/(?<!\\)\$/g) || []).length % 2 === 1) {
        line = line.replace(/(?<!\\)\$(\s*)$/, '\\$$$1');
      }
      lines[i] = line;
    }
    parts[p] = lines.join('\n');
  }
  return parts.join('');
}

/**
 * If a display math block contains alignment operators (&=, & with \\)
 * but lacks \begin{aligned}, wraps its content in \begin{aligned} ... \end{aligned}.
 */
export function autoWrapAlignedDisplay(text: string): string {
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    if (inner.includes('&') && inner.includes('\\\\') && !inner.includes('\\begin{')) {
      return `$$\n\\begin{aligned}\n${inner.trim()}\n\\end{aligned}\n$$`;
    }
    return match;
  });
}

/**
 * Normalizes any LaTeX content for Markdown engines (e.g. ReactMarkdown with remarkMath).
 * Converts:
 *   \[ ... \] -> $$ ... $$
 *   \( ... \) -> $ ... $
 *   Standalone \begin{equation|align|gather} -> $$ ... $$
 *   Isolates multi-line $$ delimiters on separate lines for CommonMark compatibility.
 */
export function normalizeMarkdownLaTeX(text: string): string {
  if (!text) return '';
  let p = cleanCorruptedLaTeX(text);

  // Auto-repair unclosed display $$ blocks
  p = repairUnclosedMath(p);

  // Auto-repair stray or currency $ signs
  p = repairUnclosedSingleDollars(p);

  // Auto-wrap multi-line aligned equations in $$ blocks
  p = autoWrapAlignedDisplay(p);

  // Convert LaTeX block math \[ ... \] to $$ ... $$
  p = p.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`);

  // Convert standalone equation and align environments (not already inside $$)
  p = p.replace(
    /(?<!\$\$[\s\S]*?)\\begin\{(equation|align|gather)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, env, m) => `\n\n$$\n\\begin{${env}}${m}\\end{${env}}\n$$\n\n`
  );

  // Convert LaTeX inline math \( ... \) to $ ... $
  p = p.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`);

  // Wrap isolated bare \frac{...}{...} and \sqrt{...} outside math delimiters
  const mathParts = p.split(/(\$\$[\s\S]*?\$\$|\$[^\n$]+?\$)/g);
  for (let i = 0; i < mathParts.length; i++) {
    if (!mathParts[i].startsWith('$')) {
      mathParts[i] = mathParts[i].replace(
        /(?<!\$|\\\(|\\\[)(\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\})(?!\$|\\\)|\\])/g,
        '$$$1$$'
      );
    }
  }
  p = mathParts.join('');

  // Isolate multi-line $$ blocks so opening and closing $$ are on their own lines (remark-math requirement)
  p = p.replace(/\$\$([^\n$]+)\n/g, '$$\n$1\n');
  p = p.replace(/\n([^\n$]+)\$\$/g, '\n$1\n$$');

  return p;
}

// Backward-compatible alias
export const normalizeLaTeX = normalizeMarkdownLaTeX;

export interface MathPart {
  type: 'text' | 'inline' | 'display';
  content: string;
}

// Math splitting regex matching display blocks, environments, \(...\), and safe inline $...$
export const MATH_SPLIT_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:equation|align|gather|matrix|pmatrix|bmatrix|cases)\*?\}[\s\S]*?\\end\{(?:equation|align|gather|matrix|pmatrix|bmatrix|cases)\*?\}|\\\([\s\S]*?\\\)|\$(?:[^\s\$][^\$\n]*?[^\s\$]|[^\s\$])\$)/g;

/**
 * Splits arbitrary text into plain text chunks and KaTeX math chunks.
 * Specifically for question prompts, options, and explanations.
 * Automatically handles bare math options (e.g. `\sqrt{2gH}` or `2\sqrt{2}/3` or `(frac{16}{5})`).
 */
export function splitMathAndText(rawContent: string): MathPart[] {
  if (!rawContent) return [];
  let content = cleanCorruptedLaTeX(rawContent);

  // Convert parenthesized fractions: (frac{16}{5}) or ( y = frac{4}{3} + Ce^{3x} )
  content = content.replace(/\(\s*(\\?frac\{[^{}]*\}\{[^{}]*\})\s*\)/g, '\\($1\\)');
  content = content.replace(/\(\s*([a-zA-Z0-9\s=+\-*\/^_{}]+?\\(?:frac|sqrt|times|cdot|pm|int|sum)[a-zA-Z0-9\s=+\-*\/^_{}]*?)\s*\)/g, '\\($1\\)');

  // Fix bare frac{ or sqrt{ missing backslash
  content = content.replace(/(?<![\\a-zA-Z])frac\{/g, '\\frac{');
  content = content.replace(/(?<![\\a-zA-Z])sqrt\{/g, '\\sqrt{');

  // Check if the entire string (e.g. an exam option) is a bare math formula without delimiters
  const trimmed = content.trim();
  const hasDelimiters = trimmed.includes('$') || trimmed.includes('\\(') || trimmed.includes('\\[');

  if (!hasDelimiters) {
    if (!trimmed.includes(' ') && (/\\(?:frac|sqrt|times|cdot|pm)|[\^_\/]/.test(trimmed) && /\\/.test(trimmed))) {
      content = `\\(${trimmed}\\)`;
    } else {
      // Wrap isolated math commands
      content = content.replace(
        /(?<!\$|\\\(|\\\[)(\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\}|\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|tau|phi|omega|pm|times|approx))(?!\$|\\\)|\\])/g,
        '\\($1\\)'
      );
    }
  }

  const parts = content.split(MATH_SPLIT_REGEX);
  const result: MathPart[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (
      (part.startsWith('$$') && part.endsWith('$$')) ||
      (part.startsWith('\\[') && part.endsWith('\\]')) ||
      part.startsWith('\\begin{')
    ) {
      let inner = part;
      if (part.startsWith('$$') && part.endsWith('$$')) inner = part.slice(2, -2);
      else if (part.startsWith('\\[') && part.endsWith('\\]')) inner = part.slice(2, -2);
      result.push({ type: 'display', content: inner.trim() });
    } else if (
      (part.startsWith('$') && part.endsWith('$')) ||
      (part.startsWith('\\(') && part.endsWith('\\)'))
    ) {
      let inner = part;
      if (part.startsWith('$') && part.endsWith('$')) inner = part.slice(1, -1);
      else if (part.startsWith('\\(') && part.endsWith('\\)')) inner = part.slice(2, -2);
      result.push({ type: 'inline', content: inner.trim() });
    } else {
      result.push({ type: 'text', content: part });
    }
  }

  return result;
}
