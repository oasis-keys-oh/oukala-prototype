#!/usr/bin/env bash
# One-line run: tools/tests/run.sh   (builds to build_out with --full, gates on the Showroom lint, then runs every suite)
# Needs: python3, node, playwright (npm i -D playwright) and a Chromium; set CHROMIUM_PATH if Playwright's own browser is not installed.
set -euo pipefail
cd "$(dirname "$0")/../.."
python3 src/build.py --out "$PWD/build_out" --full >/dev/null
# DC-06: a tour over 1,200 seconds (or any SHOW.lint finding) fails the build before the long suites run
node tools/tests/showlint.js build_out
node tools/tests/smoke.js build_out
node tools/tests/tabs.js build_out
node tools/tests/showroom.js build_out
node tools/tests/platform.js build_out
node tools/tests/people.js build_out
node tools/tests/steps.js build_out
node tools/tests/guard.js build_out
node tools/tests/tenant.js build_out
node tools/tests/tenant_leak.js build_out
# PH-12: screens, modules and tabs by name in the global search; hidden screens only in builder mode
node tools/tests/search.js build_out
# PR-16: real screen-open counts (this browser only), shown on the Screen map and the Usage tab
node tools/tests/nav_usage.js build_out
# PH-11: close-control audit; fails only on outliers not in tools/tests/nav_close_baseline.json (list: docs/inventory/close-controls.md)
node tools/tests/nav_close.js build_out
# PR-12 perf report: median render ms of the five heaviest screens at Enterprise scale; warns over 800 ms, never fails the run
node tools/tests/perf.js build_out || echo "perf report: page errors on a perf screen (report only, see above)"
