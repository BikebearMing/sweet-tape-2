"use client";

/* LAB — the Lottie hand set as words, against the Vara hand.
 *
 * Not a route anyone links to. The first version of this page proved one letter
 * renders; the second typed a pattern out of forty copies of that same letter to
 * prove a bag of per-letter Lotties can be SET — spaced, tracked, wrapped and
 * written in sequence. This one has the actual alphabet in it
 * (public/assets/Outcome, a-z 0-9 and four marks) and so it can finally ask the
 * question the other two could only pose: does THIS export set?
 *
 * THE ANSWER IS NOT YET, AND THE REASON IS ONE LINE: every glyph is centred in
 * its own 500x500 comp. All forty of them, to within three units. That is what
 * the fit control below is for, and it is worth being precise about why it is
 * fatal, because the export looks right until you set two letters side by side.
 *
 *   THE COMP BOX IS SHARED, WHICH IS THE HALF THAT IS RIGHT. Every file is
 *   500x500 and every glyph is drawn at the same pen size inside it, so one comp
 *   unit means the same thing in every file and the letters are in correct
 *   proportion to one another. An 'l' really is taller than an 'o'. That is the
 *   expensive half and it is done.
 *
 *   THE GLYPHS ARE NOT IN THEIR TRUE POSITIONS INSIDE IT, which is the half that
 *   is missing, and centring destroys the only thing the box was carrying. Once
 *   a glyph is centred, its ink top and ink bottom are both determined by its
 *   ink HEIGHT and nothing else — so there is no measurement anywhere in these
 *   files that says where the writing line is. It is not hidden or awkward to
 *   get at. It is not in the file.
 *
 * WHAT THAT COSTS, on the board, in the "comp" fit: an 'o' and a 'g' are centred
 * on each other rather than sharing a writing line, so the 'g' sits a third of
 * its descender too high and the 'o' rides up to meet it. A full stop — 47 units
 * of ink in a 500 unit box — floats at mid x-height in the middle of nothing.
 * And every glyph gets the same 500-unit advance, so 'i' is given as much room
 * as 'm' and the words come out as a ransom note.
 *
 * THE FIX IS A RE-EXPORT, and it is a small one: keep the 500x500 comp exactly
 * as it is, and put each glyph where it actually sits on the line instead of in
 * the middle of the box. Nothing else about these files has to change — not the
 * size, not the stroke reveal, not the PNGs. Then "comp" fit is correct on its
 * own and the two other modes below can go.
 *
 * UNTIL THEN, "metrics" FIT IS THE PROOF THAT THE ARTWORK IS FINE. It supplies
 * by hand the two numbers the export dropped — a proportional advance measured
 * off each glyph's own ink, and a baseline per glyph from the table below — and
 * sets the alphabet properly with them. If that reads and the re-export lands
 * the same numbers, the artwork was never the problem. See BASELINE.
 *
 * The three fits are kept side by side rather than the good one alone so the
 * difference is arguable rather than asserted.
 *
 * Two rendering notes that outlive this page: the reveal is an ADBE Stroke
 * effect (Paint Style 3, reveal original image) driven off the layer's mask,
 * which lottie-web implements in the SVG RENDERER ONLY — on canvas the letter
 * appears whole with no writing. And nothing here calls anim.play(): the site's
 * note is one GSAP timeline shared with the ruled margin at a per-instance pace,
 * so the only honest test is a tween pushing frames in with goToAndStop.
 */

import gsap from "gsap";
import type { AnimationItem } from "lottie-web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import HandNote from "@/components/HandNote";
import { initHandNote } from "@/components/HandNote/hand";

const DIR = "/assets/Outcome";

/* WHAT IS IN THE FOLDER. Written out rather than read at runtime because the
   browser cannot list a directory, and a missing file should be a reported gap
   rather than a 404 in the console. */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789!,._";

