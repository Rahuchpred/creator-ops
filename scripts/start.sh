#!/bin/sh
# Starts the hosted app. The first start copies the saved program into the
# persistent disk, so the screens are not empty. Later starts leave it alone.
set -e
mkdir -p "$DATA_DIR"
if [ ! -f "$DATA_DIR/program.json" ] && [ -d seed ]; then
  cp -R seed/. "$DATA_DIR"/
fi
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-8080}"
