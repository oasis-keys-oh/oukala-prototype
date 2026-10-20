import sys,os,re,json,collections,shutil
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from common import *
import common
from epics import *
import screens as S, data as D, domain as DM, security as SE, plat as PL, gaps as GP, stories as ST, docrows as DR
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule

OUT=os.environ.get('OUTX','/mnt/user-data/outputs/oukala-requirements-register.xlsx')
FONT='Arial'
# ---------------- generate ----------------
S.screen_rows(); D.entity_rows(); DM.process_rows(); DM.metric_rows(); DM.event_rows(); SE.security_rows(); PL.design_rows(); PL.integration_rows(); PL.agent_rows(); PL.bcdr_rows(); DR.doc_rows()

# epic overrides for cross-cutting families
def epic_override(r):
    q=r['req']
    if r['module'] in ('DSGN',): return None
    pats=[('X02',('Make the keyboard focus order','Give every control and region','Give interactive controls','Meet text contrast')),
          ('X03',('Fit ',"Provide phone navigation")),
          ('X04',('Keep the open time',)),
          ('X05',('Show an empty state','Show a loading state','Show an error state','Show the denied state')),
          ('X06',('Persist the state',)),
          ('X07',('Show the module owner','Place \'Why am I seeing'))]
    if not r['screen_id'] or r['module'] in ('DATA','SECU','APPR','INTG','IMPT','AGNT','PROC','METR','EVNT','RES'): return None
    for eid,starts in pats:
        if q.startswith(starts): return eid
    return None
for r in ROWS:
    o=epic_override(r)
    if o: r['epic']=en(o)

# ---------------- ids ----------------
MOD_ORDER=['HOME','MYWK','HELP','PLAN','FIX','TECH','MONY','LEARN','PEOP','STRT','GRC','RES','AUTO','AI','PLAT','NEW','HIDN','DATA','PROC','METR','EVNT','SECU','APPR','INTG','IMPT','AGNT','DSGN']
def mo(m): return MOD_ORDER.index(m) if m in MOD_ORDER else 99
for r in ROWS:
    if r['module']=='RES' and r['screen_id']=='' : pass
idx={m:i for i,m in enumerate(MOD_ORDER)}
ROWS.sort(key=lambda r:(mo(r['module']),))  # stable: keeps insertion order within module
cnt=collections.Counter()
for r in ROWS:
    cnt[r['module']]+=1
    r['id']=f"OK-{r['module']}-{cnt[r['module']]:03d}"
for r in ROWS:
    if not r['owner']: r['owner']='unassigned'
    if not r['backup']: r['backup']='none named'
    if not r['verified']: r['verified']='manual test against acceptance criteria'
    for k in ('module','epic','cat','pri','req','ac','status','source'):
        assert r[k], (r['id'],k)
# resolve deps
for r in ROWS:
    ds=[]
    for k in r['deps']:
        t=KEYS.get(k)
        if t and t['id']!=r['id'] and t['id'] not in ds: ds.append(t['id'])
    r['depstr']=', '.join(ds[:6])
print('rows',len(ROWS),collections.Counter(r['module'] for r in ROWS))

# word filter
BAN=re.compile(r'\b(FAF|Codification|ASU|ASC|FASB|GASB)\b|Casey|Rowan',re.I)
def check(s):
    return bool(BAN.search(s))
def san(v):
    if isinstance(v,bool): return 'yes' if v else 'no'
    if isinstance(v,str):
        if BAN.search(v): return BAN.sub('[term]',v)
        # strip illegal xml chars
        v=re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]','',v)
    return v
STORIES=ST.build_stories(300)
print('stories',len(STORIES),'epics',len(EPIC_DEFS))

# ---------------- workbook ----------------
wb=Workbook()
HF=Font(name=FONT,bold=True,color='FFFFFF',size=10)
HFILL=PatternFill('solid',fgColor='1F3A4D')
BF=Font(name=FONT,size=9)
BOLD=Font(name=FONT,size=9,bold=True)
TOP=Alignment(vertical='top',wrap_text=True)
TOPN=Alignment(vertical='top',wrap_text=False)
thin=Side(style='thin',color='D0D7DC')
def sheet(name,headers,rows,widths,wrapcols=(),freeze='A2',tab=None):
    ws=wb.create_sheet(name)
    ws.append(headers)
    for c in range(1,len(headers)+1):
        cell=ws.cell(1,c); cell.font=HF; cell.fill=HFILL; cell.alignment=Alignment(vertical='center',wrap_text=True)
    for row in rows:
        ws.append([san(x) for x in row])
    n=len(rows)+1
    for i,w in enumerate(widths,1): ws.column_dimensions[L(i)].width=w
    for row in ws.iter_rows(min_row=2,max_row=n):
        for c in row:
            c.font=BF
            c.alignment=TOP if (c.column in wrapcols) else TOPN
    ws.freeze_panes=freeze
    ws.auto_filter.ref=f"A1:{L(len(headers))}{max(n,2)}"
    ws.row_dimensions[1].height=30
    if tab: ws.sheet_properties.tabColor=tab
    return ws,n

