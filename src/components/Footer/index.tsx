/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

import Stage from "./Stage";
import { bodyCopy } from "@/components/body";
import { letters } from "@/components/letters";
import { footerBalls, type SocialIcon } from "@/data/footerBalls";

/* The discs' marks. Icons rather than logo PNGs: three flat single-colour
   glyphs that take their colour from the ball they are printed on, so the
   badge is one custom property away from being any other pair of shades and
   there is nothing to re-export when it changes. The names are the seam —
   footerBalls.ts stays plain data and this is where they become components. */
const SOCIAL_ICONS: Record<SocialIcon, typeof FaTiktok> = {
  tiktok: FaTiktok,
  facebook: FaFacebookF,
  instagram: FaInstagram,
};

/* Section-level copy — the obvious CMS fields, so they are named constants
   rather than strings buried in the markup, the same call the hero and the
   slider make.

   The links are the menu's four routes in the footer's own order: the pull-down
   reads as a list and leads with ABOUT, this reads as a row across the foot of
   the page and leads with OUR FAMILY. Deliberately its own array rather than an
   import — when these routes gain children it is the menu that will grow them,
   and the footer row will stay four.

   OUR FAMILY'S SLUG IS /products, which is not a typo and is the only row here
   whose label and href are different words. The family IS the products; OUR
   FAMILY is how the brand says it in a nav and /products is what the page is
   called everywhere outside one. See (frontend)/products/page.tsx. */
const LINKS = [
  { label: "OUR FAMILY", href: "/products" },
  { label: "ABOUT", href: "/about" },
  { label: "NEWS", href: "/news" },
  { label: "CONTACT", href: "/contact" },
];

/* Two lines rather than one string, for the reason the hero's copy of this is
   two: the break is set by design, not by wrapping. */
const HEADLINE = ["STICK", "BY YOU"];

const LEGAL = "Copyright © 2026. S.B. Importer & Exporter(M) Sdn. Bhd.";

/* The footer, server-rendered.
 *
 * Two bands. The nav row across the top is in flow and sizes itself. Under it
 * is .footer-bottom, a box of one fixed height (--footer-bottom-h) that is the
 * drawing room for the rolls and the social discs — they are laid into it
 * absolutely, the way the hero's props are laid into its own .bottom-part, so
 * the height has to be declared rather than discovered. The headline sits in
 * flow inside that box and the rolls come down over it; the legal line is
 * pinned to its foot, between them.
 *
 * The rolls and the mark above the headline are not here yet. Nothing about
 * this arrangement is waiting on them — the box is already the size it will be
 * when they land, so what is here now is standing where it will stand.
 *
 * The only thing that runs is the reveal: Stage.tsx hands the section to
 * Footer/reveal.ts, which builds it paused and lets a ScrollTrigger play it as
 * the footer comes up the viewport.
 */
export default function Footer() {
  return (
    <Stage>
      {/* The letters are parked under their masks by global.css and released by
          Footer/reveal.ts. With no JS to release them the type — which is very
          nearly all this section is — would never arrive, so the stylesheet's
          hold is lifted here instead. Costs nothing when scripting is on: the
          contents are not even parsed. The hero carries the same escape. */}
      <noscript>
        <style>{`.site-footer .char, .site-footer .body-rise { transform: none }`}</style>
      </noscript>

      <nav className="footer-nav" aria-label="Footer">
        <ul>
          {LINKS.map(({ label, href }) => (
            <li key={href}>
              {/* The label is split to letters, so everything inside the link is
                  decoration as far as a screen reader is concerned: a row of
                  block-level letter boxes is otherwise liable to be announced a
                  fragment at a time. aria-label carries the readable name — the
                  same call the menu's rows make. */}
              <a className="footer-link" href={href} aria-label={label}>
                <span className="footer-link-label" aria-hidden="true">
                  {letters(label)}
                </span>
                {/* The lime full stop under each label. A real element rather
                    than a ::after because the reveal has to be able to reach it,
                    and a pseudo-element cannot be handed to GSAP. */}
                <span className="footer-link-dot" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="footer-bottom">
        {/* The mark goes here, above the headline. */}

        {/* One heading, two lines — splitting it across two would put STICK and
            BY YOU in the outline as separate headings. Split to letters like
            the hero's, and carrying the same two custom properties: --letters
            on the row and --i on each letter are everything the arc in
            global.css needs to place a letter on the curve. aria-label is
            honoured on a heading, so nothing hidden is needed for the readable
            copy. */}
        <h2 className="footer-headline" aria-label={HEADLINE.join(" ")}>
          {HEADLINE.map((line) => (
            <span
              className="line"
              key={line}
              aria-hidden="true"
              style={{ "--letters": line.length } as CSSProperties}
            >
              {letters(line)}
            </span>
          ))}
        </h2>

        {/* The rolls and the social discs, each already standing at its design
            position — global.css places every one of them from the three
            numbers below, so this is the finished composition with no JS at
            all. Footer/balls.ts hands them to Matter afterwards and writes an
            OFFSET from here, never an absolute position.

            The face is a separate element from the ball. The ball is the
            physical object — a circle of a certain size in a certain place —
            and the face is whatever is printed on it, so a roll's picture and
            a disc's mark are the same swap as far as the simulation is
            concerned: it measures the box, never the contents. */}
        <div className="footer-balls">
          {footerBalls.map((ball) => {
            const box = {
              "--ball-d": ball.d,
              "--ball-x": ball.x,
              "--ball-y": ball.y,
            } as CSSProperties;

            /* A disc that leads somewhere is an anchor; a roll is decoration
               until it has somewhere to lead. Same box either way — the physics
               finds them by class and does not care which it grabbed. */
            if (ball.kind === "social") {
              const Icon = SOCIAL_ICONS[ball.icon];
              return (
                <a
                  className="footer-ball footer-ball--disc"
                  key={ball.id}
                  style={
                    {
                      ...box,
                      "--ball-colour": ball.colour,
                      "--ball-ink": ball.ink,
                    } as CSSProperties
                  }
                  href={ball.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={ball.label}
                >
                  {/* aria-hidden and unfocusable: the anchor's own label is
                      what carries the name, and an <svg> is announced as a
                      graphic in some readers if it is left in the tree. */}
                  <Icon
                    className="footer-ball-mark"
                    aria-hidden="true"
                    focusable="false"
                  />
                </a>
              );
            }

            /* The roll's artwork is a printed circle, so it IS the ball —
               there is no coloured disc under it, and alt is empty because the
               wrapper is already out of the a11y tree. */
            return (
              <div
                className="footer-ball"
                key={ball.id}
                style={box}
                aria-hidden="true"
              >
                <img
                  className="footer-ball-art"
                  src={ball.art}
                  alt=""
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* The one piece of body copy in the footer, so it takes the BODY
            entrance and not the letter-by-letter one the row and the headline
            above it take — split to words and revealed a measured line at a
            time (components/bodyReveal.ts). One line as it is set, which is
            what that reveal resolves it to; it is written this way so a longer
            notice, or a narrower window, is still handled.

            aria-label is not honoured on a paragraph, so the readable copy is a
            real (hidden) text node and the split version is taken out of the
            tree — a row of inline boxes is otherwise liable to be announced a
            fragment at a time. */}
        <p className="footer-legal body-copy">
          <span className="sr-only">{LEGAL}</span>
          <span aria-hidden="true">{bodyCopy(LEGAL)}</span>
        </p>
      </div>
    </Stage>
  );
}
