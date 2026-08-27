"use client";

/* LAB — the peeling U, and taping it back.
 *
 * This is the mount and the state machine; scene.ts is the three, glyph.ts is
 * the measuring. Loaded over the real hero (see lab/peel-letter) rather than
 * built into it, so the homepage is untouched while the idea is being argued
 * about.
 *
 * THE STATE MACHINE, and the point of it is that there is no transition to
 * design between the peel and the taping:
 *
 *   waiting  the reveal is still writing the headline. Nothing here has run.
 *   peeled   the U has lifted and is BREATHING. It never finishes — a flap
 *            that has settled is a thing that has happened, and a flap that is
 *            still moving is a thing asking to be dealt with. This is the
 *            resting state of the page, not a beat between two others.
 *   arming   tape mode is on. Two anchors are showing. Nothing has changed
 *            about the letter: the mode only decides what a click MEANS.
 *   dragging one anchor taken, a strip following the pointer.
 *   sticking the strip is down and pulling. `peel` is being driven to 0 by the
 *            tape rather than by the idle — the SAME number, a different hand
 *            on it, which is the whole reason it is one number.
 *   stuck     done. The wordmark now has a piece of tape across it.
 *
 * A rejected strip does not reset anything: it slaps, goes orange, and comes
 * off, and the machine drops back to `arming` with the letter exactly as it
 * was. Nothing is ever undone, because nothing is ever finished.
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { whenRevealed } from "@/components/Preloader/gate";
import type { PeelScene } from "./scene";

/** How long after the section goes live the headline has finished arriving.
    REVEAL.DURATION + the shuffled stagger across "BY YOU" + the delay, rounded
    up — this is a lab, and a beat of slack is cheaper than importing the
    reveal's private timings. */
const AFTER_REVEAL = 1500;

/** Pointer distance, in px, at which an anchor takes the click. Generous: the
    flap tip is a moving target and a mode you can miss is a mode that feels
    broken rather than one you feel skilful in. */
const SNAP = 78;

type Mode = "waiting" | "peeled" | "arming" | "dragging" | "sticking" | "stuck";

type Pt = { x: number; y: number };

/** Do AB and CD cross? Plain 2D — both the strip and the fold are drawn on the
    wall, so this is the whole validity test. */
function crosses(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const side = (p: Pt, q: Pt, r: Pt) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return (
    side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b)
  );
}

