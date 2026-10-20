import json, re, os, collections
HERE=os.path.dirname(os.path.abspath(__file__))
SPEC=os.path.dirname(HERE)
REGFILE=os.environ.get('REGFILE', os.path.join(SPEC,'registry.json'))
R=json.load(open(REGFILE))
M=R.get('measure',{})

COLS=['Req ID','Module','Epic','Screen id','Screen name','Category','Priority','Requirement','Position and layout','Spacing and typography','Expectation','Acceptance criteria','Data','Process','Metric','Persona and permission','Events','Owner','Backup','Prototype status','Verified by','Source','Dependencies','Notes']
CATS=['Experience','Layout','Data','Process','Metric','Security','Integration','AI','Operations']
PRIS=['P0','P1','P2','P3']
STATUSES=['Built','Partial','Simulated','Gap']

ROWS=[]
SEEN=set()
KEYS={}
def clean(s):
    if s is None: return ''
    s=str(s)
    s=re.sub(r'\s+',' ',s).strip()
    return s
def lst(a,n=12,sep=', '):
    a=[clean(x) for x in (a or []) if clean(x)]
    if len(a)>n: return sep.join(a[:n])+f' (+{len(a)-n} more)'
    return sep.join(a) if a else 'none'
def ac(*items):
    return '\n'.join(f'{i+1}. {clean(t)}' for i,t in enumerate([x for x in items if x]))

def add(module,epic,cat,pri,req,ac_,screen_id='',screen_name='',pos='',spc='',exp='',data='',proc='',metric='',persona='',events='',owner='',backup='',status='Built',verified='',source='registry',deps=None,notes='',key=None):
    req=clean(req)
    assert ac_ and ac_.strip(), req
    assert cat in CATS and pri in PRIS and status in STATUSES,(cat,pri,status)
    dk=(module,screen_id,cat,req)
    if dk in SEEN: return None
    SEEN.add(dk)
    row=dict(module=module,epic=epic,screen_id=screen_id,screen_name=screen_name,cat=cat,pri=pri,req=req,pos=clean(pos),spc=clean(spc),exp=clean(exp),ac=ac_,data=clean(data),proc=clean(proc),metric=clean(metric),persona=clean(persona),events=clean(events),owner=clean(owner),backup=clean(backup),status=status,verified=clean(verified),source=source,deps=deps or [],notes=clean(notes),key=key)
    ROWS.append(row)
    if key: KEYS[key]=row
    return row

def slug(s):
    return re.sub(r'[^a-z0-9]+','_',clean(s).lower()).strip('_')

def rgb(c):
    m=re.match(r'rgba?\((\d+),\s*(\d+),\s*(\d+)',c or '')
    return tuple(int(x) for x in m.groups()) if m else None
def lum(c):
    def f(v):
        v/=255
        return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b=c
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def contrast(a,b):
    la,lb=lum(a),lum(b)
    if la<lb: la,lb=lb,la
    return (la+0.05)/(lb+0.05)

TOK=R['tokens']
def tokcolor(name,theme):
    t=TOK.get(name,{}).get(theme,{})
    return rgb(t.get('color'))
def tokraw(name,theme='dark'):
    return TOK.get(name,{}).get(theme,{}).get('raw','')

# lookups
SCREENS=R['screens']
SCR={s['id']:s for s in SCREENS}
NAVG={g['id']:g for g in R['navgroups']}
NAVMAP=R['navmap']
MODS=R['modules']
MOD_BY_SCR={}
for m in MODS:
    if m.get('scr'): MOD_BY_SCR.setdefault(m['scr'],m)
    MOD_BY_SCR.setdefault(m['id'],m)
ENT={e['id']:e for e in R['entities']}
PROC={p['id']:p for p in R['processes']}
MET={m['id']:m for m in R['metrics']}
EVT={e['id']:e for e in R['events']}
CONTRACT={c['id']:c for c in R['contract']}
PERSONA={p['id']:p for p in R['personas']}
ROLE={r['id']:r for r in R['roles']}
OWNBY=R['ownership'].get('by',{})
# reverse ownership: kind -> id -> person
OWN_OF={'metrics':{},'procs':{},'ents':{}}
BAK_OF={}
for person,rec in OWNBY.items():
    for k in ('metrics','procs','ents'):
        for i in rec.get(k,[]) or []:
            OWN_OF[k].setdefault(i,person)
    for b in rec.get('backup',[]) or []:
        BAK_OF.setdefault(b if isinstance(b,str) else json.dumps(b),person)
