from common import *
# Known gaps from docs/*.md (curated) and findings from the extraction.
DOC_GAPS=[
 ('Runtime','Workflow execution is not durable: no timers, no waiting on human tasks, no retries or rollback of flow versions.','docs/AUDIT_FEATURES_R14.md section 3 and 5','P0','S24'),
 ('Runtime','Typed entity store with event log and hash-chained change log behind the entity registry is not a server store; prototype uses IndexedDB/localStorage.','docs/AUDIT_FEATURES_R14.md section 6 item 2; STORE backend','P0','D16'),
 ('Runtime','Shared record shell is incomplete: comments with mentions, attachments, tags, subscriptions, watchers and a common activity stream are not shared services.','docs/AUDIT_FEATURES_R14.md section 5','P1','S28'),
 ('Integration','Every integration (identity provider, M365, Jira-style, ERP, lab monitoring) is simulated; no bytes leave the page.','docs/AUDIT_FEATURES_R14.md section 3; docs/DEPLOYMENT_PATHS_R16.md','P0','I01'),
 ('AI','Every AI answer, generated article, agent action, token cost and quality score is simulated; no model adapter, trace or review queue exists.','docs/AUDIT_FEATURES_R14.md section 3 and 6 item 8','P0','AI01'),
 ('Security','Role enforcement was display-only at R14; R16 added a permission engine. Coverage of exports, search and chat for masked fields is not proven.','docs/AUDIT_FEATURES_R14.md section 3 (stale for screen access); registry R16G','P0','A01'),
 ('Security','Separation of duties is enforced for 5 guard actions; enforcement at every action time across modules is not proven.','GUARD.actions (sod flag)','P1','A01'),
 ('Persistence','Server persistence, multi-user conflict handling and backup/restore of state do not exist; reload resets non-tracked state.','docs/AUDIT_FEATURES_R14.md section 5 (Platform); STORE.tracked','P0','X06'),
 ('Observability','Observability data (metrics, logs, traces, synthetic checks), discovery runs, delivery logs and DORA numbers are generated.','docs/AUDIT_FEATURES_R14.md section 3','P1','S19'),
 ('ITOM','No ingest endpoint for events and metrics; no topology-based correlation tied to service maps; no CVE or SBOM content.','docs/AUDIT_FEATURES_R14.md section 5 (ITOM)','P1','S19'),
 ('ITSM','No inbound email or chat channel, no customer satisfaction survey capture, no problem proposals from incident clusters, no field service.','docs/AUDIT_FEATURES_R14.md section 5 (ITSM)','P1','S13'),
 ('PPM','No employee timesheets with actuals into project cost, no program-level dependencies, no Project/Jira import, no resource leveling with skills what-if.','docs/AUDIT_FEATURES_R14.md section 5 (PPM)','P1','S07'),
 ('Finance','GL account entity flagged missing; no actuals reconciliation to ERP, accruals or three-way match from requisition to receipt to invoice.','docs/AUDIT_FEATURES_R14.md section 5 (Finance)','P1','S12'),
 ('Identity','No SCIM-style joiner/mover/leaver, access-request catalog, certification campaigns that revoke, or just-in-time elevation with expiry.','docs/AUDIT_FEATURES_R14.md section 5 (Identity)','P1','S23'),
 ('Vendor','No supplier onboarding, risk assessment workflow, scorecards, sourcing events or renewal automation.','docs/AUDIT_FEATURES_R14.md section 5 (Vendor)','P2','S26'),
 ('GRC','Risk, policy attestation, control testing and findings exist in the prototype; no real evidence collection, framework mapping automation or audit engagement planning.','docs/AUDIT_FEATURES_R14.md section 5 (Risk and compliance)','P1','S26'),
 ('Analytics','No scheduled or subscribed reports, PDF/slide export, or semantic layer served to external BI; no data-quality rules on metrics.','docs/AUDIT_FEATURES_R14.md section 5 (Analytics)','P2','S30'),
 ('Notifications','No digest engine, delivery preferences honored by senders, or push.','docs/AUDIT_FEATURES_R14.md section 5 (Notifications)','P1','S03'),
 ('Mobile','No installable PWA with push and offline queue for approvals and on-call acknowledgement beyond the prototype shell.','docs/AUDIT_FEATURES_R14.md section 5 (Mobile); docs/pwa','P2','S31'),
 ('Platform','No tenant or environment export, snapshot import, accessibility statement or automated accessibility checks in CI, or data residency stance.','docs/AUDIT_FEATURES_R14.md section 5 (Platform)','P1','S29'),
 ('Deployment','Tenant provisioning, connector sync and deployment-model moves are simulated and labeled so in the prototype.','docs/DEPLOYMENT_PATHS_R16.md Prototype limits','P1','S29'),
 ('Scale','List adapter is simulated (50,000 rows in List registry tab); no server exists. Multi-select controls (about 60 sites) cap at 200 rows.','docs/SCALE_AUDIT_R16.md Honest gaps','P2','S28'),
 ('Scale','Master-detail lists (security people 11, CMDB classes 12, org team mix 22, service guides people 60) are not virtualized; 60-row people list needs it past about 200.','docs/SCALE_AUDIT_R16.md Honest gaps','P3','S28'),
 ('Scale','Open time is dominated by layout (about 9,000 DOM nodes, 100 to 350 ms reflow); load time must stay under 8 s.','docs/SCALE_AUDIT_R16.md; BRIEF_R16.md performance rule','P2','X04'),
 ('Design debt','Duplicate screens and process records remain: budgets (six pairs), platform maps (five), meetings (six entry points), process drawing (four tools), agent surfaces (four registries), approvals (four front doors), dashboards (four), risk registers (four), notifications (four).','docs/AUDIT_FEATURES_R14.md section 4','P2','S05'),
 ('Usability','Several screens had three names (rail label, headline, formal name); one name per screen is now the rule and is checked per screen.','docs/AUDIT_USABILITY_R14.md; docs/NAMES_R15.md','P3','S05'),
 ('Usability','Click-path tasks 4 to 12 were judged from inspection, not end-to-end; approve-and-next, incident resolve and process drawing flows were not clicked through.','docs/AUDIT_USABILITY_R14.md honest gaps','P2','X02'),
 ('Usability','Actor mismatch: the service catalog actor ("Myself") is Priya Shah and the ITSM actor is Tom Becker, which differ from the logged-in persona.','docs/CLICKPATH_R15.md Known gap','P2','S15'),
 ('Status labeling','Modules and entities marked proposed already have rich screens; users cannot tell a designed feature from a backed one unless live/proposed is labeled in the UI.','docs/AUDIT_FEATURES_R14.md section 3','P1','D16'),
 ('Accessibility','Status pills, AI chips and filled buttons were corrected for contrast at R14; a full automated and screen-reader audit has not been run on all 169 screens.','docs/UXUI_AUDIT_R14.md F-04','P1','X02'),
 ('Not tested','Drag and drop, full transactions (submit a request and watch fulfilment) and every tab of every screen were not exercised by earlier audits.','docs/AUDIT_PERSPECTIVES_R14.md honest gaps','P2','X02'),
]
def findings():
    out=[]
    ms=[ (sid,rec) for sid,rec in M.items() if (rec.get('d') or {}).get('ok')]
    nm=len(SCREENS)
    unm=[s['id'] for s in SCREENS if not (M.get(s['id'],{}).get('d') or {}).get('ok')]
    if unm: out.append(('Extraction',f"{len(unm)} screen(s) returned no measurable .screen node: {lst(unm,12)}.",'spec/extract_registry.js','P1','X02'))
    ov=[sid for sid,rec in ms if (rec.get('phone') or {}).get('overflowX')]
    if ov: out.append(('Responsive',f"{len(ov)} screens scroll horizontally at 400 px: {lst(ov,15)}.",'spec/extract_registry.js phone pass','P1','X03'))
    cl=[sid for sid,rec in ms if (rec.get('phone') or {}).get('clipped',0)>0]
    if cl: out.append(('Responsive',f"{len(cl)} screens have regions that extend past the 400 px viewport edge: {lst(cl,15)}.",'spec/extract_registry.js phone pass','P2','X03'))
    sm=sum((rec['d'].get('a11y') or {}).get('small',0) for sid,rec in ms); tt=sum((rec['d'].get('a11y') or {}).get('focusTotal',0) for sid,rec in ms)
    out.append(('Accessibility',f"{sm} of {tt} interactive controls measured across {len(ms)} screens at 1440x900 are under 44x44 px.",'spec/extract_registry.js DOM audit','P2','X02'))
    nn=[sid for sid,rec in ms if (rec['d'].get('a11y') or {}).get('noName',0)>0]
    if nn: out.append(('Accessibility',f"{len(nn)} screens have interactive controls without an accessible name: {lst(nn,15)}.",'spec/extract_registry.js DOM audit','P1','X02'))
    ul=[sid for sid,rec in ms if (rec['d'].get('a11y') or {}).get('unlabelled',0)>0]
    if ul: out.append(('Accessibility',f"{len(ul)} screens have form controls without a programmatic label: {lst(ul,15)}.",'spec/extract_registry.js DOM audit','P1','X02'))
    h1=[sid for sid,rec in ms if (rec['d'].get('a11y') or {}).get('h1')!=1]
    if h1: out.append(('Accessibility',f"{len(h1)} screens do not have exactly one H1: {lst(h1,15)}.",'spec/extract_registry.js DOM audit','P1','X02'))
    hs=[sid for sid,rec in ms if (rec['d'].get('a11y') or {}).get('headingSkips',0)>0]
    if hs: out.append(('Accessibility',f"{len(hs)} screens skip heading levels: {lst(hs,15)}.",'spec/extract_registry.js DOM audit','P2','X02'))
    for key,label in (('empty','empty-state'),('loading','loading-state'),('error','error-state')):
        z=[sid for sid,rec in ms if (rec['d'].get('states') or {}).get(key,0)==0]
        out.append(('States',f"{len(z)} of {len(ms)} screens show no {label} element on the default view.",'spec/extract_registry.js DOM audit','P2','X05'))
    nb=[s['id'] for s in SCREENS if (M.get(s['id'],{}).get('d') or {}).get('ok') and not (((M[s['id']]['d'].get('ownerBadge') or {}).get('title') or '').count('backup'))]
    out.append(('Ownership',f"{len(nb)} screens show an owner badge without a named backup in its title.",'spec/extract_registry.js','P1','X07'))
    pb=[p['id'] for p in R['processes'] if not p.get('backup')]
    out.append(('Ownership',f"{len(pb)} of {len(R['processes'])} processes have no named backup.",'PROCLIB registry','P1','P01'))
    bel=[p['id'] for p in R['processes'] if p.get('below')]
    out.append(('Maturity',f"{len(bel)} of {len(R['processes'])} processes are below their target maturity level.",'PROCLIB registry','P2','P01'))
    ns=sum(1 for p in R['processes'] for s in p['steps'] if not s.get('sla')); nst=sum(len(p['steps']) for p in R['processes'])
    out.append(('Process',f"{ns} of {nst} process steps have no SLA; {sum(1 for p in R['processes'] for s in p['steps'] if not s.get('owner'))} have no owner.",'PROCLIB registry','P1','P01'))
    mo=[m['id'] for m in R['metrics'] if m['id'] not in OWN_OF['metrics']]
    out.append(('Ownership',f"{len(mo)} of {len(R['metrics'])} metrics have no named person as owner in the ownership registry.",'ORGX.ownIndex','P1','M01'))
    pr=[e['id'] for e in R['entities'] if e['proposed']]
    out.append(('Data',f"{len(pr)} of {len(R['entities'])} entities are proposed, not live.",'PLAT.entities','P2','D16'))
    fu=sum(1 for e in R['entities'] for f in e['fields'] if not f.get('classification')); ft=sum(len(e['fields']) for e in R['entities'])
    out.append(('Data',f"{fu} of {ft} entity fields have no classification; {sum(1 for e in R['entities'] for f in e['fields'] if not f.get('authority'))} have no authority; {sum(1 for e in R['entities'] for f in e['fields'] if not f.get('type'))} have no type.",'PLAT.entities','P1','D16'))
    nr=[e['id'] for e in R['entities'] if not e.get('ret')]
    out.append(('Data',f"{len(nr)} entities declare no retention period.",'PLAT.entities','P1','D16'))
    du=R['entityStats'].get('dups')
    if du: out.append(('Data',f"{du} duplicate entities are flagged in the registry.",'PLAT.stats','P2','D16'))
    ev0=[e['id'] for e in R['events'] if not e.get('subscribers') and not e.get('enabledRules')]
    out.append(('Events',f"{len(ev0)} events have no subscriber or enabled rule.",'EVENTS.list','P2','EV01'))
    cs=R['contractStats']
    out.append(('Contract',f"{cs.get('openGaps')} open feature-contract gaps; {cs.get('fullContract')} of {cs.get('features')} features meet all four rules ({cs.get('fullPct')}%).",'CONTRACT.stats','P1','S28'))
    fix={'have':'has','do':'does','skip':'skips','show':'shows','extend':'extends','scroll':'scrolls','returned':'returned'}
    res=[]
    for a,b,c,d,e in out:
        if b.startswith('0 '): continue
        b=re.sub(r'\b1 screens (have|do|skip|show|extend|scroll)\b',lambda m:'1 screen '+fix[m.group(1)],b)
        res.append((a,b,c,d,e))
    return res
