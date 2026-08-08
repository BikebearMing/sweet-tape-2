/* Sweet Tape — the footer's loose objects.
 *
 * Seven discs loose in the bed under the sign-off, and they behave like things
 * rather than like decoration: they have mass, they carry momentum, they
 * collide, they spin, and the cursor moving through them shoves them out of the
 * way. Nothing holds them anywhere. A roll knocked to the left keeps going
 * left, crosses the bed, hits whatever is over there and stays where that
 * leaves it — the arrangement in footerBalls.ts is where they START, not where
 * they belong.
 *
 * MATTER-JS, HEADLESS. The engine runs with no renderer at all — Matter owns
 * the maths and nothing else. Every ball is a real DOM element that the loop
 * writes one transform onto per frame. That is the whole reason for the
 * arrangement: the social discs are anchors and the rolls are artwork, so
 * they have to stay in the document to be clickable, focusable, and readable.
 * A canvas would have made them pixels.
 *
 * THE TRANSFORM IS A DELTA. Each ball starts out sitting at its design position
 * — global.css places it from --ball-x / --ball-y, in vw — so what gets written
 * here is the OFFSET from that starting point, not an absolute position. Two
 * things fall out of it: the server-rendered page paints the composition
 * exactly, with no JS and nothing to wait for; and if this module never runs,
 * what is on screen is the design rather than a heap in a corner.
 *
 * GRAVITY, AND NOTHING TETHERING THEM. The bed has a floor and things fall to
 * it. Scroll the footer into view and the seven drop out of the arrangement
 * they were drawn in, land, roll, and pile up along the bottom — and that pile
 * is where they live from then on. Shove one and it is shoved along the floor;
 * throw one and it arcs and comes down.
 *
 * Nothing pulls them back to where they started. An earlier pass sprang them
 * home, which made them feel elastic-corded, and a pass after that took gravity
 * away entirely, which left them gliding around like it was a tank of water.
 * Both are gone: they have weight, they fall, they stay where they land.
 *
 * Imported dynamically, so ~30 kB of physics stays out of the initial bundle
 * for a section nobody has scrolled to yet, and it is only simulated while the
 * bed is actually on screen.
 */
import gsap from "gsap";