/* THE ONE FILENAME THAT IS NOT ITS OWN CHARACTER.
 *
 * The full stop was exported as ". .json" — a dot, then a space — and that file
 * CANNOT BE SERVED. Next refuses any URL whose path segment begins with a dot,
 * dotfiles being config rather than content, so /assets/Outcome/.%20.json is a
 * 400 however the space is encoded. It is the one file in the folder that had to
 * be renamed rather than mapped around, and it is now period.json.
 *
 * A re-export should avoid naming any file after a character that is awkward in
 * a URL. The comma and the exclamation mark happen to survive; the full stop did
 * not, and a slash or a question mark would not either. */
const FILENAME: Record<string, string> = { ".": "period" };

const srcFor = (ch: string) =>
  `${DIR}/${encodeURIComponent(FILENAME[ch] ?? ch)}.json`;

/* WHERE THE WRITING LINE SITS IN EACH GLYPH, as a fraction of that glyph's own
 * ink height: 0 is the top of the ink, 1 is the bottom of it.
 *
 * THIS TABLE IS THE THING THE EXPORT SHOULD HAVE CARRIED and the reason it has
 * to exist is at the top of this file. It is not measured and it cannot be —
 * every glyph is centred, so the files say nothing about the line. It is
 * DERIVED, once, from the one thing the ink heights do tell us.
 *
 * The letters with no ascender and no descender are all the same height to
 * within a few units — a 290, e 287, o 303, n 258, m 246, s 307, x 302 — so the
 * x-height of this hand is about 287 comp units. A descending letter's ink is
 * that plus however far it hangs, which gives the drop by subtraction and the
 * fraction by division:
 *
 *     g  464 ink - 287 x-height = 177 below the line -> 1 - 177/464 = 0.62
 *     p  428 - 287 = 141                             -> 1 - 141/428 = 0.67
 *     q  431 - 287 = 144                             -> 0.67
 *     y  401 - 287 = 114                             -> 0.72
 *
 * f and j both ascend AND descend, so subtraction cannot separate the two ends
 * and these two are the only figures on the page that are a guess. The comma is
 * a guess of a different kind: almost all of it hangs below the line.
 *
 * Everything absent from this table sits ON the line, which is every other
 * letter, every digit, the full stop and the exclamation mark. The underscore is
 * left at 1 deliberately and is worth a look — 395 units of ink is far too tall
 * for an underscore, so that file is probably not what its name says. */
const BASELINE: Record<string, number> = {
  g: 0.62,
  p: 0.67,
  q: 0.67,
  y: 0.72,
  f: 0.69, // guessed — ascends and descends
  j: 0.69, // guessed — ascends and descends
  ",": 0.2,
};
const baselineOf = (ch: string) => BASELINE[ch] ?? 1;

/* THE ROW'S OWN BOX, in comp units, and where the writing line sits in it.
 *
 * The comp's height is the natural unit — every glyph is drawn against it — so a
 * row is one comp tall and the line is put low enough in it that the deepest
 * descender still has room. Both only matter in the "metrics" fit. */
const ROW = 500;
const ROW_BASE = 0.74;

/* The note's own copy, so the board is set with the words this hand actually has
   to write. The apostrophe and the hyphen the live note uses are deliberately
   NOT here — see MISSING in the render, which reports anything the folder cannot
   spell. */
const PATTERN = "we built for\neveryday moments.\nnot industrial just\nreal life.";

/* The four pens the note is written in on the live site, plus the file's own. */
const INKS = [
  { name: "as authored", value: "" },
  { name: "hero lime", value: "#b6fe00" },
  { name: "giant", value: "#013900" },
  { name: "paper", value: "#f2ede4" },
  { name: "black", value: "#111111" },
];

const BOARDS = [
  { name: "hero green", value: "#0d470c" },
  { name: "paper", value: "#f2ede4" },
  { name: "white", value: "#ffffff" },
];

const FITS = [
  { id: "comp", name: "comp box (as exported)" },
  { id: "ink", name: "crop to ink" },
  { id: "metrics", name: "metrics (advance + baseline)" },
] as const;
type Fit = (typeof FITS)[number]["id"];

