# Bundle: how the site is split and loaded (CL-14, CL-15, CL-28, CL-37, CL-39, CL-48)

Describes the build output and the measurements behind it. It carries no status or priority: those live in the Product Backlog. Every number is a **prototype fact** measured on one machine (Apple M5, Node 22.22.2, Playwright 1.58.2 headless Chromium, loopback, no network latency, other sessions running) on 2026-10-20, unless it says otherwise.

## What the build writes
`python3 src/build.py --out DIR` writes the split build that `tools/ship.sh` stages in `dist/`:

| File | What it is | Cache (`public/_headers`) |
|---|---|---|
| `index.html` | The shell: boot screen, one stylesheet link, one script, preload hints | revalidate on every load |
| `assets/style.<hash>.css` | All CSS (CL-14) | one year, immutable |
| `assets/app.<hash>.js` | Core, the modules up to `FIRST_UNTIL`, the boot (CL-15) | one year, immutable |
| `assets/rest.<hash>.js` | The modules after `FIRST_UNTIL`, loaded right after first paint; only when `FIRST_UNTIL` is set (CL-15) | one year, immutable |
| `assets/data/<name>.<hash>.json` | On-demand data, fetched when its screen first opens (CL-39) | one year, immutable |
| `assets/rail.<hash>.jpg` | Images the CSS names as `url(assets/...)` (CL-28) | one year, immutable |
| `hero/`, `journey/` | Image folders, as before | one day |

`--full` also writes `full.html`, which the tests load: one file with everything inline, the on-demand data embedded, and every module in one script, as before. `oukala-js.js` (the whole script in one file) is still written to the build folder for tools that read it; it is not shipped.

## The runtime (`src/assets/runtime/bundle.js`, `window.BUNDLE`)
Inlined by the build ahead of `platform.js` in every build. It is not a feature module.
- `app:ready`: one window event, fired once when every bundle has run; `BUNDLE.ready` turns true at that moment (CL-37). Until then the first `renderNav` runs and later calls fold into one call at `app:ready`. This replaces `mod_zz_perf`, which delayed `renderNav` by 350 ms during the first 30 seconds; the module is out of the build and kept in `tools/scratch/mod_zz_perf.js`.
- On-demand data (CL-39): `BUNDLE.lazy(name,{screens,use})` registers a consumer; `BUNDLE.get(name)`, `BUNDLE.data(name)` (a Promise) and `BUNDLE.need(name)` read it. Opening one of the screens fetches the file and re-renders the screen when it lands. `full.html` embeds the data, so `use` runs at once and file:// tests work.
  - `gaapdata` (213,835 bytes, screen `vault`): the GAAP vault snapshot from `mod_gaapdata`. Finding: it was a top-level `const` that nothing could reach, because `mod_kgx` reads `window.GAAPDATA`, which was never set; the vault pane says the vault is not loaded. Behavior is unchanged; the data is now one call away (see open questions).
  - `vizgeo` (7,805 bytes, screen `kcs_viz` and any map chart): the US state and world country outlines from `mod_viz`. `mod_viz2` is code (a string evaluated inside the `mod_viz` closure), not data; it is now wrapped in an IIFE.
- Two-bundle mode (CL-15, off by default, see below): `go()` to a screen that is not loaded yet shows a waiting card (`data-bundle-wait`) and opens the screen by itself when the second bundle is in; a deep link (`#screen`) to such a screen waits the same way; pushes and unshifts on `SCREENS`, `SEARCHX` and `ASKX` are replayed in module order at `app:ready`, so nav order, search order and the first matching answer stay as in `full.html`; the current screen is re-rendered once if the person has not clicked or typed yet.

## Measurements (prototype fact)
Method: `node tools/baseline.js <dir> --runs 5`, run twice each, before and after, interleaved. "Before" is `main` at `58bad46` (index.html plus `oukala-js.js`). "First screen" is when `#view` first holds more than 400 characters, timed in the page (new `viewAt` field). The machine was shared with other sessions, so times vary by several hundred milliseconds between passes.

| Measure | Before | After (as shipped, one script) |
|---|---|---|
| `index.html` | 1,620,726 raw, 551,842 gzip | 39,097 raw, 25,204 gzip |
| Stylesheet | inline in `index.html` (1,581,788 characters, 170 KB of it one JPEG) | 1,411,887 raw, 395,557 gzip, cached a year |
| Script | 12,316,941 raw, 3,978,949 gzip | 12,107,903 raw, 3,928,065 gzip |
| Gzip bytes the browser needs before first paint (shell, CSS, script) | 4,530,791 | 4,348,826 (minus 4.0 percent) |
| Bytes fetched before app ready (decoded, all files) | 14,323,282 | 14,071,929 |
| First screen, median of 5 (two passes) | 821 ms, 925 ms | 839 ms, 678 ms |
| Repeat visit, same build | shell 552 KB gzip revalidated | shell 25 KB gzip revalidated; CSS and script from cache |

