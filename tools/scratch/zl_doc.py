import json,os,collections
b=json.load(open('scr/before.json'));a=json.load(open('scr/after.json'))
def load(p): return json.load(open(p)) if os.path.exists(p) else None
wb,wa=load('scr/walk_b.json'),load('scr/walk_a.json')
common=None
if wb and wa:
    sb=set(l['screen'] for l in wb['log']);sa=set(l['screen'] for l in wa['log']);common=sb&sa
def wsum(w):
    def nv(l):
        v=l.get('verdict')
        if v=='mismatch' and l.get('key','').startswith('data-go=') and ':' in l['key'] and l.get('landed')==l['key'].split('=',1)[1].split(':')[0]: return 'ok'
        return v
    L=[dict(l,verdict=nv(l)) for l in w['log'] if l['screen'] in common and l.get('verdict') not in ('harness','lost')]
    c=collections.Counter(l['verdict'] for l in L);return len(L),len([l for l in L if l['verdict']!='ok']),c
names=a['names']
area=lambda i:('Data' if i.startswith('d_') else 'Process' if i[:2] in('p_','m_') else 'Workflow' if i.startswith('w_') else 'Platform' if i.startswith('k_') else 'Search and chat' if i[:2] in('s_','c_') else 'Approvals' if i[:2] in('a_','n_') else 'Interoperability' if i.startswith('i_') else 'Links and people')
C=a['checks'];Tt=a['totals']
rows=[]
for k in a['checks']:
    bb=b['checks'].get(k);aa=a['checks'][k]
    if (bb or 0)==0 and aa==0: continue
    rows.append((area(k),names[k],a['totals'][k],bb if bb is not None else 'new',aa))
rows.sort(key=lambda r:(r[0],-(r[4] if isinstance(r[4],int) else 0)))
T=[]
T.append("# Connectivity audit, Round 14\n")
T.append("Owner: Connectivity Auditor. Screen: Platform, Connections and gaps (`zl_conn`). Code: `mod_zlink.js`, `mod_zlink.css` (load last). Harness: `zl_walk.js` (links), `zl_measure.js` (counts), `zl_func.js` (functional test). Baseline: `out_v13/full.html`; result: `out_g14/full.html`.\n")
T.append("## Before and after\n")
T.append(f"| Measure | Baseline v13 | Round 14 build |\n|---|---|---|\n| Connectivity score (mean share of records that connect, 0 to 100) | {b['score']} | {a['score']} |\n| Findings across all checks | {b['findings']} | {a['findings']} |\n| Cross-module references that do not resolve | {b['dead']} of {b['deadTotal']} | {a['dead']} of {a['deadTotal']} |\n| Invoice decision consumers updated (of 10) | {sum(1 for x in b['ip'] if x.endswith('true'))} | {sum(1 for x in a['ip'] if x.endswith('true'))} |")
sb=load('scr/scan_b.json');sa=load('scr/scan_a.json')
if sb and sa: T.append(f"| Chips and drill links whose target does not exist (static scan, every screen) | {len(sb['dead'])} of {sb['chips']} | {len(sa['dead'])} of {sa['chips']} |")
if common:
    nb,bb_,cb=wsum(wb);na,ba_,ca=wsum(wa)
    T.append(f"| Chips and drill links that dead-end or mislead (walker, {len(common)} screens, up to 8 links each) | {bb_} of {nb} | {ba_} of {na} |")
T.append("\nBaseline and result totals differ slightly because other agents added entities, processes, workflows and metrics to the shared source during the round; every check uses the same code in both runs (baseline runs the module with fixes switched off).\n")
T.append("## Checks that changed or remain open\n\n| Area | Check | Checked | Before | After |\n|---|---|---|---|---|")
for r in rows: T.append("| %s | %s | %s | %s | %s |"%r)
T.append("\n## Link walker\n")
if common:
    T.append(f"`zl_walk.js` visits each screen, collects linked-record chips and drill links (data-go, data-person, data-rec, data-lr-go and every data attribute named go, open, goto, drill, jump or link; destructive names excluded), clicks one of each kind round-robin up to 8 per screen, and checks the destination: something changed, the drawer or screen has content, no error text, and the destination shows the record id or person name that the chip named. Screens covered in both runs: {len(common)}.\n")
    T.append(f"Before: {bb_} of {nb} flagged ({dict(cb)}). After: {ba_} of {na} flagged ({dict(ca)}). Links of the form `data-go=\"screen:record\"` (about 100 of them, the Open in Metrics chips) are counted as passing when the screen is right; the record argument is handled by `go()` and was not separately verified. The one `badtext` is a person drawer whose delivery log legitimately contains the words not found. Clicks that lost their element after a re-render are dropped as harness noise. The walker found no dead-end among the links it clicked; the dead chips came from the static scan, which reads every chip.\n\nStatic scan (`zl_scan.js`): baseline {len(sb['dead'])} chips whose target does not exist, now {len(sa['dead'])}. The baseline ones were person chips that name a role (Chief Editor on 7 screens, the CEO) and opened nothing. A wrapper on `who()` and `person360()` now resolves a role to the person who holds it. Still open: a chip for the team name Platform team on plat_fab.\n")
    bad=[l for l in wa['log'] if l['screen'] in common and l['verdict'] not in('ok','harness','lost','mismatch')][:25]
    if bad:
        T.append("Remaining flagged links (after):\n\n| Screen | Link | Result | Why |\n|---|---|---|---|")
        for l in bad: T.append("| %s | %s | %s | %s |"%(l['screen'],(l.get('txt') or l['key'])[:50].replace('|','/'),l['verdict'],l.get('why','')[:80].replace('|','/')))
else:
    T.append("Walker results not available.")