type Box = { x: number; y: number; w: number; h: number };
type Glyph = {
  data: Record<string, unknown>;
  frames: number;
  end: number;
  comp: { w: number; h: number };
};

/* WHERE THE WRITING ACTUALLY STOPS, dug out of the file rather than typed here.
 *
 * The comp is 30 frames but the ADBE Stroke's End runs 0 to 100 over the first
 * 15 and then holds, so the back half is a still letter. Scrubbing a 0..1
 * progress across all 30 would spend half of every glyph's slot writing
 * nothing — which, staggered across a sentence, is the difference between a hand
 * and a slideshow. Read off the effect's last keyframe so a re-export with
 * different timing is picked up rather than silently mis-scrubbed — and these
 * files need it: most finish on 15, but the marks finish on 10 and 'x' on 11. */
function findRevealEnd(data: Record<string, unknown>): number {
  type Kf = { t?: number };
  type Prop = { mn?: string; v?: { a?: number; k?: Kf[] } };
  type Layer = { ef?: { ef?: Prop[] }[] };
  let last = 0;
  for (const layer of (data.layers as Layer[]) ?? []) {
    for (const effect of layer.ef ?? []) {
      for (const prop of effect.ef ?? []) {
        // ADBE Stroke-0009 is the effect's End slider.
        if (prop.mn !== "ADBE Stroke-0009" || prop.v?.a !== 1) continue;
        for (const kf of prop.v.k ?? []) {
          if (typeof kf.t === "number") last = Math.max(last, kf.t);
        }
      }
    }
  }
  return last;
}

/* The letter's own box IN THE COMP'S UNITS — measured off the RENDERED image
   rather than worked out from the layer's position and anchor, so a layer that
   is scaled or rotated is still measured correctly.
 *
 * The matrix is the fiddly part and it was wrong the first time. getCTM() maps
 * the image to the nearest VIEWPORT, which means it has the svg's own
 * viewBox-to-box scaling folded into it — so it answers in rendered CSS pixels
 * and a 422x290 letter in a 35px slot measures 30x20. The number this needs is
 * in the coordinate system the viewBox is written in, and the way to it is via
 * screen space: getScreenCTM() on the root svg maps ITS user space (which is the
 * viewBox's) to the screen, so undoing that against the image's own screen
 * matrix leaves image -> comp and nothing else.
 *
 * BECAUSE IT GOES VIA THE VIEWBOX IT IS VIEWBOX-INDEPENDENT, which is what lets
 * it be re-run over an already-cropped letter without compounding — and this
 * page re-crops on every change of fit.
 *
 * Note this is the box of the PNG, not of the ink inside it. The PNGs are
 * trimmed to their ink on export, so for these files the two are the same. */
