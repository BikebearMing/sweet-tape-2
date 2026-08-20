/* THE OPENING SCREEN of /about — one screen of dark green, and nothing on it.
 *
 * It is a HOLDING SECTION and it is meant to read as one. The page's first
 * statement is not written yet; what is settled is that the about page opens on
 * the origin story's green rather than on the lime every other route opens on,
 * and that WE WANTED TO BE. below it is the page's SECOND screen rather than its
 * first. Both of those are arrangement, and arrangement is worth standing up
 * before the copy lands on it — the section under this one is pinned, and where
 * a pin begins is decided by how much page is above it.
 *
 * SO IT IS DELIBERATELY EMPTY rather than filled with placeholder type. A screen
 * of dummy words is a screen somebody has to remember to delete, and it would be
 * competing with the one thing on the page that is real.
 *
 * WHAT IT IS NOT is a hero. The masthead is already up there — (frontend)/layout
 * .tsx prints it on every route but the home page — and it is the only thing on
 * this screen. The section turns it lime for the length of the page; see
 * `body:has(.about-open)` in global.css, which is where that hand-off lives.
 *
 * No client boundary and no script: it is a coloured box with the site's paper
 * grain on it. Anything that arrives here later can bring its own.
 */
export default function AboutOpen() {
  return <section className="about-open" />;
}
