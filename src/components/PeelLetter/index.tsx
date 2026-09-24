"use client";

/* The hero's badge coming unstuck, and the reader pressing it back.
 *
 * This is the mount and the game; scene.ts is the three, glyph.ts is the
 * measuring. It sits over the real hero and finds the badge (.hero-mark) in it
 * rather than owning it, so nothing under components/Hero changes.
 *
 * THE GAME is one rule: once the badge has dropped into the kicker it lifts off
 * the wall and breathes until it is tapped, and the tap presses it flat. Then
 * it stays down until the page is loaded afresh.
 *
 * It used to be the headline's letters, one after another (STICK BY YOU). The
 * headline keeps its arc and its entrance; only the peel moved here.
 */

import { useEffect } from "react";
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import { playOnce, SOUNDS } from "@/components/sound";
import { onViewportChange } from "@/components/viewport";
import type { Letter, PeelStage } from "./scene";
import { TUNE } from "./scene";

/** How long after the section goes live the badge has landed: MARK.DELAY +
    MARK.DURATION (Hero/mark.ts) plus a beat of slack. */
const AFTER_REVEAL = 1500;

/** The lift, off the wall: quick out and slow into the hang — it is a thing
    coming unstuck, which is fast, and then a thing hanging, which is not. */
const LIFT = { duration: 1.1, ease: "power3.out" };

/** Which tape the badge's back is cut from — the colour that shows when it
    curls. By slug, so a colour edited in the CMS follows; an unknown slug falls
    through to scene.ts's grey liner. */
const BACK = "opp-quiet"; // yellow

/** `palette`: the tapes' slugs and colours from the CMS, as the preloader
    gets them. */
export default function PeelLetter({ palette }: { palette: { id: string; bg: string }[] }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const back = palette.find((t) => t.id === BACK)?.bg;
    if (process.env.NODE_ENV !== "production" && !back) {
      console.warn(`[PeelLetter] BACK names "${BACK}", which is not a tape slug in the CMS.`);
    }

    const wrapper = document.querySelector<HTMLElement>(".hero-section .hero-wrapper");
    const top = document.querySelector<HTMLElement>(".hero-section .top");
    const mark = document.querySelector<HTMLImageElement>(".hero-section .hero-mark");
    if (!wrapper || !top || !mark) return;
    const field: HTMLElement = top;
    const badge: HTMLImageElement = mark;

    let killed = false;
    let stage: PeelStage | null = null;
    let logo: Letter | null = null;
    /* Up and waiting for the tap. */
    let up = false;
    let busy = false;
    let onScreen = true;

    /* The canvas over the lime field, and the one hit area, laid over
       the badge while it is up. Both live in the section so they scroll with it;
       the canvas takes no pointer, the hit area is the only thing that does.
       z-index 0 is over the type by tree order alone (it is the last child of
       the wrapper), which is where the badge paints too, and under the roll
       (2). The roll's mount takes no pointer, so a tap through it still lands
       on the hit area. */
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

    /** Stand a plane in the badge's place. On a rebuild it keeps its state —
        up stays up, pressed stays pressed. */
    async function build() {
      const { createPeelStage } = await import("./scene");
      if (killed) return;
      sizeMount();
      stage = createPeelStage(mount);
      const was = logo;
      logo = stage.addLetter(badge, TUNE.PHI, back);
      if (logo && was) {
        logo.p = was.p;
        logo.wobble = was.wobble;
        logo.active = was.active;
      }
      if (logo && up) placeHit(logo);
    }

    function lift() {
      const L = logo;
      if (!L) return;
      /* The DOM badge goes and the flat WebGL one is the same artwork in the
         same place (see LIGHT in scene.ts). It never comes back. */
      badge.style.visibility = "hidden";
      L.active = true;
      L.wobble = 1;
      gsap.to(L, { p: TUNE.IDLE.PEEL, ...LIFT });
      up = true;
      placeHit(L);
      hit.hidden = false;
    }

    /* The tap: pressed flat. Accelerating INTO the wall, not easing onto it —
       a thing pressed down arrives, it does not settle. */
    function press() {
      const L = logo;
      if (!L || !up || busy) return;
      busy = true;
      up = false;
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
       is a different size, so the raster is stale. Rebuild the stage and carry
       the state over. */
    const stopResize = onViewportChange(() => {
      if (!stage) return;
      stage.dispose();
      stage = null;
      void build();
    });

    async function start() {
      /* Rasterising before the SVG has decoded would hand the GPU nothing, and
         measuring it mid-drop (Hero/mark.ts) would nail the plane above the
         page — so wait for both, not for a guessed delay. */
      await badge.decode().catch(() => {});
      await Promise.all(gsap.getTweensOf(badge).map((t) => t.then()));
      if (killed) return;
      await build();
      if (killed || !stage) return;
      lift();
      if (process.env.NODE_ENV !== "production") {
        // Console handle, same convention as window.hero: peelGame.press()
        Object.assign(window, { peelGame: { press, lift, logo: () => logo } });
      }
    }

    /* After the cover, and then after the badge has dropped into its slot
       (Hero/mark.ts, 0.45 + 0.85s): it cannot be measured mid-fall. */
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
      if (logo) gsap.killTweensOf(logo);
      badge.style.visibility = "";
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
