"use client";

import { useRowLabel } from "@payloadcms/ui";

/* WHAT AN ARRAY ROW IS CALLED WHEN IT IS SHUT.
 *
 * Payload names a collapsed row after its position — "Superpower 01", "Item
 * 02" — which is true and tells an editor nothing. A tape has nine arrays on
 * it; opening rows one at a time to find the one you meant is the difference
 * between a form and a filing cabinet.
 *
 * This reads the row itself and shows what is actually in it. One component for
 * every array rather than one per shape, because the question is the same
 * everywhere — WHAT DOES THIS ROW SAY — and the answer is whichever of a few
 * known fields the row happens to carry.
 *
 * IT FALLS BACK TO THE NUMBER, which is the case that matters most: a row of
 * nothing but an upload has no words in it at all, and a picture cannot be
 * summarised in a label. Position is genuinely the best answer there, and it is
 * what Payload would have said anyway.
 *
 * A CLIENT COMPONENT, necessarily — it reads the row's live form state, so it
 * re-labels as somebody types rather than at the last save.
 */
export function RowLabel() {
  const { data, rowNumber } = useRowLabel<Record<string, unknown>>();

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  /* In the order the shapes appear on a tape: a line of copy, a two-line claim,
     anything else that calls itself a label. A `variant` was in this list while
     the siblings' labels were keyed by one; they are a bare upload now, so those
     rows take the number below, which is what the note above says is the honest
     answer for a row that is only a picture. */
  const name =
    str(data?.text) ||
    [str(data?.titleTop), str(data?.titleBottom)].filter(Boolean).join(" ") ||
    str(data?.label);

  /* rowNumber is zero-based; the heading it replaces is not. Padded to two
     digits so a list of ten does not jog left at the tenth. */
  const n = String((rowNumber ?? 0) + 1).padStart(2, "0");

  return <span>{name || n}</span>;
}
