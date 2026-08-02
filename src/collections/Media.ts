import type { CollectionConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* Uploads.
 *
 * Files land in public/media, NOT public/assets — the tape artwork stays where
 * it is and keeps being referenced by path. Mixing hand-placed art and
 * CMS-managed uploads in one directory means Payload deleting a record can
 * remove a file the code still points at.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  upload: {
    staticDir: path.resolve(dirname, "../../public/media"),
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
