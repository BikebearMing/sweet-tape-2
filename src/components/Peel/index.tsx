/* eslint-disable @next/next/no-img-element */
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

/* Sweet Tape — a thing stuck to the page that lifts a corner now and then.
 *
 * Markup only, and server-rendered like everything else here: what makes it
 * move is Peel/peel.ts, which finds [data-peel] on mount and drives one custom
 * property. Without JS — or before the preloader clears — what paints is the
 * REST POSE, because --peel starts at 0 and the stylesheet draws 0. Left alone
 * that is the plain image at its plain size; give it a `from` and the rest pose
 * is a thing already lifted, which is the state a scrubbed peel starts in.
 *
 * HOW THE FOLD IS FAKED. There is no fold. There are two copies of the same
 * image stacked in the same box:
 *
 *   .peel-face   the image, clipped from the top down to the fold line
 *   .peel-flap   the image again, mirrored (scaleY(-1)) and parked one whole
 *                height above the box, clipped to the band ABOVE the fold, and
 *                slid down by twice the fold's depth
 *
 * Slide a mirrored copy down by 2x and the band it shows lands exactly where
 * the reflection of the peeled strip would be — so the strip appears to hinge
 * about the fold line. The flap's copy is flooded flat grey by the #peel-back
 * filter, which is what makes it read as the blank underside of the thing
 * rather than as the artwork printed twice. See PeelDefs below, and the "Peel"
 * section of global.css for the arithmetic.
 *
 * THE INNER TURN. --peel-dir rotates the whole assembly so the lift can come
 * off any edge — a photo peels from the top, a strip of tape from its end. The
 * clip axis rotates with it; .peel-turn rotates the artwork back so the picture
 * stays upright inside the rotated frame. At the default 0deg both are
 * identity.
 *
 * The wrapper takes over the layout box the bare <img> used to hold, so an
 * existing rule keyed on the image's id or class keeps working unchanged: pass
 * the same id, and the width/height/position it already sets now size the
 * assembly instead. It also carries any data-parallax, which is why the frame's
 * rotation is on `rotate` and not `transform` — parallax.ts owns transform.
 */

