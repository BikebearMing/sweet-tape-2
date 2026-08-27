/* LAB — the homepage's hero, and one letter coming off the wall.
 *
 * Not a route anyone links to. It is the REAL hero component, not a copy of
 * its markup: the question the prototype has to answer is whether a WebGL
 * letter can sit in that type, at that size, in futura-pt-condensed, against
 * that lime — and a hand-built stand-in would answer an easier question.
 *
 * PeelLetter finds the U of BY YOU in whatever hero is on the page, measures
 * it, hides the DOM one and takes over. So nothing under components/Hero is
 * touched, and the homepage at / is exactly what it was.
 *
 * What is on the page:
 *
 *   TAPE MODE   arms the two-point pick. Esc or the same button leaves it.
 *   RESET       lifts the letter again, tape and all
 *   G           parks the letter flat and puts the DOM letter back beside it —
 *               the alignment check. The two should be one letter.
 *
 * Live tuning, in the console once the letter is up:
 *
 *   peelLab.TUNE.CURL = 0.24   the curl's radius, as a fraction of the ink
 *   peelLab.TUNE.THETA = 130   how far round the flap has folded
 *   peelLab.TUNE.SAG = -0.006  how hard the tip falls away
 *   peelLab.TUNE.PHI = 24      the peel's lean off straight-down
 *
 * The ticker re-reads all four every frame, so they land on the next one.
 */
import Hero from "@/components/Hero";
import PeelLetter from "@/components/PeelLetter";

export const metadata = { title: "Lab — peeling letter" };

export default function PeelLetterLab() {
  return (
    <>
      <Hero />
      <PeelLetter />
    </>
  );
}
