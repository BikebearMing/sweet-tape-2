"use client";

import Panel from "../Panel";

/* The .rei-* rules as global.css holds them: px/py are the prop's place in
   --prop-u units of the sheet, pw its width in the same, pr its lean. --ph is
   left to the stylesheet — it is the width times the artwork's ratio. A shot's
   own tape is placed inside the shot, so its px/py are small. */
const DEFAULTS = {
  "rei-kraft-a": { px: 19.1, py: 4.2, pw: 15.8, pr: -4 },
  "rei-kraft-b": { px: 32.8, py: 3.8, pw: 17.1, pr: 0.1 },
  "rei-clear-a": { px: 75, py: 6.7, pw: 30, pr: -180 },
  "rei-clear-b": { px: 3.2, py: 42.3, pw: 26.4, pr: 83 },
  "rei-clear-c": { px: 21.6, py: 63.3, pw: 21.6, pr: -4.3 },
  "rei-kraft-c": { px: 85.6, py: 59.7, pw: 21.5, pr: 0.6 },
  "rei-shot-a": { px: 77.7, py: 31.7, pw: 21, pr: 4 },
  "rei-shot-b": { px: 57.7, py: 50.8, pw: 26.1, pr: -4.3 },
  "rei-shot-a-tape": { px: 10.6, py: -0.5, pw: 14, pr: -2.3 },
  "rei-shot-b-tape": { px: 10.9, py: 0.6, pw: 15, pr: 4.9 },
};

function apply(p: typeof DEFAULTS) {
  for (const [cls, v] of Object.entries(p)) {
    const el = document.querySelector<HTMLElement>(`.${cls}`);
    if (!el) continue;
    el.style.setProperty("--px", String(v.px));
    el.style.setProperty("--py", String(v.py));
    el.style.setProperty("--pw", String(v.pw));
    el.style.setProperty("--pr", `${v.pr}deg`);
  }
}

const range = (_g: string, f: string): [number, number] =>
  f === "pr" ? [-180, 180] : f === "pw" ? [2, 40] : [-10, 100];

export default function Tuner() {
  return (
    <Panel
      title="reimagine props"
      defaults={DEFAULTS}
      apply={apply}
      range={range}
    />
  );
}
