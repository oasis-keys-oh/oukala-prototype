#!/usr/bin/env bash
# One-line run: tools/tests/run.sh   (builds to build_out, then runs smoke and tab tests)
# Needs: python3, node, playwright (npm i -D playwright) and a Chromium; set CHROMIUM_PATH if Playwright's own browser is not installed.
set -e
cd "$(dirname "$0")/../.."
python3 src/build.py --out "$PWD/build_out" >/dev/null
node tools/tests/smoke.js build_out
node tools/tests/tabs.js build_out
node tools/tests/showroom.js build_out
node tools/tests/platform.js build_out
# PR-12 perf report: median render ms of the five heaviest screens at Enterprise scale; warns over 800 ms, never fails the run
node tools/tests/perf.js build_out || echo "perf report: page errors on a perf screen (report only, see above)"
