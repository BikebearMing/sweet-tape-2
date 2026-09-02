import type { TapeColours } from "./tape-types";

/* The home page's shape, and the half of it that is safe anywhere.
 *
 * Split for the reason tape-types.ts and contact-types.ts are: its sibling,
 * ./homepage.ts, imports the Payload config and drags the Postgres adapter with
 * it. Anything that does not need the database lives here.
 *
 * THE COLOURS ARE THE SAME SHAPE AS A TAPE'S and share its type rather than
 * declaring a second one. That is deliberate and it is not the duplication this
 * split was meant to avoid: the six roles a palette has — the ring, the flood,
 * the word, the two chip colours and the ink — are a fact about how this SITE
 * paints a tape, and they are the same six wherever a tape is painted. What is
 * duplicated between a slide and a product is the VALUES, which is the trade
 * the slider was separated to make. The vocabulary is not.
 */

export type { TapeColours } from "./tape-types";
export { cssVars } from "./tape-types";

/** One roll on the orbit, and everything the stage shows when it is picked. */
export type Slide = {
  /** Stable id. Identifies the slide to the engine and picks its strip. */
  id: string;
  /** Screen-reader name for the roll button. */
  label: string;
  /** The roll on the orbit. */
  thumb: string;
  /** Hang tag at the centre of the stage. */
  card: string;
  /** Exactly two, placed by hand. */
  showcase: [string, string];
  /** Path to the 3D roll. Preloaded — a wrong one breaks the home page. */
  model: string;
  /** Which word the bottom title spells; a key of `words` in wordmarks.json. */
  word: string;
  tags: string[];
  copy: string;
  colours: TapeColours;
};

/** One of the three phrases the pinning section holds the screen for. */
export type Phrase = { lead: string; word: string };

/** The home page, as its sections want it. */
export type Homepage = {
  hero: {
    kicker: string[];
    headline: string[];
    cornerMark: string[];
    /** One paragraph — this line is the one on the page that really does wrap. */
    cardboard: string;
  };
  band: { head: string; tail: string };
  slider: {
    subhead: string;
    rolls: Slide[];
  };
  reasons: {
    subhead: string;
    heading: string[];
    /** Three, in the order they are held. The photographs around each one are
        drawn in code against its place in this list. */
    phrases: Phrase[];
  };
  stick: { heading: string[]; sub: string };
};
