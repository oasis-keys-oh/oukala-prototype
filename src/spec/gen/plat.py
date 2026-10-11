from common import *
from epics import *
VER_DS='script spec/extract_registry.js (:root variables, computed styles)'
VER_INT='script spec/extract_registry.js (FAB, R16M registries) plus integration test against a sandbox'
VER_AG='script spec/extract_registry.js (ORGX, AGENTS registries) plus agent test'
VER_BC='script spec/extract_registry.js (BCX registries) plus exercise record'
GROUPS=[('color-brand',re.compile(r'^--(p\d|w\d|e\d|s\d|u\d)$'),'Brand and status palette'),
        ('color-surface',re.compile(r'^--(bg|ink|muted|faint|glass2?|edge|hair|shade|cardline|accent.*|track|line-art|art-wash2?|orb\d|eb-mix|dis-ink|dis-bg)$'),'Surface, text and line colors'),
        ('color-status',re.compile(r'^--(good|warn|bad|metric|story)(-[fs])?$'),'Semantic status colors'),
        ('focus',re.compile(r'^--focus.*$'),'Focus ring'),
        ('type',re.compile(r'^--(fs-.*|fw-.*|f-.*)$'),'Type scale, weights and families'),
        ('space',re.compile(r'^--(sp-\d|card-pad|card-gap)$'),'Spacing'),
        ('radius',re.compile(r'^--r2?$'),'Radii'),
        ('layout',re.compile(r'^--(railw|tb-h|chxw|chx-left|art-side|art-drawer|art-hero|zs-.*|sb-.*)$'),'Layout dimensions'),
        ('motion',re.compile(r'^--ease$'),'Motion')]
def tgroup(n):
    for g,rx,lab in GROUPS:
        if rx.match(n): return g,lab
    return 'viz',None
def agg_measure():
    c=collections.Counter(); out={}
    h1=collections.Counter(); h3=collections.Counter(); td=collections.Counter(); btn=collections.Counter(); herox=collections.Counter(); pad=collections.Counter(); rad=collections.Counter(); paY=collections.Counter(); body=collections.Counter()
    n=0
    for sid,rec in M.items():
        d=rec.get('d') or {}
        if not d.get('ok'): continue
        n+=1
        f=d.get('h1'); 
        if f: h1[(f['family'],f['size'],f['weight'])]+=1
        f=d.get('h3')
        if f: h3[(f['family'],f['size'],f['weight'])]+=1
        f=d.get('td')
        if f: td[(f['family'],f['size'],f['weight'])]+=1
        f=d.get('btnFont')
        if f: btn[(f['family'],f['size'],f['weight'])]+=1
        f=d.get('body')
        if f: body[(f['family'],f['size'],f['weight'])]+=1
        hb=d.get('heroBox')
        if hb: herox[(hb['x'],hb['w'])]+=1
        for r in d.get('regions') or []:
            if r['kind']=='card':
                pad[r['pad'][0]]+=1; rad[r['radius']]+=1
                if r.get('gapPrev') and r['gapPrev']['dir']=='v' and r['depth']==0: paY[r['gapPrev']['px']]+=1
    return dict(n=n,h1=h1,h3=h3,td=td,btn=btn,herox=herox,pad=pad,rad=rad,gapY=paY,body=body)
