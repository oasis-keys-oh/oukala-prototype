# Retired generators (CL-79)

Retired 2026-10-20 (Omar decision). Each script assembled a module in `src/` from a parts folder that is older than the committed module, so running it would undo later edits. Kept for history only: nothing in the build or tests reads this folder. The committed module in `src/` is the source of truth; edit it directly.

| Script | Wrote | Parts folder | Why retired |
|---|---|---|---|
| `assemble_flow.sh` | `mod_flow.js`, `mod_flow.css` | `fl/` | parts older than the committed module |
| `fab_build.sh` | `mod_plat_fabric.js` | `fabparts/` | parts older than the committed module |
| `mk_chat.sh` | `mod_chat.js` | `chatparts/` | parts older than the committed module |
| `mk.sh` | `mod_people.js` | `pp/` | parts are about 40 percent of today's file |
| `mk_links.sh` | `mod_plat_links.js` | `plk_parts/` | parts older than the committed module |
| `mk_kcs.sh` | `mod_kcs.js` (KCSX tail) | `kcs_parts2/` | parts older than the committed module |
| `mk_kgx.sh` | `mod_kgx.js` | `kgx_parts/` | parts older than the committed module |
| `mk_sla.sh` and `mk_oc.sh` (one generator: mk_sla runs mk_oc) | `mod_sla.js`, `mod_oncall.js` | `parts_sla/` | parts older than the committed modules |
| `mkdev.sh` | `mod_devops.js` | `dev_parts/` | parts older than the committed module |
| `mkobs.sh` | `mod_obs.js` | `obs_parts/` | parts older than the committed module |
| `nav_build.sh` | `mod_nav.js` | `nav_parts/` | parts older than the committed module |
| `rebuild_budget.sh` | `mod_budget.js` | `bp/` | parts older than the committed module |
| `mk_viz.sh` and `mk_viz.py` | `mod_viz.js`, `mod_viz2.js` (minified) | `vizsrc/` | never checked against the committed files (needs esbuild); not one of the four kept generators |
| `r17q_gen.py` | `mod_r17q_a_data.js` (decisions log data) | `docs/r17q/*.md` (not in the repo) | cannot run: its input documents are not in the repo |