# README + Summary created first for order; fill later
wb.remove(wb.active)
readme=wb.create_sheet('README'); summ=wb.create_sheet('Summary')

# Requirements
rq_rows=[]
for r in ROWS:
    rq_rows.append([r['id'],r['module'],r['epic'],r['screen_id'],r['screen_name'],r['cat'],r['pri'],r['req'],r['pos'],r['spc'],r['exp'],r['ac'],r['data'],r['proc'],r['metric'],r['persona'],r['events'],r['owner'],r['backup'],r['status'],r['verified'],r['source'],r['depstr'],r['notes']])
ws_rq,NRQ=sheet('Requirements',COLS,rq_rows,[14,8,30,16,24,13,8,60,48,40,40,70,30,16,22,38,24,20,20,12,30,10,24,34],wrapcols=(3,8,9,10,11,12,13,16,23,24),tab='1F3A4D')
# validations
dv=DataValidation(type='list',formula1='"'+','.join(CATS)+'"',allow_blank=False); dv.add(f'F2:F{NRQ+500}')
dv2=DataValidation(type='list',formula1='"'+','.join(PRIS)+'"',allow_blank=False); dv2.add(f'G2:G{NRQ+500}')
dv3=DataValidation(type='list',formula1='"'+','.join(STATUSES)+'"',allow_blank=False); dv3.add(f'T2:T{NRQ+500}')
dv4=DataValidation(type='list',formula1='"measured,registry,docs,derived"',allow_blank=True); dv4.add(f'V2:V{NRQ+500}')
for d_ in (dv,dv2,dv3,dv4): ws_rq.add_data_validation(d_)
fills={'Built':'C6EFCE','Partial':'FFEB9C','Simulated':'BDD7EE','Gap':'F8CBAD'}
for k,col in fills.items():
    ws_rq.conditional_formatting.add(f'T2:T{NRQ}',CellIsRule(operator='equal',formula=[f'"{k}"'],fill=PatternFill('solid',bgColor=col,fgColor=col)))
pf={'P0':'F4B6B6','P1':'FCE4B6','P2':'E6EEF2','P3':'F4F4F4'}
for k,col in pf.items():
    ws_rq.conditional_formatting.add(f'G2:G{NRQ}',CellIsRule(operator='equal',formula=[f'"{k}"'],fill=PatternFill('solid',bgColor=col,fgColor=col)))
ws_rq.freeze_panes='H2'
RQ_LAST=NRQ
def rqcol(letter): return f"Requirements!${letter}$2:${letter}${RQ_LAST}"

# Screens sheet
scr_rows=[]
for s in SCREENS:
    sid=s['id']; rec=M.get(sid) or {}; d=rec.get('d') or {}
    nm=NAVMAP.get(sid,{}); mod=MOD_BY_SCR.get(sid); cm=CONTRACT.get(sid)
    own,bak=S.parse_owner(d,mod,cm)
    acc=R['screenAccess'].get(sid,{})
    allowed=[S.PERSONA_NAME[p] for p,v in acc.items() if v==1 and p in S.PERSONA_NAME]
    _pb=S.screen_binding(sid)
    ph=rec.get('phone') or {}
    h1=d.get('h1') or {}; hb=d.get('heroBox') or {}
    a11=d.get('a11y') or {}
    scr_rows.append([sid,nm.get('l') or s['name'],NAVG.get(nm.get('g'),{}).get('label','hidden from rail' if nm.get('g')=='r15hid' else ''),module_code(sid),en(screen_epic(sid)),d.get('breadcrumb'),own,bak,len(allowed),', '.join(allowed),
        ' | '.join(t['label'] for t in (rec.get('tabs') or [{}])[0].get('items',[])) if rec.get('tabs') else '',
        ' | '.join(h['t'] for h in (d.get('headings') or [])[1:9]),
        hb.get('x'),hb.get('y'),hb.get('w'),hb.get('h'),h1.get('family'),h1.get('size'),h1.get('weight'),len([r for r in d.get('regions',[]) if r['kind']=='card']),len(d.get('tables') or []),d.get('nButtons'),d.get('nFields'),a11.get('tabbable'),a11.get('small'),
        ph.get('scrollW'),'yes' if ph.get('overflowX') else ('no' if ph else ''),rec.get('goMs'),(d.get('doc') or {}).get('nodes'),_pb[0],', '.join(_pb[1]),', '.join(_pb[2]),
        f'=COUNTIF({rqcol("D")},A{len(scr_rows)+2})'])
