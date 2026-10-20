import json,collections,os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
rows=json.load(open(os.path.join(HERE,'rows_index.json')))
reg=json.load(open(os.environ.get('REGFILE',os.path.join(HERE,'..','registry.json'))))
lb=json.load(open(os.path.join(HERE,'last_build.json')))
def table(title,key,order=None):
    c=collections.Counter(r[key] for r in rows)
    keys=order or sorted(c,key=lambda k:-c[k])
    out=[f"### {title}","","| Value | Rows | Share |","|---|---|---|"]
    for k in keys:
        out.append(f"| {k} | {c.get(k,0)} | {100*c.get(k,0)/len(rows):.1f}% |")
    out.append(f"| Total | {len(rows)} | 100% |"); out.append("")
    return '\n'.join(out)
md=[]
md.append("# Requirements register summary\n")
md.append(f"Workbook: `oukala-requirements-register.xlsx`. Build read: `{reg.get('build')}`, extracted {reg.get('extractedAt')}. Requirement rows: {len(rows)}. Epics: {lb['epics']}. Story seeds: {lb['stories']}.\n")
mods=[m for m in ['HOME','MYWK','HELP','PLAN','FIX','TECH','MONY','LEARN','PEOP','STRT','GRC','RES','AUTO','AI','PLAT','NEW','HIDN','DATA','PROC','METR','EVNT','SECU','APPR','INTG','IMPT','AGNT','DSGN'] if any(r['module']==m for r in rows)]
md.append(table('Counts by module','module',mods))
md.append(table('Counts by category','cat',['Experience','Layout','Data','Process','Metric','Security','Integration','AI','Operations']))
md.append(table('Counts by priority','pri',['P0','P1','P2','P3']))
md.append(table('Counts by prototype status','status',['Built','Partial','Simulated','Gap']))
md.append("""## Priority rubric

| Priority | Meaning | Typical rows |
|---|---|---|
| P0 | Release blocker: the production system is unsafe, unusable or untrustworthy without it | Screen access rules, masking of personal, restricted and confidential data, audit of writes, approval routing by group, core shell screens (home, inbox, approvals, admin, permissions), tier 1 continuity plans, primary actions on core screens |
| P1 | Core workflow needed for the first customer release | Live entities and key fields, process steps with an SLA, primary actions, data bindings, focus order and labels, contrast, persistence of written entities, header and KPI layout on core screens, metrics tied to a process |
| P2 | Expected quality before general availability | Secondary regions and tables, tabs, empty, loading and error states, responsive layout, 44 px targets, performance budgets, remediation, secondary metrics |
| P3 | Enhancement or polish that can follow general availability | Proposed (not live) entities and fields, visualization palettes, extra scale work |

## Prototype status values

- Built: the prototype shows the behavior or fact, measured or read from a registry.
- Partial: present but incomplete (measured shortfall, missing backup, entity designed but not backed).
- Simulated: UI and seeded data exist, no real execution (connectors, AI, agents, metric calculation, deployments).
- Gap: no prototype evidence, or the registry shows a missing declaration.

## Method

1. `spec/extract_registry.js` opens `out_v16b/full.html` in Chromium (HTTPS aborted), reads the in-page registries (SCREENS, NAVX, MODMAP, PLAT entities, PROCLIB, METRICS, EVENTS, PERM, GUARD, APG, APPR, STATUS, FAB, R16M, MCPX, GATE, ORGX, AGENTS, BCX, CONTRACT, STORE), reads `:root` variables in dark and light, then visits every screen at 1440x900 dark and 400x820 and records region boxes, gaps, computed fonts, tables, buttons, fields, tabs, headings, ARIA facts, states, timing and DOM size. Output: `spec/registry.json`.
2. `spec/gen/build.py` turns those records into requirement rows with fixed templates. Every row carries measured or registry values in its text. Rows are de-duplicated on module, screen, category and requirement text.
3. The workbook is written with openpyxl and recalculated with LibreOffice to confirm zero formula errors.
4. Position tolerance in acceptance criteria is 2 px at 1440x900 dark with the 268 px rail.

## Known limits

- Layout facts are for the default tab and default data of each screen. Other tabs list headings only, not boxes.
- Primary-action results come from a click probe on up to three enabled buttons per screen. Other buttons list label and size only.
- Region labels come from the first heading in the region; regions without a heading carry the component class.
- Persona access is evaluated by the permission engine for 13 personas; section-level and row-level rules are listed but not evaluated per record.
- Metric current values are seeded in the prototype; calculation rows are marked Simulated.
- Owners are named humans only where the ownership registry has them; many backups are not named in the prototype and are flagged.
- Only 400 px and 1440 px were measured; tablet widths are not.
- Contrast ratios are computed for tokens, not for every rendered text node.
- Screen rows that say 'Gap' for empty, loading or error states mean no such element was found on the default view, not that the screen lacks the capability by design.
- Req IDs follow insertion order per module and can change when the prototype changes; keep a mapping if rows are tracked externally.
""")
open(os.environ.get('SUMOUT',os.path.join(HERE,'..','register_summary.md')),'w').write('\n'.join(md))
print('ok')
