require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 2: Theory of Demand and Supply

## 1. Theory of Demand

**Concept and Law of Demand**
*   **Definition of Demand:** Demand refers to the various quantities of a commodity or service that a consumer would purchase at a given time in a market at various prices, ceteris paribus.
*   **Law of Demand:** States that the price of a commodity and its quantity demanded are inversely related—as price increases (decreases), quantity demanded decreases (increases), ceteris paribus.

**Key Takeaways:**
*   Demand requires both the willingness and ability of consumers to buy a commodity at different price levels.
*   The inverse relationship between price and quantity demanded causes the demand curve to slope downwards from left to right.

**Demand Schedule, Demand Curve, and Demand Function**
*   **Demand Schedule:** A tabular list showing the various quantities of a commodity purchased by a consumer at different price levels.
*   **Demand Curve:** A graphical representation of the inverse relationship between price and quantity demanded per time period.
*   **Demand Function:** A mathematical relationship between price and quantity demanded, expressed generally as $Q_d = f(P)$ or linearly as $Q_d = a - bP$, where $b$ represents the slope ($\\frac{\\Delta Q}{\\Delta P}$).
*   **Market Demand:** Derived by horizontally adding the quantities demanded by all individual buyers in the market at each price level.

**Key Takeaways:**
*   Demand relationships can be expressed in three complementary forms: tables (schedules), graphs (curves), or algebraic equations (functions).
*   Market demand is the horizontal summation of all individual consumer demand curves.

**Determinants of Demand and Shifts in Demand Curve**
*   **Price vs. Non-Price Factors:** A change in the product's own price causes a movement along the demand curve (change in quantity demanded), whereas non-price determinants cause the entire curve to shift (change in demand).
*   **Determinants:**
    *   **Tastes and Preferences:** Favourable shifts in consumer preference increase demand.
    *   **Consumer Income:**
        *   *Normal Goods:* Demand increases as consumer income increases.
        *   *Inferior Goods:* Demand decreases as consumer income increases.
    *   **Prices of Related Goods:**
        *   *Substitute Goods:* Satisfy the same desire; the price of one good and demand for the other are directly related.
        *   *Complementary Goods:* Jointly consumed; the price of one good and demand for the other are inversely related.
    *   **Consumer Expectations:** Anticipating higher future prices or higher income increases current demand.
    *   **Number of Buyers:** An increase in the number of market buyers shifts market demand rightward.

**Key Takeaways:**
*   Price changes move along a fixed curve, while non-price determinants shift the demand curve rightward (increase) or leftward (decrease).

**Elasticity of Demand**
*   **Concept:** Measures the degree of responsiveness of quantity demanded to changes in any of its determinants.
*   **Price Elasticity of Demand ($E_d^p$):** Measures responsiveness to price changes, calculated as the percentage change in quantity demanded divided by the percentage change in price.
*   **Categories:** Elastic ($|E_d| > 1$), Inelastic ($0 \\le |E_d| < 1$), Unitary elastic ($|E_d| = 1$), Perfectly inelastic ($E_d = 0$), and Perfectly elastic ($E_d = \\infty$).
*   **Determinants:** Availability of substitutes, time horizon, proportion of income spent, and nature of the commodity (luxury vs. necessity).
*   **Income Elasticity of Demand ($E_I$):** Measures demand responsiveness to income changes. $E_I > 1$ (Luxury good), $0 < E_I < 1$ (Necessity good), and $E_I < 0$ (Inferior good).
*   **Cross-Price Elasticity of Demand ($E_{xy}$):** Measures demand responsiveness of good X to price changes of good Y. $E_{xy} > 0$ (Substitute goods), $E_{xy} < 0$ (Complementary goods), and $E_{xy} = 0$ (Unrelated goods).

**Key Takeaways:**
*   Price elasticity quantifies consumer price sensitivity, with substitute availability and time making demand more elastic.
*   Income elasticity classifies goods into normal (luxury/necessity) or inferior categories.
*   Cross-price elasticity determines whether two products are substitutes, complements, or independent.

## 2. Theory of Supply

**Concept and Law of Supply**
*   **Definition of Supply:** Indicates the various quantities of a product that sellers are willing and able to offer for sale at different prices in a given period, ceteris paribus.
*   **Law of Supply:** States that price and quantity supplied are positively related—as price increases (decreases), quantity supplied increases (decreases), ceteris paribus.