SCR_H=['Screen id','Screen name','Nav group','Module','Epic','Breadcrumb','Owner','Backup','Personas allowed (n)','Personas allowed','Tabs','Sections (headings)','Header x','Header y','Header width','Header height','H1 font','H1 size px','H1 weight','Cards','Tables','Buttons','Form fields','Tabbable controls','Controls under 44 px','Phone scroll width','Phone overflow X','Open ms','DOM nodes','Process','Reads','Writes','Requirement rows']
sheet('Screens',SCR_H,scr_rows,[16,26,22,8,30,34,18,18,9,40,40,50,8,8,8,8,16,8,8,7,7,8,8,9,9,9,9,8,8,16,30,30,10],wrapcols=(12,),freeze='C2',tab='2E6E8E')

# Entities and Fields
ent_rows=[]
for e in R['entities']:
    cl=collections.Counter(f.get('classification') or 'none' for f in e['fields'])
    ent_rows.append([e['id'],e['label'],e['domain'],en(data_epic(e['domain'])),e['lifecycle'],'proposed' if e['proposed'] else 'live',e.get('status'),e.get('owner'),e.get('steward'),OWN_OF['ents'].get(e['id'],''),e['nf'],e.get('cls'),e.get('ret') or '',', '.join(f"{k} {v}" for k,v in cl.items()),', '.join(f"{k} {v}" for k,v in (e.get('authMix') or {}).items()),', '.join(e.get('readers') or []),', '.join(e.get('writers') or []),KEYS['DATA:'+e['id']]['id'] if 'DATA:'+e['id'] in KEYS else '',f'=COUNTIF({rqcol("M")},"*"&A{len(ent_rows)+2}&"*")' if False else ''])
for row in ent_rows: row.pop()
sheet('Entities',['Entity id','Label','Domain','Epic','Lifecycle','Status (live/proposed)','Registry status','Owner (module)','Steward','Named owner','Field count','Classification','Retention','Field classes','Authority mix','Readers','Writers','Req ID'],ent_rows,[22,26,10,30,10,12,12,16,24,18,8,13,22,36,24,34,34,14],wrapcols=(16,17),freeze='C2',tab='2E6E8E')
fld_rows=[]
for e in R['entities']:
    for f in e['fields']:
        k=KEYS.get(f"FLD:{e['id']}.{f['k']}")
        fld_rows.append([e['id'],f['k'],f.get('label'),f.get('type') or '',('yes' if f.get('req') else 'no'),f.get('classification') or '',f.get('authority') or '',f.get('ref') or '',f.get('opts') or '',('external system' if f.get('ext') is True else (f.get('ext') or '')),e.get('ret') or '','proposed' if e['proposed'] else 'live',e['domain'],k['id'] if k else '',k['pri'] if k else '',k['status'] if k else ''])
sheet('Fields',['Entity id','Field key','Label','Type','Required','Classification','Authority','Reference target','Options','External source','Retention','Entity status','Domain','Req ID','Priority','Prototype status'],fld_rows,[22,22,26,12,9,14,12,22,8,16,22,10,10,14,8,12],freeze='C2',tab='2E6E8E')

# Processes and Steps
pr_rows=[];st_rows=[]
for p in R['processes']:
    mod,sid=DM.proc_module(p)
    k=KEYS.get('PROC:'+p['id'])
    pr_rows.append([p['id'],p.get('name'),p.get('familyName'),mod,sid,p.get('owner'),p.get('backup') or '',p.get('level'),p.get('target'),'yes' if p.get('below') else 'no',p.get('model'),len(p['steps']),', '.join(p.get('metrics') or []),p.get('trigger') or '',', '.join(p.get('std') or []),k['id'] if k else ''])
    for i,s in enumerate(p['steps'],1):
        kk=KEYS.get(f"STEP:{p['id']}:{i}")
        st_rows.append([p['id'],p.get('name'),i,s['n'],s['who'],s.get('owner') or '',s.get('sla') or '',s.get('in') or '',s.get('out') or '',s['d'][:300],kk['id'] if kk else '',kk['status'] if kk else ''])
