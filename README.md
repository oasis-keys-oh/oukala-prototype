# Oukala prototype

Database-free, single-page prototype of the Oukala enterprise work platform (Oukala IP Holdco).
Live: https://oukala-prototype.netlify.app (Netlify project `oukala-prototype`).

- `src/` holds the sources. `python3 src/build.py --out build_out` concatenates them into `build_out/full.html`.
- Tests: `npm install` once (set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` if Chromium is already cached), then `npm test`. It builds and runs `tools/tests/smoke.js`, `tabs.js` and `showroom.js`; all must pass before a push.
- Netlify runs that build on every push to `main` and publishes `public/` (see `netlify.toml`).
- `src/MODULE_GUIDE.md` explains how to add a module (`mod_*.js` and `mod_*.css`).
- Design feedback is tracked in the vault Design Feedback Register (F1 to F38).
