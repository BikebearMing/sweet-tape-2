"use client";

/* LAB — the mark as a sticker: it pops up, bends, catches the light, and falls.
 *
 * Not a route anyone links to. The question it exists to answer is whether the
 * preloader's four-second overture can be replaced by one gesture — the thing
 * arriving as an OBJECT rather than as a peel plus a tilt. The reference is a
 * sprite sheet off a video: a card springs up off the ground, its shape flexes
 * as it settles, a sheen pans across it, and then it drops.
 *
 * IT IS THE REAL ARTWORK, at the size the preloader draws it. A stand-in would
 * answer an easier question: the mark is 191 x 118 of dark green with white
 * letters inside a lime keyline, and whether a sheen reads across THAT — over
 * the letters as well as the field — is most of what is being asked.
 *
 * NO WEBGL, DELIBERATELY, and this is the constraint the whole approach is cut
 * to. The preloader is the first thing painted on a cold load; it runs against
 * hydration, against the hero's three, and against the type. A canvas booting a
 * context, compiling a shader and rasterising a texture is exactly the cost the
 * cover exists to hide, and it would be paid at the one moment nothing can
 * spare it. So the bend is CSS 3D and the artwork stays a 5 kB SVG — crisp at
 * any width, nothing to decode, nothing to compile.
 *
 * HOW THE BEND IS FAKED, which is the same instinct as components/Peel and one
 * step further on. Peel is two copies of an image and one fold line. This is N
 * copies, each clipped to its own vertical column — one background-image, sized
 * to the whole mark and slid left by that column's offset, so the ink is
 * continuous across the joins — and each column is then placed on a curve in 3D
 * and turned to face along it. A chord approximation of a bending strip:
 *
 *   theta(u)   the surface's tangent angle at u, the fraction along the mark.
 *              An arc (bend) plus a travelling sine (wave); both decay.
 *   x, z       integrated along the strip, ds at a time, so ARC LENGTH IS
 *              CONSERVED. That is the whole reason this reads as material and
 *              not as a squash: a bending sticker keeps its length and loses
 *              its width, and integrating rather than interpolating is what
 *              gets that for free.
 *   brightness per column, off its own angle — the columns turning away from
 *              the light go down. Without it a bent thing is a flat thing in a
 *              funny outline.
 *
 * THE SHEEN IS ONE GRADIENT, NOT N. Each column carries the same white band
 * sized to the WHOLE mark and offset by that column's position, so what crosses
 * the shape is one continuous highlight rather than twenty-four lit rectangles.
 * It is masked by the artwork's own alpha, so it lights the mark and not the
 * box around it.
 *
 * Everything below the stage is tuning. The timeline is rebuilt whenever a
 * number moves, and SCRUB parks it so a single frame can be looked at.
 */

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";

/* The mark, exactly as components/Preloader loads it. */
const MARK = "/assets/preloader-image.svg";
const ART_W = 191;
const ART_H = 118;

/* The pose the stage draws, written by the timeline and read by the ticker.
   A plain object rather than React state: it changes every frame, and a
   re-render per frame to move one transform is the wrong shape. */
type Pose = {
  /* the whole mark */
  scale: number;
  rotX: number;
  rotZ: number;
  y: number;
  alpha: number;
  /* the surface */
  bend: number; // total arc across the mark, radians
  fold: number; // how far the flap beyond the crease is turned back, radians
  wave: number; // travelling flex on top of the arc, radians
  phase: number; // where the wave is
  /* the light */
  sheen: number; // 0 = off the left, 1 = off the right
};

/* WHAT THE PRELOADER IS ACTUALLY RUNNING. These are not a starting point — they
 * are STICKER in Preloader/sticker.ts, copied across, so this page opens on the
 * live gesture and a change made here is a change to something real.
 *
 * KEEP THEM IN STEP BY HAND, which is the one chore this lab costs. They were
 * allowed to drift apart once and the lab quietly stopped being evidence: it
 * showed a different animation from the site while looking like the same one.
 *
 * THREE OF THEM ARE PX HERE AND FRACTIONS THERE, because the real mark is 15vw
 * (46vw on a phone) and a gesture written in px would be a different gesture on
 * every screen. At the width below they are the same numbers; carrying one back
 * means dividing by the mark's width:
 *
 *   perspective 1650  ->  DEPTH 6.6     (x width)
 *   rise 16           ->  POP.RISE 0.064
 *
 * THE FALL IS THIS LAB'S ALONE NOW. The cover dropped it — the mark holds flat
 * after the settle and leaves on the paper it is printed on — so STICKER has no
 * FALL block to carry these back to, and `hold` has nothing to be measured
 * against either. The sliders stay because this is the place the gesture would
 * be re-tuned if it were ever wanted again. */
