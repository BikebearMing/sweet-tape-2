import Hero from "@/components/Hero";

import Tuner from "./Tuner";

/* /lab/hero-tape — the real hero with a panel over its console handle. The
 * hero already exposes `window.hero` in dev (Hero/engine.ts) with every knob
 * object and a tune() that re-applies them to the running scene; this page is
 * those objects on sliders. Scroll to pay the strip out as the home page does. */
export default function HeroTapeLab() {
  return (
    <>
      <Hero />
      <div style={{ height: "150vh" }} />
      <Tuner />
    </>
  );
}
