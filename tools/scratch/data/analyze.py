# PR-32: turn the instrument.js measurement into docs/data/tenant-coverage.csv and a summary for the entity plan.
# Usage: python3 tools/scratch/data/analyze.py <reads.json> [out_dir=docs/data]
# Writes tenant-coverage.csv and summary.json (summary.json is a working file for writing the docs; it stays in tools/scratch/data).
import csv, json, sys, os, re, bisect, collections
sys.path.insert(0, os.path.dirname(__file__))
from entity_map import classify, DEFINED, AREA

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
reads_path = sys.argv[1]
out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'docs/data')
d = json.load(open(reads_path))
inv = {r['id']: r for r in csv.DictReader(open(os.path.join(ROOT, 'docs/ia/screen-inventory.csv')))}
lm = d['lineMap']; starts = [x[0] for x in lm]
def mod_of(line):
    i = bisect.bisect_right(starts, int(line)) - 1
    return lm[i][1] if i >= 0 else '?'
TENANTS = [t for t in d['tenants'] if t != 'core']
counts = d['counts']

# static scan: sample arrays held inside a module's closure (instrument.js cannot reach them)
PRIV = re.compile(r'(?:const|let)\s+([A-Z][A-Z0-9_]{2,})\s*=\s*\[\s*[\{\[]')
priv = {}
for f in os.listdir(os.path.join(ROOT, 'src')):
    if f.endswith('.js') and ' 2' not in f:
        src = open(os.path.join(ROOT, 'src', f), encoding='utf-8').read()
        names = sorted(set(PRIV.findall(src)))
        if names: priv[f] = names

# screens listed in the SCREENS literal of data.js render from _R.<id>= in a core screens file: that file is the one a migration edits
CORE_R = {}
for cf in ['screens1.js', 'screens2.js', 'screens3.js', 'screens4.js', 'ui.js', 'kit.js', 'kit2.js']:
    for m in re.finditer(r'_R(?:\.([A-Za-z0-9_]+)|\[["\']([A-Za-z0-9_]+)["\']\])\s*=', open(os.path.join(ROOT, 'src', cf), encoding='utf-8').read()):
        CORE_R.setdefault(m.group(1) or m.group(2), cf)
def screen_files(sid):
    info = d['files'].get(sid) or {}
    f = info.get('f') or (inv.get(sid, {}).get('module_file', '').replace('src/', ''))
    dup = [x for x in (info.get('dup') or []) if x != f]
    if f == 'data.js' and sid in CORE_R:
        dup = [f] + dup; f = CORE_R[sid]
    return f, dup

# 1. per screen: paths, classes, entities, callers
rows = []; ent_screens = collections.defaultdict(set); ent_paths = collections.defaultdict(set)
ent_fields = collections.defaultdict(collections.Counter); helper_use = collections.defaultdict(lambda: collections.defaultdict(set))
for sid in d['modes']:
    r = d['reads'].get(sid, {'render': {}, 'tabs': {}, 'callers': {}, 'fields': {}})
    f, dup = screen_files(sid)
    own_mods = {f} | set(dup)
    paths = sorted(set(r['render']) | set(r['tabs']))
    ents_own, ents_shared, core_paths, plat, helpers = {}, {}, [], [], collections.Counter()
    work = sorted({classify(p)[0] for p in (r.get('work') or {}) if classify(p)[0]})
    for p in paths:
        e, cls = classify(p)
        callers = collections.Counter()
        for ln, n in r['callers'].get(p, {}).get('lines', {}).items():
            callers[mod_of(ln)] += n
        if e is None:
            plat.append(p); continue
        core_paths.append(p); ent_paths[e].add(p)
        own = (not callers) or any(m in own_mods for m in callers)
        (ents_own if own else ents_shared).setdefault(e, set()).add(p)
        for m in callers:
            if m not in own_mods: helper_use[m][e].add(sid); helpers[m] += 1
        for k, n in (r.get('fields', {}).get(p, {}) or {}).items():
            ent_fields[e][k] += 1
    # entities asked through DATA.get (data-mode screens and adapters)
    via = sorted((d['ents'].get(sid) or {}).keys())
    reg = next((x for x in d['dataScreens'] if x['id'] == sid), None)
    if reg:
        via = sorted(set(via) | set(reg['entities']))
    need = sorted(set(ents_own) | set(ents_shared) | set(via))
    for e in need: ent_screens[e].add(sid)
    rows.append(dict(sid=sid, f=f, dup=dup, own=ents_own, shared=ents_shared, via=via, need=need, core_paths=core_paths, plat=plat, work=work, helpers=sorted(helpers)))

# 2. CSV
def avail(e, t):
    if e not in DEFINED: return 'no entity'
    n = counts[t].get(e, 0)
    return str(n) if n else 'gap'
