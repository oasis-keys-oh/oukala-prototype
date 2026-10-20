#!/usr/bin/env bash
# The one deploy path (CL-11). Netlify runs this on every push to main (netlify.toml); a manual deploy runs the same script.
#   bash tools/ship.sh            build and stage the site in dist/ (what Netlify publishes)
#   bash tools/ship.sh --deploy   also upload dist/ with the Netlify CLI (needs `netlify` logged in and linked to oukala-prototype)
# Staged files: index.html (the shell), assets/ (style.<hash>.css, app.<hash>.js, rest.<hash>.js when the JS is split,
# data/<name>.<hash>.json, images the CSS uses), hero/, journey/, and _headers and robots.txt from public/ (docs/bundle.md).
# Cache rules (CL-12, CL-14) live in public/_headers. Size budget (CL-48) warns only; it never fails the ship.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${SHIP_DIR:-dist}"
python3 src/build.py --out "$PWD/build_out" >/dev/null
rm -rf "$OUT"; mkdir -p "$OUT"
cp build_out/index.html "$OUT"/
for d in assets hero journey; do [ -d "build_out/$d" ] && cp -R "build_out/$d" "$OUT/$d"; done
cp public/_headers public/robots.txt "$OUT"/

# sanity: the shell must name the hashed stylesheet and script it ships with, and every file it names must be staged
css=$(grep -o 'assets/style\.[0-9a-f]\{10\}\.css' "$OUT/index.html" | head -1 || true)
app=$(grep -o 'assets/app\.[0-9a-f]\{10\}\.js' "$OUT/index.html" | head -1 || true)
[ -n "$css" ] && [ -f "$OUT/$css" ] || { echo "SHIP FAILED: index.html does not link a staged assets/style.<hash>.css"; exit 1; }
[ -n "$app" ] && [ -f "$OUT/$app" ] || { echo "SHIP FAILED: index.html does not load a staged assets/app.<hash>.js"; exit 1; }
for f in $(grep -o 'assets/[A-Za-z0-9_./-]*\.[0-9a-f]\{10\}\.[a-z]*' "$OUT/$app" | sort -u); do
  [ -f "$OUT/$f" ] || { echo "SHIP FAILED: $app names $f, which is not staged"; exit 1; }; done
for f in $(grep -o 'url([A-Za-z0-9_.-]*\.[0-9a-f]\{10\}\.[a-z]*)' "$OUT/$css" | sed 's/^url(//;s/)$//' | sort -u); do
  [ -f "$OUT/assets/$f" ] || { echo "SHIP FAILED: $css names $f, which is not staged"; exit 1; }; done
for d in hero journey; do [ -d "$OUT/$d" ] || { echo "SHIP FAILED: $d/ missing from $OUT"; exit 1; }; done

# CL-48: size budget, warn only. Budgets are prototype facts from the 2026-10-19 baseline plus headroom; override with env vars.
python3 - "$OUT" <<'PY'
import gzip, os, sys, glob
out = sys.argv[1]
app = os.path.relpath(sorted(glob.glob(os.path.join(out, 'assets/app.*.js')))[0], out)
B = {  # file: (raw budget, gzip budget) in bytes
    app: (int(os.environ.get('BUDGET_JS_RAW', 12_500_000)), int(os.environ.get('BUDGET_JS_GZ', 4_000_000))),
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
echo "staged $OUT/ ($app, $css)"

if [ "${1:-}" = "--deploy" ]; then
  command -v netlify >/dev/null || { echo "netlify CLI not found: npm i -g netlify-cli, then netlify login and netlify link"; exit 1; }
  netlify deploy --prod --dir "$OUT"
fi
