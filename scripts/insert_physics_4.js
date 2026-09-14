require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 4: Thermodynamics

## 1. Temperature and the Zeroth Law of Thermodynamics

**Concept of Temperature and Thermal Equilibrium**
*   **Thermodynamics Scope:** Thermodynamics is the branch of physics studying the relationships between heat, work, temperature, and energy, focusing on energy transfers between a system and its surroundings.
*   **Thermodynamic System & Surroundings:** A system is a fixed quantity of matter under study (such as gas inside a cylinder with a piston), while the surrounding is the environment in thermal contact with it.
*   **Thermal Contact & Heat Flow:** Heat is defined as the flow of energy from one object to another caused strictly by a temperature difference when objects are in thermal contact.
*   **Thermal Equilibrium:** Two objects in contact are in thermal equilibrium when no net energy is transferred between them, meaning they possess the exact same temperature.

**The Zeroth Law of Thermodynamics**
*   **Statement of the Zeroth Law:** If object A is in thermal equilibrium with object B, and object B is in thermal equilibrium with object C, then object A is in thermal equilibrium with object C.
*   **Basis for Thermometry:** The Zeroth Law provides the physical foundation for temperature measurement by ensuring a calibrated thermometer in equilibrium with a system accurately reflects the system's temperature.
*   **Historical Naming:** Proposed by British physicist Ralph Fowler in the 1930s, it was named the "Zeroth Law" because the 1st, 2nd, and 3rd laws were already established, yet this principle logically precedes them.

**Temperature Scales and Conversions**
*   **Thermometric Properties:** Thermometers rely on physical properties that change reproducibly with temperature, such as liquid volume, electrical resistance, colour, or infrared radiation.
*   **Standard Temperature Scales:**
    *   *Celsius Scale:* Fixed by the freezing point ($0^\\circ\\text{C}$) and boiling point ($100^\\circ\\text{C}$) of water at standard atmospheric pressure.
    *   *Fahrenheit Scale:* Sets the freezing point of water at $32^\\circ\\text{F}$ and the boiling point at $212^\\circ\\text{F}$.
    *   *Kelvin Scale:* The SI base unit of absolute temperature ($1\\text{ K}$ is defined as $1/273.16$ of the triple point temperature of water).
*   **Conversion Equations:**
    *   Fahrenheit to Celsius: $T_C = \\frac{5}{9}(T_F - 32)$
    *   Celsius to Fahrenheit: $T_F = \\frac{9}{5}T_C + 32$
    *   Celsius to Kelvin: $T_K = T_C + 273.15$

## 2. Thermal Expansion

**Linear Thermal Expansion**
*   **Linear Expansion Phenomenon:** The fractional change in length ($\\Delta l$) of a solid is directly proportional to its initial length ($l_0$) and the temperature change ($\\Delta T$).
*   **Linear Expansion Formula:** $\\Delta l = \\alpha l_0 \\Delta T \\implies l = l_0(1 + \\alpha \\Delta T)$, where $\\alpha$ is the average coefficient of linear expansion (expressed in $\\text{K}^{-1}$ or $(^\\circ\\text{C})^{-1}$).
*   **Bimetallic Strip Application:** Constructed by bonding two metals with different expansion coefficients ($\\alpha$); changes in temperature cause the strip to bend toward the metal with lower expansion.

**Areal and Volume Thermal Expansion**
*   **Areal Thermal Expansion:** The fractional change in surface area ($\\Delta A$) is given by $\\Delta A = \\beta A_0 \\Delta T$, where $\\beta = 2\\alpha$ is the coefficient of areal expansion.
*   **Volume Thermal Expansion:** The fractional change in volume ($\\Delta V$) of solids or liquids is given by $\\Delta V = \\gamma V_0 \\Delta T$, where $\\gamma = 3\\alpha$ is the coefficient of volume expansion.

## 3. Heat, Work, and Internal Energy

**Heat and Work as Energy Transfer Mechanisms**
*   **Nature of Heat ($Q$):** A transient, microscopic mode of energy transfer across a boundary driven by a temperature gradient, involving energy exchanges via random particle collisions without macroscopic displacement.
*   **Nature of Work ($W$):** A non-spontaneous, macroscopic mode of energy transfer into or out of a system caused by an external force acting through a displacement (e.g. moving a piston).
*   **Boundary Property:** A system cannot "contain" or "possess" heat or work; both exist solely as energy in transit across system boundaries.

