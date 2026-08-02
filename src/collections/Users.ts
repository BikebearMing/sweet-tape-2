import type { CollectionConfig } from "payload";

/** Admin logins. Payload needs exactly one auth-enabled collection to gate /admin. */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