const DEFAULTS = {
  /* geometry */
  slices: 64,
  markW: 250,
  perspective: 1650, // = markW x 6.6
  originY: 25, // % — near the top, so it hinges like a thing stuck along its top edge
  overlap: 1.3, // px of bleed per column, to close the hairlines at the joins

  /* the pop */
  popDur: 0.92,
  popScale: 0.62,
  popTilt: -78, // rotX it starts at: lying away from the viewer, near edge-on
  popRise: 16, // px it travels up as it stands = markW x 0.064
  popBack: 2.8, // back.out overshoot

  /* the flex */
  bend0: 0.9, // radians of arc at the moment it lands

  /* THE FOLD — a corner turned back on itself, which is the only shape that
     shows the mark's UNDERSIDE. An arc, however deep, does not: past about a
     quarter turn it is a tight roll, and a roll hides its own back behind its
     own front. What shows a back is a CREASE with a flap lying over it. */
  fold0: 2.6, // radians past the crease. Pi is the flap folded flat on itself
  foldAt: 0.72, // where the crease sits, 0 at the left edge of the mark
  crease: 0.12, // half-width of the crease. Small is a sharp fold

  /* The wobble after it lands. Kept under one cycle across the mark on
     purpose — a travelling wave at more than that IS a flag. */
  wave0: 0.45, // radians of travelling flex
  waveFreq: 0.9,
  waveSpin: 0.3, // turns per second the wave travels

  flexAt: 0.5, // when the unroll starts, x popDur
  unroll: 0.7, // seconds the curled edge takes to lay down
  settle: 1.3, // seconds the wobble after it takes to die
  elastic: 0.38, // elastic.out damping on the wobble — lower is rubberier

  /* the light */
  sheenAt: 0.5, // with the fold, not with the pop — a highlight wants a shape
  sheenDur: 0.84,
  sheenBand: 30, // half-width of the highlight, % of the mark
  sheenPower: 0.16,
  sheenTilt: 118, // deg — the band's lean
  sheenScreen: 1, // blend it rather than paint it

  /* the light on the surface */
  shade: 0.48,

  /* the underside */
  back: 1, // draw it at all — off is the old two-faced flag
  backShade: 0.3,

  /* the fall */
  hold: 2.08, // what the cover's "wait for the line" works out to
  fallDur: 0.62,
  fallTilt: 84,
  fallDrop: 172, // = markW x 0.688
  fallScale: 0.76,
  fallBend: -0.5,
  fallFold: 0.9, // it comes unstuck at the crease on the way down, too

  /* the loop */
  gap: 1.2,
};

type Params = typeof DEFAULTS;

