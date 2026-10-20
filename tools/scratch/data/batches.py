# PR-32: group modules into migration batches that never share a module (docs/data/entity-plan.md, section 5).
# Usage: python3 tools/scratch/data/batches.py [docs/data/tenant-coverage.csv] [reads.json]
# A screen's module set = the file with its render function + the files that read business rows for it (callers in instrument.js),
# except the cross-cutting helpers (files that read rows for 20 or more screens they do not define), which form batch 1.
# Modules linked through a screen land in one component; a component is one unit of work, so no two batches edit one file.
import csv, json, sys, os, collections, bisect
sys.path.insert(0, os.path.dirname(__file__))
from entity_map import classify, DEFINED, AREA
H = os.path.dirname(__file__)
cov = list(csv.DictReader(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, '../../../docs/data/tenant-coverage.csv'))))
d = json.load(open(sys.argv[2] if len(sys.argv) > 2 else os.path.join(H, 'reads.json')))
lm = d['lineMap']; st = [x[0] for x in lm]
mod = lambda l: lm[bisect.bisect_right(st, int(l)) - 1][1]
foreign = collections.defaultdict(set); links = collections.defaultdict(set)
for r in cov:
    sid = r['id']; f = r['module_file'].replace('src/', ''); own = {f} | {x.replace('src/', '') for x in r['other_files'].split(';') if x}
    rr = d['reads'].get(sid, {}).get('callers', {})
    for p, v in rr.items():
        e, cls = classify(p)
        if not e: continue
        for l in v['lines']:
            m = mod(l)
            if m not in own: foreign[m].add(sid); links[sid].add(m)
CROSS = sorted(set(m for m, s in foreign.items() if len(s) >= 20) | {'mod_s_owner.js'})  # owner chips resolve people on every screen (R13)
# aggregator screens (home, value register, connections and similar) read rows through many other modules: they do not link those
# modules into one unit; they move in the last batch, after their sources read through DATA
AGG_N = int(os.environ.get('AGG_N', '5'))
AGG = sorted(sid for sid, ms in links.items() if len(ms - set(CROSS)) >= AGG_N)
# data owners: modules that hold a store and serve its rows to 8 to 19 screens they do not define (mod_budget, mod_itsm, mod_meet ...).
# Switching the owner's accessors to DATA unlocks those screens without editing the reader, so owners do not link readers either.
OWN_N = int(os.environ.get('OWN_N', '8'))
OWNERS = sorted(m for m, s in foreign.items() if OWN_N <= len(s) < 20)
NOLINK = set(CROSS) | set(OWNERS)
# union-find over modules
par = {}
def find(x):
    par.setdefault(x, x)
    while par[x] != x: par[x] = par[par[x]]; x = par[x]
    return x
def union(a, b): par[find(a)] = find(b)
scr_mod = {}
for r in cov:
    sid = r['id']; f = r['module_file'].replace('src/', '')
    if not f: continue
    scr_mod[sid] = f; find(f)
    if f in CROSS or sid in AGG: continue
    for y in [x.replace('src/', '') for x in r['other_files'].split(';') if x] + sorted(links[sid]):
        if y not in NOLINK and y != 'data.js' and f not in OWNERS: union(f, y)
comp = collections.defaultdict(set)
for m in list(par):
    if m not in CROSS: comp[find(m)].add(m)
out = []
for k, ms in comp.items():
    scr = [r for r in cov if scr_mod.get(r['id']) in ms and r['id'] not in AGG]
    need = sorted({e for r in scr for e in r['entities_needed'].split(';') if e})
    areas = collections.Counter(r['area'] for r in scr)
    out.append(dict(modules=sorted(ms), screens=[r['id'] for r in scr], core=[r['id'] for r in scr if r['tenant_mode'] == 'core'],
                    need=need, missing=[e for e in need if e not in DEFINED], area=areas.most_common(1)[0][0] if areas else ''))
cross_scr = [r['id'] for r in cov if scr_mod.get(r['id']) in CROSS and r['id'] not in AGG]
json.dump(dict(owners=OWNERS, owner_foreign={m: len(foreign[m]) for m in OWNERS}, agg=AGG, agg_mods={sid: sorted(links[sid] - set(CROSS)) for sid in AGG}, cross=CROSS, cross_foreign={m: len(foreign[m]) for m in CROSS}, cross_screens=cross_scr, components=sorted(out, key=lambda c: (-len(c['screens'])))),
          open(os.path.join(H, 'batches.json'), 'w'), indent=1)
