#!/bin/sh
# Copies the files the app shares with the web version (family-meal-planner) into www/.
#
# The pages, the plan builder and its data are the web version's own files, unchanged: the web
# pages switch to the phone's wording and features when www/local-api.js sets window.PHONE (see
# "Pages shared with the phone app" in the web version's docs/how-it-works.md). So bringing the
# app up to date with the web is a copy, not a merge:
#
#   tools/port-from-web.sh ../family-meal-planner
#
# Then check www/local-api.js still answers everything the pages ask for: if the web server
# gained a new /api address or changed one, local-api.js needs the same change. Run the pages in
# a browser (or the smoke checks described in the PR that last did this) before releasing.
#
# Not copied, because the app keeps its own: local-api.js (the on-phone server), library.json and
# exercises.json (the web's plus the shared-library dishes and exercises; tools/build_library.py),
# and the web-only pages (logins, Ask AI, My files, Health sync and so on).
set -e
WEB="${1:?Give the web version's folder, like ../family-meal-planner}"
cd "$(dirname "$0")/.."
[ -f "$WEB/site/edition.js" ] || { echo "$WEB doesn't look like the web version (no site/edition.js)." >&2; exit 1; }

# The pages and their scripts, styles and data, from site/.
for f in index.html app-core.js app-shopping.js app-meals.js app-exercise.js app-today.js app-start.js \
         profile.html progress.html settings.html setup.html exercises.html food.html \
         edition.js appearance.js regions.js guidelines.js guidelines.json questions.json page.css \
         plan.example.json manifest.webmanifest logo.svg icon-192.png icon-512.png apple-touch-icon.png; do
  cp "$WEB/site/$f" "www/$f"
done
cp -R "$WEB/site/fonts/." www/fonts/
# The plan builder and what it reads, from api/.
for f in planbuilder.js cardio.js healthtargets.js library-prices.json; do
  cp "$WEB/api/$f" "www/$f"
done

echo "Copied from $WEB ($(git -C "$WEB" describe --tags --always 2>/dev/null || echo 'unknown version'))."
echo "Now check www/local-api.js against the web server's /api changes, and look at: git status"
