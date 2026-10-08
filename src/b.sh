#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad
cat adm/p1.js adm/p2.js adm/p3.js adm/p4.js adm/p5.js adm/p6.js adm/p7.js adm/p8.js adm/p9.js > v2/mod_admin.js
python3 - <<'P'
p='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/mod_admin.js'.replace('496f5667','496f5667')
P
cd v2 && python3 - <<'P'
p='mod_admin.js';s=open(p).read()
s=s.replace('''const nextKey=p=>{const i=EI[p.env];return i<3?ENVS[i].concat(ENVS[i+1])&&ENVS[i][0]+">"+ENVS[i+1][0]:null};''','''const nextKey=p=>{const i=EI[p.env];return i<3?ENVS[i][0]+">"+ENVS[i+1][0]:null};''')
s=s.replace('''x.fired?(x.g.act==="Redact"?"info":"bad"):"good")}</span></div>`).join("")}</div>''','''x.fired?(x.g.act==="Redact"?"info":"bad"):"good")}</div>`).join("")}</div>''')
s=s.replace('x.rec&&(N(x.rec)||byId(RECS,x.rec))?','x.rec&&(N(x.rec)||KGN.find(k=>k.id===x.rec))?').replace('rc||own&&false?"pass":"fail"','rc?"pass":"fail"').replace(',["V2","A1x"]','')
open(p,'w').write(s)
P
node --check mod_admin.js && python3 build.py --only mod_admin --out out_admin >/dev/null && node --check out_admin/oukala-js.js && echo BUILD_OK
