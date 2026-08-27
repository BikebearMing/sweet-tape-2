/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { letters } from "@/components/letters";
import { getContact } from "@/data/contact";
import Stage from "./Stage";

/* LET'S STICK TOGETHER — /contact, and the whole of it.
 *
 * The page's own lime sheet with the line set across the top of it, a piece of
 * cream paper laid over the bottom half carrying the form, and the sticky note
 * pinned across the join between them. The footer's arc rises into the paper
 * from below, which is why this section pays --contact-arc at its foot — the
 * toll every section that ends a page pays, argued at length on .pick-player.
 *
 * THE PAPER IS THE ARTICLE'S PAPER, and that is reuse rather than resemblance:
 * 182px of lime either side of a 1076px sheet is the same 1076px sheet
 * /news/[id] is written on, down to the 107px it is padded by and the 46px
 * radius on its corners. What differs is what is laid on it — a form rather
 * than five paragraphs — so the geometry is shared and nothing else is.
 *
 * THE NOTE IS THE HERO'S NOTE. Same stock, same wind, same light, same resting
 * curl — a real 3D sheet fluttering on the board (Hero/stickyNote.ts, mounted
 * by Hero/note.ts). The only thing this page changes is what is printed on the
 * paper, which is drawn into the texture's canvas rather than shipped as
 * artwork: see Contact/face.ts, which argues why.
 *
 * Server-rendered like every other section. Stage is the hair-thin client
 * wrapper that owns the ref; nothing below this line is a client component.
 */

/* THE COPY IS THE CMS'S NOW, all of it — the kicker, both headlines, the four
 * field labels, the words on the button, and the address and number written on
 * the note. It arrives from src/data/contact.ts, which reads one global and
 * falls back to exactly what this file used to hold if nobody has saved it yet.
 *
 * THE BREAKS ARE STILL BREAKS AND NOT WRAPPING. Each headline comes back as two
 * strings because the design breaks it where it breaks it — the CMS holds two
 * boxes for the same reason this file held two constants, and a .split(" ") at
 * render time would be the page inferring a drawing decision from a space.
 *
 * WHAT DID NOT MOVE: the arrangement. Which corner the chip sits in, how the
 * paper is perforated, where the note is pinned across the join. Those are
 * drawings, and a drawing does not become editable by being turned into a field.
 *
 * AND NOT THE FIELDS' TYPES. The CMS holds what each box is CALLED; what each
 * box IS — its input type and what a browser autofills into it — is a contract
 * with the browser rather than copy, and lives in FIELD_KINDS over in
 * src/data/contact-types.ts. See the note there, which argues it: a phone field
 * that quietly stopped being one still looks perfectly right.
 */

