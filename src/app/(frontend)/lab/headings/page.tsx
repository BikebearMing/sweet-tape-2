import AboutOpen from "@/components/AboutOpen";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import WhatsRolling from "@/components/WhatsRolling";

import Tuner from "./Tuner";

/* /lab/headings — the four pages' opening sections stacked, with a panel for
 * placing each heading's letters one at a time. Pick a heading in the panel;
 * the page scrolls to it and the sliders open on whatever headings-tuning.css
 * already says for each letter. The tuner writes --dx/--dy/--dr inline on the
 * letter boxes, which is exactly what that file holds per letter; copy emits
 * its blocks, ready to paste over that heading's section.
 *
 * The footer closes it, as it closes every page. */
export default function HeadingsLab() {
  return (
    <>
      <Hero />
      <AboutOpen />
      <WhatsRolling />
      <Contact />
      <Footer />
      <Tuner />
    </>
  );
}
