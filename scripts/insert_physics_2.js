require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const content = `# Chapter 2: Kinematics and Dynamics of Particles

## 1. Kinematics in One and Two Dimensions

**Fundamentals of Kinematics**
*   **Branch of Mechanics:** Mechanics is divided into kinematics, which describes the motion of bodies without considering the forces causing it, and dynamics, which analyzes motion alongside its physical causes.
*   **Position and Displacement:** Position locates an object relative to a chosen reference point, whereas displacement ($\\Delta \\vec{r}$) represents the vector change in position between initial and final locations.
*   **Distance vs. Displacement:** Distance ($S$) is the scalar total length of the path followed, which can differ from the magnitude of the displacement vector.
*   **Velocity Concepts:** Average velocity ($\\vec{v}_{\\text{avg}}$) is total displacement divided by elapsed time, whereas average speed is total distance divided by elapsed time. Instantaneous velocity ($\\vec{v}$) is the limiting value of average velocity as the time interval approaches zero, with instantaneous speed being its scalar magnitude.
*   **Acceleration Concepts:** Average acceleration ($\\vec{a}_{\\text{avg}}$) measures the rate of change of velocity over a time interval, while instantaneous acceleration ($\\vec{a}$) is the time-derivative limit of average acceleration as time approaches zero.

**Motion with Constant Acceleration**
*   **Uniform Rate of Change:** Under constant acceleration, instantaneous acceleration equals average acceleration over any interval because velocity changes at a constant rate.
*   **One-Dimensional Equations:** Motion along a straight line with constant acceleration is governed by standard kinematic equations:
    *   $\\vec{v}_f = \\vec{v}_i + \\vec{a}t$
    *   $\\vec{x}_f - \\vec{x}_i = \\left(\\frac{\\vec{v}_i + \\vec{v}_f}{2}\\right)t$
    *   $\\vec{x}_f - \\vec{x}_i = \\vec{v}_i t + \\frac{1}{2}\\vec{a}t^2$
    *   $v_f^2 = v_i^2 + 2a(x_f - x_i)$
*   **Extension to Two Dimensions:** Two-dimensional motion is analyzed by decomposing displacement, velocity, and acceleration vectors into independent orthogonal $x$ and $y$ components.

**Free Fall and Projectile Motion**
*   **Free Fall Motion:** Free fall describes an object moving near Earth's surface under the sole control of gravity, experiencing a constant downward acceleration of magnitude $g \\approx 9.8\\text{ m/s}^2$.
*   **Projectile Motion Definition:** Projectile motion occurs when an object is launched obliquely into space, moving along a curved trajectory determined by gravitational force.
*   **Key Assumptions:** Projectile analysis assumes a constant downward gravitational acceleration ($a_y = -g$) and negligible air resistance, resulting in zero horizontal acceleration ($a_x = 0$) and a downward parabolic trajectory.
*   **Trajectory Equations:** The horizontal position changes linearly ($x = u_x t = u \\cos\\theta \\cdot t$), while vertical position experiences constant downward acceleration ($y = u_y t - \\frac{1}{2}gt^2 = u \\sin\\theta \\cdot t - \\frac{1}{2}gt^2$).
*   **Peak Height and Range:** The maximum height $H = \\frac{u^2 \\sin^2\\theta}{2g}$ occurs when vertical velocity becomes zero, and the horizontal range is $R = \\frac{u^2 \\sin(2\\theta)}{g}$ for level ground projection.

## 2. Particle Dynamics and Planetary Motion

**Concept and Classification of Forces**
*   **Definition of Force:** A force is any interaction that alters or tends to alter an object's state of rest or motion, direction, or physical shape.
*   **Net Force:** The vector sum of all external forces acting on a body is the net force ($\\sum \\vec{F}$), which causes acceleration whenever it is non-zero.
*   **Fundamental Interactions:** Nature exhibits four basic interactions: gravitational, electromagnetic, strong nuclear, and weak nuclear forces.
*   **Contact vs. Non-Contact Forces:** Contact forces require physical contact between interacting bodies (e.g., muscular, frictional, normal, applied, tension, spring, and air resistance forces). Non-contact (field) forces act across a distance without direct physical contact (e.g., gravitational, magnetic, and electric forces).

**Newton's Laws of Motion and Friction**
*   **First Law (Law of Inertia):** An object continues in its state of rest or uniform motion in a straight line unless compelled to change that state by a net external force.
*   **Second Law:** The acceleration of a particle is directly proportional to the net external force acting on it and inversely proportional to its mass ($\\sum \\vec{F} = m\\vec{a}$), pointing in the direction of the net force.
*   **Third Law:** For every action force exerted by body A on body B, there is an equal and opposite reaction force exerted by body B on body A ($\\vec{F}_{BA} = -\\vec{F}_{AB}$), acting on two distinct objects.
*   **Frictional Forces:** Friction opposes relative motion between contacting surfaces and is directly proportional to the normal force ($F_f = \\mu F_N$). Static friction ($f_s \\le \\mu_s F_N$) prevents relative motion between stationary surfaces, while kinetic friction ($f_k = \\mu_k F_N$) opposes sliding motion.

**Uniform Circular Motion**
*   **Nature of Acceleration:** An object traversing a circular path at constant speed undergoes uniform circular motion, accelerating solely due to the continuous change in direction of its velocity vector.
*   **Centripetal Acceleration:** The acceleration vector points radially inward toward the center of the circle with magnitude $a_c = \\frac{v^2}{r}$, perpendicular to the tangential velocity.
*   **Period of Motion:** The time required to complete one full circular revolution is the period $T = \\frac{2\\pi r}{v}$.

**Universal Gravitation, Kepler's Laws, and Weightlessness**
*   **Newton's Law of Universal Gravitation:** Every particle in the universe attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers ($\\vec{F} = -G\\frac{m_1 m_2}{r^2}\\hat{r}$).
*   **Kepler's First Law (Law of Ellipses):** All planets move in elliptical orbits with the Sun located at one focus of the ellipse.
*   **Kepler's Second Law (Law of Areas):** A radius vector connecting a planet to the Sun sweeps out equal areas in equal intervals of time, causing the planet to move fastest at perihelion and slowest at aphelion.
*   **Kepler's Third Law (Law of Periods):** The square of a planet's orbital period is proportional to the cube of the semi-major axis of its orbit.
*   **Weightlessness:** Weightlessness is the sensation experienced during free fall when no external contact forces exert a push or pull on the body to oppose gravity.

## 3. Work, Energy, and Linear Momentum

**Work, Hooke's Law, and Energy**
*   **Work by Constant Force:** Work ($W$) is a scalar quantity defined as the dot product of force and displacement ($W = \\vec{F} \\cdot \\Delta \\vec{r} = F \\Delta r \\cos\\theta$), measured in Joules ($\\text{J}$).
*   **Work by Variable Spring Force:** According to Hooke's Law, a spring exerts a restoring force proportional to displacement ($F_s = -kx$), and the work done equals the area under the force-position graph ($W = \\frac{1}{2}kx^2$).
*   **Work-Kinetic Energy Theorem:** The net work done by all external forces acting on a particle equals the change in its kinetic energy ($W_{\\text{net}} = \\Delta K.E. = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$).
*   **Potential Energy and Conservation of Mechanical Energy:** Potential Energy ($P.E.$) represents energy stored by virtue of system configuration under conservative forces. In an isolated, friction-free system, total mechanical energy ($E = K.E. + P.E.$) remains conserved.

**Power**
*   **Average and Instantaneous Power:** Power is the time rate of energy transfer or work done. Average power is $P_{\\text{avg}} = \\frac{W}{\\Delta t}$, while instantaneous power is $P = \\frac{dW}{dt} = \\vec{F} \\cdot \\vec{v}$, expressed in Watts ($\\text{W}$).

**Linear Momentum and Impulse**
*   **Linear Momentum Definition:** Linear momentum ($\\vec{p} = m\\vec{v}$) is a vector quantity defined as the product of mass and velocity, directed along the velocity vector.
*   **Force and Momentum:** Newton's Second Law can be formulated as the time rate of change of linear momentum ($\\sum \\vec{F} = \\frac{d\\vec{p}}{dt}$).
*   **Impulse-Momentum Theorem:** Impulse ($\\vec{I} = \\int \\vec{F}dt$) delivered by a net force equals the total change in linear momentum of the object.
*   **Conservation of Momentum:** In an isolated system with no net external forces, the total linear momentum before interaction equals the total linear momentum after interaction ($\\sum \\vec{p}_i = \\sum \\vec{p}_f$).

**Collisions and Center of Mass**
*   **Elastic Collisions:** Collisions in which both total linear momentum and total kinetic energy are conserved.
*   **Inelastic Collisions:** Collisions in which total linear momentum is conserved, but total kinetic energy is not conserved due to transformation into other energy forms. In a perfectly inelastic collision, objects stick together post-collision to move with a common final velocity.
*   **Center of Mass:** The center of mass ($\\vec{r}_{\\text{CM}} = \\frac{\\sum m_i \\vec{r}_i}{\\sum m_i}$) is the single point where all mass of a system can be considered concentrated for analyzing global translational motion.
`;

async function run() {
  const payload = {
    id: crypto.randomUUID(),
    title: 'Chapter 2: Kinematics and Dynamics of Particles',
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
    console.log('Successfully inserted Physics Chapter 2!');
  }
}

run();
