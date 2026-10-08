#!/bin/bash
# assemble mod_kcs.js = part1 (v4 core, kcs_parts2 appended)
cd "$(dirname "$0")"
python3 - <<'PY'
s=open('mod_kcs.js',encoding='utf-8').read()
mark='/* ===== KCSX: knowledge as source'
i=s.find(mark)
if i>=0: s=s[:i].rstrip('\n')+'\n'
parts=''.join(open('kcs_parts2/'+f,encoding='utf-8').read()+'\n' for f in ['a_data.js','b_home.js','c_item.js','d_skills.js','e_wire.js'])
open('mod_kcs.js','w',encoding='utf-8').write(s+parts)
PY
node --check mod_kcs.js