**Internal Energy**
*   **Definition of Internal Energy ($U$):** The total energy stored within a system associated with the microscopic components—atoms and molecules.
*   **Microscopic Energy Components:** Includes translational, rotational, and vibrational kinetic energies of particles, along with intermolecular and intramolecular potential energies.
*   **Exclusion of Macroscopic Motion:** Internal energy explicitly excludes any bulk kinetic or potential energy of the overall system moving through space.

## 4. Specific Heat and Latent Heat

**Specific Heat Capacity**
*   **Heat Capacity ($C$):** The quantity of heat energy required to raise the temperature of a sample by $1^\\circ\\text{C}$.
*   **Specific Heat Capacity ($c$):** The heat energy required per unit mass to alter the temperature of a substance by $1^\\circ\\text{C}$ ($Q = m c \\Delta T$), with SI units of $\\text{J}/(\\text{kg}\\cdot^\\circ\\text{C})$ or $\\text{J}/(\\text{kg}\\cdot\\text{K})$.
*   **Molar Heat Capacity:** The heat required to change the temperature of $n$ moles of a gas or substance by a unit degree ($Q = n C \\Delta T$).

**Latent Heat and Phase Changes**
*   **Phase Change Concept:** Thermal energy absorbed or released during a physical phase transition occurs at a constant temperature.
*   **Latent Heat Formula:** $Q_L = \\pm m L$, where $L$ is the specific latent heat ($\\text{J/kg}$).
*   **Types of Latent Heat:**
    *   *Latent Heat of Fusion ($L_f$):* Energy required to change a substance between solid and liquid phases at constant temperature (for water, $L_f = 333.7\\text{ kJ/kg}$).
    *   *Latent Heat of Vaporization ($L_v$):* Energy required to change a substance between liquid and gas phases at constant temperature (for water, $L_v = 2256\\text{ kJ/kg}$).

## 5. Heat Transfer Mechanisms

**Conduction, Convection, Radiation, and Direct Burning**
*   **Conduction:** Heat transfer through solid materials particle-by-particle via molecular vibrations and free electron collisions (metals are excellent conductors due to free conduction electrons).
*   **Convection:** Heat transfer within fluids (liquids and gases) via the mass movement of heated fluid particles, creating buoyancy-driven convection currents.
*   **Radiation:** Heat transfer via electromagnetic waves traveling at the speed of light; requires no material medium and can propagate through a vacuum.
    *   Radiant energy hitting a body can be absorbed, transmitted, or reflected.
    *   Dull, black surfaces absorb and radiate heat most efficiently, whereas shiny, light surfaces reflect radiation.
    *   Radiant energy intensity obeys an inverse-square relationship with distance.
*   **Direct Burning:** Fire propagation via direct physical flame contact with available fuel lines.

## 6. The First Law of Thermodynamics and Special Processes

**Statement of the First Law**
*   **Conservation of Energy Principle:** The First Law of Thermodynamics is a specialised statement of energy conservation for thermodynamic systems.
*   **Mathematical Expression:** $\\Delta U = Q + W$, stating that the net change in internal energy ($\\Delta U$) equals the heat transferred into the system ($Q$) plus the net work done on the system ($W$).
*   **Path Independence:** While $Q$ and $W$ individually depend on the specific thermodynamic path taken, the net change in internal energy ($\\Delta U$) is strictly a state function and independent of the path.

**Special Thermodynamic Processes**
*   **Isolated System:** Exchanging zero heat ($Q=0$) and zero work ($W=0$) with its environment, keeping internal energy constant ($\\Delta U = 0$).
*   **Cyclic Process:** A process returning periodically to its initial thermodynamic state ($\\Delta U = 0 \\implies Q = -W$).
*   **Isochoric (Isovolumetric) Process:** Occurs at constant volume ($\\Delta V = 0 \\implies W = 0 \\implies \\Delta U = Q$), meaning all added heat directly increases internal energy.
*   **Adiabatic Process:** No heat exchange occurs between system and surroundings ($Q = 0 \\implies \\Delta U = W$), meaning internal energy changes solely through work.
*   **Isothermal Process:** Occurs at constant temperature ($\\Delta T = 0 \\implies \\Delta U = 0 \\implies Q = -W$). Work done by an ideal gas during isothermal expansion: $W = nRT \\ln\\left(\\frac{V_f}{V_i}\\right)$.
*   **Isobaric Process:** Occurs at constant pressure, where work done is $W = -P \\Delta V$ (area under $P\\text{-}V$ graph), yielding $\\Delta U = Q - P \\Delta V$.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 4: Thermodynamics',
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
    console.log('Successfully inserted Physics Chapter 4!');
  }
}

run();
