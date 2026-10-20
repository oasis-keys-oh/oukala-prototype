#!/usr/bin/env python3
"""gen_pack.py: emit a tenant pack module from a small spec (DC-09). Format and path: docs/tenant-packs.md.

Usage:
  python3 tools/generators/gen_pack.py tools/generators/gen_pack_specs/health.json          write src/mod_s_pack_<id>.js
  python3 tools/generators/gen_pack.py --all                                                 every spec in gen_pack_specs/
  python3 tools/generators/gen_pack.py --check <spec>                                        validate only, write nothing

The spec is the only hand-written input. The emitted module is generated: do not edit it, edit the spec and rerun.
The emitted module calls DATA.pack(tenant, rows, info) (the same path a real customer's data takes, R20), registers the
organization (functions and leaders) with TENANT, and adds the spec to window.TENANT_PACKS for the Tenancy screen.
Every figure in a pack is sample data for a fictional organization; tenant isolation is simulated (R52).
Exit code 1 when the spec fails validation; nothing is written then.
"""
import json, os, re, sys, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "src")
SPECS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gen_pack_specs")

KINDS = {"human", "agent", "robot"}
LABELS = {"fact", "modeled", "hypothesis", "simulated"}
DIMS = ["defined", "owned", "measured", "integrated", "automated", "governed"]
AUG = {"rep": .6, "mtg": .25, "apr": .3, "ops": .35}  # modeled share an agent could take (same working defaults as ODX.AUG)
BANNED = [r"\bCore\b", r"\bFabric\b", r"\bTrellis\b", "—"]
# Meridian (core) source files a pack person may not share a full name with. Industry files are excluded.
SKIP = re.compile(r"(^mod_s_pack_|^mod_s_tenant|^mod_r32_tenant|^mod_r28_jy|^mod_r28_scn|^mod_r29_preset| 2\.js$)")


def slug(s):
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", str(s).lower()))


def meridian_text():
    out = []
    for f in sorted(glob.glob(os.path.join(SRC, "*.js"))):
        b = os.path.basename(f)
        if SKIP.search(b):
            continue
        with open(f, encoding="utf-8", errors="ignore") as fh:
            out.append((b, fh.read()))
    return out


