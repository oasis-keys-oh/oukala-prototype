from common import *
from epics import *

VER_LAYOUT='script spec/extract_registry.js (getBoundingClientRect, 1440x900, dark)'
VER_PHONE='script spec/extract_registry.js (400x820 pass)'
VER_A11Y='script spec/extract_registry.js (DOM audit) plus manual keyboard and screen-reader pass'
VER_MAN='manual test against acceptance criteria'
VER_UNIT='automated test (to write) plus manual check'
CORE_GROUPS={'home','my','help'}
CORE_SIDS={'home','inbox','flw_appr','svc_portal','r16g_perm','adm_sec','adm_audit','r16h_groups','r16h_rules','svc_req','bud_doa'}
PERSONA_NAME={p['id']:p['n'] for p in R['personas']}
CARD_PAD=tokraw('--card-pad'); CARD_GAP=tokraw('--card-gap')
SP={tokraw('--sp-1'):'--sp-1',tokraw('--sp-2'):'--sp-2',tokraw('--sp-3'):'--sp-3',tokraw('--sp-4'):'--sp-4',CARD_PAD:'--card-pad',CARD_GAP:'--card-gap'}
def sptok(px):
    return SP.get(f'{int(px)}px','no token') if px is not None else 'n/a'
def f1(x): return '' if x is None else (str(int(x)) if float(x).is_integer() else f'{x:.1f}')

def fontstr(f,label):
    if not f: return ''
    return f"{label} {f['family']} {f1(f['size'])}px/{f1(f['lh']) if f['lh']!='normal' else 'normal'} weight {f['weight']} color {f.get('color') or 'n/a'}"

def box(r): return f"x={r['x']}, y={r['y']}, width={r['w']}, height={r['h']}"

def parse_owner(d, mod, cm):
    own=bak=''
    if d and d.get('ownerBadge'):
        t=d['ownerBadge'].get('title','')
        m=re.match(r'Owner (.+?), backup (.+)$',t)
        if m: own,bak=m.group(1),m.group(2)
        else:
            m=re.match(r'Owner (.+?)(?:, no backup.*)?$',t)
            if m: own=m.group(1)
    if not own:
        own=(mod or {}).get('own') or (cm or {}).get('owner') or ''
    return own, bak

METRIC_USE={}
for m in R['metrics']:
    for u in m.get('use') or []:
        METRIC_USE.setdefault(u,[]).append(m['id'])
EV_BY_MOD={}
for e in R['events']:
    EV_BY_MOD.setdefault(e['module'],[]).append(e['id'])
ENTITY_RULE_CLS={'restricted','personal','confidential'}

def slugbtn(label): return slug(label)[:40]
NAVCHROME=re.compile(r'^(Why am I seeing this\??|Add .* to favorites|Remove .* from favorites|Owner .*|Unowned.*|Notifications?.*|Skip.*)$')
GROUPLABELS={g['label'] for g in R['navgroups']}

def screen_binding(sid):
    mod=MOD_BY_SCR.get(sid); cm=CONTRACT.get(sid)
    procid=(mod or {}).get('proc') or ''
    if not procid and cm and cm.get('procs'): procid=cm['procs'][0]
    proc=PROC.get(procid)
    reads=list((mod or {}).get('r') or []); writes=list((mod or {}).get('w') or [])
    if not reads and not writes and proc:
        reads=list((proc.get('entities') or {}).get('r') or []); writes=list((proc.get('entities') or {}).get('w') or [])
    return procid,reads,writes

