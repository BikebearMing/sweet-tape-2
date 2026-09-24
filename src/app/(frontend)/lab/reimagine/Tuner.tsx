"use client";

import { useEffect, useState } from "react";

import Panel, { type Params } from "../Panel";

const FIELDS = ["px", "py", "pw", "pr"] as const;

/* The sliders open on what global.css says — every prop's --px/--py/--pw/--pr
   read off the cascade, at whatever breakpoint the window is on — so the panel
   cannot disagree with the stylesheet. There is no table of numbers here to
   fall behind it. --ph is the stylesheet's own (width times the artwork's
   ratio) and is left alone. */
function read(): Params {
  const out: Params = {};
  document.querySelectorAll<HTMLElement>(".reimagine-prop").forEach((el) => {
    const key = Array.from(el.classList).find((c) => c.startsWith("rei-"));
    if (!key) return;
    const cs = getComputedStyle(el);
    out[key] = Object.fromEntries(
      FIELDS.map((f) => [f, parseFloat(cs.getPropertyValue(`--${f}`)) || 0]),
    );
  });
  return out;
}

function apply(p: Params) {
  for (const [key, v] of Object.entries(p)) {
    const el = document.querySelector<HTMLElement>(`.${key}`);
    if (!el) continue;
    el.style.setProperty("--px", String(v.px));
    el.style.setProperty("--py", String(v.py));
    el.style.setProperty("--pw", String(v.pw));
    el.style.setProperty("--pr", `${v.pr}deg`);
  }
}

/* One rule a prop, in the four figures the .rei-* rules carry — paste over the
   matching rule in global.css. */
const dump = (p: Params) =>
  Object.entries(p)
    .map(
      ([k, v]) =>
        `.${k} { --px: ${v.px}; --py: ${v.py}; --pw: ${v.pw}; --pr: ${v.pr}deg; }`,
    )
    .join("\n");

const range = (_g: string, f: string): [number, number] =>
  f === "pr" ? [-180, 180] : f === "pw" ? [2, 70] : [-10, 200];

export default function Tuner() {
  const [defaults, setDefaults] = useState<Params | null>(null);

  useEffect(() => {
    /* The reveal parks the props out of sight and brings them in over a few
       seconds; a placement panel wants them at rest. Run it to its end. */
    (window as { reimagine?: { tl: { progress(n: number): void } } }).reimagine?.tl.progress(1);
    setDefaults(read());
  }, []);

  if (!defaults) return null;
  return (
    <Panel
      title="reimagine props"
      defaults={defaults}
      apply={apply}
      range={range}
      dump={dump}
    />
  );
}