print('cross-cutting', CROSS); print('owners', OWNERS); print('aggregators', len(AGG), AGG)
for c in sorted([c for c in out if c['screens']], key=lambda c: (c['area'], -len(c['screens']))):
    print(len(c['screens']), c['area'], c['modules'], 'missing:', ','.join(c['missing']))

# ---- ordered plan: every module in exactly one batch ----
AREA_BATCH = [('B3', 'Strategy and value'), ('B4', 'Portfolio and delivery'), ('B5', 'Money and contracts'), ('B6', 'Operations and service'),
              ('B7', 'Risk, control and AI'), ('B8', 'People, organization and my work'), ('B9', 'Build, admin, transformation and showroom')]
AREA_OF = {'Strategy and value': 'B3', 'Portfolio and delivery': 'B4', 'Money and contracts': 'B5', 'Operations and service': 'B6', 'Ask or request': 'B6',
           'Risk, control and AI': 'B7', 'People and organization': 'B8', 'My work': 'B8', 'Home': 'B3', 'Build and admin': 'B9', 'Transformation': 'B9', 'Showroom': 'B9'}
plan = {b: {'name': n, 'modules': set(), 'screens': [], 'need': set()} for b, n in AREA_BATCH}
plan['B2'] = {'name': 'Cross-cutting helpers', 'modules': set(CROSS), 'screens': cross_scr[:], 'need': set()}
plan['B10'] = {'name': 'Aggregator screens and adapter clean-up', 'modules': {'mod_s_tenant_screens.js'}, 'screens': [], 'need': set()}
for c in out:
    if not c['screens']:
        plan['B10']['modules'] |= set(c['modules']); continue
    b = AREA_OF.get(c['area'], 'B9'); plan[b]['modules'] |= set(c['modules']); plan[b]['screens'] += c['screens']; plan[b]['need'] |= set(c['need'])
for sid in cross_scr:
    r = next(x for x in cov if x['id'] == sid); plan['B2']['need'] |= {e for e in r['entities_needed'].split(';') if e}
for r in cov:
    if r['id'] in AGG:
        m = scr_mod.get(r['id'])
        b = next((k for k, v in plan.items() if m in v['modules']), 'B10')
        if b == 'B10': plan['B10']['modules'].add(m)
        plan[b]['screens'].append(r['id'] + ' (aggregator)')
        plan[b]['need'] |= {e for e in r['entities_needed'].split(';') if e}
# reader modules that define no screen (data owners such as mod_r15f2_b_data, mod_s_owner): the area batch whose screens they serve most
placed = {m for v in plan.values() for m in v['modules']}
scr_batch = {s.split(' ')[0]: b for b, v in plan.items() for s in v['screens']}
plan_extra = collections.defaultdict(list)
for m, ss in foreign.items():
    if m in placed or m in CROSS: continue
    cnt = collections.Counter(scr_batch.get(s) for s in ss if s not in AGG and scr_batch.get(s) not in (None, 'B2', 'B10'))
    if not cnt: cnt = collections.Counter(scr_batch.get(s) for s in ss if scr_batch.get(s) not in (None, 'B2'))
    b = 'B2' if m in ('data.js', 'data2.js', 'kit.js', 'kit2.js', 'ui.js', 'platform.js') else (cnt.most_common(1)[0][0] if cnt else 'B10')
    plan[b]['modules'].add(m); plan_extra[b].append(m)
mode = {r['id']: r['tenant_mode'] for r in cov}
seen =collections.Counter(m for v in plan.values() for m in v['modules'])
assert all(n == 1 for n in seen.values()), [m for m, n in seen.items() if n > 1]
res = {}
for b in ['B2'] + [x for x, _ in AREA_BATCH] + ['B10']:
    v = plan[b]; sc = v['screens']
    res[b] = dict(name=v['name'], modules=sorted(v['modules']), screens=sc, core=[s for s in sc if mode.get(s.split(' ')[0]) == 'core'],
                  need=sorted(v['need']), new=sorted(e for e in v['need'] if e not in DEFINED), data_owners_without_screens=sorted(plan_extra.get(b, [])))
    print(b, v['name'], len(v['modules']), 'modules', len(sc), 'screens', len(res[b]['core']), 'core; new entities', len(res[b]['new']))
J = json.load(open(os.path.join(H, 'batches.json'))); J['plan'] = res; json.dump(J, open(os.path.join(H, 'batches.json'), 'w'), indent=1)
print('modules in plan', sum(len(v['modules']) for v in res.values()), 'screens', sum(len(v['screens']) for v in res.values()))
