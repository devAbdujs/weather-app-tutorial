require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `Chapter 1: Basics of Economics

## 1. Definition and Rationale of Economics

**Definition and Origin of Economics**
*   **Origin of the Term:** The word "economy" stems from the Greek phrase meaning "one who manages a household". Economics in its modern formal form began in 1776 when Adam Smith—widely regarded as the father of economics—published *An Inquiry into the Nature and Causes of Wealth of Nations*.
*   **Evolving Definitions:** Economists have historically defined the subject from four distinct perspectives: wealth, welfare, scarcity, and growth definitions.
*   **Formal Definition:** Economics is a social science that studies the efficient allocation of scarce resources so as to attain the maximum fulfillment of unlimited human needs.

**Key Takeaways:**
*   Economics is fundamentally a science of choice dealing with scarce economic resources.
*   Human needs and material wants are unlimited, whereas productive resources are finite.
*   The central aim of economics is achieving maximum want satisfaction through optimal resource allocation.

**Rationales of Economics**
*   **Fundamental Facts:** The discipline rests on two core facts: society's material wants are unlimited, and economic resources are limited or scarce.
*   **Core Decision-Making:** Scarcity forces individuals, families, and nations to make choices about resource usage, placing choice at the heart of all economic decisions.

**Key Takeaways:**
*   Scarcity necessitates making choices among alternative resource uses.
*   Economists evaluate decision outcomes using criteria such as efficiency, equity, and stability.

## 2. Scope and Method of Analysis in Economics

**Branches of Economics: Microeconomics vs Macroeconomics**

**Microeconomics:** Examines the economic behaviour of individual decision-making units such as households, firms, specific markets, and industries.
*   **Central Problem:** Price determination and resource allocation.
*   **Main Tools:** Demand and supply of particular commodities and factor inputs.
*   **Objective:** Solving "what, how, and for whom to produce" to maximize profits and achieve unit equilibrium.

**Macroeconomics:** Examines the aggregate behaviour of all decision-making units in an economy as a whole.
*   **Central Problem:** Determination of national income, aggregate output, and employment levels.
*   **Main Tools:** Aggregate demand and aggregate supply.
*   **Objective:** Achieving full employment of resources and price level stability across the economy.

**Positive and Normative Analysis**

*   **Positive Economics:** Focuses on factual analysis and describes the world as it is, addressing questions of "what was," "what is," or "what will be" without value judgments. Disagreements can be tested and verified against facts.
*   **Normative Economics:** Evaluates the desirability of outcomes based on personal value judgments, addressing questions of "what ought to be" or "what the economy should be". Disagreements are subjective opinions settled through voting.

## 3. Scarcity, Choice, Opportunity Cost, and the PPF

**Free Resources vs Economic (Scarce) Resources**
*   **Free Resources:** Resources available in quantities greater than what society desires at zero price (e.g. sunshine).
*   **Scarce / Economic Resources:** Resources whose available supply is less than what people desire at zero price.

**Four Categories of Economic Factors:**
1.  **Labour:** Physical and mental human effort used in producing goods and services; rewarded with wages.
2.  **Land:** Natural resources and free gifts of nature; rewarded with rent.
3.  **Capital:** Manufactured inputs used to produce other goods and services (e.g. machinery, equipment); rewarded with interest.
4.  **Entrepreneurship:** Specialized human talent that organizes factors, makes business policies, introduces innovations, and assumes risk of loss; rewarded with profit.

**Choice and Opportunity Cost**
*   **Choice:** Because resources are finite, output is limited, forcing society to decide which goods to produce and which wants to forgo.
*   **Opportunity Cost:** The value or amount of the next best alternative sacrificed in order to obtain one more unit of a product.

**Production Possibilities Frontier (PPF / PPC)**
*   **Definition:** A curve showing the various maximum output combinations of two goods an economy can produce given its available resources and technology.
*   **Economic Growth:** Represented by an outward shift of the PPF, caused by an increase in resource quantity/quality or technological advancement.

## 4. Basic Economic Questions

Scarcity forces every economic system to answer three fundamental questions:
1.  **What to Produce? (Resource Allocation):** Deciding which commodities and quantities to produce.
2.  **How to Produce? (Choice of Technique):** Selecting methods of production, primarily choosing between labour-intensive techniques and capital-intensive techniques.
3.  **For Whom to Produce? (Distribution of Product):** Determining how national output is distributed among members of society.

## 5. Economic Systems

*   **Capitalist Economy (Free Market / Laissez-Faire):** System where means of production are privately owned, and economic activities are driven by individual profit motives with minimal state intervention.
*   **Command Economy (Socialist / Centrally Planned):** System where production and distribution institutions are owned and controlled by the state.
*   **Mixed Economy:** System combining elements of both capitalism and command economies, allowing public and private sectors to co-exist.

## 6. Decision-Making Units and the Circular Flow Model

**Decision-Making Units**
1.  **Households:** Supply productive factors (labour, land, capital) and purchase final goods/services.
2.  **Firms:** Hire economic resources to produce and sell goods/services.
3.  **Government:** Collects taxes, buys goods/factors, and provides public goods, subsidies, and income support.`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 1: Basics of Economics',
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
    console.log('Successfully inserted note!');
  }
}

run();
