require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 5: Market Structure

## 1. Concept of Market in Physical and Digital Space

**Definition and Scope of Markets**
*   **Definition of Market:** A market is the process of planning and executing the conception, pricing, promotion, and distribution of goods, services, and ideas to create exchanges that satisfy individual and organizational objectives. It describes both physical places and digital spaces where transactions occur.
*   **Physical vs. Digital Markets:**
    *   **Physical Markets:** Buyers and sellers interact face-to-face in a physical environment, allowing marketers a personal approach to reach local target customers.
    *   **Digital Markets:** Transactions take place in electronic or digital space, eliminating physical proximity requirements.

**Key Takeaways:**
*   Markets encompass both physical spaces and digital platforms where goods, services, and ideas are transacted.
*   The choice between physical and digital marketing depends primarily on the nature of the products and services offered.

## 2. Perfectly Competitive Market

**Assumptions of Perfect Competition**
*   **Pure / Perfect Competition:** A market structure characterized by a complete absence of rivalry among individual firms.
*   **Six Core Assumptions:**
    *   **Large Number of Buyers and Sellers:** Individual market shares are infinitesimally small, making all market participants price-takers who accept the market-clearing price determined by aggregate demand and supply.
    *   **Homogeneous Product:** Products across firms are identical perfect substitutes, giving no individual seller a competitive advantage.
    *   **Perfect Factor Mobility:** Factors of production (labour, capital, raw materials) can move freely across jobs, firms, and regions without monopolistic barriers.
    *   **Free Entry and Exit:** No legal, economic, or technological obstacles prevent new firms from entering or existing firms from quitting the industry.
    *   **Perfect Market Information:** All buyers and sellers possess complete knowledge regarding current and future prices and product availability.
    *   **No Government Interference:** Operating under a free-enterprise (laissez-faire) policy without discriminatory taxes, subsidies, or price controls.
*   **Firm Demand Curve:** Because a perfectly competitive firm is a price-taker, it faces a perfectly elastic (horizontal) demand curve at the market price ($D_f = P_m$).

**Key Takeaways:**
*   Perfect competition features price-taking firms, identical products, and unrestricted factor mobility and entry/exit.
*   An individual firm faces a horizontal demand curve where price equals demand ($P = D_f$).

**Short-Run Equilibrium of the Firm (Revenue and Profit Maximization)**
*   **Revenue Concepts:**
    *   **Total Revenue ($TR$):** Total receipts from selling output, calculated as $TR = P \\times Q$.
    *   **Average Revenue ($AR$):** Revenue per unit sold, calculated as $AR = \\frac{TR}{Q} = P$.
    *   **Marginal Revenue ($MR$):** Additional revenue gained from selling one extra unit, calculated as $MR = \\frac{\\Delta TR}{\\Delta Q} = P$ (since price is constant).
    *   **Revenue Identity:** In perfect competition, $AR = MR = P = D_f$.
*   **Profit Maximization Approaches:**
    *   **Total Approach ($TR - TC$):** Profit ($\\pi = TR - TC$) is maximized at the output level where the positive vertical distance between $TR$ and $TC$ is greatest.
    *   **Marginal Approach ($MR - MC$):** Profit is maximized when two conditions are met:
        *   *First-Order Condition (FOC):* $MR = MC$ (or $P = MC$).
        *   *Second-Order Condition (SOC):* The slope of $MC$ is greater than the slope of $MR$ (i.e. $MC$ must be rising).

**Key Takeaways:**
*   In perfect competition, price, average revenue, and marginal revenue are identical ($P = AR = MR$).
*   Equilibrium output requires $MR = MC$ on the rising portion of the marginal cost curve.

**Profit, Loss, and Shut-Down Conditions**
*   **Short-Run Financial Outcomes:** Depending on the position of Average Total Cost ($AC$) at equilibrium output ($Q_e$):
    *   **Economic (Supernormal Profit):** Earned when price exceeds average cost ($P > AC$).
    *   **Normal Profit (Break-Even Point):** Earned when price equals average cost ($P = AC$), yielding zero economic profit.
    *   **Economic Loss:** Incurred when price is less than average cost ($P < AC$).
*   **Shut-Down Decision:**
    *   A firm will continue producing in the short run despite losses as long as price covers average variable cost ($P \\ge AVC$) to offset a portion of fixed costs.
    *   **Shut-Down Point:** Occurs where $P = \\text{minimum } AVC$. If $P < AVC$, the firm minimizes losses by shutting down completely.

**Key Takeaways:**
*   Short-run profit status depends on the relative position of price ($P$) to average total cost ($AC$).
*   A firm stays open at a loss if $P \\ge AVC$, but shuts down immediately if price falls below minimum $AVC$.

