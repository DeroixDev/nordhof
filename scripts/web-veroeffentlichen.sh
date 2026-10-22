#!/bin/sh
# Baut die Webfassung und schiebt sie nach deroixdev.github.io/nordhof.
# Aufruf: sh scripts/web-veroeffentlichen.sh [Pfad zum Klon von deroixdev.github.io]
set -e
SEITE="${1:-../deroixdev.github.io}"
node scripts/build.mjs
node scripts/web.mjs web
rm -rf "$SEITE/nordhof" && cp -r web "$SEITE/nordhof"
V=$(sed -n "s/^const VERSION='\(.*\)';/\1/p" src/js/10-menu.js)
cd "$SEITE" && git add -A nordhof && git commit -m "Nordhof $V" && git push
