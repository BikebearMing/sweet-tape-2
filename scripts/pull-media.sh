#!/usr/bin/env bash
set -euo pipefail

# Copies the live site's uploads down into public/media.
#
#   npm run media:pull
#
# WHY THIS EXISTS. One database, two file stores. Payload splits an upload in
# two — a row in Postgres and a file on disk — and Neon is shared between this
# machine and the server while the files are not. A record created on the live
# site is visible here immediately; its file is not, and the image renders
# broken locally until it is fetched.
#
# LIVE IS THE SOURCE OF TRUTH, ONE WAY ONLY. This script never pushes. Uploading
# through the local admin writes a row every environment can see and a file only
# this machine has, which breaks the live site — so uploads happen on
# https://sweettape.mydemobb.com/admin and travel in this direction afterwards.
#
# The real fix is object storage both environments read (R2, S3), at which point
# this script is deleted. Until then this keeps the two in step.

REMOTE="${REMOTE:-st-vps}"
VOLUME="${VOLUME:-sweet-tape-media}"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/media"

mkdir -p "$DEST"

# Read the volume from the host rather than through `docker exec`: the files are
# plainly there on disk, and this needs no running container — so it still works
# when the app is mid-deploy or stopped.
SRC="/var/lib/docker/volumes/${VOLUME}/_data"

echo "pulling ${REMOTE}:${VOLUME} → public/media"

before=$(find "$DEST" -type f | wc -l | tr -d ' ')

# tar over ssh rather than scp: one round trip, preserves timestamps, and copies
# nothing whose name we would otherwise have to enumerate first.
ssh "$REMOTE" "sudo tar -C '$SRC' -cf - ." | tar -C "$DEST" -xf -

after=$(find "$DEST" -type f | wc -l | tr -d ' ')

echo "done — ${after} file(s) in public/media (${before} before)"
