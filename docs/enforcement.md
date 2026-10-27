# How each platform rule is enforced

One page for CL-60. It lists every rule in `docs/PLATFORM_RULES.md` (R1 to R52, plus R13a and R21a) and says how it is checked today. It carries no status or priority: work to close a gap belongs in the Product Backlog. State as of 2026-10-20 (prototype fact, read from the code and `tools/tests/run.sh`).

Kinds: **gate** = platform gate or Feature contract check at runtime (`mod_plat_gate.js` `CHECKS`, `mod_plat_contract.js`); **test** = a Playwright script in `tools/tests/` run by `npm test`; **lint** = `tools/lint/lint.js`, which reads `src/` right after the build and fails only on violations above `tools/lint/baseline.json`; **none** = convention only.

## The build lint

`node tools/lint/lint.js` (add `--report` for top files and sample hits, `--rule <id>` or `--file <name>` to focus, `--update` to rewrite the baseline after a cleanup). Each rule counts hits per file; a file may not go above its baseline count. Every rule has a self-test (a bad sample must fire, a good one must stay quiet) that runs first.

| Lint id | Rule | What it reads | Baselined hits (2026-10-20) |
|---|---|---|---|
| `css-var` | R8 | `var(--x)` with no definition in tokens.py, CSS or JS `setProperty` | 0 |
| `hex-css` | R8 | hex colors in CSS outside tokens.py | 220 in 29 files |
| `banned-name` | R31 | the banned external and accounting-standard names in JS strings | 2 in 2 files |
| `em-dash` | R37 | em dashes in JS strings (comments may keep them) | 2 in 1 file |
| `real-name` | R32 | the owner's and his employer's names in JS strings | 0 |
| `iife` | R39 | a module file that is not one IIFE | 6 (`mod_viz2`, `mod_r24_hero`, `mod_gaapdata` and three generated data files) |
| `price` | R30 | a dollar amount per user or per seat, or "per user per month" | 11 in 2 files |
| `cert` | R30, R52 | SOC 2 or "bank-grade" outside a plan sentence (the CL-71 rule from `guard.js`) | 0 |
| `js-literal` | R8 | literal hex, `rgb()`, `font-size`, `border-radius` and `z-index` values in JS view code | 475 in 49 files |
| `sample-data` | R9 | a sample person (kit.js `PEOPLE`, kit2.js `DIR`, Casey Rowan) or "Atlantic Systems" as a string literal in a module (tenant packs exempt) | 3,509 in 136 files |
| `helper` | R10 | a local `money`, `pct`, `esc`, `slug`, `clamp`, `uid` or date helper that redeclares a `U` helper (names read from platform.js) | 56 in 46 files |
| `owner-text` | R13 | `${x.owner}`, `${esc(x.backup)}` and similar interpolations outside `ownerChip` (heuristic) | 140 in 55 files |
| `step-label` | R21 | `who:"auto"` or `who:"fn"`, or a string that is exactly "Automatic" or "Function" | 4 in 4 files |
| `product-name` | R31 | "Oukala", "Shaheen" or a typed "Falconaire" in visible strings (use `BRAND.name`) | 1 (the screens3.js wordmark that build.py fills in) |
| `wrapper` | R40 | a reassignment of `render`, `go` or `openDrawer` (use `HOOKS`) | 15 in 9 files |

## Every rule