**Short-Run Equilibrium of the Industry and Supply Curve**
*   **Firm Supply Curve:** A competitive firm's short-run supply curve is the rising segment of its marginal cost ($MC$) curve above the minimum $AVC$ (shut-down point).
*   **Industry Supply Curve:** Obtained by horizontally summing the individual supply curves of all firms in the market.
*   **Industry Equilibrium:** Attained when total industry supply equals total market demand at the market-clearing price.

**Key Takeaways:**
*   A firm's short-run supply curve is its $MC$ curve above the $AVC$ minimum.
*   Market supply is the horizontal aggregate of all individual firm supply curves.

## 3. Pure Monopoly Market

**Definition and Characteristics**
*   **Definition of Monopoly:** A market structure in which a single firm is the sole producer of a product with no close substitutes.
*   **Four Primary Characteristics:**
    *   **Single Seller:** The firm and the industry are identical; one enterprise supplies the entire market.
    *   **No Close Substitutes:** The product is unique, offering buyers no reasonable alternative options.
    *   **Price Maker:** The monopolist controls total supply, giving it substantial control over price by adjusting output along a downward-sloping demand curve.
    *   **Blocked Entry:** Severe economic, legal, or technological barriers prevent potential competitors from entering the industry.

**Key Takeaways:**
*   A monopoly represents a one-firm industry producing a unique good with complete entry barriers.
*   Monopolists are price-makers who face a downward-sloping market demand curve.

**Sources of Monopoly Power (Barriers to Entry)**
*   **Primary Entry Barriers:**
    *   **Legal Restrictions:** Government-created monopolies established through public interest mandates (e.g. postal services, state electricity grids, railways, telecommunications).
    *   **Control over Key Raw Materials:** Monopolization resulting from sole ownership of essential inputs (e.g. historical control of bauxite supplies by Alcoa).
    *   **Efficiency and Economies of Scale (Natural Monopoly):** When a single large plant can produce total market output at a lower average cost than multiple smaller firms, enabling it to undercut rivals.
    *   **Patent Rights:** Government-granted exclusive rights to produce a specific good or utilize a specialized technique.

**Key Takeaways:**
*   Monopoly power is maintained through legal mandates, raw material control, natural cost advantages, and patents.
*   Natural monopolies emerge when economies of scale allow one firm to serve the market at minimum unit cost.

## 4. Monopolistically Competitive Market

**Definition and Characteristics**
*   **Definition:** A market structure containing relatively many firms selling differentiated products, blending competitive and monopolistic elements.
*   **Four Core Characteristics:**
    *   **Product Differentiation:** Products sold by different suppliers are close substitutes but not identical, differing in quality, design, brand name, or packaging.
    *   **Many Buyers and Sellers:** A substantial number of market participants exists, though fewer than under perfect competition.
    *   **Easy Entry and Exit:** No significant barriers impede new firms from entering or existing firms from leaving.
    *   **Non-Price Competition:** Heavy reliance on advertising, customer service, warranties, and branding to establish brand loyalty.

**Key Takeaways:**
*   Combines competition (many sellers, free entry) with limited monopoly power stemming from product differentiation.
*   Firms engage extensively in non-price competition like marketing and brand building.

## 5. Oligopoly Market

**Characteristics and Interdependence**
*   **Definition:** A market structure dominated by a few large firms that account for a major portion of total output.
*   **Key Features:**
    *   **Mutual Interdependence:** Because each firm holds a large market share, any price or output decision by one firm directly impacts rival firms, forcing strategic reaction.
    *   **High Entry Barriers:** Significant obstacles such as massive economies of scale, heavy capital requirements, legal constraints, or strategic input control hinder new entrants.
    *   **Asymmetric Firm Sizes:** Firms differ substantially in size, creating asymmetric market power.
    *   **Non-Price Competition:** Firms actively avoid price competition to prevent destructive price wars, competing instead through advertising and quality enhancements.
    *   **Duopoly:** A specific two-firm oligopoly structure.

**Key Takeaways:**
*   Mutual interdependence among a few dominant firms is the defining hallmark of oligopoly.
*   High barriers keep rivals out, and firms prefer non-price competition over price wars.

**Summary Comparison of Market Structures**
*   **Comparative Overview:**
    *   **Pure Competition:** Large number of sellers; homogeneous product; no price control; very easy entry (e.g. agricultural goods).
    *   **Monopolistic Competition:** Many sellers; differentiated product; narrow price control; easy entry (e.g. retail clothing, shoes).
    *   **Oligopoly:** Few sellers; homogeneous or differentiated products; price control limited by interdependence/collusion; high entry barriers (e.g. steel, automobiles).
    *   **Pure Monopoly:** Single seller; unique product with no substitutes; significant price control; blocked entry (e.g. local public utilities).

**Key Takeaways:**
*   Market structures vary along a continuum from perfect competition (zero market power) to pure monopoly (complete market power) based on seller numbers, product differentiation, and entry barriers.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 5: Market Structure',
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
    console.log('Successfully inserted chapter 5!');
  }
}

run();
