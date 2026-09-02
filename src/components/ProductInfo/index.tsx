/* eslint-disable @next/next/no-img-element */
import { Fragment, type CSSProperties } from "react";

import HandNote from "@/components/HandNote";
import Peel from "@/components/Peel";
import { letters, words } from "@/components/letters";
import { storyStripOf, stripOf } from "@/components/TapeSlider/strips";
import { cssVars, heroOf, originVars, type Tape } from "@/data/tapes";
import Stage from "./Stage";

/* THE ORIGIN — the product page's second section.
 *
 * Two columns on the dark green the section above dips its lime arc into. On
 * the left the roll, standing on a photograph of itself at work, with a curved
 * arrow running back to it and a note in the margin saying what this tape is
 * like. On the right the story, in the page's largest body voice, with a strip
 * of tape stuck across the sentence — usually this tape, wherever the copy's
 * {{tape}} puts it.
 *
 * BUILT TO THE STENCIL in giant-section.html, and the figures there are the
 * design's: 8.772vw of block padding, a 5.379vw gutter, a 42.076vw left column,
 * the roll at 30.625 x 28.889vw offset 4.236 / 7.569vw. Every one of those is a
 * measurement off the mock at the 1440 design width, and they are in global.css
 * where the rest of the site's geometry is rather than in the stencil's inline
 * <style>.
 *
 * ONE CLASS WAS RENAMED AND IT HAD TO BE. The stencil's markup says `3d-tape`
 * and its stylesheet says `.threed-tape`, and only the second can exist: a CSS
 * identifier may not begin with a digit, so `.3d-tape` is a parse error that
 * takes the rest of the rule with it. `threed-tape` is used throughout, which
 * is the name the stencil's own CSS already expected.
 *
 * THE ROLL IS NOT THIS SECTION'S. It is the opening section's — the one standing
 * in the tape's name a screen above — and it rolls down into this column as the
 * page is scrolled, coming to rest in the slot below at the angle it left. This
 * section owns the SLOT and nothing else: the box the design reserves, and the
 * flat card inside it for the case where three.js never arrives. See
 * ProductIntro/roll.ts, which owns the roll and hides that card when it is
 * coming.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper; nothing below this line is a client component.
 */

/* Section-level copy. Not per tape — every tape's second section is headed the
   same way — so it is a named constant rather than a string in the markup, the
   same call the slider and the row at /products make. */
const KICKER = "ORIGIN";

/* HOW FAR UP THE STRIP STARTS, as a fraction of its own length — where the
 * fold sits before the tape is pressed down.
 *
 * `from` is the lifted end and `to` is flat, so the same geometry that runs a
 * peel runs backwards and there is no second code path for a strip that sticks
 * DOWN rather than lifting. The slider's showcase strips and the pinning
 * section's tapes are put on exactly this way.
 *
 * 0.34 is a corner rather than a flap. Past about half the strip folds back on
 * itself and reads as falling off rather than as being laid on.
 *
 * drive="manual", and neither of Peel's own drivers is this gesture: "loop"
 * alternates for ever, so the tape would either rest flat and periodically lift
 * off by itself or rest curled and occasionally press down; and "scroll" scrubs
 * both ways, so the tape would come back off on the way up. This goes on once
 * and stays on. The hand is ProductInfo/press.ts. */
const LIFT = 0.34;

/* HOW LONG EACH STRIP READS ON SCREEN, in vw off the 1440 design width.
 *
 * 163.11px is the design's measurement of the one in the sentence. The one
 * holding the photograph down is about 62% of the shot, which is the proportion
 * the slider's showcase strips use and which its own note argues for: a good
 * bite of the picture with a clear overhang either side, so it reads as holding
 * the thing on rather than as a label laid across it. */
const TAPE_VW = 11.327; // 163.11px
const SHOT_TAPE_VW = 9.76; // 140.5px against the shot's 226.7