def build(spec, other_orgs):
    E, W = [], []
    tid = spec.get("tenant")
    info = dict(spec.get("info") or {})
    pfx = spec.get("prefix") or (tid or "x")[:2]
    if not tid or not re.match(r"^[a-z][a-z0-9_]*$", tid):
        E.append("tenant: a lowercase id is required")
    for k in ("org", "short", "kind"):
        if not info.get(k):
            E.append("info." + k + " is required")
    rows = {}

    # ---- organization: functions with a leader; the leaders are people too ----
    org = spec.get("org") or {}
    lead = org.get("lead") or {}
    if not lead.get("n"):
        E.append("org.lead.n (the executive the demo is told to) is required")
    fns = org.get("fns") or []
    people = []

    def add_person(p, team=None):
        if not p.get("name"):
            E.append("person without a name")
            return
        if any(x["name"] == p["name"] for x in people):
            return
        kind = p.get("kind", "human")
        if kind not in KINDS:
            E.append("person " + p["name"] + ": kind must be human, agent or robot")
        r = {"id": pfx + "-" + slug(p["name"]), "name": p["name"], "kind": kind, "role": p.get("role", ""),
             "team": p.get("team", team or ""), "org": info.get("org", "") if kind == "human" else "", "loc": p.get("loc", ""),
             "skills": p.get("skills", [])}
        for k in ("backup", "sponsor", "tier", "hrs", "does", "mgr"):
            if p.get(k) is not None:
                r[k] = p[k]
        people.append(r)

    if lead.get("n"):
        add_person({"name": lead["n"], "role": lead.get("t", ""), "team": "Executive office"})
    for f in fns:
        if not f.get("n") or not (f.get("lead") or {}).get("n"):
            E.append("org.fns: each function needs n and lead.n")
            continue
        add_person({"name": f["lead"]["n"], "role": f["lead"].get("t", ""), "mgr": lead.get("n")}, f["n"])
    for p in spec.get("people", []):
        add_person(p)
    rows["people"] = people
    names = {p["name"] for p in people}
    humans = {p["name"] for p in people if p["kind"] == "human"}

    def owner_pair(where, r, okey="owner", bkey="backup", need_backup=True):
        o, b = r.get(okey), r.get(bkey)
        if not o:
            E.append(where + ": " + okey + " is required (R12)")
        elif o not in humans:
            E.append(where + ": " + okey + " " + str(o) + " is not a person in this pack")
        if need_backup:
            if not b:
                E.append(where + ": " + bkey + " is required (R12)")
            elif b not in humans:
                E.append(where + ": " + bkey + " " + str(b) + " is not a person in this pack")
            elif b == o:
                E.append(where + ": owner and backup must differ (R12)")

    for p in people:
        if p["kind"] in ("agent", "robot"):
            if not p.get("sponsor"):
                E.append("person " + p["name"] + ": an agent or robot needs a human sponsor (R12)")
            elif p["sponsor"] not in humans:
                E.append("person " + p["name"] + ": sponsor " + p["sponsor"] + " is not a person in this pack")

    def ids(entity, lst, key="id"):
        seen = set()
        for i, r in enumerate(lst):
            v = r.get(key)
            if not v:
                E.append(entity + "[" + str(i) + "]: missing " + key)
            elif v in seen:
                E.append(entity + ": duplicate " + key + " " + str(v))
            seen.add(v)
        return seen

    # ---- strategy: objectives with key results ----
    objs, krs = [], []
    for o in spec.get("objectives", []):
        r = {k: v for k, v in o.items() if k != "krs"}
        r["t"] = "obj"
        owner_pair("objective " + str(o.get("id")), o)
        objs.append(r)
        for k in o.get("krs", []):
            kr = dict(k)
            kr["o"] = o.get("id")
            owner_pair("key result " + str(k.get("id")), kr)
            if kr.get("start") is None or kr.get("tgt") is None or kr.get("cur") is None:
                E.append("key result " + str(k.get("id")) + ": start, cur and tgt are required")
            kr.setdefault("label", "simulated")
            krs.append(kr)
    oids = ids("objectives", objs)
    ids("key_results", krs)
    rows["objectives"], rows["key_results"] = objs, krs
    rows["pillars"] = [dict(p) for p in spec.get("pillars", [])]
    ids("pillars", rows["pillars"])

    # ---- records: projects, budget lines, invoices, demand ----
    rows["projects"] = [dict(p) for p in spec.get("projects", [])]
    pids = ids("projects", rows["projects"])
    for p in rows["projects"]:
        owner_pair("project " + str(p.get("id")), p)
        if p.get("obj") and p["obj"] not in oids:
            E.append("project " + p["id"] + ": objective " + p["obj"] + " not in the pack")
        for k in ("n", "bac", "paid"):
            if p.get(k) is None:
                E.append("project " + str(p.get("id")) + ": " + k + " is required")
    rows["budget_lines"] = [dict(b) for b in spec.get("budget_lines", [])]
    bids = ids("budget_lines", rows["budget_lines"])
    for b in rows["budget_lines"]:
        if b.get("p") not in pids:
            E.append("budget line " + str(b.get("id")) + ": project " + str(b.get("p")) + " not in the pack")
        owner_pair("budget line " + str(b.get("id")), b, "own", "bk")
    rows["invoices"] = [dict(v) for v in spec.get("invoices", [])]
    ids("invoices", rows["invoices"])
    for v in rows["invoices"]:
        if v.get("p") not in pids:
            E.append("invoice " + str(v.get("id")) + ": project " + str(v.get("p")) + " not in the pack")
        if v.get("line") and v["line"] not in bids:
            E.append("invoice " + v["id"] + ": budget line " + v["line"] + " not in the pack")
        if not v.get("vendor") or v.get("amt") is None:
            E.append("invoice " + str(v.get("id")) + ": vendor and amt are required")
        owner_pair("invoice " + str(v.get("id")), v, "own", "bk")
    rows["demand"] = [dict(d) for d in spec.get("demand", [])]
    ids("demand", rows["demand"])
    for d in rows["demand"]:
        if d.get("obj") and d["obj"] not in oids:
            E.append("demand " + d["id"] + ": objective " + d["obj"] + " not in the pack")
        owner_pair("demand " + str(d.get("id")), d, "sp", "bk")

    # ---- metrics: owner, backup, formula, baseline, target, remediation, label ----
    rows["metrics"] = []
    for m in spec.get("metrics", []):
        r = dict(m)
        owner_pair("metric " + str(m.get("id")), r)
        for k in ("n", "u", "cur", "tgt", "base", "dir", "f", "rem"):
            if r.get(k) is None:
                E.append("metric " + str(m.get("id")) + ": " + k + " is required (R25)")
        if r.get("dir") not in ("min", "max"):
            E.append("metric " + str(m.get("id")) + ": dir is min or max")
        r.setdefault("label", spec.get("label", "simulated"))
        if r["label"] not in LABELS:
            E.append("metric " + str(m.get("id")) + ": label must be one of " + ", ".join(sorted(LABELS)))
        rows["metrics"].append(r)
    mids = ids("metrics", rows["metrics"])
    for k in krs:
        if k.get("metric") and k["metric"] not in mids:
            E.append("key result " + k["id"] + ": metric " + k["metric"] + " not in the pack")

    # ---- processes with maturity records (R26: six dimensions on the shared scale and a target) ----
    rows["processes"], rows["maturity"] = [], []
    for p in spec.get("processes", []):
        r = {k: v for k, v in p.items() if k != "maturity"}
        owner_pair("process " + str(p.get("id")), r)
        rows["processes"].append(r)
        mt = p.get("maturity") or {}
        dims = mt.get("dims") or {}
        bad = [d for d in DIMS if not isinstance(dims.get(d), int) or not 1 <= dims[d] <= 5]
        if bad:
            E.append("process " + str(p.get("id")) + ": maturity needs all six dimensions 1 to 5 (" + ", ".join(bad) + ")")
        if not isinstance(mt.get("target"), int) or not 1 <= mt.get("target", 0) <= 5:
            E.append("process " + str(p.get("id")) + ": maturity target 1 to 5 is required (R26)")
        if not bad:
            lvl = min(dims[d] for d in DIMS)
            rows["maturity"].append({"id": "mat-" + str(p.get("id")), "process": p.get("id"), "model": mt.get("model", "cmmi"),
                                     "dims": {d: dims[d] for d in DIMS}, "level": lvl, "target": mt.get("target"),
                                     "assessed": mt.get("assessed", "2026-09-30"), "label": mt.get("label", "simulated"),
                                     "owner": p.get("owner"), "backup": p.get("backup")})
        for m in p.get("metrics", []):
            if m not in mids:
                E.append("process " + str(p.get("id")) + ": metric " + m + " not in the pack")
    ids("processes", rows["processes"])

    # ---- vocabulary (CL-57): key -> [one, many] ----
    voc = spec.get("vocabulary") or {}
    rows["vocabulary"] = []
    for k, v in voc.items():
        if not isinstance(v, list) or len(v) != 2:
            E.append("vocabulary " + k + ": give [singular, plural]")
            continue
        rows["vocabulary"].append({"id": k, "one": v[0], "many": v[1]})

    # ---- COO brief inputs (JM-07): workload, value chain ----
    rows["workload"] = []
    for w in (spec.get("coo") or {}).get("workload", []):
        n, role, unit, pct, cap, rep, mtg, apr, ops, prj = w
        if n not in humans:
            E.append("workload: " + n + " is not a person in this pack")
        aug = rep * AUG["rep"] + mtg * AUG["mtg"] + apr * AUG["apr"] + ops * AUG["ops"]
        rows["workload"].append({"id": "wl-" + slug(n), "n": n, "role": role, "unit": unit, "pct": pct, "cap": cap,
                                 "hrs": round(pct * cap / 100), "rep": rep, "mtg": mtg, "apr": apr, "ops": ops, "prj": prj,
                                 "tot": round(rep + mtg + apr + ops + prj, 1), "aug": round(aug, 1), "label": "modeled"})
    vc = (spec.get("coo") or {}).get("value_chain") or {}
    rows["value_chain"] = []
    for i, s in enumerate(vc.get("steps", [])):
        r = dict(s)
        r["id"] = tid + "-vc" + str(i + 1)
        r["flow"] = vc.get("n", "")
        r.setdefault("label", "modeled")
        rows["value_chain"].append(r)

    # ---- honesty and naming checks over everything the pack shows ----
    txt = json.dumps({"rows": rows, "info": info, "org": org}, ensure_ascii=False)
    for pat in BANNED:
        if re.search(pat, txt):
            E.append("banned text in the pack: " + pat.replace("\\b", ""))
    for o in other_orgs:
        if o and o != info.get("org") and o in txt:
            E.append("the pack mentions another tenant: " + o)
    for b, t in meridian_text():
        for n in sorted(names):
            if len(n.split()) >= 2 and n in t:
                E.append("name collision: " + n + " is a Meridian name in src/" + b)

    for e in ("projects", "budget_lines", "invoices", "metrics", "objectives", "key_results", "processes", "vocabulary", "workload", "value_chain", "demand", "pillars"):
        if not rows.get(e):
            W.append("gap: " + e + " (the screens show an empty state, never another tenant's rows)")

    pack = {"id": tid, "spec": "tools/generators/gen_pack_specs/" + tid + ".json", "info": dict(info, lead=lead),
            "org": {"lead": lead, "fns": fns}, "images": spec.get("images") or {}, "reuse": spec.get("reuse") or [],
            "label": spec.get("label", "simulated"), "rows": rows}
    return pack, E, W


