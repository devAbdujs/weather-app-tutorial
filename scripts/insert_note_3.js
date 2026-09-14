require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 3: Theory of Consumer Behaviour

## 1. Consumer Preferences and the Concept of Utility

**Consumer Preferences**
*   **Premise of Consumer Theory:** Consumer theory assumes that individual preferences can be inferred directly from choice behaviour when comparing commodity bundles.
*   **Preference Relations:** Consumers evaluate consumption bundles using three primary preference relations: strict preference ($X \\succ Y$), indifference ($X \\sim Y$), and weak preference ($X \\succeq Y$).

**Key Takeaways:**
*   A consumer strictly prefers bundle X to Y ($X \\succ Y$) if X is definitely chosen over Y.
*   Indifference ($X \\sim Y$) means both bundles yield identical satisfaction to the consumer.
*   Weak preference ($X \\succeq Y$) implies X is considered at least as good as Y.

**Concept of Utility**
*   **Definition:** Utility refers to the satisfaction or pleasure derived from consuming a good or service, representing a product's capacity to satisfy human wants.
*   **Characteristics of Utility:** Utility is subjective and varies across individuals, times, and locations; it is not synonymous with usefulness.

**Key Takeaways:**
*   Utility reflects want-satisfying power rather than objective functional usefulness.
*   Utility is inherently subjective, meaning different individuals derive distinct levels of satisfaction from identical goods.

## 2. Approaches to Measuring Utility

**Cardinal Utility Theory**
*   **Core Concept:** The cardinalist school posits that utility is objectively measurable in absolute physical units called utils (e.g. 1, 2, 3 utils).
*   **Assumptions of Cardinal Theory:**
    *   **Consumer Rationality:** The consumer seeks to maximize total utility subject to income constraints.
    *   **Cardinal Measurability:** Satisfaction derived from each commodity can be quantified in utils.
    *   **Constant Marginal Utility of Money:** The subjective value of a unit of money remains constant regardless of spending level.
    *   **Diminishing Marginal Utility:** Additional satisfaction declines with each successive unit consumed.
    *   **Additive Utility:** Total utility is a function of the quantities of individual goods consumed ($TU = f(X_1, X_2, \\dots, X_n)$).

**Key Takeaways:**
*   Cardinal utility assumes satisfaction can be quantified objectively using utils.
*   The model assumes rational consumers, constant marginal utility of money, and additive total utility.

**Total Utility (TU) and Marginal Utility (MU)**
*   **Total Utility (TU):** The aggregate satisfaction a consumer receives from consuming a specific total quantity of a commodity.
*   **Marginal Utility (MU):** The additional satisfaction gained from consuming one additional unit of a good, calculated as $MU = \\frac{\\Delta TU}{\\Delta Q}$.
*   **Relationship Between TU and MU:**
    *   When TU is increasing, MU is positive.
    *   When TU reaches its maximum (saturation point), MU equals zero.
    *   When TU begins to decrease, MU becomes negative.

**Key Takeaways:**
*   Marginal utility represents the slope of the total utility curve.
*   Total utility reaches its peak at the saturation point where marginal utility is exactly zero.

**Law of Diminishing Marginal Utility (LDMU)**
*   **Statement of the Law:** As the quantity of a commodity consumed increases per unit of time, the utility derived from each additional successive unit declines, ceteris paribus.
*   **Underlying Assumptions:** Requires a rational consumer, consumption of identical/homogeneous units, continuous consumption without time gaps, and constant consumer tastes.

**Key Takeaways:**
*   Successive consumption of identical goods yields progressively lower incremental satisfaction.
*   The law holds only when goods are homogeneous and consumed continuously without time gaps.

**Consumer Equilibrium under Cardinal Theory**
*   **Single Commodity Case:** A rational consumer maximizes utility when the marginal utility of good X equals its market price ($MU_X = P_X$).
    *   If $MU_X > P_X$, the consumer increases consumption of X to gain net utility.
    *   If $MU_X < P_X$, the consumer reduces consumption of X.
*   **Multi-Commodity Case (Equi-Marginal Principle):** Utility is maximized when the marginal utility per birr/dollar spent is equal across all purchased commodities, and full money income is spent ($\\frac{MU_X}{P_X} = \\frac{MU_Y}{P_Y}$ subject to $P_X X + P_Y Y = M$).
*   **Limitations of Cardinal Theory:** Quantifying utility in objective utils is unrealistic, and assuming constant marginal utility of money is flawed because money's marginal value changes as income varies.

**Key Takeaways:**
*   Single-good equilibrium requires $MU_X = P_X$.
*   Multi-good equilibrium requires equalizing marginal utility per unit of currency spent across all items ($\\frac{MU_X}{P_X} = \\frac{MU_Y}{P_Y}$).
*   Cardinal theory is limited by the unquantifiable nature of utility and the false assumption of constant money utility.

## 3. Ordinal Utility Theory (Indifference Curve Approach)

**Core Concept and Assumptions**
*   **Ordinal Approach:** Rejects cardinal measurement, asserting that consumers cannot quantify utility in utils but can rank or order consumption bundles by preference ($1^\\text{st}, 2^\\text{nd}, 3^\\text{rd}$).
*   **Assumptions of Ordinal Theory:**
    *   **Consumer Rationality:** Consumers maximize satisfaction given budget constraints.
    *   **Ordinal Utility:** Preferences are ranked rather than measured cardinally.
    *   **Diminishing Marginal Rate of Substitution:** Consumers give up progressively fewer units of one good for additional units of another.
    *   **Transitivity and Consistency:** Preferences are consistent; if $X \\succ Y$ and $Y \\succ Z$, then $X \\succ Z$.

