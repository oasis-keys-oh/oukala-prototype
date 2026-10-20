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
