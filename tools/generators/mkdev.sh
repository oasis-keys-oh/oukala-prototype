#!/bin/bash
# Generator (see tools/README.md). Writes mod_devops.js in src/ from tools/generators/dev_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mkdev.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat dev_parts/a_model.js dev_parts/b_ui.js dev_parts/c_panes.js dev_parts/d_env.js dev_parts/e_main.js dev_parts/f_map.js dev_parts/g_data.js > "$SRC/mod_devops.js"
node --check "$SRC/mod_devops.js" && wc -c "$SRC/mod_devops.js"
