"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Panel, { type Params } from "../Panel";

/* What Hero/engine.ts puts on window in dev, and the groups this page shows.
   Colours are numbers too (hex) and are left out — the panel is sliders. */
type Knobs = Record<string, number | null | undefined>;
type Hero = {
  CONFIG: Knobs; STRIP: Knobs; END: Knobs;
  LIGHT: Knobs; FACE_LIGHT: Knobs; FILM: Knobs; GLASS: Knobs;
  tune: () => void;
};
const GROUPS = ["LIGHT", "FACE_LIGHT", "FILM", "GLASS", "CONFIG", "STRIP", "END"] as const;
const SKIP = new Set(["CAST", "CAST_STRIP", "COLOR", "RADIUS", "ROLL_W", "SEGMENTS"]);

const num = (o: Knobs) =>
  Object.fromEntries(
    Object.entries(o).filter(([k, v]) => typeof v === "number" && !SKIP.has(k)),
  ) as Record<string, number>;

/* Bounds from the value's own size; positions and tilts go negative. */
const range = (g: string, f: string): [number, number] => {
  if (/^[XYZ]$/.test(f)) return [-6, 6];
  if (g === "CONFIG") return f === "camZ" ? [0.5, 5] : [-45, 45];
  if (f === "TONE" || f === "SAT" || f === "PUNCH" || f.endsWith("_SAT") || f.endsWith("_PUNCH")) return [0, 2];
  if (f === "POWER" || f === "AMBIENT") return [0, 6];
  if (f === "SMUDGE" || f === "DOME") return [0, 5];
  return [0, 1];
};
const step = (g: string, f: string) => {
  const [lo, hi] = range(g, f);
  return hi - lo > 10 ? 0.1 : hi - lo > 2 ? 0.02 : 0.005;
};

export default function Tuner() {
  const [defaults, setDefaults] = useState<Params | null>(null);
  const hero = useRef<Hero | null>(null);
  const orig = useRef<Params | null>(null);

  /* The handle lands when the model does; poll for it. */
  useEffect(() => {
    const id = setInterval(() => {
      const h = (window as unknown as { hero?: Hero }).hero;
      if (!h?.tune) return;
      clearInterval(id);
      hero.current = h;
      const p: Params = {};
      for (const g of GROUPS) p[g] = num(h[g]);
      orig.current = JSON.parse(JSON.stringify(p));
      setDefaults(p);
    }, 250);
    return () => {
      clearInterval(id);
      /* The knobs are module objects — put the site's numbers back. */
      const h = hero.current;
      if (h && orig.current) {
        for (const g of GROUPS) Object.assign(h[g], orig.current[g]);
        h.tune();
      }
    };
  }, []);

  const apply = useCallback((p: Params) => {
    const h = hero.current;
    if (!h) return;
    for (const g of GROUPS) Object.assign(h[g], p[g]);
    h.tune();
  }, []);

  const dump = (p: Params) => {
    const o = orig.current ?? {};
    const out: Params = {};
    for (const g of GROUPS) {
      const d = Object.fromEntries(Object.entries(p[g]).filter(([k, v]) => o[g]?.[k] !== v));
      if (Object.keys(d).length) out[g] = d;
    }
    return JSON.stringify(out, null, 2);
  };

  if (!defaults) return null;
  return (
    <Panel title="hero tape" defaults={defaults} apply={apply} range={range} step={step} dump={dump} />
  );
}
