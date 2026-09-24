import TapeSlider from "@/components/TapeSlider";

import Compare from "../Compare";
import Tuner from "./Tuner";

/* /lab/tape-letters — the real slider with a panel for placing the bottom
 * word's letters one at a time. The tuner writes each letter's --dx/--dy/--dr
 * inline, which is exactly what letters-tuning.css holds per letter; the panel
 * emits that file's blocks, ready to paste over the word's section. Step the
 * slider to tune another word — the panel follows data-word. (The panel sits
 * over the roll picker: hide it to step, or click the rolls' left edge.)
 *
 * With the design beside it: drop a screenshot of the section's artboard at
 * public/lab/tape-letters-comp.png, or paste one onto the page, and the bar at
 * the foot cuts the screen — the design left of the line, the live section
 * right of it. See ../Compare. */
export default function TapeLettersLab() {
  return (
    <>
      <TapeSlider />
      <Compare into=".tape-slider-parent" src="/lab/tape-letters-comp.png" />
      <Tuner />
    </>
  );
}
