"use client";

import { useEffect, useRef, useState } from "react";
import { FaFacebookF, FaLink, FaLinkedin, FaRegEnvelope } from "react-icons/fa6";

/* The four ways out of the story — and the only client component on this page
 * besides the Stage.
 *
 * IT IS A CLIENT COMPONENT FOR ONE REASON: a share link needs the story's
 * ABSOLUTE address, and the server does not have one. Next hands a request its
 * path, not its origin; the origin is behind whatever proxy, preview domain or
 * custom host the deployment happens to be on, and a constant written here
 * would be a link that works on production and shares localhost from anybody
 * else's machine. The browser knows exactly where it is, so it is asked.
 *
 * SERVED WITH THE PATH AND UPGRADED ON MOUNT, rather than served with nothing.
 * The first render is the path this page was rendered for, so the markup that
 * reaches the reader already has four real anchors with hrefs — focusable,
 * in the tab order, and readable by anything crawling the page — and the effect
 * swaps in the absolute URL a frame later. What is NOT possible is a share
 * intent that works with no JavaScript at all: an external service needs the
 * whole address and only the browser has it. Nothing is lost by that here, the
 * story is the page and the address is in the address bar.
 *
 * THE FOURTH IS A BUTTON AND THE OTHER THREE ARE LINKS, which is the honest
 * split: three of them go somewhere and one of them acts on this page. A copy
 * control marked up as a link is a link that lies to the keyboard, and the site
 * has no other case of it.
 *
 * THE MARKS ARE react-icons, which is what the footer's social discs already
 * draw with — one glyph set for every logotype on the site rather than four
 * hand-copied paths that would be somebody's job to keep current. They render
 * at 1em square in currentColor, so their size is a font-size on the button and
 * their colour is the button's ink; global.css says so where it sets both.
 * The two brand marks are drawn as their owners draw them — an `f` on its own
 * and an `in` in its tile — because a logotype redrawn to match a house style
 * is a logotype nobody recognises.
 */

/* How long the copy button says it has copied. Long enough to be seen after a
   click that has no other visible effect, short enough that a reader who copies
   twice gets told twice rather than watching the first word still standing. */
const COPIED_FOR = 1800;

type Props = {
  /** The story's headline, for the mail subject. */
  title: string;
  /** Where this page lives, as a path — the pre-hydration address, and the
      thing window.location replaces. */
  path: string;
};

export default function Share({ title, path }: Props) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* href, not pathname: the whole address, hash and query included, because
     what is being shared is the page as the reader has it. */
  useEffect(() => setUrl(window.location.href), []);

  /* A pending "copied" that outlives the component would be a setState on
     nothing — and on this site that is a route change, which happens under a
     sheet of paper while this timer is still counting. */
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const link = encodeURIComponent(url);
  const subject = encodeURIComponent(title);

  async function copy() {
    /* Not everywhere, and not in every context: the API is secure-context only,
       so an http:// preview or an old browser lands here. Nothing is done about
       it beyond not pretending — the button simply does not report a copy it
       did not make. */
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  }

  /* A plain box and not the <aside> it looks like: the column this stands in IS
     the aside (see Article/index.tsx), and it holds the way back as well. Two
     nested complementary landmarks would be one region announced twice. */
  return (
    <div className="article-share">
      {/* The label and the rule under it. Not a heading: this is four controls
          in a corner of the page, and a reader tabbing the headings of an
          article should meet its sections, not its furniture. */}
      <p className="article-share-label">SHARE</p>

      <div className="article-share-row">
        {/* THE SUBJECT IS THE HEADLINE AND THE BODY IS THE LINK, which is what
            a person forwarding a story would write themselves. No `to`, so it
            opens on an empty address line with the rest already filled in. */}
        <a
          className="article-share-link"
          href={`mailto:?subject=${subject}&body=${link}`}
          aria-label="Share this story by email"
        >
          <FaRegEnvelope />
        </a>

        {/* Both of these are the plain, documented share endpoints — no SDK, no
            script tag, nothing loaded from either company. A share button that
            costs the reader a third-party bundle is a tracker with an icon on
            it. rel includes noopener because target is _blank; the referrer is
            left alone, since the whole point is to tell them where the link
            came from. */}
        <a
          className="article-share-link"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`}
          target="_blank"
          rel="noopener"
          aria-label="Share this story on LinkedIn"
        >
          <FaLinkedin />
        </a>

        <a
          className="article-share-link"
          href={`https://www.facebook.com/sharer/sharer.php?u=${link}`}
          target="_blank"
          rel="noopener"
          aria-label="Share this story on Facebook"
        >
          <FaFacebookF />
        </a>

        <button
          className="article-share-link"
          type="button"
          onClick={copy}
          data-copied={copied || undefined}
          aria-label={copied ? "Link copied" : "Copy a link to this story"}
        >
          <FaLink />
        </button>
      </div>

      {/* THE ONLY THING THAT ANNOUNCES THE COPY. The button's own aria-label
          changes with it, but a label a reader is no longer on is a label
          nobody hears — so the news is put in a live region as well, which is
          read wherever the focus is. Empty the rest of the time, so there is
          nothing standing in the page waiting to be stumbled over. */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
