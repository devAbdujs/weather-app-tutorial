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
 * - Bare LaTeX keywords without leading backslash (frac{ -> \frac{)
 * - Parenthesized math formulas (frac{1}{3} + frac{1}{5}) -> \( \frac{1}{3} + \frac{1}{5} \)
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
 * Normalizes any LaTeX content for Markdown engines (e.g. ReactMarkdown with remarkMath).
 * Converts:
 *   \[ ... \] -> $$ ... $$
 *   \( ... \) -> $ ... $
 *   \begin{...} ... \end{...} -> $$ ... $$
 *   Wraps isolated bare \frac / \sqrt that lack delimiters.
 */
export function normalizeMarkdownLaTeX(text: string): string {
  if (!text) return '';
  let p = cleanCorruptedLaTeX(text);

  // Convert LaTeX block math \[ ... \] to $$ ... $$
  p = p.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `\n\n$$\n${m.trim()}\n$$\n\n`);

  // Convert LaTeX environments: equation, align, gather, etc.
  p = p.replace(
    /\\begin\{(equation|align|gather|matrix|pmatrix|bmatrix|cases)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, env, m) => `\n\n$$\n\\begin{${env}}${m}\\end{${env}}\n$$\n\n`
  );

  // Convert LaTeX inline math \( ... \) to $ ... $
  p = p.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`);

  // Wrap isolated \frac{...}{...} and \sqrt{...} if not already inside math delimiters
  p = p.replace(/(?<!\$|\\\(|\\\[)(\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\})(?!\$|\\\)|\\])/g, '$$$1$$');

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
 * Automatically handles bare math options (e.g. `\sqrt{2gH}` or `2\sqrt{2}/3` or `\frac{1}{2}mv^2`)
 * so options and formulas with missing delimiters render properly.
 */
export function splitMathAndText(rawContent: string): MathPart[] {
  if (!rawContent) return [];
  let content = cleanCorruptedLaTeX(rawContent);

  // Check if the entire string (e.g. an exam option) is a bare math formula without delimiters
  const trimmed = content.trim();
  const hasDelimiters = trimmed.includes('$') || trimmed.includes('\\(') || trimmed.includes('\\[');

  if (!hasDelimiters) {
    // If no spaces and contains math symbols/commands
    if (!trimmed.includes(' ') && (/\\(?:frac|sqrt|times|cdot|pm)|[\^_\/]/.test(trimmed) && /\\/.test(trimmed))) {
      content = `\\(${trimmed}\\)`;
    } else {
      // Wrap isolated math commands: \frac{...}{...}, \sqrt{...}, \alpha, \beta, etc.
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
