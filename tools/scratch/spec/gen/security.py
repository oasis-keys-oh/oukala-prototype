from common import *
from epics import *
VER_SEC='script spec/extract_registry.js (PERM, GUARD, APG, APPR registries) plus permission test matrix'
def subtxt(sub):
    if not sub: return 'any'
    parts=[]
    if sub.get('roles'): parts.append('roles '+', '.join(sub['roles']))
    if sub.get('users'): parts.append('users '+', '.join(sub['users']))
    if sub.get('groups'): parts.append('groups '+', '.join(sub['groups']))
    return '; '.join(parts) or json.dumps(sub)[:80]

def security_rows():
    ep=en('A01'); mod='SECU'
    # roles
    for r in R['roles']:
        personas=[p['n'] for p in R['personas'] if r['id'] in (R['personaRoles'].get(p['id']) or [])]
        add(mod,ep,'Security','P0',f"Define the role '{r['n']}' ({r['id']}) and bind it to its personas.",
            ac(f"Given the role registry, then '{r['id']}' exists with description: {clean(r['d'])}",
               f"Given personas {lst(personas,8)}, then each holds this role through the persona-role map.",
               f"Given the admin flag '{r.get('adm') or 'none'}', then {'admin screens open only with it' if r.get('adm') else 'no admin screen opens through this role'}.",
               "Given a role change, then the change is logged and takes effect at next request without deploy."),
            persona=lst(personas,8),owner='Platform administrator',backup='none named',status='Built',verified=VER_SEC,source='registry',key='SECU:role:'+r['id'])
    for p in R['personas']:
        roles=R['personaRoles'].get(p['id']) or []
        add(mod,ep,'Security','P1',f"Provide the persona '{p['n']}' ({p['id']}) with roles {lst(roles,5)} and a persona home.",
            ac(f"Given the persona, then it resolves to roles {lst(roles,5)} for every permission decision.",
               f"Given the persona home, then it shows rings {lst(p.get('rings'),4)} and nav {lst(p.get('nav'),8)}.",
               "Given persona switch (demo only), then it is disabled in production and replaced by the signed-in identity.",
               f"Given the description '{clean(p.get('who'))}', then it matches the people assigned."),
            persona=p['n'],status='Built',verified=VER_SEC,source='registry',notes='Persona switch is a prototype device.')
    # screen/section/other permission rules
    for r in R['permRules']:
        tier=r.get('tier') or 'other'
        res=r.get('res') or ''
        sid=res.split(':',1)[1].split('.')[0] if res.startswith('screen:') else ''
        sc=SCR.get(sid)
        if tier=='screen' and r.get('kind')=='seed':
            continue  # screen rules are covered by per-screen rows; summarised below
        add(mod,ep,'Security','P0' if r.get('effect')=='deny' or tier!='section' else 'P1',f"Apply permission rule {r['id']} '{r['name']}' ({r['effect']}) to {res}.",
            ac(f"Given a subject matching ({subtxt(r.get('sub'))}), when action {', '.join(r.get('act') or [])} is requested on {res}{(' where '+r['when']) if r.get('when') else ''}, then the decision is {r['effect']}.",
               f"Given the decision, then the trace shows rule {r['id']}, scope {tier} and the reason: {clean(r.get('why'))[:160]}.",
               f"Given the rule is {'enabled' if r.get('enabled') else 'disabled'}, then {'it applies' if r.get('enabled') else 'it is ignored'}; owner {r.get('owner')} reviews it at least yearly (last review {r.get('reviewed') or 'never'}).",
               "Given a deny and an allow match, then deny wins."),
            screen_id=sid,screen_name=sc['name'] if sc else '',persona=subtxt(r.get('sub')),owner=r.get('owner') or '',backup='none named',
            status='Built',verified=VER_SEC,source='registry',notes=f"Review state: {'never reviewed' if not r.get('reviewed') else r.get('reviewed')}.",deps=['SECU:screen-rules'])
    n_screen=len([r for r in R['permRules'] if (r.get('tier')=='screen' and r.get('kind')=='seed')])
    add(mod,ep,'Security','P0',"Maintain one screen-access rule per screen in the global permission model.",
        ac(f"Given the registry, then {n_screen} seeded screen rules exist and every one of the {len(SCREENS)} screens resolves to at least one allow or deny.",
           "Given a new screen is registered without a rule, then the feature-contract check fails.",
           "Given a rule edit, then the permissions screen shows who is affected before saving."),
        status='Built',verified=VER_SEC,source='registry',owner='Platform administrator',backup='none named',key='SECU:screen-rules')
    for r in R['fieldRules']:
        add(mod,ep,'Security','P0',f"Apply field rule {r['id']} '{r['name']}' to {r['entity']}.{r['field']} ({r['mode']}).",
            ac(f"Given subject ({subtxt(r.get('sub'))}), when {r['mode']} of {r['entity']}.{r['field']} is requested{(' where '+r['when']) if r.get('when') else ''}, then it is {'allowed' if r.get('effect')!='deny' else 'denied'}.",
               "Given no matching rule, then the field falls back to the entity classification default (masked for personal, restricted and confidential).",
               "Given a masked read that is revealed, then the reveal is logged with user, field, record and reason.",
               "Given the rule is edited, then the change is versioned and reviewed by the owner."),
            data=f"{r['entity']}.{r['field']}",persona=subtxt(r.get('sub')),owner=r.get('owner') or '',backup='none named',status='Built',verified=VER_SEC,source='registry',key='SECU:field-rules' if r['id']=='FR-001' else None,deps=['DATA:'+r['entity']])
    add(mod,ep,'Security','P0',"Apply attribute-level masking from field rules and classification everywhere a field is shown.",
        ac("Given a field with classification personal, confidential or restricted, then lists, detail views, exports, search and chat show it masked unless a field rule grants read.",
           "Given a reveal, then an audit entry is written.","Given sort or filter on a masked column, then no value is inferable from order or counts."),
        status='Partial',verified=VER_SEC,source='registry',owner='Platform administrator',backup='none named',notes='Prototype enforces masking on the audited screens; coverage across all exports is not proven.',key='SECU:field-rules-all')
    # guard actions
    for a in R['guardActions']:
        add(mod,ep,'Security','P0' if a['sod'] else 'P1',f"Guard the action '{a['id']}' ({a['n']}) with capability checks{' and separation of duties' if a['sod'] else ''}.",
            ac(f"Given a user, when action {a['id']} is invoked, then it requires all of {lst(a['all'],5)}{(' and any of '+lst(a['any'],5)) if a['any'] else ''}.",
               "Given the check fails, then the action is blocked, a reason is shown and the denial is logged.",
               "Given separation of duties applies, then the requester of the same record cannot approve it." if a['sod'] else "Given the action succeeds, then an audit entry is written.",
               "Given a grant is time-bound, then it expires and the action is blocked after expiry."),
            status='Built',verified=VER_SEC,source='registry',owner='Platform administrator',backup='none named',key='SECU:guard-actions' if a['id']=='approval.decide' else None,events='perm.denied (to register)')
    # approval groups
    ep2=en('A02')
    for g in R['approvalGroups']:
        q=g.get('quorum') or {}
        add('APPR',ep2,'Security','P0',f"Define the approver group '{g['name']}' ({g['id']}) with quorum {q.get('mode')} of {q.get('n')}.",
            ac(f"Given the group, then members are {lst(g.get('members'),8)} and delegates {lst(g.get('delegates'),5)}.",
               f"Given an approval routed to the group, then it is decided when quorum '{q.get('mode')}' ({q.get('n')}) is met; no approval routes to an individual.",
               f"Given scope {lst(g.get('scope'),8)}, then only these approval types route to the group.",
               "Given the group has fewer members than needed for quorum, then the group is flagged and the owner is notified."),
            persona=f"Members: {lst(g.get('members'),8)}",owner=g.get('owner') or '',backup=g.get('backup') or 'none named',
            status='Built',verified=VER_SEC,source='registry',notes=f"Kind {g.get('kind')}; description: {clean(g.get('desc'))}")
    for r in R['approvalRules']:
        lv=r.get('levels') or []
        add('APPR',ep2,'Process','P0',f"Route '{r['name']}' ({r['id']}) approvals through {len(lv)} level(s) to groups.",
            ac(*([f"Given an approval for {r['entity']}, then the levels run in order: "+'; '.join(f"{l['title']} to group {l['group']} ({l['mode']})" for l in lv)+'.',
              "Given a level skip condition is true, then the level is skipped and the skip is recorded."]+[f"Given level '{l['title']}', then SLA is {l.get('sla')} hours{(' and condition '+l['cond']) if l.get('cond') else ''}." for l in lv[:4]]+["Given a reject at any level, then the request stops or returns per the level setting and the requester is told why."])),
            data=r['entity'],owner=r.get('owner') or '',backup=r.get('backup') or 'none named',status='Built',verified=VER_SEC,source='registry',notes=clean(r.get('desc')))
    for t in R['doa']:
        add('APPR',ep2,'Security','P0',f"Require the {t['role']} for amounts {('up to '+format(t['max'],',')) if t.get('max') else 'above the previous tier'} (tier {t['id']}).",
            ac(f"Given an amount {('up to '+format(t['max'],',')+' ') if t.get('max') else 'above the previous tier '}, then the approving group includes the {t['role']}.",
               "Given an amount crosses a tier after edit, then the approval restarts at the higher tier.",
               "Given the tier table is edited, then the change needs finance and security approval."),
            status='Built',verified=VER_SEC,source='registry',owner='Finance approver group',backup='none named')
    for s in R['statuses']:
        add('APPR',ep2,'Process','P1',f"Provide the person status '{s['label']}' ({s['id']}) in the status-change process.",
            ac(f"Given a status change to '{s['label']}' (category {s['cat']}), then approval routes to group {s.get('group')}.",
               f"Given the status, then handover is '{s.get('handover')}', device handling is '{s.get('device')}' and rehire is {'allowed' if s.get('rehire') else 'not allowed'}.",
               f"Given the change is applied, then launches run: {lst(s.get('launches'),5)}.",
               "Given the person owns CIs, metrics or processes, then a handover task is created before the status takes effect."),
            status='Built',verified=VER_SEC,source='registry',owner='People operations',backup='none named',events='person.updated, person.terminated')
