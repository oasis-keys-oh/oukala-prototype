#!/usr/bin/env bash
# One-line run: tools/tests/run.sh   (builds to build_out with --full, gates on the Showroom lint, then runs every suite)
# Needs: python3, node, playwright (npm i -D playwright) and a Chromium; set CHROMIUM_PATH if Playwright's own browser is not installed.
set -euo pipefail
cd "$(dirname "$0")/../.."
python3 src/build.py --out "$PWD/build_out" --full >/dev/null
# CL-46, CL-60: build lint over src/ (fails only on violations above tools/lint/baseline.json; rules: docs/enforcement.md)
node tools/lint/lint.js
# CL-14, CL-15, CL-28, CL-37, CL-39: stage dist/ the way Netlify does, serve it locally and check the split build against full.html (docs/bundle.md)
SHIP_DIR=dist bash tools/ship.sh >/dev/null
node tools/tests/bundle.js dist build_out
# DC-06: a tour over 1,200 seconds (or any SHOW.lint finding) fails the build before the long suites run
node tools/tests/showlint.js build_out
# CL-18 to CL-26 (R8): no undefined CSS variables; hex, !important, literal z-index, font stacks, breakpoints and radii stay at or under their ceilings
node tools/tests/css_lint.js
node tools/tests/smoke.js build_out
node tools/tests/tabs.js build_out
node tools/tests/journey.js build_out
node tools/tests/showroom.js build_out
# DC-40, DC-41, DC-42: experiences (EXP.lint, 3-minute clocks, every mission start to success, ripples, console, self-serve link, leave-behind)
node tools/tests/exp.js build_out
node tools/tests/platform.js build_out
# CL-35, CL-36, CL-38: render/go/openDrawer wrappers, document listeners, observers and intervals never rise above their ceilings
node tools/tests/runtime.js build_out
node tools/tests/people.js build_out
node tools/tests/steps.js build_out
node tools/tests/guard.js build_out
# DC-43, DC-44, DC-45 (stream exp-world): Bring your company for every industry, Two seats on one browser context, Break it free play
node tools/tests/expworld.js build_out
# CL-59, CL-41: foundation checks ct_reuse, ct_tenant, ct_people block at the team tier; retrofit matrix; unreachable screens hidden, never deleted
node tools/tests/gate.js build_out
node tools/tests/tenant.js build_out
node tools/tests/tenant_leak.js build_out
node tools/tests/tenant_screens_b78.js build_out  # PR-32 B7 and B8: risk, control, AI, meetings, training, rooms and forums under every tenant
# PR-32 B9: build, admin, transformation and showroom screens under every tenant (own rows or a labeled gap, no other tenant on screen)
node tools/tests/tenant_screens_b9.js build_out
node tools/tests/tenant_screens_b45.js build_out  # PR-32 B4, B5: portfolio, delivery, money and contract screens under every tenant
# PR-32: the 58 tenant entities are defined with Meridian rows, and every industry pack carries them with links, owners and threads intact
node tools/tests/data_entities.js build_out
node tools/tests/thread.js build_out
# wave 3 sweep-a (CL-45, CL-44, CL-17, CL-72): no em dash, banned name, old product name or "Automatic" step label on the core and mod_admin to mod_obs screens
node tools/tests/sweep_a.js build_out
# wave 3 sweep-b: range screens render no em dash, banned name, Automatic step label or Oukala
node tools/tests/sweep_b.js build_out
node tools/tests/sweep_c.js build_out
# PH-12: screens, modules and tabs by name in the global search; hidden screens only in builder mode
node tools/tests/search.js build_out
# PR-16: real screen-open counts (this browser only), shown on the Screen map and the Usage tab
node tools/tests/nav_usage.js build_out
# PH-11: close-control audit; fails only on outliers not in tools/tests/nav_close_baseline.json (list: docs/inventory/close-controls.md)
node tools/tests/nav_close.js build_out
# PH-14: navigation architecture (areas in fixed order, purview per persona, one place per screen, old ids resolve, gear rule, budget, REG metadata and its lint)
node tools/tests/nav_ia.js build_out
# DC-25: every Showroom tour beat under every tenant (no other tenant on screen, tenant-aware screens show the tenant's own data, timings)
node tools/tests/tenant_tour.js build_out
# CL-80: Enterprise scale is real; every screen opens at scale (render times over 800 ms are listed, not failed)
node tools/tests/fixes_scale.js build_out
# PR-25, PR-27: tower kill switch reaches the runtime; only the sponsor (or the delegated group) decides a gated run
node tools/tests/fixes_runtime.js build_out
# CL-77: every DATAMODEL table has a classification
node tools/tests/fixes_data.js build_out
# CL-78: every robot step resolves to a robot with a human sponsor and backup
node tools/tests/fixes_robots.js build_out
# DC-38, CL-81: process counts do not depend on click order; every process and workflow draft has a maturity record
node tools/tests/fixes_procs.js build_out
node tools/tests/product1.js build_out
# wave 4 product-2: PR-29, PR-30, CL-89, PR-18, CL-87, CL-30, PR-11, CL-79
node tools/tests/product2.js build_out
# PR-12 perf report: median render ms of the five heaviest screens at Enterprise scale; warns over 800 ms, never fails the run
node tools/tests/perf.js build_out || echo "perf report: page errors on a perf screen (report only, see above)"
