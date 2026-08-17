/* eslint-disable @next/next/no-img-element */
import Arrow from "@/components/Arrow";
import Peel from "@/components/Peel";
import { words } from "@/components/letters";
import { featured, hrefOf } from "@/data/news";
import Stage from "./Stage";

/* THE LEAD STORY — the news page's second screen, and the same object as the
 * home page's closing key visual.
 *
 * A photograph in a tilted frame on the left, a card beside it on the right, and
 * a strip of kraft tape stood upright across the seam between them. That is LET'S
 * MAKE IT STICK exactly, and it is deliberately not a variation on it: the markup
 * below uses that section's own class names, so its geometry, its peel, its
 * headline reveal and its inner-drift parallax all arrive here with nothing
 * copied and nothing to keep in step. Stage says which engines that is; the
 * stylesheet's Make it stick section says which rules.
 *
 * WHAT IS THIS SECTION'S OWN is the palette and the card's furniture. The key
 * visual writes lime on dark green because it closes a lime page; this is a card
 * of paper on a dark green one, so the pair is inverted — and that is three
 * custom properties (--stick-bg, --stick-card-bg, --stick-ink) rather than a
 * second copy of the layout. The chip, the date and the arrow are markup.
 *
 * THE ARROW TURNS ON HOVER, and it is the menu's turn rather than a new one: the
 * mark swings from north-east round to due east, so it stops pointing away and
 * starts pointing AT the thing it belongs to. Same curve, same duration; see
 * .story-arrow in global.css, which sits beside .menu-arrow's explanation.
 *
 * THE CARD IS THE LINK, and it is the whole card rather than a READ MORE inside
 * it: there is one thing to do with a lead story and the design gives it no
 * control of its own, so the card is what is clicked and the arrow in its corner
 * is the mark saying so. The href comes from hrefOf in src/data/news.ts — one
 * place turns a story into a path, so this and the nine cards below cannot drift
 * apart from the routes.
 *
 * It went from an <article> to an <a> around exactly these children when
 * /news/[id] landed, which is what this note used to promise: the swing on hover
 * was already written against the card and gained a :focus-visible twin, and
 * nothing else in the section changed.
 *
 * Server-rendered. Stage is a hair-thin client wrapper that owns the ref;
 * nothing below this line is a client component.
 */

/* The chip above the title. It says what the card IS — the one story the page is
   leading on — where the nine below are a list. */
const CHIP = "HIGHLIGHT";

/* THE STRIP, and every figure here is the key visual's. The ratio is the only
 * number taken out of the artwork: it is what turns one length into the box Peel
 * has to be told about, so the thickness is never typed and cannot drift from the
 * picture. The same kraft roll the pinning section tapes its photographs down
 * with and the key visual bridges its seam with — one board, one roll.
 *
 * SHORTER THAN THE KEY VISUAL'S 22.222vw. That strip bridges a seam between two
 * boxes 42vw tall and is a third of their height; this row is 34.86vw tall and
 * the design draws a strip about 15vw long on it — so at the key visual's length
 * it would be nearly two thirds of the seam and read as a splint rather than as a
 * piece of tape. It is the only figure of the arrangement this section changes,
 * and it changes it here rather than in the stylesheet because the length is what
 * the box is computed FROM: the ratio turns it into the thickness, so there is
 * one number and the artwork's proportions are never typed.
 */
const TAPE = {
  src: "/assets/tape top.png",
  ratio: 428 / 173,
  /* The roll's own colour, so the turned-back end shows the stuff the strip is
     made of rather than a sheet of paper grey. See BACKS in components/Peel. */
  back: "peel-back-kraft",
} as const;
const TAPE_L = 15.4;
const TAPE_BOX = `${TAPE_L}vw ${(TAPE_L / TAPE.ratio).toFixed(3)}vw`;

