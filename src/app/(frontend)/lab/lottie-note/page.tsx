"use client";

/* LAB — the Lottie hand set as words, against the Vara hand.
 *
 * Not a route anyone links to. The first version of this page proved one letter
 * renders; that was never the question. The question is whether a bag of
 * per-letter Lotties can be SET — spaced, tracked, wrapped and written in
 * sequence — well enough to stand where the Vara note stands. So this page
 * types a pattern out of copies of data-a.json and puts the result beside the
 * real note at the same size on the same board.
 *
 * Four things it is built to answer:
 *
 *   1. THE BOX. data-a.json is a 422x290 PNG sitting in a 500x500 comp, and the
 *      letter does not fill either. Set the comp boxes edge to edge and every
 *      glyph carries a fat transparent margin, so the words come out spaced
 *      like a ransom note. Crop to the ink and they close up — but see (2).
 *
 *   2. WHICH BOX IS RIGHT, which is the finding this page exists for. Cropping
 *      each letter to its own ink makes every letter the same height: an 'a',
 *      an 'l' and a 'g' would all come out x-height, and the baseline would
 *      wander. A real alphabet has to keep ONE shared comp box with the glyphs
 *      drawn in their true positions inside it, and then the tiling is free.
 *      The crop toggle shows both so the difference is arguable rather than
 *      asserted. With only an 'a' in the folder, tight looks better and is the
 *      wrong answer.
 *
 *   3. THE HAND. Vara writes a line as one continuous pen at a constant speed.
 *      Separate Lotties can only be staggered. `overlap` is how much of the
 *      next letter starts before the last one finishes — 0 is a typewriter,
 *      high is a scribble — and it is the dial that decides whether a row of
 *      files reads as writing.
 *
 *   4. THE INK. The note is written in four colours on this site and Vara takes
 *      the pen as an argument; here it is baked into the PNG at #013900 and has
 *      to be repainted through a filter. See the swatches.
 *
 * Rendering notes that outlive this page: the reveal is an ADBE Stroke effect
 * (Paint Style 3, reveal original image) driven off the layer's mask, which
 * lottie-web implements in the SVG RENDERER ONLY — on canvas the letter appears
 * whole with no writing. And nothing here calls anim.play(): the site's note is
 * one GSAP timeline shared with the ruled margin at a per-instance pace, so the
 * only honest test is a tween pushing frames in with goToAndStop.
 */

import gsap from "gsap";
import type { AnimationItem } from "lottie-web";
import { useCallback, useEffect, useRef, useState } from "react";

import HandNote from "@/components/HandNote";
import { initHandNote } from "@/components/HandNote/hand";

const SRC = "/assets/words-animate/data-a.json";

/* Every letter is the same file until the rest of the alphabet exists, so the
   pattern is written in a's. Newlines are line breaks — the note's breaks are
   drawn, not wrapped (see HandNote/copy.ts), and this keeps that. */
const PATTERN = "aa aaaaa aaa\naaaaaaaa aaaaaaaaa\naaa aaaaaaaaaa-aaa\naaaa aaaa.";

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

type Box = { x: number; y: number; w: number; h: number };