sheet('Processes',['Process id','Name','Family','Module','Screen id','Owner','Backup','Maturity level','Target level','Below target','Model','Steps','Metrics','Trigger','Standards','Req ID'],pr_rows,[22,34,24,8,16,20,18,9,9,8,9,7,40,36,18,14],freeze='C2',tab='2E6E8E')
sheet('Steps',['Process id','Process','Step','Name','Who acts','Owner','SLA','Input','Output','Description','Req ID','Prototype status'],st_rows,[22,28,6,34,9,22,14,26,26,60,14,12],wrapcols=(10,),freeze='E2',tab='2E6E8E')

# Metrics
proc_of=collections.defaultdict(list)
for p in R['processes']:
    for m in p.get('metrics') or []: proc_of[m].append(p)
m_rows=[]
for m in R['metrics']:
    k=KEYS.get('MET:'+m['id']); ps=proc_of.get(m['id'],[])
    m_rows.append([m['id'],m['n'],m['f'][:300],m['u'],m['cur'],m['tgt'],m['badAt'],'higher is better' if m['dir']=='max' else 'lower is better',m['owner'],OWN_OF['metrics'].get(m['id'],''),', '.join(m.get('use') or []),', '.join(p['id'] for p in ps[:4]),', '.join(str(p.get('level')) for p in ps[:4]),(m.get('rem') or {}).get('ref',''),(m.get('rem') or {}).get('agent',''),k['id'] if k else ''])
sheet('Metrics',['Metric id','Name','Formula','Unit','Current (seeded)','Target','Bad at','Direction','Owner (role)','Named owner','Used on','Processes (lineage)','Process maturity levels','Remediation','Remediation agent','Req ID'],m_rows,[22,32,60,7,10,8,8,16,20,18,30,28,10,10,22,14],wrapcols=(3,),freeze='C2',tab='2E6E8E')

# Events
ev_rows=[]
for e in R['events']:
    k=KEYS.get('EVNT:'+e['id'])
    ev_rows.append(['event',e['id'],e['label'],e['module'],e['owner'],', '.join(f"{f['name']}:{f['type']}" for f in e['fields']),e['subscribers'],e['rules'],e['enabledRules'],'','',k['id'] if k else ''])
for r in R['eventRules']:
    ev_rows.append(['rule',r['id'],r.get('label') or '',EVT.get(r['when'],{}).get('module',''),r.get('owner'),'',  '','','','when '+r['when'],(('if '+r['if']+'; ') if r.get('if') else '')+'then '+'; '.join(clean(f"{a.get('action')} {a.get('target') or a.get('entity') or a.get('title') or ''}") for a in r.get('then') or []),''])
sheet('Events',['Kind','Id','Label','Module','Owner','Payload fields','Subscribers','Rules','Enabled rules','Trigger','Condition and actions','Req ID'],ev_rows,[8,26,30,16,20,60,10,7,9,24,60,14],wrapcols=(6,11),freeze='C2',tab='2E6E8E')

# Roles and permissions
rp=[]
for r in R['roles']: rp.append(['role',r['id'],r['n'],clean(r['d']),r.get('adm') or '',lst([p['n'] for p in R['personas'] if r['id'] in (R['personaRoles'].get(p['id']) or [])],8),KEYS.get('SECU:role:'+r['id'],{}).get('id','')])
for p in R['personas']: rp.append(['persona',p['id'],p['n'],clean(p.get('who')),'',', '.join(R['personaRoles'].get(p['id']) or []),''])
for g in R['permGroups']: rp.append(['permission group',g['id'],g['n'],'owner '+(g.get('owner') or ''),'',', '.join(g.get('roles') or []),''])
for a in R['guardActions']: rp.append(['guard action',a['id'],a['n'],('separation of duties; ' if a['sod'] else '')+'all: '+', '.join(a['all'])+('; any: '+', '.join(a['any']) if a['any'] else ''),'','',''])
for g in R['approvalGroups']: rp.append(['approver group',g['id'],g['name'],clean(g.get('desc')),(g.get('quorum') or {}).get('mode','')+' '+str((g.get('quorum') or {}).get('n','')),'members: '+', '.join(g.get('members') or []),''])
for r in R['approvalRules']: rp.append(['approval rule',r['id'],r['name'],clean(r.get('desc')),r['entity'],' > '.join(f"{l['title']} ({l['group']})" for l in r.get('levels') or []),''])
for t in R['doa']: rp.append(['DOA tier',t['id'],t['role'],'up to '+(format(t['max'],',') if t.get('max') else 'no limit'),'','',''])
for s in R['statuses']: rp.append(['status',s['id'],s['label'],f"category {s['cat']}; handover {s['handover']}; device {s['device']}",s.get('group') or '',', '.join(s.get('launches') or []),''])
for r in R['permRules']:
    if r.get('kind')=='seed' and r.get('tier')=='screen': continue
    rp.append(['permission rule',r['id'],r['name'],f"{r['effect']} {','.join(r.get('act') or [])} on {r.get('res')}"+(f" when {r['when']}" if r.get('when') else ''),r.get('tier') or '',SE.subtxt(r.get('sub')),''])
