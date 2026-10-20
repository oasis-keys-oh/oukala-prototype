#!/bin/bash
cd "$(dirname "$0")"
LIST=$(python3 - <<'PY'
import glob,os
m=sorted(set(os.path.splitext(f)[0] for f in glob.glob('mod_*.js')+glob.glob('mod_*.css')))
m=[x for x in m if not x.startswith('mod_r17') or x.startswith('mod_r17o1')]
print(','.join(m))
PY
)
python3 build.py --only "$LIST" --out ${1:-out_o117} | cut -c1-60
node --check ${1:-out_o117}/oukala-js.js && echo js ok
