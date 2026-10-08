#!/bin/bash
cd "$(dirname "$0")"
cat dev_parts/a_model.js dev_parts/b_ui.js dev_parts/c_panes.js dev_parts/d_env.js dev_parts/e_main.js dev_parts/f_map.js dev_parts/g_data.js > mod_devops.js
node --check mod_devops.js && wc -c mod_devops.js