export default function StickerPopLab() {
  const [p, setP] = useState<Params>(DEFAULTS);
  const [loop, setLoop] = useState(true);
  const [scrub, setScrub] = useState<number | null>(null);
  const [lime, setLime] = useState(true);
  const [flat, setFlat] = useState(false);

  const set = <K extends keyof Params>(k: K) => (v: Params[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const markRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sheenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);
  /* Which way each column is facing, last time it was looked at. The flip is
     three writes and most columns do not flip on most frames. */
  const facing = useRef<boolean[]>([]);

  const pose = useRef<Pose>({
    scale: 1,
    rotX: 0,
    rotZ: 0,
    y: 0,
    alpha: 1,
    bend: 0,
    fold: 0,
    wave: 0,
    phase: 0,
    sheen: 0,
  });

  const H = (p.markW * ART_H) / ART_W;
  const sliceW = p.markW / p.slices;
  const cols = useMemo(
    () => Array.from({ length: p.slices }, (_, i) => i),
    [p.slices],
  );

  /* THE TIMELINE. Rebuilt whenever a number moves — it is a handful of tweens
     on one object and cheaper to throw away than to keep in step.

     Written as absolute beats off the pop, the way Preloader/reveal.ts is: the
     numbers are easier to read against each other than a chain of "and then",
     and the two that are constrained are constrained loudly. SHEEN must land
     while the flex is still alive or the highlight crosses a board rather than
     a surface; FALL must clear the settle or the thing drops mid-wobble. */
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const s = pose.current;
    const fallAt = p.popDur + p.hold;
    const end = fallAt + p.fallDur;

    const tl = gsap.timeline({
      paused: true,
      repeat: loop ? -1 : 0,
      repeatDelay: p.gap,
    });

    tl.set(s, {
      scale: p.popScale,
      rotX: p.popTilt,
      rotZ: 0,
      y: p.popRise,
      alpha: 0,
      bend: p.bend0,
      fold: p.fold0,
      wave: p.wave0,
      phase: 0,
      sheen: 0,
    });

    /* THE POP. One gesture out of four tweens on the same beat: it comes up,
       it comes forward, it grows, it appears. back.out on the three that
       carry the shape, so the mark passes its own mark and comes back —
       which is what makes it read as sprung rather than as faded in. */
    tl.to(s, { alpha: 1, duration: p.popDur * 0.28, ease: "none" }, 0);
    tl.to(
      s,
      { scale: 1, duration: p.popDur, ease: `back.out(${p.popBack})` },
      0,
    );
    tl.to(
      s,
      { rotX: 0, duration: p.popDur, ease: `back.out(${p.popBack * 0.8})` },
      0,
    );
    tl.to(s, { y: 0, duration: p.popDur, ease: "power3.out" }, 0);

    /* THE UNROLL — the curled edge laying down, and the beat that has to be
       WATCHABLE. An elastic ease is wrong here and was: elastic.out is at its
       target inside the first tenth of its duration and spends the rest
       oscillating around it, so however deep the starting curl is set, it is
       gone in about a hundred milliseconds and the underside is never seen.
       That is what made the whole thing read as a flag rippling rather than as
       a sticker being pressed down.

       sine.inOut, which is the ease the site already reaches for on exactly
       this move — see IN_EASE in the peel this replaced: it comes out of rest
       and back into it, a sticker let go rather than one yanked flat. */
    tl.to(
      s,
      { bend: 0, fold: 0, duration: p.unroll, ease: "sine.inOut" },
      p.popDur * p.flexAt,
    );

    /* AND THE WOBBLE AFTER IT, which is where the elastic belongs — it is the
       residual flex in a thing that has landed, not the landing. It outlasts
       the unroll on purpose: the shape is still moving after the mark has
       stopped, which is the difference between a sticker and a sign. */
    tl.to(
      s,
      { wave: 0, duration: p.settle, ease: `elastic.out(1, ${p.elastic})` },
      p.popDur * p.flexAt,
    );
    tl.to(
      s,
      { phase: p.waveSpin * p.settle, duration: p.settle, ease: "none" },
      0,
    );

    /* THE LIGHT. Across while the surface is still curved, so the highlight
       bends with it. */
    tl.to(
      s,
      { sheen: 1, duration: p.sheenDur, ease: "power1.inOut" },
      p.sheenAt,
    );

    /* THE FALL — hinged on the bottom edge (originY), so it goes over rather
       than away, and takes a little of the bend back on the way down. */
    tl.to(
      s,
      { rotX: p.fallTilt, duration: p.fallDur, ease: "power2.in" },
      fallAt,
    );
    tl.to(s, { y: p.fallDrop, duration: p.fallDur, ease: "power2.in" }, fallAt);
    tl.to(
      s,
      { scale: p.fallScale, duration: p.fallDur, ease: "power2.in" },
      fallAt,
    );
    tl.to(
      s,
      { bend: p.fallBend, duration: p.fallDur, ease: "power2.in" },
      fallAt,
    );
    tl.to(
      s,
      { fold: p.fallFold, duration: p.fallDur, ease: "power2.in" },
      fallAt,
    );
    tl.to(
      s,
      { alpha: 0, duration: p.fallDur * 0.45, ease: "power2.in" },
      end - p.fallDur * 0.45,
    );

    tlRef.current = tl;
    if (scrub == null) tl.play(0);
    else tl.pause().progress(scrub);

    /* The console handle, the peel lab's convention: the timeline itself, so a
       frame can be parked from the keyboard, the live pose to read off it, and
       the params so a number can be tried without hunting for its slider —
       stickerLab.set({ bend0: 1.8, slices: 40 }). */
    (window as unknown as { stickerLab?: unknown }).stickerLab = {
      tl,
      pose: pose.current,
      params: p,
      set: (patch: Partial<Params>) =>
        setP((prev) => ({ ...prev, ...patch })),
    };

    return () => {
      tl.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, loop]);

  /* Scrubbing parks the same timeline rather than building a second one. */
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (scrub == null) tl.play();
    else tl.pause().progress(scrub);
  }, [scrub]);

  /* THE TICKER. Reads the pose and writes the DOM — one place, once a frame,
     nothing else touches these transforms. */
  useEffect(() => {
    const draw = () => {
      const s = pose.current;
      const mark = markRef.current;
      if (!mark) return;

      mark.style.opacity = String(s.alpha);
      mark.style.transform =
        `translate3d(0, ${s.y.toFixed(2)}px, 0) ` +
        `rotateX(${s.rotX.toFixed(2)}deg) ` +
        `rotateZ(${s.rotZ.toFixed(2)}deg) ` +
        `scale(${s.scale.toFixed(4)})`;

      const N = p.slices;
      const ds = p.markW / N;

      /* The surface, integrated. theta is the tangent angle at u; x and z are
         where the strip has got to after walking ds along it. Conserving arc
         length is what makes the shape narrow as it bends, which is what a
         real one does. */
      const ang: number[] = [];
      const cx: number[] = [];
      const cz: number[] = [];
      let x = 0;
      let z = 0;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N;

        /* THE CREASE, as a smoothstep rather than a ramp, and this is the
           whole of showing an underside.
   
           An arc spreads its turn evenly, so to get any of the mark past a
           quarter turn the whole thing has to roll — and a roll hides its own
           back behind its own front, which is what a deep bend actually looks
           like: a tube with a three-pixel green sliver at the edge. A fold puts
           ALL the turn inside a narrow band of u and leaves the flap beyond it
           flat, at whatever angle the crease took it to. Past 90deg that flap
           is facing away, and its whole area is underside.
   
           smoothstep and not a step: a hard one puts the entire turn between
           two adjacent columns, which is a visible corner rather than a fold in
           something with a thickness. `crease` is how much of the mark the turn
           is spread over. */
        let sm = (u - (p.foldAt - p.crease)) / (2 * p.crease);
        sm = sm < 0 ? 0 : sm > 1 ? 1 : sm;
        sm = sm * sm * (3 - 2 * sm);

        const a = flat
          ? 0
          : s.bend * (u - 0.5) +
            s.fold * sm +
            s.wave *
              Math.sin(2 * Math.PI * (p.waveFreq * u - s.phase));
        ang.push(a);
        cx.push(x + (Math.cos(a) * ds) / 2);
        cz.push(z + (Math.sin(a) * ds) / 2);
        x += Math.cos(a) * ds;
        z += Math.sin(a) * ds;
      }
      /* Recentred so the mark stays put as it flexes: the chord shortens as
         the bend deepens, and without this the whole thing would crawl left. */
      const offX = (p.markW - x) / 2;
      const z0 = cz[(N / 2) | 0] ?? 0;

      for (let i = 0; i < N; i++) {
        const col = colRefs.current[i];
        const ink = inkRefs.current[i];
        const sheen = sheenRefs.current[i];
        if (!col) continue;

        const natX = i * ds + ds / 2;
        const dx = cx[i] + offX - natX;
        const dz = cz[i] - z0;
        /* rotateY(+a) turns +x AWAY from the viewer, and the integration has
           +z coming TOWARDS it — hence the sign. */
        col.style.transform =
          `translate3d(${dx.toFixed(2)}px, 0, ${dz.toFixed(2)}px) ` +
          `rotateY(${((-ang[i] * 180) / Math.PI).toFixed(2)}deg)`;

        const cos = Math.cos(ang[i]);

        if (ink) {
          const b = 1 - p.shade * (1 - cos);
          ink.style.filter = `brightness(${Math.max(0.2, b).toFixed(3)})`;
        }

        /* THE UNDERSIDE. A sticker is a thing with two sides and only one of
           them is printed — which is most of what separates one being laid
           down from a flag rippling, because a flag shows the same picture
           whichever way it is turned. Past a quarter turn this column is
           facing away and what should be there is blank paper. */
        const back = backRefs.current[i];
        const front = cos >= 0;
        if (facing.current[i] !== front) {
          facing.current[i] = front;
          const show = front ? "1" : "0";
          const hide = front ? "0" : "1";
          if (ink) ink.style.opacity = show;
          if (sheen) sheen.style.opacity = show;
          if (back) back.style.opacity = p.back ? hide : "0";
        }
        if (back && !front) {
          const b = 1 - p.backShade * (1 + cos);
          back.style.filter = `brightness(${Math.max(0.2, b).toFixed(3)})`;
        }

        if (sheen) {
          /* One band, sized to the whole mark and walked from a full width
             off the left to a full width off the right. Each column reads its
             own slice of it, so the highlight is continuous. */
          const bx = -(i * ds) + (s.sheen * 2 - 1) * p.markW;
          sheen.style.backgroundPosition = `${bx.toFixed(2)}px 0`;
        }
      }
    };

    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
    };
  }, [p, flat]);

  /* Static per-column styling. The ink and the mask never move; only the
     sheen's background-position and the column's transform do. */
  const inkStyle = (i: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${MARK})`,
    backgroundSize: `${p.markW}px ${H}px`,
    backgroundPosition: `${-(i * sliceW)}px 0`,
    backgroundRepeat: "no-repeat",
    willChange: "filter",
  });

  /* THE UNDERSIDE, in the site's own colour for it: components/Peel's BACKS
     has "peel-back-mark" at #60a000, measured off the gif this whole thing
     descends from — through its unfold the folded-over part is dominantly that
     green. It is NOT the lime the mark's own outline is drawn in, and Peel's
     note says why: the sheet behind it is the hero's lime, and a back flooded
     with lime is invisible for the whole of the move. */
  const BACK = "#60a000";

  const backStyle = (i: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    background: BACK,
    /* The artwork's silhouette, so the blank side is the MARK's shape and not
       a rectangle — the same alpha the ink and the sheen are cut by. */
    WebkitMaskImage: `url(${MARK})`,
    maskImage: `url(${MARK})`,
    WebkitMaskSize: `${p.markW}px ${H}px`,
    maskSize: `${p.markW}px ${H}px`,
    WebkitMaskPosition: `${-(i * sliceW)}px 0`,
    maskPosition: `${-(i * sliceW)}px 0`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    opacity: 0,
    pointerEvents: "none",
  });

  const sheenStyle = (i: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(${p.sheenTilt}deg, rgba(255,255,255,0) ${
      50 - p.sheenBand
    }%, rgba(255,255,255,${p.sheenPower}) 50%, rgba(255,255,255,0) ${
      50 + p.sheenBand
    }%)`,
    backgroundSize: `${p.markW}px ${H}px`,
    backgroundRepeat: "no-repeat",
    /* Masked by the artwork's own alpha, so the light lands on the mark and
       not on the box it sits in. */
    WebkitMaskImage: `url(${MARK})`,
    maskImage: `url(${MARK})`,
    WebkitMaskSize: `${p.markW}px ${H}px`,
    maskSize: `${p.markW}px ${H}px`,
    WebkitMaskPosition: `${-(i * sliceW)}px 0`,
    maskPosition: `${-(i * sliceW)}px 0`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    mixBlendMode: p.sheenScreen ? "screen" : "normal",
    pointerEvents: "none",
    willChange: "background-position",
  });

  return (
    <main style={page}>
      <header style={head}>
        <h1 style={h1}>Lab — the mark as a sticker</h1>
        <p style={note}>
          Pop, flex, sheen, fall. CSS 3D over {p.slices} columns of the real
          preloader SVG — no canvas, no texture, nothing to compile. Scrub to
          park a single frame.
        </p>
      </header>

      <div
        style={{
          ...stage,
          perspective: `${p.perspective}px`,
          background: lime ? "#b6fe00" : "#0d1408",
        }}
      >
        <div
          ref={markRef}
          style={{
            position: "relative",
            width: p.markW,
            height: H,
            transformStyle: "preserve-3d",
            transformOrigin: `50% ${p.originY}%`,
          }}
        >
          {cols.map((i) => (
            <div
              key={i}
              ref={(el) => {
                colRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                left: i * sliceW,
                top: 0,
                width: sliceW + p.overlap,
                height: H,
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
            >
              <div
                ref={(el) => {
                  inkRefs.current[i] = el;
                }}
                style={inkStyle(i)}
              />
              <div
                ref={(el) => {
                  sheenRefs.current[i] = el;
                }}
                style={sheenStyle(i)}
              />
              <div
                ref={(el) => {
                  backRefs.current[i] = el;
                }}
                style={backStyle(i)}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={bar}>
        <button style={btn} onClick={() => tlRef.current?.play(0)}>
          Replay
        </button>
        <label style={check}>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          loop
        </label>
        <label style={check}>
          <input
            type="checkbox"
            checked={lime}
            onChange={(e) => setLime(e.target.checked)}
          />
          lime ground
        </label>
        <label style={check}>
          <input
            type="checkbox"
            checked={flat}
            onChange={(e) => setFlat(e.target.checked)}
          />
          no bend (alignment check)
        </label>
        <label style={{ ...check, gap: 8 }}>
          <input
            type="checkbox"
            checked={scrub != null}
            onChange={(e) => setScrub(e.target.checked ? 0.3 : null)}
          />
          scrub
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={scrub ?? 0}
            disabled={scrub == null}
            onChange={(e) => setScrub(parseFloat(e.target.value))}
            style={{ width: 260 }}
          />
          <span style={value}>{(scrub ?? 0).toFixed(3)}</span>
        </label>
      </div>

      <div style={panels}>
        <Group title="Pop">
          <S l="duration" v={p.popDur} set={set("popDur")} min={0.2} max={1.4} step={0.02} u="s" />
          <S l="from scale" v={p.popScale} set={set("popScale")} min={0.2} max={1} step={0.01} u="" />
          <S l="from tilt" v={p.popTilt} set={set("popTilt")} min={-90} max={0} step={1} u="°" />
          <S l="rise" v={p.popRise} set={set("popRise")} min={0} max={140} step={2} u="px" />
          <S l="overshoot" v={p.popBack} set={set("popBack")} min={0} max={4} step={0.1} u="" />
          <S l="hinge" v={p.originY} set={set("originY")} min={0} max={100} step={5} u="%" />
        </Group>

        <Group title="Flex">
          <S l="fold" v={p.fold0} set={set("fold0")} min={0} max={3.4} step={0.05} u="rad" />
          <S l="fold at" v={p.foldAt} set={set("foldAt")} min={0.2} max={0.95} step={0.01} u="" />
          <S l="crease" v={p.crease} set={set("crease")} min={0.02} max={0.4} step={0.01} u="" />
          <S l="bend" v={p.bend0} set={set("bend0")} min={0} max={6} step={0.05} u="rad" />
          <S l="wave" v={p.wave0} set={set("wave0")} min={0} max={2.5} step={0.05} u="rad" />
          <S l="wave freq" v={p.waveFreq} set={set("waveFreq")} min={0.4} max={3} step={0.05} u="" />
          <S l="wave speed" v={p.waveSpin} set={set("waveSpin")} min={0} max={4} step={0.1} u="/s" />
          <S l="unroll at" v={p.flexAt} set={set("flexAt")} min={0} max={1} step={0.02} u="" />
          <S l="unroll" v={p.unroll} set={set("unroll")} min={0.2} max={2} step={0.02} u="s" />
          <S l="settle" v={p.settle} set={set("settle")} min={0.3} max={3} step={0.05} u="s" />
          <S l="rubber" v={p.elastic} set={set("elastic")} min={0.15} max={1} step={0.01} u="" />
          <S l="shading" v={p.shade} set={set("shade")} min={0} max={1} step={0.02} u="" />
          <S l="show back" v={p.back} set={set("back")} min={0} max={1} step={1} u="" />
          <S l="back shade" v={p.backShade} set={set("backShade")} min={0} max={1} step={0.02} u="" />
        </Group>

        <Group title="Sheen">
          <S l="starts" v={p.sheenAt} set={set("sheenAt")} min={0} max={2} step={0.02} u="s" />
          <S l="duration" v={p.sheenDur} set={set("sheenDur")} min={0.2} max={2} step={0.02} u="s" />
          <S l="band" v={p.sheenBand} set={set("sheenBand")} min={2} max={30} step={0.5} u="%" />
          <S l="strength" v={p.sheenPower} set={set("sheenPower")} min={0} max={1} step={0.02} u="" />
          <S l="lean" v={p.sheenTilt} set={set("sheenTilt")} min={60} max={140} step={1} u="°" />
          <S l="screen blend" v={p.sheenScreen} set={set("sheenScreen")} min={0} max={1} step={1} u="" />
        </Group>

        <Group title="Fall">
          <S l="hold" v={p.hold} set={set("hold")} min={0} max={3} step={0.05} u="s" />
          <S l="duration" v={p.fallDur} set={set("fallDur")} min={0.2} max={1.6} step={0.02} u="s" />
          <S l="tilt to" v={p.fallTilt} set={set("fallTilt")} min={0} max={100} step={1} u="°" />
          <S l="drop" v={p.fallDrop} set={set("fallDrop")} min={0} max={260} step={2} u="px" />
          <S l="scale to" v={p.fallScale} set={set("fallScale")} min={0.6} max={1.2} step={0.01} u="" />
          <S l="bend to" v={p.fallBend} set={set("fallBend")} min={-4} max={4} step={0.05} u="rad" />
          <S l="fold to" v={p.fallFold} set={set("fallFold")} min={-3} max={3} step={0.05} u="rad" />
          <S l="gap" v={p.gap} set={set("gap")} min={0} max={2} step={0.05} u="s" />
        </Group>

        <Group title="Build">
          <S l="columns" v={p.slices} set={set("slices")} min={4} max={64} step={1} u="" />
          <S l="width" v={p.markW} set={set("markW")} min={180} max={900} step={10} u="px" />
          <S l="perspective" v={p.perspective} set={set("perspective")} min={300} max={3000} step={50} u="px" />
          <S l="seam bleed" v={p.overlap} set={set("overlap")} min={0} max={2} step={0.1} u="px" />
        </Group>
      </div>

      <pre style={dump}>{JSON.stringify(p, null, 2)}</pre>
    </main>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset style={group}>
      <legend style={legend}>{title}</legend>
      {children}
    </fieldset>
  );
}

function S({
  l,
  v,
  set,
  min,
  max,
  step,
  u,
}: {
  l: string;
  v: number;
  set: (n: number) => void;
  min: number;
  max: number;
  step: number;
  u: string;
}) {
  return (
    <label style={row}>
      <span style={label}>{l}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
        style={{ width: 110 }}
      />
      <span style={value}>
        {v}
        {u}
      </span>
    </label>
  );
}

/* Lab furniture. Inline because none of it should reach global.css. */
const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "4vw 3vw 6vw",
  fontFamily: "var(--font-inter, system-ui), sans-serif",
};
const head: React.CSSProperties = { marginBottom: "1rem" };
const h1: React.CSSProperties = { fontSize: 22, margin: 0, fontWeight: 600 };
const note: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginTop: 6,
  maxWidth: 620,
  lineHeight: 1.5,
};
const stage: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  height: "62vh",
  minHeight: 420,
  borderRadius: 10,
  overflow: "hidden",
};
const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  margin: "14px 0 18px",
  fontSize: 12,
  flexWrap: "wrap",
};
const btn: React.CSSProperties = {
  font: "inherit",
  padding: "5px 12px",
  borderRadius: 6,
  border: "1px solid currentColor",
  background: "transparent",
  cursor: "pointer",
};
const check: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};
const panels: React.CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  alignItems: "flex-start",
};
const group: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,.18)",
  borderRadius: 8,
  padding: "6px 12px 10px",
};
const legend: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  opacity: 0.6,
  padding: "0 4px",
};
const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  padding: "2px 0",
};
const label: React.CSSProperties = { width: 86, opacity: 0.75 };
const value: React.CSSProperties = {
  width: 56,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  opacity: 0.6,
};
const dump: React.CSSProperties = {
  marginTop: 22,
  fontSize: 11,
  opacity: 0.45,
  maxHeight: 160,
  overflow: "auto",
};
