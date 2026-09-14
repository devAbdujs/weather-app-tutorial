require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 4: Derivatives and Applications

## 1. Definition and Basic Rules of Differentiation

**Tangent Lines, Derivatives, and Interpretations**
*   **Tangent and Normal Lines:** The tangent line to a curve $y = f(x)$ at $P(a, f(a))$ has slope $m = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h} = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x-a}$. The normal line is perpendicular to the tangent line at that point.
*   **Definition of Derivative:** The derivative of $f$ with respect to $x$ is defined by $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$, provided this limit exists. Alternatively, it can be written as $f'(x) = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x - a}$.
*   **Geometric and Physical Interpretations:** Geometrically, $f'(x)$ represents the slope of the tangent line to the curve at $(x, f(x))$. Physically, it measures the instantaneous rate of change of a function (such as instantaneous velocity).
*   **Differentiability Implies Continuity:** If a function $f$ is differentiable at a point $a$, then $f$ is necessarily continuous at $a$.

**Differentiation Rules and Composite Functions**
*   **Basic Derivative Rules:**
    *   **Constant Rule:** $\\frac{d}{dx}(c) = 0$ for any constant $c$.
    *   **Power Rule:** $\\frac{d}{dx}(x^n) = n x^{n-1}$ for any real number $n$.
    *   **Constant Multiple Rule:** $\\frac{d}{dx}[c f(x)] = c f'(x)$.
    *   **Sum and Difference Rule:** $\\frac{d}{dx}[f(x) \\pm g(x)] = f'(x) \\pm g'(x)$.
*   **Product and Quotient Rules:**
    *   **Product Rule:** $\\frac{d}{dx}[f(x)g(x)] = f'(x)g(x) + g'(x)f(x)$.
    *   **Quotient Rule:** $\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x)g(x) - g'(x)f(x)}{(g(x))^2}$, provided $g(x) \\neq 0$.
*   **The Chain Rule:** For composite functions $h(x) = (f \\circ g)(x) = f(g(x))$, the derivative is $h'(x) = f'(g(x)) \\cdot g'(x)$. In Leibniz notation with $y = f(u)$ and $u = g(x)$, $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$.

## 2. Derivatives of Inverse, Trigonometric, and Hyperbolic Functions

**Trigonometric and Inverse Function Derivatives**
*   **Inverse Function Theorem:** If $f$ is differentiable and invertible with inverse $y = f^{-1}(x)$, then $(f^{-1})'(x) = \\frac{1}{f'(f^{-1}(x))}$, provided $f'(f^{-1}(x)) \\neq 0$.
*   **Trigonometric Derivatives:** $\\frac{d}{dx}(\\sin x) = \\cos x$, $\\frac{d}{dx}(\\cos x) = -\\sin x$, $\\frac{d}{dx}(\\tan x) = \\sec^2 x$, $\\frac{d}{dx}(\\csc x) = -\\csc x \\cot x$, $\\frac{d}{dx}(\\sec x) = \\sec x \\tan x$, and $\\frac{d}{dx}(\\cot x) = -\\csc^2 x$.
*   **Inverse Trigonometric Derivatives:** $\\frac{d}{dx}(\\sin^{-1} x) = \\frac{1}{\\sqrt{1-x^2}}$, $\\frac{d}{dx}(\\cos^{-1} x) = -\\frac{1}{\\sqrt{1-x^2}}$, $\\frac{d}{dx}(\\tan^{-1} x) = \\frac{1}{1+x^2}$, $\\frac{d}{dx}(\\csc^{-1} x) = -\\frac{1}{|x|\\sqrt{x^2-1}}$, $\\frac{d}{dx}(\\sec^{-1} x) = \\frac{1}{|x|\\sqrt{x^2-1}}$, and $\\frac{d}{dx}(\\cot^{-1} x) = -\\frac{1}{1+x^2}$.