/* THE BOX PEEL WANTS, from the length a design measures.
 *
 * These are not the same number and the gap between them is the whole reason
 * this function exists. Peel's `box` is the ARTWORK FILE's frame — it is what
 * the fold is clipped against and what a numeric `from`/`to` is a fraction of,
 * so the element must be laid out at exactly that size or the peel folds along
 * the wrong line. What a design measures is the visible STRIP, and these
 * exports carry transparent margin around it (see `ink` in strips.ts).
 *
 * So: divide by the ink to get from the strip to the file, and take the other
 * side from the file's own aspect so nothing is ever squashed. It is the same
 * arithmetic stripOf already does in px for the slider — INK / roll.ink — with
 * the length in vw instead, because this section is drawn in vw and a px strip
 * would hold one size while everything around it scaled.
 *
 * DO NOT SIZE THE ELEMENT IN CSS INSTEAD. That was tried: the element is turned
 * a quarter turn by --peel-dir and the flap bleeds outside its own box, so a
 * width written in the stylesheet is neither the width on screen nor the width
 * the fold is measured against, and the two disagreements do not cancel. The
 * stylesheet reads --peel-w / --peel-h back off this, exactly as the slider's
 * showcase strips do. */
function stripBox(s: ReturnType<typeof stripOf>, vw: number): string {
  const w = vw / s.ink;
  return `${w.toFixed(3)}vw ${((w * s.h) / s.w).toFixed(3)}vw`;
}

/** A design's px at the 1440 stencil, in vw — the one conversion this file
 *  makes, and the reason a width typed on a token scales with the page instead
 *  of holding 100px on a phone. Undefined falls back to the measured default. */
function vwOf(px: number | undefined): number {
  return px === undefined ? TAPE_VW : px / 14.4;
}

/** WHAT THE SLOT IS TOLD: an angle and a thickness, and neither is emitted when
 *  the token did not ask for it — an absent custom property lets the fallback in
 *  the stylesheet stand, exactly as an unset section colour does.
 *
 *  THE THICKNESS IS A SCALE AND NOT A HEIGHT, which is the one thing here that
 *  is not the obvious spelling. The strip's element IS the peel's box: the fold
 *  is clipped against it, so a height written onto it would move the crease
 *  rather than stretch the tape. Scaled on the slot instead, the peel is drawn
 *  at its own proportions and the finished picture is squashed or pulled after
 *  the fact — which is what a piece of tape pressed down harder looks like.
 *
 *  Measured against what the artwork WOULD draw at this length, so the number an
 *  editor types is the number of pixels they get: `art` is the visible aspect
 *  with the file's transparent margin taken off both sides, and without it the
 *  cloth strip — barely two thirds of its box — would come out a third short.
 *  See the field on Roll in components/TapeSlider/strips.ts. */
function tapeVars(
  s: ReturnType<typeof stripOf>,
  o: TapeOpts,
): CSSProperties | undefined {
  const vars: Record<string, string> = {};
  /* AND THE LENGTH IS TOLD TO THE SLOT AS WELL AS TO THE STRIP, which looks like
     saying it twice and is not. The strip's box is what the FOLD is measured
     against; the slot's width is what the LINE makes room for, so the words
     either side fall where a strip of this length puts them. Same figure, two
     jobs, and leaving the slot out would run a long strip over the copy beside
     it. */
  if (o.width !== undefined) vars["--info-tape-w"] = `${vwOf(o.width).toFixed(3)}vw`;
  if (o.rotate !== undefined) vars["--tape-turn"] = `${o.rotate}deg`;
  if (o.height !== undefined) {
    const natural = (vwOf(o.width) * 14.4) / s.art;
    vars["--tape-squash"] = (o.height / natural).toFixed(4);
  }
  return Object.keys(vars).length ? (vars as CSSProperties) : undefined;
}

