import Reimagine from "@/components/Reimagine";

import Tuner from "./Tuner";

/* /lab/reimagine — the sheet of paper with a panel for placing its props: the
 * six loose strips, the two photographs and the strip on each. The real
 * section, as /lab/about-collage renders the real opening screen; the tuner
 * writes each prop's --px/--py/--pw/--pr inline, which is exactly what the
 * .rei-* rules in global.css hold. Send the JSON back and it goes in as is. */
export default function ReimagineLab() {
  return (
    <>
      <Reimagine />
      <Tuner />
    </>
  );
}
