"""PH-14 scratch: join the measured screen facts (screens.json from extract.js) with the decisions file and write docs/ia/screen-inventory.csv.
Usage: python3 tools/scratch/ia/gen_csv.py   (run from the repo root)"""
import csv, json, re, collections, sys

D = json.load(open('tools/scratch/ia/screens.json'))
S = {s['id']: s for s in D['screens']}
P = {p['k']: p for p in D['meta']['personas']}
sm = open('src/mod_r32_scrmap_a_data.js').read()
SM = json.loads(sm[sm.index('{'):sm.rindex('}') + 1])['screens']
MOD = {'showroom': 'mod_r33_showroom.js', 'guard': 'mod_s_guard.js', 'kcs_viz': 'mod_viz2.js'}

# archetype from docs/inventory/screen-archetypes.md (CL-51), plus the six screens registered after it
arch = {}
cur = None
for line in open('docs/inventory/screen-archetypes.md'):
    m = re.match(r'### (.+?) \((\d+)\)', line)
    if m:
        cur = m.group(1)
    m = re.match(r'\| `([a-z0-9_]+)` \|', line)
    if m and cur and m.group(1) not in arch:
        cells = [c.strip() for c in line.split('|')]
        arch[m.group(1)] = 'Other: ' + cells[-2] if cur == 'Other' else cur
NEWA = {'guard': 'Dashboard-first list (register)', 'agent_defs': 'Catalog', 'tn_projects': 'Dashboard-first list',
        'tn_people': 'Dashboard-first list', 'tn_metrics': 'Report', 'tn_admin': 'Other: admin configuration'}

AREA = {'HM': 'Home', 'MW': 'My work', 'AR': 'Ask or request', 'SV': 'Strategy and value', 'PD': 'Portfolio and delivery',
        'OS': 'Operations and service', 'MC': 'Money and contracts', 'PO': 'People and organization',
        'RC': 'Risk, control and AI', 'TR': 'Transformation', 'BA': 'Build and admin', 'SR': 'Showroom'}
PN = {k: p['n'].replace(' (read only)', '') for k, p in P.items()}
PN['exec'] = 'CIO'
ALL = ['all roles']
# default personas per area and sub-group (the purview each persona menu in navigation-architecture.md shows)
SUBP = {
    ('SV', '*'): ['ceo', 'exec', 'cfo', 'coo', 'cco', 'board', 'portfolio'],
    ('PD', '*'): ['portfolio', 'pm', 'coo', 'exec'],
    ('PD', 'Staff and ship'): ['change', 'pm', 'exec', 'arch'],
    ('OS', 'Service desk'): ['ops', 'dist', 'fac', 'plant', 'proc'],
    ('OS', 'Change and service levels'): ['change', 'ops', 'proc'],
    ('OS', 'Technology and services'): ['ops', 'arch', 'exec', 'change'],
    ('OS', 'Monitoring'): ['ops', 'change', 'proc', 'plant'],
    ('OS', 'Knowledge'): ['ops', 'emp', 'newhire'],
    ('MC', '*'): ['cfo', 'fin', 'portfolio', 'scm'],
    ('MC', 'Vendors and contracts'): ['clo', 'scm', 'fin', 'fac'],
    ('MC', 'Approve and pay'): ['fin', 'cfo', 'scm', 'audit'],
    ('PO', '*'): ['chro', 'coo', 'portfolio', 'pm'],
    ('PO', 'Learning and performance'): ['chro', 'newhire', 'emp'],
    ('RC', 'Risk'): ['ciso', 'clo', 'board', 'cfo', 'audit'],
    ('RC', 'Control, audit and access'): ['audit', 'ciso', 'clo', 'board', 'admin'],
    ('RC', 'AI oversight'): ['caio', 'exec', 'arch'],
    ('RC', 'Resilience'): ['coo', 'ops', 'ciso', 'plant'],
    ('TR', '*'): ['coo', 'ceo', 'exec', 'portfolio', 'arch'],
    ('TR', 'Processes and maturity'): ['coo', 'dist', 'fac', 'scm', 'plant', 'proc', 'arch'],
    ('BA', '*'): ['arch', 'admin'],
    ('SR', '*'): ['ceo', 'exec', 'coo', 'cfo'],
}
# proposed role pins (navigation-architecture.md section b); a pin adds the persona to the screen's primary personas
PINS = {'ceo': ['exe_board', 'r18_lens', 'exe_strat', 'exe_dash'], 'exec': ['bst', 'exe_dash', 'tower', 'r18_builds'],
        'cfo': ['bst', 'inv', 'bud_over', 'exe_dash'], 'coo': ['exe_strat', 'strat_exec', 'ppl_jrny', 'orgdesign'],
        'cco': ['metrics', 'svc_req', 'org_chart', 'plat_proc'], 'chro': ['org_chart', 'ppl_perf', 'ppl_train', 'ppl_cap'],
        'ciso': ['grc_home', 'r15_iam', 'exe_risk', 'guard'], 'caio': ['tower', 'r15d_agents', 'kcs_test', 'r17q_value'],
        'clo': ['ppm_sow', 'grc_pol', 'grc_exc', 'bud_ven'], 'board': ['exe_board', 'r15d_evidence', 'exe_risk', 'exe_dash'],
        'portfolio': ['port', 'ims', 'ppm_raid', 'ppl_cap'], 'audit': ['r15d_evidence', 'grc_home', 'bud_doa', 'exe_board'],
        'pm': ['ppm_proj', 'ims', 'ppm_raid', 'r15_time'], 'ops': ['itsm_inc', 'itsm_mi', 'svc_oncall', 'kcs_home'],
        'dist': ['svc_req', 'plat_proc', 'metrics', 'svc_guides'], 'fac': ['svc_req', 'plat_proc', 'metrics', 'bud_ven'],
        'scm': ['bud_ven', 'r15_p2p', 'ppm_sow', 'plat_proc'], 'plant': ['metrics', 'plat_proc', 'exe_mat', 'svc_req'],
        'proc': ['itsm_chg', 'plat_proc', 'metrics', 'svc_req'], 'change': ['itsm_chg', 'itsm_rel', 'dev_pipe', 'itom_run'],
        'arch': ['plat_map', 'plat_reg', 'plat_debt', 'itom_cmdb'], 'admin': ['adm_studio', 'r16g_perm', 'plat_reg', 'tn_admin'],
        'fin': ['inv', 'bud_over', 'bud_req', 'bud_ven'], 'emp': ['svc_portal', 'kcs_ask', 'svc_guides', 'ppl_train'],
        'newhire': ['r15d_firstweek', 'svc_portal', 'ppl_train', 'kcs_ask'], 'guest': ['svc_portal']}
