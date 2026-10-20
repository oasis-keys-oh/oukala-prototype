"""PH-14 scratch: print the family and merge tables for navigation-architecture.md from docs/ia/screen-inventory.csv."""
import csv, json, collections
r = list(csv.DictReader(open('docs/ia/screen-inventory.csv')))
by = {x['id']: x for x in r}
D = json.load(open('tools/scratch/ia/screens.json'))
cur = {f['id']: [v[0] for v in f['views']] for f in D['meta']['families']}
curof = {v: f for f, vs in cur.items() for v in vs}
fam = collections.OrderedDict()
canon = {}
for x in r:
    a = x['action']
    if a.startswith('fold into family '):
        fam.setdefault(a[len('fold into family '):], []).append(x['id'])
# canonical: the visible member whose r3/comparison or current family matches; pick by rule
CANON = {'Meetings': 'meet_hub', 'Org chart': 'org_chart', 'Budgets': 'bud_over', 'Platform maps': 'plat_map', 'Connect other systems': 'flw_hub',
         'Order something': 'svc_portal', 'Dashboards': 'exe_dash', 'Budget and spend traceability': 'bst', 'Processes': 'plat_proc',
         'Rules and decisions': 'flw_dmn', 'My approvals': 'flw_appr', 'AI agents': 'tower', 'Permissions': 'r16g_perm', 'Impact Explorer': 'kg',
         'Risk': 'exe_risk', 'Registries': 'plat_reg', 'My builds': 'r18_builds', 'Lenses': 'r18_lens', 'Value': 'bud_ben', 'Schedules': 'ims',
         'Team boards': 'agile_board', 'Knowledge': 'kcs_home', 'Monitoring': 'obs_dash', 'Services and applications': 'svc_360',
         'Technology records': 'itom_cmdb', 'Funding rules': 'fin_color', 'Cost transparency': 'tbm_model', 'AI quality': 'kcs_test', 'GRC': 'grc_home',
         'Resilience': 'bc_home', 'Process maturity': 'exe_mat', 'Showroom': 'showroom', 'Tenancy': 'tn_admin', 'Approval routing': 'r16h_groups',
         'Data sources': 'r16m_sources', 'Setup': 'r16m_setup'}
merges = collections.defaultdict(list)
for x in r:
    if x['action'].startswith('merge into '):
        merges[x['action'].split()[2]].append(x['id'])
print('| Family (menu entry) | Area | Canonical id | Views in the switcher (id: label) | Today |')
print('|---|---|---|---|---|')
n = 0
for name, ms in fam.items():
    c = CANON[name]
    views = [c] + ms + [m for m in merges.get(c, [])]
    for m in ms:
        views += merges.get(m, [])
    if c not in cur:
        today = 'proposed'
    else:
        old = set(cur[c])
        today = 'exists, unchanged' if old == set([v for v in views if v not in merges.get(c, [])]) else 'exists, changed'
    lab = '; '.join(f'`{v}`: {by[v]["proposed_label"]}' + (' (merged tab)' if by[v]['action'].startswith('merge') else '') for v in views)
    print(f'| {by[c]["proposed_label"]} | {by[c]["proposed_area"]} | `{c}` | {lab} | {today} |')
    n += 1
# merges whose target is not a family canonical
rest = [k for k in merges if k not in CANON.values() and not any(k in v for v in fam.values())]
print('families', n, 'merge targets outside families', rest)
print('families today', len(cur))
gone = [f for f in cur if f not in CANON.values()]
print('families today that end', gone)
