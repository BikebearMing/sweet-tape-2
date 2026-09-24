import { getHomepage } from "@/data/homepage";
import { getTapes } from "@/data/tapes";

import Tuner from "./Tuner";

/* /lab/tape-3d — the roll viewer with every light, finish and film number on a
 * slider, changing the running scene. Three stages, each mounted with EXACTLY
 * the arguments its page passes (see STAGES in Tuner.tsx), so the sliders open
 * on the live look and the JSON at the foot is what to carry back. */
export default async function Tape3dLab() {
  const [tapes, home] = await Promise.all([getTapes(), getHomepage()]);
  return (
    <Tuner
      tapes={tapes.map((t) => ({ id: t.id, model: t.model, bg: t.colours.bg }))}
      rolls={home.slider.rolls.map((r) => ({ id: r.id, model: r.model, bg: r.colours.bg }))}
    />
  );
}
