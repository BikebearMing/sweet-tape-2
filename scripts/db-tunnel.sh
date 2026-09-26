#!/bin/sh
# The dev database lives on the VPS with no public port — local dev reaches it
# through this SSH tunnel (and the Dokploy panel through the second one).
# Run once after a reboot; safe to re-run any time.
pkill -f "ssh -f -N -L 15432" 2>/dev/null
ssh -f -N -L 15432:127.0.0.1:15432 -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 st-vps \
  && echo "db tunnel up: localhost:15432 → sweettape-db"
pkill -f "ssh -f -N -L 3333" 2>/dev/null
ssh -f -N -L 3333:localhost:3000 -o ExitOnForwardFailure=yes st-vps \
  && echo "dokploy panel: http://localhost:3333"