def design_rows():
    ep=en('X01'); mod='DSGN'
    bg_d=tokcolor('--bg','dark'); bg_l=tokcolor('--bg','light')
    viz=collections.defaultdict(list)
    for n,v in TOK.items():
        g,lab=tgroup(n)
        d=v.get('dark',{}).get('raw'); l=v.get('light',{}).get('raw')
        if g=='viz':
            viz[re.sub(r'\d+$','',n)].append(n); continue
        acs=[f"Given the theme is dark, then {n} resolves to {d or 'unset'}.",f"Given the theme is light, then {n} resolves to {l or 'unset'}."]
        spc=f"dark {d}; light {l}"
        if g in ('color-surface','color-status') and (n in ('--ink','--muted','--faint','--accent-ink','--good-f','--warn-f','--bad-f','--metric-f','--story-f','--accent')):
            for th,bg in (('dark',bg_d),('light',bg_l)):
                c=tokcolor(n,th)
                if c and bg: acs.append(f"Given {th} theme, then {n} on --bg has contrast {contrast(c,bg):.2f}:1 (text minimum 4.5:1).")
        if g=='space': acs.append("Given a component uses this spacing, then it references the token, not a literal px value.")
        if g=='type': acs.append("Given text uses this value, then it references the token.")
        acs.append("Given the token is renamed or removed, then the build fails on any unresolved reference.")
        add(mod,ep,'Experience','P1' if n in ('--bg','--ink','--muted','--accent','--focus','--card-pad','--card-gap','--r','--fs-md') else 'P2',
            f"Define the design token {n} ({lab}).",ac(*acs),spc=spc,exp=f"Group {lab}.",status='Built',verified=VER_DS,source='measured',owner='Design system owner',backup='none named',key='DSGN:'+n)
    for pre,names in viz.items():
        add(mod,ep,'Experience','P3',f"Define the visualization palette {pre}* ({len(names)} tokens).",
            ac(f"Given the palette, then tokens {names[0]} to {names[-1]} exist in both themes.",
               "Given a chart or map uses the palette, then adjacent categories keep at least 3:1 contrast and meaning is not carried by color alone.",
               "Given a palette change, then charts in dark and light are reviewed."),
            spc='; '.join(f"{n}: {tokraw(n)}" for n in names[:6])+(' ...' if len(names)>6 else ''),status='Built',verified=VER_DS,source='measured',owner='Design system owner',backup='none named')
    a=agg_measure(); n=a['n']
    def top(c): 
        k,v=c.most_common(1)[0]; return k,v
    if n:
        k,v=top(a['h1']); 
        add(mod,ep,'Experience','P1',"Use one H1 style on every screen.",
            ac(f"Given 1440x900 dark, then H1 is {k[0]} {k[1]} px weight {k[2]} on {v} of {n} measured screens.",
               "Given a screen with a different H1 style, then it is corrected to the shared style.",f"Given the distribution of H1 styles, then exactly one style remains (measured styles: {len(a['h1'])})."),
            spc=f"H1 {k[0]} {k[1]}px weight {k[2]}",status='Built' if len(a['h1'])==1 else 'Partial',verified=VER_DS,source='measured',key='DSGN:type-scale',owner='Design system owner',backup='none named',notes=f"Style distribution: {dict((str(x),y) for x,y in a['h1'].items())}")
        k,v=top(a['h3'])
        add(mod,ep,'Experience','P2',"Use one section-heading (H3) style on every screen.",
            ac(f"Given 1440x900 dark, then H3 is {k[0]} {k[1]} px weight {k[2]} on {v} of {sum(a['h3'].values())} screens that have one.",
               f"Given distinct styles measured: {len(a['h3'])}, then only one remains."),
            spc=f"H3 {k[0]} {k[1]}px weight {k[2]}",status='Built' if len(a['h3'])==1 else 'Partial',verified=VER_DS,source='measured',owner='Design system owner',backup='none named',notes=f"Style distribution: {dict((str(x),y) for x,y in a['h3'].items())}")
        k,v=top(a['td'])
        add(mod,ep,'Experience','P2',"Use one table cell style on every table.",
            ac(f"Given tables, then cell text is {k[0]} {k[1]} px weight {k[2]} on {v} of {sum(a['td'].values())} screens with tables.",
               f"Given distinct cell styles measured: {len(a['td'])}, then only one remains."),spc=f"td {k[0]} {k[1]}px weight {k[2]}",status='Built' if len(a['td'])==1 else 'Partial',verified=VER_DS,source='measured',owner='Design system owner',backup='none named')
        k,v=top(a['btn'])
        add(mod,ep,'Experience','P2',"Use one button label style on every screen.",
            ac(f"Given buttons, then label text is {k[0]} {k[1]} px weight {k[2]} on {v} of {sum(a['btn'].values())} screens.",f"Given distinct styles measured: {len(a['btn'])}, then only one remains."),
            spc=f"button {k[0]} {k[1]}px weight {k[2]}",status='Built' if len(a['btn'])==1 else 'Partial',verified=VER_DS,source='measured',owner='Design system owner',backup='none named')
        (x,w),v=a['herox'].most_common(1)[0]
        add(mod,ep,'Layout','P1',"Start every page header at the same left edge and width.",
            ac(f"Given 1440x900 with the 268 px rail, then the page header starts at x={x} with width {w} on {v} of {n} screens.",
               f"Given screens with another position (measured distinct positions: {len(a['herox'])}), then they are corrected.",
               "Given a 1920 px viewport, then the content column keeps its maximum width and is centered or left-aligned consistently."),
            pos=f"Header x={x}, width={w}.",status='Built' if len(a['herox'])==1 else 'Partial',verified=VER_DS,source='measured',key='DSGN:spacing',owner='Design system owner',backup='none named',notes=f"Distinct header boxes: {dict((str(x),y) for x,y in a['herox'].most_common(6))}")
        k,v=top(a['pad'])
        add(mod,ep,'Layout','P1',"Pad every card with the card-padding token and round it with the radius token.",
            ac(f"Given cards, then padding is {k}px (token --card-pad {tokraw('--card-pad')}) on {v} of {sum(a['pad'].values())} measured cards.",
               f"Given radius, then the most common radius is {a['rad'].most_common(1)[0][0]}px (token --r {tokraw('--r')}) on {a['rad'].most_common(1)[0][1]} cards.",
               f"Given distinct padding values measured: {sorted(a['pad'])}, then only the token value remains."),
            spc=f"--card-pad {tokraw('--card-pad')}; --r {tokraw('--r')}; --r2 {tokraw('--r2')}",status='Partial' if len(a['pad'])>1 else 'Built',verified=VER_DS,source='measured',owner='Design system owner',backup='none named')
        gy=a['gapY']
        add(mod,ep,'Layout','P1',"Separate stacked top-level regions with the vertical rhythm tokens.",
            ac(f"Given top-level stacked cards, then the gap equals --card-gap ({tokraw('--card-gap')}), --sp-3 ({tokraw('--sp-3')}) or --sp-4 ({tokraw('--sp-4')}).",
               f"Given measured gaps {dict(gy.most_common(8))}, then values outside the token set are corrected.",
               "Given a dashboard-style screen, then KPI cards and the panels below are separated by a token gap, never zero."),
            spc=f"Tokens: {tokraw('--card-gap')}, {tokraw('--sp-3')}, {tokraw('--sp-4')}",status='Partial',verified=VER_DS,source='measured',notes=f"Measured vertical gap histogram (px: count): {dict(gy.most_common(10))}",key='DSGN:spacing-gaps',owner='Design system owner',backup='none named')
    add(mod,ep,'Experience','P1',"Switch between dark and light themes without layout change.",
        ac("Given the theme control or the system preference, then the theme changes and the choice is remembered.",
           "Given either theme, then all text tokens meet 4.5:1 against their surface.",
           "Given a theme switch, then no region changes size by more than 1 px."),
        status='Built',verified=VER_DS,source='measured',key='DSGN:color',owner='Design system owner',backup='none named')
    add(mod,ep,'Layout','P1',"Define the phone breakpoint at 400 px and the rail behavior below it.",
        ac("Given a 400 px viewport, then the rail is hidden behind a menu control and the content uses one column.",
           "Given 1440 px, then the rail is 268 px wide (token --railw).",
           "Given widths between, then no horizontal page scroll occurs at 400, 768, 1024 or 1440 px."),
        spc=f"--railw {tokraw('--railw')}",status='Partial',verified=VER_DS,source='measured',key='DSGN:breakpoints',owner='Design system owner',backup='none named',notes='Only 400 px and 1440 px were measured; tablet widths are unverified.')
    add(mod,ep,'Experience','P1',"Set the shared empty, loading, error and denied state pattern.",
        ac("Given a region without data, then it uses the empty-state component with one cause and one action.","Given loading, then skeletons hold the layout.","Given error, then role=alert text with a retry.","Given denied, then the denied drawer states the missing role."),
        status='Partial',verified=VER_MAN if False else 'manual test against acceptance criteria',source='measured',key='STATE:pattern',owner='Design system owner',backup='none named',notes='State counts per screen are in the screen rows.')
    add(mod,ep,'Experience','P1',"Meet the accessibility baseline in every shared component.",
        ac("Given any control, then it has an accessible name, a visible focus ring and a 44 px target.","Given any region, then landmarks and heading order are valid.","Given reduced-motion preference, then motion is removed."),
        status='Partial',verified='script spec/extract_registry.js (DOM audit) plus manual screen-reader pass',source='measured',key='A11Y:baseline',owner='Design system owner',backup='none named')

