# tools/

Everything that is not shipped source. The build itself is `src/build.py`; module order is `src/modules.json`.

| Folder or file | What it is |
|---|---|
| `tests/` | The test suite. `run.sh` (what `npm test` runs) builds with `--full`, then runs `showlint.js` (Showroom lint gate, DC-06), `smoke.js`, `tabs.js`, `showroom.js` and `platform.js`. |
| `ship.sh` | The one deploy path (CL-11). Builds, stages `dist/`, checks it, prints the size budget (CL-48). Netlify runs it; `--deploy` uploads with the Netlify CLI. |
| `generators/` | Scripts that write files in `src/`, with their input folders (below). |
| `scratch/` | Probes, scans, one-off patch scripts, briefs and logs moved out of `src/` (CL-04). Kept for history; nothing in the build or tests reads them. Logs and `.out` files are untracked (CL-05). |
| `claude/` | Drafts of the feature-contract agents and skill that used to sit in `src/agents` and `src/skills`. |

## Tests
- `npm test` (or `tools/tests/run.sh`): all must pass before any commit or push.
- Each suite takes a folder holding `full.html`: `node tools/tests/smoke.js build_out`.
- Needs Node, Playwright and a Chromium (`CHROMIUM_PATH` if Playwright's own is not installed).

## Generators
Every generator writes into `src/` by default. Set `SRC=<folder>` to write into a copy instead, which is how to check one before trusting it.

**Warning (checked 2026-10-19):** the modules below have been edited directly since their parts were last assembled, so most generators now produce an older file. Running one in place would undo later work. Compare first:
`mkdir /tmp/srccopy && cp src/mod_* /tmp/srccopy/ && SRC=/tmp/srccopy bash tools/generators/<script> && diff /tmp/srccopy/<module> src/<module>`

| Script | Writes | Inputs | Rerun | Matches committed file? |
|---|---|---|---|---|
| `gen_scrmap.py` | `mod_r32_scrmap_a_data.js` (Screen map facts) | the `src/` build files and git history | `python3 tools/generators/gen_scrmap.py src` (the old `python3 src/gen_scrmap.py src` still works and forwards here) | Yes: the safe one, rerun after adding screens. Byte-identical to the pre-move script under `PYTHONHASHSEED=0` (file order otherwise varies run to run). |
| `bsow.sh` | `mod_sow.js` | `sow_parts/` | `bash tools/generators/bsow.sh` | Yes |
| `assemble_flow.sh` | `mod_flow.js`, `mod_flow.css` | `fl/` | `bash tools/generators/assemble_flow.sh` | No (parts older) |
| `fab_build.sh` | `mod_plat_fabric.js` | `fabparts/` | `bash tools/generators/fab_build.sh` | No |
| `mk_chat.sh` | `mod_chat.js` | `chatparts/` | `bash tools/generators/mk_chat.sh` | No |
| `mk.sh` | `mod_people.js` | `pp/` | `bash tools/generators/mk.sh` | No (parts are about 40 percent of today's file) |
| `mk_links.sh` | `mod_plat_links.js` | `plk_parts/` | `bash tools/generators/mk_links.sh` | No |
| `mk_kcs.sh` | `mod_kcs.js` (replaces its KCSX tail in place) | `kcs_parts2/` | `bash tools/generators/mk_kcs.sh` | No |
| `mk_kgx.sh` | `mod_kgx.js` | `kgx_parts/` | `bash tools/generators/mk_kgx.sh` | No |
| `mk_oc.sh` | `mod_oncall.js` | `parts_sla/oc_*` | `bash tools/generators/mk_oc.sh` | No |
| `mk_sla.sh` | `mod_sla.js`, then runs `mk_oc.sh` | `parts_sla/sl_*` | `bash tools/generators/mk_sla.sh` | No |
| `mkdev.sh` | `mod_devops.js` | `dev_parts/` | `bash tools/generators/mkdev.sh` | No |
| `mkobs.sh` | `mod_obs.js` | `obs_parts/` | `bash tools/generators/mkobs.sh` | No |
| `nav_build.sh` | `mod_nav.js` | `nav_parts/` | `bash tools/generators/nav_build.sh` | No |
| `rebuild_budget.sh` | `mod_budget.js` | `bp/` | `bash tools/generators/rebuild_budget.sh` | No |
| `mk_viz.sh` and `mk_viz.py` | `mod_viz.js`, `mod_viz2.js` (minified) | `vizsrc/` | `bash tools/generators/mk_viz.sh` | Not checked: needs esbuild (`npm i -D esbuild` or `ESBUILD=<path>`) |
| `r17q_gen.py` | `mod_r17q_a_data.js` (decisions log data) | `docs/r17q/*.md` and `docs/spec/register_summary.md` | `OWNER_FIRST_NAME=<name> python3 tools/generators/r17q_gen.py` | Cannot run: its input documents are not in the repo |

The parts folders are the history of how those modules were first written. To make a generator trustworthy again, copy the current module back into its parts (or retire the generator) before editing parts.

## Adding a module
Name it `src/mod_s_<domain>.js` (and optional `.css`) and add `"mod_s_<domain>"` to `src/modules.json`; the build fails until it is listed. See `src/MODULE_GUIDE.md` and `docs/ARCHITECTURE.md`.
