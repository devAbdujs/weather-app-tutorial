require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 3: Properties of Bulk Matter

## 1. Stress, Strain, and Elastic Behavior

*   **Fluid Mechanics Definition:** Fluid mechanics is the branch of physics concerned with the mechanics of fluids at rest (fluid statics) or in motion (fluid dynamics) and the forces acting on them.
*   **Elastic vs. Inelastic Behavior:** Elastic materials regain their original shape and size once deforming external forces are removed, whereas plastic materials undergo permanent deformation.
*   **Stress:** Defined as the deforming force applied per unit cross-sectional area ($\\text{Stress} = \\frac{F}{A}$), with SI units of Pascals ($\\text{Pa} = \\text{N/m}^2$).
*   **Strain:** Measures the fractional degree of deformation ($\\text{Strain} = \\frac{\\text{Change in configuration}}{\\text{Initial configuration}}$) and is a dimensionless quantity.
*   **Types of Stress and Strain:**
    *   **Tensile Stress & Strain:** Tensile stress ($\\frac{F_\\perp}{A}$) acts perpendicular to a surface, producing tensile strain ($\\frac{\\Delta l}{l_0}$) representing fractional length change.
    *   **Shear Stress & Strain:** Shear stress ($\\frac{F_\\parallel}{A}$) acts parallel to a face, producing shear strain ($\\frac{x}{h} = \\tan\\phi$) without an initial volume change.
    *   **Volume Stress & Strain:** Volume stress ($\\Delta P = \\frac{\\Delta F}{A}$) applies uniform pressure across all faces, causing volume strain ($\\frac{\\Delta V}{V_0}$) representing fractional volume change.

## 2. Elastic Moduli

*   **Hooke's Law Analogy:** For sufficiently small stresses, stress is directly proportional to strain, where the constant of proportionality is the elastic modulus ($\\text{Stress} = \\text{Elastic Modulus} \\times \\text{Strain}$).
*   **Young's Modulus ($Y$):** The ratio of tensile stress to tensile strain ($Y = \\frac{F_\\perp / A}{\\Delta l / l_0}$), measuring a solid rod or wire's resistance to elongation or compression.
*   **Shear Modulus ($S$):** The ratio of shear stress to shear strain ($S = \\frac{F_\\parallel / A}{x / h}$), measuring resistance to adjacent internal planes sliding past one another.
*   **Bulk Modulus ($B$):** The ratio of volume stress to volume strain ($B = -\\frac{\\Delta P}{\\Delta V / V_0}$), measuring a solid or liquid's resistance to volume changes.
*   **Compressibility:** Defined as the reciprocal of the bulk modulus ($\\frac{1}{B}$).
*   **Fluid Elastic Moduli Property:** Liquids possess a bulk modulus but cannot sustain shear or tensile stresses, simply flowing when such forces are applied.

## 3. Density and Pressure in Static Fluids

**Density and Specific Gravity**
*   **Density ($\\rho$):** Mass per unit volume ($\\rho = \\frac{m}{V}$), expressed in SI units of $\\text{kg/m}^3$.
*   **Specific Gravity (SG):** A dimensionless ratio of a substance's density to the density of pure water at $4^\\circ\\text{C}$ ($1000\\text{ kg/m}^3$).

**Pressure in Static Fluids**
*   **Pressure Definition:** The perpendicular force exerted per unit surface area ($P = \\frac{F_\\perp}{A}$), measured in Pascals ($\\text{Pa}$) or atmospheres ($1\\text{ atm} = 101.3\\text{ kPa}$).
*   **Hydrostatic Pressure at Depth:** In a static fluid of uniform density, pressure increases linearly with depth $h$ according to $P_{\\text{fluid}} = \\rho g h$.
*   **Properties of Fluid Pressure:** Fluid pressure is equal at all points along the same horizontal level, acts perpendicular to container surfaces, and is independent of container shape.

**Atmospheric, Gauge, and Absolute Pressure**
*   **Atmospheric Pressure:** Pressure exerted by the weight of Earth's atmosphere, decreasing with increasing altitude as air density decreases.
*   **Gauge Pressure ($P_{\\text{gauge}}$):** The difference between the system pressure and surrounding atmospheric pressure ($P_{\\text{gauge}} = P_{\\text{system}} - P_{\\text{atmosphere}}$).
*   **Absolute Pressure ($P_{\\text{abs}}$):** The total pressure in a fluid, equal to the sum of gauge pressure and atmospheric pressure ($P_{\\text{abs}} = P_{\\text{gauge}} + P_{\\text{atm}}$).

## 4. Buoyant Force and Archimedes' Principles

**Pascal's Principle and Hydraulic Systems**
*   **Pascal's Principle:** Pressure applied to a confined, enclosed fluid is transmitted undiminished to every point in the fluid and to the container walls.
*   **Hydraulic Systems:** A small force applied to a small piston area ($A_1$) creates a pressure transmitted to a larger piston area ($A_2$), producing a magnified output force ($\\frac{F_1}{A_1} = \\frac{F_2}{A_2} \\implies F_2 = F_1 \\frac{A_2}{A_1}$).

**Archimedes' Principle and Buoyancy**
*   **Archimedes' Principle:** Any body completely or partially submerged in a fluid is buoyed up by a force equal to the weight of the fluid displaced by the body ($F_B = W_{\\text{displaced fluid}} = \\rho_{\\text{fluid}} V_{\\text{submerged}} g$).
*   **Origin of Buoyant Force:** Fluid pressure increases with depth, causing the upward force on the bottom of a submerged object to exceed the downward force on its top.

## 5. Moving Fluids and Bernoulli Equations (Fluid Dynamics)

**Characteristics of Ideal Fluid Flow**
*   **Ideal Fluid Model:** Analyzes complex motion using four simplifying assumptions: non-viscous (no internal friction), steady/laminar flow (constant velocity at each point), incompressible (constant density), and irrotational (no angular momentum).
*   **Laminar vs. Turbulent Flow:** Laminar flow features smooth, regular layers sliding past one another; turbulent flow occurs above critical speeds, causing irregular eddies and energy loss due to viscosity.

**Equation of Continuity**
*   **Mass Conservation:** Expresses conservation of mass for an incompressible fluid flowing through a tube of varying cross-section.
*   **Continuity Equation:** The product of cross-sectional area and fluid speed remains constant along a pipe ($A_1 v_1 = A_2 v_2 = \\text{constant}$).
*   **Flow Rate (Volume Flux):** The term $Av$ represents the volume flow rate ($\\text{m}^3/\\text{s}$), indicating fluid speed increases where cross-sectional area decreases.

**Bernoulli's Principle and Equation**
*   **Bernoulli's Principle:** Swiftly moving fluids exert lower static pressure than slowly moving fluids.
*   **Energy Conservation Foundation:** Derived as a statement of energy conservation applied to moving fluids.
*   **Bernoulli's Equation:** The sum of pressure, kinetic energy per unit volume, and potential energy per unit volume is constant along any streamline ($P_1 + \\frac{1}{2}\\rho v_1^2 + \\rho g y_1 = P_2 + \\frac{1}{2}\\rho v_2^2 + \\rho g y_2$).
*   **Applications:** Explains aerodynamic lift on aircraft wings, sailboat propulsion into wind, curveball trajectories, and chimney draughts.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 3: Properties of Bulk Matter',
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
    console.log('Successfully inserted Physics Chapter 3!');
  }
}

run();
