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
# CL-80: Enterprise scale is real; every screen opens at scale (render times over 800 ms are listed, not failed)
node tools/tests/fixes_scale.js build_out
# PR-25, PR-27: tower kill switch reaches the runtime; only the sponsor (or the delegated group) decides a gated run
node tools/tests/fixes_runtime.js build_out
# CL-77: every DATAMODEL table has a classification
node tools/tests/fixes_data.js build_out
# CL-78: every robot step resolves to a robot with a human sponsor and backup
node tools/tests/fixes_robots.js build_out
# PR-12 perf report: median render ms of the five heaviest screens at Enterprise scale; warns over 800 ms, never fails the run
node tools/tests/perf.js build_out || echo "perf report: page errors on a perf screen (report only, see above)"
