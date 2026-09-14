require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 1: Scalars and Vectors in $\\mathbb{R}^2$ and $\\mathbb{R}^3$

## 1. Fundamental Definitions and Representations

**Scalars vs. Vectors:**
*   **Scalar:** A physical quantity described strictly by its magnitude (e.g., temperature, length, speed).
*   **Vector:** A physical quantity defined by both magnitude and direction (e.g., velocity, displacement, force).

**Coordinate Representations:**
*   A vector in two-dimensional space $\\mathbb{R}^2$ is represented as an ordered pair $\\vec{u} = (u_1, u_2)$, while a vector in three-dimensional space $\\mathbb{R}^3$ is represented as an ordered triple $\\vec{v} = (v_1, v_2, v_3)$.

**Equality of Vectors:**
*   Two vectors $\\vec{u}$ and $\\vec{v}$ are equal (or equivalent) if and only if they possess identical magnitudes and directions, which corresponds to component-wise equality ($u_1 = v_1$ and $u_2 = v_2$).

**Located vs. Position Vectors:**
*   A located vector $\\vec{AB}$ originates at an initial point $A$ and ends at a terminal point $B$, whereas a position vector has its initial point fixed at the origin.

**Parallel (Collinear) Vectors:**
*   Two non-zero vectors $\\vec{u}$ and $\\vec{v}$ are parallel ($\\vec{u} \\parallel \\vec{v}$) if one is a scalar multiple of the other ($\\vec{u} = c\\vec{v}$).
*   Positive scalar multiples share the same direction, while negative scalar multiples have opposite directions.
*   The zero vector $\\vec{0}$ is parallel to every vector.

## 2. Vector Addition and Scalar Multiplication

**Operations and Geometric Laws**
*   **Algebraic Definitions:** For vectors $\\vec{u} = (u_1, u_2)$ and $\\vec{v} = (v_1, v_2)$ in $\\mathbb{R}^2$, vector addition is defined component-wise as $\\vec{u} + \\vec{v} = (u_1 + v_1, u_2 + v_2)$. Scalar multiplication by $c \\in \\mathbb{R}$ is defined as $c\\vec{u} = (c u_1, c u_2)$.
*   **Geometric Addition:** Graphically represented using either the Triangular Law ($\\vec{AC} = \\vec{AB} + \\vec{BC}$) or the Parallelogram Law.
*   **Vector Subtraction:** The negative vector $-\\vec{v}$ has equal length but opposite direction; vector subtraction is defined as $\\vec{w} - \\vec{v} = \\vec{w} + (-\\vec{v})$.
*   **Algebraic Properties:** Vector addition and scalar multiplication satisfy eight core properties: closure under addition, commutativity ($\\vec{u} + \\vec{v} = \\vec{v} + \\vec{u}$), associativity, existence of the zero vector identity $\\vec{0}$, existence of additive inverses, scalar associativity, scalar distribution over vector addition, and scalar distribution over scalar addition.

## 3. Dot Product, Norm, and Geometric Projections

**Magnitude, Distance, and Unit Vectors**
*   **Norm (Magnitude):** The magnitude of $\\vec{v} = (v_1, v_2, v_3)$ in $\\mathbb{R}^3$ is $\\|\\vec{v}\\| = \\sqrt{v_1^2 + v_2^2 + v_3^2}$, and similarly $\\|\\vec{v}\\| = \\sqrt{v_1^2 + v_2^2}$ in $\\mathbb{R}^2$. Scalar scaling satisfies $\\|c\\vec{v}\\| = |c|\\|\\vec{v}\\|$.
*   **Unit Vectors:** Any vector satisfying $\\|\\hat{u}\\| = 1$ is a unit vector. The unit vector $\\hat{u}$ in the direction of a non-zero vector $\\vec{v}$ is obtained by $\\hat{u} = \\frac{\\vec{v}}{\\|\\vec{v}\\|}$. All unit vectors in $\\mathbb{R}^2$ can be expressed as $(\\cos\\theta, \\sin\\theta)$.
*   **Distance Formula:** The distance between two points $P(u_1, u_2)$ and $Q(v_1, v_2)$ in $\\mathbb{R}^2$ is given by $d(P, Q) = \\|\\vec{PQ}\\| = \\sqrt{(v_1 - u_1)^2 + (v_2 - u_2)^2}$.