for r in R['fieldRules']: rp.append(['field rule',r['id'],r['name'],f"{r['mode']} {r['entity']}.{r['field']}"+(f" when {r['when']}" if r.get('when') else ''),'',SE.subtxt(r.get('sub')),''])
# screen access matrix as rows
for s in SCREENS:
    acc=R['screenAccess'].get(s['id'],{})
    rp.append(['screen access',s['id'],s['name'],'allowed: '+lst([S.PERSONA_NAME[p] for p,v in acc.items() if v==1 and p in S.PERSONA_NAME],13),'','denied: '+lst([S.PERSONA_NAME[p] for p,v in acc.items() if v==0 and p in S.PERSONA_NAME],13),''])
sheet('Roles and permissions',['Kind','Id','Name','Definition','Scope or admin','Personas, roles or members','Req ID'],rp,[16,22,34,70,18,60,14],wrapcols=(4,6),freeze='C2',tab='2E6E8E')

# Design tokens
tk_rows=[]
for n,v in TOK.items():
    g,lab=PL.tgroup(n)
    tk_rows.append([n,lab or 'Visualization palette',v.get('dark',{}).get('raw'),v.get('light',{}).get('raw'),v.get('dark',{}).get('color') or '',v.get('light',{}).get('color') or '',KEYS.get('DSGN:'+n,{}).get('id','')])
sheet('Design tokens',['Token','Group','Dark value','Light value','Dark computed','Light computed','Req ID'],tk_rows,[22,30,28,28,24,24,14],freeze='B2',tab='2E6E8E')

# Integrations, Agents, BCDR
ig=[]
for c in R['connectors']: ig.append(['connector',c['id'],c['name'],c['tier'],c['status'],c['owner'],', '.join(c.get('entities') or []),c.get('fields')])
for e in R['editions']: ig.append(['edition',e['id'],e['n'],f"{e['conn']} connectors",f"{e['env']} environments",'',clean(e['note']),''])
for d in R['deployments']: ig.append(['deployment model',d['id'],d['n'],'','','','',''])
for t in R['importers']: ig.append(['importer',t['id'],t['n'],t['file'],f"order {t['order']}",'',t['ent'],len(t['cols'])])
for t in R['mcpTools']: ig.append(['MCP tool',t['n'],clean(t['d']),'write' if t['write'] else 'read','','','',''])
for g in R['gateChecks']: ig.append(['gate check',g['id'],g['n'],g['t'],'','',clean(g['rule']),''])
sheet('Integrations',['Kind','Id','Name','Tier or file','Status or limit','Owner','Entities or note','Fields or columns'],ig,[16,22,40,16,18,18,60,10],wrapcols=(7,),tab='2E6E8E')
ag=[]
for a in R['agents']: ag.append(['agent',a['id'],a['name'],a['sponsor'],a['autonomy'],a['status'],a.get('model'),lst(a.get('tools'),8),lst(a.get('guards'),6),a.get('kill'),str(a.get('eval'))])
for a in R['agentsPlatform']: ag.append(['platform agent',a['id'],a['n'],a['owner'],str(a['auto']),'',a.get('model'),lst(a.get('tools'),8),lst(a.get('guards'),6),'',f"daily cap {a.get('cap$')}"])
for k,l in (R['agentLevels'] or {}).items(): ag.append(['autonomy level',k,l['n'],'','','','','','','',''])
sheet('Agents',['Kind','Id','Name','Sponsor','Autonomy','Status','Model','Tools','Guards','Kill switch scope','Evaluation or cap'],ag,[14,20,28,18,10,10,16,34,50,12,34],wrapcols=(8,9),tab='2E6E8E')
bc=[]
for p in R['bcdrPlans']: bc.append(['plan',p['id'],p['n'],p['kind'],p['scope'],p['tier'],p['status'],p['own'],p['bak'],f"review every {p['cadence']} months; last {p['lastReview']}",f"RTO {p.get('rtoT')}; RPO {p.get('rpoT')}"])
for x in R['bcdrExercises']: bc.append(['exercise',x['id'],x['planId'],x['type'],x['app'],'',x['status'],x['fac'],x['fbak'],x['date'],f"RTO {x.get('rto')}; RPO {x.get('rpo')}"])
for d,n in sorted(R['bcdrComps'].items()): bc.append(['component set',d,'',f"{n} components",'','','','','','',''])
sheet('BCDR',['Kind','Id','Name or plan','Type','Scope','Tier','Status','Owner','Backup','Cadence or date','Targets or results'],bc,[14,14,40,16,16,6,12,18,18,36,28],tab='2E6E8E')

