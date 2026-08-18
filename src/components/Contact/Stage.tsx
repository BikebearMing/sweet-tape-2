"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initNote } from "@/components/Hero/note";
import { CONTACT_FACE } from "./face";
import { initContactReveal } from "./reveal";

/* The only client component on the contact page.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the two things
 * that need one on mount. Keeping the boundary this thin means the copy stays
 * on the server and none of it ships in the client bundle twice. The hero, the
 * slider and the footer are all built the same way.
 *
 * THE NOTE IS THE HERO'S, called with this page's face. Everything about being
 * a sticky note — the stock, the wind, the light, the shadow, the resting curl,
 * the scroll's draught and the cursor's stir — is one implementation, and the
 * only argument is what is printed on the paper. three.js is imported
 * dynamically inside it, so this page pays for the engine only if the slot is
 * actually on it.
 *
 * The two are independent: the type's arrival and the note share nothing but
 * the element they are scoped to, and either can fail to start without touching
 * the other — the physics is dynamically imported, so "fail to start" includes
 * a chunk that never arrives.
 *
 * Each returns its own teardown, so a StrictMode double mount tears down
 * cleanly and re-binds rather than stacking a second tween on the same letters
 * or running two engines over one canvas.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initContactReveal(root);
    const stopNote = initNote(root, CONTACT_FACE);

    /* THE FORM HAS NOWHERE TO GO YET, and this is the one line standing between
     * that and a page reload.
     *
     * A <form> with no action submits to its own URL on Enter or on SEND, which
     * would throw away everything typed and look like a crash. Swallowing the
     * event is what "the UI is built, the wiring is not" honestly looks like —
     * the markup is a real form, the labels bind, autofill works, the keyboard
     * works, and the only thing absent is the call.
     *
     * WHEN THERE IS A BACKEND, IT GOES HERE: read the fields off
     * `new FormData(form)` and POST them, then report the result on the button.
     * Nothing else in this section needs to change — the fields already carry
     * the names a payload would want (see FIELDS in index.tsx).
     *
     * A listener rather than an onSubmit prop, because the form is in the
     * server-rendered children and this component never sees it as an element.
     * Scoped to this section's own form, so it cannot catch anyone else's. */
    const form = root.querySelector<HTMLFormElement>(".contact-form");
    const swallow = (e: SubmitEvent) => e.preventDefault();
    form?.addEventListener("submit", swallow);

    return () => {
      form?.removeEventListener("submit", swallow);
      stopReveal();
      stopNote();
    };
  }, []);

  return (
    <section ref={ref} className="contact-section">
      {children}
    </section>
  );
}
