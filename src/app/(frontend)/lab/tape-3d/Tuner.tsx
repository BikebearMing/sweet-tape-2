"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FILM, GLASS } from "@/components/TapeSlider/film";
import {
  createTapeViewer,
  FILM_LIGHT,
  LIGHT,
  type MaterialFinishes,
  type TapeViewer,
  type ViewerFilm,
  type ViewerLight,
} from "@/components/TapeSlider/tape3d";
import { clarityOf, HOME_FILM, HOME_FINISH, HOME_LIGHT, modelOf } from "@/components/ProductIntro/rolls";
import { FINISH as PRODUCT_FINISH, STAGE_FILM as PRODUCT_FILM, STAGE_LIGHT as PRODUCT_LIGHT } from "@/components/ProductIntro/roll";
import * as Reason from "@/components/Reason/roll";
import Panel, { type Params } from "../Panel";

type Roll = { id: string; model: string; bg: string };
type Props = { tapes: Roll[]; rolls: Roll[] };

/* THE THREE CALL SITES, verbatim. Each returns the exact arguments that page
   hands createTapeViewer, so the lab and the site cannot drift. */
type Mount = {
  urls: string[];
  show: string;
  light?: ViewerLight;
  finish?: MaterialFinishes;
  film?: ViewerFilm;
  bg: string;
};
const STAGES = {
  /* ProductIntro/roll.ts: createTapeViewer(mount, [model], STAGE_LIGHT, FINISH, { clarity, ...STAGE_FILM }) */
  product: (t: Roll): Mount => {
    const url = modelOf(t);
    return {
      urls: [url],
      show: url,
      light: PRODUCT_LIGHT,
      finish: PRODUCT_FINISH,
      film: { clarity: clarityOf(t.id) ?? 0, ...PRODUCT_FILM },
      bg: t.bg,
    };
  },
  /* TapeSlider/engine.ts: createTapeViewer(keyVisual, modelUrls, HOME_LIGHT, HOME_FINISH, { clarity, ...HOME_FILM }) */
  home: (t: Roll, rolls: Roll[]): Mount => ({
    urls: [t.model, ...rolls.filter((r) => r !== t).map((r) => r.model)],
    show: t.model,
    light: HOME_LIGHT,
    finish: HOME_FINISH,
    film: {
      clarity: Object.fromEntries(rolls.map((r) => [r.model, clarityOf(r.id) ?? 0])),
      ...HOME_FILM,
    },
    bg: t.bg,
  }),
  /* Reason/roll.ts: createTapeViewer(box, [MODEL], { key, ambient, fill, env, lamp }, FINISH, FILM) */
  reason: (): Mount => ({
    urls: [Reason.MODEL],
    show: Reason.MODEL,
    light: { key: Reason.KEY, ambient: Reason.AMBIENT, fill: Reason.FILL, env: Reason.ROOM, lamp: Reason.LAMP },
    finish: Reason.FINISH,
    film: Reason.FILM,
    bg: "#f1ead9",
  }),
};
type StageName = keyof typeof STAGES;

const num = (o: object) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "number")) as Record<string, number>;
const FILM0 = num(FILM);
const GLASS0 = num(GLASS);
/* Changing these means redrawing the noise maps, not just re-reading them. */
const MAP_KEYS = new Set(["MOTTLE", "MOTTLE_TINT", "SMUDGE", "GRAIN"]);

const RANGE: Record<string, [number, number, number]> = {
  key: [0, 3, 0.01], ambient: [0, 2, 0.01], fill: [0, 3, 0.01], env: [0, 2, 0.01],
  lampX: [-4, 4, 0.05], lampY: [-4, 4, 0.05], lampZ: [-2, 4, 0.05], lampPower: [0, 6, 0.02],
  metalness: [0, 1, 0.01], roughness: [0, 2, 0.01],
  AMOUNT: [0, 1, 0.01], GLOSS: [0, 1, 0.01], MOTTLE: [0, 1, 0.01], MOTTLE_TINT: [0, 0.5, 0.005],
  SMUDGE: [0, 6, 0.05], TOOTH: [0, 1.5, 0.01], GLAZE: [0, 1, 0.01], GLAZE_ROUGH: [0, 1, 0.01],
  FACE_GLOSS: [0, 1, 0.01], CAST_MIX: [0, 4, 0.05], INNER: [0, 1, 0.01], GRAIN: [1, 16, 1],
  ANISO: [0, 1, 0.01], ANISO_TURN: [0, 3.14, 0.01], EDGE: [0.5, 8, 0.05], SHEEN: [0, 0.5, 0.005],
  clarity: [0, 1, 0.005], spin: [-360, 360, 1],
};
const range = (_g: string, f: string): [number, number] => {
  const r = RANGE[f];
  return r ? [r[0], r[1]] : [0, 1];
};
const step = (_g: string, f: string) => RANGE[f]?.[2] ?? 0.01;

