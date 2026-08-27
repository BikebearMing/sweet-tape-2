"use client";

import { RefreshRouteOnSave as PayloadRefresh } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

/* Live preview's other half.
 *
 * The admin puts the site in an iframe beside the editor and posts a message
 * into it every time the document is saved. This listens for that message and
 * calls router.refresh(), which re-runs the server components and swaps the new
 * markup in — so the preview shows what the page will actually look like,
 * rendered the same way a visitor's would be.
 *
 * WHY REFRESH RATHER THAN THE useLivePreview HOOK. The hook keeps a client-side
 * copy of the document and re-renders from it as fields change, which updates on
 * every keystroke but only works in a client component holding that state. Every
 * piece of the newsroom is a server component that draws from a Payload query,
 * and rewriting the article, the cards and the rail as client components to gain
 * keystroke-level preview would move the whole newsroom into the browser bundle.
 * Refresh-on-save costs a save to see a change and keeps the preview honest —
 * it is the real page, not a client-side approximation of it.
 *
 * INERT OUTSIDE THE IFRAME. It only ever acts on a message from the admin, so
 * on an ordinary visit this mounts, listens, and does nothing.
 */
export default function LivePreview() {
  const router = useRouter();

  /* WHERE THE ADMIN IS, ASKED RATHER THAN CONFIGURED. serverURL is what the
     listener checks an incoming message's origin against, and the admin is this
     same Next app — same host, same port, always. Reading it off the document
     means there is no build-time constant to get wrong: a NEXT_PUBLIC_ variable
     would be inlined into this bundle when the image is built, so pointing the
     site at a domain later would mean rebuilding rather than editing an
     environment variable.

     Empty string during the server render, which is correct — there is no
     window, and nothing to listen to until this mounts in the browser. */
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return <PayloadRefresh refresh={() => router.refresh()} serverURL={origin} />;
}
