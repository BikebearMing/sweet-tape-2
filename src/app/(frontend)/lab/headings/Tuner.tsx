"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import Panel, { type Params } from "../Panel";

/* The headings this lab places, and the selector each one's tuning is written
   against. The selector is the heading's own box; the lines and letters under
   it are addressed by position. */
const HEADINGS = [
  { key: "home", label: "home — hero", sel: ".hero-section .h1" },
  { key: "about", label: "about", sel: ".about-hero .h1" },
  { key: "news", label: "news", sel: ".rolling-title" },
  { key: "contact", label: "contact", sel: ".contact-title" },
  { key: "footer", label: "footer", sel: ".footer-headline" },
] as const;

const VARS = ["--dx", "--dy", "--dr"] as const;

/* Every letter box of a heading, in reading order, tagged with its line and
   its place on the line — the two numbers the stylesheet addresses it by. */
function clipsOf(sel: string) {
  const root = document.querySelector<HTMLElement>(sel);
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(".line")).flatMap((line, li) =>
    Array.from(line.querySelectorAll<HTMLElement>(".clip")).map((clip, ci) => ({
      clip,
      line: li + 1,
      at: ci + 1,
      char: (clip.textContent || "").replace(/\u00a0/g, "␣"),
    })),
  );
}

const keyOf = (c: { line: number; at: number; char: string }) => `${c.line}.${c.at} ${c.char}`;

/* The heading's current numbers, read off the cascade — so the sliders open on
   whatever headings-tuning.css already says, not on zero. The inline numbers
   come off first: read through them, a heading opens on the last thing the
   panel wrote rather than on the stylesheet. */
function readHeading(sel: string): Params {
  const out: Params = {};
  for (const c of clipsOf(sel)) {
    VARS.forEach((v) => c.clip.style.removeProperty(v));
    const cs = getComputedStyle(c.clip);
    const num = (v: string) => parseFloat(cs.getPropertyValue(v) || "0") || 0;
    out[keyOf(c)] = { dx: num("--dx"), dy: num("--dy"), dr: num("--dr") };
  }
  return out;
}

/* headings-tuning.css blocks. Letters left where the arc put them are
   skipped, so the paste is only the letters that were moved. */
function toCss(sel: string, p: Params) {
  const blocks = Object.entries(p)
    .filter(([, v]) => v.dx || v.dy || v.dr)
    .map(([k, v]) => {
      const [pos, char] = k.split(" ");
      const [line, at] = pos.split(".");
      return (
        `${sel} .line:nth-child(${line}) .clip:nth-child(${at}) {\n` +
        `  --dx: ${v.dx}vw;\n  --dy: ${v.dy}vw;\n  --dr: ${v.dr}deg;\n} /* ${char} */`
      );
    });
  return blocks.length ? blocks.join("\n") : `/* ${sel}: nothing moved */`;
}

const range = (_g: string, f: string): [number, number] =>
  f === "dr" ? [-15, 15] : [-3, 3];

type Key = (typeof HEADINGS)[number]["key"];
const headingOf = (key: Key) => HEADINGS.find((h) => h.key === key)!;

export default function Tuner() {
  /* THE PICK AND ITS NUMBERS ARE ONE STATE, set together. They were two, with
     the numbers read in an effect a render later — and the panel, keyed on the
     pick, remounted on that first render holding the previous heading's
     numbers, then wrote them onto the new heading. One update, one render. */
  const [state, setState] = useState<{ which: Key; defaults: Params } | null>(null);
  /* Per-heading numbers survive switching away and back. */
  const tuned = useRef<Record<string, Params>>({});

  const pick = useCallback((which: Key) => {
    const h = headingOf(which);
    setState({ which, defaults: tuned.current[which] ?? readHeading(h.sel) });
    document.querySelector(h.sel)?.scrollIntoView({ block: "center" });
  }, []);

  useEffect(() => pick("home"), [pick]);

  const which = state?.which;
  const apply = useCallback(
    (p: Params) => {
      if (!which) return;
      tuned.current[which] = p;
      for (const c of clipsOf(headingOf(which).sel)) {
        const v = p[keyOf(c)];
        if (!v) continue;
        c.clip.style.setProperty("--dx", `${v.dx}vw`);
        c.clip.style.setProperty("--dy", `${v.dy}vw`);
        c.clip.style.setProperty("--dr", `${v.dr}deg`);
      }
    },
    [which],
  );

  if (!state) return null;
  const heading = headingOf(state.which);
  return (
    <>
      <select value={state.which} onChange={(e) => pick(e.target.value as Key)} style={pickStyle}>
        {HEADINGS.map((h) => (
          <option key={h.key} value={h.key}>
            {h.label}
          </option>
        ))}
      </select>
      <Panel
        key={state.which}
        title={`heading — ${heading.label}`}
        defaults={state.defaults}
        apply={apply}
        range={range}
        dump={(p) => toCss(heading.sel, p)}
      />
    </>
  );
}

const pickStyle: CSSProperties = {
  position: "fixed",
  top: 8,
  left: 8,
  zIndex: 1000,
  font: "12px ui-monospace, monospace",
  padding: "4px 6px",
};
