from common import *
from epics import *
VER_PROC='script spec/extract_registry.js (PROCLIB.get) plus process walkthrough'
VER_MET='script spec/extract_registry.js (METRICS) plus calculation test'
VER_EVT='script spec/extract_registry.js (EVENTS.list) plus emit test'
DIMS=['defined','owned','measured','integrated','automated','governed']
DEC=re.compile(r'\b(decid|decision|route[sd]? by|routes|chooses|approv|threshold|if |when |rule|match(es|ed)?|escalat|triage)',re.I)

def proc_epic(p):
    m=p.get('module'); pid=p['id']
    if pid in SCR: return en(screen_epic(pid))
    if m in SCR: return en(screen_epic(m))
    mm=MOD_BY_SCR.get(m)
    if mm and mm.get('scr') in SCR: return en(screen_epic(mm['scr']))
    return en('P01')
def proc_module(p):
    pid=p['id']; m=p.get('module')
    sid=pid if pid in SCR else (m if m in SCR else ((MOD_BY_SCR.get(m) or {}).get('scr') if (MOD_BY_SCR.get(m) or {}).get('scr') in SCR else None))
    return module_code(sid) if sid else 'PROC', (sid or '')

SLA_RE=re.compile(r'instant|immediate',re.I)
def sla_ac(sla):
    if not sla: return None
    if SLA_RE.search(sla): return "completes in under 1 second without waiting for a person"
    return f"completes within {sla}; when the time is exceeded the step is flagged overdue"

