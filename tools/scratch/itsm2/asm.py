import re,os
d=os.path.dirname(os.path.abspath(__file__))
R=lambda n:open(os.path.join(d,n)).read()
v4=open(os.path.join(d,'..','ref','mod_itsm_v4.js')).read().split('\n')
sla='\n'.join(v4[152:157])
s03=R('s03_logic.js').replace('`SLA_COPY`',sla)
s06b=R('s06b_chg.js').replace('bumpPol&&0;','').replace('X.seq.pol++','X.seq.ap++')
parts=[R('s01_head.js'),R('v4_data1.js'),R('v4_data2.js'),R('v4_risk.js'),R('s02_seed.js'),s03,R('s04a_inc.js'),R('s04b_inc.js'),R('s05_prb.js'),R('s06a_chg.js'),s06b,R('s07a_mi.js'),R('s07b_home.js'),R('s08_events.js').rstrip()[:-5].rstrip()+'\n'+R('s09_api.js')+'\n})();']
open(os.path.join(d,'..','mod_itsm.js'),'w').write('\n'.join(parts))
print(sum(len(p) for p in parts))
