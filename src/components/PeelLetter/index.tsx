"use client";

/* The headline coming unstuck, and the reader pressing it back.
 *
 * This is the mount and the game; scene.ts is the three, glyph.ts is the
 * measuring. It sits over the real hero and finds the headline's letters in
 * it rather than owning them, so nothing under components/Hero changes.
 *
 * THE GAME is one rule: a letter lifts off the wall and breathes until it is
 * tapped, the tap presses it flat, and the moment it is down another letter
 * lifts. There is nothing to arm, nothing to aim and nothing to read — the
 * flap is the invitation, the hand cursor is the confirmation and the press is
 * the answer. Every letter comes up once; when the last is down the headline
 * is still until the page is loaded afresh.
 *
 * THE BACKS ARE THE TAPES. Each letter's underside is one of the six tapes'
 * colours — which tape is which letter is BACKS below — so what the reader
 * sees when a letter curls is the palette the rest of the site is in.
 *
 * NO STRIP. There was one: the tap laid a piece of tape across the fold and
 * pulled the letter down. It was cut because the press alone reads — the
 * letter moves, you press it, it stays — and the strip was a second event on
 * top of that.
 */

import { useEffect } from "react";
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { playOnce, SOUNDS } from "@/components/sound";
import { onViewportChange } from "@/components/viewport";
import type { Letter, PeelStage } from "./scene";
import { TUNE } from "./scene";

/** How long after the section goes live the headline has finished arriving.
    REVEAL.DURATION + the shuffled stagger across the line + the delay,
    rounded up — a beat of slack is cheaper than importing the reveal's
    private timings. */
const AFTER_REVEAL = 1500;

/** The beat between one letter going down and the next coming up, in
    seconds. Short: the game is the chase. */
const NEXT_AFTER = 0.25;

/** The lift, off the wall: quick out and slow into the hang — it is a thing
    coming unstuck, which is fast, and then a thing hanging, which is not. */
const LIFT = { duration: 1.1, ease: "power3.out" };

/* Fisher–Yates. The order the letters come up in is the game's one secret. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Which tape each letter of STICK BY YOU is cut from — its back is that
    tape's colour. By slug, so a colour edited in the CMS follows. Tuned by
    eye: the U comes up first, on yellow. A slug the CMS does not know falls
    through to scene.ts's grey liner. */
const BACKS = [
  "masking", // S  orange
  "double", // T  light blue
  "stationery", // I  coral
  "cloth", // C  deep blue
  "opp", // K  lime
  "opp-quiet", // B  yellow
  "masking", // Y  orange
  "double", // Y  light blue
  "stationery", // O  coral
  "opp-quiet", // U  yellow
];

/** `palette`: the tapes' slugs and colours from the CMS, as the preloader
    gets them. */
