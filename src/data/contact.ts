/* Sweet Tape — how to reach the company.
 *
 * Two facts, and they are here rather than in the contact page's markup for one
 * reason: the page is not the only thing that prints them. The sticky note on
 * that page is a 3D sheet whose face is DRAWN INTO A CANVAS (see
 * Contact/face.ts), so the address and the number have to exist as strings a
 * long way from any JSX — and an address typed twice is an address that is
 * wrong in one of the two places the day it changes.
 *
 * THE DISPLAY FORM AND THE MACHINE FORM ARE BOTH HERE, and they are different
 * strings on purpose. The note is set in capitals because that is how the
 * design draws it, and a `tel:` href cannot carry the spaces the number is read
 * with — so `href` is what a browser dials and `label` is what a person reads.
 * Deriving one from the other would be a formatter nobody asked for.
 */

export const CONTACT = {
  email: {
    label: "SALES@SBGROUP.COM.MY",
    href: "mailto:sales@sbgroup.com.my",
  },
  phone: {
    label: "+603 8946 3600",
    href: "tel:+60389463600",
  },
} as const;
