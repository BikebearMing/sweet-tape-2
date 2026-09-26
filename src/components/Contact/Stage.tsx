"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { initNote } from "@/components/Hero/note";
import type { ContactDetails } from "@/data/contact-types";
import { contactFace } from "./face";
import { initContactReveal } from "./reveal";

/* The only client component on the contact page.
 *
 * Everything inside it is server-rendered markup passed through as children —
 * this exists purely to own a ref to the section and hand it to the two things
 * that need one on mount. Keeping the boundary this thin means the copy stays
 * on the server and none of it ships in the client bundle twice. The hero, the
 * slider and the footer are all built the same way.
 *
 * THE DETAILS COME THROUGH AS A PROP and are the one piece of content that
 * does. Everything else on this page is server-rendered markup passed as
 * children; the address is not markup — it is painted into a canvas texture, so
 * it has to reach the client as a value. Two plain strings and their two hrefs,
 * which is the smallest thing that could cross the line.
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
export default function Stage({
  children,
  details,
}: {
  children: ReactNode;
  details: ContactDetails;
}) {
  const ref = useRef<HTMLElement>(null);

  /* Pulled out of the record here rather than read inside the effect, so the
     dependency list below is these two strings and nothing else. */
  const email = details.email.label;
  const phone = details.phone.label;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const stopReveal = initContactReveal(root);
    /* Half the hero's weather: this note carries the address and is read,
       where the hero's is a prop in the corner of the eye. */
    const stopNote = initNote(root, contactFace({ email, phone }), 0.5);

    /* THE SEND. The fields go to the Messages collection over Payload's own
     * REST route — no bespoke endpoint, no mail service; the admin is the
     * inbox (see src/collections/Messages.ts, which argues it).
     *
     * THE BUTTON IS THE WHOLE REPORT. It is the thing that was pressed and
     * where the eye already is, so every state is written on it — checking,
     * sending, sent, failed — as text, because text needs no stylesheet and
     * wraps honestly inside the lime block at any length. aria-live on the
     * button (index.tsx) is what reads the same words to a screen reader.
     *
     * SENT IS A FULL STOP: the button stays disabled so one message cannot be
     * filed twice by an impatient double-press. Failure re-arms it, and points
     * at the email address on the note beside the form — the reader's way out
     * of a broken network is standing right there.
     *
     * The two checks mirror the collection's own required fields. Client-side
     * only as a courtesy (the server enforces them regardless): a reader who
     * pressed SEND on an empty form is told what is missing rather than shown
     * a failure they did not earn.
     *
     * The state strings are code and not CMS copy, unlike every heading on
     * this page: they are the machine reporting on itself mid-act, not the
     * page's voice. If the owner ever wants to edit them, they move into the
     * Contact global beside sendLabel.
     *
     * A listener rather than an onSubmit prop, because the form is in the
     * server-rendered children and this component never sees it as an element.
     * Scoped to this section's own form, so it cannot catch anyone else's. */
    const form = root.querySelector<HTMLFormElement>(".contact-form");
    const button = form?.querySelector<HTMLButtonElement>(".contact-send");
    let busy = false;
    const say = (text: string) => {
      if (button) button.textContent = text;
    };
    const send = (e: SubmitEvent) => {
      e.preventDefault();
      if (!form || !button || busy) return;
      const data = Object.fromEntries(new FormData(form)) as Record<
        string,
        string
      >;
      if (!data.email?.trim()) return say("ADD AN EMAIL FIRST");
      if (!data.message?.trim()) return say("WRITE A MESSAGE FIRST");
      busy = true;
      button.disabled = true;
      say("SENDING…");
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          say("SENT — WE’LL BE IN TOUCH");
        })
        .catch(() => {
          busy = false;
          button.disabled = false;
          say("COULDN’T SEND — EMAIL US INSTEAD");
        });
    };
    form?.addEventListener("submit", send);

    return () => {
      form?.removeEventListener("submit", send);
      stopReveal();
      stopNote();
    };
    /* THE TWO LABELS ARE THE DEPENDENCY, AND NOT `details`.
     *
     * The note is drawn once on mount from what is passed in, so a change to
     * what is written on it has to re-run this or the old address stays painted
     * on the paper — which is the case live preview creates on every save.
     *
     * But `details` is a fresh object on every server render, and depending on
     * it would tear down and rebuild a three.js scene any time this component
     * re-rendered for a reason that had nothing to do with the address. What is
     * actually drawn is these two strings; the hrefs are markup and are not this
     * effect's business. So the dependency is what the drawing reads. */
  }, [email, phone]);

  return (
    <section ref={ref} className="contact-section">
      {children}
    </section>
  );
}