def integration_rows():
    ep=en('I01'); mod='INTG'
    for c in R['connectors']:
        ents=c.get('entities') or []
        for kind,req,acs in (
          ('auth',f"Authenticate the connector '{c['name']}' ({c['id']}) with least-privilege credentials.",[f"Given the connector, then credentials are stored in the secret store and never shown in the UI or logs.",f"Given tier '{c['tier']}', then only {c['tier']} connectors are installable in an environment that allows that tier.","Given a credential expires, then the connector turns unhealthy and the owner is alerted."]),
          ('map',f"Map {c.get('fields')} field(s) of '{c['name']}' to entities {lst(ents,6)} with authority and conflict rules.",[f"Given a source record, then it maps to entities {lst(ents,6)} through the mapping studio.","Given a field has external authority, then manual edits are blocked in the platform.","Given conflicting values, then the declared conflict rule decides and the loser is logged."]),
          ('run',f"Run and monitor syncs for '{c['name']}' with quarantine for invalid records.",[f"Given a scheduled or on-demand run, then it records read, valid, quarantined and loaded counts.","Given an invalid record, then it is quarantined with the reason and does not block valid records.","Given a failed run, then it is retried with backoff and the owner is alerted after the last retry."])):
            add(mod,ep,'Integration','P1' if c['tier']=='certified' else 'P2',req,ac(*acs),data=lst(ents,8),owner=c.get('owner') or '',backup='none named',
                status='Simulated',verified=VER_INT,source='registry',notes=f"Prototype status {c.get('status')}; no bytes leave the page.",key='INTG:'+c['id'] if kind=='auth' else None)
    for e in R['editions']:
        add(mod,ep,'Integration','P2',f"Offer the edition '{e['n']}' with {e['conn']} connector(s) and {e['env']} environment(s).",
            ac(f"Given edition {e['n']}, then up to {e['conn']} connectors and {e['env']} environments can be active.","Given the limit is reached, then adding another is blocked with an upgrade message.",f"Given the edition note: {clean(e['note'])}."),
            status='Partial',verified=VER_INT,source='registry',owner='Platform owner',backup='none named',notes='Limits are displayed in the prototype; enforcement is a gap.')
    for d in R['deployments']:
        add(mod,ep,'Operations','P2',f"Support the deployment model '{d['n']}'.",
            ac(f"Given deployment model {d['short']}, then tenant data, keys and backups are isolated as the model states.","Given a move between models, then the tenant is restored into the new stack from backup with no data loss.","Given a tenant, then edition, region and brand are recorded."),
            status='Gap',verified='manual review against docs/DEPLOYMENT_PATHS_R16.md',source='docs',owner='Platform owner',backup='none named',notes='Provisioning is simulated in the prototype.')
    ep2=en('I02')
    for t in R['importers']:
        add('IMPT',ep2,'Integration','P1',f"Import {t['n']} from {t['file']} into entity {t['ent']} in load order {t['order']}.",
            ac(f"Given file {t['file']} with key {t['key']}, then rows are validated, mapped and loaded into {t['ent']}.",
               f"Given dependencies {lst(t.get('dep'),5)}, then the import is blocked until they are loaded.",
               "Given an invalid row, then it is rejected with row number, column and reason, and valid rows proceed on confirmation.",
               "Given a re-import with the same keys, then rows update, not duplicate."),
            data=t['ent'],status='Partial',verified=VER_INT,source='registry',owner='Platform owner',backup='none named',notes=clean(t.get('desc')),key='IMPT:'+t['id'])
        for c in t['cols']:
            add('IMPT',ep2,'Data','P2',f"Accept column '{c['label']}' ({c['k']}, {c['type']}{', required' if c['req'] else ''}) in {t['file']}.",
                ac(f"Given the column, then it is {'required: an empty value rejects the row' if c['req'] else 'optional'}.",
                   f"Given type {c['type']}{(' and reference '+c['ref']) if c.get('ref') else ''}, then values are parsed and validated before load.",
                   f"Given classification {c.get('cls') or 'default'}, then the import audit hides the value." if c.get('cls') in ('restricted','personal','confidential') else "Given a synonym header, then it maps to this column on the mapping step."),
                data=f"{t['ent']}.{c['k']}",status='Partial',verified=VER_INT,source='registry',owner='Platform owner',backup='none named',deps=['IMPT:'+t['id']])
    ep3=en('AI02')
    for t in R['mcpTools']:
        add('AGNT',ep3,'AI','P2',f"Expose the MCP tool '{t['n']}' ({'write' if t['write'] else 'read only'}).",
            ac(f"Given the tool, then its input schema requires {lst(t.get('required'),5)}.",
               "Given a call by an agent, then the tool is gated by the agent autonomy level and the caller's permissions.",
               "Given a write tool, then every call is logged and needs approval at the 'approve' autonomy level." if t['write'] else "Given a read tool, then results exclude fields the caller may not read.",
               f"Given the description: {clean(t['d'])}"),
            status='Simulated',verified=VER_AG,source='registry',owner='Platform owner',backup='none named',notes='Catalog and previews exist; no server listens.')
    for g in R['gateChecks']:
        add('AGNT',ep3,'AI','P2',f"Gate citizen apps with the check '{g['n']}' at tier {g['t']}.",
            ac(f"Given an app manifest, then the check passes only if: {clean(g['rule'])}",
               "Given a failed check, then the app cannot register without an exception that has a reason, owner and expiry of 90 days at most.",
               f"Given tier {g['t']}, then this check applies to {g['t']} and higher tiers."),
            status='Built',verified=VER_AG,source='registry',owner='Platform owner',backup='none named')