**Dot Product and Angle Between Vectors**
*   **Dot (Scalar) Product:**
    *   Component-wise definition: $\\vec{u} \\cdot \\vec{v} = u_1 v_1 + u_2 v_2 + u_3 v_3$.
    *   Geometric definition: $\\vec{u} \\cdot \\vec{v} = \\|\\vec{u}\\|\\|\\vec{v}\\|\\cos\\theta$, where $\\theta \\in [0, \\pi]$ is the angle between the vectors.
*   **Angle and Orthogonality:** The angle between two non-zero vectors is $\\theta = \\cos^{-1}\\left(\\frac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\|\\|\\vec{v}\\|}\\right)$. Two non-zero vectors are orthogonal (perpendicular) if and only if $\\vec{u} \\cdot \\vec{v} = 0$.
*   **Dot Product Properties:** Satisfies $\\vec{u} \\cdot \\vec{u} = \\|\\vec{u}\\|^2$, $\\vec{u} \\cdot \\vec{v} = \\vec{v} \\cdot \\vec{u}$, $(c\\vec{u}) \\cdot \\vec{v} = c(\\vec{u} \\cdot \\vec{v})$, and $\\vec{u} \\cdot (\\vec{v} + \\vec{w}) = \\vec{u} \\cdot \\vec{v} + \\vec{u} \\cdot \\vec{w}$.

**Projections and Direction Cosines**
*   **Orthogonal Projections:** The vector projection of $\\vec{B}$ onto $\\vec{A}$ is $\\text{proj}_{\\vec{A}}\\vec{B} = \\left(\\frac{\\vec{A} \\cdot \\vec{B}}{\\|\\vec{A}\\|^2}\\right)\\vec{A}$. The scalar projection (component) of $\\vec{B}$ along $\\vec{A}$ is $\\text{comp}_{\\vec{A}}\\vec{B} = \\|\\text{proj}_{\\vec{A}}\\vec{B}\\| = \\frac{\\vec{A} \\cdot \\vec{B}}{\\|\\vec{A}\\|}$.
*   **Direction Angles and Cosines:** For a vector $\\vec{A} = a_1\\hat{i} + a_2\\hat{j} + a_3\\hat{k}$ in $\\mathbb{R}^3$, the directional angles $\\alpha, \\beta, \\gamma$ made with the positive $x, y, z$ axes satisfy the identity $\\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1$.

## 4. Cross Product and Triple Products

**Definition and Properties of the Cross Product**
*   **Cross (Vector) Product:** For vectors $\\vec{A}$ and $\\vec{B}$ in $\\mathbb{R}^3$, the cross product $\\vec{A} \\times \\vec{B}$ is a vector computed using the $3 \\times 3$ determinant formed with standard unit vectors $\\hat{i}, \\hat{j}, \\hat{k}$ in the first row.
*   **Orthogonality and Anti-commutativity:** $\\vec{A} \\times \\vec{B}$ is orthogonal to both $\\vec{A}$ and $\\vec{B}$. It is anti-commutative: $\\vec{A} \\times \\vec{B} = -(\\vec{B} \\times \\vec{A})$.
*   **Magnitude Identity:** $\\|\\vec{A} \\times \\vec{B}\\| = \\|\\vec{A}\\|\\|\\vec{B}\\|\\sin\\theta$, where $\\theta \\in [0, \\pi]$. If $\\vec{A}$ and $\\vec{B}$ are parallel, then $\\vec{A} \\times \\vec{B} = \\vec{0}$.

**Geometric Applications and Triple Products**
*   **Triangle & Parallelogram Area:** The area of a triangle formed by vectors $\\vec{AB}$ and $\\vec{AC}$ is $\\frac{1}{2}\\|\\vec{AB} \\times \\vec{AC}\\|$.
*   **Volume of a Parallelepiped:** Evaluated using the scalar triple product $V = |\\vec{A} \\cdot (\\vec{B} \\times \\vec{C})|$, which equals the absolute value of the determinant of the matrix formed by vectors $\\vec{A}, \\vec{B}, \\vec{C}$.
*   **Coplanarity Condition:** Three vectors $\\vec{A}, \\vec{B}, \\vec{C}$ are coplanar if and only if their scalar triple product is zero ($\\vec{A} \\cdot (\\vec{B} \\times \\vec{C}) = 0$).

