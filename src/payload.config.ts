import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Tapes } from "./collections/Tapes";

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
  },

  collections: [Users, Media, Tapes],

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