def emit(pack):
    j = json.dumps(pack, ensure_ascii=False, separators=(",", ":"))
    counts = ", ".join(k + " " + str(len(v)) for k, v in pack["rows"].items() if v)
    return ("/* ===== mod_s_pack_" + pack["id"] + ": tenant pack for " + pack["info"]["org"] + " (fictional). GENERATED by\n"
            "   tools/generators/gen_pack.py from " + pack["spec"] + ". Do not edit: edit the spec and rerun the generator.\n"
            "   Format and the path a real customer's data takes: docs/tenant-packs.md (DC-09, R20). Every figure is sample data,\n"
            "   " + pack["label"] + "; tenant isolation is simulated (R52). Rows: " + counts + ". ===== */\n"
            "(function(){\nconst W=window,DT=W.DATA;if(!DT)return;\n"
            "const PACK=" + j + ";\n"
            "(W.TENANT_PACKS=W.TENANT_PACKS||{})[PACK.id]=PACK;\n"
            "DT.pack(PACK.id,PACK.rows,PACK.info);\n"
            "/* the organization comes from the pack: functions, leaders and the executive (read by the org chart through TENANT) */\n"
            "try{if(W.TENANT&&TENANT.info){TENANT.info[PACK.id]=Object.assign({},TENANT.info[PACK.id]||{},PACK.info);if(TENANT.orgs)TENANT.orgs[PACK.id]={fns:PACK.org.fns}}}catch(e){console.error(\"pack \"+PACK.id,e)}\n"
            "})();\n")


