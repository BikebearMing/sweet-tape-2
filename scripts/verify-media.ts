import path from "path";
import { fileURLToPath } from "url";
import { getPayload } from "payload";

import config from "../src/payload.config";

/* Checks the Media collection actually behaves: a GLB survives the upload
 * unconverted, and the delete guard refuses the two cases it exists for without
 * refusing ordinary deletions.
 *
 *   npx payload run scripts/verify-media.ts
 *
 * IT WRITES TO WHATEVER DATABASE IS CONFIGURED. There is one Neon database
 * behind both this machine and the live site, so running it uploads a real file
 * and deletes it again against production. It cleans up after itself — step 4
 * removes what step 1 created — but a crash in between leaves a stray record
 * called "verify — cloth tape roll" for someone to delete by hand. Point
 * DATABASE_URI at a Neon branch before running it anywhere that matters.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url));
const payload = await getPayload({ config });

const ok = (s: string) => console.log(`  PASS  ${s}`);
const bad = (s: string) => {
  console.log(`  FAIL  ${s}`);
  process.exitCode = 1;
};

console.log("\n1. GLB upload passes through unconverted");

const glb = await payload.create({
  collection: "media",
  data: { alt: "verify — cloth tape roll" },
  filePath: path.resolve(dirname, "../public/assets/tapes/Cloth-Tape.glb"),
});

glb.filename?.endsWith(".glb")
  ? ok(`stored as ${glb.filename} (${Math.round((glb.filesize ?? 0) / 1024)}K)`)
  : bad(`sharp mangled it — stored as ${glb.filename}`);

console.log("\n2. protected files refuse deletion");

const guard = await payload.update({
  collection: "media",
  id: glb.id,
  data: { protected: true },
});

try {
  await payload.delete({ collection: "media", id: guard.id });
  bad("a protected file was deleted");
} catch (e) {
  ok(`refused: ${(e as Error).message.slice(0, 60)}…`);
}

console.log("\n3. files in use refuse deletion");

const story = await payload.find({
  collection: "news",
  where: { slug: { equals: "featured" } },
  limit: 1,
  depth: 0,
});

const inUseId = story.docs[0]?.image;

if (!inUseId) {
  bad("could not find the featured story's image");
} else {
  try {
    await payload.delete({ collection: "media", id: inUseId as number });
    bad("an in-use file was deleted — the story now has a broken image");
  } catch (e) {
    ok(`refused: ${(e as Error).message.slice(0, 70)}…`);
  }
}

console.log("\n4. an unprotected, unused file still deletes");

await payload.update({
  collection: "media",
  id: guard.id,
  data: { protected: false },
});

try {
  await payload.delete({ collection: "media", id: guard.id });
  ok("deleted, as it should be");
} catch (e) {
  bad(`the guard is too strict: ${(e as Error).message.slice(0, 60)}`);
}

console.log("");
process.exit(process.exitCode ?? 0);
