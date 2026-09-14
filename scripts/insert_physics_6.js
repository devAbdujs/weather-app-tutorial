require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 6: Electromagnetism and Electronics

## 1. Coulomb's Law, Electric Fields, and Electric Potential

**Coulomb's Law and Electric Fields**
*   **Electric Charge:** Electric charge is an inherent physical property of matter measured in Coulombs ($\\text{C}$). The elementary charge carried by a single electron or proton has a magnitude of $1e = 1.6 \\times 10^{-19}\\text{ C}$. Like charges repel each other, whereas unlike charges attract.
*   **Coulomb's Law:** The electrostatic force magnitude between two stationary point charges is directly proportional to the product of their charges and inversely proportional to the square of their separation distance: $F = k \\frac{|q_1 q_2|}{r^2}$. The electrostatic constant is $k = \\frac{1}{4\\pi\\varepsilon_0} \\approx 9.0 \\times 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$, where $\\varepsilon_0 = 8.85 \\times 10^{-12}\\text{ C}^2/(\\text{N}\\cdot\\text{m}^2)$ is the permittivity of free space.
*   **Superposition Principle:** The total electric force or field exerted on a test charge by a system of point charges equals the vector sum of individual forces or fields.
*   **Electric Field:** Defined as the electric force per unit positive test charge ($\\vec{E} = \\frac{\\vec{F}}{q_0} = k \\frac{q}{r^2}\\hat{r}$). Electric field lines point radially outward from positive source charges and inward toward negative source charges, with field line density representing field strength.

**Electric Potential Energy and Voltage**
*   **Electric Potential Energy ($U$):** Because electrostatic forces are conservative, the work done in moving a charge against an electric field equals the change in stored potential energy ($W = -\\Delta U$). For two point charges separated by distance $r$, $U = k \\frac{q_1 q_2}{r}$.
*   **Electric Potential ($V$):** Defined as potential energy per unit charge ($V = \\frac{U}{q}$).
*   **Potential Difference (Voltage):** The potential difference between two points ($V_{AB} = V_A - V_B = \\frac{\\Delta U}{q}$) is measured in Volts ($\\text{V}$), where $1\\text{ V} = 1\\text{ J/C}$. The total electrical energy transferred is given by $U = qV$.

## 2. Electric Circuits and Kirchhoff's Rules

**Current, Resistance, and Ohm's Law**
*   **Electric Current ($I$):** The rate of flow of electric charge through a conductor cross-section ($I = \\frac{\\Delta Q}{\\Delta t}$), measured in Amperes ($\\text{A} = 1\\text{ C/s}$).
*   **Current Density and Resistivity:** Current density ($\\vec{J} = \\sigma \\vec{E}$) depends on electrical conductivity ($\\sigma$). Electrical resistivity ($\\rho = \\frac{1}{\\sigma} = \\frac{E}{J}$) measures a material's opposition to current flow, expressed in Ohm-meters ($\\Omega\\cdot\\text{m}$).
*   **Ohm's Law:** States that the voltage across a conductor is directly proportional to the current flowing through it ($V = IR$), where resistance $R$ is measured in Ohms ($\\Omega$).

**Electrical Power**
*   **Power Dissipation:** Electrical power is the rate at which electrical energy is converted into other energy forms. It is calculated as $P = IV = I^2 R = \\frac{V^2}{R}$, measured in Watts ($\\text{W}$).

**Equivalent Resistance and Kirchhoff's Rules**
*   **Series Resistors:** For $N$ resistors connected in series, the equivalent resistance is $R_{\\text{eq}} = \\sum R_i$, and the current remains identical through all resistors.
*   **Parallel Resistors:** For $N$ resistors connected in parallel, the reciprocal equivalent resistance is $\\frac{1}{R_{\\text{eq}}} = \\sum \\frac{1}{R_i}$, and the voltage drop remains identical across all branches.
*   **Kirchhoff's First Rule (Junction Rule):** The sum of currents entering any node equals the sum of currents leaving that node ($\\sum I_{\\text{in}} = \\sum I_{\\text{out}}$), expressing Conservation of Charge.
*   **Kirchhoff's Second Rule (Loop Rule):** The algebraic sum of potential changes around any closed loop equals zero ($\\sum V = 0$), expressing Conservation of Energy.

## 3. Magnetism and Electromagnetic Induction

**Magnetic Field, Force, and Magnetic Flux**
*   **Magnetic Force on Moving Charges:** A magnetic field ($\\vec{B}$) exerts a force on a charge $q$ moving with velocity $\\vec{v}$ given by $\\vec{F} = q(\\vec{v} \\times \\vec{B})$, with magnitude $F = qvB\\sin\\theta$. The SI unit of magnetic field strength is the Tesla ($\\text{T}$).
*   **Right-Hand Rule (RHR-1):** The direction of the magnetic force is perpendicular to the plane containing $\\vec{v}$ and $\\vec{B}$, determined by curling right-hand fingers from $\\vec{v}$ to $\\vec{B}$.
*   **Magnetic Field Lines:** Form continuous closed loops passing from North to South pole outside a magnet and continuing through the magnet, never intersecting. Isolated magnetic monopoles do not exist in nature.
*   **Magnetic Flux ($\\Phi$):** Quantifies the total number of field lines passing through an area $A$. For a perpendicular field, $\\Phi = BA$, measured in Webers ($\\text{Wb}$).