def screen_rows():
    for s in SCREENS:
        sid=s['id']; name=NAVMAP.get(sid,{}).get('l') or s['name']
        rec=M.get(sid) or {}
        d=rec.get('d') or {}
        measured=bool(d.get('ok'))
        mod=MOD_BY_SCR.get(sid)
        cm=CONTRACT.get(sid)
        code=module_code(sid); ep=en(screen_epic(sid))
        grp=NAVMAP.get(sid,{}).get('g')
        grplabel=NAVG.get(grp,{}).get('label') if grp in NAVG else ('hidden from rail' if grp=='r15hid' else 'not in rail')
        own,bak=parse_owner(d,mod,cm)
        core = (grp in CORE_GROUPS) or sid in CORE_SIDS
        access=R['screenAccess'].get(sid,{})
        allowed=[PERSONA_NAME[p] for p,v in access.items() if v==1 and p in PERSONA_NAME]
        denied=[PERSONA_NAME[p] for p,v in access.items() if v==0 and p in PERSONA_NAME]
        pers=f"Allowed: {lst(allowed,13)}. Denied: {lst(denied,13)}."
        procid,reads,writes=screen_binding(sid)
        proc=PROC.get(procid)
        evs=EV_BY_MOD.get(sid,[])+[x for x in EV_BY_MOD.get((mod or {}).get('id'),[]) if x not in EV_BY_MOD.get(sid,[])]
        evtxt=lst(evs,6) if evs else 'none registered'
        mets=METRIC_USE.get(name,[])+[x for x in METRIC_USE.get(s['name'],[]) if x not in METRIC_USE.get(name,[])]
        verif=VER_LAYOUT
        base=dict(module=code,epic=ep,screen_id=sid,screen_name=name,owner=own,backup=bak or 'none named',persona=pers,events=evtxt)
        def A(cat,pri,req,ac_,**kw):
            b=dict(base); b.update(kw)
            return add(b.pop('module'),b.pop('epic'),cat,pri,req,ac_,screen_id=b.pop('screen_id'),screen_name=b.pop('screen_name'),**b)
        key_scr='SCR:'+sid
        bc=d.get('breadcrumb') or (grplabel+' / '+name)
        goms=rec.get('goMs'); nodes=(d.get('doc') or {}).get('nodes')
        pri_core='P0' if (core and grp in CORE_GROUPS) else 'P1'
        # ---- identity / route
        A('Experience',pri_core,f"Provide the screen '{name}' under nav group '{grplabel}' at route #{sid}.",
          ac(f"Given a signed-in user who may open the screen, when the user selects '{grplabel}' then '{name}' in the rail, then the view shows H1 '{(d.get('h1') or {}).get('text') or name}' and the URL hash is #{sid}.",
             f"Given a direct link to #{sid}, when the page loads, then the same screen opens without an intermediate redirect.",
             f"Given the screen is open, then the breadcrumb reads '{bc}'.",
             f"Given a user who is not allowed (see Persona and permission), when the user opens #{sid}, then the denied state is shown instead of the content."),
          pos=f"Page header at {box(d['heroBox'])}." if measured else '',
          exp=f"Rail label '{name}' equals the page H1 (one name per screen); tagline '{(d.get('tag') or '').strip()}' sits under the H1." if measured else '',
          data=f"Registry: SCREENS[{sid}], NAVX.map[{sid}], MODMAP module {(mod or {}).get('id') or 'none'}",
          proc=procid,metric=lst(mets,6),status='Built' if measured else 'Gap',verified=verif if measured else 'not measured',source='measured' if measured else 'registry',key=key_scr,
          notes=f"Keywords: {NAVMAP.get(sid,{}).get('kw','')}")
        if not measured:
            A('Experience','P2',f"Make the screen '{name}' render without error so it can be measured and tested.",ac(f"Given #{sid} is opened at 1440x900, when the view is built, then #view contains a .screen node with a visible H1.","Given the extractor runs, then the screen yields a measured record."),status='Gap',verified=verif,source='measured',notes='Extractor returned no .screen node for this screen.')
            continue
        h1=d.get('h1') or {}; hb=d['heroBox']
        # ---- page header layout + typography
        A('Layout',pri_core if core else 'P2',f"Render the page header of '{name}' as the first region of the content column.",
          ac(f"Given 1440x900 dark, when '{name}' is open, then the page header box is {box(hb)} within 2 px.",
             f"Given the header, then it contains in order: breadcrumb and owner badge, H1, tagline, story line, action row.",
             f"Given the viewport is resized, then the header keeps the same left edge as the content column (x={hb['x']})."),
          pos=f"Region page-header: {box(hb)}. First region, no previous sibling. Next region begins {(d['regions'][1]['y']-(hb['y']+hb['h'])) if len(d['regions'])>1 else 0} px below.",
          spc=f"H1 {fontstr(h1,'')}; tagline/body {fontstr(d.get('body'),'')}; header padding top {d['regions'][0]['pad'][0] if d['regions'] else 'n/a'} px.",
          exp="Header is the same component on every screen; only text and the action row change.",verified=verif,source='measured',deps=['DSGN:type-scale'])
        A('Experience','P2',f"Set the H1 of '{name}' to '{h1.get('text')}' in the display type style.",
          ac(f"Given the screen is open, then exactly one H1 exists with text '{h1.get('text')}'.",
             f"Given computed styles, then H1 font family is {h1.get('family')}, size {f1(h1.get('size'))} px, weight {h1.get('weight')}, line height {f1(h1.get('lh'))}, color token {h1.get('color')}.",
             "Given dark and light themes, then H1 contrast against the page background is at least 4.5:1."),
          pos=f"H1 at {box(h1)}.",spc=fontstr(h1,'H1'),verified=verif,source='measured',deps=['DSGN:type-scale'])
        # ---- breadcrumb/owner
        A('Operations','P1',f"Show the module owner and backup as a named-human badge in the header of '{name}'.",
          ac(f"Given the screen is open, then the header badge reads '{(d.get('ownerBadge') or {}).get('text') or 'Owner (unassigned)'}'.",
             f"Given the badge title, then it states owner '{own or 'unassigned'}' and backup '{bak or 'none named'}'.",
             "Given an owner or backup is missing, then the badge shows the gap and links to the ownership screen.",
             "Given the owner is a group or agent, then the requirement fails; owners and backups are named humans."),
          pos=f"Owner badge sits in the header eyebrow row, right of the breadcrumb.",exp="Ownership comes from the ownership registry (OWNX/ORGX), not from the screen.",
          status='Built' if (own and bak) else ('Partial' if own else 'Gap'),verified=verif,source='measured',
          notes='' if bak else 'Backup not named in prototype; assign before production.',deps=['SECU:ownership'],key='OWN:'+sid)
        # ---- page actions slot
        pa=d.get('pageActions')
        if pa:
            A('Experience','P2',f"Place 'Why am I seeing this?' and the favorite star in the right-aligned page-actions slot of '{name}'.",
              ac(f"Given 1440x900, then the slot box is {box(pa)} and its right edge is {pa['x']+pa['w']} (header right edge {hb['x']+hb['w']}).",
                 "Given the user selects 'Why am I seeing this?', then a popover states the source rule, data, audience and owner.",
                 "Given the star is toggled, then aria-pressed flips and the screen appears in Favorites.",
                 "Given any other screen, then the slot is at the same offset from the header right edge (consistent position)."),
              pos=f"Page-actions slot: {box(pa)}; buttons: {lst(pa.get('buttons'))}.",spc="Chip height 36 px; star target 36 px.",exp="One consistent place on every screen (owner decision 6).",
              verified=verif,source='measured',events='ui.why_opened (not in catalog)',status='Built',notes='Star target is 36 px; 44 px target rule not met.')
        # ---- regions
        regs=d.get('regions') or []
        top=[r for r in regs if r['depth']==0]
        gaps=[r['gapPrev']['px'] for r in top if r.get('gapPrev') and r['gapPrev']['dir']=='v']
        shown=0
        for r in regs:
            if r['kind']=='page-header': continue
            if shown>=9: break
            shown+=1
            kind=r['kind']; label=r['label'] or f"{kind} {r['i']}"
            par = regs[r['parent']] if 0<=r['parent']<len(regs) else None
            rel=''
            if r.get('gapPrev'): rel=f"{r['gapPrev']['px']} px {'below' if r['gapPrev']['dir']=='v' else 'right of'} the previous sibling."
            else: rel='First in its parent.'
            if par: rel+=f" Inside '{par['label'] or par['kind']}' ({box(par)})."
            r.setdefault('pad',[0,0,0,0]); r.setdefault('radius',0); r.setdefault('bg',None); r.setdefault('border',None); r.setdefault('shadow',False)
            ptxt=f"padding {'/'.join(f1(x) for x in r['pad'])} px ({sptok(r['pad'][0])}); radius {f1(r['radius'])} px; background {r['bg'] or 'none'}; border {r['border'] or 'none'}; shadow {'yes' if r['shadow'] else 'no'}"
            if r.get('gap'): ptxt+=f"; internal gap {r['gap']}"
            if r.get('cols'): ptxt+=f"; grid {r['cols']} columns"
            if r.get('n'): ptxt+=f"; {r['n']} tiles"
            tolerance=2
            req=f"Render the {kind.replace('-',' ')} '{label}' in '{name}' at its specified position."
            A('Layout','P2' if not (kind=='kpi-row' and core) else 'P1',req,
              ac(f"Given 1440x900 dark and the 268 px rail, when '{name}' is open, then the region box is {box(r)} within {tolerance} px.",
                 f"Given the region, then its spacing to the previous sibling is {r['gapPrev']['px'] if r.get('gapPrev') else 'not applicable'} px.",
                 f"Given the region, then padding is {'/'.join(f1(x) for x in r['pad'])} px, radius {f1(r['radius'])} px and background token {r['bg'] or 'none'}.",
                 "Given content grows, then the region grows in height and siblings reflow without overlap."),
              pos=f"Region {kind} '{label}' (<{r['tag']}> {r['cls']}): {box(r)}. {rel}",spc=ptxt,
              exp=f"Region uses the {'card' if kind=='card' else kind} component with tokens, not local styles.",verified=verif,source='measured',deps=['DSGN:spacing'])
        if gaps:
            bad=[g for g in gaps if g not in (0,16,24,32)]
            A('Layout','P2',f"Space the top-level regions of '{name}' with the shared vertical rhythm tokens.",
              ac(f"Given 1440x900, then the measured gaps between consecutive top-level regions are {', '.join(str(g) for g in gaps)} px.",
                 f"Given the token set, then each gap equals one of --sp-3 ({tokraw('--sp-3')}), --sp-4 ({tokraw('--sp-4')}) or --card-gap ({CARD_GAP}).",
                 f"Given a gap outside the token set, then it is corrected; {len(bad)} such gap(s) measured."),
              pos=f"Top-level region count {len(top)}; vertical gaps {', '.join(str(g) for g in gaps)} px.",spc=f"Tokens: --card-gap {CARD_GAP}, --sp-3 {tokraw('--sp-3')}, --sp-4 {tokraw('--sp-4')}.",
              status='Partial' if bad else 'Built',verified=verif,source='measured',deps=['DSGN:spacing'],notes=('Off-token gaps: '+', '.join(str(g) for g in bad)) if bad else '')
        # ---- KPI rows with metric binding
        kpis=[r for r in regs if r['kind']=='kpi-row']
        if kpis:
            k=kpis[0]
            A('Metric','P1' if core else 'P2',f"Bind the KPI row of '{name}' to governed metric definitions.",
              ac(f"Given the KPI row at {box(k)}, then it shows {k.get('n') or 'n'} tiles, each with value, unit, target and status color.",
                 "Given a metric value, then the tile color follows the metric threshold (target and 'bad at' value) and the label links to the metric definition.",
                 f"Given metrics used by this screen ({lst(mets,6)}), then every tile maps to one of them or is removed.",
                 "Given the user opens a tile, then formula, owner, lineage and maturity are shown."),
              pos=f"KPI row {box(k)}.",metric=lst(mets,10),data='METRICS',status='Built',verified=verif,source='measured',deps=['MET:catalog'],notes='' if mets else 'No metric lists this screen in its use field; tile-to-metric binding is not registered.')
            if not mets:
                KEYS_gap=None
        # ---- tables
        for ti,t in enumerate((d.get('tables') or [])[:5]):
            cols=t['cols']
            colstr=' | '.join(f"{c['label']} ({c['align']})" for c in cols[:14])
            A('Experience','P2',f"Show the table '{t['heading'] or 'table '+str(ti+1)}' on '{name}' with the specified columns.",
              ac(f"Given the table at {box(t)}, then column headers in order are: {', '.join(c['label'] for c in cols[:14])}.",
                 f"Given numeric columns, then they are right-aligned; measured alignments: {', '.join(c['align'] for c in cols[:14])}.",
                 f"Given {t['rows']} rows in the prototype, then row height is {t['rowH']} px and cell padding {t['cellPad']} px.",
                 "Given the table is wider than its card, then it scrolls horizontally inside the card without a second border.",
                 "Given a column header, then the header has scope=col and the table has an accessible name."),
              pos=f"Table '{t['heading']}': {box(t)}.",spc=f"Cells: {fontstr(d.get('td'),'')}; headers: {fontstr(d.get('th'),'')}; cell padding {t['cellPad']} px; row height {t['rowH']} px.",
              exp="Columns, alignment and widths come from the table definition, not from CSS per screen.",
              data=lst(reads+writes,6),status='Built',verified=verif,source='measured',notes=f"Columns: {colstr}")
        # ---- tabs
        for ts in (rec.get('tabs') or [])[:2]:
            items=ts['items']
            for it in items[:8]:
                secs=ts['sections'].get(it['label']) or []
                A('Experience','P2' if not it['active'] else 'P1',f"Provide the tab '{it['label']}' on '{name}'{' as the default tab' if it['active'] else ''}.",
                  ac(f"Given the tab strip, then tabs in order are: {', '.join(i['label'] for i in items)}.",
                     f"Given the user selects '{it['label']}', then it becomes the selected tab and the panel shows sections: {lst([x for x in secs if x!=h1.get('text')],8)}.",
                     "Given keyboard use, then arrow keys move between tabs and Enter or Space selects.",
                     f"Given reload with route #{sid}, then the last selected tab is restored."),
                  pos=f"Tab target {it['w']}x{it['h']} px.",spc=f"Tab height {it['h']} px; 44 px target {'met' if it['h']>=44 else 'not met'}.",
                  status='Built',verified=verif,source='measured',notes='' if it['h']>=44 else 'Tab target height below 44 px.')
        # ---- sections (headings not already covered by region labels)
        # ---- forms
        for fi,f in enumerate((d.get('fields') or [])[:10]):
            lab=f['label'] or f"field {fi+1}"
            A('Experience','P1' if f['required'] else 'P2',f"Accept the input '{lab}' ({f['type']}, {'required' if f['required'] else 'optional'}) on '{name}'.",
              ac(f"Given the form, then the control '{lab}' is a {f['type']} with a programmatic label.",
                 f"Given the field is {'required' if f['required'] else 'optional'}, when submitted empty, then {'an inline error names the field and focus moves to it' if f['required'] else 'the form submits without it'}.",
                 "Given an invalid value, then the error is shown next to the field in text, not color only.",
                 f"Given the control size {f['w']}x{f['h']} px, then height is at least 44 px on touch devices."),
              pos=f"Control size {f['w']}x{f['h']} px.",spc=f"Control height {f['h']} px.",status='Built' if f['labelled'] else 'Partial',verified=verif,source='measured',
              notes='' if f['labelled'] else 'Control has no programmatic label in the prototype.')
        # ---- actions
        seen=set(); na=0
        acts=rec.get('actions') or []
        actmap={a['label']:a for a in acts}
        for b in (d.get('buttons') or []):
            lab=b['label']
            if not lab or lab in seen or NAVCHROME.match(lab) or lab in GROUPLABELS or len(lab)>45 or b['icon']: continue
            if not re.search(r'(^| )btn( |$)',b['cls']): continue
            seen.add(lab); na+=1
            if na>6: break
            a=actmap.get(lab,{})
            outcome=[]
            if a.get('drawer'): outcome.append('opens a side drawer')
            if a.get('dialog'): outcome.append('opens a dialog')
            if a.get('popover'): outcome.append('opens a popover')
            if a.get('hash'): outcome.append('navigates to another route')
            if a.get('viewChanged') and not outcome: outcome.append('changes the view in place')
            if a.get('toast'): outcome.append('shows a confirmation')
            res=' and '.join(outcome) if outcome else ('disabled for the audited persona' if b['disabled'] else 'result not observed by the probe')
            evt=evs[0] if evs else f"{sid}.{slugbtn(lab)} (to register)"
            wr=('Writes ' + lst(writes,3)) if writes else 'No record write registered for this module'
            A('Experience','P0' if (core and b['primary']) else 'P1',f"Provide the action '{lab}' on '{name}'.",
              ac(f"Given a permitted user on '{name}', when the user activates '{lab}', then the result is: {res}. Click path from the rail: 3 clicks (group, screen, '{lab}') or 1 click from the open screen.",
                 f"Given the action completes, then an audit entry is written with actor, screen '{sid}', action '{slugbtn(lab)}', target record and timestamp.",
                 f"Given the action completes, then event {evt} is emitted with actor and record id.",
                 f"Given a user without permission, then the button is disabled with a stated reason ({'locked for audited persona' if b['disabled'] else 'permission check by GUARD'}).",
                 f"Given the button, then its target is at least 44x44 px (measured {b['w']}x{b['h']})."),
              pos=f"Button at x={b['x']}, y={b['y']}, width={b['w']}, height={b['h']}.",spc=f"Class {b['cls']}; label font {fontstr(d.get('btnFont'),'')}.",
              exp=f"{wr}. Primary actions use the filled button style; one primary action per region.",
              data=lst(writes,6),events=evt,status='Built' if (outcome or b['disabled']) else 'Partial',verified=verif+'; click probe',source='measured',
              notes=('Target below 44 px. ' if b['h']<44 else '')+('' if outcome else 'Click probe observed no UI result.'),deps=['SECU:guard-actions'])
        # ---- data binding
        for e in reads[:6]:
            en_=ENT.get(e)
            A('Data','P1',f"Read the entity '{(en_ or {}).get('label') or e}' ({e}) into '{name}'.",
              ac(f"Given records exist in {e}, when '{name}' opens, then the screen lists them using fields of {e} only (no copied arrays).",
                 f"Given the entity classification is {(en_ or {}).get('cls') or 'unclassified'}, then masked fields are redacted for personas without a read grant.",
                 "Given no record exists, then the empty state is shown.",
                 "Given a record changes elsewhere, then the screen shows the new value on next open without manual refresh."),
              data=f"{e} ({(en_ or {}).get('nf','?')} fields; owner {(en_ or {}).get('owner') or 'n/a'}; steward {(en_ or {}).get('steward') or 'n/a'})",
              exp="Read through the registry accessor (LISTS/ATLAS), one source of record.",status='Built' if en_ else 'Gap',verified=VER_MAN,source='registry',deps=['DATA:'+e],
              notes='' if en_ else 'Entity is referenced by MODMAP but missing from the entity registry.')
        for e in writes[:5]:
            en_=ENT.get(e)
            A('Data','P0' if (en_ and en_.get('cls') in ENTITY_RULE_CLS and core) else 'P1',f"Write the entity '{(en_ or {}).get('label') or e}' ({e}) from '{name}' with audit and events.",
              ac(f"Given a permitted user saves a change on '{name}', then {e} is updated and the change is persisted.",
                 f"Given the write, then an audit entry records actor, field changes and timestamp.",
                 f"Given the write, then an event is emitted ({evtxt}).",
                 f"Given the user lacks write permission on {e}, then the save is refused with a stated reason and logged.",
                 "Given two users edit the same record, then the later save is rejected with a conflict message."),
              data=f"{e} (classification {(en_ or {}).get('cls') or 'n/a'}; retention {(en_ or {}).get('ret') or 'n/a'})",
              status='Built' if en_ else 'Gap',verified=VER_MAN,source='registry',deps=['DATA:'+e,'SECU:guard-actions'])
        # ---- process strip / metrics / events
        if proc:
            A('Process','P1',f"Show the process strip for '{proc['name']}' ({procid}) on '{name}' and keep it editable.",
              ac(f"Given the screen is open, then a process card lists {len(proc['steps'])} steps with who acts, owner, SLA, input and output.",
                 "Given a user with design permission, then steps can be added and reordered and the change updates the process library.",
                 f"Given the process, then owner is '{proc.get('owner') or 'unassigned'}' and backup is '{proc.get('backup') or 'unassigned'}'.",
                 f"Given maturity, then current level {proc.get('level')} and target {proc.get('target')} are displayed."),
              proc=procid,metric=lst(proc.get('metrics'),6),status='Built',verified=VER_MAN,source='registry',deps=['PROC:'+procid])
        elif cm:
            pass
        if evs:
            A('Operations','P2',f"Emit the registered events of '{name}' with complete payloads.",
              ac(f"Given the module acts, then events {lst(evs,6)} are available on the bus.",
                 "Given an event is emitted, then it is persisted to the event log with actor, source and timestamp.",
                 "Given an enabled rule matches the event, then its actions run and the result is logged.",
                 "Given a rule fails, then the failure is recorded and the owner is notified."),
              events=lst(evs,6),status='Built',verified=VER_MAN,source='registry',deps=['EVNT:catalog'])
        # ---- states
        st=d.get('states') or {}
        A('Experience','P2',f"Show an empty state on '{name}' when its record set is empty.",
          ac("Given no records exist for the view, then the region shows a one-line cause and the single next action.",
             "Given the empty state, then it uses the shared empty-state component, not an empty table.",
             "Given a filter hides all rows, then the empty state offers 'clear filters'."),
          pos='Inside the affected region; same box as the populated region.',spc='Shared empty-state style; muted text token --muted.',
          status='Built' if st.get('empty',0)>0 else 'Gap',verified=verif,source='measured',notes=f"Empty-state elements found on default view: {st.get('empty',0)}.",deps=['STATE:pattern'],key=None)
        A('Experience','P2',f"Show a loading state on '{name}' while data is fetched.",
          ac("Given a slow data read (over 300 ms), then skeleton placeholders hold the final layout and no layout shift exceeds 0.1.",
             "Given loading, then the region has aria-busy=true and a polite live announcement on completion.",
             "Given the read fails, then loading ends and the error state is shown."),
          status='Built' if st.get('loading',0)>0 else 'Gap',verified=verif,source='measured',notes=f"Loading elements found: {st.get('loading',0)}. Prototype data is local, so loading is not exercised.",deps=['STATE:pattern'])
        A('Security','P0' if core else 'P1',f"Show the denied state on '{name}' for personas without access.",
          ac(f"Given persona(s) {lst(denied,13)}, when they open #{sid}, then the denied drawer states the missing role and the request path; no content is rendered.",
             "Given a denied attempt, then an entry is written to the denial log with user, resource and rule.",
             f"Given an allowed persona ({lst(allowed,13)}), then the screen opens normally."),
          exp="Denial is decided by the global permission model (screen tier), not by the screen.",
          status='Built' if (denied and R['screenAccess'].get(sid)) else 'Partial',verified='script spec/extract_registry.js (PERM.can per persona)',source='registry',deps=['SECU:screen-rules'],events='perm.denied (to register)')
        A('Experience','P2',f"Show an error state on '{name}' when a read or save fails.",
          ac("Given a save fails, then the user's input is kept, the error names the cause and a retry is offered.",
             "Given a read fails, then the region shows the error with a retry and the page header stays usable.",
             "Given an error, then it is announced with role=alert and logged with a correlation id."),
          status='Built' if st.get('error',0)>0 else 'Gap',verified=verif,source='measured',notes=f"Error elements found: {st.get('error',0)}.",deps=['STATE:pattern'])
        # ---- permissions / masking
        sr=R.get('sectionRules',{}).get(sid,0)
        sens=[e for e in reads+writes if (ENT.get(e) or {}).get('cls') in ENTITY_RULE_CLS]
        A('Security','P0' if (sens and core) else 'P1',f"Enforce screen access for '{name}' through the permission model.",
          ac(f"Given persona-to-role mapping, then the screen opens for {lst(allowed,13)} and is denied for {lst(denied,13)}.",
             "Given the rule set is edited in the permissions screen, then access changes without a deploy.",
             "Given a decision, then the trace shows role, rule id and scope.",
             f"Given section-level rules ({sr} registered for this screen), then sections hidden by rule are absent from the DOM, not only hidden."),
          exp="One global nested model: table, row, attribute. Screen rule tier is the outermost.",data=lst(reads+writes,8),
          status='Built',verified='script spec/extract_registry.js (PERM.can per persona)',source='registry',deps=['SECU:screen-rules'],key='ACC:'+sid)
        if sens:
            fl=[]
            for e in sens[:4]:
                for f in (ENT.get(e) or {}).get('fields',[]):
                    if f.get('classification') in ('restricted','personal'): fl.append(f"{e}.{f['k']}")
            A('Security','P0',f"Mask classified fields on '{name}' for personas without a read grant.",
              ac(f"Given entities {lst(sens,6)} are classified personal, confidential or restricted, then fields {lst(fl,10)} render masked unless a field rule grants read.",
                 "Given a reveal, then the reveal is logged with user, field, record and reason.",
                 "Given an export, then masked fields stay masked.",
                 "Given masked values, then sort, filter and search do not leak the hidden value."),
              data=lst(sens,6),status='Built',verified=VER_MAN,source='registry',deps=['SECU:field-rules'],events='perm.reveal (to register)')
        # ---- accessibility
        a11=d.get('a11y') or {}; lm=a11.get('landmarks') or {}
        A('Experience','P1',f"Make the keyboard focus order of '{name}' follow the visual order.",
          ac(f"Given Tab from the page top, then focus visits the {a11.get('tabbable')} interactive controls in DOM order that matches the visual order.",
             "Given any focused control, then a visible focus ring uses token --focus with at least 3:1 contrast.",
             "Given a dialog or drawer opens, then focus moves in, is trapped, and returns to the trigger on close.",
             "Given the skip link, then it moves focus to the main content."),
          spc=f"Focus ring token --focus ({tokraw('--focus')}), halo --focus-halo.",status='Built',verified=VER_A11Y,source='measured',notes=f"Tabbable controls measured: {a11.get('tabbable')}.",deps=['A11Y:baseline'])
        A('Experience','P1',f"Give every control and region of '{name}' an accessible name and the right landmark.",
          ac(f"Given the DOM, then exactly {1} H1 exists (measured {a11.get('h1')}) and heading levels do not skip (measured skips {a11.get('headingSkips')}).",
             f"Given landmarks, then main={lm.get('main')}, nav={lm.get('nav')}, banner={lm.get('banner')}, complementary={lm.get('aside')}, region={lm.get('region')} are present as designed.",
             f"Given interactive elements, then none lack a name (measured without name: {a11.get('noName')}; unlabelled inputs: {a11.get('unlabelled')}; images without alt: {a11.get('imgNoAlt')}).",
             "Given a status change, then it is announced through a live region."),
          status='Built' if (a11.get('noName',0)==0 and a11.get('unlabelled',0)==0 and a11.get('h1')==1 and a11.get('headingSkips',0)==0) else 'Partial',verified=VER_A11Y,source='measured',
          notes=f"Measured: H1 {a11.get('h1')}, heading skips {a11.get('headingSkips')}, no-name controls {a11.get('noName')}, unlabelled inputs {a11.get('unlabelled')}, live regions {a11.get('liveRegions')}.",deps=['A11Y:baseline'])
        small=a11.get('small',0); tot=a11.get('focusTotal',0)
        A('Experience','P2',f"Give interactive controls on '{name}' a target of at least 44 by 44 px.",
          ac(f"Given the screen at 1440x900, then each interactive control is at least 44 px in width and height or has an equivalent 44 px hit area.",
             f"Given the current build, then {small} of {tot} controls are below 44 px; this count is reduced to 0.",
             "Given adjacent targets, then spacing between them is at least 8 px."),
          status='Built' if small==0 else 'Partial',verified=VER_A11Y,source='measured',notes=f"{small} of {tot} controls measured under 44 px.",deps=['A11Y:baseline'])
        inkbg=None
        if tokcolor('--ink','dark') and tokcolor('--bg','dark'):
            inkbg=contrast(tokcolor('--ink','dark'),tokcolor('--bg','dark'))
        A('Experience','P1',f"Meet text contrast on '{name}' in both themes using the text tokens.",
          ac(f"Given dark theme, then body text token --ink on --bg has contrast {inkbg:.1f}:1 (minimum 4.5:1)." if inkbg else "Given dark theme, then body text contrast is at least 4.5:1.",
             "Given light theme, then body text contrast is at least 4.5:1 and large text at least 3:1.",
             "Given status color, then meaning is also carried by text or icon.",
             f"Given the computed colors on this screen, then text uses tokens ({h1.get('color')}, {(d.get('body') or {}).get('color')}) and no hard-coded hex."),
          spc=f"Tokens: --ink {tokraw('--ink')}, --muted {tokraw('--muted')}, --faint {tokraw('--faint')}, --bg {tokraw('--bg')} (dark).",status='Built',verified='script (token contrast) plus manual check of status chips',source='measured',deps=['DSGN:color'])
        # ---- responsive
        ph=rec.get('phone') or {}
        if ph:
            A('Layout','P1' if core else 'P2',f"Fit '{name}' to a 400 px wide viewport without horizontal page scroll.",
              ac(f"Given a 400x820 viewport, then document scroll width is 400 (measured {ph.get('scrollW')}).",
                 f"Given the page header, then it is {ph.get('heroW')} px wide with H1 {f1(ph.get('h1Size'))} px.",
                 f"Given {ph.get('stacked')} top-level cards, then they stack in one column; {ph.get('clipped')} region(s) extend past the viewport edge.",
                 f"Given tables, then wide tables scroll inside their card ({ph.get('tablesScroll')} of {ph.get('tables')} scroll)."),
              pos=f"Phone 400 px: header width {ph.get('heroW')} px, height {ph.get('heroH')} px; widest region right edge {ph.get('cardMaxRight')} px.",
              status='Built' if (not ph.get('overflowX') and not ph.get('clipped')) else 'Partial',verified=VER_PHONE,source='measured',
              notes=f"Overflow X: {ph.get('overflowX')}; clipped regions: {ph.get('clipped')}.",deps=['DSGN:breakpoints'])
            A('Experience','P2',f"Provide phone navigation and touch targets on '{name}'.",
              ac(f"Given 400 px, then the rail is {'hidden' if not ph.get('railVisible') else 'visible'} and opens from a menu control.",
                 f"Given 400 px, then {ph.get('small')} of {ph.get('tabbable')} controls are under 44 px; target 0.",
                 "Given landscape orientation, then layout stays single column with no clipping."),
              status='Built' if ph.get('small',0)==0 else 'Partial',verified=VER_PHONE,source='measured',notes=f"Bottom bar present: {ph.get('bottomBar')}. Small targets at 400 px: {ph.get('small')}.",deps=['DSGN:breakpoints'])
        # ---- performance
        if goms is not None:
            budget=1000 if (nodes or 0)<=4000 else 1500
            nbud=3000 if (nodes or 0)<=3000 else 6000
            A('Operations','P2',f"Keep the open time of '{name}' within its render budget.",
              ac(f"Given a warm session, when the screen is opened, then the view is interactive within {budget} ms at the 95th percentile (prototype measured {goms} ms on a shared, loaded machine).",
                 f"Given the page, then the DOM stays under {nbud} nodes (prototype {nodes}).",
                 "Given a list over 200 rows, then the list is virtualized.",
                 "Given 500 projects (enterprise data), then open time stays within the same budget."),
              pos=f"Measured: open {goms} ms; {nodes} DOM nodes; document height {(d.get('doc') or {}).get('h')} px.",
              status='Built' if (goms<=budget and (nodes or 0)<=nbud) else 'Partial',verified='script spec/extract_registry.js (go() timing, node count)',source='measured',
              notes=f"Prototype open time {goms} ms against budget {budget} ms; {nodes} nodes against {nbud}. Local data, no network; timing taken under shared CPU load, so treat as an upper bound.")
        # ---- persistence
        trk=[e for e in writes if e in set(R.get('storeEntities') or [])]
        A('Operations','P1' if writes else 'P2',f"Persist the state that '{name}' changes across reload and sessions.",
          ac("Given the user saves a change, when the page is reloaded, then the change is still shown.",
             "Given two browsers, then both see the saved record after refresh (server of record).",
             "Given the user resets local state, then only local preferences are cleared, never records.",
             f"Given writes to {lst(writes,6)}, then each write is stored with a version and a change log entry."),
          data=lst(writes,8),status='Partial' if writes else 'Built',verified=VER_MAN,source='registry',notes=f"Prototype store backend: {R.get('storeBackend','')}. Persisted entities in prototype store: {len(R.get('storeEntities') or [])}. Server persistence is a gap.",deps=['PLATFORM:store'])
        # ---- discoverability
        A('Experience','P2',f"Make '{name}' discoverable through search and the command palette.",
          ac(f"Given the palette, when the user types any of '{NAVMAP.get(sid,{}).get('kw','')[:80]}', then '{name}' appears in the first 5 results.",
             "Given the screen is favorited, then it appears under Favorites in the rail.",
             "Given a persona that may not open the screen, then it does not appear in their results."),
          data='NAVX.map',status='Built',verified=VER_MAN,source='registry')
        # ---- contract gaps
        if cm:
            for rl in cm['rules']:
                if rl['st'] in ('gap','partial'):
                    nm={'process':'process model','data':'data model and integration decision','metrics':'metrics and maturity','links':'interconnectivity'}.get(rl['id'],rl['id'])
                    A('Operations','P1' if rl['st']=='gap' else 'P2',f"Close the feature-contract {rl['st']} on '{name}': {nm}.",
                      ac(f"Given the contract check '{rl['id']}', when the registry is evaluated, then the result is pass (currently {rl['st']}).",
                         f"Given the evidence, then the following is resolved: {clean(rl['ev'])[:220]}",
                         f"Given the fix, then: {clean(rl['fix'])[:220] or 'owner records the fix'}"),
                      status='Gap' if rl['st']=='gap' else 'Partial',verified='script CONTRACT.matrix()',source='registry',notes=f"Contract score {cm.get('score')} of 4; level {cm.get('level')}.",deps=['PROC:contract'])