**Key Takeaways:**
*   Supply reflects producer capability and willingness to bring goods to market.
*   The positive relationship between price and quantity supplied causes the supply curve to slope upward from left to right.

**Supply Schedule, Supply Curve, and Supply Function**
*   **Supply Schedule:** A tabular statement showing quantities offered for sale at different price levels.
*   **Supply Curve:** The graphical representation of the supply schedule, sloping upwards.
*   **Supply Function:** Expressed mathematically as $S = f(P)$ or linearly as $Q_s = c + dP$.
*   **Market Supply:** Derived by horizontally adding the quantities supplied by all individual sellers at each price level.

**Key Takeaways:**
*   Supply can be presented as a schedule, an upward-sloping curve, or an equation.
*   Market supply sums individual producer outputs horizontally at each price point.

**Determinants of Supply**
*   **Input Prices (Cost of Production):** Higher input prices decrease supply (leftward shift); lower input prices increase supply.
*   **Technology:** Technological advancement enables greater production efficiency, shifting supply outward (rightward).
*   **Weather Conditions:** Favourable weather increases agricultural supply, whereas bad weather reduces output.
*   **Prices of Related Goods:** Changes in prices of alternative goods affect resource allocation across production outputs.
*   **Taxes and Subsidies:** Taxes raise production costs (reducing supply), whereas subsidies lower production costs (increasing supply).
*   **Sellers' Expectations & Number of Sellers:** Higher expected future prices reduce current supply; more market sellers increase total market supply.

**Key Takeaways:**
*   Own-price changes produce movements along the supply curve, whereas non-price determinants shift the entire supply curve.

**Elasticity of Supply**
*   **Concept and Formula:** Measures the responsiveness of quantity supplied to price changes, calculated as the percentage change in quantity supplied divided by the percentage change in price ($E_s = \\frac{\\% \\Delta Q_s}{\\% \\Delta P}$).
*   **Degrees of Elasticity:**
    *   Perfectly Inelastic ($E_s = 0$): Vertical supply line.
    *   Perfectly Elastic ($E_s = \\infty$): Horizontal straight line.
    *   Elastic ($E_s > 1$), Inelastic ($E_s < 1$), and Unitary Elastic ($E_s = 1$).

**Key Takeaways:**
*   Supply elasticity reflects how easily firms can adjust production levels in response to price shifts.

## 3. Market Equilibrium

**Determination of Market Equilibrium**
*   **Equilibrium Condition:** Occurs where market demand equals market supply ($Q_d = Q_s$), establishing the equilibrium (market-clearing) price and quantity.
*   **Market Disequilibrium:**
    *   **Surplus (Excess Supply):** Occurs when price is above equilibrium ($P > P_e$), causing $Q_s > Q_d$; seller competition drives price down.
    *   **Shortage (Excess Demand):** Occurs when price is below equilibrium ($P < P_e$), causing $Q_d > Q_s$; buyer competition bids price up.

**Key Takeaways:**
*   Equilibrium represents a balanced market state where buyers and sellers agree on price and quantity.
*   Market forces automatically eliminate surpluses and shortages to restore equilibrium.

**Effects of Shifts in Demand and Supply on Equilibrium**
*   **Shift in Demand (Supply Constant):**
    *   Increase in demand shifts $D$ rightward, raising both equilibrium price and quantity.
    *   Decrease in demand shifts $D$ leftward, lowering both equilibrium price and quantity.
*   **Shift in Supply (Demand Constant):**
    *   Increase in supply shifts $S$ rightward, lowering equilibrium price and increasing equilibrium quantity.
    *   Decrease in supply shifts $S$ leftward, raising equilibrium price and lowering equilibrium quantity.
*   **Simultaneous Shifts:**
    *   Simultaneous increases in both demand and supply definitely increase quantity, but the price effect depends on relative shift magnitudes.
    *   Simultaneous decreases in both demand and supply definitely decrease quantity, while price changes depend on relative shift sizes.

**Key Takeaways:**
*   Single demand shifts move price and quantity in the same direction.
*   Single supply shifts move price and quantity in opposite directions.
*   Combined shifts yield deterministic quantity changes but ambiguous price effects depending on relative shift magnitudes.`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 2: Theory of Demand and Supply',
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
    console.log('Successfully inserted chapter 2!');
  }
}

run();