export default function PeelLetter() {
  const mountRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const crossRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("waiting");
  const [ready, setReady] = useState(false);

  /* Everything the ticker touches lives in refs: React re-renders the chrome,
     it does not drive a frame. */
  const api = useRef<{
    scene: PeelScene | null;
    /* The one number. See scene.ts. */
    peel: { p: number; wobble: number; press: number };
    mode: Mode;
    /* The taken anchor and the live pointer, both in the LETTER'S plane so
       they survive the page scrolling under them. */
    a: Pt | null;
    b: Pt | null;
    valid: boolean;
    stuck: boolean;
  }>({
    scene: null,
    peel: { p: 0, wobble: 1, press: 0 },
    mode: "waiting",
    a: null,
    b: null,
    valid: false,
    stuck: false,
  });

  api.current.mode = mode;

  useEffect(() => {
    const S = api.current;
    let killed = false;
    let stopTicker: (() => void) | null = null;
    let charEl: HTMLElement | null = null;

    const mount = mountRef.current;
    if (!mount) return;

    /* The section is the homepage's real hero — this is loaded over it, so the
       letter is found rather than owned. Second line of the headline, last
       letter of it: the U of BY YOU, which has nothing after it for a hanging
       flap to collide with. */
    function findChar(): HTMLElement | null {
      const lines = document.querySelectorAll<HTMLElement>(
        ".hero-section .h1 .line",
      );
      const last = lines[lines.length - 1];
      if (!last) return null;
      const chars = last.querySelectorAll<HTMLElement>(".char");
      return chars[chars.length - 1] ?? null;
    }

    async function start(mountEl: HTMLElement) {
      /* The Adobe kit is domain-locked and arrives late; rasterising before it
         lands would draw the letter in Arial Narrow and hand THAT to the GPU
         as "the font". noteFace.ts hits the same wall and answers it the same
         way. */
      if (document.fonts?.ready) await document.fonts.ready;
      if (killed) return;

      const el = findChar();
      if (!el) return;
      charEl = el;

      const { createPeelScene } = await import("./scene");
      if (killed) return;

      const scene = createPeelScene(mountEl, el);
      if (!scene) return;
      S.scene = scene;

      /* The DOM letter goes, and its BOX STAYS — visibility, not display. The
         row is a flex row of letter boxes and removing one would re-centre the
         other five. */
      el.style.visibility = "hidden";

      const onResize = () => scene.resize();
      window.addEventListener("resize", onResize);

      const tick = (time: number) => {
        scene.frame(time, S.peel.p, S.peel.wobble);
        paintChrome();
      };
      gsap.ticker.add(tick);
      stopTicker = () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", onResize);
      };

      setReady(true);
      setMode("peeled");

      /* The lift. Quick out of the wall and slow into the hang — it is a thing
         coming unstuck, which is fast, and then a thing hanging, which is not.
         Peel/peel.ts's BEAT makes the same call for the same reason. */
      gsap.to(S.peel, {
        p: 0.6,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.15,
      });
    }

    /** The rings and the crosshair, moved per frame. DOM rather than more
        WebGL: they are UI, they want to be crisp, and they are two divs. */
    function paintChrome() {
      const scene = S.scene;
      if (!scene) return;

      const showAnchors = S.mode === "arming" || S.mode === "dragging";

      const tip = scene.flapTip();
      const wall = scene.wallAnchor();

      for (const [el, pt, taken] of [
        [tipRef.current, tip, S.a !== null],
        [wallRef.current, wall, S.a !== null],
      ] as const) {
        if (!el) continue;
        el.style.opacity = showAnchors ? "1" : "0";
        el.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) scale(${taken ? 0.72 : 1})`;
      }

      if (S.a && S.b) {
        const a = scene.localToScreen(S.a.x, S.a.y);
        const b = scene.localToScreen(S.b.x, S.b.y);
        scene.setTape(a, b, S.peel.press, S.valid);
      } else {
        scene.setTape(null, null, 0, false);
      }
    }

    /** Both anchors, in viewport px, this frame. */
    function anchors(): { tip: Pt; wall: Pt } | null {
      const scene = S.scene;
      if (!scene) return null;
      return { tip: scene.flapTip(), wall: scene.wallAnchor() };
    }

    function snap(p: Pt): Pt {
      const at = anchors();
      if (!at) return p;
      const near = [at.tip, at.wall]
        .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) }))
        .sort((m, n) => m.d - n.d)[0];
      return near.d < SNAP ? near.q : p;
    }

    function onMove(e: PointerEvent) {
      const cross = crossRef.current;
      if (cross) {
        cross.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
      const scene = S.scene;
      if (!scene || S.mode !== "dragging" || !S.a) return;

      const p = snap({ x: e.clientX, y: e.clientY });
      S.b = scene.screenToLocal(p.x, p.y);

      const fold = scene.foldLine();
      const a = scene.localToScreen(S.a.x, S.a.y);
      S.valid = crosses(
        a,
        p,
        { x: fold.ax, y: fold.ay },
        { x: fold.bx, y: fold.by },
      );
    }

    function onDown(e: PointerEvent) {
      const scene = S.scene;
      if (!scene) return;
      if (S.mode !== "arming" && S.mode !== "dragging") return;

      /* The chrome is the one thing in tape mode that is still a button. */
      if ((e.target as HTMLElement)?.closest?.("[data-pl-ui]")) return;

      e.preventDefault();
      const p = snap({ x: e.clientX, y: e.clientY });

      if (S.mode === "arming") {
        S.a = scene.screenToLocal(p.x, p.y);
        S.b = S.a;
        S.valid = false;
        setMode("dragging");
        return;
      }

      if (!S.valid) {
        reject();
        return;
      }
      commit();
    }

    /** The strip is down and it is holding. `peel` is handed to the tape. */
    function commit() {
      setMode("sticking");
      gsap
        .timeline({ onComplete: () => setMode("stuck") })
        /* The slap: the strip springs to its width. */
        .to(S.peel, { press: 1, duration: 0.3, ease: "back.out(2.2)" })
        /* And then it PULLS. Overlapped, so the letter is already on its way
           down while the strip is still settling — end to end would read as two
           events, and this is one. */
        .to(
          S.peel,
          { p: 0, wobble: 0, duration: 0.62, ease: "power2.inOut" },
          "-=0.16",
        );
    }

    /** A strip that is not across the fold holds nothing. It goes on anyway,
        goes orange, and comes off — the letter is untouched, which is the
        point: there is nothing to undo. */
    function reject() {
      const held = S.mode;
      setMode("sticking");
      gsap
        .timeline({
          onComplete: () => {
            S.a = null;
            S.b = null;
            S.peel.press = 0;
            setMode(held === "dragging" ? "arming" : "arming");
          },
        })
        .to(S.peel, { press: 1, duration: 0.22, ease: "back.out(3)" })
        .to(S.peel, { press: 0, duration: 0.3, ease: "power2.in", delay: 0.18 });
    }

    /* G parks the letter flat and unpeeled — the alignment check. Hold the
       DOM letter back on beside it and the two should be one letter. */
    let ghost = false;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMode("peeled");
      if (e.key.toLowerCase() === "g") {
        ghost = !ghost;
        S.scene?.setGhost(ghost);
        if (charEl) charEl.style.visibility = ghost ? "" : "hidden";
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);

    /* After the cover, and then after the headline has written itself: the
       letter cannot be measured until it is standing where it will stand. */
    const stopGate = whenRevealed(() => {
      window.setTimeout(() => {
        if (!killed) void start(mount);
      }, AFTER_REVEAL);
    });

    return () => {
      killed = true;
      stopGate();
      stopTicker?.();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
      if (charEl) charEl.style.visibility = "";
      S.scene?.dispose();
      S.scene = null;
      document.documentElement.classList.remove("tape-mode");
    };
  }, []);

  /* The mode's side effects on the page — the scroll lock, the cursor, the
     class the chrome is styled off. Separate from the machine above because
     they are consequences of the state rather than part of it. */
  useEffect(() => {
    const on = mode === "arming" || mode === "dragging" || mode === "sticking";
    document.documentElement.classList.toggle("tape-mode", on);
    if (!on) return;

    const eat = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", eat, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", eat, true);
  }, [mode]);

  useEffect(() => {
    if (mode !== "peeled") return;
    const S = api.current;
    S.a = null;
    S.b = null;
    S.peel.press = 0;
  }, [mode]);

  function reset() {
    const S = api.current;
    S.a = null;
    S.b = null;
    S.peel.press = 0;
    gsap.to(S.peel, { p: 0.6, wobble: 1, duration: 0.7, ease: "power2.out" });
    setMode("peeled");
  }

  const hint =
    mode === "arming"
      ? "PICK THE FLAP, THEN THE WALL"
      : mode === "dragging"
        ? "PLACE THE OTHER END ACROSS THE FOLD"
        : mode === "stuck"
          ? "STUCK."
          : "";

  return (
    <>
      <style>{PL_CSS}</style>

      {/* The letter's canvas. Fixed and full-bleed, and it never takes a
          click — every pointer event in this component is on window, because
          the targets are computed in viewport px anyway. */}
      <div className="pl-mount" ref={mountRef} aria-hidden="true" />

      <div className="pl-ui" aria-hidden="true">
        <div className="pl-ring pl-ring--tip" ref={tipRef} />
        <div className="pl-ring pl-ring--wall" ref={wallRef} />
        <div className="pl-cross" ref={crossRef}>
          <span />
          <span />
        </div>
      </div>

      <div className="pl-bar" data-pl-ui>
        <button
          type="button"
          className="pl-btn"
          disabled={!ready || mode === "sticking"}
          onClick={() =>
            setMode((m) =>
              m === "arming" || m === "dragging" ? "peeled" : "arming",
            )
          }
        >
          <span className="pl-btn__arrow" aria-hidden="true">
            ↗
          </span>
          {mode === "arming" || mode === "dragging" ? "EXIT" : "TAPE MODE"}
        </button>

        <button type="button" className="pl-btn pl-btn--ghost" onClick={reset}>
          RESET
        </button>

        {hint && <p className="pl-hint">{hint}</p>}
      </div>
    </>
  );
}

/* Scoped to this lab and injected rather than added to global.css: nothing on
   the real site references any of it, and a prototype should be deletable by
   deleting its folder. */
const PL_CSS = `
.pl-mount {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}
.pl-mount canvas { width: 100%; height: 100%; display: block; }

.pl-ui {
  position: fixed;
  inset: 0;
  z-index: 41;
  pointer-events: none;
}

.pl-ring {
  position: absolute;
  top: 0; left: 0;
  width: 44px; height: 44px;
  margin: 0;
  border-radius: 50%;
  border: 2px solid #013900;
  opacity: 0;
  transition: opacity .22s ease;
  will-change: transform;
}
.pl-ring::after {
  content: "";
  position: absolute;
  inset: 15px;
  border-radius: 50%;
  background: #013900;
}
.pl-ring--wall { border-style: dashed; }

.tape-mode .pl-ring {
  animation: pl-pulse 1.6s ease-in-out infinite;
}
@keyframes pl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(1,57,0,.35); }
  50%      { box-shadow: 0 0 0 12px rgba(1,57,0,0); }
}

/* The crosshair. The site's own arrow is hidden under it rather than swapped
   for a CSS cursor — cursor.ts already owns the pointer and a native
   crosshair would be a second one. */
.pl-cross {
  position: absolute;
  top: 0; left: 0;
  width: 46px; height: 46px;
  opacity: 0;
  transition: opacity .2s ease;
  will-change: transform;
}
.tape-mode .pl-cross { opacity: 1; }
.pl-cross span {
  position: absolute;
  background: #013900;
}
.pl-cross span:first-child { left: 50%; top: 0; width: 2px; height: 100%; margin-left: -1px; }
.pl-cross span:last-child  { top: 50%; left: 0; height: 2px; width: 100%; margin-top: -1px; }

.tape-mode .cursor-arrow { opacity: 0 !important; }
.tape-mode { cursor: none; }

.pl-bar {
  position: fixed;
  left: 2.2vw;
  bottom: 2.2vw;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: .6rem;
  font-family: var(--font-heading);
}

.pl-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .7rem 1.1rem .6rem;
  border: 2px solid #013900;
  border-radius: 999px;
  background: #b6fe00;
  color: #013900;
  font: inherit;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: .04em;
  cursor: pointer;
  transition: transform .18s ease, background .18s ease, opacity .18s ease;
}
.pl-btn:hover { transform: translateY(-2px); }
.pl-btn:disabled { opacity: .4; cursor: default; transform: none; }
.pl-btn--ghost { background: transparent; }

.pl-btn__arrow {
  display: inline-block;
  font-size: 1.15em;
  line-height: 1;
  transform: rotate(-8deg);
}
.tape-mode .pl-btn__arrow { transform: rotate(82deg); }

.pl-hint {
  margin: 0 0 0 .4rem;
  color: #013900;
  font-size: .95rem;
  font-weight: 700;
  letter-spacing: .08em;
  background: rgba(182,254,0,.85);
  padding: .35rem .7rem .25rem;
  border-radius: 999px;
}
`;