/* WHERE THE STRIP GOES AND HOW IT IS LAID DOWN, BOTH WRITTEN IN THE COPY.
 *
 *     {{tape}}
 *     {{tape rotate=-8}}
 *     {{tape rotate=30 width=100 height=40}}
 *
 * The paragraph used to be stored as two strings and the strip went at the join,
 * which meant there was exactly one place it could ever be and one way for it to
 * look. This is a token in the sentence instead — it can sit between any two
 * words, at the end, or twice — and `origin` in src/data/tape-types.ts argues
 * why that is MORE explicit than a pair of halves rather than less.
 *
 * THE SETTINGS ARE ON THE TOKEN AND NOT IN A FIELD, and that is the same
 * argument one step further. A strip's angle is a fact about the sentence it is
 * stuck across: it is set to miss a descender, or to sit against the way a line
 * happens to break, and the moment there are two strips in a paragraph a field
 * cannot say which one it means. On the token, each strip carries its own.
 *
 * THREE OF THEM, ALL OPTIONAL, ALL PLAIN NUMBERS:
 *
 *   rotate — degrees, signed. Clockwise, like every other angle on this site.
 *   width  — how long the strip reads, in px at the 1440 design width. The unit
 *            the design gives; it is converted to vw so it scales with the page.
 *   height — how thick it reads, same units. Left out, it is whatever the
 *            artwork's own proportions make it.
 *
 * NOT A TEMPLATE LANGUAGE. There is no expression, no second token and no way to
 * name a file: WHICH tape is a fact about the product and lives in STORY_ROLL,
 * in code, with the rest of the artwork. An unknown key is ignored rather than
 * refused — a typo should cost a setting, not a paragraph.
 *
 * Double braces because nothing else on this site writes them and no copy ever
 * will by accident. */
const TAPE_TOKEN = /\{\{tape\b([^}]*)\}\}/g;

/** What one token asked for. Everything undefined means "leave it alone". */
type TapeOpts = { rotate?: number; width?: number; height?: number };

/* THE PARAGRAPH, CUT AT EVERY TOKEN — n+1 runs of words with n strips between
 * them, and any run may be empty.
 *
 * EMPTY IS THE INTERESTING CASE and there are three of them: the copy opens with
 * the token, ends with it, or carries two in a row. All three are legal, all
 * three come out as an empty string, and the markup renders nothing for one —
 * which is what stops a stray space opening up on the line.
 *
 * split() WITH A CAPTURING GROUP is what makes this one pass: the capture is
 * interleaved into the result, so the array runs text, options, text, options,
 * text. Even indices are copy and odd ones are whatever was written inside the
 * braces — which is exactly the shape the markup wants, a strip before every
 * piece but the first.
 *
 * Whitespace is collapsed, and the line breaks are why. The field is a textarea
 * and the old format's break was the marker, so the copy in the database has one
 * in it; the paragraph has never drawn a break there, it flows to its own
 * measure. Collapsing here means a break an editor leaves in — for their own
 * comfort, reading a long sentence in a small box — is whitespace and nothing
 * more. */
function storyRuns(copy: string): { text: string; opts: TapeOpts }[] {
  const cut = copy.split(TAPE_TOKEN);
  return cut.map((piece, i) => ({
    text: i % 2 === 0 ? piece.replace(/\s+/g, " ").trim() : "",
    /* The options belong to the strip BEFORE a run, so run i reads the capture
       at i-1. The first run has no strip before it and gets nothing. */
    opts: i % 2 === 0 ? tapeOpts(cut[i - 1]) : {},
  })).filter((_, i) => i % 2 === 0);
}

/** key=number pairs out of one token's braces, and nothing else is looked for.
 *
 *  A number and not an arbitrary value on purpose: all three settings are
 *  measurements, and the two that are lengths go straight into a calc(). Letting
 *  a unit through would mean deciding what "width=10vw" does to a peel whose box
 *  is measured in the artwork's own pixels, which is a question the design does
 *  not ask. */
function tapeOpts(raw: string | undefined): TapeOpts {
  const out: TapeOpts = {};
  for (const [, k, v] of (raw ?? "").matchAll(/([a-z]+)\s*=\s*(-?[\d.]+)/gi)) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (k === "rotate") out.rotate = n;
    else if (k === "width" && n > 0) out.width = n;
    else if (k === "height" && n > 0) out.height = n;
  }
  return out;
}

/* THE STORY'S LAST WORD, SPLIT OFF THE REST OF IT — everything up to the final
 * run of whitespace, and everything after it.
 *
 * The hand-drawn rule at the foot of the paragraph is drawn ACROSS this word, so
 * it needs to be a box of its own rather than one of the boxes words() makes.
 * See the markup, which is where the whole of that argument is.
 *
 * Whitespace only, and deliberately not the comma-and-hyphen chunking words()
 * does on top of it: a rule that stopped at a hyphen inside the closing word
 * would underline half of it. Trailing whitespace is trimmed first so a copy
 * string that ends with a space does not hand back an empty tail and rule under
 * nothing.
 *
 * A one-word paragraph gives an empty head, which the markup checks for — the
 * space it would otherwise print between the two halves would open the line.
 */