| Rule | Short name | Enforced | Where |
|---|---|---|---|
| R1 | Reuse first, then extend, then new | gate (entities); lint (helpers, R10) | `nodup` in `mod_plat_gate.js`; `ct_data` and `PLAT.reuseCheck` in `mod_plat_contract.js`; `ct_reuse` (CL-59) for screens |
| R2 | Screens follow an archetype | gate (CL-59) | `ct_reuse` reads `CONTRACT.declare(id,{archetype})`; no screen declares one yet (`docs/inventory/screen-archetypes.md`) |
| R3 | No new screen when a tab, filter or drawer can show it | gate (CL-59, partial) | `ct_reuse` asks for a recorded comparison; families fold through `R15.hidden` and `R15.alias` |
| R4 | Processes shown and edited through the designer | gate (CL-59, partial) | `ct_reuse` checks the screen registers `PROC.reg` so `procCard` opens the designer |
| R5 | Stable process and step numbers | test | `thread.js` (P-014 resolves, threads open) |
| R6 | One source of truth for every value | test | `FACTS.test()` conflict check (`mod_r15d_facts.js`); `fixes_procs.js` stable counts |
| R7 | Use the shared components | none | data-link walker not in `npm test`; `ct_reuse` gives credit for shared table and tab helpers |
| R8 | No literal values in view code | lint | `css-var`, `hex-css`, `js-literal`; `tools/tests/css_lint.js` ceilings |
| R9 | Sample data lives in tenant packs | lint | `sample-data` |
| R10 | Shared helpers exist once | lint | `helper` |
| R11 | Enterprise scale | test | `fixes_scale.js`, `perf.js` (report only) |
| R12 | Named human owner and different backup | gate; test | `ownx` and `owner` in `mod_plat_gate.js`; `fixes_robots.js` (robot sponsors) |
| R13 | Every owner name is a live link | lint; test; gate (CL-59) | `owner-text`; `people.js`; `ct_people` |
| R13a | One chat service | test; gate (CL-59) | `people.js` (chat addresses); `ct_people` |
| R14 | Approvals route to a group; no self-approval | test | `guard.js` (`APG.route`, `APG.check`) |
| R15 | Assign to teams first | none | |
| R16 | Tenant-aware by construction | test; gate (CL-59) | `tenant.js`; `ct_tenant` reads `DATA.screens()` mode |
| R17 | Seamless tenant switch | test | `tenant_leak.js` |
| R18 | No cross-tenant leakage | test | `tenant_leak.js`, `tenant_tour.js`, `DATA.validate` in `tenant.js` |
| R19 | Tenant vocabulary and configuration | gate (CL-59, partial) | `ct_tenant` gives credit for `DATA.term` use |
| R20 | Tenant content from packs only | test (partial) | `tenant.js` pack validator and core snapshot |
| R21 | Steps are human, robot or agent | test; lint; gate (CL-59) | `steps.js`, `sweep_a.js` to `sweep_c.js`; `step-label`; `ct_people` |
| R21a | Robots and agents start from a catalog trigger | test | `steps.js` (robot and agent steps show a trigger) |
| R22 | Cheapest correct mode; agents in a box | test (partial) | `fixes_runtime.js` (kill switch, sponsor decides) |
| R23 | Participant kinds distinguishable | test (partial) | `fixes_robots.js` |
| R24 | "Function" keeps its ordinary meanings | lint (by design) | `step-label` flags only a bare "Function" label |
| R25 | Every number is a defined metric | gate | `ct_metrics`; `normMetrics()` fills gaps at render |
| R26 | Maturity record on the shared scale | gate; test | `ct_metrics`; `fixes_procs.js` |
| R27 | Name the reference standard | gate (presence only) | `ct_process` evidence |
| R28 | Legend or tooltip for meaningful color | none | |
| R29 | Label every number | none | |
| R30 | No price points, no certification claims | lint; test | `price`, `cert`; `guard.js` (CL-71); `sweep_c.js` (price per user on screen) |
| R31 | Naming | lint; test | `banned-name`, `product-name`; `sweep_a.js` to `sweep_c.js` |
| R32 | No real names or data | lint | `real-name` |
| R33 | Intellectual-property clean | none | |
| R34 | Hero, lens note, procCard, dashboard first | gate (partial) | `ct_process` (procCard registration) |
| R35 | AI lineage, chat intent, audit | gate (partial) | `ct_links` (search record; chat intents declared in manifests) |
| R36 | Text never squeezed; light, dark, phone | test | `smoke.js` (horizontal scroll), `journey.js`; spacescan and cardscan are in `tools/scratch`, not in `npm test` |
| R37 | Plain English, no em dashes, accessible | lint; test | `em-dash`; `sweep_a.js` to `sweep_c.js` |
| R38 | Information scales by level | none | |
| R39 | One IIFE per module | lint | `iife` |
| R40 | No new wrapper of render, go or openDrawer | lint; test | `wrapper`; `platform.js` (HOOKS contract) |
| R41 | Waivers with owner and expiry of at most 90 days | gate | contract waivers (`CONTRACT.waivers`), gate exceptions (`G.waive`) |
| R42 | Definition of done | gate | Feature contract score plus `ct_reuse`, `ct_tenant`, `ct_people` (CL-59) |
| R43 | Isolation below the application | none | design needed (no backend) |
| R44 | Identity separate from tenant; default deny | test | `tenant.js` (IDENT memberships, default deny, simulated) |
| R45 | One active tenant per request | test (partial) | `tenant.js` (`DATA.setTenant`, `tenantDenied`) |
| R46 | Cross-tenant grants (parked) | none | parked by decision 5 |
| R47 | Cross-tenant views (parked) | none | parked by decision 5 |
| R48 | Tenant relationship types (parked) | none | parked by decision 5 |
| R49 | AI and robots respect the tenant boundary | none | per-tenant agent memory exists (`AGENTRT.scope`) but no test |
| R50 | Per-tenant keys and data controls | none | |
| R51 | Cross-boundary audit | none | |
| R52 | Security claims are plans | lint; test | `cert`; `guard.js` (CL-71) |

Count (prototype fact): of 54 rules, 41 have a gate, test or lint (many of them partial) and 13 have none: R7, R15, R28, R29, R33, R38, R43, R46 to R48 (parked), R49, R50, R51. Rows marked CL-59 are the contract checks ct_reuse, ct_tenant and ct_people added by this stream.
