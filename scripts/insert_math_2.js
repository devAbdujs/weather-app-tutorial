require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 2: Matrices and Determinants

## 1. Matrices and Basic Matrix Operations

**Definition and Types of Matrices**
*   **Matrix Definition:** A matrix is defined as a rectangular array of numbers arranged in rows and columns. The size or order of a matrix with $m$ rows and $n$ columns is written as $m \\times n$.
*   **Matrix Equality:** Two matrices are equal if and only if they share the exact same order and their corresponding entries are equal.
*   **Row and Column Vectors:** A matrix of size $1 \\times n$ is called a row vector (or row matrix), while a matrix of size $m \\times 1$ is called a column vector (or column matrix).

**Basic Matrix Operations**
*   **Matrix Addition:** Addition is defined for matrices of the same order by adding their corresponding entries component-wise.
*   **Scalar Multiplication:** Multiplying a matrix $A$ by a scalar $c$ is performed by multiplying every individual entry in $A$ by $c$.

## 2. Matrix Multiplication and Transpose

**Matrix Product and Properties**
*   **Matrix Product:** Given an $m \\times n$ matrix $A$ and an $n \\times p$ matrix $B$, the product $AB$ yields an $m \\times p$ matrix.
*   **Multiplication Properties:** Matrix multiplication is associative and distributive over addition, but it is generally non-commutative ($AB \\neq BA$).

**Transpose and Special Square Matrices**
*   **Transpose of a Matrix:** The transpose of a matrix $A$, denoted $A^T$, is obtained by interchanging its rows and columns.
*   **Special Square Matrices:**
    *   A diagonal matrix is a square matrix where all entries outside the main diagonal are zero.
    *   A scalar matrix is a diagonal matrix whose diagonal elements are all equal.
    *   An identity matrix ($I_n$) is a scalar matrix whose diagonal elements are all equal to $1$.

## 3. Elementary Row Operations, Echelon Form, and Rank

**Elementary Row Operations and Row Equivalence**
*   **Elementary Row Operations:** Three row operations are permitted on matrices: interchanging two rows, multiplying a row by a non-zero constant, and adding a scalar multiple of one row to another row.
*   **Row Equivalence:** Two matrices $A$ and $B$ are row equivalent ($A \\sim B$) if one can be transformed into the other via a sequence of elementary row operations.

**Row Echelon Form and Rank**
*   **Row Echelon Form (REF):** A matrix is in row echelon form if any rows consisting entirely of zeros are at the bottom, the first non-zero entry in each non-zero row is $1$ (leading 1), and each leading 1 occurs strictly to the right of the leading 1 in the row above it.
*   **Rank of a Matrix:** The rank of a matrix $A$, denoted $\\text{rank}(A)$, is defined as the total number of non-zero rows in its row echelon form.

## 4. Determinants and Matrix Inverses

**Determinants and Their Properties**
*   **Determinant Definition:** A scalar value denoted $\\det(A)$ or $|A|$ associated with any square matrix $A$.
*   **Key Properties:** Interchanging two rows or columns changes the sign of the determinant, and if one row (or column) is a scalar multiple of another, the determinant is zero.

**Inverse of a Matrix and the Adjoint Method**
*   **Invertible vs. Singular Matrices:** A square matrix $A$ is invertible (non-singular) if there exists a matrix $A^{-1}$ such that $A A^{-1} = A^{-1} A = I_n$; otherwise, it is singular. Matrix inversion is only defined for square matrices.
*   **Minors, Cofactors, and Adjoint:** The minor $M_{ij}$ of an entry $a_{ij}$ is the determinant of the submatrix left after removing row $i$ and column $j$. The cofactor is $C_{ij} = (-1)^{i+j} M_{ij}$, and the transpose of the cofactor matrix forms the adjoint matrix, $\\text{adj}(A)$.

## 5. Systems of Linear Equations

**Matrix Representation and Consistency**
*   **Matrix Formulation:** A system of $m$ linear equations in $n$ unknowns is represented as $AX = B$, where $A$ is the coefficient matrix, $X$ is the variable vector, and $B$ is the constant vector. Adjoining $B$ to $A$ forms the augmented matrix $(A|B)$.
*   **Homogeneous vs. Non-Homogeneous:** Systems where $B = 0$ are homogeneous and always possess at least the trivial solution $X = 0$, while systems with $B \\neq 0$ are non-homogeneous.
*   **Consistency via Rank:**
    *   A system is consistent if and only if $\\text{rank}(A) = \\text{rank}(A|B)$.
    *   It has a unique solution if $\\text{rank}(A) = \\text{rank}(A|B) = n$ (number of unknowns).
    *   It has infinitely many solutions if $\\text{rank}(A) = \\text{rank}(A|B) < n$.
    *   It has no solution (inconsistent) if $\\text{rank}(A) < \\text{rank}(A|B)$.

**Solution Methods: Matrix Inversion and Cramer's Rule**
*   **Matrix Inversion:** For a non-singular system ($D = \\det(A) \\neq 0$), the solution is given directly by $X = A^{-1}B$.
*   **Cramer's Rule:** For an $n \\times n$ system with non-zero determinant $D = \\det(A)$, each variable is determined by $x_i = \\frac{D_i}{D}$, where $D_i$ is the determinant of the matrix formed by replacing the $i$-th column of $A$ with column vector $B$.

## 6. Eigenvalues and Eigenvectors

**Characteristic Equation and Solution Criteria**
*   **Eigenvalue Problem Definition:** Matrix eigenvalue problems seek scalar values $\\lambda$ and non-zero vectors $X$ satisfying $AX = \\lambda X$, where $X$ is an eigenvector and $\\lambda$ is an eigenvalue.
*   **Characteristic Equation:** Non-zero solutions exist if and only if $\\lambda$ satisfies the characteristic equation $\\det(A - \\lambda I) = 0$.
*   **Determining Eigenvectors:** After solving the characteristic polynomial for eigenvalues $\\lambda$, substituting each $\\lambda$ back into $(A - \\lambda I)X = 0$ yields the corresponding eigenvectors.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 2: Matrices and Determinants',
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
    console.log('Successfully inserted Math Chapter 2!');
  }
}

run();