function splitLastWord(text: string): [string, string] {
  const t = text.trimEnd();
  const i = t.search(/\s\S*$/);
  return i < 0 ? ["", t] : [t.slice(0, i), t.slice(i + 1)];
}

export default function ProductInfo({ tape }: { tape: Tape }) {
  const strip = stripOf(tape.id);
  /* AND THE ONE IN THE SENTENCE, WHICH IS NOT ALWAYS THE SAME ROLL. The
     photograph is held down by this tape; the story sometimes needs another
     one. See STORY_ROLL in components/TapeSlider/strips.ts, which is where that
     is decided and where the default — the tape's own — comes from. */
  const story = storyStripOf(tape.id);

  const runs = storyRuns(tape.origin);
  /* WHICH RUN OF WORDS THE PARAGRAPH ACTUALLY ENDS ON, which is not simply the
     last one: a copy that closes on the token ends with an empty run, and the
     rule has to be drawn under the word before it. Empty runs are skipped. */
  const lastRun = runs.reduce((at, r, i) => (r.text ? i : at), -1);
  const [runHead, runTail] =
    lastRun < 0 ? ["", ""] : splitLastWord(runs[lastRun].text);

  return (
    <Stage
      style={
        {
          ...cssVars(tape.colours),
          ...originVars(tape.sections),
        } as CSSProperties
      }
    >
      <div className="wrapper">
        <div className="left">
          {/* THE PHOTOGRAPH — this tape at work, and it is the slider's own
              first showcase shot rather than a second file: it is already the
              right picture, it is already in the browser's cache on any visit
              that came through the home page, and a tape's artwork living
              together is the rule src/data/tapes.ts sets out at the top.

              alt is empty and there is no caption. The picture illustrates the
              paragraph beside it and says nothing the paragraph does not; a
              reader who cannot see it has lost nothing and should not be read a
              description of a hand holding a box. */}
          {/* THE TAPE IS WHAT HOLDS IT DOWN, not a border on the picture — a
              photograph whose corner is stuck to the page is stuck to it with
              something, and this section has a roll of exactly that something
              standing next to it. The wrapper takes the layout box the bare
              <img> used to hold, so the placement, the lean and the shadow are
              unchanged; the strip is inside it and therefore takes the
              photograph's own tilt, which is the tilt it should have — it was
              laid on the picture, not on the page.

              Same `reverse` peel as the one in the sentence: the strip's rest
              pose is a corner already lifted. Its own note is at LIFT. */}
          <span className="info-shot">
            <img src={tape.showcase} alt="" draggable={false} />
            <Peel
              className="reverse-peel-tape info-shot-tape"
              src={strip.src}
              back={strip.back}
              drive="manual"
              direction="90deg"
              box={stripBox(strip, SHOT_TAPE_VW)}
              from={LIFT}
              to={0}
              aria-hidden="true"
              style={{ "--strip-blend": strip.blend } as CSSProperties}
            />
          </span>

          {/* THE ROLL'S RESTING PLACE. An empty box at the design's offsets —
              what the opening section's roll travels to and stops in. Nothing
              here mounts it or moves it; this is the address, and
              ProductIntro/roll.ts is what reads it.

              The <img> is the case where three.js never lands. It is hidden
              from first paint by that same file, on the same argument the
              slider makes about its own card — once scripts are running the
              roll is coming, and letting the flat artwork paint first only
              flashes a picture the 3D roll is about to arrive on top of. If the
              chunk fails it is put back, in both sections at once, and the page
              is the one it would have been without any of this. */}
          <div className="threed-tape">
            <img src={heroOf(tape)} alt={tape.label} draggable={false} />
          </div>

          {/* The arrow, drawn rather than shipped — see the note on the path.
              Decoration, and out of the accessibility tree: it points at
              something already on the page. */}
          <span className="info-arrow" aria-hidden="true">
            <svg viewBox="0 0 134 54" fill="none" focusable="false">
              {/* Drawn off the reference, and the shape is the whole of it.
                  Three separate paths rather than one polyline with a marker,
                  so the head keeps its own weight when the curve is scaled — a
                  marker scales with the stroke and these do not.

                  THE BOW GOES UP, which is the thing an arc like this gets
                  wrong most easily. Read right to left the stroke leaves almost
                  flat and steepens as it goes, so its middle sits ABOVE the
                  straight line between its ends — the top-left quadrant of a
                  circle. Bowed the other way it becomes a swoosh that dives and
                  levels out, which points at the floor rather than at the roll.

                  The control points are asymmetric on purpose: the curvature
                  runs out toward the tip, which reads as a hand that started
                  confidently and slowed as it arrived. */}
              <path
                d="M128 3C100 4 50 22 5 47"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* The head, both barbs swept BACK along the stroke rather than
                  set square to it — struck off the curve's own tangent where it
                  lands, which is what stops the head reading as a separate
                  chevron dropped on the end. The lower one comes out near
                  horizontal and the upper one steeply up, exactly as an arrow
                  arriving on this heading does. */}
              <path
                d="M5 47L27 46.6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M5 47L17 28.7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>

          {/* The note in the margin, in this tape's own hand — the same
              component the hero and the pinning section write, which takes its
              lines as an argument and its size and pen from CSS. See
              components/HandNote, which says why placement is not its business.

              NOT decorative: this is the only place these words appear, unlike
              the home page's second copy of the board's sentence. */}
          <HandNote className="info-note" lines={tape.character} />
        </div>

        <div className="right">
          {/* WITHOUT JAVASCRIPT NEITHER THE STORY NOR THE CHIP ARRIVES. The
              letters are parked under their masks by global.css and the chip is
              held at nothing by the same attribute, both released by the
              section's own script — so a page where reveal.ts never runs is a
              column of empty green. The stylesheet's hold is lifted here
              instead, which costs nothing when scripting is on: the contents are
              not even parsed. Every other section on this site carries the same
              escape. */}
          <noscript>
            <style>{`.product-inner-info .char { transform: none }
              .product-inner-info .subhead { opacity: 1; visibility: visible }`}</style>
          </noscript>

          <h5 className="subhead">{KICKER}</h5>

          {/* THE STORY. One paragraph with a strip of tape stuck across it,
              cut into runs of words at every {{tape}} in the copy — see
              storyPieces above, and `origin` in src/data/tape-types.ts, which
              argues why the position is written in the sentence rather than
              built into the shape of the field.

              SPLIT TO LETTERS FOR THE REVEAL (reveal.ts), which is the site's
              — each waits below its own mask and slides up in a shuffled order.
              aria-label carries the readable version rather than a second hidden
              copy of the words: the sentence is announced whole, so the row of
              letter boxes is never read out a fragment at a time, and every run
              is read as the one sentence they are. The token is not in it — it
              is a place, not a word. */}
          <h3
            className="h3 info-story"
            aria-label={runs
              .map((r) => r.text)
              .filter(Boolean)
              .join(" ")}
          >
            {runs.map(({ text: piece, opts }, i) => (
              <Fragment key={i}>
                {/* A SLOT BEFORE EVERY PIECE BUT THE FIRST, which is the whole
                    of the interleave: n tokens cut the copy into n+1 runs, so
                    the strip belongs at each seam and nowhere else.

                    A SLOT AROUND IT, and it is not decoration. The strip's own
                    box is the FILE's, which for these exports is mostly
                    transparent margin — the clear tape's artwork sits in a box
                    getting on for three times its own height. Inline, that box
                    is what the line is sized to, so a 163px strip pushed the
                    first two lines of the paragraph 60px apart to make room for
                    padding nobody can see. The slot is what the LINE sees; the
                    strip inside it is placed against it and overflows it
                    freely.

                    The strip is inside the paragraph and inline, so it sits ON
                    the line and travels with the copy when it rewraps. It is
                    aria-hidden's job to keep it out of the sentence; Peel
                    renders a span of images and has nothing to announce. */}
                {i > 0 ? (
                  <>
                    {/* THE TOKEN'S OWN SETTINGS RIDE ON THE SLOT, not on the
                        strip, and that is not tidiness — .peel spends `rotate`
                        on --peel-dir, which is how the fold is aimed across the
                        strip rather than along it. A second angle written there
                        would be fighting the mechanism that makes this a peel.
                        The slot is a plain box the section owns, it is already
                        centred on the strip, and a transform on it turns the
                        finished picture without the peel knowing anything
                        happened. See .info-tape-slot in global.css, which is
                        where the two custom properties are read.

                        The LENGTH is different and does go to the strip: it is
                        the box the fold is measured against, so it has to be
                        the real thing rather than a scale laid over it. */}
                    <span
                      className="info-tape-slot"
                      aria-hidden="true"
                      style={tapeVars(story, opts)}
                    >
                      <Peel
                        className="reverse-peel-tape info-story-tape"
                        src={story.src}
                        back={story.back}
                        drive="manual"
                        direction="90deg"
                        box={stripBox(story, vwOf(opts.width))}
                        from={LIFT}
                        to={0}
                        aria-hidden="true"
                        style={
                          { "--strip-blend": story.blend } as CSSProperties
                        }
                      />
                    </span>{" "}
                  </>
                ) : null}

                {/* SPLIT TO LETTERS BY WORD and not by the whole run: words()
                    keeps each word an inline box, so the paragraph breaks
                    BETWEEN words exactly where the unsplit copy would have
                    broken. letters() lays a row that cannot break, which is
                    right for a headline whose breaks are set by design and
                    wrong for a measure this deep.

                    An empty piece draws nothing at all — see storyPieces. */}
                {i === lastRun ? (
                  <>
                    {runHead ? (
                      <>
                        <span aria-hidden="true">{words(runHead)}</span>{" "}
                      </>
                    ) : null}
                    {/* THE LAST WORD, AND THE RULE UNDER IT — one box, which is
                        the whole of why the word is split off the run above.

                        The rule used to be a zero-width marker dropped after
                        the paragraph with a width of 5.4em: right-anchored so
                        it ended under the full stop, and five and a bit ems
                        long because that is what NEVER AGAIN. measures at this
                        size. That figure was the OPP tape's copy written into
                        the stylesheet. Every other tape ends on a different
                        word, so the rule ran back past the start of the line
                        and out under the one above it — most visibly on the
                        low-noise tape, whose last line is one short word.

                        So the rule is sized by the thing it rules under
                        instead of by a measurement of one tape's sentence: this
                        box is the last word, the rule is absolutely positioned
                        across it, and it is right for whatever any of the six
                        ends on.

                        IT IS THE LAST WORD AND NOT THE LAST PHRASE, which is
                        the one place this reads shorter than the mock — that
                        rules under NEVER AGAIN., two words. Two words can be
                        split by a line break and this box cannot, and a rule
                        drawn across a group that has wrapped is a stroke
                        running from the end of one line to the middle of the
                        next. A single word is the largest run that is safe at
                        every measure.

                        AND IT IS THE LAST RUN'S last word, not the last piece's
                        — a paragraph that closes on the token has an empty
                        piece after it and the rule belongs under the word
                        before the strip.

                        inline-flex like words()' own boxes, for the same
                        reason: the letters are flex items and this is the row
                        they stand in. */}
                    <span className="word info-last" aria-hidden="true">
                      {letters(runTail)}

                      {/* Drawn in two passes the way a hand underlines
                          something — one stroke out and a shorter one back over
                          it, neither quite straight and neither quite meeting
                          the other's ends. A border-bottom would be a printed
                          rule, and this section is written on rather than
                          set. */}
                      <span className="info-underline">
                        <svg
                          viewBox="0 0 320 22"
                          fill="none"
                          focusable="false"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M4 9C74 3 168 5 314 8"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M22 17C96 12 190 14 292 15"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </span>
                  </>
                ) : piece ? (
                  <>
                    <span aria-hidden="true">{words(piece)}</span>{" "}
                  </>
                ) : null}
              </Fragment>
            ))}
          </h3>
        </div>
      </div>
    </Stage>
  );
}