# Gaps
gp=[]
n=0
for cat,txt,src,pri,ep in GP.DOC_GAPS+GP.findings():
    n+=1
    epname=en(ep) if ep in EPIC_NAME else ep
    gp.append([f"GAP-{n:03d}",cat,txt,src,pri,epname,'Open','docs' if src.startswith('docs') or 'docs/' in src else 'measured/registry'])
sheet('Gaps and open items',['Gap id','Area','Description','Source','Priority','Epic','State','Origin'],gp,[10,16,100,48,8,34,8,16],wrapcols=(3,4),tab='A04030')
dvg=DataValidation(type='list',formula1='"'+','.join(PRIS)+'"'); dvg.add('E2:E500'); wb['Gaps and open items'].add_data_validation(dvg)

# Epics
ep_rows=[]
for i,e in enumerate(EPIC_DEFS,2):
    ep_rows.append([e['id'],e['name'],e['goal'],e['scope'],e['deps'],e['pri'],e['size'],f'=COUNTIF({rqcol("C")},A{i}&" "&B{i})',f'=COUNTIFS({rqcol("C")},A{i}&" "&B{i},{rqcol("G")},"P0")',f'=COUNTIF(Stories!$B$2:$B${len(STORIES)+1},A{i}&" "&B{i})'])
sheet('Epics',['Epic id','Epic','Goal','Scope','Depends on','Priority','Rough size','Requirement rows','P0 rows','Stories'],ep_rows,[8,40,64,64,14,8,9,12,9,9],wrapcols=(3,4),tab='2E6E8E')
dve=DataValidation(type='list',formula1='"S,M,L,XL"'); dve.add('G2:G200'); wb['Epics'].add_data_validation(dve)

# Stories
sy=[[s['id'],s['epic'],s['text'],s['ac'],', '.join(s['reqs'][:40])+(' ...' if len(s['reqs'])>40 else ''),s['count'],s['pri'],s['pts'],s['screen'],'Backlog'] for s in STORIES]
ws_st,_=sheet('Stories',['Story id','Epic','Story','Acceptance criteria','Requirement ids','Requirement count','Priority','Points','Screen or module','State'],sy,[9,34,70,80,40,10,8,7,18,10],wrapcols=(3,4,5),tab='2E6E8E')
dvs=DataValidation(type='list',formula1='"Backlog,Ready,In progress,In review,Done,Blocked"'); dvs.add(f'J2:J{len(STORIES)+500}'); ws_st.add_data_validation(dvs)

# ---------------- Summary (formulas) ----------------
sw=summ
sw.sheet_properties.tabColor='1F3A4D'
def hdr(ws,r,c,t):
    x=ws.cell(r,c,t); x.font=HF; x.fill=HFILL; x.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True)
sw['A1']='Requirements register: summary'; sw['A1'].font=Font(name=FONT,bold=True,size=14)
sw['A2']='All counts are formulas over the Requirements sheet. Filter the Requirements sheet for the rows behind each number.'; sw['A2'].font=BF
r0=4
sw.cell(r0,1,'Total requirement rows').font=BOLD; sw.cell(r0,2,f'=COUNTA({rqcol("A")})').font=BOLD
sw.cell(r0+1,1,'Rows with acceptance criteria').font=BF; sw.cell(r0+1,2,f'=COUNTIF({rqcol("L")},"?*")').font=BF
sw.cell(r0+2,1,'Rows missing acceptance criteria (must be 0)').font=BF; sw.cell(r0+2,2,f'=B{r0}-B{r0+1}').font=BF
sw.cell(r0+3,1,'Distinct modules').font=BF
mods=[m for m in MOD_ORDER if any(r['module']==m for r in ROWS)]
sw.cell(r0+3,2,len(mods)).font=BF
def block(r,title,vals,col):
    hdr(sw,r,1,title)
    for j,h in enumerate(['Count','Share']):
        hdr(sw,r,2+j,h)
    for i,v in enumerate(vals,1):
        sw.cell(r+i,1,v).font=BF
        sw.cell(r+i,2,f'=COUNTIF({rqcol(col)},A{r+i})').font=BF
        c=sw.cell(r+i,3,f'=IF($B${r0}=0,0,B{r+i}/$B${r0})'); c.number_format='0.0%'; c.font=BF
    t=r+len(vals)+1
    sw.cell(t,1,'Total').font=BOLD; sw.cell(t,2,f'=SUM(B{r+1}:B{t-1})').font=BOLD
    return t
