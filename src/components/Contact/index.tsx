/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { letters } from "@/components/letters";
import { CONTACT } from "@/data/contact";
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

/* Section-level copy — the obvious CMS fields, so they are named constants
   rather than strings buried in the markup, the same call the hero, the slider
   and the footer make. The headline's break is set by DESIGN and not by
   wrapping, which is why it is two strings and not one. */
const KICKER = "GET IN TOUCH";
const HEADING = ["LET’S STICK", "TOGETHER"];
const SHEET_HEADING = ["DROP US A", "MESSAGE"];

/* The strip of tape holding the note to the board. The hero's own roll, at the
   hero's own size — one board, one roll. */
const TAPE = "/assets/tape-on-note.webp";

/* THE FORM'S FIELDS ARE DATA and not markup, which is what makes the row below
 * four lines instead of forty — and, more to the point, what makes changing one
 * a one-line change rather than an edit in three places.
 *
 * THE DESIGN LABELS THE SECOND FIELD "NAME", the same as the first, and that is
 * almost certainly a placeholder that did not get updated: two fields with one
 * name is a form nobody can fill in and a screen reader cannot announce. COMPANY
 * is the reading taken here — it is the pairing a business enquiry form wants
 * beside PHONE NUMBER and EMAIL — and it is one string away from being whatever
 * the design meant instead.
 *
 * `autoComplete` on every one of them: this is a contact form, the browser
 * already knows all five answers, and the tokens are the standard ones. */
const FIELDS = [
  { name: "name", label: "NAME", type: "text", complete: "name" },
  { name: "company", label: "COMPANY", type: "text", complete: "organization" },
  { name: "phone", label: "PHONE NUMBER", type: "tel", complete: "tel" },
  { name: "email", label: "EMAIL", type: "email", complete: "email" },
] as const;

export default function Contact() {
  return (
    <Stage>
      {/* WITHOUT JAVASCRIPT THE TYPE NEVER ARRIVES. Both the headline's letters
          and the sheet's are parked by global.css and released by the section's
          own script, and the chip is held out of sight by the same hold — so a
          page where reveal.ts never runs is a lime sheet with a blank form on
          it. The stylesheet's hold is lifted here instead, which costs nothing
          when scripting is on: the contents are not even parsed. The hero, the
          row at /products, the closing key visual and the footer all carry the
          same escape.

          THE PAPER AND THE NOTE ARE HELD THE SAME WAY, and they are held at
          nothing rather than under a mask — their entrance resolves them out of
          a blur, and a blur has to start from something the reader has not seen
          standing. So the whole page, form included, is behind this one escape:
          without it a scriptless load is a lime sheet with a headline missing,
          a blank space where the form is and no note at all.

          THE FORM ITSELF HAS NO ENTRANCE, which is worth saying rather than
          leaving to be noticed: five fields and a button arriving one after
          another is a page assembling itself in front of somebody who came here
          to type. The paper arrives carrying them. */}
      <noscript>
        <style>{`.contact-section .char { transform: none }
          .contact-section .contact-chip,
          .contact-section .contact-sheet,
          .contact-section .contact-note { opacity: 1; visibility: visible }`}</style>
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
          {KICKER}
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
        <h1 className="contact-title" aria-label={HEADING.join(" ")}>
          {HEADING.map((line) => (
            <span
              className="line"
              key={line}
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
        <h2 className="contact-sheet-head" aria-label={SHEET_HEADING.join(" ")}>
          {SHEET_HEADING.map((line) => (
            <span className="line" key={line} aria-hidden="true">
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
            {FIELDS.map((field) => (
              /* The label is real and hidden rather than absent, with the
                 placeholder carrying the same words. A placeholder alone is a
                 name that disappears the moment anyone types into the field,
                 which is the oldest bug in form design; the site's own idiom
                 for this is .sr-only, used the same way by the footer's legal
                 line and the hero's corner mark. */
              <p className="contact-field" key={field.name}>
                <label className="sr-only" htmlFor={`contact-${field.name}`}>
                  {field.label}
                </label>
                <input
                  className="contact-input"
                  id={`contact-${field.name}`}
                  name={field.name}
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
                MESSAGE
              </label>
              <textarea
                className="contact-input contact-textarea"
                id="contact-message"
                name="message"
                placeholder="MESSAGE"
                rows={4}
              />
            </p>
          </div>

          {/* SEND — one tall lime block down the right of the fields rather than
              a button under them, which is the design's arrangement and reads as
              the thing the whole sheet is pointed at. A real <button> inside the
              form, so Enter in any field submits it. */}
          <button className="contact-send" type="submit">
            SEND
          </button>
        </form>
      </div>

      {/* THE NOTE, PINNED ACROSS THE JOIN between the lime and the paper — the
          one object on the page that belongs to neither sheet, which is what
          makes it read as put there afterwards.

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
        <img className="contact-note-tape" src={TAPE} alt="" />
      </div>

      <p className="sr-only">
        <a href={CONTACT.email.href}>{CONTACT.email.label}</a>{" "}
        <a href={CONTACT.phone.href}>{CONTACT.phone.label}</a>
      </p>
    </Stage>
  );
}
