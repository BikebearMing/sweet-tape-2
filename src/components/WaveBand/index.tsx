import Band from "./Band";
import { UNIT, REPEATS } from "./marquee";

/* The wavy hand-off between the hero and the slider.
 *
 * One SVG, one curve, and nothing but tape: the lime band is the wave path
 * stroked thick, the marquee rides the same path, and the grain strokes it
 * once more — which is what guarantees text, band and print share a
 * centreline, with no second shape to drift out of register. There is no
 * background and no under-fill here. Above the tape the hero shows through;
 * below it the slider's stage rises to the hero's exact bottom edge, so the
 * stage's colour — and its selection wipes — are the real thing seen under
 * the wave, not a copy. The straight seam where green meets stage hides
 * inside the tape's stroke; wave-band.css owns that geometry (tilt, stroke,
 * and the slider's matching content shift move together).
 *
 * The geometry's own numbers: the wave's centreline sits at y=330, swinging
 * ±65 (control points ±130 — a quadratic reaches halfway to its control
 * point), one full cycle (valley at x=400, peak at x=1200) per 1600, so
 * exactly one wave fills the screen at any width. The path runs from x=-3200
 * to x=8000, far past the viewBox on both sides, so the marquee never runs
 * out of curve and glyphs enter the frame already bent.
 *
 * Text metrics live in wave-band.css (the band is styled, not attributed);
 * the copy itself is marquee.ts's UNIT, shared so the marquee measures
 * exactly the string that renders. dy sits the text on the path's centreline
 * — textPath aligns the BASELINE to the path, which alone would ride high.
 */
const WAVE = [
  "M -3200,330",
  "Q -2800,460 -2400,330",
  "Q -2000,200 -1600,330",
  "Q -1200,460 -800,330",
  "Q -400,200 0,330",
  "Q 400,460 800,330",
  "Q 1200,200 1600,330",
  "Q 2000,460 2400,330",
  "Q 2800,200 3200,330",
  "Q 3600,460 4000,330",
  "Q 4400,200 4800,330",
  "Q 5200,460 5600,330",
  "Q 6000,200 6400,330",
  "Q 6800,460 7200,330",
  "Q 7600,200 8000,330",
].join(" ");

export default function WaveBand() {
  return (
    <Band>
      {/* The viewBox is sized to the ROTATED tape and nothing else: y 60..600
          just contains the stroke at full tilt (the 7deg lean carries the
          peaks up and the valleys down by ~112 units at the frame's edges),
          and the 80 units of x-bleed per side (the CSS pulls the box wider
          by the same amount) keep the box's tilted side edges outside the
          viewport, where their corners would otherwise cut across as bare
          slivers. The scale is untouched — 1760 units over 110% width is
          the same 16 units/vw — so path-x 0 still lands exactly on the
          section's left edge, which the marquee's anchor measurement relies
          on. */}
      <svg
        viewBox="-80 60 1760 540"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path id="wave-band-path" d={WAVE} fill="none" />
          {/* The paper grain, width-fitted like the hero's tiling (the image
              is 5824x3264; 1600 wide keeps its aspect). In here rather than
              a CSS overlay because both neighbours show through the section
              — an inset-0 sheet would grain their artwork twice. */}
          <pattern
            id="wave-band-grain"
            patternUnits="userSpaceOnUse"
            x="0"
            y="60"
            width="1600"
            height="897"
          >
            <image href="/assets/paper-overlay.png" width="1600" height="897" />
          </pattern>
        </defs>
        <use href="#wave-band-path" className="band-tape" />
        {/* startOffset here is only the pre-hydration frame: the arc length
            of the path's off-screen lead-in, so the sentence's first word
            sits at the left edge before the marquee takes over. The marquee
            re-measures the true value on its own path — this constant is
            cosmetic and approximate on purpose. */}
        <text className="band-text" dy="0.35em">
          <textPath href="#wave-band-path" startOffset="3295">
            {UNIT.repeat(REPEATS)}
          </textPath>
        </text>
        {/* Grain last, over tape and type alike — the print sits on top of
            everything it prints. */}
        <use href="#wave-band-path" className="band-tape-grain" />
      </svg>
    </Band>
  );
}