**Key Takeaways:**
*   Ordinal utility relies on ranking commodity bundles rather than measuring utils.
*   Assumes rational behavior, preference transitivity, and diminishing marginal rates of substitution.

**Indifference Set, Indifference Curve, and Indifference Map**
*   **Indifference Set (Schedule):** A table of commodity combinations that yield the exact same level of total satisfaction to the consumer.
*   **Indifference Curve (IC):** The graphical representation of an indifference set, showing all combinations of two goods that provide equal utility.
*   **Indifference Map:** A family or set of indifference curves representing different levels of satisfaction.

**Key Takeaways:**
*   Points along a single indifference curve yield identical total satisfaction.
*   An indifference map displays multiple curves corresponding to varying utility levels.

**Properties of Indifference Curves**
*   **Downward Sloping (Negative Slope):** To maintain a constant level of utility, increasing consumption of one good requires reducing consumption of the other.
*   **Convex to the Origin:** The slope of an indifference curve decreases in absolute terms along the curve, reflecting the diminishing marginal rate of substitution.
*   **Higher Curves Preferred:** Indifference curves further from the origin denote higher utility levels because higher curves contain greater quantities of goods.
*   **Curves Never Intersect:** Indifference curves cannot cross; an intersection would violate the axioms of consistency and transitivity.

**Key Takeaways:**
*   Indifference curves slope downward, are convex due to diminishing MRS, do not cross, and represent higher satisfaction further from the origin.

**Marginal Rate of Substitution (MRS)**
*   **Definition:** The rate at which a consumer is willing to give up units of good Y to acquire one additional unit of good X while maintaining the same total satisfaction level ($MRS_{X,Y} = -\\frac{\\Delta Y}{\\Delta X}$).
*   **Relationship to Marginal Utility:** The MRS equals the ratio of the marginal utilities of the two goods ($MRS_{X,Y} = \\frac{MU_X}{MU_Y}$).
*   **Diminishing MRS:** As consumption of good X increases, the consumer is willing to give up fewer units of good Y for each additional unit of X, causing the IC to be convex.

**Key Takeaways:**
*   MRS measures the trade-off ratio between two goods along an indifference curve.
*   $MRS_{X,Y}$ is mathematically equal to $\\frac{MU_X}{MU_Y}$ and diminishes as X consumption rises.

## 4. The Budget Line (Price Line)

**Concept and Equation of the Budget Line**
*   **Definition:** A graph showing all combinations of two goods a consumer can purchase by spending their entire fixed money income at prevailing market prices.
*   **Budget Equation:** Given income $M$ and prices $P_X$ and $P_Y$, the budget constraint is $P_X X + P_Y Y = M$, expressed in slope-intercept form as $Y = \\frac{M}{P_Y} - \\left(\\frac{P_X}{P_Y}\\right) X$.
*   **Slope and Intercepts:**
    *   Vertical intercept is $\\frac{M}{P_Y}$; horizontal intercept is $\\frac{M}{P_X}$.
    *   The slope of the budget line is the negative price ratio: $-\\frac{P_X}{P_Y}$.
*   **Attainability:** Points on or inside the budget line are attainable; points outside are unaffordable/unattainable.

**Key Takeaways:**
*   The budget line defines the boundary of affordable consumption bundles.
*   Its slope is determined by the relative price ratio ($-\\frac{P_X}{P_Y}$).

**Shifts and Rotations of the Budget Line**
*   **Change in Income:** A change in consumer income (with prices constant) causes a parallel shift of the budget line outward (income increase) or inward (income decrease), keeping slope constant.
*   **Proportionate Change in Both Prices:** Equal percentage changes in both prices shift the line parallel inward (prices rise) or outward (prices fall).
*   **Change in Price of One Good:** A price change in good X alone alters the horizontal intercept and rotates the budget line (making it flatter if $P_X$ decreases or steeper if $P_X$ increases) while keeping the vertical intercept constant.

**Key Takeaways:**
*   Income changes cause parallel shifts without altering the slope.
*   Single-good price changes rotate the budget line by changing its slope.

## 5. Consumer Equilibrium in Ordinal Analysis

**Condition for Consumer Optimum**
*   **Tangency Condition:** Consumer equilibrium is achieved where the budget line is tangent to the highest attainable indifference curve.
*   **Mathematical Condition:** At tangency, the slope of the indifference curve ($MRS_{X,Y}$) equals the slope of the budget line ($\\frac{P_X}{P_Y}$).
*   **Equilibrium Condition:**
    $$MRS_{X,Y} = \\frac{P_X}{P_Y} \\implies \\frac{MU_X}{MU_Y} = \\frac{P_X}{P_Y} \\implies \\frac{MU_X}{P_X} = \\frac{MU_Y}{P_Y}$$

**Key Takeaways:**
*   Optimal consumer choice occurs at the point of tangency between the budget line and the highest possible indifference curve.
*   At equilibrium, the subjective rate of substitution ($MRS_{X,Y}$) exactly equals the market rate of exchange ($\\frac{P_X}{P_Y}$).
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 3: Theory of Consumer Behaviour',
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
    console.log('Successfully inserted chapter 3!');
  }
}

run();