function measureInk(svg: SVGSVGElement): Box | null {
  const root = svg.getScreenCTM();
  if (!root) return null;
  const toComp = root.inverse();

  /* NOT querySelector("image"). lottie-web emits the asset TWICE: once into
     <defs> as the source the stroke effect's mask samples, and once in the
     rendered tree under the layer's transform. The stashed one sits at the
     origin untransformed, so taking the first match measured the letter as
     starting at 0,0 — the crop then showed the top-left corner of the comp and
     cut the bottom off every letter on the board. Only the rendered copies
     count, and the union of them, since a glyph may be more than one layer —
     'x' and '8' in this folder both are. */
  const drawn = Array.from(svg.querySelectorAll("image")).filter(
    (img) => !img.closest("defs"),
  );
  if (!drawn.length) return null;

  const xs: number[] = [];
  const ys: number[] = [];
  for (const img of drawn) {
    const own = img.getScreenCTM();
    if (!own) continue;
    const m = toComp.multiply(own);
    const b = img.getBBox();
    for (const [px, py] of [
      [b.x, b.y],
      [b.x + b.width, b.y],
      [b.x, b.y + b.height],
      [b.x + b.width, b.y + b.height],
    ]) {
      xs.push(m.a * px + m.c * py + m.e);
      ys.push(m.b * px + m.d * py + m.f);
    }
  }
  if (!xs.length) return null;

  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/* #rrggbb to the 0..1 channels an feColorMatrix wants. */
function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

let filterSeq = 0;

/* Every pixel to one colour, alpha straight through — so a repainted letter
   keeps its own antialiased edge and nothing else of the original survives. */
function paint(svg: SVGSVGElement, ink: string): void {
  if (!ink) {
    svg.style.filter = "";
    return;
  }
  const NS = "http://www.w3.org/2000/svg";
  const [r, g, b] = channels(ink);
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  let filter = defs.querySelector<SVGFilterElement>("filter.lab-ink");
  if (!filter) {
    filter = document.createElementNS(NS, "filter");
    filter.setAttribute("class", "lab-ink");
    /* An id per instance: the letters each carry their own copy of the filter,
       and a shared id would have every one of them resolving to the first. */
    filter.setAttribute("id", `lab-ink-${++filterSeq}`);
    filter.setAttribute("color-interpolation-filters", "sRGB");
    const cm = document.createElementNS(NS, "feColorMatrix");
    cm.setAttribute("type", "matrix");
    filter.appendChild(cm);
    defs.appendChild(filter);
  }
  filter.firstElementChild!.setAttribute(
    "values",
    `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0`,
  );
  svg.style.filter = `url(#${filter.id})`;
}

/* The pattern as rows of characters, lower-cased because the folder is. A space
   is a gap the pen crosses; anything else wants a file. */
function typeset(pattern: string): string[][] {
  return pattern
    .toLowerCase()
    .split("\n")
    .map((line) => Array.from(line));
}

export default function LottieNoteLab() {
  /* One entry per GLYPH — spaces and unknown characters are laid out but never
     get a player, so an index means the same thing in the layout, the players
     and the timeline. */
  const mounts = useRef<(HTMLDivElement | null)[]>([]);
  const items = useRef<(AnimationItem | null)[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);

  /* The alphabet, by character, and the ink box of each — measured once off the
     first rendered copy and then reused, since every copy of a letter is the
     same file and the figure is in the comp's units. */
  const [glyphs, setGlyphs] = useState<Record<string, Glyph>>({});
  const [inks, setInks] = useState<Record<string, Box>>({});
  const [built, setBuilt] = useState(0);

  const [pattern, setPattern] = useState(PATTERN);
  const [fit, setFit] = useState<Fit>("metrics");
  const [size, setSize] = useState(3.4); // the em box, vw
  const [track, setTrack] = useState(-0.02); // letter spacing, in em boxes
  const [wordGap, setWordGap] = useState(0.24);
  const [leading, setLeading] = useState(0.86);
  const [per, setPer] = useState(0.11); // seconds per letter
  const [overlap, setOverlap] = useState(0.45);
  const [ink, setInk] = useState("#b6fe00");
  const [board, setBoard] = useState("#0d470c");

  const rows = useMemo(() => typeset(pattern), [pattern]);
  const cells = useMemo(
    () =>
      rows.flatMap((row, r) =>
        row.map((ch, c) => ({
          ch,
          key: `${r}-${c}`,
          space: ch === " ",
          known: ch === " " || ALPHABET.includes(ch),
        })),
      ),
    [rows],
  );
  const count = cells.length;
  const wanted = useMemo(
    () => [...new Set(cells.filter((g) => !g.space).map((g) => g.ch))],
    [cells],
  );
  /* ANYTHING THE FOLDER CANNOT SPELL, reported rather than swallowed. The live
     note's copy has an apostrophe and a hyphen in it and neither was exported. */
  const missing = wanted.filter((ch) => !ALPHABET.includes(ch));
  const drawn = cells.filter((g) => !g.space && g.known).length;

  /* Every file the pattern needs, once each. Each player then gets its own
     structural copy: lottie-web caches parsed properties onto the animationData
     it is handed, so sharing one object across twenty players is how you get
     twenty letters sharing one playhead. */
  useEffect(() => {
    let live = true;
    const need = wanted.filter((ch) => ALPHABET.includes(ch) && !glyphs[ch]);
    if (!need.length) return;
    Promise.all(
      need.map((ch) =>
        fetch(srcFor(ch))
          .then((r) => (r.ok ? r.json() : null))
          .then((json: Record<string, unknown> | null) => [ch, json] as const)
          .catch(() => [ch, null] as const),
      ),
    ).then((loaded) => {
      if (!live) return;
      const next: Record<string, Glyph> = {};
      for (const [ch, json] of loaded) {
        if (!json) continue;
        next[ch] = {
          data: json,
          frames: (json.op as number) - (json.ip as number),
          end: findRevealEnd(json) || (json.op as number),
          comp: { w: json.w as number, h: json.h as number },
        };
      }
      if (Object.keys(next).length) setGlyphs((prev) => ({ ...prev, ...next }));
    });
    return () => {
      live = false;
    };
  }, [wanted, glyphs]);

  const ready = wanted.every((ch) => !ALPHABET.includes(ch) || glyphs[ch]);

  /* Build a player per glyph. Torn down and rebuilt whenever the pattern
     changes, which is the only thing a player's identity depends on. */
  useEffect(() => {
    if (!ready) return;
    let live = true;
    const made: (AnimationItem | null)[] = [];

    import("lottie-web").then((mod) => {
      if (!live) return;
      cells.forEach((g, i) => {
        const host = mounts.current[i];
        const glyph = glyphs[g.ch];
        if (g.space || !host || !glyph) {
          made[i] = null;
          return;
        }
        made[i] = mod.default.loadAnimation({
          container: host,
          renderer: "svg", // the reveal exists nowhere else — see the top
          loop: false,
          autoplay: false,
          animationData: structuredClone(glyph.data),
          rendererSettings: { preserveAspectRatio: "xMinYMin meet" },
        });
      });
      items.current = made;
      /* Nudges the measure/crop/paint/park effects below, which cannot run until
         the players have written their svgs. */
      setBuilt((n) => n + 1);
    });

    return () => {
      live = false;
      tl.current?.kill();
      made.forEach((a) => a?.destroy());
      items.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, count, pattern]);

  /* MEASURE EACH DISTINCT LETTER ONCE, off whichever copy is to hand. */
  useEffect(() => {
    if (!built) return;
    const found: Record<string, Box> = {};
    cells.forEach((g, i) => {
      if (g.space || inks[g.ch] || found[g.ch]) return;
      const svg = items.current[i]?.renderer?.svgElement as
        | SVGSVGElement
        | undefined;
      if (!svg) return;
      const b = measureInk(svg);
      if (b) found[g.ch] = b;
    });
    if (Object.keys(found).length) setInks((prev) => ({ ...prev, ...found }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built, cells]);

  /* THE VIEWBOX PER GLYPH, which is where all three fits differ and the whole
   * argument at the top lives.
   *
   *   comp     the file as exported — the full 500x500, so every glyph is
   *            monospaced and centred.
   *   ink      cropped to the glyph's own ink, so every letter fills its slot
   *            and every letter is therefore the same height. Words close up and
   *            the writing line goes everywhere.
   *   metrics  cropped horizontally to the ink so the advance is proportional,
   *            and shifted vertically so the glyph's own baseline (BASELINE)
   *            lands on the row's line (ROW_BASE). One comp tall, so the letters
   *            keep their true sizes relative to each other. */
  const viewOf = useCallback(
    (ch: string): { box: Box; aspect: number } | null => {
      const glyph = glyphs[ch];
      if (!glyph) return null;
      const b = inks[ch];
      if (fit === "comp" || !b) {
        return {
          box: { x: 0, y: 0, w: glyph.comp.w, h: glyph.comp.h },
          aspect: glyph.comp.w / glyph.comp.h,
        };
      }
      if (fit === "ink") return { box: b, aspect: b.w / b.h };
      const line = b.y + b.h * baselineOf(ch);
      return {
        box: { x: b.x, y: line - ROW * ROW_BASE, w: b.w, h: ROW },
        aspect: b.w / ROW,
      };
    },
    [glyphs, inks, fit],
  );

  /* Re-applied on resize because the SVG renderer rewrites its own sizing when
     the container changes. */
  const crop = useCallback(() => {
    cells.forEach((g, i) => {
      const svg = items.current[i]?.renderer?.svgElement as
        | SVGSVGElement
        | undefined;
      if (!svg) return;
      const v = viewOf(g.ch);
      if (!v) return;
      svg.setAttribute(
        "viewBox",
        `${v.box.x} ${v.box.y} ${v.box.w} ${v.box.h}`,
      );
    });
  }, [cells, viewOf]);

  useEffect(() => {
    crop();
    window.addEventListener("resize", crop);
    return () => window.removeEventListener("resize", crop);
  }, [crop, built]);

  /* Repaint every letter. */
  useEffect(() => {
    for (const anim of items.current) {
      const svg = anim?.renderer?.svgElement as SVGSVGElement | undefined;
      if (svg) paint(svg, ink);
    }
  }, [ink, built]);

  /* Park every letter at a progress, its OWN reveal end — the marks finish on
     frame 10 and the letters on 15, so one shared figure would leave the marks
     written early and hold. */
  const show = useCallback(
    (p: number) => {
      cells.forEach((g, i) => {
        const glyph = glyphs[g.ch];
        if (!glyph) return;
        items.current[i]?.goToAndStop(
          Math.min(p * glyph.end, glyph.frames - 0.01),
          true,
        );
      });
    },
    [cells, glyphs],
  );
  useEffect(() => {
    if (built) show(0);
  }, [built, show]);

  /* THE HAND. One timeline, letters laid end to end with `overlap` eaten out of
     each join, spaces costing the pen a beat of their own. No ease per glyph:
     the pen does not accelerate inside a letter, which is the same call
     HandNote/hand.ts makes in write(). */
  function writeIt() {
    tl.current?.kill();
    const timeline = gsap.timeline();
    let cursor = 0;
    cells.forEach((g, i) => {
      const glyph = glyphs[g.ch];
      if (g.space || !glyph) {
        cursor += per * wordGap * 2;
        return;
      }
      const state = { p: 0 };
      timeline.to(
        state,
        {
          p: 1,
          duration: per,
          ease: "none",
          onUpdate: () =>
            items.current[i]?.goToAndStop(
              Math.min(state.p * glyph.end, glyph.frames - 0.01),
              true,
            ),
        },
        cursor,
      );
      cursor += per * (1 - overlap);
    });
    tl.current = timeline;
  }

  /* The Vara note beside it, built the way the site builds it. The stop is kept
     rather than only returned to the effect, because "rewrite" has to take the
     old build DOWN first — initHandNote appends a fresh Vara container to
     .hand-ink every time it runs, so a second call over a live one stacks two
     notes on top of each other. */
  const vara = useRef<HTMLDivElement>(null);
  const stopVara = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!vara.current) return;
    stopVara.current = initHandNote(vara.current);
    return () => {
      stopVara.current?.();
      stopVara.current = null;
    };
  }, []);
  function rewriteVara() {
    if (!vara.current) return;
    stopVara.current?.();
    stopVara.current = initHandNote(vara.current);
  }

  /* The lab's own furniture against whichever board is under it. Nothing to do
     with the note — a control panel you cannot read is just in the way. */
  const darkBoard = board === "#0d470c";
  const fg = darkBoard ? "#ffffff" : "#111111";
  let glyphIndex = -1;

  return (
    <main style={{ ...page, background: board, color: fg }}>
      <header style={head}>
        <h1 style={h1}>The Lottie alphabet set as words, vs the Vara note</h1>
        <p style={note}>
          {ready
            ? `${DIR} — ${ALPHABET.length} files, ADBE Stroke reveal, SVG renderer. ${drawn} glyphs on the board, one player each. Every glyph is centred in its own 500×500 comp, so the files carry no writing line — see "fit".`
            : "loading the alphabet…"}
        </p>
        {missing.length > 0 && (
          <p style={{ ...note, opacity: 1, color: "#ff8b6b" }}>
            not in the folder, drawn as gaps: {missing.map((c) => `"${c}"`).join(" ")}
          </p>
        )}
      </header>

      <div
        style={{
          ...controls,
          background: darkBoard ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.65)",
        }}
      >
        <label style={{ ...row, flexBasis: "100%", alignItems: "flex-start" }}>
          <span style={{ ...label, paddingTop: 6 }}>
            copy
            <br />
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              a-z 0-9 ! , . _ — newlines break lines
            </span>
          </span>
          <textarea
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            rows={4}
            spellCheck={false}
            style={{
              flex: 1,
              font: "12px/1.5 ui-monospace, monospace",
              padding: 8,
              borderRadius: 6,
              border: "1px solid #888",
              background: "transparent",
              color: "inherit",
              resize: "vertical",
            }}
          />
        </label>

        <span style={{ ...row, flexBasis: "100%" }}>
          <span style={label}>fit</span>
          {FITS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFit(f.id)}
              style={{
                ...button,
                outline: fit === f.id ? `2px solid ${fg}` : "none",
                opacity: fit === f.id ? 1 : 0.65,
              }}
            >
              {f.name}
            </button>
          ))}
        </span>

        <Slide l="size" v={size} set={setSize} min={0.6} max={9} step={0.1} u="vw" />
        <Slide l="track" v={track} set={setTrack} min={-0.4} max={0.4} step={0.01} u="em" />
        <Slide l="word gap" v={wordGap} set={setWordGap} min={0} max={1.5} step={0.02} u="em" />
        <Slide l="leading" v={leading} set={setLeading} min={0.3} max={3} step={0.02} u="em" />
        <Slide l="per letter" v={per} set={setPer} min={0.02} max={0.5} step={0.01} u="s" />
        <Slide l="overlap" v={overlap} set={setOverlap} min={0} max={0.95} step={0.05} u="" />

        <button type="button" onClick={writeIt} style={button}>
          write it
        </button>
        <button type="button" onClick={() => (tl.current?.kill(), show(1))} style={button}>
          all written
        </button>
        <button type="button" onClick={() => (tl.current?.kill(), show(0))} style={button}>
          blank
        </button>
        <button type="button" onClick={rewriteVara} style={button}>
          rewrite Vara
        </button>

        <span style={row}>
          <span style={label}>ink</span>
          {INKS.map((i) => (
            <button
              key={i.name}
              type="button"
              onClick={() => setInk(i.value)}
              title={i.name}
              style={{
                ...swatch,
                background: i.value || "transparent",
                outline: ink === i.value ? `2px solid ${fg}` : "1px solid #888",
              }}
            />
          ))}
        </span>

        <span style={row}>
          <span style={label}>board</span>
          {BOARDS.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => setBoard(b.value)}
              title={b.name}
              style={{
                ...swatch,
                background: b.value,
                outline: board === b.value ? `2px solid ${fg}` : "1px solid #888",
              }}
            />
          ))}
        </span>
      </div>

      <section style={stage}>
        <figure style={panel}>
          <figcaption style={caption}>
            Lottie — {drawn} files · {FITS.find((f) => f.id === fit)!.name}
          </figcaption>
          <div style={{ fontSize: `${size}vw` }}>
            {rows.map((line, r) => (
              <div
                key={r}
                style={{
                  display: "flex",
                  /* The metrics fit puts the writing line inside every glyph's
                     own box at the same height, so the boxes are aligned at the
                     TOP and the line takes care of itself. The other two have no
                     line to align to and are hung off the bottom, which is the
                     flattering reading of them. */
                  alignItems: fit === "metrics" ? "flex-start" : "flex-end",
                  height: `${leading}em`,
                }}
              >
                {line.map((ch, c) => {
                  glyphIndex += 1;
                  const i = glyphIndex;
                  if (ch === " ") {
                    return (
                      <span
                        key={`${r}-${c}`}
                        style={{ display: "inline-block", width: `${wordGap}em` }}
                      />
                    );
                  }
                  const v = viewOf(ch);
                  if (!v) {
                    /* A character with no file. Drawn as the gap it is, and
                       ruled so it cannot be mistaken for spacing. */
                    return (
                      <span
                        key={`${r}-${c}`}
                        title={`no file for "${ch}"`}
                        style={{
                          display: "inline-block",
                          width: "0.35em",
                          height: "1em",
                          borderBottom: "2px solid #ff8b6b",
                          flex: "0 0 auto",
                        }}
                      />
                    );
                  }
                  return (
                    <div
                      key={`${r}-${c}`}
                      ref={(el) => {
                        mounts.current[i] = el;
                      }}
                      style={{
                        width: `${v.aspect}em`,
                        height: "1em",
                        marginRight: `${track}em`,
                        flex: "0 0 auto",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </figure>

        <figure style={panel}>
          <figcaption style={caption}>Vara — the live note</figcaption>
          {/* .hand-note is position:absolute — placement belongs to whatever
              section puts it there. Here that is this box, sized to the note's
              own aspect so nothing below it is overlapped. */}
          <div
            ref={vara}
            style={{ position: "relative", width: "25vw", height: "17.19vw" }}
          >
            <HandNote />
          </div>
        </figure>
      </section>

      {/* THE MEASUREMENTS, on the page rather than in a console — this is the
          evidence for everything claimed at the top of the file, and it should
          be readable by whoever is asked to do the re-export. */}
      <section style={{ marginTop: "3rem" }}>
        <figcaption style={caption}>
          measured off the rendered files · centre should read 250, 250 for every
          glyph, which is the bug
        </figcaption>
        <div style={table}>
          {Object.entries(inks)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ch, b]) => (
              <span key={ch} style={cellStyle}>
                <b style={{ fontSize: 13 }}>{ch === " " ? "␠" : ch}</b>{" "}
                {Math.round(b.w)}×{Math.round(b.h)}{" "}
                <span style={{ opacity: 0.55 }}>
                  @{Math.round(b.x + b.w / 2)},{Math.round(b.y + b.h / 2)}
                </span>
                {BASELINE[ch] !== undefined && (
                  <span style={{ opacity: 0.55 }}> base {BASELINE[ch]}</span>
                )}
              </span>
            ))}
        </div>
      </section>
    </main>
  );
}

function Slide({
  l,
  v,
  set,
  min,
  max,
  step,
  u,
}: {
  l: string;
  v: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step: number;
  u: string;
}) {
  return (
    <label style={row}>
      <span style={label}>{l}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
        style={{ width: 110 }}
      />
      <span style={value}>
        {v}
        {u}
      </span>
    </label>
  );
}

/* Lab furniture. Inline because none of it should reach global.css. */
const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "5vw 4vw",
  fontFamily: "var(--font-inter, system-ui), sans-serif",
};
const head: React.CSSProperties = { marginBottom: "1.2rem" };
const h1: React.CSSProperties = { fontSize: 22, margin: 0, fontWeight: 600 };
const note: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginTop: 6,
  maxWidth: "70ch",
};
const controls: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.85rem 1.4rem",
  alignItems: "center",
  padding: "0.9rem 1.1rem",
  borderRadius: 10,
  fontSize: 12,
  marginBottom: "2.5rem",
};
const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const label: React.CSSProperties = { opacity: 0.6, minWidth: 52 };
const value: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  minWidth: 40,
  opacity: 0.85,
};
const button: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #888",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  font: "inherit",
};
const swatch: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
  padding: 0,
};
const stage: React.CSSProperties = {
  display: "flex",
  gap: "4vw",
  alignItems: "flex-start",
  flexWrap: "wrap",
};
const panel: React.CSSProperties = { margin: 0, minWidth: "30vw" };
const caption: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.55,
  marginBottom: "1rem",
};
const table: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.35rem 1.1rem",
  font: "11px/1.6 ui-monospace, monospace",
  opacity: 0.85,
};
const cellStyle: React.CSSProperties = { whiteSpace: "nowrap" };
