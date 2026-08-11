/* Vara ships no types — it is a 2019-era prototype-and-`module.exports` script
   (node_modules/vara/src/vara.js), which is also why the surface below is
   hand-written rather than generated. Only what this project actually calls is
   declared; the rest of the API is real but undeclared on purpose, so reaching
   for something untested is a type error rather than a runtime surprise.

   Read the shape of it as: a Vara is a font, a container, and a list of
   paragraphs. Everything optional falls back first to `properties` (the global
   object) and then to a default baked into the font JSON. */
declare module "vara" {
  /* Per-paragraph settings. A paragraph is one entry in the array handed to the
     constructor; `text` as an array is a set of EXPLICIT lines, which is how
     HandNote uses it — see hand.ts on why the breaks are not left to Vara. */
  export interface VaraText {
    text: string | string[];
    id?: string;
    /* Both in px, and both RELATIVE to the previous paragraph unless
       fromCurrentPosition says otherwise. */
    x?: number;
    y?: number;
    fromCurrentPosition?: { x?: boolean; y?: boolean };
    /* Not a size in the CSS sense: Vara measures a reference glyph rendered at
       this many px in the CONTAINER'S OWN css font and derives a scale factor
       from it. See the note on NOMINAL in hand.ts before touching it. */
    fontSize?: number;
    /* In the font's own units, not px — so it holds its weight relative to the
       letters at any size. */
    strokeWidth?: number;
    color?: string;
    /* Vara's own animation, in ms. Unused here: the drawing is a GSAP
       timeline, so that it can share a playhead with the ruled lines. */
    duration?: number;
    delay?: number;
    textAlign?: "left" | "center" | "right";
    letterSpacing?: number | Record<string, number>;
    lineHeight?: number;
    /* The width wrapping is measured against. Defaults to the container's. */
    width?: number;
    breakWord?: boolean;
    autoAnimation?: boolean;
    queued?: boolean;
  }

  /* The global fallbacks. lineHeight here is in FONT UNITS (the per-paragraph
     one above is in px) — a wrinkle of Vara's, and the reason HandNote sets it
     at this level. */
  export interface VaraProperties {
    fontSize?: number;
    strokeWidth?: number;
    color?: string;
    duration?: number;
    textAlign?: "left" | "center" | "right";
    letterSpacing?: number | Record<string, number>;
    lineHeight?: number;
    breakWord?: boolean;
    autoAnimation?: boolean;
  }

  export default class Vara {
    /* `elem` is a SELECTOR, not a node — Vara calls document.querySelector on
       it. The font is fetched by XHR from `fontSource`, so nothing exists in
       the container until ready() fires. */
    constructor(
      elem: string,
      fontSource: string,
      text: VaraText[],
      properties?: VaraProperties
    );
    ready(callback: () => void): void;
    animationEnd(callback: (id: string | number) => void): void;
    draw(id: string | number, duration?: number): void;
    playAll(): void;
  }
}
