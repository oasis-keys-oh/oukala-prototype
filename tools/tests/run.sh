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
node tools/tests/tenant.js build_out
node tools/tests/tenant_leak.js build_out
