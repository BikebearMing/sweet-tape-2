import type { CollectionConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* Uploads.
 *
 * Files land in public/media, NOT public/assets — the hand-placed art stays
 * where it is and keeps being referenced by path. Mixing the two in one
 * directory means Payload deleting a record can remove a file the code still
 * points at.
 *
 * MEDIA_DIR overrides the location in production, and has to. The relative
 * path below is resolved from this file, which is fine in dev but wrong under
 * `output: "standalone"` — the config gets bundled and import.meta.url then
 * points into .next/standalone, so "../../public/media" lands somewhere no
 * volume is mounted and every upload dies with the container. In prod this is
 * an absolute path to a mounted volume; see the Dockerfile.
 *
 * ONE COLLECTION, NOT TWO. The 3D rolls are here beside the photographs rather
 * than in a Models collection of their own: the point of putting artwork in the
 * CMS is that somebody who is not a developer can swap it, and "the pictures are
 * over here and the rolls are over there" is a rule that person has to be taught
 * before they can do the one thing this is for. Payload only runs sharp over
 * files it recognises as images, so formatOptions below is inert for a .glb —
 * it passes through byte for byte, which is the only correct thing to do to a
 * mesh.
 */
export const Media: CollectionConfig = {
  slug: "media",

  admin: {
    useAsTitle: "alt",
    defaultColumns: ["alt", "filename", "protected", "updatedAt"],
    description:
      "Every swappable file on the site. Replacing one here replaces it everywhere it appears.",
  },

  access: { read: () => true },

  upload: {
    staticDir:
      process.env.MEDIA_DIR || path.resolve(dirname, "../../public/media"),

    /* Images, and the GLB rolls the slider loads. model/gltf-binary is the
       registered type for .glb; some browsers send application/octet-stream for
       it instead, which is why that is here too — without it the upload is
       rejected at the door depending on which machine the editor is sitting at. */
    mimeTypes: [
      "image/*",
      "model/gltf-binary",
      "application/octet-stream",
    ],

    /* Images become WebP on the way in. Quality 80 is the usual point where the
       artefacts stop being visible and the file is a fraction of a PNG.
       Non-images are untouched — see the note above. */
    formatOptions: {
      format: "webp",
      options: { quality: 80 },
    },
  },

  hooks: {
    /* THE DELETE GUARD.
     *
     * Once the site's furniture lives in here — the cursor, the paper textures,
     * the rolls — a delete is no longer "remove a photograph nobody used". It is
     * a piece of the design disappearing, with the page that drew it going out
     * to visitors looking wrong and nothing anywhere saying why.
     *
     * Two refusals, and both are recoverable by the person who hit them rather
     * than by a developer: untick `protected`, or detach the file from the
     * stories using it. Neither can happen by accident, which is the whole
     * point — this is not trying to make deletion hard, only deliberate.
     */
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({
          collection: "media",
          id,
          depth: 0,
        });

        if (doc?.protected) {
          throw new Error(
            "This file is marked protected because the site's layout depends on it. Untick “Protected” on the file first if you really mean to delete it.",
          );
        }

        /* Anything still pointing at it. depth 0 — the ids are all this needs
           and resolving each story's image would be a query per story to answer
           a question that is already answered by the count. */
        const inUse = await req.payload.find({
          collection: "news",
          where: { image: { equals: id } },
          limit: 5,
          depth: 0,
        });

        if (inUse.totalDocs > 0) {
          const titles = inUse.docs.map((d) => `“${d.title}”`).join(", ");
          const more =
            inUse.totalDocs > inUse.docs.length
              ? ` and ${inUse.totalDocs - inUse.docs.length} more`
              : "";
          throw new Error(
            `Still in use by ${inUse.totalDocs} story/stories: ${titles}${more}. Change the image on those first — deleting it now would leave them with a picture that does not load.`,
          );
        }
      },
    ],
  },

  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "What the picture says, for a reader who cannot see it. Leave the story's own alt empty to use this one.",
      },
    },
    {
      name: "protected",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Site furniture — a cursor, a texture, a 3D roll. Tick this and the file cannot be deleted until it is unticked.",
      },
    },
  ],
};
