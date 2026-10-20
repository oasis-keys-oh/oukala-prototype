#!/bin/bash
# Generator (see tools/README.md). Writes mod_kcs.js (rewrites its KCSX tail in place) in src/ from tools/generators/kcs_parts2/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_kcs.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
SRC="$SRC" python3 - <<'PY'
import os
src=os.environ['SRC']
s=open(os.path.join(src,'mod_kcs.js'),encoding='utf-8').read()
mark='/* ===== KCSX: knowledge as source'
i=s.find(mark)
if i>=0: s=s[:i].rstrip('\n')+'\n'
parts=''.join(open('kcs_parts2/'+f,encoding='utf-8').read()+'\n' for f in ['a_data.js','b_home.js','c_item.js','d_skills.js','e_wire.js'])
open(os.path.join(src,'mod_kcs.js'),'w',encoding='utf-8').write(s+parts)
PY
node --check "$SRC/mod_kcs.js"
