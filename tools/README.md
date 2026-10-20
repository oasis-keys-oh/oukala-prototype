# tools/

Everything that is not shipped source. The build itself is `src/build.py`; module order is `src/modules.json`.

| Folder or file | What it is |
|---|---|
| `tests/` | The test suite. `run.sh` (what `npm test` runs) builds with `--full`, then runs `showlint.js` (Showroom lint gate, DC-06), `css_lint.js`, then every suite listed in it (`smoke.js`, `tabs.js`, `showroom.js`, `platform.js` and the stream suites). |
| `ship.sh` | The one deploy path (CL-11). Builds, stages `dist/`, checks it, prints the size budget (CL-48). Netlify runs it; `--deploy` uploads with the Netlify CLI. |
| `generators/` | Scripts that write files in `src/`, with their input folders (below). |
| `scratch/` | Probes, scans, one-off patch scripts, briefs and logs moved out of `src/` (CL-04). Kept for history; nothing in the build or tests reads them. Logs and `.out` files are untracked (CL-05). |
| `claude/` | Drafts of the feature-contract agents and skill that used to sit in `src/agents` and `src/skills`. |

## Tests
- `npm test` (or `tools/tests/run.sh`): all must pass before any commit or push.
- Each suite takes a folder holding `full.html`: `node tools/tests/smoke.js build_out`. `smoke.js`, `tabs.js` and `showlint.js` also take a deployed URL (JM-10): `node tools/tests/smoke.js https://oukala-prototype.netlify.app`.
- Needs Node, Playwright and a Chromium (`CHROMIUM_PATH` if Playwright's own is not installed).

## Generators
Every generator writes into `src/` by default. Set `SRC=<folder>` to write into a copy instead, which is how to check one before trusting it.

Four generators are kept. The other generators were retired to `tools/scratch/retired/` on 2026-10-20 (CL-79, one line each in that folder's README): their parts were older than the committed modules, so running one would undo later edits. For a retired module, the committed file in `src/` is the source of truth; edit it directly.

| Script | Writes | Inputs | Rerun | Matches committed file? |
|---|---|---|---|---|
| `gen_scrmap.py` | `mod_r32_scrmap_a_data.js` (Screen map facts) | the `src/` build files and git history | `PYTHONHASHSEED=0 python3 tools/generators/gen_scrmap.py src` (the old `python3 src/gen_scrmap.py src` still works and forwards here) | Yes: rerun after adding screens. Byte-identical under `PYTHONHASHSEED=0` (file order otherwise varies run to run). |
| `bsow.sh` | `mod_sow.js` | `sow_parts/` | `bash tools/generators/bsow.sh` | Yes: parts resynced from the committed module 2026-10-20 (CL-79). Edit the parts, then rerun; never edit `mod_sow.js` alone |
| `gen_pack.py` | `mod_s_pack_<id>.js` (tenant packs) | `gen_pack_specs/<id>.json` | `python3 tools/generators/gen_pack.py --all` (`--check` validates without writing) | Yes (docs/tenant-packs.md) |
| `tools/scratch/gen_num.js` | `mod_r32_num_a_data.js` (the committed numbers) | a `--full` build | `node tools/scratch/gen_num.js build_out [--records]` | Yes: append-only, never renumbers |

## Adding a module
Name it `src/mod_s_<domain>.js` (and optional `.css`) and add `"mod_s_<domain>"` to `src/modules.json`; the build fails until it is listed. See `src/MODULE_GUIDE.md` and `docs/ARCHITECTURE.md`.