def process_rows():
    for p in R['processes']:
        pid=p['id']; mod,sid=proc_module(p); ep=proc_epic(p); name=p.get('name') or p.get('title') or pid
        owner=p.get('owner') or ''; backup=p.get('backup') or ''
        lvl=p.get('level'); tgt=p.get('target'); below=p.get('below')
        dims=p.get('dims') or {}
        weakest=min(dims,key=lambda k:dims[k]) if dims else None
        steps=p.get('steps') or []
        sname=SCR.get(sid,{}).get('name','') if sid else ''
        base=dict(screen_id=sid,screen_name=sname,proc=pid,metric=lst(p.get('metrics'),8),owner=owner,backup=backup or 'none named',verified=VER_PROC,source='registry')
        pri='P1' if (p.get('named') and not below) else 'P1'
        add(mod,ep,'Process','P1',f"Run the process '{name}' ({pid}) with {len(steps)} steps, a named owner and a named backup.",
            ac(f"Given the process library, then '{pid}' lists {len(steps)} steps in order with who acts, owner, SLA, input and output.",
               f"Given the process, then owner is '{owner or 'unassigned'}' and backup is '{backup or 'unassigned'}', both named humans.",
               f"Given the trigger '{p.get('trigger') or 'declared by the owner'}', then a run starts and records its start time.",
               "Given a step list edit, then the change is versioned and needs the owner's approval."),
            exp=f"Family {p.get('familyName')}; standards {lst(p.get('std'),5)}; reads {lst((p.get('entities') or {}).get('r'),5)}; writes {lst((p.get('entities') or {}).get('w'),5)}.",
            data=f"reads {lst((p.get('entities') or {}).get('r'),6)}; writes {lst((p.get('entities') or {}).get('w'),6)}",
            status='Built' if (owner and backup and steps) else ('Partial' if steps else 'Gap'),key='PROC:'+pid,
            notes='' if backup else 'Backup not named in prototype.',**base)
        add(mod,ep,'Process','P1' if below else 'P2',f"Raise '{name}' from maturity level {lvl} to the target level {tgt}." if below else f"Hold '{name}' at maturity level {lvl} against target {tgt}.",
            ac(f"Given the six dimensions ({', '.join(f'{k} {dims.get(k)}' for k in DIMS if k in dims)}), then the level is the capped minimum rule result (current level {lvl}, target {tgt}).",
               f"Given the weakest dimension '{weakest}' ({dims.get(weakest)}), then an improvement action is listed with owner and date." if weakest else "Given the dimensions, then the weakest is listed.",
               "Given a re-assessment, then a history entry stores date, level, model, basis and assessor.",
               f"Given the model '{p.get('model')}', then the level scale and evidence rules of that model are shown."),
            exp=f"Assessment avg {(p.get('assessment') or {}).get('avg')}; raw {(p.get('assessment') or {}).get('raw')}; capped {(p.get('assessment') or {}).get('capped')}.",
            status='Partial' if below else 'Built',notes='Below target in prototype.' if below else '',deps=['PROC:'+pid],**base)
        for i,s in enumerate(steps,1):
            who=s['who']; sowner=s.get('owner') or ''; sla=s.get('sla')
            hum=who=='human'
            cat='AI' if who=='agent' else 'Process'
            stat='Built' if (hum and sowner and sla) else ('Simulated' if who=='agent' else ('Partial' if who=='auto' else 'Gap' if not sowner or not sla else 'Built'))
            if hum and (not sowner or not sla): stat='Gap'
            if who=='agent' and (not sowner or not sla): stat='Gap'
            acs=[f"Given input '{s.get('in') or 'not declared'}' is available, when step {i} starts, then the owner '{sowner or 'unassigned'}' is notified {'and the work item appears in their inbox' if hum else ''}.".replace(' .','.'),
                 f"Given the step is running, then it {sla_ac(sla) if sla else 'has no SLA; the owner defines one before go-live'}.",
                 f"Given the step completes, then output '{s.get('out') or 'not declared'}' is recorded and step {i+1 if i<len(steps) else 'end'} {'starts' if i<len(steps) else 'closes the run'}."]
            if who=='agent': acs.append("Given an agent performs the step, then output is labeled as AI draft with confidence and lineage, and a named human can reverse it.")
            if who=='auto': acs.append("Given the automation fails, then the run stops, the owner is alerted and the failure is logged.")
            if hum: acs.append("Given the assignee is absent, then the backup is assigned after the SLA warning point.")
            add(mod,ep,cat,'P1' if sla else 'P2',f"Step {i} of '{name}': {s['n']} ({who}).",
                ac(*acs),
                exp=clean(s.get('d'))[:400],data=f"in: {s.get('in') or 'n/a'}; out: {s.get('out') or 'n/a'}",
                persona=f"Performed by {who}; owner {sowner or 'unassigned'}",key=f'STEP:{pid}:{i}',
                status=stat,deps=['PROC:'+pid],notes=('' if sla and sowner else 'Missing: '+', '.join(x for x,v in (('SLA',sla),('owner',sowner)) if not v)),**base)
            if DEC.search(s.get('d') or '') or s.get('rule'):
                add(mod,ep,'Process','P1' if sla else 'P2',f"Decision rule in step {i} of '{name}': {s['n']}.",
                    ac(f"Given the rule text '{clean(s.get('rule') or s.get('d'))[:240]}', when the step evaluates, then the same inputs always give the same outcome (or the AI/human outcome is recorded with reason).",
                       "Given an outcome, then the rule id, inputs and result are stored in the run log.",
                       "Given a rule change, then it is tested against past runs before it is enabled.",
                       "Given an override, then the person, reason and time are recorded."),
                    exp='Decision logic is stored in a decision table or rule, not in code paths.',status='Built' if (hum or who=='auto') else 'Simulated',deps=['PROC:'+pid],**base)