export default function Tuner({ tapes, rolls }: Props) {
  const [stage, setStage] = useState<StageName>("product");
  const [pick, setPick] = useState(0);
  const [defaults, setDefaults] = useState<Params | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<TapeViewer | null>(null);
  const mount = useRef<Mount | null>(null);
  const prev = useRef<Params | null>(null);

  const list = stage === "home" ? rolls : tapes;
  const roll = list[Math.min(pick, list.length - 1)];

  useEffect(() => {
    const el = box.current;
    if (!el || !roll) return;
    const m =
      stage === "reason" ? STAGES.reason() : stage === "home" ? STAGES.home(roll, rolls) : STAGES.product(roll);
    mount.current = m;
    el.style.background = m.bg;
    let gone = false;
    setDefaults(null);
    createTapeViewer(el, m.urls, m.light, m.finish, m.film).then((v) => {
      if (gone) return v.dispose();
      viewer.current = v;
      v.show(m.show);
      const lit = { ...(m.film ? FILM_LIGHT : LIGHT), ...m.light };
      const lamp = m.light?.lamp ?? { x: 0, y: 0, z: 0, power: 0 };
      const p: Params = {
        light: { key: lit.key, ambient: lit.ambient, fill: lit.fill, env: lit.env,
          lampX: lamp.x, lampY: lamp.y, lampZ: lamp.z, lampPower: lamp.power },
      };
      for (const mat of v.tune.materials()) {
        const f = { ...m.finish?.["*"], ...m.finish?.[mat.name] };
        p[`mat ${mat.name}`] = {
          metalness: f.metalness ?? mat.metalness,
          roughness: f.roughness ?? mat.roughness,
        };
      }
      if (m.film) {
        const c = m.film.clarity;
        p.film = { clarity: typeof c === "object" ? c[m.show] ?? 0 : c ?? 0, ...FILM0, ...num(m.film.knobs ?? {}) };
        p.glass = { ...GLASS0, ...num(m.film.glass ?? {}) };
      }
      p.view = { spin: 0 };
      prev.current = null;
      setDefaults(p);
    });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      viewer.current?.point(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      gone = true;
      window.removeEventListener("pointermove", onMove);
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [stage, roll, rolls]);

  const apply = useCallback((p: Params) => {
    const v = viewer.current;
    if (!v) return;
    const l = p.light;
    v.tune.light({
      key: l.key, ambient: l.ambient, fill: l.fill, env: l.env,
      lamp: l.lampPower > 0 ? { x: l.lampX, y: l.lampY, z: l.lampZ, power: l.lampPower } : undefined,
    });
    v.tune.finish(finishOf(p));
    if (p.film) {
      const { clarity, ...film } = p.film;
      const recut = !prev.current || [...MAP_KEYS].some((k) => prev.current!.film[k] !== film[k]);
      v.tune.refilm({ recut, clarity, knobs: film, glass: p.glass });
    }
    v.spin(p.view.spin);
    prev.current = p;
  }, []);

  const dump = (p: Params) => {
    const l = p.light;
    const out = {
      light: { key: l.key, ambient: l.ambient, fill: l.fill, env: l.env,
        ...(l.lampPower > 0 ? { lamp: { x: l.lampX, y: l.lampY, z: l.lampZ, power: l.lampPower } } : {}) },
      finish: finishOf(p),
      ...(p.film ? { clarity: p.film.clarity, knobs: diff(p.film, FILM0), glass: diff(p.glass, GLASS0) } : {}),
    };
    return JSON.stringify(out, null, 2);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#ddd" }}>
      <div style={{ position: "fixed", top: 8, left: 8, zIndex: 1000, display: "flex", gap: 6, font: "12px ui-monospace, monospace" }}>
        <select value={stage} onChange={(e) => { setStage(e.target.value as StageName); setPick(0); }}>
          <option value="product">product page</option>
          <option value="home">home slider</option>
          <option value="reason">reason section</option>
        </select>
        {stage !== "reason" && (
          <select value={pick} onChange={(e) => setPick(Number(e.target.value))}>
            {list.map((r, i) => (
              <option key={r.id} value={i}>{r.id}</option>
            ))}
          </select>
        )}
      </div>
      {/* The site's stages size the canvas from their own stylesheet; this box has to. */}
      <style>{`[data-lab3d] canvas { width: 100%; height: 100%; display: block; }`}</style>
      <div ref={box} data-lab3d style={{ width: "60vmin", height: "60vmin", position: "relative" }} />
      {defaults && (
        <Panel
          key={`${stage}/${roll?.id}`}
          title={`3d — ${stage}${roll && stage !== "reason" ? ` / ${roll.id}` : ""}`}
          defaults={defaults}
          apply={apply}
          range={range}
          step={step}
          dump={dump}
        />
      )}
    </div>
  );
}

/* Only the materials the sliders moved off the export, so the JSON is the
   finish to paste and not every material in the file. */
function finishOf(p: Params): MaterialFinishes {
  const out: MaterialFinishes = {};
  for (const [g, v] of Object.entries(p)) {
    if (g.startsWith("mat ")) out[g.slice(4)] = { metalness: v.metalness, roughness: v.roughness };
  }
  return out;
}
function diff(a: Record<string, number>, base: Record<string, number>) {
  return Object.fromEntries(Object.entries(a).filter(([k, v]) => k in base && base[k] !== v));
}
