import { letters } from "@/components/letters";
import StoryCard from "@/components/StoryCard";
import { getRelatedTo, type Story } from "@/data/news";

import Stage from "./Stage";

/* RELATED NEWS — the last thing on a story, between the article and the footer.
 *
 * The name set large down the left and three cards on the right, on the dark
 * green the newsroom's index stands on. It is the index's own arrangement one
 * row deep: the same rule column, the same gutter, the same 313px cards with the
 * same 15px between them — so a reader who came from the wall meets the wall
 * again at the bottom of what they clicked.
 *
 * THREE CARDS AND NOT A LIST OF LINKS, because that is what the design draws and
 * because the card is already the site's way of offering a story. There is one
 * thing to do with each of them and the whole card is the link to it; see
 * components/StoryCard, which is the same component the index's nine are.
 *
 * WHICH THREE IS THE DATA'S BUSINESS. getRelatedTo in src/data/news.ts picks them —
 * same kind first, topped up so the row is always three, and never the story
 * being read — and it argues the rule properly. Nothing about the choice is
 * decided here: this section knows how to draw three cards and nothing else,
 * which is what will still be true when the stories have tags.
 *
 * IT IS THE SECTION THAT PAYS THE FOOTER'S TOLL now that it is last on the page.
 * The footer rises into whatever is above it, and --related-arc is that depth
 * handed back; the story's own lime sheet no longer pays it, because the footer
 * no longer touches it. See global.css, where both ends say so.
 *
 * Server-rendered. Stage is a hair-thin client wrapper that owns the ref and
 * hands the section to two imported engines; nothing below this line is a client
 * component.
 */

/* TWO LINES BY DESIGN, NOT BY WRAPPING — the same call the hero's headline, the
   title card's and the closing key visual's all make. The break is part of the
   composition, and a heading left to wrap in a 376px column would move the first
   time the column did. Set in caps here rather than by text-transform, which is
   the site's convention: the copy reads in the markup exactly as it paints. */
const HEADING = ["RELATED", "NEWS"];

export default async function RelatedNews({ story }: { story: Story }) {
  const stories = await getRelatedTo(story);
  /* Nothing to show is a section that does not exist, rather than a heading over
     an empty row. It cannot happen with the newsroom as it stands — there are
     ten stories and this asks for three — but a newsroom with one story in it is
     a state this page will meet on the day it is first filled in. */
  if (!stories.length) return null;

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT NOTHING HERE ARRIVES. The heading's letters are
          parked under their masks by global.css and the cards are parked at
          nothing, and both are released by the section's own scripts — so a page
          where they never run is an empty green band where the rail should be.
          The stylesheet's hold is lifted here instead, which costs nothing when
          scripting is on: the contents are not even parsed. The index carries
          the identical pair. */}
      <noscript>
        <style>{`.related-news .char { transform: none }
          .related-news .index-card { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <div className="related-row">
        {/* An h2, because it is a heading over a group inside the article's page
            and not the page's own name — the story's headline is the h1.

            Split to letters for the reveal, which is the site's headline voice.
            .stick-headline is how the shared reveal finds them (it collects
            .stick-headline .char); the size that class carries is the closing
            key visual's and is re-stated by .related-title, which is the bargain
            the lead story's title already strikes and global.css explains.

            aria-label rather than a second hidden copy: it is honoured on a
            heading, so the line is announced whole and the rows of letter boxes
            are never read out a fragment at a time. */}
        <h2
          className="stick-headline related-title"
          aria-label={HEADING.join(" ")}
        >
          {HEADING.map((line) => (
            <span className="line" key={line} aria-hidden="true">
              {letters(line)}
            </span>
          ))}
        </h2>

        {/* The row. The index's own grid — three across, sized by the cards'
            aspect — which is the whole reason this section is a heading and a
            list rather than a layout. */}
        <ul className="index-grid">
          {stories.map((related) => (
            <StoryCard story={related} key={related.id} />
          ))}
        </ul>
      </div>
    </Stage>
  );
}