## 5. Lines and Planes in $\\mathbb{R}^3$

**Formulations of Lines and Planes**
*   **Equations of a Line:** A line passing through point $P_0(x_0, y_0, z_0)$ parallel to direction vector $\\vec{v} = (a, b, c)$ can be expressed in three forms:
    *   *Parametric Form:* $x = x_0 + at$, $y = y_0 + bt$, $z = z_0 + ct$ ($t \\in \\mathbb{R}$)
    *   *Symmetric Form:* $\\frac{x - x_0}{a} = \\frac{y - y_0}{b} = \\frac{z - z_0}{c}$ (for $a, b, c \\neq 0$)
    *   *Vector Form:* $\\vec{r} - \\vec{r}_0 = t\\vec{v}$
*   **Equation of a Plane:** A plane containing point $(x_0, y_0, z_0)$ with normal vector $\\vec{n} = (a, b, c)$ is defined by the standard equation $ax + by + cz + d = 0$, where $d = -(ax_0 + by_0 + cz_0)$.

**Distance Calculations in Space**
*   **Distance from Point to Line:** The distance $D$ from a point $P_1$ to a line $\\ell$ (containing point $P_0$ with direction vector $\\vec{v}$) is given by $D = \\frac{\\|\\vec{v} \\times \\vec{P_0 P_1}\\|}{\\|\\vec{v}\\|}$.
*   **Distance from Point to Plane:** The distance $D$ from point $(x_0, y_0, z_0)$ to plane $ax + by + cz + d = 0$ is $D = \\frac{|ax_0 + by_0 + cz_0 + d|}{\\sqrt{a^2 + b^2 + c^2}}$.

## 6. Abstract Vector Spaces and Subspaces

**Definitions of Fields and Vector Spaces**
*   **Field:** A subset $F \\subseteq \\mathbb{C}$ closed under addition and multiplication containing $0$ and $1$, where every element has an additive inverse and every non-zero element has a multiplicative inverse (e.g., $\\mathbb{R}, \\mathbb{C}, \\mathbb{Q}$).
*   **Vector Space:** A non-empty set $V$ over field $F$ satisfying 10 axioms, including closure under addition and scalar multiplication, associativity, commutativity, zero vector identity, negative vector inverse, and scalar distributive laws. Standard examples include $\\mathbb{R}^n$, polynomial spaces $P_n$, and matrix spaces.
*   **Subspace Criteria:** A non-empty subset $W \\subseteq V$ is a subspace of $V$ if and only if it is closed under vector addition, closed under scalar multiplication, and contains the zero vector.

**Linear Dependence, Basis, and Dimension**
*   **Linear Combinations and Dependence:**
    *   *Linear Combination:* An expression of the form $\\alpha_1 v_1 + \\alpha_2 v_2 + \\dots + \\alpha_n v_n$ for vectors $v_i \\in V$ and scalars $\\alpha_i \\in F$.
    *   *Linear Independence vs. Dependence:* Vectors are linearly independent if $\\sum \\alpha_i v_i = 0$ implies all scalars $\\alpha_1 = \\dots = \\alpha_n = 0$. They are linearly dependent if there exist scalars not all zero such that the linear combination equals zero.
    *   *Geometric View in $\\mathbb{R}^3$:* Two vectors are dependent iff they lie on the same line through the origin; three vectors are dependent iff they lie on the same plane through the origin.
*   **Basis and Dimension:**
    *   *Spanning Set:* A set $S = \\{v_1, \\dots, v_n\\}$ spans vector space $V$ if every element of $V$ can be expressed as a linear combination of vectors in $S$.
    *   *Basis:* A subset $S \\subseteq V$ is a basis for $V$ if $S$ is linearly independent and spans $V$.
    *   *Dimension:* The dimension of $V$ ($\\dim V$) equals the exact number of elements contained in any basis of $V$.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 1: Scalars and Vectors',
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
    console.log('Successfully inserted Math Chapter 1!');
  }
}

run();