def metric_rows():
    # reverse: process lookup by metric
    proc_of={}
    for p in R['processes']:
        for m in p.get('metrics') or []:
            proc_of.setdefault(m,[]).append(p)
    for m in R['metrics']:
        mid=m['id']; procs=proc_of.get(mid,[])
        p0=procs[0] if procs else None
        if p0: mod,sid=proc_module(p0); ep=proc_epic(p0)
        else:
            sid=''; mod='METR'; ep=en('M01')
            for u in m.get('use') or []:
                for s in SCREENS:
                    if (NAVMAP.get(s['id'],{}).get('l')==u) or s['name']==u: sid=s['id']; break
                if sid: break
            if sid: mod=module_code(sid); ep=en(screen_epic(sid))
        sname=SCR.get(sid,{}).get('name','') if sid else ''
        owner_p=OWN_OF['metrics'].get(mid)
        owner=owner_p or m.get('owner') or ''
        lvls=[p.get('level') for p in procs if p.get('level') is not None]
        dirtxt='higher is better' if m.get('dir')=='max' else 'lower is better'
        base=dict(screen_id=sid,screen_name=sname,metric=mid,proc=lst([p['id'] for p in procs],4) if procs else '',owner=owner,backup='not recorded in registry',verified=VER_MET,source='registry')
        tr=m.get('tr') or []
        add(mod,ep,'Metric','P1' if procs else 'P2',f"Define the metric '{m['n']}' ({mid}) in {m.get('u')}.",
            ac(f"Given the definition, then the formula is: {clean(m['f'])[:300]}.",
               f"Given unit '{m.get('u')}', target {m.get('tgt')}, bad-at threshold {m.get('badAt')} and direction '{dirtxt}', then status is good at or beyond target, bad at or beyond the threshold, otherwise warning.",
               f"Given the trend, then the last {len(tr)} periods are stored (prototype: {', '.join(str(x) for x in tr)}).",
               "Given a change to the formula, target or threshold, then it is versioned and approved by the owner."),
            exp=f"Used on: {lst(m.get('use'),6)}.",data=clean(m.get('src') or '')[:200],status='Built',key='MET:'+mid,
            notes=f"Prototype current value {m.get('cur')} {m.get('u')}.",**base)
        add(mod,ep,'Metric','P1' if procs else 'P2',f"Compute '{m['n']}' ({mid}) from its source data with lineage.",
            ac(f"Given source records, when the daily job runs, then the value equals the formula within rounding and is stored with calculation time.",
               f"Given the value, then lineage lists source entities and fields{(' ('+lst((p0.get('entities') or {}).get('r'),4)+')') if p0 else ''} and the process {lst([p['id'] for p in procs],3) if procs else 'not linked'}.",
               "Given a source record is missing or stale, then the metric shows 'incomplete' instead of a number.",
               f"Given maturity, then the linked process level{'s' if len(lvls)>1 else ''} {lst(lvls,4)} {'is' if len(lvls)==1 else 'are'} shown beside the metric."),
            data=lst((p0.get('entities') or {}).get('r'),6) if p0 else '',status='Simulated',deps=['MET:'+mid],
            notes='Prototype value is seeded or derived locally; production calculation is a gap.',**base)
        add(mod,ep,'Metric','P2',f"Assign the metric '{m['n']}' to a named owner and backup with breach alerts.",
            ac(f"Given the metric, then owner role is '{m.get('owner')}' and the accountable named human is {owner_p or 'not yet named'}.",
               "Given the value crosses the bad-at threshold, then the owner and backup are notified once per breach with the value and the remediation link.",
               "Given the owner leaves or changes status, then the metric is reassigned through the status-change process."),
            status='Built' if owner_p else 'Gap',notes='' if owner_p else 'No named person owns this metric in the ownership registry.',deps=['MET:'+mid],**base)
        rem=m.get('rem')
        if rem:
            add(mod,ep,'Operations','P2',f"Offer remediation '{rem.get('title')}' ({rem.get('ref')}) when '{m['n']}' is off target.",
                ac(f"Given the metric is bad or warning, then remediation {rem.get('kind')} {rem.get('ref')} '{rem.get('title')}' is offered to the owner.",
                   f"Given agent '{rem.get('agent')}' is {'allowed to run it automatically' if rem.get('auto') else 'set to suggest only'}, then the run {'starts without approval within its guardrails' if rem.get('auto') else 'waits for the owner to approve'}.",
                   "Given a run, then its progress, result and effect on the metric are recorded."),
                status='Simulated',notes=f"Prototype state: {rem.get('state')}.",deps=['MET:'+mid],**base)
        if m.get('use'):
            add(mod,ep,'Experience','P2',f"Show '{m['n']}' on {lst(m.get('use'),6)} with value, target, trend and a link to the definition.",
                ac(f"Given each screen in ({lst(m.get('use'),8)}), then a tile or row for {mid} is present.",
                   "Given the tile, then it shows value with unit, target, 8-period trend and status color with a text label.",
                   "Given the user opens the tile, then formula, owner, lineage and maturity are shown."),
                status='Built',deps=['MET:'+mid],**base)

