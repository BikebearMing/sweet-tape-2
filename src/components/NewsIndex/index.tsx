import { letters } from "@/components/letters";
import StoryCard from "@/components/StoryCard";
import { countOf, getStories, KINDS } from "@/data/news";
import Stage from "./Stage";

/* THE INDEX — the rest of the newsroom, and the page's last screen before the
 * footer.
 *
 * A rule of three tabs down the left and a wall of nine cards on the right. The
 * tabs are the whole navigation of this page: ALL, then the two kinds a story can
 * be. Four events and five stories, which is the split the design draws.
 *
 * THE TABS ARE TYPE AND THE CARDS ARE NOT, which is the one thing to hold on to
 * about how this section arrives. The rule takes the site's headline voice —
 * every letter under its own mask, sliding up in a shuffled order — because it is
 * a headline set sideways, and it arrives ROW BY ROW the way the menu's does,
 * each word followed by the perforated line drawn under it. The cards bounce up
 * in reading order instead: nine rectangles doing the letter reveal would be nine
 * arrivals competing with each other, and shuffling anything about a grid
 * destroys the one thing a grid is for. NewsIndex/reveal.ts has the long
 * version.
 *
 * FILTERING IS AN ATTRIBUTE, NOT A RE-RENDER. Picking a tab writes data-filter on
 * the section and the stylesheet hides every card that disagrees with it — so all
 * nine stories stay server-rendered markup and none of the copy reaches the client
 * bundle. NewsIndex/filter.ts argues it properly.
 *
 * A CARD IS NOT THIS SECTION'S ANY MORE. The nine of them are
 * components/StoryCard, which the three at the foot of a story wear too — and
 * every one of them is a link to /news/[id], the whole card rather than a READ
 * MORE inside it. What stayed here is the WALL: the grid, the tabs and the
 * filter that cuts between them.
 *
 * ONE PICTURE, NINE TIMES, from src/data/news.ts — deliberately, while the layout
 * is what is being judged. Nine different crops would hide whether the grid is
 * right.
 *
 * Server-rendered. Stage is a hair-thin client wrapper that owns the ref and
 * hands the section to filter.ts and reveal.ts; nothing below this line is a
 * client component.
 */
export default async function NewsIndex() {
  const stories = await getStories();

  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT NOTHING HERE ARRIVES. The tabs' letters are parked
          under their masks by global.css, the rules between them are clipped to
          nothing and the cards are parked at nothing, and all three are released
          by the section's own script — so a page where it never runs is an empty
          green sheet where the newsroom should be. The
          stylesheet's hold is lifted here instead, which costs nothing when
          scripting is on: the contents are not even parsed.

          THE TABS STILL DO NOTHING WITHOUT IT, and that is the honest state: with
          no script there is no filter, so the wall shows all nine stories, which
          is the ALL tab and is exactly what a reader wants from a news index they
          cannot filter. Nothing is hidden and nothing is lost. */}
      <noscript>
        <style>{`.news-index .char { transform: none }
          .news-index .index-rule { clip-path: none }
          .news-index .index-card { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <div className="index-row">
        {/* The rule. A list because it is one — three named views of the same
            wall, in a set order — and buttons because each one acts on the page
            rather than leading off it.

            aria-pressed is what says which is on, and it is written by filter.ts
            rather than set here: the page is served with no filter applied, which
            IS the ALL tab, and hard-coding the pressed state in the markup would
            be a second statement of that to keep in step.

            Each label is split to letters for the reveal; aria-label carries the
            readable name, since a row of block-level letter boxes is otherwise
            liable to be announced a fragment at a time. The menu's rows are
            marked up the same way. */}
        <ul className="index-filters">
          {KINDS.map(({ id, label }, i) => (
            <li key={label}>
              <button
                className="index-tab"
                type="button"
                aria-label={`${label}, ${countOf(id, stories)} stories`}
                {...(id ? { "data-kind": id } : {})}
              >
                <span className="index-tab-label" aria-hidden="true">
                  {letters(label)}
                </span>
                {/* The count, set small and raised beside the word — the design
                    prints it as a superscript in brackets. COUNTED and never
                    typed: see countOf, which is the whole reason it is here
                    rather than in the KINDS list. It is inside the label for a
                    screen reader, which is why this copy is hidden. */}
                <span className="index-tab-count" aria-hidden="true">
                  ({countOf(id, stories)})
                </span>
              </button>

              {/* THE PERFORATION UNDER THE TAB — the menu's rule, in lime, and a
                  real element for the same reason the menu's is one: the reveal
                  draws it in from the left and a pseudo-element is not
                  addressable. It used to be a background on the button above,
                  which could be painted but never animated.

                  NOT UNDER THE LAST TAB. Under the first two it is a separator
                  and is doing work; under the third there is nothing to separate
                  it from, so it would be a line drawn across the bottom of the
                  column for its own sake — heavy enough at this weight to read as
                  a floor this section does not have. It used to be a
                  :last-child rule turning the background off; not rendering it is
                  the same statement made once. */}
              {i < KINDS.length - 1 && (
                <span className="index-rule" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>

        {/* The wall. Every card is components/StoryCard — the same object the
            three at the foot of a story are, which is why the markup for it is
            not here any more. data-kind rides along on each one and is what the
            filter below cuts on. */}
        <ul className="index-grid">
          {stories.map((story) => (
            <StoryCard story={story} key={story.id} />
          ))}
        </ul>
      </div>
    </Stage>
  );
}
