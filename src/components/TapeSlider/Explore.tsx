import Link from "next/link";

import Arrow from "@/components/Arrow";

/* EXPLORE — the sticker on the corner of THE, and the way off this stage.
 *
 * IT GOES TO THE TAPE ON SCREEN (final-round feedback, 2026-09-29 — it used to
 * go to the products index). The roll's key doubles as the product's slug by
 * the CMS's own instruction (see the `key` field in src/globals/Homepage.ts),
 * so the slug here is the first roll's and the engine rewrites the href on
 * every swap (goTo in engine.ts). A key with no product behind it is an editor
 * error the 404 page absorbs.
 *
 * A LINK AND NOT A BUTTON, against the mockup's markup: it navigates. A button
 * would need JS to do what an anchor does for free, and would lose the middle
 * click, the context menu and the status bar with it.
 *
 * Placed OUTSIDE .top-title, though it is drawn against the E's corner. The
 * word mark is z-index 3 — the hero's tape tail is meant to pass behind the
 * letters and the roll is meant to pass in front of them — and a z-index on an
 * absolute box makes a stacking context its children cannot climb out of. The
 * sticker has to be over the roll, so it is the roll's sibling and carries its
 * own index. Its placement in global.css is written off the same three numbers
 * .top-title is placed with, so it follows the word rather than tracking it.
 *
 * The clip box is .explore-clip and not the mockup's .wrapper: this stage
 * already has a .wrapper — two of them — and .tape-slider-parent .wrapper is
 * width:100%;height:100%, which a bare copy of the name would inherit.
 */
export default function Explore({ id }: { id: string }) {
  return (
    <Link href={`/products/${id}`} className="explore-button">
      <span className="explore-clip">
        <span className="button-text">EXPLORE</span>
      </span>
      {/* The site's link mark, on the sticker's own disc — the same split
          StoryCard makes: the glyph is shared, the badge under it and the turn
          on hover belong to the thing being marked.

          OUTSIDE the clip, which is why the clip wraps the word alone: the
          badge hangs over the bottom of the letters, and a box tight enough to
          hide the word before it rises would cut the disc in half. */}
      <span className="arrow">
        <Arrow />
      </span>
    </Link>
  );
}
