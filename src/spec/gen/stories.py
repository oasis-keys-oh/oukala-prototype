from common import *
from epics import *
import math
PRI_ORDER={'P0':0,'P1':1,'P2':2,'P3':3}
def theme(r):
    q=r['req']
    if q.startswith('Provide the action'): return 'act'
    if r['cat']=='Security': return 'secure'
    if r['cat']=='Data': return 'data'
    if r['cat']=='Metric': return 'metric'
    if r['cat']=='Process': return 'process'
    if r['cat']=='AI': return 'ai'
    if r['cat']=='Integration': return 'integ'
    if r['cat']=='Operations': return 'ops'
    return 'view'
ROLE_BY_EPIC_PREFIX={'D':'data steward','P':'process owner','M':'metric owner','A':'security administrator','I':'integration owner','AI':'AI governance lead','R':'resilience lead','EV':'platform engineer','X':'platform user'}
def role_for(epic_id,r):
    sid=r.get('screen_id')
    if epic_id.startswith('AI'): return 'AI governance lead'
    if epic_id.startswith('EV'): return 'platform engineer'
    if epic_id[0]=='D': return 'data steward'
    if epic_id[0]=='A': return 'security administrator'
    if epic_id[0]=='I': return 'integration owner'
    if epic_id[0]=='R': return 'resilience lead'
    if epic_id[0]=='M': return 'metric owner'
    if epic_id=='P01': return 'process owner'
    if epic_id=='X01': return 'designer'
    if sid:
        acc=R['screenAccess'].get(sid,{})
        pref={'MONY':'fin','PLAN':'pm','FIX':'ops','TECH':'ops','GRC':'audit','PLAT':'admin','AI':'admin','AUTO':'admin','STRT':'exec','HOME':'emp','MYWK':'emp','HELP':'emp','LEARN':'emp','PEOP':'emp','RES':'ops','HIDN':'admin'}.get(r.get('module'))
        names={p['id']:p['n'] for p in R['personas']}
        order=([pref] if pref else [])+['exec','fin','pm','ops','portfolio','change','arch','admin','audit','emp']
        for pid in order:
            if acc.get(pid)==1 and pid in names:
                return names[pid].replace(' (read only)','').lower()
    return 'platform user'
def article(role): return 'an' if role[0] in 'aeiou' else 'a'
def story_text(th,epic_id,r,grp):
    sname=r.get('screen_name') or ''
    role=role_for(epic_id,r)
    rows=grp
    def cap_outcome():
        if th=='view': return (f"{sname} to render its header, regions and tables at the specified positions and tokens", "I can scan every screen the same way and find the same things in the same place")
        if th=='act': 
            labs=[re.search(r"action '(.+?)' on",x['req']).group(1) for x in rows if re.search(r"action '(.+?)' on",x['req'])]
            return (f"to run {', '.join(labs[:3])} on {sname} with a recorded result", "every change is audited, emits an event and can be traced")
        if th=='data': 
            ents=sorted({x['data'].split(' ')[0].split('.')[0] for x in rows if x['data']})
            return (f"{sname if sname else 'the platform'} to read and write {', '.join(ents[:3]) or 'records'} from the registry", "one source of truth feeds every screen")
        if th=='secure': return (f"access to {sname or 'the data'} limited to permitted personas with classified fields masked", "restricted and personal data stays protected and every reveal is logged")
        if th=='metric': return (f"the metrics on {sname or 'the platform'} defined with formula, owner, lineage and thresholds", "I can trust the number and know who answers for it")
        if th=='process': return (f"{rows[0]['proc'] or 'the process'} to run with named owners, SLAs and decision rules", "work finishes inside its time and every decision is explainable")
        if th=='ai': return ("AI steps and agents to run with labeled output, guards and a kill switch", "AI never acts outside its approved autonomy")
        if th=='integ': return ("external systems to connect through certified connectors with mapping and quarantine", "data arrives complete and failures are visible")
        return (f"{sname or 'the platform'} to meet its operational requirements (ownership, events, persistence, performance)", "the service stays supportable in production")
    if th=='entity':
        ent=ENT.get(grp[0]['data'].split(';')[0].split(' ')[0].split('.')[0]) or {}
        return f"As a data steward, I want the entity '{ent.get('label') or grp[0]['data']}' stored with its {ent.get('nf','declared')} fields, classification {ent.get('cls')} and retention {ent.get('ret') or 'to be declared'} so that every screen reads one governed record."
    if th=='event':
        e=EVT.get((grp[0]['events'] or '').split(',')[0].split(' ')[0]) or {}
        return f"As a platform engineer, I want the event '{e.get('id') or grp[0]['events']}' registered with a typed payload and at least one reaction so that modules react without direct calls."
    if th=='process':
        p=PROC.get(grp[0]['proc'].split(',')[0]) or {}
        return f"As {article(role_for(epic_id,r))} {role_for(epic_id,r)}, I want the process '{p.get('name') or grp[0]['proc']}' to run with named owners, SLAs and decision rules so that work finishes inside its time and every decision is explainable."
    if th=='metricdef':
        m=MET.get(grp[0]['metric'].split(',')[0]) or {}
        return f"As a metric owner, I want '{m.get('n') or grp[0]['metric']}' defined with formula, target, lineage and remediation so that I can trust the number and know who answers for it."
    cap,out=cap_outcome()
    if th=='act': return f"As {article(role)} {role}, I want {cap} so that {out}."
    return f"As {article(role)} {role}, I want {cap} so that {out}."

