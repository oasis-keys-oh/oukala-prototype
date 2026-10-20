import re
d='/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/'
L=open(d+'pp2/legacy_orig.js').read().split('\n')
out=[]
for ln in L:
    s=ln
    if s.startswith(' if(/who.*(overload|over capacity') or s.startswith(' if(/org chart|org structure') or s.startswith(' if(/find (me )?(a |an )?(person') or s.startswith(' if(/journey map|first week'):
        continue
    if s.startswith('SEARCHX.push(()=>st.people.map') or s.startswith('SEARCHX.push(()=>st.agents.map') or s.startswith('SEARCHX.push(()=>st.jr.list.map'):
        continue
    out.append(s)
leg='\n'.join(out)
roster=open(d+'pp2/roster.txt').read().strip()
parts=''
for p in ['p00_core','p10_org','p15_orgx','p20_perf','p21_perfui','p22_perfscr','p30_cap','p40_jrny','p90_end']:
    parts+=open(d+'pp2/'+p+'.js').read()+'\n'
parts=parts.replace('const ROSTER_TEXT_PLACEHOLDER=0;',roster,1)
open(d+'mod_people.js','w').write(leg+'\n'+parts)
print(len(leg),len(parts),'/*ROSTER*/' in parts)

open(d+'mod_people.css','w').write(open(d+'pp2/legacy_orig.css').read()+open(d+'pp2/new.css').read())
