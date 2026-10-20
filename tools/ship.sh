#!/usr/bin/env bash
# The one deploy path (CL-11). Netlify runs this on every push to main (netlify.toml); a manual deploy runs the same script.
#   bash tools/ship.sh            build and stage the site in dist/ (what Netlify publishes)
#   bash tools/ship.sh --deploy   also upload dist/ with the Netlify CLI (needs `netlify` logged in and linked to oukala-prototype)
# Staged assets: index.html, oukala-js.js, hero/, journey/, and _headers and robots.txt from public/.
# Cache rules (CL-12) live in public/_headers.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${SHIP_DIR:-dist}"
python3 src/build.py --out "$PWD/build_out" >/dev/null
rm -rf "$OUT"; mkdir -p "$OUT"
cp build_out/index.html build_out/oukala-js.js "$OUT"/
for d in hero journey; do [ -d "build_out/$d" ] && cp -R "build_out/$d" "$OUT/$d"; done
cp public/_headers public/robots.txt "$OUT"/

# sanity: the shell must reference the script it ships with, versioned by content hash
ver=$(grep -o 'oukala-js\.js?v=[0-9a-f]*' "$OUT/index.html" | head -1 | cut -d= -f2)
[ -n "$ver" ] || { echo "SHIP FAILED: index.html does not reference oukala-js.js?v=<hash>"; exit 1; }
for d in hero journey; do [ -d "$OUT/$d" ] || { echo "SHIP FAILED: $d/ missing from $OUT"; exit 1; }; done

echo "staged $OUT/ (script v=$ver)"

if [ "${1:-}" = "--deploy" ]; then
  command -v netlify >/dev/null || { echo "netlify CLI not found: npm i -g netlify-cli, then netlify login and netlify link"; exit 1; }
  netlify deploy --prod --dir "$OUT"
fi
