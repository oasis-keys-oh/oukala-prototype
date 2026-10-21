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

# CL-48: size budget, warn only. Budgets are prototype facts from the 2026-10-20 measure (docs/bundle.md) plus headroom; override with env vars.
python3 - "$OUT" <<'PY'
import gzip, os, sys, glob
out = sys.argv[1]
def one(pattern):
    m = sorted(glob.glob(os.path.join(out, pattern)))
    return os.path.relpath(m[0], out) if m else None
E = lambda k, d: int(os.environ.get(k, d))
B = [  # (label, file, raw budget, gzip budget) in bytes
    ('shell', 'index.html', E('BUDGET_HTML_RAW', 60_000), E('BUDGET_HTML_GZ', 40_000)),
    ('stylesheet', one('assets/style.*.css'), E('BUDGET_CSS_RAW', 1_600_000), E('BUDGET_CSS_GZ', 450_000)),
    ('first-paint script', one('assets/app.*.js'), E('BUDGET_JS_RAW', 12_900_000), E('BUDGET_JS_GZ', 4_200_000)),  # raised 2026-10-21 for PR-32 tenant views (orchestrator); CL-92 is the real fix
    ('second script', one('assets/rest.*.js'), E('BUDGET_REST_RAW', 6_000_000), E('BUDGET_REST_GZ', 2_000_000)),
]
TOTAL = E('BUDGET_TOTAL', 20_000_000)
FIRST = E('BUDGET_FIRST_GZ', 4_700_000)  # gzip bytes the browser needs before first paint: shell, stylesheet, first-paint script
warn = 0; first = 0
for label, f, raw_b, gz_b in B:
    if not f: print(f'size {label}: none (one script)' if label == 'second script' else f'size {label}: MISSING'); continue
    b = open(os.path.join(out, f), 'rb').read(); raw, gz = len(b), len(gzip.compress(b, 9))
    if label != 'second script': first += gz
    flag = ''
    if raw > raw_b or gz > gz_b: flag = '  WARNING over budget'; warn += 1
    print(f'size {label} {f}: {raw:,} bytes raw (budget {raw_b:,}), {gz:,} gzip (budget {gz_b:,}){flag}')
print(f'size before first paint: {first:,} bytes gzip (budget {FIRST:,})' + ('  WARNING over budget' if first > FIRST else ''))
data = sorted(glob.glob(os.path.join(out, 'assets/data/*.json')))
print('size on-demand data: ' + ', '.join(f'{os.path.basename(x)} {os.path.getsize(x):,}' for x in data) if data else 'size on-demand data: none')
tot = sum(os.path.getsize(os.path.join(r, x)) for r, _, fs in os.walk(out) for x in fs)
print(f'size total {out}/: {tot:,} bytes (budget {TOTAL:,})' + ('  WARNING over budget' if tot > TOTAL else ''))
if warn or tot > TOTAL or first > FIRST: print('size budget: WARNING (ship continues; see CL-48)')
else: print('size budget: within budget')
PY
echo "staged $OUT/ ($app, $css)"

if [ "${1:-}" = "--deploy" ]; then
  command -v netlify >/dev/null || { echo "netlify CLI not found: npm i -g netlify-cli, then netlify login and netlify link"; exit 1; }
  netlify deploy --prod --dir "$OUT"
fi
