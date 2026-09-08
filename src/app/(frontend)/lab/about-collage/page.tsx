import AboutOpen from "@/components/AboutOpen";

import Tuner from "./Tuner";

/* /lab/about-collage — the opening screen of /about with a panel for placing
 * the collage: the four pieces and the strips of tape holding them down.
 *
 * THE REAL SECTION, NOT A COPY OF IT. AboutOpen is rendered as /about renders
 * it, and the tuner writes inline styles onto its nodes — so what is tuned here
 * is exactly what the stylesheet will draw once the numbers are copied back
 * into the .about-art block in global.css. The JSON at the foot of the panel is
 * the whole of what to send. */
export default function AboutCollageLab() {
  return (
    <>
      <AboutOpen />
      <Tuner />
    </>
  );
}