export default function PeelLetter({ palette }: { palette: { id: string; bg: string }[] }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (process.env.NODE_ENV !== "production") {
      for (const id of BACKS) {
        if (!palette.some((t) => t.id === id)) {
          console.warn(`[PeelLetter] BACKS names "${id}", which is not a tape slug in the CMS.`);
        }
      }
    }

    const wrapper = document.querySelector<HTMLElement>(".hero-section .hero-wrapper");
    const top = document.querySelector<HTMLElement>(".hero-section .top");
    const chars = [...document.querySelectorAll<HTMLElement>(".hero-section .h1 .line .char")];
    if (!wrapper || !top || chars.length === 0) return;
    const field: HTMLElement = top;

    let killed = false;
    let stage: PeelStage | null = null;
    let letters: Letter[] = [];
    let current: Letter | null = null;
    let busy = false;
    let pool: Letter[] = [];
    let onScreen = true;

    /* The canvas over the lime field, and the one hit area, moved onto
       whichever letter is up. Both live in the section so they scroll with it;
       the canvas takes no pointer, the hit area is the only thing that does.
       z-index 0 is over the type by tree order alone — it is the last child
       of the wrapper and the letters carry no z-index — and UNDER both the
       badge in the kicker (.hero-mark, 1) and the roll (2): the letters are on
       the wall, the badge is dropped onto them and the roll stands in front of
       all of it, so a flap near either goes behind it. It WAS 1, and the
       canvas draws every letter flat from its first frame, so the moment the
       game started STICK painted over the badge that had just landed on it.
       The roll's mount takes no pointer, so a tap through it still lands on
       the hit area. */
    const mount = document.createElement("div");
    mount.className = "pl-stage";
    mount.setAttribute("aria-hidden", "true");
    const hit = document.createElement("div");
    hit.className = "pl-hit";
    hit.setAttribute("data-cursor", "");
    hit.hidden = true;
    mount.append(hit);
    wrapper.append(mount);

    function sizeMount() {
      mount.style.top = `${field.offsetTop}px`;
      mount.style.height = `${field.offsetHeight}px`;
    }

    function placeHit(L: Letter) {
      const r = L.hitRect();
      hit.style.transform = `translate(${r.x}px, ${r.y}px)`;
      hit.style.width = `${r.w}px`;
      hit.style.height = `${r.h}px`;
    }

    /** Stand a plane in every letter's place. On a rebuild the letters keep
        their state — the one that is up stays up, the taped stay taped. */
    async function build() {
      const { createPeelStage } = await import("./scene");
      if (killed) return;
      sizeMount();
      stage = createPeelStage(mount);
      const was = letters;
      letters = [];
      chars.forEach((el, i) => {
        /* The lean alternates letter by letter so the flaps do not all hang
           the same way down the line. */
        const back = palette.find((t) => t.id === BACKS[i % BACKS.length])?.bg;
        const L = stage!.addLetter(el, TUNE.PHI * (i % 2 ? 1 : -1), back);
        if (!L) return;
        const prev = was.find((w) => w.el === el);
        if (prev) {
          L.p = prev.p;
          L.wobble = prev.wobble;
          L.active = prev.active;
          if (prev === current) current = L;
        }
        letters.push(L);
      });
      pool = pool.map((w) => letters.find((L) => L.el === w.el)!).filter(Boolean);
      if (current) placeHit(current);
    }

    function lift() {
      const L = pool.shift();
      if (!L) {
        hit.hidden = true;
        return;
      }
      current = L;
      /* The DOM letter goes and its BOX STAYS — visibility, not display. The
         row is a flex row of letter boxes and removing one would re-centre
         the rest. It never comes back: the flat WebGL letter is the same ink
         in the same place (see LIGHT in scene.ts). */
      L.el.style.visibility = "hidden";
      L.active = true;
      L.wobble = 1;
      gsap.to(L, { p: TUNE.IDLE.PEEL, ...LIFT });
      placeHit(L);
      hit.hidden = false;
    }

    /* The tap: the letter is pressed flat. Accelerating INTO the wall, not
       easing onto it — a thing pressed down arrives, it does not settle. */
    function press() {
      const L = current;
      if (!L || busy) return;
      busy = true;
      hit.hidden = true;
      playOnce(SOUNDS.TAPE_PRESS);
      gsap.killTweensOf(L);
      gsap.to(L, {
        p: 0,
        wobble: 0,
        duration: 0.45,
        ease: "power3.in",
        onComplete: () => {
          busy = false;
          current = null;
          gsap.delayedCall(NEXT_AFTER, () => {
            if (!killed) lift();
          });
        },
      });
    }

    /* NO HOVER LIFT. There was one — the flap rose a touch under the hand —
       and it read as a glitch: it started a second peel tween on top of the
       lift, and a cursor resting on the hit box's edge fired enter/leave over
       and over, so the flap jittered. The hand cursor is the hover answer. */
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      press();
    };
    hit.addEventListener("pointerdown", onDown);

    /* Scrolled past: the canvas is in the section, so nothing is drawn for
       the rest of the document — but the ticker is still paid for. Gate it. */
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(mount);

    const tick = (time: number) => {
      if (onScreen) stage?.frame(time);
    };
    gsap.ticker.add(tick);

    /* A real resize (viewport.ts filters out the phone's toolbar): the type
       is a different size, so every raster is stale. Rebuild the stage and
       carry the state over. */
    const stopResize = onViewportChange(() => {
      if (!stage) return;
      stage.dispose();
      stage = null;
      void build();
    });

    async function start() {
      /* The Adobe kit is domain-locked and arrives late; rasterising before it
         lands would draw the letters in the fallback and hand THAT to the GPU
         as "the font". noteFace.ts hits the same wall and answers it the same
         way. */
      if (document.fonts?.ready) await document.fonts.ready;
      if (killed) return;
      await build();
      if (killed || !stage) return;
      /* The U of BY YOU first — the one letter with nothing under it for a
         flap to hang over — then the rest in no order anyone can learn. */
      const last = letters[letters.length - 1];
      pool = [last, ...shuffle(letters.slice(0, -1))];
      lift();
      if (process.env.NODE_ENV !== "production") {
        // Console handle, same convention as window.hero: peelGame.press()
        Object.assign(window, { peelGame: { press, lift, letters, pool: () => pool } });
      }
    }

    /* After the cover, and then after the headline has written itself: the
       letters cannot be measured until they are standing where they will
       stand. */
    const stopGate = whenRevealed(() => {
      window.setTimeout(() => {
        if (!killed) void start();
      }, AFTER_REVEAL);
    });

    return () => {
      killed = true;
      stopGate();
      stopResize();
      gsap.ticker.remove(tick);
      io.disconnect();
      gsap.killTweensOf(letters);
      for (const L of letters) L.el.style.visibility = "";
      stage?.dispose();
      stage = null;
      mount.remove();
    };
  }, [palette]);

  return <style>{PL_CSS}</style>;
}

/* Scoped to this component and injected rather than added to global.css:
   nothing else on the site references it. */
const PL_CSS = `
.pl-stage {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 0;
  pointer-events: none;
}
.pl-stage canvas { width: 100%; height: 100%; display: block; }
.pl-hit {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: auto;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
`;
