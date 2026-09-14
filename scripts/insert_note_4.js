require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 4: Theory of Production and Costs

## 1. Theory of Production in the Short Run

**Definition of Production and Production Function**
*   **Definition of Production:** Production is the process of transforming inputs into outputs, or the act of creating value and utility. The resulting outputs can be tangible goods or intangible services.
*   **Production Function:** A technical relationship showing the maximum output that can be produced using a fixed amount of inputs with existing technology, expressed generally as $Q = f(X_1, X_2, \\dots, X_n)$.
*   **Classification of Inputs:**
    *   **Fixed Inputs:** Inputs whose quantities cannot easily be altered in the short term to adjust output (e.g. land, buildings, and machinery).
    *   **Variable Inputs:** Inputs whose quantities can be changed almost instantaneously in response to desired output adjustments (e.g. raw materials and unskilled labour).
*   **Short-Run Concept:** In economics, the short run is defined as a time period during which at least one production input remains fixed. For a firm using capital ($K$, fixed) and labour ($L$, variable), the short-run production function is written as $Q = f(L)$.

**Key Takeaways:**
*   Production converts factor inputs into want-satisfying goods and services.
*   Short-run production assumes at least one input is fixed while output varies by altering variable inputs.
*   Production functions represent the maximum technical output obtainable from specified input combinations.

**Total, Average, and Marginal Product**
*   **Total Product ($TP$ or $Q$):** The aggregate output produced by efficiently utilizing specific combinations of variable and fixed inputs. The $TP$ curve initially increases at an increasing rate, then increases at a decreasing rate, reaches a maximum point, and eventually declines.
*   **Marginal Product ($MP_L$):** The change in total output resulting from adding one additional unit of the variable input, holding all other inputs constant ($MP_L = \\frac{\\Delta TP}{\\Delta L} = \\frac{dTP}{dL}$). Graphically, $MP_L$ measures the slope of the $TP$ curve at any point.
*   **Average Product ($AP_L$):** The mean output produced per unit of variable input ($AP_L = \\frac{TP}{L}$). It is geometrically measured by the slope of a ray drawn from the origin to a corresponding point on the $TP$ curve.
*   **Mathematical Relationship Between $MP_L$ and $AP_L$:**
    *   When $AP_L$ is increasing, $MP_L > AP_L$.
    *   When $AP_L$ is at its maximum value, $MP_L = AP_L$.
    *   When $AP_L$ is decreasing, $MP_L < AP_L$.

**Key Takeaways:**
*   $MP_L$ represents the slope of $TP$, while $AP_L$ measures average output per unit of variable input.
*   The $MP_L$ curve intersects the $AP_L$ curve at the exact peak of the $AP_L$ curve.

**Law of Variable Proportions (Law of Diminishing Returns)**
*   **Statement of the Law:** As successive units of a variable input (such as labour) are added to a fixed input (such as capital), beyond a certain point the marginal product attributable to each additional unit of the variable resource will decline.
*   **Underlying Assumptions:** Production technology is assumed to be fixed, and all units of the variable input are assumed to be homogeneous in quality.
*   **Cause of Diminishing Returns:** Marginal product declines not due to inferior worker skill, but because an increasing number of variable inputs must share a fixed amount of plant and equipment.

**Key Takeaways:**
*   The law operates once the marginal product curve reaches its peak.
*   Diminishing returns stem from the physical constraint of combining variable inputs with a fixed plant capacity.

**Stages of Short-Run Production**
*   **Stage I (Stage of Increasing Average Productivity):** Extends from the origin to the point where $AP_L$ reaches its maximum ($MP_L = AP_L$). This stage is economically inefficient because the variable input is too small relative to the fixed input, leaving the fixed input under-utilized.
*   **Stage II (Stage of Diminishing Returns):** Extends from the maximum of $AP_L$ ($MP_L = AP_L$) to the point where $MP_L$ becomes zero ($TP$ reaches its peak). This is the only efficient region of production because the fixed resource is being optimally utilized and additional variable inputs contribute positively to total product.
*   **Stage III (Stage of Negative Returns):** Begins where $MP_L$ becomes negative and $TP$ slopes downward. This stage is irrational because adding more variable inputs actively decreases total output due to severe over-utilization of the fixed factor.

**Key Takeaways:**
*   Rational firms operate exclusively within Stage II, where marginal product is declining but positive.
*   Stage I represents under-utilization of fixed inputs, whereas Stage III represents over-utilization.

## 2. Theory of Costs in the Short Run

