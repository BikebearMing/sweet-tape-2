/* eslint-disable @next/next/no-img-element */
import Arrow from "@/components/Arrow";
import { words } from "@/components/letters";
import { hrefOf, labelOf, type Story } from "@/data/news";

/* Sweet Tape — a story as a card. One sheet of cream paper with the kind
 * printed at its top edge, the title under it, the date at its foot and the
 * photograph laid into the bottom corner over both.
 *
 * A COMPONENT BECAUSE THERE ARE NOW TWO WALLS OF THEM: the index's nine, and
 * the three at the foot of a story (components/RelatedNews). It was written
 * inline in the index while there was one, which was right then and is not now
 * — two copies of this markup would be two places for a card to drift, and the
 * one thing that must never happen is a card that reads differently depending
 * on which page you met it on.
 *
 * ITS CLASSES ARE THE INDEX'S AND THEY STAY THE INDEX'S. .index-card and
 * everything under it are declared in the "News — the index" block of
 * global.css, and the related rail wears them rather than a second set of names
 * for the same object — the same call TopStory makes when it borrows the
 * closing key visual's .stick-* geometry, and it is what keeps ONE description
 * of a card in the stylesheet. What a section may set is the palette it hands
 * down; see .index-card-inner, which is where the card's own colours live now
 * that it is shared.
 *
 * AN <li> AND NOT A <div>, because both places it stands are lists — nine
 * stories in a wall and three at the foot of another — and the index's filter
 * hides a card by hiding its item. The caller supplies the key.
 *
 * Server-rendered, like everything it is built out of.
 */

/* THE STRIP ON EVERY CARD. A plain <img> and not a components/Peel, which is
 * the one place on this site where tape is drawn rather than animated — worth
 * saying out loud, because everywhere else the answer is a peel.
 *
 * There are nine of them on the index. A peel is a clipped double of the
 * artwork on an idle loop with an IntersectionObserver behind it, which is
 * right for one strip being laid onto one photograph as the reader watches;
 * nine of those in a grid is nine things fidgeting at once in a section whose
 * whole entrance is nine cards coming quietly into focus. The design draws them
 * already stuck down, and that is what this is.
 *
 * The lead story keeps its peel: there is one of it, it is the size of a hand,
 * and the strip going on is half of what that section says. */
const CARD_TAPE = "/assets/tape top.png";

export default function StoryCard({ story }: { story: Story }) {
  return (
    /* data-kind is what the index's filter cuts on — one attribute per card,
       read by the stylesheet, never by a script that keeps its own list. It is
       carried everywhere the card goes, which costs nothing where nothing is
       filtering: it is a fact about the story, not a hook the index installs. */
    <li className="index-card" data-kind={story.kind}>
      {/* An <a> and not an <article>: the whole card is the link to the story,
          and the arrow in its corner is the printed mark saying so. No
          aria-label, because the heading inside it is the story's own title,
          which is exactly what the link should be announced as. */}
      <a className="index-card-inner" href={hrefOf(story)}>
        {/* The kind, printed at the card's top edge over a dotted rule — the
            same word the index's tabs read, found rather than written a second
            time (labelOf). Out of the a11y tree: the filter already announces
            the two kinds, and a card that says EVENT before its own title reads
            as a heading with a stammer. */}
        <p className="index-kind" aria-hidden="true">
          {labelOf(story.kind)}
        </p>

        {/* Split to letters, and to WORDS first — a story title is whatever
            length an editor writes and has to wrap, where a row of flex letter
            boxes never breaks. words() puts each word in its own inline box so
            the line breaks between them exactly where the unsplit text would.

            Set in the BODY face and in sentence case, deliberately unlike every
            other title on this site: it is a sentence at a size a reader reads
            rather than looks at, and the headline voice at 19px is a caption
            pretending to be a poster. The lead story is the headline voice,
            which is what makes the two read as a lead and a list.

            NOT part of the blur-up as a separate move: the card carries its
            type as it comes into focus, so what resolves is a card rather than
            a card and then some words. */}
        <h3 className="index-title" aria-label={story.title}>
          <span aria-hidden="true">{words(story.title)}</span>
        </h3>

        {/* The mark, under the title and set to the left — where the lead
            story's sits in the opposite corner. Out of the accessibility tree,
            because the card around it is a link and the link already says in
            words where it goes. */}
        <span className="index-arrow story-arrow" aria-hidden="true">
          <Arrow />
        </span>

        {/* The date, at the foot over its own dotted rule. */}
        <time className="index-date story-date">
          <span className="story-day">{story.day}</span>
          <span className="story-month">{story.month}</span>
        </time>

        {/* THE PICTURE, LAID INTO THE CORNER — last in the markup and
            absolutely placed, so it paints over the rules ruled across the card
            behind it. It is put down by hand like everything else on this site:
            anchored to the bottom-right, turned a little off square, and cut off
            by the card's own rounded corner where it runs past the edge. The
            angle is the design's own (see --index-shot-tilt in global.css).

            Decoration: the title beside it says what the story is, and a caption
            repeating that is one thing announced twice. The alt is empty in the
            data for that reason and is passed through rather than invented here.

            The strip across its top edge is what holds it down — the same kraft
            roll the whole site tapes its photographs with, drawn already stuck
            rather than peeled on. CARD_TAPE says why. */}
        <div className="index-shot" aria-hidden="true">
          <img className="index-shot-img" src={story.image} alt={story.alt} />
          <img className="index-shot-tape" src={CARD_TAPE} alt="" />
        </div>
      </a>
    </li>
  );
}