**Electromagnetic Induction**
*   **Induction Principle:** Relative motion between a conductor and a magnetic field induces an electromotive force ($\\text{emf}$) across the conductor.
*   **Faraday's Law of Induction:** The magnitude of the induced $\\text{emf}$ is proportional to the time rate of change of magnetic flux through a circuit ($\\text{emf} = -N \\frac{\\Delta \\Phi}{\\Delta t}$).
*   **Lenz's Law:** The direction of an induced $\\text{emf}$ or current always opposes the change in magnetic flux that produced it, represented by the negative sign in Faraday's law.

## 4. Semiconductor Electronics: Materials, Diodes, and Transistors

**Band Theory of Solids and Semiconductor Doping**
*   **Energy Bands:** Solved electronic states form a Valence Band ($\\text{V.B.}$) occupied by valence electrons and a higher Conduction Band ($\\text{C.B.}$) separated by a forbidden energy gap ($E_g$).
*   **Classification of Materials:**
    *   **Conductors:** $\\text{V.B.}$ and $\\text{C.B.}$ overlap ($E_g \\approx 0$), providing high conductivity ($10^4\\text{ to }10^7\\ \\Omega^{-1}\\text{m}^{-1}$).
    *   **Insulators:** Wide energy gap ($E_g > 3\\text{ eV}$), preventing electron excitation and yielding low conductivity ($10^{-20}\\text{ to }10^{-10}\\ \\Omega^{-1}\\text{m}^{-1}$).
    *   **Semiconductors:** Narrow energy gap ($E_g < 3\\text{ eV}$, e.g., Silicon $E_g = 1.1\\text{ eV}$), allowing thermal excitation of carriers ($10^{-6}\\text{ to }10^4\\ \\Omega^{-1}\\text{m}^{-1}$).
*   **Intrinsic Semiconductors:** Pure semiconductor crystals where thermal energy breaks covalent bonds to create equal numbers of free electrons and positive holes.
*   **Extrinsic Doping:** Deliberately introducing impurity atoms ($1:10^6$ ratio) to significantly enhance conductivity.
    *   **N-type:** Doped with pentavalent donors (e.g., Arsenic, Antimony), making electrons the majority charge carriers and shifting the Fermi level near the conduction band.
    *   **P-type:** Doped with trivalent acceptors (e.g., Aluminum, Indium, Boron), creating hole vacancies as majority charge carriers and shifting the Fermi level near the valence band.

**P-N Junction Diodes and Rectification**
*   **P-N Junction Formation:** Combining P-type and N-type semiconductors causes carrier diffusion, forming a charge-free depletion region and an internal potential barrier ($0.3\\text{ V}$ for Ge, $0.7\\text{ V}$ for Si).
*   **Biasing Modes:**
    *   **Forward Bias:** Connecting positive voltage to P-type and negative to N-type narrows the depletion layer, permitting substantial current flow ($\\text{mA}$).
    *   **Reverse Bias:** Connecting negative voltage to P-type and positive to N-type widens the depletion layer, blocking main current and allowing only a tiny leakage current ($\\mu\\text{A}$).
*   **Rectification:** Conversion of alternating current ($\\text{AC}$) into direct current ($\\text{DC}$). A half-wave rectifier uses a single diode to pass one half-cycle, whereas a full-wave bridge rectifier uses four diodes to convert both half-cycles into unidirectional current.

**Transistors and Logic Gates**
*   **Junction Transistors:** Three-terminal, two-junction solid-state devices consisting of Emitter ($\\text{E}$, heavily doped), Base ($\\text{B}$, lightly doped), and Collector ($\\text{C}$) in either $\\text{NPN}$ or $\\text{PNP}$ configurations.
*   **Current Relationship:** Total emitter current equals the sum of collector and base currents ($I_E = I_C + I_B$).
*   **Amplification:** In a Common Emitter ($\\text{CE}$) mode, a small input base current controls a significantly larger collector current, magnifying weak $\\text{AC}$ signals.
*   **Logic Gates:** Fundamental digital building blocks ($\\text{AND}$, $\\text{OR}$, $\\text{NOT}$, $\\text{NAND}$, $\\text{NOR}$) that perform boolean operations on binary inputs ($0$ and $1$) according to characteristic truth tables.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 6: Electromagnetism and Electronics',
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
    console.log('Successfully inserted Physics Chapter 6!');
  }
}

run();