def event_rows():
    rules_by={}
    for r in R['eventRules']: rules_by.setdefault(r['when'],[]).append(r)
    for e in R['events']:
        eid=e['id']; mod_sid=e['module'] if e['module'] in SCR else ''
        mod=module_code(mod_sid) if mod_sid else 'EVNT'; ep=en(screen_epic(mod_sid)) if mod_sid else en('EV01')
        sname=SCR.get(mod_sid,{}).get('name','') if mod_sid else ''
        flds=e.get('fields') or []
        base=dict(screen_id=mod_sid,screen_name=sname,events=eid,owner=e.get('owner') or '',backup='none named',verified=VER_EVT,source='registry')
        rs=rules_by.get(eid,[])
        add(mod,ep,'Operations','P1',f"Register the event '{eid}' ({e['label']}) with {len(flds)} payload fields.",
            ac(f"Given the catalog, then '{eid}' lists fields {', '.join(f['name']+':'+f['type'] for f in flds)}.",
               "Given an emit with a missing or mistyped field, then the emit is rejected and logged.",
               f"Given an emit, then the event log stores id, payload, source, actor and time, and {e.get('subscribers')} subscriber(s) are called.",
               f"Given the owner '{e.get('owner')}', then schema changes need the owner's approval."),
            exp=f"Module {e['module']}.",data=lst([f['name'] for f in flds],10),status='Built',key='EVNT:'+eid,**base)
        add(mod,ep,'Operations','P2',f"Cover '{eid}' with at least one enabled reaction.",
            ac(f"Given the event, then {e.get('rules')} rule(s) and {e.get('subscribers')} subscriber(s) react; at least one is enabled ({e.get('enabledRules')} enabled rules).",
               "Given no reaction exists, then the coverage report flags the event.",
               "Given a rule is disabled, then the report shows who disabled it and when."),
            status='Built' if (e.get('subscribers') or e.get('enabledRules')) else 'Gap',deps=['EVNT:'+eid],**base)
        for f in flds:
            add(mod,ep,'Data','P2',f"Carry field '{f['name']}' ({f['type']}) in the payload of '{eid}'.",
                ac(f"Given an emit of {eid}, then payload field {f['name']} is present and of type {f['type']}{(' referencing '+f['ref']) if f.get('ref') else ''}.",
                   "Given a reference field, then the id resolves to an existing record at emit time.",
                   "Given a replay of the log, then the field value is unchanged."),
                data=f"{eid}.{f['name']}:{f['type']}",status='Built',deps=['EVNT:'+eid],**base)
    for r in R['eventRules']:
        e=EVT.get(r['when']) or {}
        mod_sid=e.get('module') if e.get('module') in SCR else ''
        mod=module_code(mod_sid) if mod_sid else 'EVNT'; ep=en(screen_epic(mod_sid)) if mod_sid else en('EV01')
        acts='; '.join(clean(f"{a.get('action')} {a.get('target') or a.get('entity') or a.get('title') or ''}") for a in (r.get('then') or []))
        add(mod,ep,'Operations','P1',f"Run rule {r['id']} when '{r['when']}' occurs{(' and '+r['if']) if r.get('if') else ''}.",
            ac(f"Given event {r['when']} {('with condition '+r['if']) if r.get('if') else 'with no condition'}, then actions run in order: {acts}.",
               "Given the condition is false, then the rule is skipped and the skip is counted.",
               "Given an action fails, then later actions stop, the error is logged and the rule owner is notified.",
               f"Given the rule is disabled, then it does not run; it is {'enabled' if r.get('enabled') else 'disabled'} now."),
            screen_id=mod_sid,screen_name=SCR.get(mod_sid,{}).get('name',''),events=r['when'],owner=r.get('owner') or '',backup='none named',
            status='Built',verified=VER_EVT,source='registry',notes='Actions run in the prototype against local data only.',deps=['EVNT:'+r['when']])
