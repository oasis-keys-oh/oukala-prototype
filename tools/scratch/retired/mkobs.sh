#!/bin/bash
# Generator (see tools/README.md). Writes mod_obs.js in src/ from tools/generators/obs_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mkobs.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat obs_parts/a_core.js obs_parts/b_engine.js obs_parts/c_ui.js obs_parts/d_evt1.js obs_parts/d_evt2.js obs_parts/d_evt3.js obs_parts/e_thr.js obs_parts/f_auto1.js obs_parts/f_auto2.js obs_parts/g_auto3.js obs_parts/h_std.js obs_parts/i_slo.js obs_parts/j_dash.js obs_parts/k_main.js > "$SRC/mod_obs.js"
node --check "$SRC/mod_obs.js" && wc -c "$SRC/mod_obs.js"
