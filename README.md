# Falconaire prototype

Database-free, single-page prototype of Falconaire, an AI-native work platform for enterprise IT and operations leaders. All data is fictional sample data (sample customer Atlantic Systems). The name is a working name, not trademark-cleared: do not use it externally.

Live: https://oukala-prototype.netlify.app (Netlify project `oukala-prototype`).

## Build
- `python3 src/build.py --out build_out` writes `index.html` (shell) and `oukala-js.js` (the script, loaded as `oukala-js.js?v=<content hash>`), plus `hero/` and `journey/` assets.
- Add `--full` for `full.html` (one self-contained page, used by the tests) and `oukala.html`. `--only mod_a,mod_b` builds a subset.
- Build order: core files, then the modules listed in `src/modules.json` in that order, then `screens3.js`. A module file that is not listed fails the build.

## Test
- Once per checkout: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` (Chromium already cached; otherwise drop the variable or set `CHROMIUM_PATH`).
- `npm test` builds with `--full`, gates on the Showroom lint (any tour over 1,200 seconds fails), then runs the smoke, journey tab, Showroom and platform contract suites. All must pass before any commit or push.

## Deploy
- One path: `bash tools/ship.sh` builds and stages `dist/` (index.html, oukala-js.js, hero/, journey/, `public/_headers`, `public/robots.txt`) and prints the size budget. Netlify runs exactly this on every push to `main` (`netlify.toml`); `bash tools/ship.sh --deploy` does a manual deploy of the same folder with the Netlify CLI.
- Cache: the script is immutable for a year (its URL changes every build); the shell revalidates on every load (`public/_headers`).

## Adding a module
- Name new modules by domain: `src/mod_s_<domain>.js` and optional `.css`, wrapped in an IIFE with a unique CSS prefix. Never name files by build round.
- Add `"mod_s_<domain>"` to `src/modules.json` (after `mod_r33_showroom`, alphabetical among `mod_s_` entries).
- Register screens with `REG`, read data through `DATA`, and use the shared platform contracts. Read `docs/ARCHITECTURE.md` (contracts and how work streams run) and `src/MODULE_GUIDE.md` first.
- After adding screens: `python3 tools/generators/gen_scrmap.py src`, then rebuild.

## Layout
- `src/`: shipped source only (core files, `mod_*` modules, styles, `tokens.py`, `brand.json`, `assets/`, `modules.json`, `build.py`).
- `tools/`: tests, the ship script, generators and archived scratch work (see `tools/README.md`).
- `docs/`: architecture, specs and audits. `docs/ARCHITECTURE.md` is the place to start.

## Rules that apply to every change
Fictional data only; label every number (prototype fact, modeled, hypothesis or simulated); never present a simulated capability as live; no price points and no certification claims; no em dashes in visible text; steps are human, robot or agent. Full list: `CLAUDE.md` and the platform rules.
