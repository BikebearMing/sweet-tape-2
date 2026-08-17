/* Sweet Tape — the three tabs down the left, and what they do to the wall.
 *
 * ONE ATTRIBUTE, AND THE STYLESHEET DOES THE REST. Picking a tab writes
 * data-filter on the section and nothing else: global.css hides every card whose
 * own data-kind disagrees with it, and the grid reflows. There is no list of
 * which cards are in which tab held anywhere in JS, no re-render, and no second
 * copy of the nine stories — the cards are server-rendered markup and they stay
 * exactly as they were served.
 *
 * WHICH IS WHY THE CARDS CAN STAY ON THE SERVER. The obvious version of this is
 * React state and a filtered .map, and it would drag the whole grid — nine
 * titles, nine dates, nine image paths — into the client bundle to express a
 * choice between three words. The site does not do that anywhere: the slider's
 * selection, the product page's recolour and the menu's rows are all a DOM
 * engine writing an attribute on markup the server sent.
 *
 * DELEGATED, NOT BOUND. One listener on the section rather than three on the
 * buttons, so the tabs are ordinary server-rendered markup with nothing to hook
 * up — a fourth kind is a line in src/data/news.ts and it works.
 *
 * ARIA IS THE OTHER HALF OF IT and is not decoration here: with the cards hidden
 * by the stylesheet, aria-pressed on the tabs is the only thing that says which
 * of the three is on. They are buttons rather than a tablist because that is what
 * they are — a tablist promises panels that these do not have, and a wall that
 * grows and shrinks is not a panel being swapped.
 */

/** Written on the section; read by global.css. Absent means ALL. */
const ATTR = "filter";

export type NewsFilter = {
  stop: () => void;
};

/**
 * Wires the tab row.
 *
 * @param root the <section class="news-index">
 * @param onChange called after the attribute has been written, so whatever it
 *   does can measure the page as it now stands — the index's reveal replays the
 *   cards through it, and it has to be looking at the new set.
 */
export function initNewsFilter(
  root: HTMLElement,
  onChange: () => void,
): NewsFilter {
  const tabs = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".index-tab"),
  );
  if (!tabs.length) return { stop: () => {} };

  function apply(kind: string | null) {
    if (kind) root.dataset[ATTR] = kind;
    else delete root.dataset[ATTR];

    for (const tab of tabs) {
      /* An empty data-kind is ALL — the absence of a filter, which is why it is
         not a third kind every comparison would have to know was special. */
      const on = (tab.dataset.kind || null) === kind;
      tab.setAttribute("aria-pressed", String(on));
      /* The stylesheet's hook for the ink and the marker. Separate from
         aria-pressed on purpose: one is what the page says to a reader and the
         other is what it says to a screen reader, and a rule keyed on the ARIA
         attribute would make the two impossible to change independently. */
      if (on) tab.dataset.on = "";
      else delete tab.dataset.on;
    }

    onChange();
  }

  /* THE PAGE IS SERVED WITH NO FILTER ON IT, which IS the ALL tab — so the first
     thing this does is say so. The markup carries no pressed state and no chosen
     tab, deliberately: hard-coding one would be a second statement of "ALL is the
     default" to keep in step with this file, and the two would disagree the first
     time the order of KINDS changed. Writing it here means the rule is stated
     once, and it is stated in the same call every later click makes. */
  apply(null);

  const ac = new AbortController();
  root.addEventListener(
    "click",
    (e) => {
      const tab = (e.target as Element | null)?.closest<HTMLButtonElement>(
        ".index-tab",
      );
      if (!tab || !root.contains(tab)) return;
      const kind = tab.dataset.kind || null;
      /* The tab that is already on. Re-applying would replay the whole wall for
         a click that changed nothing, which reads as a glitch rather than as a
         choice. */
      if ((root.dataset[ATTR] || null) === kind) return;
      apply(kind);
    },
    { signal: ac.signal },
  );

  return {
    stop: () => {
      ac.abort();
      /* Back to the whole wall. A teardown must never leave the page showing
         four of nine stories with nothing left running to put the rest back —
         the same rule every teardown on this site follows. */
      delete root.dataset[ATTR];
    },
  };
}
