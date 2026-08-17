/* eslint-disable @next/next/no-img-element */
import { FaChevronLeft } from "react-icons/fa6";

import { bodyCopy } from "@/components/body";
import HandNote from "@/components/HandNote";
import { words } from "@/components/letters";
import { hrefOf, labelOf, readOf, type Story } from "@/data/news";
import Share from "./Share";
import Stage from "./Stage";

/* THE STORY — the news page's inner page, and the whole of /news/[id].
 *
 * A lime sheet with the story's headline set across the left of it and its
 * photograph running off the top-right corner of the page, and then a sheet of
 * cream paper laid over the join with the article written on it. The footer
 * takes it from there.
 *
 * ONE SECTION AND NOT THREE, which is the structural call worth knowing about.
 * Every other route on this site is a stack of sections that meet at an edge —
 * the title card's arc over the lead story, the lead story's ground carried into
 * the index. This page is one composition instead: the paper OVERLAPS the lime
 * and the photograph OVERLAPS the paper, and an overlap between two sections is
 * a negative margin plus a z-index plus a note explaining the pair. Inside one
 * positioned box it is where things are.
 *
 * IT IS THE INDEX'S OBJECTS, INVERTED. The chip is the site's chip in the title
 * card's palette; the date is .story-date, the same object the lead story and
 * all nine cards wear; the paper is the index card's cream on the index card's
 * ink. Nothing here is a new kind of thing — what is this page's own is the
 * arrangement, which is in global.css under "News — the story".
 *
 * THE ARTICLE IS DATA. Every string on this page comes off the Story handed in
 * (src/data/news.ts) — the headline, the deck, the date, the paragraphs, the
 * picture, and the reading time, which is COUNTED off the copy rather than
 * typed. There is no copy in this file at all, which is the seam the CMS plugs
 * into and the reason the ten routes are one component.
 *
 * Server-rendered. Stage is a hair-thin client wrapper that owns the ref, and
 * the share row is a client component for one reason it explains at its own
 * head; nothing else below this line reaches the browser as JavaScript.
 */

/* THE STRIP ON THE PHOTOGRAPH. A plain <img> and not a components/Peel, which
 * is the same call the index's nine cards make and for a related reason: this
 * one is on the OPENING SCREEN.
 *
 * A peel is either a scrub or an idle loop. There is no scroll under it to scrub
 * against — the strip is above the fold before the reader has moved — and a loop
 * would be a corner of tape lifting and settling in the corner of the eye for
 * the whole of the page's life, next to a headline that is trying to arrive.
 * The design draws it already stuck down, and that is what this is.
 *
 * The same kraft roll the whole site tapes its photographs down with. */
const TAPE = "/assets/tape top.png";

