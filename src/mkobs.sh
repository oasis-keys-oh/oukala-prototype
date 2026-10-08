#!/bin/bash
cd "$(dirname "$0")"
cat obs_parts/a_core.js obs_parts/b_engine.js obs_parts/c_ui.js obs_parts/d_evt1.js obs_parts/d_evt2.js obs_parts/d_evt3.js obs_parts/e_thr.js obs_parts/f_auto1.js obs_parts/f_auto2.js obs_parts/g_auto3.js obs_parts/h_std.js obs_parts/i_slo.js obs_parts/j_dash.js obs_parts/k_main.js > mod_obs.js
node --check mod_obs.js && wc -c mod_obs.js
