require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 5: Oscillations, Waves, and Optics

## 1. Simple Harmonic Motion

**Periodic and Oscillatory Motion**
*   **Periodic Motion:** Any motion of a body that repeats its path back and forth about an equilibrium or mean position at regular time intervals.
*   **Oscillatory Motion:** A specific type of periodic motion driven by a restoring force that pulls the body back toward its definite equilibrium position.
*   **Types of Oscillation:** Divided into linear oscillations (e.g., mass-spring systems, fluid columns in U-tubes) and circular oscillations (e.g., simple pendulums, balance wheels of clocks).
*   **Oscillatory Systems:** Categorised into mechanical systems (where physical objects move under inertia and restoring forces) and non-mechanical systems (where physical properties vary periodically without mass displacement).
*   **Fundamental Terms:** Period ($T$) is the time required for one full cycle; Frequency ($f$) is the number of cycles per unit time ($T = 1/f$); Amplitude ($A$) is the maximum displacement from equilibrium.
*   **Simple Harmonic Motion (SHM):** A special form of oscillatory motion produced by a restoring force obeying Hooke's Law ($F_s = -kx$), where acceleration is directly proportional to displacement and directed opposite to it ($a \\propto -x$).
*   **Conditions for SHM:** Requires a stable equilibrium position, negligible energy dissipation, and a restoring force linearly proportional to displacement.

**Kinematics and Energy of SHM**
*   **Displacement:** Expressed sinusoidally as $x(t) = A \\sin(\\omega t)$ when starting from equilibrium, where $\\omega$ is the angular frequency.
*   **Velocity:** Given by $v(t) = \\omega A \\cos(\\omega t)$, reaching its maximum speed $v_{\\max} = \\omega A$ as the object passes through the equilibrium position ($x = 0$).
*   **Acceleration:** Expressed as $a(t) = -\\omega^2 A \\sin(\\omega t) = -\\omega^2 x$, reaching its maximum magnitude $a_{\\max} = \\omega^2 A$ at the extreme positions ($x = \\pm A$).
*   **Potential Energy ($PE$):** Stored energy given by $PE = \\frac{1}{2} k x^2$, which reaches its maximum value at the turning points ($x = \\pm A$).
*   **Kinetic Energy ($KE$):** Energy of motion given by $KE = \\frac{1}{2} m v^2$, reaching its peak value at the equilibrium point ($x = 0$).
*   **Total Mechanical Energy ($E$):** The sum of kinetic and potential energy is constant in the absence of friction ($E = \\frac{1}{2} k A^2$), showing energy is directly proportional to the square of the amplitude.

## 2. The Simple Pendulum

**Dynamics and Period of a Simple Pendulum**
*   **System Description:** Consists of a small bob of mass $m$ suspended by a light, inextensible string of length $L$ fixed at its upper end.
*   **Restoring Force:** Gravity provides the restoring force ($F = -mg \\sin\\theta$), which acts along a circular arc and approximates Hooke's Law for small angular displacements.
*   **Period Equation:** The oscillation period for small amplitudes is given by $T = 2\\pi \\sqrt{\\frac{L}{g}}$.
*   **Independence Properties:** The period depends exclusively on the pendulum's length ($L$) and local free-fall acceleration ($g$), remaining completely independent of the bob's mass ($m$) and oscillation amplitude.

## 3. Wave Characteristics and Behavior

**Fundamentals and Classification of Waves**
*   **Wave Definition:** A disturbance from equilibrium that propagates through space carrying energy and momentum without transporting matter.
*   **Pulse:** A single travelling disturbance introduced into a medium.
*   **Wave Terminologies:** Includes Crests (points of maximum upward displacement), Troughs (points of maximum downward displacement), Wavelength ($\\lambda$, distance between consecutive in-phase points), and Wave Speed ($v = \\lambda f$).
*   **Classification by Medium:**
    *   *Mechanical Waves:* Require a deformable material medium for propagation (e.g., sound waves, water waves, string waves).
    *   *Electromagnetic (EM) Waves:* Produced by accelerated electric charges and propagate through both material media and vacuum at speed $c = 3.0 \\times 10^8\\text{ m/s}$ (e.g., light, radio waves, X-rays).
*   **Classification by Particle Motion:**
    *   *Transverse Waves:* Particles oscillate perpendicular to the direction of wave propagation (e.g., water waves, string waves, EM waves).
    *   *Longitudinal Waves:* Particles oscillate parallel to the direction of wave propagation, creating compressions and rarefactions (e.g., sound waves).

**Resonance, Doppler Effect, and Wave Phenomena**
*   **Resonance:** A phenomenon where an external periodic force drives a system to oscillate with significantly increased amplitude when its driving frequency matches the system's natural frequency.
*   **Doppler Effect:** The apparent shift in observed frequency ($f_o$) caused by relative motion between a wave source emitting frequency $f_s$ and an observer, described by $f_o = f_s \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right)$.
*   **Reflection:** The rebounding of a travelling wave when it strikes a medium boundary.
*   **Refraction:** The change in propagation direction of a wave entering a new medium due to a change in its wave speed.
*   **Diffraction:** The spreading or bending of waves around obstacles or through narrow apertures, most noticeable when wavelength is comparable to obstacle size.
*   **Interference:** The superposition of multiple wave trains traversing coincident paths, combining amplitudes constructively or destructively; slightly different frequencies produce periodic intensity fluctuations called beats.

## 4. Image Formation by Thin Lenses and Mirrors

**Images Formed by Plane Mirrors**
*   **Plane Mirror Properties:** Flat reflecting surfaces that reflect light rays regularly.
*   **Image Characteristics:** Images produced by plane mirrors are always virtual, erect, equal in size to the object, and located behind the mirror at a distance equal to the object distance.

**Images Formed by Thin Lenses**
*   **Lens Definition:** Optical devices made of transparent material bounded by two spherical refracting surfaces that converge or diverge light.
*   **Convex (Converging) Lenses:** Thickest at the center, converging parallel incident rays to a real focal point ($F$).
    *   Can form real, inverted images (diminished, same size, or enlarged) when the object is placed beyond the focal point.
    *   Forms an enlarged, virtual, erect image when the object is placed between the focal point and the lens.
*   **Concave (Diverging) Lenses:** Thinnest at the center, diverging parallel incident rays away from a virtual focal point.
    *   Always form virtual, erect, and diminished images regardless of object position.
*   **Thin Lens Equation & Magnification:** The relationship between focal length ($f$), object distance ($s_o$), and image distance ($s_i$) is given by $\\frac{1}{f} = \\frac{1}{s_o} + \\frac{1}{s_i}$, with magnification $m = \\frac{h_i}{h_o} = -\\frac{s_i}{s_o}$.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 5: Oscillations, Waves, and Optics',
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
    console.log('Successfully inserted Physics Chapter 5!');
  }
}

run();
