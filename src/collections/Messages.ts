import type { CollectionConfig } from "payload";

/* WHAT THE CONTACT FORM SENDS — one document per press of SEND.
 *
 * A collection and not an email, deliberately: the admin is already where the
 * owner reads everything else, a message stored is a message that cannot bounce,
 * and there is no mail service to sign up for, key to rotate or spam folder to
 * lose a customer in. If a notification email is ever wanted, it is an
 * afterChange hook on this collection — the form does not change.
 *
 * CREATE IS PUBLIC AND EVERYTHING ELSE IS NOT. The form on /contact posts here
 * anonymously (Payload's own REST route, /api/messages), which is the whole
 * point; reading, and deleting the read ones, is admin work. Update is nobody's:
 * a message is what somebody said, not a draft.
 *
 * The field names are the form's own input names — see FIELD_KINDS in
 * src/data/contact-types.ts and the message textarea in components/Contact.
 * Email and message are the two the form insists on before it posts
 * (Contact/Stage.tsx); the rest arrive as typed, blanks included.
 */
export const Messages: CollectionConfig = {
  slug: "messages",

  admin: {
    description:
      "What the contact form sends. Read them here; nothing notifies yet.",
    useAsTitle: "email",
    defaultColumns: ["email", "name", "company", "createdAt"],
  },

  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    { name: "name", type: "text" },
    { name: "company", type: "text" },
    { name: "phone", type: "text" },
    { name: "email", type: "email", required: true },
    { name: "message", type: "textarea", required: true },
  ],
};
