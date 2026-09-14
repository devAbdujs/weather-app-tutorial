require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 1: Physical Quantities and Measurement

## 1. Definition of Physics and Measurement

**Nature of Physics:**
*   Physics originates from the Greek word for "nature" and deals with matter in relation to energy and the accurate measurement of natural phenomena.
*   **Concept of Measurement:** Measurement is the act of comparing an unknown physical quantity with a known fixed standard quantity termed a unit.
*   **Physical Quantity:** Defined as a quantifiable or assignable property ascribed to a particular phenomenon or body.

**Basic and Derived Physical Quantities:**
*   **Basic (Fundamental) Quantities:** Physical quantities that cannot be expressed in terms of any other physical quantity.
*   **Seven SI Base Quantities:** The International System of Units (SI) is built upon seven fundamental quantities: Length (metre, $\\text{m}$), Mass (kilogram, $\\text{kg}$), Time (second, $\\text{s}$), Temperature (kelvin, $\\text{K}$), Electric Current (ampere, $\\text{A}$), Amount of Substance (mole, $\\text{mol}$), and Luminous Intensity (candela, $\\text{cd}$).
*   **Derived Quantities:** Quantities that are expressed in terms of fundamental quantities, such as area, volume, density, force ($\\text{N}$), speed ($\\text{m/s}$), pressure ($\\text{Pa}$), energy ($\\text{J}$), and power ($\\text{W}$).

**SI Units and Unit Conversion:**
*   **Standardised System:** Standardised unit values were formally established under the SI system in 1960 to provide a logically superior, globally accepted framework for comparison.
*   **Unit Conversion Method:** Quantities are converted by multiplying by conversion factors in dimensional analysis so that unwanted units cancel out and desired units are introduced.

## 2. Uncertainty in Measurement and Significant Digits

**Measurement Uncertainty and Types of Errors:**
*   **Concept of Uncertainty:** Characterises the range of possible values surrounding a measurement result within which the true value lies; no physical measurement is entirely accurate.
*   **Systematic Errors:** Errors caused by measuring devices being out of calibration, making readings consistently too large or too small; these can be eliminated by pre-calibrating against trusted standards.
*   **Random Errors:** Errors arising from unpredictable fluctuations or scale division fineness, where readings are equally likely to be above or below the average; these are evaluated using statistical analysis.
*   **Uncertainty Estimation Rules:**
    *   **Scale Devices:** The default uncertainty equals half of the smallest scale division (e.g., $0.05\\text{ cm}$ for a scale marked in millimetres).
    *   **Digital Devices:** The uncertainty equals the smallest displayed increment.
*   **Preferred Measurement Form:** Expressed as $\\text{Measurement} = x_{\\text{best}} \\pm \\Delta x$, where $x_{\\text{best}}$ is the best estimate and $\\Delta x$ is the absolute uncertainty.

**Significant Digits and Calculation Rules:**
*   **Definition:** The number of meaningful digits reported in a value that is consistent with the estimated experimental error.
*   **Rules for Zeros:**
    *   Zeros with a non-zero digit anywhere to their left are significant (e.g., $5.00$ has 3 significant figures).
    *   Zeros used solely to locate a decimal point are not significant (e.g., $0.0005$ has 1 significant figure).
*   **Multiplication and Division Rule:** The final calculated answer must maintain the same number of significant figures as the factor with the fewest significant digits.
*   **Addition and Subtraction Rule:** The final calculated answer must match the smallest number of decimal places present in any term of the calculation.

## 3. Vectors: Composition and Resolution

**Scalars vs. Vectors and Representations:**
*   **Scalar Quantities:** Quantities specified completely by a numerical magnitude and a unit, lacking direction, and obeying ordinary algebraic rules (e.g., mass, time, volume, speed).
*   **Vector Quantities:** Quantities defined by both a magnitude and a spatial direction, obeying vector algebra (e.g., displacement, velocity, acceleration, momentum).
*   **Representations:**
    *   **Algebraic:** Represented by a letter with an overhead arrow ($\\vec{A}$), with magnitude denoted by $|A|$ or $A$.
    *   **Geometric:** Drawn as a straight arrow whose length represents magnitude and whose arrowhead indicates direction.

**Vector Addition Methods:**
*   **Resultant Vector:** A single vector obtained by combining two or more individual vectors.
*   **Graphical (Head-to-Tail) Method:** Vectors are connected sequentially by placing the tail of each vector at the head of the preceding one; the resultant $\\vec{R}$ is drawn from the tail of the first vector to the head of the last vector.
*   **Parallelogram Law:** The resultant $\\vec{R}$ of two concurrent vectors $\\vec{A}$ and $\\vec{B}$ forms the diagonal of a parallelogram with $\\vec{A}$ and $\\vec{B}$ as adjacent sides.
    *   **Magnitude (Cosine Law):** $R = \\sqrt{A^2 + B^2 - 2AB\\cos\\theta}$
    *   **Direction (Sine Law):** Calculated using the law of sines to find the angles relative to the component vectors.

**Components of a Vector:**
*   **Two-Dimensional Resolution:** A vector $\\vec{A}$ making an angle $\\theta$ with the x-axis resolves into perpendicular rectangular components: $A_x = A\\cos\\theta$ and $A_y = A\\sin\\theta$. Magnitude: $A = \\sqrt{A_x^2 + A_y^2}$.
*   **Three-Dimensional Resolution:** A 3D vector decomposes into three orthogonal components ($\\vec{A} = A_x + A_y + A_z$) with magnitude $A = \\sqrt{A_x^2 + A_y^2 + A_z^2}$, defined relative to the coordinate axes via direction cosines.

## 4. Unit Vectors

**Definition and Cartesian Unit Vectors:**
*   **Unit Vector:** A dimensionless vector having a magnitude of exactly one ($\\hat{r}$), whose primary purpose is to point in a specified direction.
*   **Cartesian Unit Vectors:** A standard set of orthogonal unit vectors pointing along the positive Cartesian coordinate axes:
    *   $\\hat{i}$ points along the positive x-axis.
    *   $\\hat{j}$ points along the positive y-axis.
    *   $\\hat{k}$ points along the positive z-axis.
*   **Unit Vector Notation:** Any three-dimensional vector can be expressed as $\\vec{A} = A_x\\hat{i} + A_y\\hat{j} + A_z\\hat{k}$.

**Vector Operations in Unit Vector Notation and Finding a Unit Vector:**
*   **Vector Addition:** Computed easily by factoring out and summing corresponding components along each axis:
    $$ \\vec{A} + \\vec{B} = (A_x + B_x)\\hat{i} + (A_y + B_y)\\hat{j} + (A_z + B_z)\\hat{k} $$
*   **Finding a Unit Vector:** To find a unit vector $\\hat{r}$ pointing in the direction of vector $\\vec{r}$, divide the vector by its scalar magnitude $r$:
    $$ \\hat{r} = \\frac{\\vec{r}}{r} = \\frac{r_x}{r}\\hat{i} + \\frac{r_y}{r}\\hat{j} + \\frac{r_z}{r}\\hat{k} $$
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 1: Physical Quantities and Measurement',
    content: content,
    department: 'Physics',
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
    console.log('Successfully inserted Physics Chapter 1!');
  }
}

run();