t=block(r0+5,'By priority',PRIS,'G')
t=block(t+2,'By status',STATUSES,'T')
t=block(t+2,'By category',CATS,'F')
t=block(t+2,'By module',mods,'B')
# matrix module x priority
mr=t+2
hdr(sw,mr,1,'Module by priority')
for j,p in enumerate(PRIS): hdr(sw,mr,2+j,p)
hdr(sw,mr,6,'Total')
for i,m in enumerate(mods,1):
    sw.cell(mr+i,1,m).font=BF
    for j,p in enumerate(PRIS):
        sw.cell(mr+i,2+j,f'=COUNTIFS({rqcol("B")},$A{mr+i},{rqcol("G")},{L(2+j)}${mr})').font=BF
    sw.cell(mr+i,6,f'=SUM(B{mr+i}:E{mr+i})').font=BOLD
mt=mr+len(mods)+1
sw.cell(mt,1,'Total').font=BOLD
for j in range(5): sw.cell(mt,2+j,f'=SUM({L(2+j)}{mr+1}:{L(2+j)}{mt-1})').font=BOLD
# module x status
sr=mt+2
hdr(sw,sr,1,'Module by status')
for j,p in enumerate(STATUSES): hdr(sw,sr,2+j,p)
hdr(sw,sr,6,'Total')
for i,m in enumerate(mods,1):
    sw.cell(sr+i,1,m).font=BF
    for j,p in enumerate(STATUSES):
        sw.cell(sr+i,2+j,f'=COUNTIFS({rqcol("B")},$A{sr+i},{rqcol("T")},{L(2+j)}${sr})').font=BF
    sw.cell(sr+i,6,f'=SUM(B{sr+i}:E{sr+i})').font=BOLD
st_=sr+len(mods)+1
sw.cell(st_,1,'Total').font=BOLD
for j in range(5): sw.cell(st_,2+j,f'=SUM({L(2+j)}{sr+1}:{L(2+j)}{st_-1})').font=BOLD
# category x priority
cr=st_+2
hdr(sw,cr,1,'Category by priority')
for j,p in enumerate(PRIS): hdr(sw,cr,2+j,p)
hdr(sw,cr,6,'Total')
for i,c_ in enumerate(CATS,1):
    sw.cell(cr+i,1,c_).font=BF
    for j,p in enumerate(PRIS):
        sw.cell(cr+i,2+j,f'=COUNTIFS({rqcol("F")},$A{cr+i},{rqcol("G")},{L(2+j)}${cr})').font=BF
    sw.cell(cr+i,6,f'=SUM(B{cr+i}:E{cr+i})').font=BOLD
sw.cell(cr+len(CATS)+2,1,'Other sheets (row counts)').font=BOLD
others=[('Screens','A'),('Entities','A'),('Fields','A'),('Processes','A'),('Steps','A'),('Metrics','A'),('Events','A'),('Epics','A'),('Stories','A'),('Gaps and open items','A')]
for i,(nme,col) in enumerate(others,1):
    sw.cell(cr+len(CATS)+2+i,1,nme).font=BF
    sw.cell(cr+len(CATS)+2+i,2,f"=COUNTA('{nme}'!$A$2:$A$20000)").font=BF
sw.column_dimensions['A'].width=46
for c in 'BCDEF': sw.column_dimensions[c].width=12
sw.freeze_panes='A4'