export default function TopStory() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE TAPE NEVER GOES ON. A scrubbed peel rests at
          --peel: 0, and 0 here is `from` — the end still turned back — so a page
          where peel.ts never runs is a page with a strip curled up in the middle
          of it for good. Press it flat instead and leave it there: the
          arrangement still reads, it is just no longer being taped down in front
          of you.

          NOR DOES THE TITLE ARRIVE. Its letters are parked under their masks by
          global.css and released by the shared reveal, so a page where that never
          runs is an empty card. The stylesheet's hold is lifted here as well,
          which costs nothing when scripting is on: the contents are not even
          parsed. The key visual carries the identical pair. */}
      <noscript>
        <style>{`.top-story .stick-tape { --peel: 1 }
          .top-story .char { transform: none }`}</style>
      </noscript>

      <div className="stick-row">
        {/* THE FRAME AND THE PICTURE ARE TWO BOXES, so one can hold still while
            the other drifts. The rounded box, the tilt and the cast shadow
            belong to the frame — it is what is taped to the card beside it, and
            it does not move. The artwork inside is cut taller than the hole and
            slides in that slack (MakeItStick/parallax.ts).

            The picture keeps its alt: it is the story's image, not decoration,
            and it is the only photograph in the section. */}
        <div className="stick-shot">
          <img
            className="stick-shot-img"
            src={featured.image}
            alt={featured.alt}
          />
        </div>

        {/* The card. .stick-card is the box — its size, its radius, its colour
            pair — and .story-card is what this page does inside it: set to the
            left rather than centred, with a chip at the top and a foot rule
            under the title.

            An <a> and not an <article>, because the whole card is the link to
            the story — see the section note. It carries no aria-label: the
            heading inside it is the story's own title, which is exactly what the
            link should be announced as. */}
        <a className="stick-card story-card" href={hrefOf(featured)}>
          {/* RULED LIKE A NOTEPAD, AND THERE IS NO ELEMENT FOR IT. There used to
              be one here — a <div className="story-rules"> laid across the whole
              card under everything — and it is gone: the ruling belongs to the
              headline, so it is drawn by .story-title::before and hung off the
              title's own first line rather than off a distance measured down
              from the card's top edge. Six lines of it, which the title is
              written on as much of as it needs. global.css has the long version.

              The card still reads as a sheet of paper somebody has written on
              rather than a coloured box with type in it, which was always the
              point; it is one element lighter about it. */}

          {/* THE CHIP IS THE SITE'S CHIP — the slider's, which the pinning
              section already wears too. Same shape, same perforation of dots
              punched down its left edge, and it takes both from the shared rule
              rather than drawing them again; all this card sets is the palette
              and the lean. See .story-chip in global.css, and the note over the
              shared rule for what a chip is and where its placement belongs. */}
          <p className="story-chip">{CHIP}</p>

          {/* Split to letters for the reveal, which is the site's headline
              voice — each waits below its own mask and slides up in a shuffled
              order (MakeItStick/reveal.ts, which collects .stick-headline).

              words() rather than letters(), and that is the one structural
              difference from the key visual's heading. That one is three lines
              whose breaks are set by design; this is a story title of whatever
              length an editor writes, so it has to WRAP — and a row of flex
              letter boxes never breaks. Splitting to words instead lets the
              line break between them exactly where the unsplit text would.

              aria-label rather than a second hidden copy: it is honoured on a
              heading, so the title is announced whole and the rows of letter
              boxes are never read out a fragment at a time. */}
          <h2
            className="h2 stick-headline story-title"
            aria-label={featured.title}
          >
            <span aria-hidden="true">{words(featured.title)}</span>
          </h2>

          {/* The foot: the date at one end and the mark at the other, which is
              the design's rule for every card on this page. A <time> because it
              is one, with the machine-readable value on the attribute and the
              display split across two lines — the day set large, the rest set
              small under it. */}
          <div className="story-foot">
            <time className="story-date">
              <span className="story-day">{featured.day}</span>
              <span className="story-month">{featured.month}</span>
            </time>

            {/* The mark, and it stays out of the accessibility tree now that
                the card around it is a link: it is the printed sign that this
                card leads somewhere, and the link it belongs to already says so
                in words. Announced as well, it would be the same destination
                offered twice. */}
            <span className="story-arrow" aria-hidden="true">
              <Arrow />
            </span>
          </div>
        </a>

        {/* THE PEEL, RUN BACKWARDS — the strip is found turned back on itself and
            the SCROLL is what presses it down, end-first, as the section comes up
            the screen. `from` is the lifted end and `to` is flat; the geometry in
            global.css is direction-blind, so a peel written with its far value in
            `from` is a peel run backwards and there is no second code path.

            Every prop is the key visual's, and they are worth reading there
            rather than re-deriving: a quarter turn on the direction swings the
            fold ACROSS the strip so it lands end-first rather than creasing
            lengthwise, and the SIGN of it is which end that is. `in` brings the
            scrub forward so the strip comes up the screen mid-press. `box` is
            what the turned clip frame is bled by, and the stylesheet sizes the
            wrapper off the very properties this prop sets — one statement of the
            strip's size, read rather than copied. */}
        <Peel
          className="stick-tape"
          src={TAPE.src}
          back={TAPE.back}
          drive="scroll"
          direction="90deg"
          box={TAPE_BOX}
          from={0.55}
          to={0}
          in={1.08}
        />
      </div>
    </Stage>
  );
}
