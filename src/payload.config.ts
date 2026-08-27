import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Tapes } from "./collections/Tapes";
import { News } from "./collections/News";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* Payload, set up and parked.
 *
 * The front end does not import this file and does not touch the database — the
 * tape content is local (src/data/tapes.ts). Only /admin and /api/* reach for a
 * connection, and they only do so when requested, so the site builds and runs
 * with no DATABASE_URI at all.
 *
 * To bring it up: copy .env.example to .env.local, point DATABASE_URI at Neon,
 * then `npm run dev` and open /admin. Payload creates its tables on first
 * connect.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },

    /* LIVE PREVIEW. The editor gets the real page in an iframe beside the
       fields, refreshed on every save — see components/LivePreview, which is
       the listening half and explains why it refreshes rather than re-rendering
       from client state.
       
       Only news has one. A preview is a URL a document can be seen at, and
       tapes has no page of its own — the rolls are drawn by the slider on the
       home page, not addressed individually. Giving it a preview pane would
       mean pointing every roll at "/" and calling it a preview of the edit. */
    livePreview: {
      collections: ["news"],
      /* SERVER_URL, not NEXT_PUBLIC_SERVER_URL. This runs on the server when
         the admin builds the preview pane's iframe src, so it is read at
         runtime and a deployment can be pointed at a new domain by editing an
         environment variable. Anything NEXT_PUBLIC_ is inlined at build time
         and would need a rebuild instead. Falls back to a relative URL, which
         is right whenever the site and the admin are the same origin — they
         are, unless the front end is ever split off. */
      url: ({ data }) =>
        `${process.env.SERVER_URL ?? ""}/news/${data?.slug ?? ""}`,

      /* The sizes the design is actually drawn to. The editor gets a dropdown
         of these plus whatever the pane happens to be. */
      breakpoints: [
        { name: "mobile", label: "Mobile", width: 390, height: 844 },
        { name: "tablet", label: "Tablet", width: 834, height: 1112 },
        { name: "desktop", label: "Desktop", width: 1440, height: 900 },
      ],
    },
  },

  collections: [Users, Media, Tapes, News],

  editor: lexicalEditor(),

  /* Falls back so a missing env var cannot break `next build` — the routes are
     compiled at build time and importing this file must not throw. Set a real
     one in .env.local before anyone logs in; it signs the auth cookies. */
  secret: process.env.PAYLOAD_SECRET || "dev-only-not-a-secret",

  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },

  /* Neon. The adapter is lazy — it does not open a connection when this module
     is imported, which is what lets the build succeed without a database. */
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || "" },
  }),

  sharp,
});
