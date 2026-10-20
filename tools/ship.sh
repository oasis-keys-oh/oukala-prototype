#!/usr/bin/env bash
# The one deploy path (CL-11). Netlify runs this on every push to main (netlify.toml); a manual deploy runs the same script.
#   bash tools/ship.sh            build and stage the site in dist/ (what Netlify publishes)
#   bash tools/ship.sh --deploy   also upload dist/ with the Netlify CLI (needs `netlify` logged in and linked to oukala-prototype)
# Staged assets: index.html, oukala-js.js, hero/, journey/, and _headers and robots.txt from public/.
# Cache rules (CL-12) live in public/_headers. Size budget (CL-48) warns only; it never fails the ship.
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

# CL-48: size budget, warn only. Budgets are prototype facts from the 2026-10-19 baseline plus headroom; override with env vars.
python3 - "$OUT" <<'PY'
import gzip, os, sys
out = sys.argv[1]
B = {  # file: (raw budget, gzip budget) in bytes
    'oukala-js.js': (int(os.environ.get('BUDGET_JS_RAW', 12_500_000)), int(os.environ.get('BUDGET_JS_GZ', 4_000_000))),
    'index.html': (int(os.environ.get('BUDGET_HTML_RAW', 1_700_000)), int(os.environ.get('BUDGET_HTML_GZ', 600_000))),
}
TOTAL = int(os.environ.get('BUDGET_TOTAL', 20_000_000))
warn = 0
for f, (raw_b, gz_b) in B.items():
    b = open(os.path.join(out, f), 'rb').read(); raw, gz = len(b), len(gzip.compress(b, 9))
    flag = ''
    if raw > raw_b or gz > gz_b: flag = '  WARNING over budget'; warn += 1
    print(f'size {f}: {raw:,} bytes raw (budget {raw_b:,}), {gz:,} gzip (budget {gz_b:,}){flag}')
tot = sum(os.path.getsize(os.path.join(r, x)) for r, _, fs in os.walk(out) for x in fs)
print(f'size total {out}/: {tot:,} bytes (budget {TOTAL:,})' + ('  WARNING over budget' if tot > TOTAL else ''))
if warn or tot > TOTAL: print('size budget: WARNING (ship continues; see CL-48)')
else: print('size budget: within budget')
PY
echo "staged $OUT/ (script v=$ver)"

if [ "${1:-}" = "--deploy" ]; then
  command -v netlify >/dev/null || { echo "netlify CLI not found: npm i -g netlify-cli, then netlify login and netlify link"; exit 1; }
  netlify deploy --prod --dir "$OUT"
fi
