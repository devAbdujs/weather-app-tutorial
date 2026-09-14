require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 3: Limits and Continuity

## 1. Limits and the Formal Definition

**Formal ($\\epsilon$-$\\delta$) Definition and Interpretation**
*   **Formal Definition:** The limit of $f(x)$ as $x$ approaches $a$ is $L$, written as $\\lim_{x \\to a} f(x) = L$, if and only if for every $\\epsilon > 0$, there exists a corresponding $\\delta > 0$ such that $0 < |x - a| < \\delta$ implies $|f(x) - L| < \\epsilon$.
*   **Selecting $\\delta$:** The calculated $\\delta$ is expressed as a function of the known value $\\epsilon$. The value of $\\delta$ is not unique; choosing any smaller positive value $\\delta' < \\delta$ remains valid.

## 2. Basic Limit Theorems

**Algebraic Limit Properties**
*   **Limit Laws:** Assuming $\\lim_{x \\to a} f(x)$ and $\\lim_{x \\to a} g(x)$ exist and $c$ is any constant, limits preserve algebraic operations:
    *   **Constant Multiple Law:** $\\lim_{x \\to a} [c \\cdot f(x)] = c \\lim_{x \\to a} f(x)$.
    *   **Sum and Difference Law:** $\\lim_{x \\to a} [f(x) \\pm g(x)] = \\lim_{x \\to a} f(x) \\pm \\lim_{x \\to a} g(x)$.
    *   **Product and Quotient Laws:** Limits distribute across products and quotients, provided the denominator limit is non-zero.

## 3. One-Sided Limits

**Definitions and Existence Criteria**
*   **Right-Hand Limit:** $\\lim_{x \\to a^+} f(x) = L$ means that for every $\\epsilon > 0$, there exists $\\delta > 0$ such that $|f(x) - L| < \\epsilon$ whenever $0 < x - a < \\delta$ (or $a < x < a + \\delta$).
*   **Left-Hand Limit:** $\\lim_{x \\to a^-} f(x) = L$ means that for every $\\epsilon > 0$, there exists $\\delta > 0$ such that $|f(x) - L| < \\epsilon$ whenever $-\\delta < x - a < 0$ (or $a - \\delta < x < a$).
*   **Two-Sided Limit Existence:** The overall two-sided limit $\\lim_{x \\to a} f(x) = L$ exists if and only if both one-sided limits exist and are equal ($\\lim_{x \\to a^+} f(x) = \\lim_{x \\to a^-} f(x) = L$).

## 4. Infinite Limits, Limits at Infinity, and Asymptotes

**Infinite Limits and Vertical Asymptotes**
*   **Infinite Limits:** $\\lim_{x \\to a} f(x) = \\infty$ means that for every $M > 0$, there exists $\\delta > 0$ such that $f(x) > M$ whenever $0 < |x - a| < \\delta$. Similarly, $\\lim_{x \\to a} f(x) = -\\infty$ means $f(x) < N$ for any $N < 0$.
*   **Vertical Asymptotes:** If $\\lim_{x \\to a^+} f(x) = \\pm\\infty$ or $\\lim_{x \\to a^-} f(x) = \\pm\\infty$, the vertical line $x = a$ is a vertical asymptote of $f(x)$.

**Limits at Infinity and Horizontal Asymptotes**
*   **Limits at Infinity:** Analyzes the behavior of $f(x)$ as $x \\to \\infty$ or $x \\to -\\infty$.
*   **Horizontal Asymptotes:** If $\\lim_{x \\to \\infty} f(x) = L$ or $\\lim_{x \\to -\\infty} f(x) = L$, the horizontal line $y = L$ is a horizontal asymptote of $f(x)$.

## 5. Continuity of Functions and the Intermediate Value Theorem

**Definition of Continuity and Function Classes**
*   **Continuity at a Point:** A function $f(x)$ is continuous at $x = a$ if and only if $\\lim_{x \\to a} f(x) = f(a)$. This requires three conditions:
    1.  $f(a)$ is defined.
    2.  $\\lim_{x \\to a} f(x)$ exists.
    3.  $\\lim_{x \\to a} f(x) = f(a)$.
*   **Continuous Function Families:** Polynomial, rational, root, trigonometric, inverse trigonometric, exponential, and logarithmic functions are continuous at all points in their respective domains.

**One-Sided Continuity and Interval Continuity**
*   **One-Sided Continuity:** $f$ is continuous from the right at $a$ if $\\lim_{x \\to a^+} f(x) = f(a)$, and continuous from the left at $a$ if $\\lim_{x \\to a^-} f(x) = f(a)$.
*   **Continuity on Closed Intervals:** A function $f$ is continuous on a closed interval $[a, b]$ if it is continuous on $(a, b)$, continuous from the right at $a$, and continuous from the left at $b$.

**Intermediate Value Theorem (IVT)**
*   **Theorem Statement:** If $f$ is continuous on a closed bounded interval $[a, b]$ and $M$ is any number between $f(a)$ and $f(b)$, then there exists at least one number $c \\in (a, b)$ such that $f(c) = M$.
*   **Application to Root Finding:** IVT guarantees the existence of a root $c \\in (a, b)$ such that $f(c) = 0$ if $f$ is continuous on $[a, b]$ and $f(a)$ and $f(b)$ have opposite signs.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 3: Limits and Continuity',
    content: content,
    department: 'Mathematics',
    exam_type: 'freshman',
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/study_notes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    console.error('Error:', await res.text());
  } else {
    console.log('Successfully inserted Math Chapter 3!');
  }
}

run();