export default async function Contact() {
  const {
    kicker,
    heading,
    sheetHeading,
    fields,
    messageLabel,
    sendLabel,
    details,
    tape,
  } = await getContact();

  return (
    <Stage details={details}>
      {/* WITHOUT JAVASCRIPT THE TYPE NEVER ARRIVES. Both the headline's letters
          and the sheet's are parked by global.css and released by the section's
          own script, and the chip is held out of sight by the same hold — so a
          page where reveal.ts never runs is a lime sheet with a blank form on
          it. The stylesheet's hold is lifted here instead, which costs nothing
          when scripting is on: the contents are not even parsed. The hero, the
          row at /products, the closing key visual and the footer all carry the
          same escape.

          THE PAPER IS HELD THE SAME WAY, and it is held at nothing rather than
          under a mask — its entrance resolves it out of a blur, and a blur has
          to start from something the reader has not seen standing. So the whole
          page, form included, is behind this one escape: without it a scriptless
          load is a lime sheet with a headline missing and a blank space where
          the form is.

          THE NOTE IS NOT IN THE ESCAPE because it is not held in the first
          place — it is on the board from the first frame rather than arriving,
          so there is nothing to let go of.

          THE FORM ITSELF HAS NO ENTRANCE, which is worth saying rather than
          leaving to be noticed: five fields and a button arriving one after
          another is a page assembling itself in front of somebody who came here
          to type. The paper arrives carrying them. */}
      <noscript>
        <style>{`.contact-section .char { transform: none }
          .contact-section .contact-chip,
          .contact-section .contact-sheet { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <header className="contact-head">
        {/* THE CHIP IS THE SITE'S CHIP — the slider's, which the news pages and
            the product pages all wear as well. Same shape, same perforation
            punched down its left edge; this only says where it goes and what
            pair of colours it is printed in, which is the split the chip's own
            note in global.css makes at length.

            Out of the accessibility tree: it is a label on the page, and the
            page is already named by the h1 under it — announced, it would read
            as a first heading saying nearly what the second says. */}
        <p className="subhead contact-chip" aria-hidden="true">
          {kicker}
        </p>

        {/* The page's one h1. Split to letters for the reveal, which is the
            hero's and the footer's — each waits below its own mask and slides
            up in a shuffled order (reveal.ts).

            AND SET ON THE SITE'S ARC, which is the same two custom properties
            every warped headline here carries: --letters on the row and --i on
            each letter (emitted by letters()) are everything the curve in
            global.css needs to place a letter on it. The hero's title, the
            footer's and the news title card's are marked up identically — the
            curvature is one figure in em and only the type size differs.

            aria-label rather than a second hidden copy of the words: it is
            honoured on a heading, so the line is announced whole and the rows
            of letter boxes are never read out a fragment at a time. */}
        <h1 className="contact-title" aria-label={heading.join(" ")}>
          {heading.map((line, i) => (
            <span
              className="line"
              key={i}
              aria-hidden="true"
              style={{ "--letters": line.length } as CSSProperties}
            >
              {letters(line)}
            </span>
          ))}
        </h1>
      </header>

      {/* THE PAPER. Rounded on all four corners though only three are ever seen
          — the footer's arc rises over the fourth — because a radius written
          for the corners that show is a figure that is wrong the moment the arc
          is retuned. The article sheet makes the same call for the same reason.

          Perforated along its top edge, which is the sheet's one piece of
          drawing and the same one /news/[id] carries. */}
      <div className="contact-sheet">
        {/* The sheet's own heading. Split like the h1 above and revealed one
            beat later off its own cue, because it is a screen lower and the
            reader has to scroll to it — see CONTACT_REVEAL.SHEET_START.

            An h2 and not an h1: the page is named above, and this names the
            form inside it. */}
        <h2 className="contact-sheet-head" aria-label={sheetHeading.join(" ")}>
          {sheetHeading.map((line, i) => (
            <span className="line" key={i} aria-hidden="true">
              {letters(line)}
            </span>
          ))}
        </h2>

        {/* A REAL <form> WITH NOTHING BEHIND IT YET, which is deliberate on both
            counts. The element is what makes this a form to a browser and to a
            screen reader — the labels bind, the keyboard works, autofill works,
            Enter submits — and none of that should wait on a backend. What is
            missing is only the POST: Stage.tsx swallows the submit and says
            exactly where the call goes when there is one to make. */}
        <form className="contact-form" noValidate>
          <div className="contact-fields">
            {fields.map((field) => (
              /* The label is real and hidden rather than absent, with the
                 placeholder carrying the same words. A placeholder alone is a
                 name that disappears the moment anyone types into the field,
                 which is the oldest bug in form design; the site's own idiom
                 for this is .sr-only, used the same way by the footer's legal
                 line and the hero's corner mark. */
              <p className="contact-field" key={field.key}>
                <label className="sr-only" htmlFor={`contact-${field.key}`}>
                  {field.label}
                </label>
                <input
                  className="contact-input"
                  id={`contact-${field.key}`}
                  name={field.key}
                  type={field.type}
                  placeholder={field.label}
                  autoComplete={field.complete}
                />
              </p>
            ))}

            {/* The message, across both columns. A <textarea> and not a tall
                input: it is the one field somebody writes a paragraph into, and
                the placeholder sits at the top of the box rather than in the
                middle of it for that reason alone. */}
            <p className="contact-field contact-field--message">
              <label className="sr-only" htmlFor="contact-message">
                {messageLabel}
              </label>
              <textarea
                className="contact-input contact-textarea"
                id="contact-message"
                name="message"
                placeholder={messageLabel}
                rows={4}
              />
            </p>
          </div>

          {/* SEND — one tall lime block down the right of the fields rather than
              a button under them, which is the design's arrangement and reads as
              the thing the whole sheet is pointed at. A real <button> inside the
              form, so Enter in any field submits it. */}
          <button className="contact-send" type="submit">
            {sendLabel}
          </button>
        </form>
      </div>

      {/* THE NOTE, PINNED ACROSS THE JOIN between the lime and the paper — the
          one object on the page that belongs to neither sheet, which is what
          makes it read as put there afterwards.

          AND IT HAS NO ENTRANCE, which is the one thing about it worth stating.
          It is on the board and already fluttering when the cover lifts, while
          the chip turns and the paper is laid down around it — nothing parks it
          in the stylesheet and nothing plays it in reveal.ts. A note that
          arrives is a note being placed; this one was stuck there beforehand.

          The slot is EMPTY BY DESIGN: Hero/note.ts appends the canvas into it,
          and the slot is deliberately bigger than the sheet — the note rests at
          NOTE.SPAN of this box and the rest is the room its corners swing into
          on a gust. Aim its CENTRE when placing it, not its edges.

          THE DETAILS ARE READABLE WITHOUT ANY OF IT. What is drawn into the
          texture is a picture of an address as far as a browser is concerned,
          so the address and the number are also here as real links, visually
          hidden — which is what a screen reader announces, what a search engine
          indexes, and what is left if three.js never arrives. */}
      <div className="contact-note" aria-hidden="true">
        <div className="sticky-note" />
        <img className="contact-note-tape" src={tape} alt="" />
      </div>

      <p className="sr-only">
        <a href={details.email.href}>{details.email.label}</a>{" "}
        <a href={details.phone.href}>{details.phone.label}</a>
      </p>
    </Stage>
  );
}
