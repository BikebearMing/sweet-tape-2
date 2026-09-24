import Reimagine from "@/components/Reimagine";

import Compare from "../Compare";
import Tuner from "./Tuner";

/* /lab/reimagine — the sheet of paper with a panel for placing its props: the
 * six loose strips, the two photographs and the strip on each. The real
 * section, as /lab/about-collage renders the real opening screen; the sliders
 * open on the .rei-* figures global.css holds and write them inline, and the
 * copy button gives the rules back to paste over.
 *
 * With the design beside it: drop a screenshot of the artboard at
 * public/lab/reimagine-comp.png, or paste one onto the page, and the bar at
 * the foot cuts the screen — the design left of the line, the live section
 * right of it. See ../Compare. */
export default function ReimagineLab() {
  return (
    <>
      <Reimagine />
      <Compare into=".reimagine-stage" src="/lab/reimagine-comp.png" />
      <Tuner />
    </>
  );
}