def agent_rows():
    ep=en('AI01'); mod='AGNT'
    for lid,l in (R['agentLevels'] or {}).items():
        add(mod,ep,'AI','P0',f"Provide the autonomy level '{l['n']}' for agents.",
            ac(f"Given an agent at level '{l['n']}', then it {'only proposes; every action needs a person' if lid=='suggest' else 'prepares actions that a named human approves' if lid=='approval' else 'acts alone inside its guardrails and logs every action'}.",
               "Given a level change, then the sponsor approves it and the change is audited.",
               "Given the kill switch, then the agent stops at once at any level."),
            status='Built',verified=VER_AG,source='registry',owner='AI governance',backup='none named')
    for a in R['agents']:
        add(mod,ep,'AI','P1',f"Register the agent '{a['name']}' with sponsor {a['sponsor']} at autonomy '{a['autonomy']}'.",
            ac(f"Given the registry, then the agent lists sponsor {a['sponsor']}, model {a['model']}, tools {lst(a.get('tools'),6)} and data scope {lst(a.get('data'),6)}.",
               f"Given the guards ({lst(a.get('guards'),4)}), then each is enforced and a violation stops the run.",
               f"Given kill switch scope '{a.get('kill')}', then it stops the agent within 5 seconds.",
               "Given evaluation data (accept rate, error rate, escalation rate), then the registry shows the last 30 days."),
            owner=a['sponsor'],backup='none named',status='Simulated',verified=VER_AG,source='registry',notes=f"Does: {clean(a.get('does'))}. Eval in prototype: {a.get('eval')}",key='AGNT:'+a['id'])
        for gd in (a.get('guards') or [])[:4]:
            add(mod,ep,'AI','P1',f"Enforce the guard '{gd}' for agent '{a['name']}'.",
                ac(f"Given a run of {a['name']}, when the guard '{gd}' would be violated, then the action is blocked and logged.","Given a block, then the sponsor is notified.","Given the guard text changes, then the sponsor approves."),
                owner=a['sponsor'],backup='none named',status='Simulated',verified=VER_AG,source='registry',deps=['AGNT:'+a['id']])
    for a in R['agentsPlatform']:
        add(mod,en('AI01'),'AI','P2',f"Cap the spend of the platform agent '{a['n']}' at {a.get('cap$')} per day.",
            ac(f"Given spend reaches the daily cap of {a.get('cap$')}, then new runs are refused until the next day.",f"Given provider {a['prov']} and model {a['model']}, then calls go through the gateway.","Given a cap change, then AI governance approves."),
            owner=a['owner'],backup='none named',status='Simulated',verified=VER_AG,source='registry',notes=f"Autonomy {a['auto']}; kind {a['kind']}.")

