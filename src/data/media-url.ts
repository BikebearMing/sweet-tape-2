/* An uploaded file, as the URL the markup wants.
 *
 * ONE COPY OF THE STAMP. The newsroom, the tapes and the contact page all turn
 * a Media document into a src, and all three want the same thing done to it —
 * so it is done here rather than three times. It was three times briefly, and
 * three copies of a cache-busting scheme is two chances to fix a cache bug and
 * miss it.
 *
 * WHY THE STAMP. /api/media/file/... is served with a year's immutable caching
 * (see next.config.mjs), which is only safe because REPLACING a file moves its
 * updatedAt and so changes this URL. An editor drops a new roll on a field and
 * every browser sees it at once, rather than whenever its copy happens to
 * expire. Without the stamp the choice would be between a year-long cache and a
 * site that could be corrected, and it would have to be the second.
 *
 * Base 36 for length alone — a millisecond timestamp is thirteen digits and
 * eight characters, and this is on the end of every image URL on the site.
 */

/** A URL with its version on the end. Returns it untouched if the timestamp is
 *  unparseable — a URL that is merely uncached is a working image, and dropping
 *  the file over a bad date would not be. */
export function withVersion(url: string, updatedAt: string): string {
  const v = Date.parse(updatedAt);
  if (Number.isNaN(v)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${v.toString(36)}`;
}

/** An upload field, as a src.
 *
 *  Empty string when the field is unset or came back as a bare id — a query at
 *  depth 0 does the latter — because rendering src="" is a visible hole rather
 *  than a crash, which is the right failure for a missing picture. Callers that
 *  have a fallback should turn "" into undefined at the point they read it. */
export function urlOf(image: unknown): string {
  if (!image || typeof image !== "object") return "";

  const m = image as { url?: string | null; updatedAt?: string };
  if (!m.url) return "";
  if (!m.updatedAt) return m.url;

  return withVersion(m.url, m.updatedAt);
}
