import { getPayload } from "payload";

import config from "@/payload.config";

import { urlOf } from "./media-url";
import {
  FIELD_KINDS,
  type ContactContent,
  type ContactField,
  type FieldKey,
} from "./contact-types";

/* Sweet Tape — how to reach the company, and everything else /contact says.
 *
 * THE SEAM, NOW PLUGGED IN. This file used to hold the address and the number
 * as a frozen constant, and the page held its own headings; both are a global
 * in the CMS now (src/globals/Contact.ts). What it exports is the same shape
 * the section always drew, over a Payload query.
 *
 * THE TYPES AND THE FIELD KINDS MOVED, to ./contact-types. This module imports
 * the Payload config, which drags the Postgres adapter with it — fatal in a
 * client component, and the note's face is drawn in one. Re-exported below so a
 * server component can carry on asking one module for all of it.
 *
 * THE DETAILS ARE STILL STRINGS A LONG WAY FROM ANY JSX, which was the original
 * reason this file existed and has not changed. The sticky note is a 3D sheet
 * whose face is DRAWN INTO A CANVAS (see components/Contact/face.ts) — there is
 * no DOM text that could sit over a sheet that bends — so the address has to
 * arrive as a value that can be handed to a drawing function. What changed is
 * only where the value comes from.
 */

export type {
  ContactContent,
  ContactDetails,
  ContactField,
  ContactLink,
  FieldKey,
} from "./contact-types";
export { FIELD_KINDS } from "./contact-types";

/* WHAT IS SHOWN IF THE RECORD HAS NEVER BEEN SAVED.
 *
 * A global exists the moment it is declared and is EMPTY until somebody opens
 * it and presses save — so between deploying this and an editor's first visit,
 * every field below is null. Falling back to what the page said before means
 * that window is invisible: /contact is the page it has always been, and
 * editing it changes it.
 *
 * The alternative was `required: true` doing the work, and it does not: required
 * is enforced when the document is SAVED, not when it is read, and an unsaved
 * global is not a validation error — it is an absence. A page that threw on one
 * would 500 on the day it shipped.
 */
const FALLBACK = {
  kicker: "GET IN TOUCH",
  heading: ["LET’S STICK", "TOGETHER"],
  sheetHeading: ["DROP US A", "MESSAGE"],
  fields: [
    { key: "name", label: "NAME" },
    { key: "company", label: "COMPANY" },
    { key: "phone", label: "PHONE NUMBER" },
    { key: "email", label: "EMAIL" },
  ],
  messageLabel: "MESSAGE",
  sendLabel: "SEND",
  email: { label: "SALES@SBGROUP.COM.MY", href: "mailto:sales@sbgroup.com.my" },
  phone: { label: "+603 8946 3600", href: "tel:+60389463600" },
  tape: "/assets/tape-on-note.webp",
  metaTitle: "Contact — Sweet Tape",
  metaDescription:
    "Get in touch with Sweet Tape — S.B. Importer & Exporter (M) Sdn. Bhd.",
} as const;

/** Rows of `{ text }`, as the array of strings the design breaks by hand.
 *  Falls back whole rather than per line: half a headline from the CMS and half
 *  from here would be a pair of lines that were never written together. */
function lines(rows: { text: string }[] | null | undefined, fallback: readonly string[]) {
  const out = (rows ?? []).map((r) => r.text).filter(Boolean);
  return out.length ? out : [...fallback];
}

/** The four boxes, each carrying the label an editor typed and the browser
 *  contract its key picks out. A row whose key is not one of the four is
 *  dropped rather than rendered as a field with no type — the select makes that
 *  unreachable from the admin, and this is what happens if the option list is
 *  ever edited without the map beside it. */
function toFields(
  rows: { key?: string | null; label?: string | null }[] | null | undefined,
): ContactField[] {
  const out: ContactField[] = [];

  for (const row of rows ?? []) {
    const key = row.key as FieldKey;
    if (!key || !(key in FIELD_KINDS) || !row.label) continue;
    out.push({ key, label: row.label, ...FIELD_KINDS[key] });
  }

  return out.length
    ? out
    : FALLBACK.fields.map((f) => ({
        key: f.key as FieldKey,
        label: f.label,
        ...FIELD_KINDS[f.key as FieldKey],
      }));
}

/** Everything /contact prints. One document, one query — the page is a single
 *  section and there is nothing here to ask for separately. */
export async function getContact(): Promise<ContactContent> {
  const payload = await getPayload({ config });

  /* depth 1 resolves the tape strip to its Media document rather than its id. */
  const doc = await payload.findGlobal({ slug: "contact", depth: 1 });

  return {
    kicker: doc.kicker || FALLBACK.kicker,
    heading: lines(doc.heading, FALLBACK.heading),
    sheetHeading: lines(doc.sheetHeading, FALLBACK.sheetHeading),
    fields: toFields(doc.fields),
    messageLabel: doc.messageLabel || FALLBACK.messageLabel,
    sendLabel: doc.sendLabel || FALLBACK.sendLabel,

    details: {
      email: {
        label: doc.email?.label || FALLBACK.email.label,
        href: doc.email?.href || FALLBACK.email.href,
      },
      phone: {
        label: doc.phone?.label || FALLBACK.phone.label,
        href: doc.phone?.href || FALLBACK.phone.href,
      },
    },

    tape: urlOf(doc.tape) || FALLBACK.tape,

    meta: {
      title: doc.metaTitle || FALLBACK.metaTitle,
      description: doc.metaDescription || FALLBACK.metaDescription,
    },
  };
}