def bcdr_rows():
    ep=en('R01'); mod='RES'
    for p in R['bcdrPlans']:
        add(mod,ep,'Operations','P0' if p['tier']==1 else 'P1',f"Hold the plan '{p['n']}' ({p['id']}) for scope {p['scope']} at tier {p['tier']}.",
            ac(f"Given the plan, then status is {p['status']} with owner {p['own']} and backup {p['bak']}.",
               f"Given review cadence of {p['cadence']} months, then a review task appears before the next review date (last review {p['lastReview']}).",
               f"Given targets, then RTO {p.get('rtoT')} and RPO {p.get('rpoT')} are recorded.",
               f"Given {p['nver']} version(s), then each stores version, date, author and change."),
            owner=p['own'],backup=p['bak'],status='Built',verified=VER_BC,source='registry',notes=f"Group {p['grp']}; kind {p['kind']}.")
    for x in R['bcdrExercises']:
        add(mod,ep,'Operations','P1',f"Record the {x['type']} exercise {x['id']} for plan {x['planId']} on {x['date']}.",
            ac(f"Given the exercise, then status is {x['status']} with facilitator {x['fac']} and backup {x['fbak']}.",
               f"Given results, then measured RTO {x.get('rto')} and RPO {x.get('rpo')} are compared with plan targets.",
               "Given a finding, then it becomes a tracked action with owner and due date."),
            owner=x['fac'],backup=x['fbak'],status='Built',verified=VER_BC,source='registry')
    for dim,n in sorted(R['bcdrComps'].items()):
        add(mod,ep,'Operations','P2',f"Maintain the {n} continuity components of dimension '{dim}' with owner and backup each.",
            ac(f"Given dimension {dim}, then each of {n} components has an owner and backup.","Given a component has no owner, then it appears in the gap list.","Given a component changes, then dependent plans are flagged for review."),
            status='Built',verified=VER_BC,source='registry',owner='Resilience lead',backup='none named')