for k in PINS:
    if k not in P:
        sys.exit('unknown persona ' + k)
ROWS = []
for line in open('tools/scratch/ia/decisions.txt'):
    line = line.rstrip('\n')
    if not line or line.startswith('#'):
        continue
    f = line.split('|')
    if len(f) != 9:
        sys.exit('bad row: ' + line)
    ROWS.append(f)
ids = [r[0] for r in ROWS]
dup = [i for i, n in collections.Counter(ids).items() if n > 1]
missing = [i for i in S if i not in ids]
extra = [i for i in ids if i not in S]
if dup or missing or extra:
    sys.exit(f'dup {dup} missing {missing} extra {extra}')

def personas(sid, area, sub):
    if area in ('HM', 'MW', 'AR'):
        base = ALL
    else:
        base = SUBP.get((area, sub)) or SUBP.get((area, '*')) or []
    out = list(base)
    for k in P:
        if sid in PINS.get(k, []) and k not in out and out != ALL:
            out.append(k)
    if sid == 'r15d_firstweek':
        out = ['newhire', 'emp']
    return '; '.join(PN.get(k, k) for k in out)

def cur_group(s):
    if s['alias']:
        return 'Hidden (alias of ' + s['alias'] + ')'
    if s['hidden']:
        return 'Hidden (view of ' + (s['famLabel'] or '?') + ')'
    g = s['groupLabel'] or ''
    sub = (s['nav'] or {}).get('sub') or ''
    return g + (' > ' + sub if sub else '')

def objects(s, given):
    return given

hdr = ['id', 'current_name', 'current_nav_group', 'module_file', 'archetype', 'primary_personas', 'objects_shown',
       'proposed_area', 'proposed_sub_group', 'proposed_label', 'action', 'reason', 'r3_comparison',
       'contribution_anchor', 'tenant_mode']
order = {k: i for i, k in enumerate(['HM', 'MW', 'AR', 'SV', 'PD', 'OS', 'MC', 'PO', 'RC', 'TR', 'SR', 'BA'])}
out = []
for r in ROWS:
    sid, area, sub, label, action, objs, reason, r3, anchor = r
    s = S[sid]
    mod = SM.get(sid, {}).get('f') or MOD.get(sid, '')
    out.append([sid, s['name'], cur_group(s), 'src/' + mod if mod else '', arch.get(sid) or NEWA.get(sid, ''),
                personas(sid, area, sub), objs, AREA[area], sub, label, action, reason, r3, anchor, s['mode'] or 'core'])
out.sort(key=lambda x: (order[[k for k, v in AREA.items() if v == x[7]][0]], x[8], 0 if x[10] == 'keep' or x[10].startswith('move') else 1, x[0]))
with open('docs/ia/screen-inventory.csv', 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(hdr)
    w.writerows(out)

# counts for the README and the architecture paper
def kind(a):
    for k in ['keep', 'merge into', 'fold into family', 'move to Build and admin', 'hide from everyone', 'remove from nav', 'candidate to retire']:
        if a.startswith(k):
            return k
    return a
c = collections.Counter(kind(x[10]) for x in out)
print('rows', len(out))
for k, v in c.items():
    print(f'  {k}: {v}')
fam = collections.Counter(re.sub(r'^fold into family ', '', x[10]) for x in out if x[10].startswith('fold'))
print('families', len(fam), dict(fam))
area = collections.Counter(x[7] for x in out)
print('by area', dict(area))
vis = [x for x in out if x[10] == 'keep' or x[10] == 'move to Build and admin']
print('visible entries', len(vis), dict(collections.Counter(x[7] for x in vis)))
subs = collections.defaultdict(list)
for x in vis:
    subs[(x[7], x[8])].append(x[0])
for k, v in subs.items():
    print('  ', k, len(v), v)
print('modes', collections.Counter(x[14] for x in out))
print('current hidden', sum(1 for s in S.values() if s['hidden']))
