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
 * WHAT IS PRINTED ON ONE is the only thing that separates the two kinds, and
 * neither is a fill any more. A roll carries its own artwork from
 * /assets/rolling — a circle of printed tape, so the picture IS the ball and
 * there is nothing behind it to colour. A disc is a badge: a lime circle with
 * a social mark cut into it in the hero's dark green, which is why it is the
 * only kind still carrying a colour pair. Both are content INSIDE the ball
 * rather than the ball itself, so the physics sees no difference at all.
 */

/** Which mark a disc wears. Resolved to a component in Footer/index.tsx —
    this file stays free of JSX so it can be read as data. */
export type SocialIcon = "tiktok" | "facebook" | "instagram";

export type FooterBall = {
  /** Stable key, and what the physics matches an element to in the DOM. */
  id: string;
  /** The readable name: a disc's link label, a roll's alt text. */
  label: string;
  /** Diameter, vw. */
  d: number;
  /** Centre, vw from the bed's top-left. */
  x: number;
  y: number;
} & (
  | {
      /** Decoration until it leads somewhere. Its artwork is the whole ball. */
      kind: "roll";
      art: string;
    }
  | {
      kind: "social";
      href: string;
      icon: SocialIcon;
      /** The badge's field and the mark cut into it. */
      colour: string;
      ink: string;
    }
);

const DISC = "#b6fe00"; // the footer's own lime, which is its ink everywhere else
const INK_DARK = "#013900"; // the hero's dark green, cut into the lime

export const footerBalls: FooterBall[] = [
  {
    id: "stationery",
    label: "STATIONERY TAPE",
    kind: "roll",
    art: "/assets/footer-stationery.svg",
    d: 21.5,
    x: 9.6,
    y: 18.7,
  },
  /* The fourth product is cloth tape — the same four rolls the slider carries,
     so the artwork is tapes.ts's `roll` and there is one set of pictures on the
     site rather than two. */
  {
    id: "cloth",
    label: "CLOTH TAPE",
    kind: "roll",
    art: "/assets/footer-cloth.svg",
    d: 18.7,
    x: 22.6,
    y: 35.6,
  },
  {
    id: "double",
    label: "DOUBLE-SIDED TISSUE TAPE",
    kind: "roll",
    art: "/assets/footer-double.svg",
    d: 19,
    x: 65.5,
    y: 37.3,
  },
  {
    id: "masking",
    label: "MASKING TAPE",
    kind: "roll",
    art: "/assets/footer-mask.svg",
    d: 18.7,
    x: 89.9,
    y: 37.5,
  },

  /* The discs. Smaller, and they sit in the gaps the rolls leave rather than in
     a row of their own — which is what stops the bed reading as two separate
     arrangements sharing a box. */
  {
    id: "tiktok",
    label: "TikTok",
    kind: "social",
    href: "https://www.tiktok.com/",
    icon: "tiktok",
    d: 12.7,
    x: 80.6,
    y: 22,
    colour: DISC,
    ink: INK_DARK,
  },
  {
    id: "facebook",
    label: "Facebook",
    kind: "social",
    href: "https://www.facebook.com/",
    icon: "facebook",
    d: 12.7,
    x: 93.6,
    y: 20.2,
    colour: DISC,
    ink: INK_DARK,
  },
  {
    id: "instagram",
    label: "Instagram",
    kind: "social",
    href: "https://www.instagram.com/",
    icon: "instagram",
    d: 12.7,
    x: 38.7,
    y: 38.6,
    colour: DISC,
    ink: INK_DARK,
  },
];