export const BALLS = {
  /* Downward pull, in vw per second squared — the same unit the cursor's push
     is quoted in, and for the same reason: expressed in vw rather than in
     Matter's own px-per-step it means the identical fall on any window size.
     70 is Matter's default weight at the 1440 design width, which is a brisk,
     solid drop rather than a moon-landing.

     Matter applies this as gravity.y × gravity.scale, and it early-returns on a
     scale of exactly 0 — so this is converted into scale below and must not be
     set to zero here to turn gravity off. There is no float any more to go back
     to; the balls fall. */
  GRAVITY: 60,

  /* The pour.
     ------------------------------------------------------------------------
     The balls do not start in the bed. They start off the sides of the screen —
     the ones drawn on the left half off the left edge, the rest off the right —
     queued up in a chute and thrown inward, so the section fills from both
     sides at once as it is scrolled to.

     There is no timer anywhere in this, and that is the point: a ball's place
     IN THE QUEUE is what staggers it. The first one has a few vw to cross and
     arrives at once; the last is sixty-odd vw out and takes a beat longer, by
     which time it is falling and rolls in along the floor instead. The whole
     pour is the queue emptying itself.

     What starts it is simply the engine's first step, and the engine only steps
     while the bed is on screen (see the observer at the bottom of this file).
     So the balls sit motionless off-stage for as long as nobody has scrolled
     this far, then pour the moment the section is looked at. */
  POUR: {
    /* Clear air between the viewport's edge and the waiting ball, vw. Short,
       and that is the important part. An earlier pass queued them in a line
       off-stage and let the length of the queue do the staggering, which put
       the last one sixty vw out — far enough that it had landed and was rolling
       by the time it reached the bed, arriving at floor level into a row that
       was already full, and simply stopping outside the screen. Staged close
       in, every ball is still AIRBORNE when it crosses the edge, so it comes
       down onto the pile and stacks instead of shunting it. */
    STAGE: 4,

    /* Seconds between one ball being let go and the next, and it has a floor
       under it that is not a matter of taste.
     *
       Releases alternate sides, so two balls out of the SAME chute are 2 ×
       STAGGER apart, and in that time the first has to clear its own radius
       plus the next one's — otherwise the new ball is created inside it. The
       worst pair here is the two left-hand rolls, 20.1vw of radius between
       them, and at SPEED that needs 0.30s; 0.34 leaves a little margin. Go
       below it and balls spawn overlapping, which is not a near miss but a
       bang: Matter separates a deep overlap through POSITION, and it derives
       velocity from position, so the pair comes apart like a struck cue ball.
     *
       This is also the whole duration of the pour — seven at this spacing is
       about two seconds, plus the last one's flight. */
    STAGGER: 0.26,

    /* Thrown inward at, in vw per second, with a little downward on it so it
       arcs into the bed rather than sailing across it flat.
     *
       Hard enough to matter. Seven of these are 116vw of diameter landing in
       104vw of walled floor, so the last few always arrive at a bed that is
       already full and have to drive in and make room; thrown gently they stall
       against the edge of the pile instead, which is how the tiktok disc ended
       up parked off-screen. Raising this tightens the bound on STAGGER above —
       read that note before changing either. */
    SPEED: 55,
    DROP: 6,

    /* The nudge on a ball that has been thrown but has not got in yet, in vw
       per second squared — see armArrivals. Even at speed an arrival can be
       stopped short by the pile, and this is what keeps it coming rather than
       leaving it stranded outside the walls where nothing can reach it. */
    PERSIST: 90,

    /* The spin they are thrown with, in radians per second, signed to match the
       direction of travel so they look rolled rather than skidded. */
    SPIN: 5,

    /* Where they come in, as a band measured DOWN from the bed's top edge in
       vw. LATER releases enter HIGHER — TOP + SPAN for the first out, TOP for
       the last — because by the time the last ones are thrown the floor is
       filling up, and a ball aimed at the height the floor used to be just
       shunts the pile sideways. Coming in over the top of it, they land on it
       and stack, which is the only way all seven fit. Clamped per ball, so
       nothing is created already inside the ceiling. */
    TOP: 9,
    SPAN: 9,
  },

  /* The bounce. Well under elastic, because these are meant to have some heft:
     a roll dropping onto the floor should land with a thud and one small
     rebound, not pogo. It is also what lets the pile actually come to rest —
     a springy stack keeps handing energy back and forth and never settles. */
  RESTITUTION: 0.32,

  /* Surface grip, which is what makes a ball spin at all: Matter turns the
     tangential part of a contact impulse into angular velocity through this. At
     0 a roll would slide down the floor without turning once, which for
     something with printing on it reads as a bug. With a floor under them it is
     also what makes a shoved roll ROLL rather than skid. */
  FRICTION: 0.16,

  /* Air. A body's speed is multiplied by (1 - this) every step, so at 0.004 it
     halves about every two and a half seconds. Low, because with gravity doing
     the work this is no longer what stops a ball — the floor and the pile are —
     and anything higher visibly slows the FALL, which is the one moment the
     weight is most obvious. Raise it toward 0.02 for treacle. */
  FRICTION_AIR: 0.004,

  /* Mass per unit area, Matter's default. A ball's mass is this times its area,
     so mass goes with the SQUARE of the diameter: the 21.5vw stationery roll is
     just under three times the mass of a 12.7vw social disc. That ratio is
     where the weight in this section comes from, and it only means anything
     because the cursor below pushes with a force rather than an acceleration. */
  DENSITY: 0.001,

  /* The ball the cursor's figures are quoted for, in vw. Everything else is
     heavier or lighter than this one in proportion to its own area, and answers
     the same shove by exactly that much less or more. Roughly a roll. */
  REF_D: 18,

  /* The cursor's reach past a ball's own edge, in vw. */
  POINTER_REACH: 5,

  /* How hard the cursor shoves, as the acceleration in VW PER SECOND SQUARED it
     lands on a REF_D ball at point-blank range from a full-speed pointer. Every
     ball gets the same FORCE, not the same acceleration — which is the whole
     difference between objects with weight and objects without. The 21.5vw roll
     therefore takes 133 of it and the 12.7vw disc 382: brush past both at the
     same speed and the little one skitters while the roll barely leans.

     (An earlier pass scaled this by each ball's own mass, which cancels the
     mass out of F = ma and accelerates a heavy roll exactly as hard as a light
     disc. That is what weightlessness IS, and no amount of tuning the number
     would have fixed it.) */
  POINTER_PUSH: 200,

  /* How much of the cursor's own travel is dragged along the surface it
     brushes, in the same units — the tangential half of the same contact. This
     is where most of the spin comes from: a cursor swiped across a roll's face
     rolls it, a cursor driven into its middle only shoves it. */
  POINTER_DRAG: 70,

  /* The cursor's speed is measured per frame and would spike to nonsense on the
     first move after an idle gap, or when the pointer re-enters the window
     across the page. Clamped, in px per frame. */
  POINTER_MAX_SPEED: 60,

  /* The speed limit, in vw per second. A ball worked into a corner by the
     cursor takes push after push with nowhere to spend any of it, and a fast
     enough body crosses a wall between two frames. 85vw/s clears everything the
     section produces on its own — the pour throws at 34, and a fall down the
     whole bed arrives at about 73 — so it never quietly caps the physics, but
     it is low enough to be a real backstop on anything that is not physics. */
  MAX_SPEED: 85,

  /* How firmly a grabbed ball follows the cursor. Soft rather than rigid, so a
     roll hauled about lags a little behind the pointer and swings past it on a
     change of direction — the ball is heavy and the grip is a hand, not a weld.
     Soft enough, too, that flinging one builds real momentum to let go of. */
  GRAB_STIFFNESS: 0.06,
  GRAB_DAMPING: 0.08,

  /* How far off-centre the hold actually sits, as a fraction of the distance
     from the middle of the ball to the spot that was under the cursor. 1 holds
     it exactly where you took hold of it, which is the honest reading and far
     too lively: every correction you make while dragging is a lever on the rim,
     so the ball winds up and comes off the cursor spinning like a top. 0 holds
     it dead centre and it never turns at all, which reads as a sticker being
     slid about. A third of the way out keeps the lean and loses the wind-up. */
  GRAB_OFFSET: 0.34,

  /* And what the grip itself absorbs: the fraction of a held ball's spin taken
     off every step. A hand round something round resists it turning, and this
     is that. It is the reason a toss leaves with the rotation the throw gave it
     rather than everything the drag wound into it beforehand. */
  GRAB_SPIN_DAMP: 0.1,

  /* Past this much travel a press is a drag, not a click — a ball that has been
     thrown across the bed must not also navigate to Instagram on release. In
     px, measured from where the press started. */
  DRAG_SLOP: 6,

  /* How far outside the bed the side walls stand, in vw. Not zero: the
     stationery roll starts 1.15vw off the left edge, exactly as it does in the
     mock, and a wall on the boundary would shove it inward on the first frame.
     Small, though — with nothing pulling them back, anything more generous is
     room a ball can roll into and sit there half off the screen. */
  WALL_SLACK: 2,

  /* How far ABOVE the bed's bottom edge the floor sits, in vw. Nothing to do
     with the physics and everything to do with the legal line: it is pinned
     1.6vw up from that edge, and once the seven have gravity they all come to
     rest in exactly the band it occupies, so the small print ends up printed
     across a heap of tape rolls. This lifts the floor clear of it.

     Set it to 0 to put the pile on the bed's real floor — which is where the
     mock's bottom row very nearly sits, and which is also why four of the
     starting positions begin a vw or two BELOW this line. That is harmless:
     they are all falling at that moment anyway, and Matter eases a body out of
     a static one over several frames rather than snapping it. */
  FLOOR: 3.2,

  /* The longest step the simulation will take in one frame, in ms.
   *
     Two jobs. A backgrounded tab or a breakpoint hands the loop seconds of
     elapsed time, and Matter integrating one step that large puts every ball
     through a wall — so time slips rather than the simulation.
   *
     The tighter reason for 20 rather than the obvious 1/30: Matter integrates
     Verlet-style, deriving a body's velocity from its last position delta, so a
     variable delta makes it rescale that delta by the ratio between this frame
     and the previous one. The ratio is a multiplier on everything, and the
     frame a ball is thrown on is where it shows: a launch of 34vw/s measured
     52 on a frame that ran half again as long. Capping the step caps the ratio.
   *
     Banking the remainder and spending it in fixed 1/60 pieces is the textbook
     answer and it is worse here, measurably: at a ~60Hz ticker the accumulator
     lands on 0 steps some frames and 2 on others, so the drawn motion alternates
     between frozen and double-speed. Peak speeds tripled. One step per frame,
     bounded, is smoother than a correct integrator sampled wrong. */
  MAX_DELTA: 20,
};