# ---------------- README ----------------
rm=readme; rm.sheet_properties.tabColor='1F3A4D'
rm.column_dimensions['A'].width=26; rm.column_dimensions['B'].width=120
lines=[
 ('Oukala requirements register',None,'title'),
 ('Purpose','Requirement rows for the production build, derived from the working prototype (build '+R.get('build','')+', extracted '+R.get('extractedAt','')+'). Each row cites measured layout or registry facts. The sheets Stories and Epics seed user stories for Claude Code, which builds the system and tracks the build inside it.',None),
 ('How to use','1. Filter Requirements by Module, Epic or Screen id. 2. Take a Story from Stories; it lists its Req IDs. 3. Build to the Acceptance criteria of each Req ID. 4. Set Prototype status to the status in the production system and keep Verified by current. 5. Gaps and open items lists work that no row can specify yet.',None),
 ('Req ID convention','OK-<MODULE>-<NNN>. MODULE is the navigation-group code of the screen (HOME, MYWK, HELP, PLAN, FIX, TECH, MONY, LEARN, PEOP, STRT, GRC, RES, AUTO, AI, PLAT, NEW, HIDN for screens not in the rail) or a cross-cutting module: DATA entities and fields, PROC processes not linked to a screen, METR, EVNT events and rules, SECU roles and permissions, APPR approvals and status changes, INTG integrations, IMPT importers, AGNT agents and tools, DSGN design system. NNN is a sequence per module, three digits, growing to four when a module passes 999 rows. IDs are assigned in a fixed order from the registry; a re-run on the same build gives the same IDs, a changed build can renumber, so store IDs in the build tracker, not the text.',None),
 ('Columns','Req ID, Module, Epic, Screen id, Screen name, Category, Priority, Requirement (one imperative sentence), Position and layout (measured at 1440x900 dark, rail 268 px: region, x, y, width, height, relation to siblings), Spacing and typography (tokens and measured values), Expectation, Acceptance criteria (numbered, testable), Data, Process id, Metric ids, Persona and permission, Events, Owner, Backup, Prototype status, Verified by, Source, Dependencies (Req IDs), Notes.',None),
 ('Category values',', '.join(CATS)+'.',None),
 ('Priority rubric','P0: release blocker. Without it the production system is unsafe, unusable or untrustworthy. Applied to access control, masking of personal, restricted and confidential data, audit of writes, approval routing, core shell screens (home, inbox, approvals, admin, permissions), tier 1 continuity plans, and primary actions on core screens.\nP1: core workflow needed for the first customer release. Applied to live entities and their key fields, process steps with an SLA, primary actions, data bindings, focus order and labels, contrast, persistence of written entities, header and KPI layout on core screens, metrics tied to a process.\nP2: expected quality before general availability. Applied to secondary regions and tables, tabs, states (empty, loading, error), responsive layout, 44 px targets, performance budgets, remediation, secondary metrics.\nP3: enhancement or polish that can follow general availability. Applied to proposed (not yet live) entities and their fields, visualization palettes, extra scalability work.\nRule order: Security and Data rows on classified fields start at P0 or P1; rows on proposed entities are P3; a row whose prototype status is Gap keeps its priority and is also listed in the counts of the Summary sheet.',None),
 ('Prototype status values','Built: the prototype shows the behavior or fact, measured or read from the registry, as the row states. Partial: present but incomplete (for example a measured shortfall, a missing backup, or designed but not backed entity). Simulated: UI and seeded data exist but no real execution exists (connectors, AI, agents, metric calculation, deployments). Gap: no prototype evidence, or the registry shows a missing declaration.',None),
 ('Source values','measured: from the live prototype DOM at 1440x900 dark or 400x820. registry: from the in-page registries (entities, processes, metrics, events, permissions, approvals, integrations, agents, continuity). docs: from docs/*.md. derived: computed from other rows.',None),
 ('Performance budget rule','Default open-time budget is 1000 ms at the 95th percentile for a warm session (1500 ms when the screen has more than 4000 DOM nodes) and a DOM budget of 3000 nodes (6000 for heavy screens). Prototype timings were taken on a shared, loaded machine and are upper bounds.',None),
 ('Verified by','Names the script that produced the fact (spec/extract_registry.js) or the manual test. Acceptance criteria tolerances for position are 2 px at 1440x900 dark with the 268 px rail.',None),
 ('Sheets','Summary (formulas), Requirements, Screens, Entities, Fields, Processes, Steps, Metrics, Events (events and rules), Roles and permissions, Design tokens, Integrations, Agents, BCDR, Gaps and open items, Epics, Stories.',None),
 ('Editing rules','Do not rename column headers; Summary and Epics count by exact text. Category, Priority and Prototype status cells have drop-down lists. Add rows below the last row and extend the data validation if needed.',None),
 ('Regenerate','node spec/extract_registry.js out_v16b (writes spec/registry.json), then python3 spec/gen/build.py (writes the workbook), then the xlsx recalculation step.',None),
]
rm['A1']=lines[0][0]; rm['A1'].font=Font(name=FONT,bold=True,size=14)
for i,(a,b,t) in enumerate(lines[1:],3):
    rm.cell(i,1,a).font=BOLD; c=rm.cell(i,2,san(b)); c.font=BF; c.alignment=TOP
    rm.cell(i,1).alignment=Alignment(vertical='top')

os.makedirs(os.path.dirname(OUT),exist_ok=True)
wb.save(OUT)
json.dump({'rows':len(ROWS),'stories':len(STORIES),'epics':len(EPIC_DEFS)},open(os.path.join(HERE,'last_build.json'),'w'))
# machine copies for the summary doc
json.dump([{k:r[k] for k in ('id','module','epic','cat','pri','status','screen_id')} for r in ROWS],open(os.path.join(HERE,'rows_index.json'),'w'))
print('saved',OUT)
