/* The contact page's shape, and the half of it that is safe anywhere.
 *
 * SPLIT FOR THE REASON tape-types.ts IS SPLIT. Its sibling, ./contact.ts,
 * imports the Payload config and drags the Postgres adapter in with it — fatal
 * in a client component, and the note's face is drawn in one. Everything that
 * does not need the database is here and is importable from either side of the
 * line; ./contact.ts re-exports it, so a server component can carry on asking
 * one module for all of it.
 */

/** Something to click, and the words on it. Two strings and not one, because
 *  the note is drawn in capitals and a `tel:` cannot carry the spaces a number
 *  is read with — see the note over the CONTACT global's href fields. */
export type ContactLink = { label: string; href: string };

/** How to reach the company. Printed on the sticky note, and printed again —
 *  invisibly — as real links under the section, which is what a screen reader
 *  announces and what a search engine indexes. */
export type ContactDetails = { email: ContactLink; phone: ContactLink };

/** One box on the form: what it is called, and what a browser should make of
 *  it. The last two are not editable — see FIELD_KINDS. */
export type ContactField = {
  key: FieldKey;
  label: string;
  type: string;
  complete: string;
};

export type FieldKey = keyof typeof FIELD_KINDS;

/** The whole page, as the section wants it. */
export type ContactContent = {
  kicker: string;
  heading: string[];
  sheetHeading: string[];
  fields: ContactField[];
  messageLabel: string;
  sendLabel: string;
  details: ContactDetails;
  /** The strip pinning the note down. Empty string when none is set, which
   *  draws no tape rather than a broken image. */
  tape: string;
  meta: { title: string; description: string };
};

/* WHAT EACH FIELD IS, AS OPPOSED TO WHAT IT IS CALLED — and it is here, in
 * code, on purpose.
 *
 * `type` and `autocomplete` are a contract with the BROWSER rather than copy. A
 * phone field that stopped being a phone field would stop raising a keypad on a
 * phone and stop autofilling, and neither failure is visible to the person who
 * caused it: the page still looks exactly right. So the CMS holds the label and
 * a key, and the key picks the pair out of here.
 *
 * The tokens are the standard ones — this is a contact form and the browser
 * already knows all four answers.
 */
export const FIELD_KINDS = {
  name: { type: "text", complete: "name" },
  company: { type: "text", complete: "organization" },
  phone: { type: "tel", complete: "tel" },
  email: { type: "email", complete: "email" },
} as const;
