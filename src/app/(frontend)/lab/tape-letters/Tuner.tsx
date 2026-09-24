"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import marks from "@/data/wordmarks.json";
import Panel, { type Params } from "../Panel";

const WORDS = marks.words as Record<string, { letter: string }[]>;

const VARS = ["--dx", "--dy", "--dr"] as const;

const glyphsOf = () =>
  Array.from(document.querySelectorAll<HTMLElement>(".bottom-title .glyph"));

/* The word's current numbers, read off the cascade — so the sliders open on
   whatever letters-tuning.css already says, not on zero.

   THE INLINE NUMBERS COME OFF FIRST. The spans are one pool shared by every
   word, and apply() below writes the tuned word's --dx/--dy/--dr inline on
   them; read through that, the next word opens on the LAST word's figures —
   which the panel then writes back, and TRUSTY is drawn with CREATIVE's
   nudges from the moment it lands. Cleared, the computed style is the
   stylesheet's own rule for this word, and apply() puts the same figures
   straight back. */
function readWord(word: string): Params {
  const els = glyphsOf();
  els.forEach((el) => VARS.forEach((v) => el.style.removeProperty(v)));
  const out: Params = {};
  WORDS[word]?.forEach((g, i) => {
    const cs = els[i] ? getComputedStyle(els[i]) : null;
    const num = (v: string) => parseFloat(cs?.getPropertyValue(v) || "0") || 0;
    out[`${i + 1} ${g.letter}`] = { dx: num("--dx"), dy: num("--dy"), dr: num("--dr") };
  });
  return out;
}

/* letters-tuning.css blocks, verbatim shape — --l kept, see that file's note. */
function toCss(word: string, p: Params) {
  return Object.entries(p)
    .map(([k, v], i) => {
      const letter = k.slice(k.indexOf(" ") + 1);
      return (
        `/* ${letter} */\n` +
        `.bottom-title[data-word="${word}"] .glyph:nth-child(${i + 1}) {\n` +
        `  --l: ${i + 1};\n  --dx: ${v.dx}vw;\n  --dy: ${v.dy}vw;\n  --dr: ${v.dr}deg;\n}`
      );
    })
    .join("\n\n");
}

const range = (_g: string, f: string): [number, number] =>
  f === "dr" ? [-15, 15] : [-3, 3];

export default function Tuner() {
  const [word, setWord] = useState("");
  const [defaults, setDefaults] = useState<Params>({});
  /* Per-word numbers survive stepping away and back. */
  const tuned = useRef<Record<string, Params>>({});

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".bottom-title");
    if (!el) return;
    const sync = () => {
      const w = el.dataset.word || "";
      setWord(w);
      setDefaults(tuned.current[w] ?? readWord(w));
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ["data-word"] });
    return () => mo.disconnect();
  }, []);

  const apply = useCallback(
    (p: Params) => {
      tuned.current[word] = p;
      const els = glyphsOf();
      Object.values(p).forEach((v, i) => {
        els[i]?.style.setProperty("--dx", `${v.dx}vw`);
        els[i]?.style.setProperty("--dy", `${v.dy}vw`);
        els[i]?.style.setProperty("--dr", `${v.dr}deg`);
      });
    },
    [word],
  );

  if (!word) return null;
  return (
    <Panel
      key={word}
      title={`letters — ${word}`}
      defaults={defaults}
      apply={apply}
      range={range}
      dump={(p) => toCss(word, p)}
    />
  );
}