T.append("\n## What was fixed (registration APIs, all in mod_zlink.js)\n")
for l in a['log']: T.append("- "+l)
T.append(f"""
Also added: a **Connected records** panel at the foot of record and person drawers (reverse links from the relation graph, grouped with `lrHTML`); the **Connections and gaps** screen (Overview, Gaps by check, Dead links, Orphans, Event fan-out, Fixes and resolvers, Metrics); metrics `m_zl_score`, `m_zl_dead`, `m_zl_fanout`, `m_zl_orphans`; process `connectivity_audit` (CMMI maturity record), entity `connectivity_finding` (new, thin; near duplicate `contract_finding` documented), module `zl_conn` with flows in and out, SEARCHX groups and ASKX intents; Feature contract score for `zl_conn`: 4 of 4. Owner Rina Okafor, backup Jordan Lee.

### Invoice decision fan-out (interoperability)
Baseline: approving an invoice recorded the decision, wrote one audit line, bumped the override metric when the human disagreed, and removed the item from the inbox. It did not touch the PO, contract milestone, budget line actuals, forecast to complete, reserve, project paid-to-date, vendor record or any notification. Now an `invoice.decided` event (hooked on the audit call the invoice screen already makes, so no shared file was edited) updates PO paid, the contract milestone, line actuals, project paid, vendor last decision, evaluates a reserve draw, sends a notice, and writes one audit line listing the consumers. Undo on the invoice reverses every effect. The test in Event fan-out approves INV-20433 through the real handler in a sandbox and restores state.

## What was not fixed, and why (needs a person or a shared-file owner)
- Owners and backups: {C['p_noowner']} processes have no named owner and {C['p_nobackup']} of {Tt['p_nobackup']} have no backup; {C['p_stepowner']} steps have no owner. Needs people, not code.
- Authority and classification: {C['d_undecl']} entities hold fields nobody has declared; routed to Technical debt.
- {C['d_metric_untraced']} metrics still trace to no field (about 150 formula terms); only exact single-field matches were mapped, marked proposed.
- Knowledge references with no article: 4 incident links and 22 metric remediation links (KB ids that do not exist).
- {C['metric_agent']} metric remediation agents are not registered agents; {C['metric_use']} metric "used on" names match no screen; {C['po_line']} of {Tt['po_line']} POs point at a run-budget line that is not a budget line.
- {C['a_gate']} of {Tt['a_gate']} screens that declare a gate step do not register an approval in the inbox (the gate is a process step, not a record).
- The notification engine keeps its event list inside `mod_svc.js`; the eight business events are registered in the connectivity layer (notices, inbox, search) until that list is made registerable.
""")
T.append("## Top 10 improvements above and beyond (ranked)\n")
T10=[("Make every gate step a real approval record","79 of 94 screens with a gate step do not register in the inbox; approvals live in 8 private stores.","One `APPROVAL` entity plus `INBOX.register(kind, {list, decide})`; migrate gates screen by screen.","L"),
("A real event bus for decisions","Only invoices fan out now, through an audit hook. Change approval, budget request, risk acceptance and meeting actions each update different subsets by hand.","Publish and subscribe `BUS.emit(event, record)` with consumers declared on the module map; the map flow becomes the subscription.","M"),
("Backup owner by default","119 of 145 processes have no backup; 26 steps have no owner.","Inherit backup from the accountability domain at registration, flag as inferred, require confirmation within 30 days.","S"),
("Role registry with holders","199 workflow step assignees and 36 approver roles resolve to no person or team.","A `role` entity (name, holder, backup, delegation of authority tier); workflow pickers choose roles from it.","M"),
("Declare reference targets in the schema","68 entities still have reference fields with no target entity; refs are inferred from names.","Make `ref` mandatory in `DATAMODEL.register`; gate rejects untargeted refs.","S"),
("Metric lineage assistant","79 metrics trace to no field; 156 terms unmapped.","Suggest `entity.field` per formula term with confidence; steward accepts in one click (the Lineage tab already stores overrides).","M"),
("Create the missing knowledge articles","4 incident links and 22 metric remediation links point at KB ids that do not exist.","KCS draft generator from the metric remediation title and the incident resolution notes.","S"),
("Move notification events into a registry","8 of 8 business events have no template in the engine; the list is private to one module.","`NTF.registerEvent` with owner, audience and template; invoice, budget, risk and contract events first.","S"),
("Link convention and CI walker","Chips use 14 different attribute names; the walker has to guess the target id.","One `data-link=\"type:id\"` attribute and one `openRecord(type,id)`; run `zl_walk.js` in the build.","M"),
("Resolve run-budget lines and renamed screens","6 of 13 POs point at a run-budget line that is not a budget line; 33 metric screen names are stale.","Add run-budget lines to the budget model; resolve screen names by id, not by label.","S")]
T.append("| # | Improvement | Evidence | Approach | Effort |\n|---|---|---|---|---|")
for i,t in enumerate(T10,1): T.append("| %d | %s | %s | %s | %s |"%(i,*t))
T.append("\n## How to re-run\n\n```\npython3 build.py --out out_g14\nNODE_PATH=$(npm root -g) node zl_measure.js out_g14/full.html scr/after.json\nNODE_PATH=$(npm root -g) node zl_measure.js scr/base.html scr/before.json inject   # baseline: module injected with fixes off\nZL_SCREENS=inv,port,... NODE_PATH=$(npm root -g) node zl_walk.js out_g14/full.html scr/walk_a.json 0 1 8\npython3 zl_embed.py && python3 zl_doc.py\n```\n")
open('docs/AUDIT_CONNECTIVITY_R14.md','w').write("\n".join(T))
print('written',len("\n".join(T)))
