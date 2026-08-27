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
 *
 * MEDIA_DIR overrides the location in production, and has to. The relative
 * path below is resolved from this file, which is fine in dev but wrong under
 * `output: "standalone"` — the config gets bundled and import.meta.url then
 * points into .next/standalone, so "../../public/media" lands somewhere no
 * volume is mounted and every upload dies with the container. In prod this is
 * an absolute path to a mounted volume; see the Dockerfile.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  upload: {
    staticDir:
      process.env.MEDIA_DIR || path.resolve(dirname, "../../public/media"),
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