/* Returns a teardown, always — including one that is called before the physics
 * has finished downloading, which cancels the start rather than tearing down
 * something that does not exist yet. */
export function initFooterBalls(root: HTMLElement): () => void {
  const bed = root.querySelector<HTMLElement>(".footer-bottom");
  const els = Array.from(root.querySelectorAll<HTMLElement>(".footer-ball"));
  if (!bed || !els.length) return () => {};

  /* Seven objects milling about under the copy is exactly what this setting is
     asking about. The balls are already at their design positions in CSS, so
     doing nothing at all leaves the composition standing — which is the whole
     point of the transform being a delta. */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  let stop: (() => void) | null = null;
  let cancelled = false;

  /* Swallowed on purpose. A chunk that never arrives — offline, a bad deploy,
     a blocked request — must leave the footer exactly as the stylesheet drew
     it, which is the finished composition. There is nothing to fall back to
     because nothing was taken away. */
  import("matter-js")
    .then((Matter) => {
      if (cancelled) return;
      stop = run(Matter, bed, els);
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    stop?.();
    stop = null;
  };
}

type MatterModule = typeof import("matter-js");

/* Where a ball is and how fast it is going, in a form a resize can replay —
 * position as a fraction of the bed, so it survives the box changing size. */
type Snapshot = { fx: number; fy: number; vx: number; vy: number; spin: number };

function run(
  Matter: MatterModule,
  bed: HTMLElement,
  els: HTMLElement[],
): () => void {
  const { Bodies, Body, Composite, Constraint, Engine, Sleeping, Vector } =
    Matter;

  /* Collision categories, and there are only two things to separate: the side
     walls, and everything else. A ball waiting in the chute is OUTSIDE the wall
     it has to come in through, so until it has arrived it must be allowed to
     pass through — `armed` below is that switch, thrown per ball the moment it
     is wholly inside the bed. Floor and ceiling stay on the default category,
     so a queued ball still lands on the (extended) floor and rolls in. */
  const CAT_DEFAULT = 0x0001;
  const CAT_SIDE_WALL = 0x0002;

  type Ball = {
    el: HTMLElement;
    body: Matter.Body;
    home: Matter.Vector;
    /* Which edge it pours in from: -1 left, +1 right. */
    side: number;
    /* When it is thrown, in seconds from the pour's first frame. */
    releaseAt: number;
    released: boolean;
    /* False while the ball is still on its way in, during which the side walls
       are intangible to it and it passes through the others still arriving.
       Once true it is a solid object in a closed box, for good. */
    armed: boolean;
  };

  type World = {
    engine: Matter.Engine;
    w: number;
    h: number;
    /* How far outside the bed the side walls stand, in px — the line arriving
       balls are armed at. See armArrivals. */
    sx: number;
    balls: Ball[];
    /* Seconds the pour has been running — the clock the releases are read off.
       It only advances while the bed is on screen, so nothing is let go before
       anyone is there to see it. */
    elapsed: number;
  };

  let world: World | null = null;

  /* The cursor, in the bed's own coordinates, plus the distance it covered on
     the last frame — the push below is a function of both where it is and how
     fast it is going, so a cursor resting inside a ball does not slowly bore
     through it. */
  let px = 0;
  let py = 0;
  let pdx = 0;
  let pdy = 0;
  let pointerIn = false;

  /* The grab. A constraint from the cursor to the point on the body that was
     under it when the press landed — off-centre, so hauling a roll around by
     its edge turns it, exactly as picking a real one up by the rim would. */
  let grabbed: Matter.Body | null = null;
  let grab: Matter.Constraint | null = null;
  let pressX = 0;
  let pressY = 0;
  let dragged = false;

  function vw(n: number) {
    return (n * window.innerWidth) / 100;
  }

  /* Built from the DOM, and optionally replayed from a snapshot taken before a
     resize. `carry` is indexed to match `els`. */
  function build(carry?: Snapshot[]) {
    const w = bed.clientWidth;
    const h = bed.clientHeight;
    if (!w || !h) return;

    /* Sleeping ON, which with gravity it has to be. A pile of resting bodies is
       never quite in equilibrium — the solver keeps nudging them apart and
       gravity keeps pressing them back — and left awake the whole heap shivers
       quietly along the floor forever. Asleep it is properly still, and costs
       nothing to keep there. Matter wakes a body when something collides with
       it; the cursor is not a collision, so pushFromPointer wakes them itself.*/
    const engine = Engine.create({ enableSleeping: true });

    /* Gravity, converted from vw/s² into the units Matter applies it in. It
       lands as an acceleration of gravity.y × gravity.scale × dt² px per step,
       with dt in ms — the same 1e6 factor the cursor's force goes through, and
       the same reason: scaling it by one vw is what makes the fall identical at
       every window size rather than slower on a wide screen. */
    engine.gravity.y = 1;
    engine.gravity.scale = (BALLS.GRAVITY * vw(1)) / 1_000_000;

    const P = BALLS.POUR;
    const floorY = h - vw(BALLS.FLOOR);

    /* Measured off the elements rather than read from the data that produced
       them. offsetLeft/offsetTop/offsetWidth are the box CSS actually laid out,
       and — the part that matters — they are untouched by the transform this
       loop is about to write onto the very same elements. Reading a
       getBoundingClientRect here would feed the last frame's displacement back
       in as the next frame's origin. */
    const geom = els.map((el) => {
      const r = el.offsetWidth / 2;
      return { r, home: Vector.create(el.offsetLeft + r, el.offsetTop + r) };
    });

    /* Which side each one pours from: whichever half of the bed it was DRAWN
       in, so the pour comes in balanced from both edges and each ball arrives
       near where the composition meant it to be. */
    const sides = geom.map((g) => (g.home.x < w / 2 ? -1 : 1));

    /* The order they are let go in, alternating sides for as long as both have
       something left. Taken in turns rather than one side and then the other,
       so it reads as pouring in from both edges at once instead of as two
       separate deliveries. */
    const left = sides.map((s, i) => (s < 0 ? i : -1)).filter((i) => i >= 0);
    const right = sides.map((s, i) => (s > 0 ? i : -1)).filter((i) => i >= 0);
    const turn = new Map<number, number>();
    for (let k = 0; k < Math.max(left.length, right.length); k++) {
      if (k < left.length) turn.set(left[k], turn.size);
      if (k < right.length) turn.set(right[k], turn.size);
    }

    /* The furthest any ball is staged beyond an edge. The floor and the ceiling
       are stretched to cover it, since a ball waiting its turn out there still
       needs something under it if it is ever dropped rather than thrown. */
    let stageExtent = 0;

    const balls: Ball[] = els.map((el, i) => {
      const { r, home } = geom[i];
      const side = sides[i];
      const order = turn.get(i) ?? 0;
      const out = vw(P.STAGE) + r;
      stageExtent = Math.max(stageExtent, out + r);

      /* Entry height: later out of the chute, higher in — see TOP/SPAN.
         Clamped, so nothing is created already inside the ceiling or under the
         floor. */
      const last = Math.max(els.length - 1, 1);
      const band = vw(P.TOP) + (1 - order / last) * vw(P.SPAN);
      const entryY = Math.min(Math.max(band, r + vw(0.5)), floorY - r);

      const at = carry?.[i];
      const body = Bodies.circle(
        at ? at.fx * w : side < 0 ? -out : w + out,
        at ? at.fy * h : entryY,
        r,
        {
          restitution: BALLS.RESTITUTION,
          friction: BALLS.FRICTION,
          frictionAir: BALLS.FRICTION_AIR,
          density: BALLS.DENSITY,
          collisionFilter: {
            category: CAT_DEFAULT,
            /* Everything except the side walls, until it is in. Balls are NOT
               filtered against each other, deliberately — an arriving ball is
               solid to the ones already down from the moment it is thrown.
             *
               Letting them pass through one another and turning that off on
               arrival is the obvious way to write this and it is the bug that
               was in here: a ball that arms while overlapping another has that
               overlap resolved in one step, and since Matter derives velocity
               from position, the resolution IS a velocity — the pair springs
               apart far faster than anything else in the section moves. There
               is nothing to switch off if they were never intangible; the
               spacing in STAGGER is what keeps them from spawning inside each
               other in the first place. */
            mask: at ? ~0 : ~CAT_SIDE_WALL,
            group: 0,
          },
        },
      );

      if (at) {
        Body.setVelocity(body, { x: at.vx, y: at.vy });
        Body.setAngularVelocity(body, at.spin);
      }

      return {
        el,
        body,
        home,
        side,
        releaseAt: at ? 0 : order * P.STAGGER,
        released: !!at,
        armed: !!at,
      };
    });

    /* The box. Thick, because a thin static wall is something a fast body can
       cross between two frames — Matter has no continuous collision detection,
       so depth is the cheap insurance.

       The ceiling sits ON the bed's top edge, which is what keeps a thrown ball
       inside the section rather than sailing over the headline and out through
       the nav row. The floor is lifted by FLOOR — see there. Both are stretched
       to span the chutes as well as the bed: a ball waiting its turn out there
       still needs a floor to land on, and it rolls in along it.

       The side walls stand WALL_SLACK outside the bed, and they are the ones
       the arriving balls pass straight through — see the collision categories
       above. Once a ball is in, they hold it in.

       The floor has grip and the rest do not. A roll landing on the floor has
       to ROLL when it is shoved along it, and that is friction turning its
       travel into spin; the walls it only glances off would just scrub its pace
       away for nothing. */
    const T = vw(20);
    const sx = vw(BALLS.WALL_SLACK);
    const span = w + 2 * (stageExtent + T);
    const wall = (
      x: number,
      y: number,
      ww: number,
      hh: number,
      opts: { friction?: number; category?: number } = {},
    ) =>
      Bodies.rectangle(x, y, ww, hh, {
        isStatic: true,
        friction: opts.friction ?? 0,
        restitution: BALLS.RESTITUTION,
        collisionFilter: {
          category: opts.category ?? CAT_DEFAULT,
          mask: ~0,
          group: 0,
        },
      });

    Composite.add(engine.world, [
      wall(w / 2, -T / 2, span, T), // ceiling
      wall(w / 2, floorY + T / 2, span, T, { friction: BALLS.FRICTION }), // floor
      wall(-sx - T / 2, h / 2, T, h + 2 * T, { category: CAT_SIDE_WALL }),
      wall(w + sx + T / 2, h / 2, T, h + 2 * T, { category: CAT_SIDE_WALL }),
      /* Only the ones already in play. A ball waiting its turn is NOT IN THE
         WORLD at all — it is a body object with a position and nothing else,
         which is what makes waiting free and, more to the point, safe.
       *
         The obvious alternative is to add them all and hold them static, and it
         does not work: Matter's sleeping pass does not skip static bodies, so a
         ball sitting motionless off-stage racks up a sleep counter and is put
         to sleep within a second — and the integrator skips sleeping bodies, so
         thawing it later leaves it asleep and stone still where it stands. Half
         the pour simply never arrived. (There is a second trap on that path
         too: Body.setStatic only records the mass it overwrites when it is the
         call doing the freezing, so a body CONSTRUCTED static thaws to mass
         Infinity — awake, unfrozen, and deaf to gravity.) Not being in the
         world sidesteps both. */
      ...balls.filter((b) => b.released).map((b) => b.body),
    ]);

    const built: World = { engine, w, h, sx, balls, elapsed: 0 };
    world = built;

    /* Painted off-stage straight away rather than on the first step. The bed is
       a long way below the fold and the engine will not run until it is looked
       at, so without this the balls would sit at their CSS positions — the
       composition — and then vanish sideways on whatever frame the engine
       happened to start. */
    draw(built);
  }

  /* The pour itself: anything whose turn has come is thrown inward and slightly
     down, spinning the way it is going — poured out of something rather than
     dropped — and only then does it join the world. */
  function releaseDue(w: World) {
    const P = BALLS.POUR;
    for (const ball of w.balls) {
      if (ball.released || w.elapsed < ball.releaseAt) continue;
      ball.released = true;
      Body.setVelocity(ball.body, {
        x: (-ball.side * vw(P.SPEED)) / 60,
        y: vw(P.DROP) / 60,
      });
      Body.setAngularVelocity(ball.body, (-ball.side * P.SPIN) / 60);
      Composite.add(w.engine.world, ball.body);
    }
  }

  /* One transform per ball: the offset from where CSS put it, and its spin. */
  function draw(w: World) {
    for (const { el, body, home } of w.balls) {
      el.style.transform = `translate3d(${body.position.x - home.x}px, ${
        body.position.y - home.y
      }px, 0) rotate(${body.angle}rad)`;
    }
  }

  /* The side walls are intangible to a ball until it has arrived, at which
     point they become its boundary for good — and until then it is still being
     delivered, so it is leant on inward until it gets there.
   *
     ARMED AT THE WALL LINE, not at the bed's edge. Arming at the edge — only
     once a ball is wholly on screen — is a trap, and it cost the tiktok disc:
     the walls stand WALL_SLACK OUTSIDE the bed, so a ball can legitimately come
     to rest with its centre nearer the edge than its own radius, resting
     against a wall it is allowed to overlap the screen edge by. Such a ball can
     never satisfy the stricter test, so it never arms, so the wall it is
     leaning on stays intangible — and the first cursor push sends it straight
     through and out of the section for good. Which for a social link is not a
     cosmetic bug. The line here is the furthest a ball can be and still not be
     overlapping a wall, so arming can never itself cause a collision.
   *
     THE PUSH is the other half. An arriving ball can be stopped short by the
     pile — the seven of them are 116vw of diameter in 104vw of walled floor, so
     something always has to stack — and a ball halted outside the line would
     otherwise sit there unarmed forever. So anything still on its way in is
     driven inward until it is in: it is not a special case so much as the pour
     continuing to pour. Applied as an acceleration rather than a force (hence
     the mass), because this one has a job to finish and a heavy roll must not
     take longer at it than a light disc. */
  function armArrivals(w: World) {
    const persist = (vw(BALLS.POUR.PERSIST) * vw(1)) / 1_000_000;

    for (const ball of w.balls) {
      if (ball.armed || !ball.released) continue;

      const r = ball.body.circleRadius ?? 0;
      const x = ball.body.position.x;

      if (x >= -w.sx + r && x <= w.w + w.sx - r) {
        ball.armed = true;
        ball.body.collisionFilter.mask = ~0;
        continue;
      }

      if (ball.body.isSleeping) Sleeping.set(ball.body, false);
      Body.applyForce(ball.body, ball.body.position, {
        x: -ball.side * persist * ball.body.mass,
        y: 0,
      });
    }
  }

  /* Clamped into the bed on the way out, which matters because a rebuilt ball
     comes back ARMED — the side walls are solid to it from its first frame. A
     ball caught mid-pour, still out in its chute, would otherwise be rebuilt on
     the wrong side of a wall it can no longer pass through, and Matter would
     resolve that by shoving it further out. Anything still arriving when the
     window is resized simply arrives instantly instead. */
  function snapshot(w: World): Snapshot[] {
    return w.balls.map(({ body }) => {
      const r = body.circleRadius ?? 0;
      return {
        fx: Math.min(Math.max(body.position.x, r), w.w - r) / w.w,
        fy: body.position.y / w.h,
        vx: body.velocity.x,
        vy: body.velocity.y,
        spin: body.angularVelocity,
      };
    });
  }

  /* The cursor's half of the contact, applied once per ball per frame.
   *
   * Two components, both applied AT THE POINT ON THE BALL NEAREST THE POINTER
   * rather than at its centre, which is the whole trick: a force applied off
   * the centre of mass produces torque, so the same push that moves a roll also
   * spins it, and by exactly as much as it is off-axis. Applied at the centre
   * — the obvious way to write this — every ball would slide about perfectly
   * upright, which is the one thing a tape roll does not do.
   *
   *   The push, outward along the line from cursor to centre, falling off to
   *   nothing at the edge of POINTER_REACH. Scaled by how fast the cursor is
   *   travelling, so a pointer parked inside a ball stops pushing it: a cursor
   *   at rest is not doing anything, and a constant force would slowly extrude
   *   the ball out of the field and hold it there.
   *
   *   The drag, along the cursor's own direction of travel. This is the part
   *   that rolls things: swiped across a face it is nearly all tangential and
   *   the roll turns; driven into the middle it is nearly all radial and adds
   *   to the shove.
   */
  function pushFromPointer(w: World) {
    if (!pointerIn) return;

    const speed = Math.min(Math.hypot(pdx, pdy), BALLS.POINTER_MAX_SPEED);
    if (speed < 0.5) return;

    const reach = vw(BALLS.POINTER_REACH);
    const scale = speed / BALLS.POINTER_MAX_SPEED;

    /* One force, computed once, applied to every ball alike — so what each one
       does with it is decided by its own mass, which is the point.
     *
     * The conversion. Matter integrates velocity += (force / mass) * dt², with
     * dt in MILLISECONDS and velocity in px per step — so at 60fps dt² is about
     * 278, and a force of m·A·(1vw)/1e6 lands A vw/s² on that body:
     *
     *     px/step²  = (F/m) · dt²           = (F/m) · 277.8
     *     px/s²     = px/step² · 60²        = (F/m) · 1.0e6
     *     vw/s²     = px/s² / (1vw in px)
     *
     * The reference mass is what makes this the SAME force for everything while
     * still being quotable as an acceleration, and carrying it in the constant
     * is also what keeps the feel identical at every window size: mass goes
     * with the square of the viewport and one vw goes with the first power, so
     * the force scales with the cube — which is exactly what leaves the travel
     * measured in vw unchanged from a laptop to a large monitor. */
    const refR = vw(BALLS.REF_D) / 2;
    const refMass = Math.PI * refR * refR * BALLS.DENSITY;
    const perVw = (refMass * vw(1)) / 1_000_000;
    const pushForce = BALLS.POINTER_PUSH * perVw;
    const dragForce = BALLS.POINTER_DRAG * perVw;

    for (const { body } of w.balls) {
      if (body === grabbed) continue;

      const r = body.circleRadius ?? 0;
      const dx = body.position.x - px;
      const dy = body.position.y - py;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const gap = dist - r;
      if (gap > reach) continue;

      /* 1 at the surface, 0 at the limit of reach — and clamped, so a cursor
         INSIDE a ball (gap negative, which happens the moment one is shoved
         onto the pointer) does not get a proportionally enormous force. */
      const falloff = Math.min(1 - gap / reach, 1);
      const nx = dx / dist;
      const ny = dy / dist;

      /* The contact: where the cursor meets the surface, which for a cursor
         inside the ball is simply the near side of it. */
      const at = {
        x: body.position.x - nx * r,
        y: body.position.y - ny * r,
      };

      const push = pushForce * falloff * scale;
      const drag = dragForce * falloff;

      /* Matter wakes a body when something COLLIDES with it, and the cursor
         never does — it applies a force from a distance. Without this the pile
         would go to sleep and then sit there ignoring the pointer entirely,
         which looks exactly like the physics having crashed. */
      if (body.isSleeping) Sleeping.set(body, false);

      Body.applyForce(body, at, {
        x: nx * push + (pdx / speed) * drag,
        y: ny * push + (pdy / speed) * drag,
      });
    }
  }

  /* The speed limit — see MAX_SPEED. Scaled rather than clamped per axis, so a
     ball at the limit keeps its heading and only loses pace; clamping x and y
     separately would quietly bend everything toward the diagonals. */
  function capSpeed(w: World) {
    /* vw per second into px per step, the units Matter's velocities are in. */
    const max = vw(BALLS.MAX_SPEED) / 60;
    for (const { body } of w.balls) {
      const v = body.velocity;
      const s = Math.hypot(v.x, v.y);
      if (s <= max) continue;
      const k = max / s;
      Body.setVelocity(body, { x: v.x * k, y: v.y * k });
    }
  }

  /* --------------------------------------------------------------------------
     Pointer plumbing
     --------------------------------------------------------------------------
     On window rather than on the bed: a ball flung out from under the cursor
     leaves the pointer over bare paper, and the field has to keep working
     there or the balls stop responding exactly when they are moving most. The
     coordinates are converted to the bed's box on the way in.

     Touch is deliberately not wired to the grab. Preventing default on a
     touchmove is what a drag needs, and these discs cover most of the bed —
     doing that would mean a reader who happens to start a swipe on a roll
     cannot scroll past the footer. The push still works on touch, since it only
     needs a position. */
  function toBed(e: PointerEvent) {
    const r = bed.getBoundingClientRect();
    const nx = e.clientX - r.left;
    const ny = e.clientY - r.top;
    pdx = nx - px;
    pdy = ny - py;
    px = nx;
    py = ny;
    /* Slack around the box, so a cursor just outside the bed still pushes the
       balls riding its edge. */
    const m = vw(BALLS.WALL_SLACK) + vw(BALLS.POINTER_REACH);
    pointerIn = nx > -m && ny > -m && nx < r.width + m && ny < r.height + m;
  }

  function onMove(e: PointerEvent) {
    toBed(e);
    if (grab && Math.hypot(px - pressX, py - pressY) > BALLS.DRAG_SLOP) {
      dragged = true;
    }
    if (grab) grab.pointA = { x: px, y: py };
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType === "touch" || e.button !== 0) return;
    if (!world) return;
    toBed(e);

    const hit = world.balls.find(({ body }) => {
      const r = body.circleRadius ?? 0;
      return Math.hypot(body.position.x - px, body.position.y - py) <= r;
    });
    if (!hit) return;

    grabbed = hit.body;
    pressX = px;
    pressY = py;
    dragged = false;

    /* Same reason as the push: a constraint on a sleeping body does nothing.
       Grabbing one out of a settled pile has to wake it first. */
    Sleeping.set(hit.body, false);

    /* Where the hold attaches, in the BODY's own frame — un-rotated, which is
       what makes it stay on the spot it was taken at as the ball turns. Taken
       in world space instead, the ball would spin out from under the grip.
     *
       Pulled most of the way back toward the centre by GRAB_OFFSET. That is
       the difference between a lever and a hold: attached at the rim, every
       correction made while dragging torques the ball, and it comes off the
       cursor spinning far harder than it is travelling. */
    const rel = Vector.mult(
      Vector.rotate(
        Vector.sub({ x: px, y: py }, hit.body.position),
        -hit.body.angle,
      ),
      BALLS.GRAB_OFFSET,
    );

    grab = Constraint.create({
      pointA: { x: px, y: py },
      bodyB: hit.body,
      pointB: rel,
      length: 0,
      stiffness: BALLS.GRAB_STIFFNESS,
      damping: BALLS.GRAB_DAMPING,
    });
    Composite.add(world.engine.world, grab);

    /* The press is ours from here: no text selection, and no native image drag
       starting from under a ball that is about to be thrown. */
    e.preventDefault();
  }

  function onUp() {
    if (grab && world) Composite.remove(world.engine.world, grab);
    grab = null;
    grabbed = null;
  }

  /* A ball that was thrown must not also follow its own link. The flag is read
     here and cleared here, in the capture phase, before the anchor sees the
     click at all. */
  function onClick(e: MouseEvent) {
    if (!dragged) return;
    e.preventDefault();
    e.stopPropagation();
    dragged = false;
  }

  /* --------------------------------------------------------------------------
     The loop
     --------------------------------------------------------------------------
     On GSAP's ticker, which is the one clock on this site: Lenis is already
     driven from it (SmoothScroll.tsx), so the scroll position, the hero's
     parallax and this all advance on the same frame. A second rAF loop would
     put the physics half a frame out from the page it is sitting on. */
  let live = false;

  function tick(_t: number, dt: number) {
    const w = world;
    if (!w || !live) return;

    const step = Math.min(dt, BALLS.MAX_DELTA);
    w.elapsed += step / 1000;

    releaseDue(w);
    pushFromPointer(w);
    Engine.update(w.engine, step);
    capSpeed(w);
    armArrivals(w);

    /* The grip's own resistance to the ball turning in it — after the step, so
       what is bled off is the spin that step just wound in. See
       GRAB_SPIN_DAMP. */
    if (grabbed) {
      Body.setAngularVelocity(
        grabbed,
        grabbed.angularVelocity * (1 - BALLS.GRAB_SPIN_DAMP),
      );
    }

    /* The cursor's per-frame travel is consumed by the frame that reads it.
       Left standing it would keep pushing at the speed of the last real move
       for as long as the pointer sat still. */
    pdx = 0;
    pdy = 0;

    draw(w);
  }

  /* The one thing that starts the pour, and the one thing that pauses it.
   *
   * The engine steps only while a fifth of the bed is on screen, which does two
   * jobs at once. It keeps seven bodies and four walls from being integrated
   * for the entire time a reader spends three viewports up in the hero. And
   * because the balls are staged off-stage with their inward throw already set
   * on them, "the first step" IS the pour: nothing has to schedule it, and it
   * cannot go off early and be over before anyone has looked.
   *
   * A fifth rather than a sliver, and no rootMargin, so the section is properly
   * in view when it happens rather than notionally intersecting the bottom
   * edge. Not `once`: scroll away mid-pour and it holds exactly where it was
   * until you come back. */
  const io = new IntersectionObserver(
    ([entry]) => {
      live = entry.isIntersecting;
    },
    { threshold: 0.2 },
  );
  io.observe(bed);

  /* Rebuilt rather than rescaled: every length in this section is in vw, so a
     resized window changes each radius and the bed's own box at once, and
     re-deriving mass and inertia from the old bodies is more ways to be wrong
     than starting again. The snapshot is what stops that being destructive —
     positions carry across as fractions of the bed and velocities as they
     stand, so the balls stay where the reader left them rather than snapping
     back to an arrangement they wandered out of a minute ago.

     Debounced, because a dragged window edge fires this continuously. */
  let resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    const carry = world ? snapshot(world) : undefined;
    resizeTimer = window.setTimeout(() => {
      onUp();
      world = null;
      build(carry);
    }, 180);
  }

  const ac = new AbortController();
  const opts = { signal: ac.signal };
  window.addEventListener("pointermove", onMove, { ...opts, passive: true });
  window.addEventListener("pointerdown", onDown, opts);
  window.addEventListener("pointerup", onUp, { ...opts, passive: true });
  window.addEventListener("pointercancel", onUp, { ...opts, passive: true });
  window.addEventListener("resize", onResize, { ...opts, passive: true });
  bed.addEventListener("click", onClick, { ...opts, capture: true });

  build();
  gsap.ticker.add(tick);

  return () => {
    ac.abort();
    window.clearTimeout(resizeTimer);
    io.disconnect();
    gsap.ticker.remove(tick);
    if (world) {
      Composite.clear(world.engine.world, false);
      Engine.clear(world.engine);
      world = null;
    }
    /* Back to CSS, which is the starting composition — a teardown mid-scatter
       must leave something deliberate on screen rather than a freeze-frame. */
    for (const el of els) el.style.transform = "";
  };
}