type PeelProps = {
  src: string;
  /** Decorative by default: these are props on a board, not content. */
  alt?: string;
  /**
   * What moves it. "loop" lifts and settles on its own; "scroll" scrubs the
   * fold off the page position, forwards and back. See Peel/peel.ts.
   *
   * "manual" is neither: peel.ts leaves it alone and something else writes
   * --peel on the wrapper. For a peel that is one beat of a longer piece of
   * choreography rather than a thing with a life of its own — the preloader's
   * mark unfolding (Preloader/reveal.ts) is the case it exists for.
   */
  drive?: "loop" | "scroll" | "manual";
  /**
   * The fold's travel: where it sits at `--peel: 0` and where it has got to at
   * 1. CSS `--peel-from` / `--peel-to`.
   *
   * A NUMBER is how far along the artwork the fold sits — 0 at the edge it
   * peels from, 1 right off the far end — and it stays true whatever `box` and
   * `direction` are, which a hand-computed length does not. A string is raw CSS
   * for the cases that want it.
   *
   * `from` is off the picture if unset, which is a thing lying flat. Put the
   * far value THERE instead and the same geometry runs backwards, so the thing
   * sticks DOWN rather than coming up.
   */
  from?: number | string;
  to?: number | string;
  /**
   * Which edge lifts. 0deg is the top, 90deg the right, -90deg the left — and
   * on a strip drawn at an angle, its own tilt PLUS 90deg is what folds it
   * end-first; the tilt alone folds it lengthwise into a stripe.
   */
  direction?: string;
  /**
   * The artwork's own box — `"19vw 9vw"`, whatever the stylesheet sizes it to.
   * Required with `direction`: it is what the turned clip frame is bled by, and
   * what a numeric `from` / `to` is a fraction of. Ignored at 0deg.
   */
  box?: string;
  /** loop only — seconds before the first lift, and between lifts. */
  delay?: number;
  every?: number;
  /**
   * scroll only — the window, in fractions of the viewport height: the peel
   * starts when the top is `in` down the screen and finishes when the centre
   * reaches `out`.
   */
  in?: number;
  out?: number;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "in">;

/* A fold position given as a fraction of the artwork becomes a lerp between the
   edge it peels from and the far end of it, both of which the stylesheet
   derives from `box` and `direction`. Strings pass through untouched — the
   escape hatch for a position that is genuinely a length. */
function along(v: number | string): string {
  if (typeof v !== "number") return v;
  return `calc(var(--peel-edge) + ${v} * var(--peel-span))`;
}

export default function Peel({
  src,
  alt = "",
  drive = "loop",
  from,
  to,
  direction,
  box,
  delay,
  every,
  in: scrubIn,
  out,
  className,
  style,
  ...rest
}: PeelProps) {
  const [w, h] = (box ?? "").split(/\s+/).filter(Boolean);

  const vars = {
    ...(w && h ? { "--peel-w": w, "--peel-h": h } : null),
    ...(from !== undefined ? { "--peel-from": along(from) } : null),
    ...(to !== undefined ? { "--peel-to": along(to) } : null),
    ...(direction ? { "--peel-dir": direction } : null),
    ...style,
  } as CSSProperties;

  return (
    <span
      className={className ? `peel ${className}` : "peel"}
      style={vars}
      data-peel={drive}
      data-peel-delay={delay}
      data-peel-every={every}
      data-peel-in={scrubIn}
      data-peel-out={out}
      {...rest}
    >
      <span className="peel-face">
        <span className="peel-turn">
          <img src={src} alt={alt} draggable={false} />
        </span>
      </span>

      {/* After the face in source, which is what puts it on top — the peeled
          strip lies OVER the picture it came off. Both are the same image, so
          the second is a cache hit, not a second download. */}
      <span className="peel-flap" aria-hidden="true">
        <span className="peel-turn">
          <img src={src} alt="" draggable={false} />
        </span>
      </span>
    </span>
  );
}

/* The undersides, one filter per colour. They are rendered once in the frontend
 * layout and shared. Per-instance <defs> would mean duplicate ids in the
 * document, and the first one wins — so every peel would be wearing the first
 * peel's filter anyway, just with a console full of duplicate-id warnings to go
 * with it.
 *
 * A COLOUR PER FILTER, and not one filter reading a custom property, because a
 * filter primitive resolves var() against ITSELF — against the <feFlood> inside
 * the shared <defs> — and not against whatever element referenced the filter.
 * One filter is therefore one colour for the whole document however it is
 * written; the only way to have two is to have two. Each entry below costs a
 * few bytes and nothing at runtime: an unreferenced filter never runs.
 *
 * What it does: take the image's alpha, throw the image itself away, and flood
 * the remaining silhouette with one flat colour. That keeps the cut-out shape
 * of a transparent PNG — the tape strip's torn ends stay torn — while making
 * the flap the blank back of the thing.
 *
 * It sits on the <img> and not on the animated .peel-flap deliberately: nothing
 * about the filter's input changes frame to frame, so the browser rasterises
 * the grey silhouette once and the loop only moves and re-clips the result. The
 * brightness() riding on --peel is the one part that does change, and it is a
 * colour-matrix on an already-cached layer — see global.css.
 *
 * Not display:none, and not width/height 0 alone: a filter referenced out of a
 * fully hidden SVG has a history of resolving to nothing in WebKit. It is taken
 * out of flow and out of the a11y tree instead.
 */
const BACKS: [string, string][] = [
  /* The board's props: paper, card, tape. The back of any of them is the
     unprinted side, and this is that paper. */
  ["peel-back", "#d7d2c7"],
  /* The preloader's mark, which is not paper — it is a sticker, and its back is
     a mid green. Taken off the gif it replaces rather than picked: through the
     unfold the folded-over part is dominantly #60a000, and the reason it has to
     be a measurement is that the sheet the mark unfolds against is the hero's
     lime, #b6fe00. Flood the back with the lime its own outline is drawn in —
     which is what it looks like it should be — and the flap is invisible for
     the whole of the move, lime on lime. */
  ["peel-back-mark", "#60a000"],
];

export function PeelDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {BACKS.map(([id, colour]) => (
          <filter key={id} id={id} x="0%" y="0%" width="100%" height="100%">
            <feFlood floodColor={colour} result="flood" />
            <feComposite operator="in" in="flood" in2="SourceAlpha" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