Reading: first paint is not faster on loopback, because parsing and running the 12 MB script is the cost (baseline 2026-10-19), and this change removes only 0.2 MB of it. What changes is what a browser has to fetch again: the shell drops from 552 KB to 25 KB gzip, and the CSS is cached like the script.

The baseline's older "ready" field waits for the load event, which now also waits for the rail image when the main thread is busy; it read 0.9 to 4.3 seconds in both builds on this shared machine, so it is not used for the comparison. The shell preloads the rail image to keep the load event close to DOMContentLoaded.

## CL-15: why the JS is still one script
The plan was core plus the wedge screens first (the Showroom COO cut: `exe_strat`, `strat_exec`, `port`, `bst`, `exe_dash`, `ppl_jrny`, `orgassist`, `studio`, plus `home` and `showroom`), the rest right after first paint. The mechanism is built and tested (`tools/tests/bundle.js` part B), and `python3 src/build.py --first-until <module>` builds a split. It is off because every split measured changes what screens show.

`tools/tests/bundle.js` compares each screen's text in the split build with two copies of `full.html` (fixed clock, seeded random, same settle time; screens where the two `full.html` copies disagree are skipped as noise). Results (prototype fact):

| Split | First-paint script | Second script | Screens whose text differs from `full.html` |
|---|---|---|---|
| One script (as shipped) | 12,107,903 | none | 4 to 8 (noise floor: timers, audit counts) |
| Wedge only: 98 modules closed over load-time dependencies (`bundle_plan.js`, wedge-only plan) | 7,290,023 | 4,810,626 | 81, including wedge screens: `orgassist` (33 teams instead of 10), `strat_exec` (131 gaps instead of 166) |
| Order-safe: modules in order up to `mod_s_tenant_screens` (the last wedge module), 17 after the boot | 10,305,698 | 1,794,951 | about 50: lineage chips, debt counts, approval-group coverage |
| Order-safe: only the last 8 modules (`mod_viz` to `mod_zslide`) after the boot | 11,518,207 | 582,442 | 17, including `exe_strat`, `exe_dash`, `exe_board` (glide-path index 99 instead of 100) |

Every split opens all 195 screens with no page error and keeps the screen list and nav order. The differences come from how modules load: they register into shared registries (data model, metrics, owners, processes) and compute and cache derived figures while they load and in timers right after the boot. Moving a module later, or after the boot, changes what those computations see. Static rules (`bundle_plan.js`: names, wrappers, hooks, shared keys and arrays) catch the load-time reads but not the caches. A wedge-first split that is safe needs modules to stop computing at load.

## Per-screen lazy load: evaluated, not built
| | Per-screen lazy load | Two bundles (built, off) |
|---|---|---|
| First paint | core plus home only; coverage says 62 percent of the script is unused on the first screen | core plus the wedge |
| Network | one fetch per first open of a screen family (50 to 300 ms on a real network) | one extra fetch after first paint |
| What modules must do | split into an eager part (`REG`, `NAVX.add`, `SEARCHX`, hooks, data model registration) and a lazy body; caches keyed on `DATA.version` | the same, for the modules after the split point |
| Tests | each lazy part needs its own load check; `full.html` must embed all | `bundle.js` part B |
| Risk today | high: 220 modules, cross-module wrappers and registries, load order is semantic | high for the same reason |

Way forward, module by module: make a module's load register only, and compute on first render or on `app:ready`. Then move it after the split point and confirm with `BUNDLE_STRICT=1 node tools/tests/bundle.js dist build_out` (text equal to `full.html` on every comparable screen). Good first candidates are large modules that only one screen family uses: `mod_viz` and `mod_viz2` (290 KB), `mod_sow` (218 KB), `mod_svc`, `mod_svc3`, `mod_svc360` (551 KB), `mod_rel` (206 KB).

## How to check
- `npm test` runs `tools/tests/bundle.js dist build_out` right after the build (part A on the staged site, part B on a two-bundle build made for the test). About 4 minutes.
- `node tools/tests/bundle_plan.js build_out --verbose` prints both plans and why each module is in them (about 40 seconds; not in `npm test`).
- `bash tools/ship.sh` prints the size budget (CL-48): shell, stylesheet, first-paint script, second script, gzip bytes before first paint, on-demand data and the staged total. Warnings only.
