# The peel preloader

What the home page's overture was until the sticker replaced it, kept whole
rather than as a diff: `src/components/Preloader/index.tsx` and
`Preloader/reveal.ts` exactly as they stood at the tag `preloader-peel`.

The mark used to arrive as a **peel and a tick of the head** — components/Peel
run once off the preloader's own clock (`drive="manual"`), then a 7.26deg tilt
out and back. Both were measured frame by frame off the 1.8 MB gif that came
before them, and the long notes in `PRELOADER.MARK` are that measurement; they
are the reason this copy is here rather than only in git, because the gif is
gone and nobody can take those numbers again.

What replaced it is one gesture rather than two beats: the mark pops up as a
sticker, its shape flexes as it settles, a sheen pans across it, and it falls
away as the cover lifts. See `Preloader/sticker.ts`.

## What did NOT change

The sweep. Everything from `scheduleSheets` down — the coloured stack, the
golden-ratio walk, the handoff to the hero and the roll — is untouched, and the
page transition still builds itself out of the same two exports. Only the
mark's own beats moved.

## Putting it back

    git show preloader-peel:src/components/Preloader/index.tsx  > src/components/Preloader/index.tsx
    git show preloader-peel:src/components/Preloader/reveal.ts  > src/components/Preloader/reveal.ts

Then restore the Peel block in the Preloader section of `src/styles/global.css`
(`--peel-fit`, `--peel-shadow`, the `rotate` that composes `--peel-dir` with
`--mark-tilt`, and the `.peel-flap img` brightness ramp) — it is in the same
commit.
