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
import { About } from "./globals/About";
import { Contact } from "./globals/Contact";
import { Homepage } from "./globals/Homepage";
import { Menu } from "./globals/Menu";

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
       
       TAPES HAS ONE NOW, and it is declared on the collection itself rather
       than in this list. It could not have one while the home page's slider was
       the tapes: a roll had no page of its own, so a preview would have meant
       pointing all six at "/" and calling it a preview of the edit. Separating
       the orbit from the products settled that — a tape is /products/<slug>,
       which is a question with one answer. See src/collections/Tapes.ts. */
    livePreview: {
      collections: ["news"],

      /* AND THE TWO PAGES THAT ARE GLOBALS, listed separately because Payload
         keys globals by a different name — a global has no id to build a URL
         from. Both get a pane for the reason news does and tapes still does
         not: each is one document with one page of its own, so "the page this
         document is" is a question with an answer. */
      globals: ["contact", "homepage", "about"],

      /* SERVER_URL, not NEXT_PUBLIC_SERVER_URL. This runs on the server when
         the admin builds the preview pane's iframe src, so it is read at
         runtime and a deployment can be pointed at a new domain by editing an
         environment variable. Anything NEXT_PUBLIC_ is inlined at build time
         and would need a rebuild instead. Falls back to a relative URL, which
         is right whenever the site and the admin are the same origin — they
         are, unless the front end is ever split off.

         THE BRANCH IS HOW THEY ARE TOLD APART. Payload hands a collectionConfig
         when it is previewing a document out of a collection and a globalConfig
         when it is previewing a global, so the first decides which of the two
         kinds this is and the second decides which global. */
      url: ({ collectionConfig, globalConfig, data }) =>
        `${process.env.SERVER_URL ?? ""}${
          collectionConfig
            ? `/news/${data?.slug ?? ""}`
            : globalConfig?.slug === "homepage"
              ? "/"
              : globalConfig?.slug === "about"
                ? "/about"
                : "/contact"
        }`,

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

  globals: [Homepage, About, Menu, Contact],

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