**Definition and Types of Costs**
*   **Definition of Cost:** Cost is the monetary valuation of all inputs used in the production of a product.
*   **Explicit vs. Implicit Costs:**
    *   **Explicit Costs (Accounting Costs):** Direct out-of-pocket monetary expenses incurred to purchase or hire inputs from outside suppliers (e.g. wages, raw material costs, rent, interest).
    *   **Implicit Costs:** Estimated opportunity costs of self-owned or non-purchased resources used in production (e.g. foregone salary of an entrepreneur).
*   **Economic Cost vs. Accounting Cost:**
    *   **Accounting Cost:** Sum of explicit costs only.
    *   **Economic Cost:** Sum of both explicit costs and implicit costs.
*   **Accounting Profit vs. Economic Profit:**
    *   $\\text{Accounting Profit} = \\text{Total Revenue} - \\text{Explicit Cost}$.
    *   $\\text{Economic Profit} = \\text{Total Revenue} - \\text{Economic Cost} (\\text{Explicit Cost} + \\text{Implicit Cost})$.
    *   Accounting profit exceeds economic profit by the exact value of implicit costs.

**Key Takeaways:**
*   Accounting cost tracks direct monetary expenses, whereas economic cost includes opportunity costs of self-owned factors.
*   Economic profit accounts for full resource costs to reflect true economic performance.

**Short-Run Total, Average, and Marginal Costs**
*   **Short-Run Total Cost Breakdown:** $\\text{Total Cost } (TC) = \\text{Total Fixed Cost } (TFC) + \\text{Total Variable Cost } (TVC)$.
*   **Total Fixed Cost ($TFC$):** Costs that do not vary with output levels and cannot be avoided even if output is zero (e.g. building rent, depreciation, administrative salaries). Graphically, $TFC$ is a horizontal line parallel to the output axis.
*   **Total Variable Cost ($TVC$):** Costs that vary directly with output volume (e.g. raw materials, direct labour). The $TVC$ curve has an inverse S-shape reflecting the law of variable proportions.
*   **Total Cost ($TC$):** The vertical sum of $TFC$ and $TVC$ at each output level, adopting an inverse S-shape identical to $TVC$ starting at $TFC$ when output is zero.
*   **Per-Unit Short-Run Cost Functions:**
    *   **Average Fixed Cost ($AFC$):** $TFC$ per unit of output ($AFC = \\frac{TFC}{Q}$). The $AFC$ curve continuously declines as output increases, forming a rectangular hyperbola.
    *   **Average Variable Cost ($AVC$):** $TVC$ per unit of output ($AVC = \\frac{TVC}{Q}$).
    *   **Average Total Cost ($AC$ or $ATC$):** Total cost per unit of output ($AC = \\frac{TC}{Q} = AVC + AFC$).
    *   **Marginal Cost ($MC$):** The additional cost incurred to produce one extra unit of output ($MC = \\frac{\\Delta TC}{\\Delta Q} = \\frac{dTC}{dQ} = \\frac{dTVC}{dQ}$). Graphically, $MC$ represents the slope of the $TC$ or $TVC$ curve.
*   **Shape and Intersections:**
    *   $AVC$, $AC$, and $MC$ curves are all U-shaped due to the law of variable proportions.
    *   The rising $MC$ curve intersects both the $AVC$ curve and the $AC$ curve at their respective minimum points.

**Key Takeaways:**
*   Total cost combines fixed costs (constant) and variable costs (output-dependent).
*   The U-shape of $AVC$, $AC$, and $MC$ curves reflects changing returns from variable input combinations.
*   $MC$ passes through the bottom point of both $AVC$ and $AC$ curves.

**Relationship Between Short-Run Production and Cost Curves**
*   **Mathematical Link:** Assuming a constant wage rate ($w$) for variable labour ($L$):
    *   $\\text{Marginal Cost: } MC = \\frac{w}{MP_L}$
    *   $\\text{Average Variable Cost: } AVC = \\frac{w}{AP_L}$
*   **Inverse Relationship (Mirror Images):**
    *   $MC$ and $MP_L$ are inversely related: when $MP_L$ rises, $MC$ falls; when $MP_L$ is at its maximum, $MC$ reaches its minimum.
    *   $AVC$ and $AP_L$ are inversely related: when $AP_L$ rises, $AVC$ falls; when $AP_L$ is at its maximum, $AVC$ reaches its minimum.
    *   Graphically, the $MC$ curve is the mirror image of the $MP_L$ curve, and the $AVC$ curve is the mirror image of the $AP_L$ curve.

**Key Takeaways:**
*   Physical productivity directly determines monetary production costs.
*   Peak input efficiency ($MP_L$ and $AP_L$ maxima) directly coincides with minimum per-unit variable costs ($MC$ and $AVC$ minima).
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 4: Theory of Production and Costs',
    content: content,
    department: 'Economics',
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
    console.log('Successfully inserted chapter 4!');
  }
}

run();