export default function Article({ story }: { story: Story }) {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE PAGE IS BLANK ABOVE THE PAPER. The headline's
          letters are parked under their masks by global.css, the chip is parked
          at nothing, and the article's own copy is parked under its masks too —
          so a page where none of the section's scripts run is a lime sheet with
          a photograph on it. The stylesheet's hold is lifted here instead, which
          costs nothing when scripting is on: the contents are not even parsed.
          Every other opening screen on this site carries the same escape.

          THE NOTE COMES BACK AS ITS RULED MARGIN AND NOTHING ELSE, which is the
          one thing here that is not a full recovery: its words are built at
          runtime by Vara and there is no runtime. That is the title card's
          bargain exactly — the sentence survives in the hidden text node beside
          it, the drawing was always decoration, and a hand-ruled corner on a
          lime sheet is a mark on paper where a blank space is a thing that
          failed. */}
      <noscript>
        <style>{`.news-article .char, .news-article .body-rise { transform: none }
          .news-article .article-chip,
          .news-article .article-note { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <header className="article-head">
        {/* THE CHIP IS THE SITE'S CHIP — the slider's, which the title card and
            the lead story both wear as well. Same shape, same perforation of
            dots punched down its left edge, taken from the shared rule rather
            than drawn again; this page sets only the palette and the lean.

            AND IT SAYS WHICH KIND OF STORY THIS IS rather than naming the
            section: it is the word the tab on the index reads, found rather
            than written a second time (labelOf), so an event opens under EVENT
            and a story under NEWS with nothing here to keep in step.

            Out of the accessibility tree: the kind is a label on the page, and
            the page is already named by the h1 under it — announced, it would
            read as a first heading saying nearly what the second says. The
            index's cards take it out of the tree for the same reason. */}
        <p className="article-chip" aria-hidden="true">
          {labelOf(story.kind)}
        </p>

        {/* The page's one h1. Split for the reveal, which is the site's headline
            voice — each letter waits below its own mask and slides up in a
            shuffled order (reveal.ts).

            words() rather than letters(), the call the lead story's title makes
            and for the same reason: a row of flex letter boxes never breaks, and
            this is a headline of whatever length an editor writes, so it has to
            WRAP. Splitting to words puts each in its own inline box and the line
            breaks between them exactly where the unsplit text would.

            aria-label rather than a second hidden copy: it is honoured on a
            heading, so the title is announced whole and the rows of letter boxes
            are never read out a fragment at a time. */}
        <h1 className="article-title" aria-label={story.title}>
          <span aria-hidden="true">{words(story.title)}</span>
        </h1>

        {/* The date. The same object the lead story and the nine cards carry —
            the day set large with the rest set small under it — at the size
            .story-date already sets, which is why there is no figure here. It
            is ranged left against the headline's own margin; the alignment is
            stated in the stylesheet at both ends, and .story-card .story-date
            says why that is not shared. */}
        <time className="article-date story-date">
          <span className="story-day">{story.day}</span>
          <span className="story-month">{story.month}</span>
        </time>
      </header>

      {/* The note, in the clear stretch of lime between the headline and the
          photograph — the site's hand, in this page's ink, saying how long the
          story takes to read.

          ITS WORDS ARE COUNTED AND NOT WRITTEN. readOf measures the article's
          own body; see src/data/news.ts, which argues it properly. One line,
          because it is a note and not a sentence — the breaks in a hand-written
          note are part of the drawing (HandNote/copy.ts), and a figure this
          short has none to make. */}
      <HandNote className="article-note" lines={[readOf(story)]} />

      {/* THE PHOTOGRAPH, RUNNING OFF THE CORNER OF THE PAGE. Bled past the top
          and right edges rather than fitted inside them, and turned a little off
          square: it is a picture put down by hand on the sheet, which is what
          every photograph on this site is. The strip of kraft across it is what
          holds it there.

          It keeps its alt — it is the story's own picture and the only
          photograph on the page, so it is content and not decoration. The strip
          does not: a piece of tape is a thing lying on a picture. */}
      <div className="article-shot">
        <img className="article-shot-img" src={story.image} alt={story.alt} />
        <img className="article-shot-tape" src={TAPE} alt="" />
      </div>

      {/* THE SHEET — a piece of paper laid over the join, perforated along its
          top edge the way a page torn off a pad is. Everything from here down is
          the article itself. */}
      <div className="article-sheet">
        <div className="article-cols">
          <div className="article-copy">
            {/* The deck: the heading at the top of the sheet, set at the site's
                h2 — which is what the .h2 class says and the whole reason that
                level exists (see the Tokens block in global.css).

                Split like the headline above and revealed one beat after it,
                because it is the second thing on the page and not part of the
                first. reveal.ts makes the argument. */}
            <h2 className="h2 article-deck" aria-label={story.deck}>
              <span aria-hidden="true">{words(story.deck)}</span>
            </h2>

            {/* The article. Body copy, so it takes the site's BODY entrance and
                not the headline's: split to words and revealed a measured LINE
                at a time, out of a floor that is not drawn
                (components/bodyReveal.ts, shared with the product page and the
                footer).

                aria-label is not honoured on a paragraph, so the readable copy
                is a real (hidden) text node and the split version is taken out
                of the tree — the same pair the product page's small print and
                the footer's legal line are marked up with.

                Keyed by index, which is the one place on this site where that is
                right: paragraphs are a positional list with no identity of their
                own, and nothing here is reordered or removed. */}
            {story.body.map((paragraph, i) => (
              <p className="article-para body-copy" key={i}>
                <span className="sr-only">{paragraph}</span>
                <span aria-hidden="true">{bodyCopy(paragraph)}</span>
              </p>
            ))}
          </div>

          {/* The column beside the copy: four ways to pass the story on, and the
              way back to the wall it came off. A complementary landmark, because
              that is what it is — related to the article, not part of it. */}
          <aside className="article-aside">
            <Share title={story.title} path={hrefOf(story)} />

            {/* BACK TO ALL — and it goes to the index rather than to
                history.back(), which is the important half. A reader who
                arrived here from a search result has no card to go back to, and
                a control labelled with a destination has to lead there. A plain
                <a href>, so the site's page transition takes it like every other
                link (Preloader/transition.ts). */}
            <a className="article-back" href="/news">
              {/* A bare chevron and not components/Arrow turned round: that mark
                  is a link LEAVING — it points off the page and swings to point
                  at what it belongs to — and this one is a direction, which is a
                  different thing to draw. From react-icons like the share row's
                  and the footer's marks, at 1em in currentColor. */}
              <FaChevronLeft aria-hidden="true" />
              BACK TO ALL
            </a>
          </aside>
        </div>
      </div>
    </Stage>
  );
}
