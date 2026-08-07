/* The footer's loose objects — the four rolls and the three social discs that
 * lie in the bed under the sign-off.
 *
 * This is the seam the artwork plugs into, the same way tapes.ts is the seam
 * the CMS plugs into: every ball is one object, and the physics never reads
 * this file. Footer/balls.ts measures the DOM the markup produces — offsetLeft,
 * offsetTop, offsetWidth — so a ball's size and place are whatever CSS says
 * they are, and changing a figure here moves both the layout and the simulation
 * with no second number to keep in step.
 *
 * GEOMETRY. `d` is the diameter and `x`/`y` are the CENTRE, all in vw, all
 * measured from the bed's top-left corner — not the section's. The bed is
 * --footer-bottom-h tall (47.165vw) and one viewport wide.
 *
 * THIS IS A STARTING POSITION, NOT A LAYOUT. Nothing holds a ball here: the
 * moment the physics starts they drift, and once anyone has touched them they
 * are wherever they ended up. So this arrangement is what the page is FIRST
 * seen in — and what it is seen in with no JS at all, since the transform the
 * simulation writes is an offset from here.
 *
 * These figures are read off the mock. Two are load-bearing: the masking roll's
 * bottom edge lands at 46.85vw, a third of a vw inside the bed's floor, and the
 * stationery roll's left edge sits at -1.15vw, hanging off the viewport exactly
 * as it does in the mock. The walls in balls.ts are placed to allow both.
 *
 * NO TWO OF THEM MAY OVERLAP TO BEGIN WITH. Overlapping circles are a
 * collision on the engine's first frame, so the pair springs apart with a
 * visible pop the instant the page is scrolled to — the composition breaks
 * itself while the reader is watching. The check is
 * (dx² + dy²) > ((dA + dB) / 2)², for every pair, and it is worth doing the
 * arithmetic after nudging anything: the instagram disc failed it by 0.3vw
 * here, which was invisible on screen and perfectly visible in the simulation.
 *
 * COLOUR is a placeholder. The rolls will become the artwork in
 * /assets/rolling and the discs will become logo marks; both are content
 * inside the ball, not the ball itself, so the swap touches the markup and
 * nothing else. The shades below are approximations of the mock's, near enough
 * to judge the composition against.
 */

export type FooterBall = {
  /** Stable key, and what the physics matches an element to in the DOM. */
  id: string;
  /** The placeholder's face, and the readable name where the ball is a link. */
  label: string;
  /** Rolls are decoration until they lead somewhere; discs are links now. */
  kind: "roll" | "social";
  href?: string;
  /** Diameter, vw. */
  d: number;
  /** Centre, vw from the bed's top-left. */
  x: number;
  y: number;
  /** Placeholder fill and the type on it. */
  colour: string;
  ink: string;
};

const INK_DARK = "#013900"; // the hero's dark green, on the light discs
const INK_LIGHT = "#f4f3ef"; // the menu's paper, on the dark ones

export const footerBalls: FooterBall[] = [
  {
    id: "stationery",
    label: "STATIONERY TAPE",
    kind: "roll",
    d: 21.5,
    x: 9.6,
    y: 18.7,
    colour: "#e0653f",
    ink: INK_LIGHT,
  },
  {
    id: "opp",
    label: "OPP TAPE",
    kind: "roll",
    d: 18.7,
    x: 22.6,
    y: 35.6,
    colour: "#a8dc28",
    ink: INK_DARK,
  },
  {
    id: "double",
    label: "DOUBLE-SIDED TISSUE TAPE",
    kind: "roll",
    d: 19,
    x: 65.5,
    y: 37.3,
    colour: "#5ac8f5",
    ink: INK_DARK,
  },
  {
    id: "masking",
    label: "MASKING TAPE",
    kind: "roll",
    d: 18.7,
    x: 89.9,
    y: 37.5,
    colour: "#fcb814",
    ink: INK_DARK,
  },

  /* The discs. Smaller, and they sit in the gaps the rolls leave rather than in
     a row of their own — which is what stops the bed reading as two separate
     arrangements sharing a box. */
  {
    id: "tiktok",
    label: "TIKTOK",
    kind: "social",
    href: "https://www.tiktok.com/",
    d: 12.7,
    x: 80.6,
    y: 22,
    colour: "#b6fe00",
    ink: INK_DARK,
  },
  {
    id: "facebook",
    label: "FACEBOOK",
    kind: "social",
    href: "https://www.facebook.com/",
    d: 12.7,
    x: 93.6,
    y: 20.2,
    colour: "#b6fe00",
    ink: INK_DARK,
  },
  {
    id: "instagram",
    label: "INSTAGRAM",
    kind: "social",
    href: "https://www.instagram.com/",
    d: 12.7,
    x: 38.7,
    y: 38.6,
    colour: "#b6fe00",
    ink: INK_DARK,
  },
];
