"use client";

import Panel from "../Panel";

/* The numbers as global.css holds them today — see the .about-art block. Each
   piece is placed in vw of the sheet; each strip on a piece is placed by its
   centre in % of that piece, with its length in vw; the clear strip is on the
   sheet in vw. `rotate` everywhere is the VISUAL angle, 0 = lying flat, and the
   strips' is turned into Peel's transform below. */
const DEFAULTS = {
  logo: { left: 5.5, top: 38.5, width: 12.4, rotate: -2 },
  clipping: { left: 11, top: 41, width: 18.5, rotate: -8 },
  shop: { right: 18.6, top: 42.5, width: 16.6, rotate: -3 },
  strip: { right: 9, top: 58, width: 9.5, rotate: -15 },
  tapeLogo: { top: 2, left: 51.5, len: 8.8, rotate: -12 },
  tapeSide: { top: 28.1, left: 100, len: 11, rotate: 75.5 },
  tapeFoot: { top: 79.6, left: 1, len: 11, rotate: -104 },
  tapeShop: { top: 42.5, right: 26.9, len: 12.3, rotate: -2.9 },
};
type P = typeof DEFAULTS;

const MASKING = 283 / 134;
const CLEAR = 141 / 92;

/* Peel turns its wrapper a quarter and the artwork back, and the two compose
   to a half turn — see the .about-tape note in global.css. */
const tapeTurn = (visual: number) => `rotate(${visual - 180}deg)`;

function apply(p: P) {
  const q = (sel: string) => document.querySelector<HTMLElement>(sel);
  const piece = (
    sel: string,
    v: {
      top: number;
      width: number;
      rotate: number;
      left?: number;
      right?: number;
    },
  ) => {
    const el = q(sel);
    if (!el) return;
    el.style.top = `${v.top}vw`;
    el.style.width = `${v.width}vw`;
    el.style.transform = `rotate(${v.rotate}deg)`;
    if (v.left !== undefined) el.style.left = `${v.left}vw`;
    if (v.right !== undefined) el.style.right = `${v.right}vw`;
  };
  const tape = (sel: string, len: number, ratio: number, rotate: number) => {
    const el = q(sel);
    if (!el) return;
    el.style.setProperty("--peel-w", `${len}vw`);
    el.style.setProperty("--peel-h", `${(len / ratio).toFixed(3)}vw`);
    el.style.transform = tapeTurn(rotate);
    return el;
  };
  piece(".about-logo", p.logo);
  piece(".about-clipping", p.clipping);
  piece(".about-shop", p.shop);
  piece(".about-strip", p.strip);
  for (const [k, sel] of [
    ["tapeLogo", "logo"],
    ["tapeSide", "side"],
    ["tapeFoot", "foot"],
  ] as const) {
    const v = p[k];
    const el = tape(`[data-tape="${sel}"]`, v.len, MASKING, v.rotate);
    if (!el) continue;
    el.style.top = `${v.top}%`;
    el.style.left = `${v.left}%`;
  }
  const s = p.tapeShop;
  const el = tape('[data-tape="shop"]', s.len, CLEAR, s.rotate);
  if (el) {
    el.style.top = `${s.top}vw`;
    el.style.right = `${s.right}vw`;
  }
}

const range = (g: string, f: string): [number, number] =>
  f === "rotate"
    ? [-180, 180]
    : f === "len"
      ? [2, 30]
      : g.startsWith("tape") && g !== "tapeShop"
        ? [-30, 130]
        : [0, 80];

export default function Tuner() {
  return (
    <Panel
      title="about collage"
      defaults={DEFAULTS}
      apply={apply}
      range={range}
    />
  );
}