/* WHERE THE WRITING ACTUALLY STOPS, dug out of the file rather than typed here.
 *
 * The comp is 30 frames but the ADBE Stroke's End runs 0 to 100 over the first
 * 15 and then holds, so the back half is a still letter. Scrubbing a 0..1
 * progress across all 30 would spend half of every glyph's slot writing
 * nothing — which, staggered across a sentence, is the difference between a
 * hand and a slideshow. Read off the effect's last keyframe so a re-export with
 * different timing is picked up rather than silently mis-scrubbed. */
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
 * screen space: getScreenCTM() on the root svg maps ITS user space (which is
 * the viewBox's) to the screen, so undoing that against the image's own screen
 * matrix leaves image -> comp and nothing else.
 *
 * Note this is the box of the PNG, not of the ink inside it. Tight enough for
 * setting words; see (2) at the top for why tight is not automatically right. */
function measureInk(svg: SVGSVGElement): Box | null {
  const root = svg.getScreenCTM();
  if (!root) return null;
  const toComp = root.inverse();

  /* NOT querySelector("image"). lottie-web emits the asset TWICE: once into
     <defs> as the source the stroke effect's mask samples, and once in the
     rendered tree under the layer's transform. The stashed one sits at the
     origin untransformed, so taking the first match measured the letter as
     starting at 0,0 — the crop then showed the top-left 422x290 of the comp
     and cut the bottom off every 'a' on the board. Only the rendered copies
     count, and the union of them, since a letter may be more than one layer. */
  const drawn = Array.from(svg.querySelectorAll("image")).filter(
    (img) => !img.closest("defs")
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
    `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0`
  );
  svg.style.filter = `url(#${filter.id})`;
}
let filterSeq = 0;

/* The pattern as rows of characters. A space is a gap the pen crosses; anything
   else gets a letter of its own. */
function typeset(pattern: string): string[][] {
  return pattern.split("\n").map((line) => Array.from(line));
}

export default function LottieNoteLab() {
  /* One entry per GLYPH — spaces are laid out but never get a player. */
  const mounts = useRef<(HTMLDivElement | null)[]>([]);
  const items = useRef<(AnimationItem | null)[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [frames, setFrames] = useState(0);
  const [end, setEnd] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  /* The comp's own box, kept from the fetched JSON — the untight crop. */
  const [comp, setComp] = useState({ w: 500, h: 500 });
  const [built, setBuilt] = useState(0);

  const [pattern, setPattern] = useState(PATTERN);
  const [size, setSize] = useState(2.2); // glyph height, vw
  const [track, setTrack] = useState(-0.16); // letter spacing, in glyph heights
  const [wordGap, setWordGap] = useState(0.42);
  const [leading, setLeading] = useState(1.5);
  const [tight, setTight] = useState(true);
  const [per, setPer] = useState(0.11); // seconds per letter
  const [overlap, setOverlap] = useState(0.45);
  const [ink, setInk] = useState("#b6fe00");
  const [board, setBoard] = useState("#0d470c");

  const rows = typeset(pattern);
  /* The flat glyph list the players are indexed by — spaces carry a null slot
     so an index means the same thing in the layout and in the timeline. */
  const glyphs = rows.flatMap((row, r) =>
    row.map((ch, c) => ({ ch, key: `${r}-${c}`, space: ch === " " }))
  );
  const count = glyphs.length;
  /* Spaces are laid out but never get a player, so this is the number of files
     actually on the board — the figure that matters for both weight and count. */
  const letters = glyphs.filter((g) => !g.space).length;

  /* The file, once. Each player then gets its own structural copy: lottie-web
     caches parsed properties onto the animationData it is handed, so sharing
     one object across twenty players is how you get twenty letters sharing one
     playhead. */
  useEffect(() => {
    let live = true;
    fetch(SRC)
      .then((r) => r.json())
      .then((json: Record<string, unknown>) => {
        if (!live) return;
        setFrames((json.op as number) - (json.ip as number));
        setEnd(findRevealEnd(json) || (json.op as number));
        setComp({ w: json.w as number, h: json.h as number });
        setData(json);
      });
    return () => {
      live = false;
    };
  }, []);

  /* Build a player per glyph. Torn down and rebuilt whenever the count changes,
     which is the only thing a player's identity depends on. */
  useEffect(() => {
    if (!data) return;
    let live = true;
    const built: (AnimationItem | null)[] = [];

    import("lottie-web").then((mod) => {
      if (!live) return;
      glyphs.forEach((g, i) => {
        const host = mounts.current[i];
        if (g.space || !host) {
          built[i] = null;
          return;
        }
        built[i] = mod.default.loadAnimation({
          container: host,
          renderer: "svg", // the reveal exists nowhere else — see the top
          loop: false,
          autoplay: false,
          animationData: structuredClone(data),
          rendererSettings: { preserveAspectRatio: "xMinYMin meet" },
        });
      });
      items.current = built;
      /* Nudges the crop/paint/park effects below, which cannot run until the
         players have written their svgs. */
      setBuilt((n) => n + 1);
    });

    return () => {
      live = false;
      tl.current?.kill();
      built.forEach((a) => a?.destroy());
      items.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, count]);

  /* THE CROP — see (1) and (2) at the top. Re-applied on resize because the SVG
     renderer rewrites its own sizing when the container changes. */
  const crop = useCallback(() => {
    const svgs = items.current
      .map((a) => a?.renderer?.svgElement as SVGSVGElement | undefined)
      .filter((s): s is SVGSVGElement => !!s);
    if (!svgs.length) return;

    /* Measured once off whichever letter is to hand and then reused — every
       copy is the same file, and the figure is in the comp's units so it does
       not change with the size the letter is drawn at. measureInk is itself
       viewBox-independent, so re-running it over an already-cropped letter
       gives the same answer rather than compounding. */
    const b = tight ? (box ?? measureInk(svgs[0])) : null;
    if (tight && b && !box) setBox(b);

    const view = b ?? { x: 0, y: 0, w: comp.w, h: comp.h };
    for (const svg of svgs) {
      svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    }
  }, [tight, box, comp]);

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

  /* Park every letter unwritten, so the page opens on a blank board and the
     button is what fills it. */
  const show = useCallback(
    (p: number) => {
      for (const anim of items.current) {
        anim?.goToAndStop(Math.min(p * end, frames - 0.01), true);
      }
    },
    [end, frames]
  );
  useEffect(() => {
    if (built) show(0);
  }, [built, show]);

  /* THE HAND — see (3). One timeline, letters laid end to end with `overlap`
     eaten out of each join, spaces costing the pen a beat of their own.
     No ease per glyph: the pen does not accelerate inside a letter, which is
     the same call HandNote/hand.ts makes in write(). */
  function writeIt() {
    tl.current?.kill();
    const timeline = gsap.timeline();
    let cursor = 0;
    glyphs.forEach((g, i) => {
      if (g.space) {
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
              Math.min(state.p * end, frames - 0.01),
              true
            ),
        },
        cursor
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

  /* The glyph's box is `size` tall and this wide — so the letter fills its slot
     rather than sitting in a transparent margin. See (1) at the top. */
  const aspect = tight && box ? box.w / box.h : comp.w / comp.h;
  let glyph = -1;

  return (
    <main style={{ ...page, background: board, color: fg }}>
      <header style={head}>
        <h1 style={h1}>Lottie set as words vs the Vara note</h1>
        <p style={note}>
          {data
            ? `data-a.json — ADBE Stroke reveal, SVG renderer. ${frames}-frame comp, writing finishes on frame ${end}. ${letters} letters on the board, one player each.`
            : "loading data-a.json…"}
        </p>
      </header>

      <div
        style={{
          ...controls,
          background: darkBoard ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.65)",
        }}
      >
        <label style={{ ...row, flexBasis: "100%", alignItems: "flex-start" }}>
          <span style={{ ...label, paddingTop: 6 }}>
            pattern
            <br />
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              every non-space character draws the &lsquo;a&rsquo;; newlines break
              lines
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

        <Slide l="size" v={size} set={setSize} min={0.6} max={8} step={0.1} u="vw" />
        <Slide l="track" v={track} set={setTrack} min={-0.6} max={0.4} step={0.01} u="em" />
        <Slide l="word gap" v={wordGap} set={setWordGap} min={0} max={1.5} step={0.02} u="em" />
        <Slide l="leading" v={leading} set={setLeading} min={0.6} max={4} step={0.05} u="em" />
        <Slide l="per letter" v={per} set={setPer} min={0.02} max={0.5} step={0.01} u="s" />
        <Slide l="overlap" v={overlap} set={setOverlap} min={0} max={0.95} step={0.05} u="" />

        <label style={row}>
          <input
            type="checkbox"
            checked={tight}
            onChange={(e) => setTight(e.target.checked)}
          />
          <span>crop to the letter</span>
        </label>

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
            Lottie — {letters} copies of data-a.json
            {tight && box
              ? ` · cropped to ${Math.round(box.w)}×${Math.round(box.h)} of the 500×500 comp`
              : " · full comp box"}
          </figcaption>
          <div style={{ fontSize: `${size}vw` }}>
            {rows.map((cells, r) => (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  height: `${leading}em`,
                }}
              >
                {cells.map((ch, c) => {
                  glyph += 1;
                  const i = glyph;
                  if (ch === " ") {
                    return (
                      <span
                        key={`${r}-${c}`}
                        style={{ display: "inline-block", width: `${wordGap}em` }}
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
                        width: `${aspect}em`,
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
const note: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 6 };
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