def build_stories(total=300):
    # group rows
    groups=collections.OrderedDict()
    for r in ROWS:
        eid=r['epic'].split(' ')[0]
        th=theme(r)
        if eid.startswith('X'): gk=(eid,r['module'],'secure' if th=='secure' else 'x')
        elif eid[0]=='D' and r['module']=='DATA': gk=(eid,(r['data'] or r['module']).split(';')[0].split(' ')[0].split('.')[0],'entity')
        elif r['module']=='EVNT': gk=(eid,(r['events'] or 'event').split(',')[0].split(' ')[0],'event')
        elif th=='process' and r['proc']: gk=(eid,r['proc'].split(',')[0],'process')
        elif th=='metric' and r['metric']: gk=(eid,r['metric'].split(',')[0],'metricdef')
        else: gk=(eid,r['screen_id'] or r['module'],th)
        groups.setdefault(gk,[]).append(r)
    by_epic=collections.defaultdict(list)
    for gk,rows in groups.items(): by_epic[gk[0]].append((gk,rows))
    totalrows=sum(len(v) for g in by_epic.values() for _,v in g)
    stories=[]
    quota={}
    for e in EPIC_DEFS:
        n=sum(len(v) for _,v in by_epic.get(e['id'],[]))
        quota[e['id']]=min(len(by_epic.get(e['id'],[])),max(3,min(9,round(total*n/totalrows)))) if n else 0
    # adjust to roughly total
    diff=total-sum(quota.values())
    order=sorted(quota,key=lambda k:-len(by_epic.get(k,[])))
    i=0
    while diff!=0 and order and i<5000:
        k=order[i%len(order)]; i+=1
        if diff>0 and quota[k]<min(len(by_epic.get(k,[])),12): quota[k]+=1; diff-=1
        elif diff<0 and quota[k]>3: quota[k]-=1; diff+=1
    n=0
    for e in EPIC_DEFS:
        cands=by_epic.get(e['id'],[])
        # rank: best priority, then size
        cands.sort(key=lambda gv:(min(PRI_ORDER[x['pri']] for x in gv[1]),-len(gv[1])))
        # diversify themes: round-robin by screen
        picked=[];seen=set()
        for gk,rows in cands:
            if len(picked)>=quota[e['id']]: break
            if (gk[1],gk[2]) in seen: continue
            seen.add((gk[1],gk[2])); picked.append((gk,rows))
        for gk,rows in picked:
            n+=1
            th=gk[2] if gk[2]!='x' else 'ops'
            rows=sorted(rows,key=lambda x:PRI_ORDER[x['pri']])
            r0=rows[0]
            if e['id'].startswith('X'):
                scope=f"{len({x['screen_id'] for x in rows if x['screen_id']})} screens in module {gk[1]}"
                txt=f"As a platform user, I want {e['name'].lower()} applied to the {gk[1]} screens ({scope}) so that the experience is consistent and testable."
            else:
                txt=story_text(th,e['id'],r0,rows)
            ids=[x['id'] for x in rows]
            top=rows[:3]
            acs=[f"Satisfies {len(ids)} requirement(s): {', '.join(ids[:12])}{' and '+str(len(ids)-12)+' more' if len(ids)>12 else ''}."]
            for x in top:
                first=x['ac'].split('\n')[0]
                acs.append(f"{x['id']}: {first[3:] if first[:2].strip('0123456789.')=='' else first}")
            pts=3 if len(rows)<=3 else 5 if len(rows)<=8 else 8 if len(rows)<=20 else 13
            stories.append(dict(id=f"US-{n:03d}",epic=e['id']+' '+e['name'],text=txt,ac='\n'.join(f'{i+1}. {a}' for i,a in enumerate(acs)),reqs=ids,count=len(ids),pri=min((x['pri'] for x in rows),key=lambda p:PRI_ORDER[p]),pts=pts,screen=gk[1] if not e['id'].startswith('X') else '',theme=th))
    return stories