**Hyperbolic and Inverse Hyperbolic Functions**
*   **Definitions:** Hyperbolic functions are defined exponential combinations: $\\sinh x = \\frac{e^x - e^{-x}}{2}$, $\\cosh x = \\frac{e^x + e^{-x}}{2}$, and $\\tanh x = \\frac{\\sinh x}{\\cosh x}$.
*   **Hyperbolic Derivatives:** $\\frac{d}{dx}(\\sinh x) = \\cosh x$, $\\frac{d}{dx}(\\cosh x) = \\sinh x$, $\\frac{d}{dx}(\\tanh x) = \\text{sech}^2 x$, $\\frac{d}{dx}(\\text{csch } x) = -\\text{csch } x \\coth x$, $\\frac{d}{dx}(\\text{sech } x) = -\\text{sech } x \\tanh x$, and $\\frac{d}{dx}(\\coth x) = -\\text{csch}^2 x$.
*   **Inverse Hyperbolic Derivatives:** $\\frac{d}{dx}(\\sinh^{-1} x) = \\frac{1}{\\sqrt{x^2+1}}$, $\\frac{d}{dx}(\\cosh^{-1} x) = \\frac{1}{\\sqrt{x^2-1}}$, and $\\frac{d}{dx}(\\tanh^{-1} x) = \\frac{1}{1-x^2}$.

## 3. Higher-Order Derivatives and Implicit Differentiation

**Higher-Order Derivatives and Kinematics**
*   **Notation:** Successive derivatives are written as $f', f'', f''', \\dots, f^{(n)}$ or $\\frac{df}{dx}, \\frac{d^2f}{dx^2}, \\dots, \\frac{d^nf}{dx^n}$.
*   **Kinematics Applications:** For position function $s = f(t)$, velocity is the first derivative $v(t) = s'(t)$, and acceleration is the second derivative $a(t) = v'(t) = s''(t)$.

**Implicit Differentiation Technique**
*   **Procedure:** For equations implicitly defining $y = f(x)$, differentiate both sides with respect to $x$ (applying the Chain Rule to generate a factor of $\\frac{dy}{dx}$ whenever differentiating $y$-terms), then isolate and solve for $\\frac{dy}{dx}$.

## 4. Applications of Derivatives

**Extrema, Critical Points, and Related Rates**
*   **Related Rates:** Procedure involves expressing related quantities in an equation, differentiating implicitly with respect to time $t$, and substituting known rates to evaluate the target rate of change.
*   **Critical Numbers:** A number $c$ in the domain of $f$ is a critical number if $f'(c) = 0$ or $f'(c)$ does not exist.
*   **Fermat's Theorem:** Relative extrema occur exclusively at critical numbers.
*   **Extreme Value Theorem:** A continuous function $f$ on a closed bounded interval $[a, b]$ is guaranteed to attain an absolute maximum and absolute minimum on that interval.

**Mean Value Theorem and Derivative Tests**
*   **Rolle's Theorem:** If $f$ is continuous on $[a, b]$, differentiable on $(a, b)$, and $f(a) = f(b)$, there exists at least one $c \\in (a, b)$ such that $f'(c) = 0$.
*   **Mean Value Theorem:** If $f$ is continuous on $[a, b]$ and differentiable on $(a, b)$, there exists at least one $c \\in (a, b)$ such that $f'(c) = \\frac{f(b) - f(a)}{b - a}$.
*   **Monotonicity:** $f'(x) > 0$ on an interval indicates $f$ is increasing; $f'(x) < 0$ indicates $f$ is decreasing.
*   **First Derivative Test:** If $f'$ changes sign from positive to negative at critical point $c$, $f(c)$ is a relative maximum; if $f'$ changes from negative to positive, $f(c)$ is a relative minimum.
*   **Second Derivative Test:** For a critical point where $f'(c) = 0$, if $f''(c) < 0$, $f(c)$ is a relative maximum; if $f''(c) > 0$, $f(c)$ is a relative minimum.

**Concavity, Inflection Points, and Curve Sketching**
*   **Concavity Test:** The graph of $f$ is concave upward where $f''(x) > 0$ and concave downward where $f''(x) < 0$.
*   **Inflection Point:** A point on the graph where concavity changes from upward to downward (or vice versa).
*   **Curve Graphing Strategy:** Systematic graphing involves determining domain/symmetry, derivatives $f'$ and $f''$, critical points, monotonic intervals, concavity/inflection points, asymptotes, and plotting key intercepts.

## 5. Indeterminate Forms and L'Hôspital's Rule

**L'Hôspital's Rule**
*   **Applicability:** Used for evaluating limits of indeterminate forms of type $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$.
*   **Transformations for Other Indeterminate Forms:** Forms such as $0 \\cdot \\infty$, $\\infty - \\infty$, $0^0$, $\\infty^0$, and $1^\\infty$ are converted into $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$ by applying algebraic manipulations or taking logarithms (using $f(x)^{g(x)} = e^{g(x) \\ln f(x)}$).
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 4: Derivatives and Applications',
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
    console.log('Successfully inserted Math Chapter 4!');
  }
}

run();