def main(argv):
    check = "--check" in argv
    args = [a for a in argv if not a.startswith("--")]
    files = sorted(glob.glob(os.path.join(SPECS, "*.json"))) if "--all" in argv else args
    if not files:
        print(__doc__)
        return 2
    specs = []
    for f in files:
        with open(f, encoding="utf-8") as fh:
            specs.append((f, json.load(fh)))
    # other tenants' organization names: every spec in the folder plus Meridian
    orgs = ["Meridian Standards Foundation"]
    for f in glob.glob(os.path.join(SPECS, "*.json")):
        with open(f, encoding="utf-8") as fh:
            orgs.append((json.load(fh).get("info") or {}).get("org"))
    bad = 0
    for f, spec in specs:
        pack, E, W = build(spec, orgs)
        name = os.path.relpath(f, ROOT)
        for w in W:
            print("  warn", w)
        if E:
            bad += 1
            print("FAIL", name, str(len(E)) + " errors")
            for e in E:
                print("  -", e)
            continue
        out = os.path.join(SRC, "mod_s_pack_" + pack["id"] + ".js")
        counts = ", ".join(k + " " + str(len(v)) for k, v in pack["rows"].items() if v)
        if check:
            print("ok", name, "(" + counts + ")")
            continue
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(emit(pack))
        print("wrote", os.path.relpath(out, ROOT), "(" + counts + ")")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
