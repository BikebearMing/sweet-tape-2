"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initBodyReveal } from "@/components/bodyReveal";
import { initPickCue } from "./cue";
import { initPickFan } from "./fan";
import { initPickRecolour } from "./recolour";
import { initPickReveal } from "./reveal";

/* The only client component in the section. It owns the ref and hands the
 * section to the three things that run in it.
 *
 * The headline's letters, the small print's lines and the row of rolls. All
 * three are independent — they share nothing but the element they are scoped
 * to, and any one can fail to start without touching the others. The closing
 * key visual's Stage and the footer's are built the same way and for the same
 * reason.
 *
 * THE ROW IS ONE CALL AND NOT TWO, which is the thing to keep. fan.ts owns both
 * the deal and the picking because they write the same transforms on the same
 * elements; splitting them into a file each — which is otherwise this section's
 * house pattern — would put two tweens on one roll the moment a reader hovered
 * before the drop had landed. See the note at the top of fan.ts.
 *
 * Everything inside is server-rendered markup passed through as children. The
 * copy, the order of the rolls and their artwork all stay on the server; this is
 * a ref and an effect.
 *
 * Every one of them returns its own teardown, so a StrictMode double mount tears
 * down cleanly and re-binds rather than stacking a second tween on the same
 * letters or a second pointer listener on the same row.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initPickReveal(root);
    const stopBody = initBodyReveal(root);

    /* THE THREE THAT ARE WIRED TOGETHER, and they are wired HERE rather than by
       one importing another. The fan knows which roll the pointer is over and
       nothing else; the recolour knows what a tape's colours do to a page; the
       cue knows how to write "click me!" onto a roll. Handing the first a
       callback into the other two is what keeps it that way — any of the three
       can be dropped and the rest still run, and the row can be picked up on a
       page that never changes colour and never says a word.

       ONE CALLBACK AND NOT TWO REGISTRATIONS, because both answers are to the
       same question and must not be able to disagree about it: the page becomes
       a tape and the cue appears on that tape's roll in the same tick, off the
       same element. fan.ts still knows about neither. */
    const recolour = initPickRecolour(root);
    const cue = initPickCue(root);
    const stopFan = initPickFan(root, (roll) => {
      recolour.paint(roll);
      cue.show(roll);
    });

    return () => {
      stopReveal();
      stopBody();
      stopFan();
      recolour.stop();
      cue.stop();
    };
  }, []);

  return (
    <section ref={ref} className="pick-player">
      {children}
    </section>
  );
}