os.makedirs(out_dir, exist_ok=True)
with open(os.path.join(out_dir, 'tenant-coverage.csv'), 'w', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['id', 'name', 'area', 'module_file', 'other_files', 'tenant_mode', 'core_paths_read', 'entities_read_by_screen', 'entities_read_by_shared_helpers',
                'shared_helper_modules', 'entities_via_DATA', 'entities_via_work_index', 'entities_needed', 'entities_not_in_DATA', 'module_private_seeds', 'health', 'mining', 'storage', 'ready_health', 'ready_mining', 'ready_storage'])
    for x in rows:
        sid = x['sid']; area = inv.get(sid, {}).get('proposed_area', '') or 'not in IA inventory'
        missing = [e for e in x['need'] if e not in DEFINED]
        per = {t: ';'.join(f'{e}:{avail(e,t)}' for e in x['need']) for t in TENANTS}
        ready = {t: 'yes' if x['need'] and all(avail(e, t) not in ('no entity', 'gap') for e in x['need']) else ('nothing needed' if not x['need'] else 'no') for t in TENANTS}
        w.writerow([sid, d['names'].get(sid, ''), area, 'src/' + x['f'] if x['f'] else '', ';'.join('src/' + y for y in x['dup']), d['modes'][sid],
                    ';'.join(x['core_paths']), ';'.join(sorted(x['own'])), ';'.join(sorted(set(x['shared']) - set(x['own']))), ';'.join('src/'+m for m in x['helpers']), ';'.join(x['via']), ';'.join(x['work']), ';'.join(x['need']),
                    ';'.join(missing), ';'.join(priv.get(x['f'], [])), per['health'], per['mining'], per['storage'], ready['health'], ready['mining'], ready['storage']])

# 3. summary for the docs
S = {}
S['screens'] = len(rows); S['modes'] = collections.Counter(d['modes'].values())
S['by_area'] = collections.Counter(inv.get(x['sid'], {}).get('proposed_area', 'not in IA inventory') for x in rows)
S['core_by_area'] = collections.Counter(inv.get(x['sid'], {}).get('proposed_area', 'not in IA inventory') for x in rows if d['modes'][x['sid']] == 'core')
S['no_business_reads'] = sorted(x['sid'] for x in rows if not x['need'])
S['ready_all'] = {t: sorted(x['sid'] for x in rows if d['modes'][x['sid']] == 'core' and x['need'] and all(avail(e, t) not in ('no entity', 'gap') for e in x['need'])) for t in TENANTS}
S['ready_defined_only'] = sorted(x['sid'] for x in rows if d['modes'][x['sid']] == 'core' and x['need'] and all(e in DEFINED for e in x['need']))
# screens unlocked by an entity: core screens that need it; "last missing" = it is the only entity not yet in DATA
ents = {}
for e in sorted(ent_screens):
    sc = sorted(ent_screens[e]); core_sc = [s for s in sc if d['modes'][s] == 'core']
    only = [x['sid'] for x in rows if d['modes'][x['sid']] == 'core' and [m for m in x['need'] if m not in DEFINED] == [e]]
    ents[e] = dict(defined=e in DEFINED, area=AREA.get(e, ''), cls=classify(next(iter(ent_paths[e])))[1] if ent_paths[e] else 'entity', paths=sorted(ent_paths[e]), screens=len(sc), core_screens=len(core_sc),
                   only_missing=only, fields=[k for k, _ in ent_fields[e].most_common(40)], packs={t: counts[t].get(e) for t in TENANTS} if e in DEFINED else None)
S['entities'] = ents
S['helpers'] = {m: {e: len(v) for e, v in es.items()} for m, es in helper_use.items()}
# modules: screens they define and the entities those screens read themselves
mods = collections.defaultdict(lambda: {'screens': [], 'need': set(), 'own': set()})
for x in rows:
    m = mods[x['f']]; m['screens'].append(x['sid']); m['need'] |= set(x['need']); m['own'] |= set(x['own'])
    for y in x['dup']: mods[y]['screens'].append(x['sid'] + ' (also)')
S['modules'] = {k: {'screens': v['screens'], 'need': sorted(v['need']), 'own': sorted(v['own']), 'modes': sorted(set(d['modes'].get(s.split(' ')[0], '') for s in v['screens']))} for k, v in mods.items()}
S['private'] = priv
S['tabs_clicked'] = sum(len(v) for v in d['tabs'].values()); S['screens_with_tabs'] = sum(1 for v in d['tabs'].values() if v)
S['errors'] = d['errors']; S['paths_instrumented'] = len(d['paths'])
S['terms'] = d['terms']
json.dump(S, open(os.path.join(os.path.dirname(__file__), 'summary.json'), 'w'), indent=1, default=lambda o: dict(o) if isinstance(o, collections.Counter) else sorted(o))
print('rows', len(rows), 'entities', len(ents), 'not defined', sum(1 for e in ents.values() if not e['defined']))
