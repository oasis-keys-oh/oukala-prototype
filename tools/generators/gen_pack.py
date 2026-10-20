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


# ======================================================================================================================
# PR-32 B0: generator rules for the 58 tenant entities (docs/data/entity-plan.md sections 3 and 4). The spec's "records"
# section holds the industry words (services, components, vendors, risks, controls, courses and so on); the rules below
# expand them into rows at the plan's demo volumes (hypothesis), linked to the pack's own people, projects, budget lines,
# objectives, metrics and processes. Rows carry the Meridian field names the screens read, plus part (which Meridian store
# the row mirrors; the same parts as src/mod_s_tenant_entities.js) and, where Meridian names a service, svcId as well.
# No "records" section: none of these entities is produced (the screens show a recorded gap, R18).
# The same link, owner and people rules are repeated in the browser by tools/tests/data_entities.js.
# ======================================================================================================================
import random, hashlib, datetime

TODAY = datetime.date(2026, 10, 6)  # fixed demo date (U.TODAY_ISO)
# real organizations and products a pack may not name (R32 spirit: fictional sample data only)
REAL = ["Epic", "Cerner", "Oracle", "Microsoft", "Azure", "Amazon", "AWS", "Google", "ServiceNow", "Salesforce", "SAP", "Workday",
        "Dell", "Cisco", "VMware", "NetApp", "Veeam", "Caterpillar", "Komatsu", "Siemens", "Honeywell", "Rockwell", "Intune", "Okta",
        "Atlassian", "Jira", "Slack", "Zoom", "Anthropic", "Claude", "OpenAI", "Splunk", "Datadog", "PagerDuty", "Meditech", "Kronos",
        "Joint Commission", "HIPAA", "MSHA", "SOC 2", "ISO 27001", "Medicare", "Medicaid", "Commvault", "Rubrik", "Cohesity", "Hitachi"]

# entity -> parts the pack may use (same names as the core parts in src/mod_s_tenant_entities.js)
PARTS = {
    "risks": ["enterprise", "control", "finance", "appetite"], "benefits": ["benefit"], "trace_links": ["node", "edge"], "scenarios": ["scenario"],
    "plan_tasks": ["task", "summary", "scenario"], "raid_items": ["raid"], "work_items": ["provider", "work", "action", "av", "reconcile"],
    "capacity": ["team"], "budget_requests": ["request"], "cost_centers": ["map", "dept"], "vendors": ["vendor", "profile"],
    "ledger_entries": ["entry", "spend", "provider"], "contracts": ["contract"], "purchase_orders": ["po"], "timesheets": ["sheet", "receipt", "requisition"],
    "approval_policies": ["doa", "control", "rule", "binding", "budget", "version", "invoice"],
    "finance_policies": ["rule", "event", "source", "color", "driver", "policy", "ladder", "release", "split", "log"],
    "services": ["service", "offering"], "config_items": ["item", "relation", "asset", "history"], "changes": ["change", "cab"],
    "knowledge_articles": ["article", "prompt", "suite", "unanswered", "source", "suggestion", "improvement", "run"], "incidents": ["incident"],
    "service_requests": ["request", "demand"], "catalog_items": ["item", "group", "guide", "lane"],
    "monitors": ["rule", "script", "run", "automation", "synthetic", "window", "dashboard", "mark"], "problems": ["problem", "known_error"],
    "service_levels": ["slo", "agreement"], "events": ["log", "service", "live"], "rotas": ["rota", "escalation"],
    "ops_automations": ["run", "audit", "source", "precedence", "rejected", "rule", "task", "campaign"], "service_tasks": ["task"],
    "service_policies": ["approval", "template", "override"], "agents": ["agent", "platform", "people", "contract"],
    "access_grants": ["role", "grant", "request", "run"], "audit_log": ["audit", "store", "ownership", "permission"],
    "controls": ["control", "test", "attestation", "admin"], "audits": ["audit", "finding"], "policies": ["policy", "exception", "access", "retention", "hold"],
    "role_assignments": ["role", "ownership"], "org_units": ["domain"], "teams": ["team"], "skills": ["claim", "custom", "agent"],
    "learning": ["course", "enrollment", "path", "xapi"], "leave": ["leave"], "rooms": ["room", "booking"], "forums": ["forum"],
    "meetings": ["meeting", "series", "extracted", "agenda", "minutes"], "decisions": ["meeting", "log", "finance", "forum", "design"],
    "action_items": ["action"], "conversations": ["thread"], "capabilities": ["capability", "horizon"], "applications": ["application"],
    "tech_debt": ["task"], "builds": ["app", "level"],
    "tenant_settings": ["flag", "model", "seat", "token", "package", "kit", "language", "route", "review", "form", "field"],
    "connectors": ["connection", "mapping", "run", "event", "integration", "mcp", "hook", "key", "dlq"],
    "reports": ["report", "schedule", "run", "chart", "library", "dashboard"], "decision_tables": ["table"]}
KEYS = {"capacity": "team", "cost_centers": "code"}
# links: (field, target entity, match field or None for the key, part or None for every part)
LINKS = {
    "risks": [("proj", "projects", None, None), ("ctl", "controls", None, "control"), ("proc", "processes", None, "control"), ("met", "metrics", None, "control"), ("svc", "services", None, "control"), ("vend", "vendors", None, "control")],
    "benefits": [("p", "projects", None, None), ("obj", "objectives", None, None)],
    "trace_links": [("from", "trace_links", None, "edge"), ("to", "trace_links", None, "edge")],
    "scenarios": [("slipProj", "projects", None, None)],
    "plan_tasks": [("p", "projects", None, None), ("parent", "plan_tasks", None, None), ("pred", "plan_tasks", None, None)],
    "raid_items": [("p", "projects", None, None), ("task", "plan_tasks", None, None)],
    "work_items": [("pr", "projects", None, None)],
    "budget_requests": [("proj", "projects", None, None), ("line", "budget_lines", None, None), ("obj", "objectives", None, None), ("cc", "cost_centers", None, None)],
    "ledger_entries": [("p", "projects", None, None), ("line", "budget_lines", None, None)],
    "contracts": [("v", "vendors", None, None), ("proj", "projects", None, None), ("line", "budget_lines", None, None)],
    "purchase_orders": [("v", "vendors", None, None), ("ct", "contracts", None, None), ("line", "budget_lines", None, None)],
    "timesheets": [("po", "purchase_orders", None, None), ("line", "budget_lines", None, "requisition"), ("v", "vendors", None, "requisition")],
    "approval_policies": [("grp", "teams", None, None), ("rule", "approval_policies", None, "binding"), ("ref", "catalog_items", None, "binding")],
    "finance_policies": [("color", "finance_policies", None, "rule")],
    "services": [("proj", "projects", None, "service"), ("obj", "objectives", "n", "service"), ("deps", "services", None, "service"), ("svc", "services", None, "offering")],
    "config_items": [("svc", "services", None, "item"), ("from", "config_items", None, "relation"), ("to", "config_items", None, "relation"), ("ci", "config_items", None, "asset")],
    "changes": [("svcId", "services", None, None), ("svc", "services", "n", "change"), ("cis", "config_items", None, None), ("inc", "incidents", None, None), ("prb", "problems", None, None), ("proj", "projects", None, None), ("chg", "changes", None, "cab")],
    "knowledge_articles": [("svcId", "services", None, None)],
    "incidents": [("svcId", "services", None, None), ("svc", "services", "n", None), ("ci", "config_items", None, None), ("prb", "problems", None, None), ("chg", "changes", None, None), ("kb", "knowledge_articles", None, None)],
    "service_requests": [("item", "catalog_items", None, "request"), ("svcId", "services", None, None)],
    "catalog_items": [("svcId", "services", None, None), ("grp", "teams", None, "item")],
    "monitors": [("svcId", "services", None, "rule"), ("svc", "services", None, "script"), ("cis", "config_items", None, "script"), ("sc", "monitors", None, "run"), ("rule", "monitors", None, "run"), ("ci", "config_items", None, "run")],
    "problems": [("svcId", "services", None, None), ("chg", "changes", None, "problem"), ("kb", "knowledge_articles", None, "problem"), ("prb", "problems", None, "known_error")],
    "service_levels": [("svc", "services", None, "slo")],
    "rotas": [("rota", "rotas", None, "escalation")],
    "ops_automations": [("src", "connectors", None, "run")],
    "service_tasks": [("from", "incidents", None, None)],
    "service_policies": [("grp", "teams", None, "approval"), ("svcId", "services", None, "template"), ("cis", "config_items", None, "template")],
    "agents": [("proc", "processes", None, "agent"), ("person", "people", None, "agent")],
    "access_grants": [("set", "access_grants", None, "grant")],
    "controls": [("risks", "risks", None, "control"), ("proc", "processes", None, "control"), ("met", "metrics", None, "control"), ("ctl", "controls", None, "test"), ("ctls", "controls", None, "attestation")],
    "audits": [("ctl", "controls", None, None), ("risk", "risks", None, "finding"), ("aud", "audits", None, "finding")],
    "policies": [("ctl", "controls", None, None), ("ref", "policies", None, "exception")],
    "learning": [("course", "learning", None, "enrollment")],
    "rooms": [("room", "rooms", None, "booking")],
    "meetings": [("series", "meetings", None, "meeting"), ("link", "projects", None, "meeting")],
    "decisions": [("mid", "meetings", None, "meeting"), ("raid", "raid_items", None, "meeting")],
    "action_items": [("mid", "meetings", None, None), ("raid", "raid_items", None, None)],
    "capabilities": [("parent", "capabilities", None, "capability"), ("objs", "objectives", None, "capability"), ("svcs", "services", None, "capability")],
    "applications": [("vid", "vendors", None, None), ("svc", "services", None, None)],
    "connectors": [("conn", "connectors", None, "mapping")]}
# owner and a different backup (R12): (part or None, owner field, backup field)
PAIRS = {
    "risks": [("enterprise", "own", "bak"), ("control", "own", "bak"), ("finance", "owner", "backup")], "benefits": [(None, "own", "bak")],
    "raid_items": [(None, "own", "bak")], "budget_requests": [(None, "req", "sp")], "cost_centers": [("map", "owner", "backup")],
    "vendors": [("vendor", "own", "bak")], "contracts": [(None, "own", "bak")], "approval_policies": [("rule", "owner", "backup")],
    "finance_policies": [("policy", "owner", "backup")], "services": [("service", "owner", "backup")], "changes": [("change", "own", "req")],
    "knowledge_articles": [("article", "own", "rvw")], "incidents": [(None, "own", "bak")], "problems": [("problem", "owner", "backup")],
    "service_policies": [("template", "owner", "backup")], "agents": [("agent", "owner", "bak")], "controls": [("control", "own", "bak")],
    "audits": [("audit", "lead", "bak"), ("finding", "own", "bak")], "policies": [("policy", "own", "bak"), ("exception", "own", "bak")],
    "role_assignments": [("ownership", "owner", "backup")], "learning": [("course", "owner", "backup")], "applications": [(None, "own", "bak")],
    "builds": [("app", "owner", "builder")], "connectors": [("connection", "owner", "backup")], "reports": [("report", "owner", "backup")],
    "decision_tables": [(None, "owner", "backup")]}
# a person in the pack: (part or None, field, "name" or "id")
PEOPLE_F = {
    "trace_links": [("node", "owner", "name")], "plan_tasks": [(None, "own", "name")], "work_items": [("work", "owner", "name")],
    "purchase_orders": [(None, "cBy", "name")], "timesheets": [("sheet", "person", "name"), ("sheet", "approver", "name"), ("requisition", "requester", "name")],
    "config_items": [("item", "owner", "name"), ("asset", "who", "name")], "service_requests": [("request", "requester", "name")],
    "monitors": [("script", "own", "name")], "service_levels": [(None, "own", "name")], "events": [("log", "actor", "name")],
    "service_tasks": [(None, "who", "name")], "access_grants": [("grant", "person", "name"), ("grant", "by", "name")], "audit_log": [("store", "by", "name")],
    "controls": [("test", "tester", "name"), ("attestation", "person", "name")], "org_units": [(None, "ownerId", "id"), (None, "backupId", "id")],
    "teams": [(None, "mgr", "name")], "skills": [("claim", "person", "name")], "learning": [("enrollment", "person", "id")], "leave": [(None, "who", "id")],
    "rooms": [("booking", "host", "id")], "forums": [(None, "chair", "id")], "meetings": [(None, "chair", "name")], "decisions": [("meeting", "by", "name")],
    "action_items": [(None, "own", "name")], "capabilities": [("capability", "owner", "name")], "tech_debt": [(None, "owner", "name")]}
ENTITIES = list(PARTS.keys())  # the 58 entities, in plan order


def day(n):
    return (TODAY + datetime.timedelta(days=n)).isoformat()


def short_date(n):
    d = TODAY + datetime.timedelta(days=n)
    return d.strftime("%b ") + str(d.day)


def build_records(spec, rows, info, people, E, W):
    """Fill the 58 PR-32 entities from spec["records"]. Returns the entity names written (empty when the spec has no records)."""
    R = spec.get("records")
    if R is None:
        return []
    tid = spec.get("tenant") or "x"
    up = (spec.get("prefix") or tid[:2]).upper()
    H = [p["name"] for p in people if p["kind"] == "human"]
    BOTS = [p for p in people if p["kind"] in ("agent", "robot")]
    PID = {p["name"]: p["id"] for p in people}
    PBY = {p["name"]: p for p in people}
    org = spec.get("org") or {}
    fns = org.get("fns") or []
    lead = (org.get("lead") or {}).get("n")
    P, BL, O = rows["projects"], rows["budget_lines"], rows["objectives"]
    M, PR, INV = rows["metrics"], rows["processes"], rows["invoices"]
    if not (P and BL and O and M and PR and H):
        E.append("records: projects, budget lines, objectives, metrics, processes and people come first")
        return []
    ONAME = {o["id"]: o["n"] for o in O}

    def rng(k):
        return random.Random(tid + ":" + k)

    def need(k, n=1):
        v = R.get(k)
        if not v or (isinstance(v, list) and len(v) < n):
            E.append("records." + k + ": at least " + str(n) + " entries are required")
            return []
        return v

    def other(o, i=0):
        """a different human for the backup: the manager when there is one, else the next person"""
        m = (PBY.get(o) or {}).get("mgr")
        if i == 0 and m in H and m != o:
            return m
        j = (H.index(o) + 1 + i) % len(H) if o in H else i % len(H)
        return H[j] if H[j] != o else H[(j + 1) % len(H)]

    def rot(i):
        return H[i % len(H)]

    def role_has(*words):
        for p in people:
            if p["kind"] == "human" and any(w in (p.get("role") or "").lower() for w in words):
                return p["name"]
        return None

    cfo = role_has("financial officer") or (fns[-1]["lead"]["n"] if fns else H[0])
    out = {}

    # ---------------- people and organization ----------------
    teams = []
    for i, f in enumerate(fns):
        teams.append({"id": up + "-TM" + str(i + 1), "part": "team", "n": f["n"], "mgr": f["lead"]["n"], "fn": f["n"]})
    fn_names = {f["n"] for f in fns}
    freq = {}
    for p in people:
        t = p.get("team")
        if p["kind"] == "human" and t and t not in fn_names and t != "Executive office":
            freq[t] = freq.get(t, 0) + 1
    for t in sorted(freq, key=lambda k: -freq[k])[:8 - len(teams)]:
        p = next(x for x in people if x["kind"] == "human" and x.get("team") == t)
        fn = next((f["n"] for f in fns if t in (f.get("teams") or [])), "")
        teams.append({"id": up + "-TM" + str(len(teams) + 1), "part": "team", "n": t, "mgr": p["name"], "fn": fn})
    out["teams"] = teams
    TID = {t["n"]: t["id"] for t in teams}

    def team_of(name, depth=0):
        t = (PBY.get(name) or {}).get("team")
        if t in TID:
            return TID[t]
        for f in fns:
            if t in (f.get("teams") or []) or f["lead"]["n"] == name:
                return TID.get(f["n"], teams[0]["id"])
        m = (PBY.get(name) or {}).get("mgr")
        if m and depth < 4:
            return team_of(m, depth + 1)
        return teams[0]["id"]

    def team_name(name):
        tid_ = team_of(name)
        return next(t["n"] for t in teams if t["id"] == tid_)

    r = rng("capacity")
    out["capacity"] = [{"team": t["n"], "part": "team", "hrs": r.choice([6, 7, 7.5, 8]), "fn": t["fn"], "label": "hypothesis"} for t in teams[:6]]

    units = []
    for f in fns:
        units.append((f["n"], f["lead"]["n"]))
    for f in fns:
        for t in f.get("teams") or []:
            if len(units) >= 15:
                break
            if not any(u[0] == t for u in units):
                o = next((p["name"] for p in people if p["kind"] == "human" and p.get("team") == t), f["lead"]["n"])
                units.append((t, o))
    out["org_units"] = [{"id": up + "-OU-" + slug(n), "part": "domain", "label": n, "aliases": [n.lower()], "ownerId": PID[o], "backupId": PID[other(o)]} for n, o in units]

    ccs = []
    for i, (n, o) in enumerate(units[:8]):
        code = up + "-CC-" + str(4100 + i * 10)
        ccs.append({"code": code, "part": "map", "name": n, "gl": "01." + str(4100 + i * 10), "owner": o, "backup": other(o), "units": [n], "st": "Active",
                    "note": "Cost center for " + n[0].lower() + n[1:] + "."})
    out["cost_centers"] = ccs

    # ---------------- vendors, contracts, purchase orders ----------------
    vseed = need("vendors", 8)
    inv_vendors = {v["vendor"] for v in INV}
    r = rng("vendors")
    vendors = []
    for i, v in enumerate(vseed):
        n, cat, cty = v[0], v[1], v[2]
        iv = next((x for x in INV if x["vendor"] == n), None)
        o = iv["own"] if iv else rot(i + 3)
        vendors.append({"id": up + "-V" + str(i + 1), "part": "vendor", "n": n, "cat": cat, "risk": r.choice(["Low", "Medium", "Medium", "High"]), "own": o, "bak": other(o),
                        "con": "Account team", "del": round(r.uniform(.62, .95), 2), "qual": round(r.uniform(.6, .95), 2), "resp": round(r.uniform(.55, .95), 2),
                        "tier": 1 if iv else 2, "last": day(-r.randint(40, 300)), "score": r.randint(58, 92), "data": cty + " scope", "cty": cty})
    for n in inv_vendors:
        if not any(v["n"] == n for v in vendors):
            E.append("records.vendors: invoice vendor " + n + " is missing")
    out["vendors"] = vendors
    VID = {v["n"]: v["id"] for v in vendors}

    r = rng("contracts")
    contracts = []
    for i, v in enumerate(vendors):
        iv = next((x for x in INV if x["vendor"] == v["n"]), None)
        proj = iv["p"] if iv else P[i % len(P)]["id"]
        line = iv["line"] if iv and iv.get("line") else next(b["id"] for b in BL if b["p"] == proj)
        tcv = r.randint(3, 40) * 25000
        contracts.append({"id": up + "-CT-" + str(101 + i), "part": "contract", "v": v["id"], "n": v["n"] + " " + v["cty"], "ty": v["cty"], "s": day(-r.randint(120, 500)),
                          "e": day(r.randint(200, 900)), "rn": day(r.randint(200, 900)), "rnTy": "Term end", "tcv": tcv, "ann": round(tcv / 3), "co": 0, "ntc": r.choice([30, 60, 90]),
                          "auto": r.random() < .3, "own": v["own"], "bak": v["bak"], "proj": proj, "line": line, "sla": r.choice([95, 98, 99]), "dec": "",
                          "label": "simulated"})
    out["contracts"] = contracts
    r = rng("po")
    pos = []
    for i in range(10):
        c = contracts[i % len(contracts)]
        line = next(b for b in BL if b["id"] == c["line"])
        ordv = r.randint(4, 30) * 10000
        rec = round(ordv * r.uniform(.3, 1))
        inv = round(rec * r.uniform(.8, 1.1))
        pos.append({"id": up + "-PO-" + str(7101 + i), "part": "po", "v": c["v"], "ct": c["id"], "d": line["n"], "ord": ordv, "rec": rec, "inv": inv, "paid": round(min(inv, rec) * r.uniform(.6, 1)),
                    "cBy": line["own"], "aBy": cfo, "rBy": line["bk"], "st": "Open" if rec < ordv else "Received", "line": line["id"], "date": day(-r.randint(20, 200))})
    out["purchase_orders"] = pos

    # ---------------- services, configuration items, assets ----------------
    sseed = need("services", 10)
    kinds = need("ci_kinds", 8)
    r = rng("services")
    services, offerings = [], []
    for i, s in enumerate(sseed):
        code, n, tier, o, b, offs, users, deps = s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]
        pj = s[8] if len(s) > 8 else None
        proj = [P[pj]["id"]] if isinstance(pj, int) and pj < len(P) else []
        obj = [ONAME[P[pj]["obj"]]] if proj else [O[i % len(O)]["n"]]
        sid = up + "-SVC-" + code
        tgt = {"Tier 1": 99.9, "Tier 2": 99.5}.get(tier, 99.0)
        services.append({"id": sid, "part": "service", "n": n, "tier": tier, "owner": o, "backup": b, "processOwner": b, "sme": [b, other(o, 1)], "users": users,
                         "avail": round(tgt - r.uniform(-.05, .5), 2), "tgt": tgt, "cost": r.randint(8, 90) * 1000, "obj": obj, "proj": proj, "offerings": offs,
                         "deps": [up + "-SVC-" + d for d in deps], "maturity": r.randint(1, 4), "matTgt": 3, "label": "simulated"})
        for j, on in enumerate(offs):
            offerings.append({"id": up + "-OFF-" + code + "-" + str(j + 1), "part": "offering", "svc": sid, "n": on, "unit": "per month", "price": r.randint(2, 40) * 100,
                              "sla": r.choice([4, 8, 24, 40]), "cat": tier, "label": "simulated"})
    out["services"] = services + offerings
    SV = {s["id"]: s for s in services}
    SNAME = {s["id"]: s["n"] for s in services}

    r = rng("cis")
    items, rels = [], []
    crit = {"Tier 1": "1 - Mission critical", "Tier 2": "2 - High"}
    for i, s in enumerate(services):
        code = s["id"].split("-SVC-")[1]
        ids = []
        for k, (cls_name, cls_code, tpl) in enumerate(kinds[:8]):
            cid = up + "-CI-" + code + "-" + str(k + 1)
            ids.append(cid)
            items.append({"id": cid, "part": "item", "name": tpl.replace("{s}", s["n"]), "class": cls_name, "cls": cls_code, "svc": s["id"], "env": "Production",
                          "status": "Operational", "owner": s["owner"] if k % 2 == 0 else s["backup"], "crit": crit.get(s["tier"], "3 - Medium"),
                          "uptime": round(r.uniform(99.0, 99.99), 2), "ip": "10." + str(20 + i) + "." + str(k + 1) + "." + str(r.randint(2, 250)),
                          "grp": team_name(s["owner"]), "isSvc": False})
        for a, b, rel in [(0, 1, "uses"), (0, 2, "runs on"), (1, 2, "runs on"), (3, 0, "connects to"), (2, 4, "connects to"), (1, 5, "uses"),
                          (6, 3, "connects to"), (2, 7, "located in"), (4, 7, "located in"), (5, 7, "located in"), (6, 4, "connects to")]:
            rels.append({"id": ids[a] + ">" + ids[b], "part": "relation", "from": ids[a], "to": ids[b], "rel": rel})
        s["_ci"] = ids
    for s in services:
        for d in s["deps"]:
            if d in SV and len(rels) < 120:
                rels.append({"id": s["_ci"][0] + ">" + SV[d]["_ci"][0], "part": "relation", "from": s["_ci"][0], "to": SV[d]["_ci"][0], "rel": "depends on"})
    i = 0
    while len(rels) < 120 and i < 200:
        a, b = services[i % len(services)], services[(i + 3) % len(services)]
        rid = a["_ci"][3] + ">" + b["_ci"][3]
        if not any(x["id"] == rid for x in rels):
            rels.append({"id": rid, "part": "relation", "from": a["_ci"][3], "to": b["_ci"][3], "rel": "sends to"})
        i += 1
    aseed = need("assets", 4)
    sites = need("sites", 2)
    assets = []
    for i in range(60):
        who = rot(i)
        cls_name, model = aseed[i % len(aseed)][0], aseed[i % len(aseed)][1]
        dev = services[i % len(services)]["_ci"][6] if i % 3 == 0 else ""
        assets.append({"id": up + "-AS-" + str(1001 + i), "part": "asset", "serial": up + format(0x5A00 + i * 37, "X"), "who": who, "loc": sites[i % len(sites)],
                       "ci": dev, "cls": cls_name, "model": model, "st": "In stock" if i % 9 == 8 else "In use", "cost": r.randint(6, 40) * 50, "bought": day(-r.randint(90, 1100))})
    out["config_items"] = items + rels + assets

    # ---------------- knowledge, problems, changes, incidents ----------------
    r = rng("kb")
    kb = []
    for i, t in enumerate(need("kb", 18)):
        s = services[i % len(services)]
        kb.append({"id": up + "-KB0" + str(101 + i), "part": "article", "t": t, "type": ["How-to", "Troubleshooting", "Reference", "Procedure"][i % 4],
                   "st": "Draft" if i % 7 == 6 else ("Review" if i % 9 == 8 else "Published"), "aud": ["Staff"], "cls": "Internal", "svc": s["n"], "svcId": s["id"],
                   "topic": s["n"], "own": s["owner"], "rvw": s["backup"], "rev": day(-r.randint(20, 300)), "exp": day(r.randint(30, 360)), "views": r.randint(20, 900),
                   "reuse": r.randint(0, 60), "help": r.randint(55, 95), "ver": "1." + str(r.randint(0, 6))})
    for i in range(3):
        s = services[i]
        kb.append({"id": up + "-UQ-" + str(i + 1), "part": "unanswered", "q": "how do i get access to " + s["n"].lower(), "n": r.randint(4, 30), "aud": "Staff",
                   "last": short_date(-r.randint(0, 6)), "top": s["n"], "draft": ""})
    out["knowledge_articles"] = kb
    KBS = lambda sid: [k["id"] for k in kb if k.get("svcId") == sid and k["part"] == "article"]

    r = rng("changes")
    CHG_T = ["Patch the {s} servers", "Upgrade {s} to the next release", "Add a second node to the {s} interface", "Renew the {s} certificates",
             "Move {s} storage to the new array", "Change the {s} backup schedule", "Apply the vendor fix for {s} slowness", "Retire the old {s} interface"]
    changes = []
    for i in range(15):
        s = services[i % len(services)]
        st = ["Authorize", "Scheduled", "Implement", "Review", "Closed", "New", "Assess"][i % 7]
        c0 = {"Closed": -r.randint(8, 30), "Review": -r.randint(1, 6), "Implement": 0}.get(st, r.randint(2, 20))
        changes.append({"id": up + "-CHG0" + str(301 + i), "part": "change", "t": CHG_T[i % len(CHG_T)].replace("{s}", s["n"]),
                        "type": ["Normal", "Standard", "Normal", "Emergency", "Normal"][i % 5], "svc": s["n"], "svcId": s["id"], "cis": [s["_ci"][0], s["_ci"][2]],
                        "st": st, "req": s["backup"], "own": s["owner"], "start": day(c0), "end": day(c0 + r.randint(0, 2)), "win": "Off-hours: 22:00 to 02:00",
                        "prb": "", "inc": "", "proj": (s["proj"] or [""])[0], "cost": r.randint(0, 12) * 1000, "env": "Production", "grp": team_name(s["owner"]),
                        "appr": "Approved" if st in ("Scheduled", "Implement", "Review", "Closed") else "Requested"})
    changes = [{k: v for k, v in c.items() if not (k == "proj" and v == "")} for c in changes]
    PRB_T = ["{s} slows down when many staff work at once", "{s} interface drops messages after a restart", "{s} sign-in fails for some staff each morning",
             "{s} nightly job overruns into the working day", "{s} reports show yesterday's data", "{s} storage fills faster than planned"]
    problems = []
    for i in range(6):
        s = services[i]
        ch = next((c for c in changes if c["svcId"] == s["id"]), None)
        k = KBS(s["id"])
        problems.append({"id": up + "-PRB0" + str(101 + i), "part": "problem", "t": PRB_T[i].replace("{s}", s["n"]), "svc": s["n"], "svcId": s["id"], "pr": 2 + i % 3,
                         "st": ["Root cause analysis", "Known error", "Fix in progress", "Root cause analysis", "Closed", "New"][i], "owner": s["owner"], "backup": s["backup"],
                         "opened": day(-r.randint(5, 80)), "users": r.randint(10, 400), "cause": "Under review" if i % 2 else "Capacity on the " + kinds[2][0].lower() + " tier",
                         "workaround": "Restart the " + kinds[3][0].lower() + " and tell staff to retry", "chg": ch["id"] if ch else "", "kb": k[0] if k else ""})
    for p_ in problems:
        if not p_["chg"]:
            del p_["chg"]
        if not p_["kb"]:
            del p_["kb"]
    for i in range(4):
        p_ = problems[i]
        problems.append({"id": up + "-KE0" + str(101 + i), "part": "known_error", "prb": p_["id"], "t": p_["t"], "svc": p_["svc"], "svcId": p_["svcId"],
                         "sym": "Staff see slow screens or errors on " + p_["svc"] + ".", "cause": p_["cause"], "wa": p_["workaround"], "st": "Published", "upd": day(-r.randint(1, 30))})
    out["problems"] = problems
    for c in changes:
        p_ = next((x for x in problems if x["part"] == "problem" and x["svcId"] == c["svcId"]), None)
        if p_:
            c["prb"] = p_["id"]
        else:
            del c["prb"]

    r = rng("incidents")
    INC_T = ["{s} slow for staff", "{c} not responding", "Interface queue backing up on {c}", "Staff cannot sign in to {s}", "{s} shows missing data",
             "Printing fails from {s}", "Scheduled job failed on {c}", "Disk space low on {c}", "{s} errors after the overnight change", "{c} running hot"]
    incs = []
    for i in range(20):
        s = services[(i * 3) % len(services)]
        k = i % 7
        ci = s["_ci"][k]
        cname = items[[x["id"] for x in items].index(ci)]["name"]
        t = R.get("major_incident") if i == 0 and R.get("major_incident") else INC_T[i % len(INC_T)].replace("{s}", s["n"]).replace("{c}", cname)
        ch = next((c for c in changes if c["svcId"] == s["id"]), None)
        pb = next((x for x in problems if x["part"] == "problem" and x["svcId"] == s["id"]), None)
        kk = KBS(s["id"])
        st = ["In progress", "New", "On hold", "Resolved", "In progress", "Closed", "Resolved"][i % 7] if i else "In progress"
        row = {"id": up + "-INC0" + str(501 + i), "part": "incident", "t": t, "d": t + ". Reported by staff; the service owner is informed.", "caller": rot(i + 5),
               "ch": ["Phone", "Portal", "Chat", "Monitoring"][i % 4], "svc": s["n"], "svcId": s["id"], "ci": ci, "urg": 1 if i == 0 else 2 + i % 2, "cat": ["Performance", "Availability", "Access", "Data"][i % 4],
               "grp": team_name(s["owner"]), "own": s["owner"], "bak": s["backup"], "st": st, "age": round(r.uniform(.3, 60), 1), "respH": round(r.uniform(.05, 2), 2),
               "resH": round(r.uniform(1, 30), 1) if st in ("Resolved", "Closed") else None, "maj": i == 0}
        if ch:
            row["chg"] = ch["id"]
        if pb:
            row["prb"] = pb["id"]
        if kk:
            row["kb"] = kk[0]
        incs.append(row)
    out["incidents"] = incs
    for c in changes:
        ic = next((x for x in incs if x["svcId"] == c["svcId"]), None)
        if ic:
            c["inc"] = ic["id"]
        else:
            del c["inc"]
    for i in range(3):
        c = changes[i]
        changes.append({"id": up + "-CAB-" + str(i + 1), "part": "cab", "chg": c["id"], "by": other(c["own"]), "st": "approved", "note": "Change board approved " + c["id"], "at": short_date(-i) + " 10:30"})
    out["changes"] = changes

    # ---------------- catalog, requests, monitoring, service levels ----------------
    r = rng("catalog")
    cat = []
    for i, c in enumerate(need("catalog", 14)):
        s = services[i % len(services)]
        cat.append({"id": up + "-CAT-" + str(i + 1), "part": "item", "n": c[0], "cat": c[1], "svc": s["n"], "svcId": s["id"], "off": (s["offerings"] or [""])[0], "short": c[2],
                    "est": r.choice(["1 business day", "2 business days", "3 business days", "5 business days"]), "slaH": r.choice([8, 16, 24, 40]), "vars": [],
                    "pr": r.choice([0, 0, 0, 150, 400]), "appr": ["Manager"] if i % 3 else ["Manager", "Service owner"], "grp": team_of(s["owner"])})
    out["catalog_items"] = cat
    r = rng("requests")
    reqs = []
    for i in range(60):
        c = cat[i % len(cat)]
        st = ["new", "approving", "fulfilling", "fulfilled", "closed", "fulfilling"][i % 6]
        reqs.append({"id": up + "-SR00" + str(10001 + i), "part": "request", "req": up + "-REQ00" + str(20001 + i), "item": c["id"], "service": c["svc"], "svcId": c["svcId"],
                     "offering": c["off"], "requester": rot(i * 7), "onBehalfOf": None, "state": st, "pr": 3, "price": c["pr"], "created": day(-r.randint(0, 30)),
                     "sl": "breached" if i % 11 == 10 else "on track", "cost": c["pr"], "slaTgt": c["slaH"]})
    out["service_requests"] = reqs

    r = rng("monitors")
    MON_R = [("CPU high on {c}", "cpu", 2), ("Disk space low on {c}", "disk", 2), ("Interface queue backing up on {c}", "queue", 3), ("Response time over target on {s}", "lat", 0),
             ("Certificate expiring on {c}", "cert", 2), ("Backup job failed on {c}", "backup", 5), ("Error rate over target on {s}", "err", 0), ("Memory pressure on {c}", "mem", 2),
             ("Service not responding on {c}", "up", 0), ("Sign-in failures rising on {s}", "auth", 0)]
    mons = []
    for i, (tpl, m, k) in enumerate(MON_R):
        s = services[i % len(services)]
        c = items[[x["id"] for x in items].index(s["_ci"][k])]
        mons.append({"id": up + "-AR" + str(i + 1).zfill(2), "part": "rule", "n": tpl.replace("{s}", s["n"]).replace("{c}", c["name"]), "m": m, "cls": [c["class"]], "kind": "static",
                     "op": ">", "warn": 80, "crit": 92, "forMin": r.choice([5, 10, 15]), "on": i != 7, "own": team_name(s["owner"]), "svcId": s["id"]})
    SC_T = [("Restart the {c} service", 0), ("Clear the {c} queue", 3), ("Fail over {s} to the standby node", 2), ("Free disk space on {c}", 2),
            ("Renew the certificate on {c}", 4), ("Rerun the failed backup on {c}", 5), ("Recycle the {s} application", 0), ("Collect diagnostics from {c}", 2)]
    agent0 = BOTS[0]["name"] if BOTS else ""
    for i, (tpl, k) in enumerate(SC_T):
        s = services[i % len(services)]
        c = items[[x["id"] for x in items].index(s["_ci"][k])]
        mons.append({"id": up + "-SC-" + str(i + 1).zfill(2), "part": "script", "n": tpl.replace("{s}", s["n"]).replace("{c}", c["name"]), "risk": ["Low", "Medium", "Low", "High"][i % 4],
                     "svc": s["id"], "cls": [c["class"]], "cis": [c["id"]], "own": s["owner"], "lvl": 1 + i % 3, "agent": agent0 if i % 2 else ""})
    scripts = [x for x in mons if x["part"] == "script"]
    rules = [x for x in mons if x["part"] == "rule"]
    for i in range(20):
        sc = scripts[i % len(scripts)]
        mons.append({"id": up + "-EX-" + str(2001 + i), "part": "run", "sc": sc["id"], "rule": rules[i % len(rules)]["id"], "ci": sc["cis"][0], "svc": sc["svc"],
                     "mode": "Deterministic", "dry": i % 6 == 5, "st": ["Completed", "Completed", "Failed", "Completed", "Awaiting approval"][i % 5],
                     "by": sc["agent"] or sc["own"], "appr": [{"who": other(sc["own"])}], "start": 600 + i * 7, "end": 603 + i * 7})
    out["monitors"] = mons

    SLO_T = ["{s} available to staff", "{s} pages load in under three seconds", "{s} messages delivered within a minute", "{s} sign-in works first time",
             "{s} reports ready by 07:00", "{s} backups complete every night", "{s} searches return in two seconds", "{s} interfaces up during clinic hours"]
    slv = []
    for i in range(8):
        s = services[i]
        slv.append({"id": up + "-SL" + str(i + 1), "part": "slo", "n": SLO_T[i].replace("{s}", s["n"]), "svc": s["id"], "tgt": s["tgt"],
                    "sli": "Share of 5-minute periods that meet the objective", "own": s["owner"], "good": [{"ci": s["_ci"][0], "m": "err", "op": "<", "th": 2}], "label": "simulated"})
    AG_T = [("Incident P1: restore service", "SLA", "incident", 4), ("Incident P2: restore service", "SLA", "incident", 8), ("Incident P3: resolve", "SLA", "incident", 24),
            ("Incident P1: first response", "SLA", "incident", .25), ("Request: fulfil standard requests", "SLA", "request", 40), ("Request: approve within a day", "OLA", "request", 8),
            ("Change: emergency review", "OLA", "change", 2), ("Change: normal review", "OLA", "change", 72), ("Problem: root cause within ten days", "OLA", "problem", 240),
            ("Knowledge: review flagged articles", "OLA", "knowledge", 120)]
    for i, (n, ty, tbl, hrs) in enumerate(AG_T):
        o = services[i % len(services)]["owner"]
        slv.append({"id": up + "-SLA-" + str(i + 1).zfill(2), "part": "agreement", "n": n, "ty": ty, "tbl": tbl, "kind": "duration", "target": {"hours": hrs}, "goal": 95,
                    "proc": tbl, "own": o, "st": "Active", "party": team_name(o)})
    for i, v in enumerate([x for x in vendors if x["tier"] == 1][:2]):
        slv.append({"id": up + "-UC-" + str(i + 1), "part": "agreement", "n": "Vendor: " + v["n"] + " restores its service", "ty": "UC", "tbl": "incident", "kind": "duration",
                    "target": {"hours": 8}, "goal": 95, "proc": "incident", "own": v["own"], "st": "Active", "party": v["n"]})
    out["service_levels"] = slv

    # ---------------- rotas, service tasks, policies, automation runs ----------------
    rotas = []
    for i in range(6):
        s = services[i]
        mem = [s["owner"], s["backup"], other(s["owner"], 2)]
        rotas.append({"id": up + "-RO" + str(i + 1), "part": "rota", "n": s["n"] + " on-call", "scope": "service", "target": s["n"], "tier": s["tier"], "sla": {"respMin": 15 if s["tier"] == "Tier 1" else 30},
                      "layers": [{"id": "L1", "kind": "rot", "tier": "Primary", "n": "Weekly primary", "members": mem, "len": 168, "days": [0, 1, 2, 3, 4, 5, 6], "from": 0, "to": 24},
                                 {"id": "L2", "kind": "rot", "tier": "Secondary", "n": "Weekly secondary", "members": mem[::-1], "len": 168, "days": [0, 1, 2, 3, 4, 5, 6], "from": 0, "to": 24}]})
    for i in range(4):
        ro = rotas[i]
        rotas.append({"id": up + "-ES-" + str(i + 1), "part": "escalation", "n": ro["n"] + ": P1 and P2", "rota": ro["id"], "sev": "P1 and P2",
                      "lv": [{"w": "Primary on-call", "kind": "human", "wait": 0, "ch": ["Push"]}, {"w": "Secondary on-call", "kind": "human", "wait": 15, "ch": ["Push", "SMS"]},
                             {"w": ro["layers"][0]["members"][0], "kind": "human", "wait": 30, "ch": ["Phone"]}]})
    out["rotas"] = rotas
    ST_T = ["Add an alert on queue depth for {c}", "Write the post-incident review for {i}", "Update the knowledge article after {i}", "Test the restore of {c}",
            "Confirm the vendor fix for {i} is in production", "Review the on-call hand-over notes for {i}"]
    out["service_tasks"] = []
    for i in range(6):
        ic = incs[i]
        c = items[[x["id"] for x in items].index(ic["ci"])]
        out["service_tasks"].append({"id": up + "-T-" + str(9001 + i), "part": "task", "t": ST_T[i].replace("{c}", c["name"]).replace("{i}", ic["id"]), "who": ic["own"],
                                     "due": day(3 + i * 2), "from": ic["id"], "done": i % 3 == 2})
    AP_T = [("Standard change from an approved template", ["Standard"], "parallel"), ("Normal change on a Tier 1 service", ["Normal"], "sequence"),
            ("Normal change on a Tier 2 or Tier 3 service", ["Normal"], "parallel"), ("Emergency change", ["Emergency"], "parallel"),
            ("Change inside a freeze window", ["Normal", "Emergency"], "sequence"), ("Change that touches patient or customer data", ["Normal"], "sequence"),
            ("Change with a vendor on site", ["Normal"], "parallel"), ("Change rolled back once before", ["Normal"], "sequence")]
    sp = []
    for i, (n, ty, mode) in enumerate(AP_T):
        tm = teams[i % len(teams)]
        sp.append({"id": up + "-AP" + str(i + 1), "part": "approval", "n": n, "on": True, "stop": i == 0, "auto": i == 0, "cond": {"type": ty}, "by": [tm["n"]], "grp": tm["id"],
                   "mode": mode, "quorum": "all", "why": "Matches the risk of the change to the people who must agree."})
    for i in range(4):
        s = services[i]
        sp.append({"id": up + "-TPL0" + str(i + 1), "part": "template", "n": "Monthly patching for " + s["n"], "svc": s["n"], "svcId": s["id"], "cis": [s["_ci"][2]],
                   "steps": "Snapshot, patch in two waves, restart, run the health checks.", "back": "Revert to the snapshot.", "freq": "Monthly", "dur": 120,
                   "owner": s["owner"], "backup": s["backup"], "st": "Active"})
    out["service_policies"] = sp

    # ---------------- risks, controls, audits, policies ----------------
    rk = need("risks", 1)
    rk = rk if isinstance(rk, dict) else {}
    r = rng("risks")
    risks = []
    for i, x in enumerate(rk.get("enterprise") or []):
        p_ = P[x[2] % len(P)] if len(x) > 2 else P[i % len(P)]
        risks.append({"id": up + "-RK" + str(i + 1), "part": "enterprise", "n": x[0], "cat": x[1], "proj": p_["id"], "own": p_["owner"], "bak": p_["backup"], "mit": p_["owner"],
                      "plan": "Mitigation owned by " + p_["owner"] + " and reviewed each month.", "p": r.randint(2, 5), "amt": r.randint(4, 40) * 10000,
                      "st": ["Open", "Mitigating", "Watching"][i % 3], "rec": "Review at the next steering meeting", "label": "simulated"})
    ctl_seed = need("controls", 1)
    ctl_seed = ctl_seed if isinstance(ctl_seed, dict) else {}
    fws = ctl_seed.get("fw") or ["Internal control framework"]
    clist = ctl_seed.get("list") or []
    if len(clist) < 20:
        E.append("records.controls.list: 20 controls are required")
    cids = [up + "-CTL-" + str(i + 1).zfill(3) for i in range(len(clist))]
    for i, x in enumerate(rk.get("control") or []):
        p_ = P[i % len(P)]
        pr_ = PR[i % len(PR)]
        s = services[i % len(services)]
        risks.append({"id": up + "-GR-" + str(101 + i), "part": "control", "t": x[0], "cat": x[1], "own": pr_["owner"], "bak": pr_["backup"], "il": r.randint(2, 5), "ii": r.randint(2, 5),
                      "rl": r.randint(1, 4), "ri": r.randint(1, 4), "st": ["Treating", "Assessing", "Accepted", "Treating", "Monitoring", "Treating"][i % 6], "src": "Enterprise",
                      "ctl": [c for c in (cids[(i * 3) % max(1, len(cids))], cids[(i * 3 + 1) % max(1, len(cids))]) if cids], "proc": pr_["id"], "met": (pr_.get("metrics") or [M[0]["id"]])[0],
                      "proj": p_["id"], "vend": vendors[i % len(vendors)]["id"], "svc": s["id"], "plan": "Test the linked controls this quarter.", "due": day(20 + i * 9)})
    for i, t in enumerate(rk.get("finance") or []):
        risks.append({"id": up + "-FR" + str(i + 1).zfill(2), "part": "finance", "t": t, "why": "Affects the forecast for " + P[i % len(P)]["n"] + ".", "owner": cfo, "backup": other(cfo),
                      "st": ["Open", "Mitigated", "Open", "Watching"][i % 4], "ctl": "Monthly forecast review with the budget owners.", "due": day(30 + i * 15), "proj": P[i % len(P)]["id"]})
    for c, lvl in rk.get("appetite") or []:
        risks.append({"id": c, "part": "appetite", "cat": c, "level": lvl})
    if len([x for x in risks if x["part"] != "appetite"]) < 16:
        E.append("records.risks: 6 enterprise, 6 control and 4 finance risks are required")
    out["risks"] = risks
    crisks = [x for x in risks if x["part"] == "control"]

    r = rng("controls")
    ctls = []
    for i, (t, freq) in enumerate(clist):
        pr_ = PR[i % len(PR)]
        fw = fws[i % len(fws)]
        ref = "".join(w[0] for w in fw.split()[:3]).upper() + "-" + str(i + 1).zfill(2)
        ctls.append({"id": cids[i], "part": "control", "ref": ref, "t": t, "fw": fw, "maps": [fw + ": " + ref], "own": pr_["owner"], "bak": pr_["backup"], "freq": freq,
                     "last": day(-r.randint(5, 100)), "res": ["Effective", "Effective", "Needs improvement", "Effective", "Not tested"][i % 5], "ev": [],
                     "risks": [x["id"] for x in crisks if cids[i] in x["ctl"]], "proc": pr_["id"], "met": (pr_.get("metrics") or [M[0]["id"]])[0], "src": "Control library", "st": "Active"})
    for i in range(12):
        c = ctls[i % len(ctls)] if ctls else None
        if not c:
            break
        ctls.append({"id": up + "-TST-Q4-" + str(i + 1).zfill(2), "part": "test", "ctl": c["id"], "cycle": "TC-2026Q4", "tester": other(c["own"], 1), "due": day(5 + i * 3),
                     "st": ["In testing", "Planned", "Passed", "Failed", "Passed", "Planned"][i % 6], "res": "", "notes": "", "ev": []})
    owners = []
    for c in [x for x in ctls if x["part"] == "control"]:
        if c["own"] not in owners:
            owners.append(c["own"])
    for i, o in enumerate(owners[:8]):
        ctls.append({"id": up + "-ATT-Q4-" + str(i + 1).zfill(2), "part": "attestation", "cycle": "ATT-2026Q4", "person": o,
                     "ctls": [c["id"] for c in ctls if c["part"] == "control" and c["own"] == o][:3], "st": ["Attested", "Open", "Overdue", "Attested"][i % 4], "at": "", "note": ""})
    out["controls"] = ctls
    cc_ = [c for c in ctls if c["part"] == "control"]

    r = rng("audits")
    auds = []
    for i, (t, kind, firm) in enumerate(need("audits", 3)):
        o = cc_[i]["own"] if cc_ else H[0]
        auds.append({"id": up + "-AUD-2026-0" + str(i + 1), "part": "audit", "t": t, "kind": kind, "firm": firm, "lead": o, "bak": other(o), "period": "Jan 1 to Sep 30, 2026",
                     "st": ["Fieldwork", "Planning", "Reporting"][i % 3], "start": day(-r.randint(10, 60)), "fw": fws[i % len(fws)], "ctl": [c["id"] for c in cc_[i * 4:i * 4 + 4]], "reqs": r.randint(8, 40)})
    audit_rows = list(auds)
    for i, t in enumerate(need("findings", 10)):
        c = cc_[i % len(cc_)] if cc_ else {"id": "", "own": H[0], "bak": H[1]}
        a = auds[i % len(auds)] if auds else {"id": ""}
        audit_rows.append({"id": up + "-FND-" + str(101 + i), "part": "finding", "t": t, "src": "Audit" if i % 2 == 0 else "Control test", "sref": c["id"], "sev": ["High", "Medium", "Low", "Medium"][i % 4],
                           "own": c["own"], "bak": c["bak"], "due": day(10 + i * 8), "st": ["In remediation", "Open", "Closed", "In remediation", "Open"][i % 5], "ctl": c["id"],
                           "risk": crisks[i % len(crisks)]["id"] if crisks else "", "aud": a["id"], "opened": day(-r.randint(10, 90))})
    out["audits"] = audit_rows

    r = rng("policies")
    pols = []
    for i, t in enumerate(need("policies", 8)):
        c = cc_[i % len(cc_)]
        pols.append({"id": up + "-POL-" + str(i + 1).zfill(3), "part": "policy", "t": t, "own": c["own"], "bak": c["bak"], "cycle": 12, "aud": "All staff", "req": len(H), "done": len(H) - r.randint(0, 6),
                     "vers": [{"v": "2." + str(i % 4), "date": day(-r.randint(30, 300)), "by": c["own"]}], "ctl": [c["id"], cc_[(i + 1) % len(cc_)]["id"]], "nextRev": day(r.randint(30, 300))})
    for i, t in enumerate(need("exceptions", 5)):
        p_ = pols[i % len(pols)]
        req = other(p_["own"], 2)
        pols.append({"id": up + "-EXC-" + str(101 + i), "part": "exception", "t": t, "kind": "Policy exception", "ref": p_["id"], "req": req, "own": req, "bak": other(req),
                     "appr": p_["own"], "exp": day(30 + i * 30), "st": ["Approved", "Requested", "Approved", "Expired", "Approved"][i], "why": "Temporary, until the fix is in place.", "ctl": p_["ctl"][:1]})
    out["policies"] = pols

    # ---------------- agents and access ----------------
    r = rng("agents")
    ags = []
    for i, b in enumerate(BOTS):
        sp_ = b.get("sponsor") or H[0]
        pr_ = next((x for x in PR if x["owner"] == sp_ or x["backup"] == sp_), PR[i % len(PR)])
        ags.append({"id": up + "-AG" + str(i + 1), "part": "agent", "n": b["name"], "person": b["id"], "kind": b["kind"], "model": "Platform model (standard)" if b["kind"] == "agent" else "No model (rules)",
                    "auto": {"suggest": 1, "draft": 1, "act": 2}.get(b.get("tier"), 1), "tier": b.get("tier") or ("rules" if b["kind"] == "robot" else "suggest"),
                    "runs": r.randint(20, 400), "spend": round(r.uniform(2, 40), 1), "cap$": 50, "st": "running" if i % 5 != 4 else "paused", "owner": sp_, "bak": other(sp_),
                    "tools": ["Read records", "Draft for review"] if b["kind"] == "agent" else ["Run checks"], "purpose": b.get("does") or b.get("role") or "", "proc": pr_["id"],
                    "act": b.get("role") or "", "hrs": b.get("hrs"), "label": "simulated"})
    out["agents"] = ags
    ROLES_A = [("Platform admin", ["view", "edit", "config", "secadm"]), ("Executive", ["view", "fin", "approve"]), ("Finance approver", ["view", "fin", "approve"]),
               ("Service owner", ["view", "edit"]), ("Process owner", ["view", "edit", "config"]), ("Analyst", ["view", "export"]), ("Auditor (read only)", ["view", "restricted"]),
               ("Agent sponsor", ["view", "agents"])]
    acc = [{"id": up.lower() + "-role-" + slug(n), "part": "role", "n": n, "caps": caps} for n, caps in ROLES_A]
    admin = role_has("information officer", "informatics", "security") or H[0]
    for i in range(10):
        pe = rot(i * 3 + 1)
        acc.append({"id": up + "-GR-" + str(i + 1), "part": "grant", "person": pe, "set": acc[2 + i % 6]["id"], "by": admin if pe != admin else other(admin), "at": day(-r.randint(1, 60)),
                    "exp": day(r.randint(10, 90)) if i % 3 == 0 else "", "why": ["Covering the quarter close", "New service owner", "Audit fieldwork", "Project role", "Agent sponsor for a pilot"][i % 5]})
    out["access_grants"] = acc

    # ---------------- strategy: benefits, scenarios, trace links ----------------
    r = rng("benefits")
    out["benefits"] = []
    for i, (t, ty) in enumerate(need("benefits", 8)):
        p_ = P[i % len(P)]
        drv = {"hrs": r.randint(8, 80) * 100, "rate": r.randint(40, 95)} if "hour" in ty.lower() else {"amt": r.randint(5, 90) * 10000}
        out["benefits"].append({"id": up + "-BEN-" + str(i + 1), "part": "benefit", "p": p_["id"], "obj": p_["obj"], "n": t, "ty": ty, "own": p_["owner"], "bak": p_["backup"], "drv": drv,
                                "start": r.randint(2, 9), "conf": round(r.uniform(.5, .9), 1), "real": [], "ev": "Baseline measured before the project started", "why": "Counts toward " + ONAME[p_["obj"]].lower() + ".",
                                "label": "modeled"})
    bad = next((p_ for p_ in P if p_.get("health") == "bad"), next((p_ for p_ in P if p_.get("health") == "warn"), P[0]))
    out["scenarios"] = []
    for i, (n, note) in enumerate(need("scenarios", 3)):
        out["scenarios"].append({"id": up + "-SC" + str(i + 1), "part": "scenario", "n": n, "note": note, "env": info.get("fund", 1000), "slip": [0, 6, 0][i % 3], "slipProj": bad["id"],
                                 "cut": i == 2, "crash": i == 1, "label": "modeled"})
    nodes, edges = [], []
    for o in O:
        nodes.append({"id": o["id"], "part": "node", "t": "obj", "n": o["n"], "s": "good", "c": "confirmed", "owner": o["owner"], "story": o.get("story", ""), "ref": o["id"]})
    for p_ in P:
        nodes.append({"id": p_["id"], "part": "node", "t": "proj", "n": p_["n"], "s": p_.get("health", "good"), "c": "confirmed", "owner": p_["owner"], "story": p_.get("story", ""),
                      "amt": p_["bac"] * 1000, "ref": p_["id"]})
        edges.append({"id": p_["obj"] + ">" + p_["id"], "part": "edge", "from": p_["obj"], "to": p_["id"], "rel": "advances"})
        bl = max([b for b in BL if b["p"] == p_["id"]], key=lambda b: b["appr"])
        nodes.append({"id": bl["id"], "part": "node", "t": "bud", "n": bl["n"], "s": "warn" if bl["fcst"] > bl["appr"] else "good", "c": "confirmed", "owner": bl["own"], "story": bl.get("why", ""),
                      "amt": bl["appr"], "ref": bl["id"]})
        edges.append({"id": p_["id"] + ">" + bl["id"], "part": "edge", "from": p_["id"], "to": bl["id"], "rel": "funded by"})
    for v in INV:
        nodes.append({"id": v["id"], "part": "node", "t": "inv", "n": v["vendor"] + " " + v["id"], "s": {"pay": "good", "hold": "bad"}.get(v.get("rec"), "warn"), "c": "confirmed",
                      "owner": v["own"], "story": v.get("story", ""), "amt": v["amt"], "ref": v["id"]})
        tgt = v["line"] if any(n["id"] == v.get("line") for n in nodes) else v["p"]
        edges.append({"id": tgt + ">" + v["id"], "part": "edge", "from": tgt, "to": v["id"], "rel": "billed by"})
    for s in services[:2]:
        nodes.append({"id": s["id"], "part": "node", "t": "svc", "n": s["n"], "s": "good" if s["avail"] >= s["tgt"] else "warn", "c": "confirmed", "owner": s["owner"], "story": "", "ref": s["id"]})
        for pj in s["proj"]:
            edges.append({"id": pj + ">" + s["id"], "part": "edge", "from": pj, "to": s["id"], "rel": "changes"})
    for x in [x for x in risks if x["part"] == "enterprise"][:2]:
        nodes.append({"id": x["id"], "part": "node", "t": "risk", "n": x["n"], "s": "warn", "c": "confirmed", "owner": x["own"], "story": x["plan"], "ref": x["id"]})
        edges.append({"id": x["id"] + ">" + x["proj"], "part": "edge", "from": x["id"], "to": x["proj"], "rel": "threatens"})
    out["trace_links"] = nodes + edges

    # ---------------- portfolio: plan tasks, RAID, work items, budget requests ----------------
    TASK_T = ["Confirm scope and success measures for {s}", "Name the owner and backup for each {s} workstream", "Map the current process with the people who run it",
              "Design the new process and the hand-offs", "Configure and test the first {s} release", "Train the first group of staff", "Run the {s} pilot and record the results",
              "Fix what the pilot found", "Roll {s} out to every site", "{s} live and accepted"]
    DUR = [5, 3, 8, 10, 20, 6, 15, 8, 20, 0]
    r = rng("tasks")
    tasks = []
    for pi, p_ in enumerate(P):
        sh = p_.get("short") or p_["n"]
        s1, s2 = p_["id"] + "-S1", p_["id"] + "-S2"
        kids1, kids2 = [], []
        es = 0
        done_upto = round(p_.get("pct", 0) / 10)
        prev = None
        team = [p_["owner"], p_["backup"], other(p_["owner"], 2), other(p_["backup"], 3)]
        for k, tpl in enumerate(TASK_T):
            tid_ = p_["id"] + "-T" + str(k + 1).zfill(2)
            (kids1 if k < 4 else kids2).append(tid_)
            pct = 100 if k < done_upto else (r.choice([20, 40, 60]) if k == done_upto else 0)
            own = team[k % 4]
            row = {"id": tid_, "part": "task", "p": p_["id"], "n": tpl.replace("{s}", sh), "dur": DUR[k], "bdur": DUR[k], "pred": [prev] if prev else [], "pct": pct, "own": own,
                   "res": [], "asg": [[own, 100]], "lv": 2, "ms": 1 if k == 9 else 0, "es": es, "ef": es + DUR[k], "cost": DUR[k] * r.randint(2, 6), "ac": 0, "bcost": DUR[k] * 4,
                   "parent": s1 if k < 4 else s2, "wbs": ("1." if k < 4 else "2.") + str((k if k < 4 else k - 4) + 1), "oi": k}
            if pct > 0:
                row["as"] = es
            if pct == 100:
                row["af"] = es + DUR[k]
                row["ac"] = row["cost"]
            tasks.append(row)
            prev = tid_
            es += DUR[k]
        tasks.append({"id": s1, "part": "summary", "p": p_["id"], "n": sh + ": plan and design", "lv": 1, "sum": 1, "own": p_["owner"], "kids": kids1, "wbs": "1", "oi": 0})
        tasks.append({"id": s2, "part": "summary", "p": p_["id"], "n": sh + ": build and go live", "lv": 1, "sum": 1, "own": p_["backup"], "kids": kids2, "wbs": "2", "oi": 1})
    out["plan_tasks"] = tasks
    RAID_T = [("R", "{v} delivers late and the {s} milestone slips", "Weekly checkpoint with {v}; hold payment until the milestone is accepted."),
              ("A", "{s} staff are free for testing in the agreed weeks", "Confirm the release of staff with each manager two weeks ahead."),
              ("I", "{s} interface tests are failing", "Fix list agreed with the integration team; retest on Friday."),
              ("D", "Go live with {s} in two waves, not one", "Recorded at the steering meeting."),
              ("R", "Staff for {s} are pulled into daily operations", "Backfill two roles for the pilot weeks.")]
    r = rng("raid")
    raid = []
    for pi, p_ in enumerate(P):
        sh = p_.get("short") or p_["n"]
        iv = next((x for x in INV if x["p"] == p_["id"]), None)
        vn = iv["vendor"] if iv else vendors[pi % len(vendors)]["n"]
        for k, (t, n, mit) in enumerate(RAID_T):
            o = [p_["owner"], p_["backup"]][k % 2]
            raid.append({"id": up + "-R-" + str(101 + pi * 5 + k), "part": "raid", "t": t, "p": p_["id"], "n": n.replace("{s}", sh).replace("{v}", vn),
                         "d": "Raised in the " + sh + " project review.", "pr": r.randint(2, 5), "im": r.randint(2, 5), "cost": r.randint(0, 20) * 10, "own": o, "bak": other(o) if other(o) != o else p_["backup"],
                         "s": ["active", "active", "watch", "closed", "active"][k], "mit": mit.replace("{s}", sh).replace("{v}", vn), "due": day(5 + k * 7 + pi), "task": p_["id"] + "-T" + str(4 + k).zfill(2)})
    for x in raid:
        if x["bak"] == x["own"]:
            x["bak"] = other(x["own"], 1)
    out["raid_items"] = raid
    WI_T = [("Project task", "TASK", "Finish: {t}"), ("Review", "REVIEW", "Review the {s} design with the process owner"), ("Action", "ACT", "Send the {s} pilot results to the steering group"),
            ("Request", "REQ", "Approve access for the {s} pilot users"), ("Approval", "APR", "Approve the {s} budget line forecast")]
    r = rng("work")
    wis = []
    for i in range(30):
        p_ = P[i % len(P)]
        sh = p_.get("short") or p_["n"]
        kind, tag, t = WI_T[i % len(WI_T)]
        tk = next(x for x in tasks if x["p"] == p_["id"] and x["part"] == "task" and x["pct"] < 100) if any(x["p"] == p_["id"] and x["part"] == "task" and x["pct"] < 100 for x in tasks) else tasks[0]
        st = ["open", "doing", "open", "done", "blocked", "doing"][i % 6]
        o = rot(i * 5)
        row = {"id": up + "-W" + str(i + 1), "part": "work", "kind": kind, "tag": tag, "t": t.replace("{s}", sh).replace("{t}", tk["n"]), "h": r.choice([1, 2, 4, 8]), "n": 1,
               "risk": ["low", "med", "high"][i % 3], "pr": p_["id"], "src": "Task " + tk["id"], "owner": o, "due": day(r.randint(-3, 21)), "st": st}
        if st == "done":
            row["doneOn"] = day(-r.randint(1, 10))
        wis.append(row)
    out["work_items"] = wis
    r = rng("budget_requests")
    brs = []
    for i, (t, ty) in enumerate(need("budget_requests", 10)):
        p_ = P[i % len(P)]
        bl = [b for b in BL if b["p"] == p_["id"]][i % 2 if len([b for b in BL if b["p"] == p_["id"]]) > 1 else 0]
        req_ = bl["own"]
        sp_ = p_["owner"] if p_["owner"] != req_ else p_["backup"]
        st = ["Submitted", "Triage", "Approved", "Decision", "Declined", "Approved", "Submitted", "Funded", "Triage", "Decision"][i % 10]
        brs.append({"id": up + "-BR-0" + str(101 + i), "part": "request", "t": t, "type": ty, "amt": r.randint(2, 30) * 5000, "yrs": 1, "src": "Management reserve" if i % 2 else "Reallocation",
                    "proj": p_["id"], "line": bl["id"], "req": req_, "sp": sp_, "cc": ccs[i % len(ccs)]["code"], "obj": p_["obj"], "st": st, "stIn": r.randint(1, 12),
                    "why": "Needed to keep " + (p_.get("short") or p_["n"]) + " on plan.", "label": "simulated"})
    out["budget_requests"] = brs

    # ---------------- money: ledger, timesheets, approval and finance policies ----------------
    r = rng("ledger")
    led = [{"id": up + "-LG-01", "part": "entry", "d": "2026-07-01", "t": "open", "amt": info.get("fund", 1000) * 100, "p": "", "line": "", "why": "Opening management reserve for the year.",
            "req": cfo, "apr": lead or cfo, "st": "Approved", "num": ""}]
    n = 2
    for b in BL:
        for kind in ("commit", "actual"):
            if n > 40:
                break
            amt = round((b["comm"] if kind == "commit" else b["act"]) * r.uniform(.15, .4))
            led.append({"id": up + "-LG-" + str(n).zfill(2), "part": "entry", "d": day(-r.randint(5, 90)), "t": kind, "amt": amt, "p": b["p"], "line": b["id"],
                        "why": ("Commitment on " if kind == "commit" else "Actual spend on ") + b["n"][0].lower() + b["n"][1:] + ".", "req": b["own"], "apr": cfo, "st": "Posted", "num": ""})
            n += 1
    while n <= 40:
        b = BL[n % len(BL)]
        led.append({"id": up + "-LG-" + str(n).zfill(2), "part": "entry", "d": day(-r.randint(1, 60)), "t": ["transfer", "release", "accrual"][n % 3], "amt": r.randint(1, 20) * 2500,
                    "p": b["p"], "line": b["id"], "why": "Monthly accrual and reserve movement.", "req": b["own"], "apr": cfo, "st": ["Approved", "Posted", "Pending"][n % 3], "num": ""})
        n += 1
    for i in range(30):
        led.append({"id": "day-" + str(i + 1), "part": "spend", "day": i + 1, "amt": round(r.uniform(3, 14), 1)})
    for x in led:
        if x.get("p") == "":
            del x["p"]
            del x["line"]
    out["ledger_entries"] = led
    r = rng("timesheets")
    ts = []
    weeks = ["2026-09-21", "2026-09-28", "2026-10-05"]
    workers = H[1:11]
    k = 1
    for w in weeks:
        for pe in workers:
            p_ = next((x for x in P if x["owner"] == pe or x["backup"] == pe), P[k % len(P)])
            tk = next(x for x in tasks if x["p"] == p_["id"] and x["part"] == "task")
            st = "approved" if w != weeks[-1] else ["submitted", "draft", "submitted", "approved"][k % 4]
            ts.append({"id": up + "-TS-" + str(k).zfill(4), "part": "sheet", "person": pe, "week": w, "status": st,
                       "rows": [{"id": "r" + str(k), "proj": p_["id"], "task": tk["id"], "cc": ccs[k % len(ccs)]["code"], "hrs": [r.choice([4, 6, 8]) for _ in range(5)] + [0, 0]}],
                       "approver": other(pe), "posted": st == "approved", "late": st == "draft"})
            k += 1
    for i in range(10):
        po = pos[i % len(pos)]
        ts.append({"id": up + "-RC-" + str(i + 1).zfill(4), "part": "receipt", "po": po["id"], "amt": round(po["rec"] / 2), "date": day(-r.randint(5, 120)), "by": po["rBy"]})
    for i in range(6):
        po = pos[i]
        ts.append({"id": up + "-RQ-" + str(1001 + i), "part": "requisition", "requester": po["cBy"], "approver": cfo, "desc": po["d"], "amt": po["ord"], "v": po["v"], "line": po["line"],
                   "po": po["id"], "status": "Converted" if i % 3 else "Approved", "date": day(-r.randint(30, 200)), "needBy": day(r.randint(5, 60))})
    out["timesheets"] = ts
    rule_ids = [up + "-RULE-" + str(i + 1) for i in range(3)]
    ap = []
    for i, (mx, role) in enumerate([(10000, "Budget owner"), (50000, "Function head"), (100000, "Chief financial officer"), (250000, "Chief operating officer"),
                                    (1000000, "Executive committee"), (None, "Board")]):
        ap.append({"id": up + "-T" + str(i + 1), "part": "doa", "max": mx, "role": role, "grp": teams[min(i, len(teams) - 1)]["id"] if i < 2 else teams[0]["id"]})
    cats = []
    for b in BL:
        if b["cat"] not in cats:
            cats.append(b["cat"])
    while len(cats) < 8:
        cats.append(["Travel", "Training", "Subscriptions", "Consulting", "Equipment", "Software", "Services", "Labor"][len(cats)])
    for i, c in enumerate(cats[:8]):
        ap.append({"id": up + "-CR" + str(i + 1), "part": "control", "cat": c, "role": "Procurement" if i % 2 else "Budget owner", "min": [25000, 10000, 50000, 5000][i % 4],
                   "why": "Quotes and a second approver are required above this amount.", "grp": teams[i % len(teams)]["id"]})
    for i, (n, ent) in enumerate([("Standard purchase approval", "request_item"), ("Access approval", "request_item"), ("Budget change approval", "budget_request")]):
        o = [cfo, admin, cfo][i]
        ap.append({"id": rule_ids[i], "part": "rule", "name": n, "entity": ent, "desc": "Manager, then the budget owner, then the group for the amount.", "owner": o, "backup": other(o),
                   "grp": teams[i % len(teams)]["id"]})
    for i in range(10):
        c = cat[i % len(cat)]
        ap.append({"id": up + "-BD" + str(i + 1), "part": "binding", "kind": "catalog", "ref": c["id"], "label": c["n"], "rule": rule_ids[0 if c["pr"] else 1], "grp": c["grp"]})
    out["approval_policies"] = ap
    fp = []
    colors = [("OP-U", "Operating, unrestricted"), ("CAP", "Capital"), ("RES", "Restricted"), ("RSV", "Reserve")]
    for i, (cid, cn) in enumerate(colors):
        fp.append({"id": up + "-" + cid, "part": "color", "name": cn, "fund": str(100 + i * 10), "avail": r.randint(2, 30) * 10000, "status": "Active"})
    natures = ["opex_run", "opex_subscription", "opex_services", "capex_software", "capex_hardware"]
    for i, (cid, cn) in enumerate(colors):
        for j, nat in enumerate(natures):
            ok = not (cid == "OP-U" and nat.startswith("capex")) and not (cid == "CAP" and nat.startswith("opex"))
            fp.append({"id": up + "-FR-" + cid + "-" + str(j + 1), "part": "rule", "color": up + "-" + cid, "nature": nat, "gate": "*", "allowed": "yes" if ok else "no",
                       "text": ("Allowed" if ok else "Not allowed") + " for " + cn.lower() + " funds.", "approver": cfo})
    for i, t in enumerate(need("finance_events", 10)):
        fp.append({"id": up + "-E-" + str(i + 1).zfill(2), "part": "event", "c": t, "src": "Finance", "t": day(-r.randint(5, 200)), "st": ["Recorded", "Open", "Recorded"][i % 3], "note": ""})
    for i, (n, d) in enumerate([("Capitalization policy", "What spend becomes an asset and when"), ("Delegation of financial authority", "Who approves how much"),
                                ("Cost allocation policy", "How shared costs reach each unit")]):
        fp.append({"id": up + "-FP-" + str(i + 1), "part": "policy", "n": n, "d": d, "owner": cfo, "backup": other(cfo), "st": ["Approved", "Approved", "Draft"][i]})
    out["finance_policies"] = fp

    # ---------------- people: roles, ownership, skills, learning, leave, rooms, forums ----------------
    roles, seen = [], set()

    def addrole(name, who, bk, tier, basis):
        rid = "role:" + slug(name)
        if rid in seen or not who:
            return
        seen.add(rid)
        roles.append({"id": rid, "part": "role", "name": name, "aliases": [], "tier": tier, "basis": basis,
                      "holders": [{"who": who, "kind": "primary", "from": "2026-01-01", "to": None, "basis": basis, "confirmed": True},
                                  {"who": bk, "kind": "backup", "from": "2026-01-01", "to": None, "basis": basis, "confirmed": True}]})
    for p in people:
        if p["kind"] == "human" and p.get("role"):
            addrole(p["role"], p["name"], other(p["name"]), "person", "Org chart")
    for s in services:
        addrole("Service owner: " + s["n"], s["owner"], s["backup"], "record", "Service catalog")
    for p_ in PR:
        addrole("Process owner: " + p_["n"], p_["owner"], p_["backup"], "record", "Process library")
    for t in teams:
        addrole("Team lead: " + t["n"], t["mgr"], other(t["mgr"]), "group", "Org chart")
    for x in [x for x in ap if x["part"] == "doa"]:
        ap_who = cfo if "financial" in x["role"].lower() else (lead or cfo)
        addrole("Approver: " + x["role"], ap_who, other(ap_who), "group", "Delegation of authority")
    for b in BOTS:
        sp_ = b.get("sponsor") or H[0]
        addrole("Agent sponsor: " + b["name"], sp_, other(sp_), "runtime", "Agent register")
    own_rows = []
    for kind, lst, of, bf in [("service", services, "owner", "backup"), ("process", PR, "owner", "backup"), ("project", P, "owner", "backup"),
                              ("vendor", vendors, "own", "bak"), ("contract", contracts, "own", "bak"), ("control", cc_[:10], "own", "bak")]:
        for x in lst:
            own_rows.append({"id": kind + ":" + x["id"], "part": "ownership", "kind": kind, "rec": x["id"], "owner": x[of], "backup": x[bf], "by": "Seed", "at": "2026-09-10", "note": "Standing assignment"})
    out["role_assignments"] = roles + own_rows
    r = rng("skills")
    sk = need("skills", 12)
    skr = [{"id": up + "-SK-" + str(i + 1), "part": "custom", "n": s[0], "cat": s[1], "cert": i % 4 == 0, "auto": False} for i, s in enumerate(sk)]
    k = 0
    for i, h in enumerate(H):
        for j in range(4):
            if k >= 80:
                break
            s = sk[(i * 3 + j) % len(sk)][0]
            rid = h + "|" + s
            if any(x["id"] == rid for x in skr):
                continue
            skr.append({"id": rid, "part": "claim", "person": h, "skill": s, "level": r.randint(1, 4), "verified": r.random() < .4})
            k += 1
    while k < 80:
        h, s = rot(k * 7), sk[k % len(sk)][0]
        rid = h + "|" + s
        if not any(x["id"] == rid for x in skr):
            skr.append({"id": rid, "part": "claim", "person": h, "skill": s, "level": r.randint(1, 4), "verified": False})
        k += 1
    out["skills"] = skr
    r = rng("learning")
    lr = []
    for i, (t, catn, mins, mand) in enumerate(need("courses", 8)):
        o = rot(i * 2 + 1)
        lr.append({"id": up + "-C" + str(i + 1), "part": "course", "t": t, "cat": catn, "mins": mins, "pass": 80, "recur": 12 if mand else 0, "aud": "All staff" if mand else "Teams that need it",
                   "due": day(20 + i * 10), "mand": bool(mand), "cert": not mand, "owner": o, "backup": other(o), "q": 8})
    courses = [x for x in lr if x["part"] == "course"]
    for i in range(40):
        h = H[i % len(H)]
        c = courses[(i // len(H) + i) % len(courses)]
        rid = PID[h] + "|" + c["id"]
        if any(x["id"] == rid for x in lr):
            c = courses[(i + 3) % len(courses)]
            rid = PID[h] + "|" + c["id"]
        st = ["done", "in progress", "not started", "done", "overdue"][i % 5]
        row = {"id": rid, "part": "enrollment", "person": PID[h], "course": c["id"], "st": st, "due": c["due"]}
        if st == "done":
            row["done"] = day(-r.randint(2, 60))
            row["score"] = r.randint(80, 99)
        lr.append(row)
    lr.append({"id": up + "-LP1", "part": "path", "t": "New starter first week", "c": [c["id"] for c in courses if c["mand"]][:4], "a": "Everyone, within five days of starting"})
    lr.append({"id": up + "-LP2", "part": "path", "t": "New manager", "c": [c["id"] for c in courses if not c["mand"]][:3], "a": "People managers in their first quarter"})
    out["learning"] = lr
    r = rng("leave")
    out["leave"] = []
    for i in range(20):
        h = rot(i * 3 + 2)
        st_ = r.randint(-10, 40)
        out["leave"].append({"id": up + "-LV" + str(i + 1), "part": "leave", "who": PID[h], "from": day(st_), "to": day(st_ + r.randint(1, 9)),
                             "type": ["Vacation", "Vacation", "Training", "Sick", "Family"][i % 5], "st": ["approved", "approved", "requested", "approved"][i % 4], "note": ""})
    r = rng("rooms")
    rm = []
    for i, (n, capn, ty) in enumerate(need("rooms", 5)):
        rm.append({"id": up + "-RM" + str(i + 1), "part": "room", "n": n, "cap": capn, "type": ty, "floor": 1 + i % 4, "eq": ["Display sharing", "Camera"] if capn > 6 else ["Display sharing"]})
    rooms_ = list(rm)
    for i in range(40):
        ro = rooms_[i % len(rooms_)]
        s_ = 8 + (i * 3) % 9
        rm.append({"id": up + "-BK" + str(i + 1), "part": "booking", "room": ro["id"], "d": i % 10, "s": s_, "e": s_ + 1, "t": "", "att": r.randint(2, ro["cap"]), "host": PID[rot(i * 5)]})
    out["rooms"] = rm
    out["forums"] = []
    for i, (n, cad, charter) in enumerate(need("forums", 4)):
        ch_ = fns[i % len(fns)]["lead"]["n"] if fns else H[0]
        mem = [PID[ch_]] + [PID[rot(i * 4 + j)] for j in range(1, 6) if rot(i * 4 + j) != ch_]
        out["forums"].append({"id": up + "-F" + str(i + 1), "part": "forum", "n": n, "chair": PID[ch_], "members": mem, "cadence": cad, "next": day(3 + i * 4), "len": 60,
                              "quorum": max(2, len(mem) // 2 + 1), "room": rooms_[i % len(rooms_)]["id"], "charter": charter})

    # ---------------- my work: meetings, decisions, actions, conversations ----------------
    r = rng("meetings")
    mt = []
    series = need("series", 4)
    for i, (n, ty, cad, purpose) in enumerate(series):
        ch_ = fns[i % len(fns)]["lead"]["n"] if fns else H[0]
        mt.append({"id": up + "-SER-" + str(i + 1), "part": "series", "n": n, "type": ty, "chair": ch_, "secy": other(ch_), "cad": cad, "s": 9 + i, "e": 10 + i, "room": rooms_[i % len(rooms_)]["n"],
                   "purpose": purpose, "mids": []})
    sers = list(mt)
    for i in range(25):
        if i < 16:
            se = sers[i % len(sers)]
            t, ty, ch_, link = se["n"], se["type"], se["chair"], P[i % len(P)]["id"]
        else:
            p_ = P[(i - 16) % len(P)]
            se, t, ty, ch_, link = None, (p_.get("short") or p_["n"]) + " project review", "proj", p_["owner"], p_["id"]
        d = i % 10 - 4
        att = [ch_, other(ch_), other(ch_, 1), other(ch_, 2)]
        row = {"id": up + "-M" + str(i + 1), "part": "meeting", "d": i % 10, "s": 9 + i % 7, "e": 10 + i % 7, "t": t, "k": ty, "st": "done" if d < 0 else "planned", "type": ty,
               "att": list(dict.fromkeys(att)), "sum": "Reviewed progress and agreed the next steps." if d < 0 else "", "chair": ch_, "secy": other(ch_), "dt": day(d), "link": link, "room": rooms_[i % len(rooms_)]["n"]}
        if se:
            row["series"] = se["id"]
            se["mids"].append(row["id"])
        mt.append(row)
    out["meetings"] = mt
    meets = [x for x in mt if x["part"] == "meeting"]
    DEC_T = ["Hold the next {v} payment until the milestone is accepted", "Keep the {s} go-live date", "Move {s} to two waves", "Fund the {s} overlap from the reserve",
             "Approve change {c} for the next window", "Accept the {s} pilot results"]
    ACT_T = ["Send the {s} pilot results to the group", "Book the {s} training sessions", "Confirm the {v} delivery date in writing", "Update the {s} RAID log",
             "Attach the test evidence to change {c}", "Draft the {s} communication to staff"]
    decs, acts = [], []
    for i in range(30):
        m = meets[i % len(meets)]
        p_ = next(x for x in P if x["id"] == m["link"])
        sh = p_.get("short") or p_["n"]
        iv = next((x for x in INV if x["p"] == p_["id"]), INV[0])
        rd = next((x for x in raid if x["p"] == p_["id"] and x["t"] == "D"), None)
        c = changes[i % 15]
        row = {"id": up + "-MD-" + str(i + 1).zfill(3), "part": "meeting", "mid": m["id"], "t": DEC_T[i % len(DEC_T)].replace("{s}", sh).replace("{v}", iv["vendor"]).replace("{c}", c["id"]),
               "why": "Agreed by the people in the room; recorded by the secretary.", "alts": ["Defer a week", "Reject"], "by": m["chair"], "dt": m["dt"], "st": "recorded" if m["st"] == "done" else "proposed",
               "rat": i % 4 != 3}
        if rd and i % 3 == 0:
            row["raid"] = rd["id"]
        decs.append(row)
    for i in range(50):
        m = meets[i % len(meets)]
        p_ = next(x for x in P if x["id"] == m["link"])
        sh = p_.get("short") or p_["n"]
        iv = next((x for x in INV if x["p"] == p_["id"]), INV[0])
        c = changes[i % 15]
        st = ["open", "done", "open", "overdue", "done"][i % 5]
        row = {"id": up + "-MA-" + str(i + 1).zfill(3), "part": "action", "mid": m["id"], "t": ACT_T[i % len(ACT_T)].replace("{s}", sh).replace("{v}", iv["vendor"]).replace("{c}", c["id"]),
               "own": m["att"][i % len(m["att"])], "due": day(r.randint(-10, 20)), "st": st, "pri": ["High", "Medium", "Low"][i % 3], "carry": i % 7 == 0}
        if st == "done":
            row["closed"] = day(-r.randint(1, 10))
        rd = next((x for x in raid if x["p"] == p_["id"]), None)
        if rd and i % 4 == 0:
            row["raid"] = rd["id"]
        acts.append(row)
    out["decisions"] = decs
    out["action_items"] = acts
    out["conversations"] = []
    for i, t in enumerate(need("conversations", 3)):
        out["conversations"].append({"id": up + "-TH" + str(i + 1), "part": "thread", "title": t, "pinned": i == 0, "arch": False, "created": day(-i - 1), "upd": day(-i), "mode": "ask",
                                     "msgs": [{"r": "user", "t": t}, {"r": "assistant", "t": "Here is what the records show, with links to each one."}], "pend": None, "unread": 0, "ctx": {"subj": None, "attach": []}})

    # ---------------- transformation ----------------
    r = rng("caps")
    caps = []
    for i, (l1, l2s) in enumerate(need("capabilities", 8)):
        cid = up + "-CAP-" + str(i + 1)
        o = fns[i % len(fns)]["lead"]["n"] if fns else H[0]
        cur = r.randint(1, 3)
        caps.append({"id": cid, "part": "capability", "model": tid, "parent": None, "name": l1, "cur": cur, "t": [cur, min(5, cur + 1), min(5, cur + 2)], "owner": o,
                     "objs": [O[i % len(O)]["id"]], "svcs": [services[i % len(services)]["id"]], "b0": cur, "eff": round(r.uniform(.5, 3), 1), "root": 1})
        for j, l2 in enumerate(l2s):
            c2 = r.randint(1, 4)
            caps.append({"id": cid + "." + str(j + 1), "part": "capability", "model": tid, "parent": cid, "name": l2, "cur": c2, "t": [c2, min(5, c2 + 1), min(5, c2 + 1)],
                         "owner": other(o, j), "objs": [], "svcs": [services[(i + j) % len(services)]["id"]], "b0": c2, "eff": round(r.uniform(.5, 2), 1), "root": 0})
    for i, (n, dt, note) in enumerate([("Year 1", "2027-06-30", "end of " + info.get("fy", "FY27")), ("Year 2", "2028-06-30", "end of year two"), ("Year 3", "2029-06-30", "end of year three")]):
        caps.append({"id": "horizon-" + str(i + 1), "part": "horizon", "n": n, "date": dt, "note": note})
    out["capabilities"] = caps
    r = rng("apps")
    out["applications"] = []
    for i, (n, catn, life, ven) in enumerate(need("applications", 12)):
        s = services[i % len(services)]
        row = {"id": up + "-APP" + str(i + 1), "part": "application", "n": n, "cat": catn, "own": s["owner"], "bak": s["backup"], "cost": r.randint(20, 600), "users": r.randint(20, 3000),
               "life": life, "val": r.randint(40, 95), "hlt": r.randint(30, 95), "ven": ven, "svc": s["id"], "red": None, "note": ""}
        if ven in VID:
            row["vid"] = VID[ven]
        elif ven != "In house":
            E.append("records.applications: vendor " + ven + " is not in records.vendors")
        out["applications"].append(row)
    out["tech_debt"] = []
    for i, t in enumerate(need("tech_debt", 4)):
        s = services[i % len(services)]
        out["tech_debt"].append({"id": up + "-DT-" + str(i + 1), "part": "task", "item": s["id"], "title": t, "due": day(14 + i * 14), "owner": s["owner"], "kind": ["Fix or decommission", "Upgrade", "Refactor", "Retire"][i % 4]})

    # ---------------- build and admin ----------------
    r = rng("builds")
    out["builds"] = []
    for i, (n, purpose) in enumerate(need("builds", 8)):
        o = rot(i * 3 + 2)
        out["builds"].append({"id": up + "-B" + str(i + 1), "part": "app", "n": n, "tier": ["personal", "team", "department", "team"][i % 4], "builder": other(o), "owner": o,
                              "status": ["live", "review", "live", "draft"][i % 4], "purpose": purpose, "reads": ["person", "project"], "writes": [], "users": r.randint(3, 120),
                              "created": day(-r.randint(10, 200))})
    st_rows = []
    for k_, n, on in [("ai", "AI assistance", True), ("agents", "Agents that act with approval", True), ("chat", "Chat with records", True), ("export", "Export to spreadsheets", True),
                      ("guest", "Guest access", False), ("beta", "Early features", False), ("mobile", "Mobile app", True)]:
        st_rows.append({"id": "flag-" + k_, "part": "flag", "n": n, "on": on})
    for k_, n, stv in [("std", "Platform model (standard)", "enabled"), ("fast", "Platform model (fast)", "enabled"), ("deep", "Platform model (deep reasoning)", "review")]:
        st_rows.append({"id": "model-" + k_, "part": "model", "n": n, "st": stv})
    nh = len(H)
    for k_, n, bought in [("full", "Full seats", nh + 10), ("light", "Light seats", nh * 4), ("agent", "Agent seats", len(BOTS) + 2), ("guest", "Guest seats", 10)]:
        st_rows.append({"id": "seat-" + k_, "part": "seat", "n": n, "bought": bought, "assigned": min(bought, {"full": nh, "light": nh * 2, "agent": len(BOTS), "guest": 0}[k_])})
    for i, lg in enumerate(R.get("languages") or ["English"]):
        st_rows.append({"id": "lang-" + slug(lg), "part": "language", "n": lg, "on": True, "default": i == 0})
    for k_, n, to in [("inc", "Incidents", "tn"), ("req", "Requests", "tn"), ("chg", "Changes", "tn"), ("inv", "Invoices", "tn"), ("kb", "Knowledge", "tn")]:
        st_rows.append({"id": "route-" + k_, "part": "route", "n": n, "to": teams[len(st_rows) % len(teams)]["n"]})
    for i, n in enumerate(["Quarterly access review", "Agent permissions review", "Data retention review", "Connector credentials review"]):
        st_rows.append({"id": "review-" + str(i + 1), "part": "review", "n": n, "st": ["open", "done", "planned", "open"][i], "owner": [admin, cfo, admin, admin][i]})
    for i, (n, env) in enumerate([("Production API token", "Production"), ("Sandbox API token", "Sandbox"), ("Reporting token", "Production")]):
        st_rows.append({"id": "token-" + str(i + 1), "part": "token", "n": n, "env": env, "st": "active"})
    out["tenant_settings"] = st_rows
    r = rng("connectors")
    cn = []
    for i, (n, kind, ents) in enumerate(need("connectors", 8)):
        o = [admin, other(admin), cfo][i % 3]
        cn.append({"id": up.lower() + "-c" + str(i + 1), "part": "connection", "name": n, "kind": kind, "tier": "certified" if i % 3 else "community", "status": ["healthy", "healthy", "degraded", "healthy"][i % 4],
                   "owner": o, "backup": other(o), "env": "Production", "ents": ents, "sys": n, "err": round(r.uniform(0, 2), 1), "canStream": i % 2 == 0, "lag": r.randint(1, 60)})
    conns = list(cn)
    for i in range(16):
        c = conns[i % len(conns)]
        ent = c["ents"][i % len(c["ents"])] if c["ents"] else "record"
        cn.append({"id": up + "-MP-" + str(100 + i), "part": "mapping", "conn": c["id"], "src": ["id", "name", "status", "updated", "owner", "amount", "date", "site"][i % 8],
                   "srcType": ["string", "string", "string", "datetime", "string", "number", "date", "string"][i % 8], "ent": ent, "k": ["id", "name", "state", "updated_at", "owner", "amount", "date", "site"][i % 8],
                   "tf": "as is", "conf": round(r.uniform(.8, .99), 2), "status": "approved" if i % 5 else "review", "ver": 1 + i % 3})
    out["connectors"] = cn
    out["ops_automations"] = []
    for i in range(20):
        c = conns[i % len(conns)]
        found = r.randint(2, 60)
        rej = r.randint(0, 3)
        out["ops_automations"].append({"id": up + "-RUN-" + str(9001 + i), "part": "run", "src": c["id"], "at": short_date(-(i // 4)) + " " + str(6 + i % 12).zfill(2) + ":30", "dur": str(r.randint(4, 90)) + " s",
                                       "found": found, "created": r.randint(0, 5), "updated": r.randint(0, 9), "same": max(0, found - 14), "rej": rej, "st": "Success" if rej == 0 else "Partial"})
    out["reports"] = []
    for i, (n, measure, dim) in enumerate(need("reports", 4)):
        o = [cfo, admin, rot(5), rot(8)][i]
        out["reports"].append({"id": up + "-RP-" + str(i + 1).zfill(3), "part": "report", "name": n, "measure": measure, "dim": dim, "chart": ["bar", "line", "bar", "table"][i], "top": 12,
                               "owner": o, "backup": other(o), "share": "org", "created": day(-r.randint(10, 90))})
    for i, n in enumerate(need("charts", 8)):
        out["reports"].append({"id": up + "-VZ" + str(i + 1), "part": "library", "name": n, "note": "", "spec": {"v": 1, "type": ["line", "bar", "bar", "line"][i % 4], "src": ["inc", "req", "chg", "spend"][i % 4]}})
    out["decision_tables"] = []
    for i, (n, desc) in enumerate(need("decision_tables", 3)):
        o = [cfo, admin, rot(4)][i]
        out["decision_tables"].append({"id": up + "-DMN-" + str(i + 1), "part": "table", "name": n, "desc": desc, "hp": "first", "owner": o, "backup": other(o),
                                       "inputs": [{"k": "amount", "l": "Amount", "t": "num"}, {"k": "risk", "l": "Risk", "t": "txt", "o": ["Low", "Medium", "High"]}],
                                       "outputs": [{"k": "decision", "l": "Decision"}, {"k": "approver", "l": "Approver"}],
                                       "rows": [{"in": {"amount": "<= 10000", "risk": "Low"}, "out": {"decision": "Approve", "approver": "Budget owner"}},
                                                {"in": {"amount": "<= 100000", "risk": "-"}, "out": {"decision": "Review", "approver": "Function head"}},
                                                {"in": {"amount": "-", "risk": "-"}, "out": {"decision": "Review", "approver": "Chief financial officer"}}]})

    # ---------------- events and the audit log, generated from the rows above ----------------
    r = rng("events")
    ev = []
    srcs = [("incident.opened", "Incident opened", "incidents", lambda x: x["own"]), ("change.approved", "Change approved", "changes", lambda x: x.get("own") or x.get("by")),
            ("request.fulfilled", "Request fulfilled", "service_requests", lambda x: x["requester"]), ("invoice.held", "Invoice held", "invoices", lambda x: x["own"]),
            ("control.tested", "Control tested", "controls", lambda x: x.get("own") or x.get("tester") or x.get("person"))]
    for i in range(40):
        typ, label, ent, who = srcs[i % len(srcs)]
        lst = (INV if ent == "invoices" else out[ent])
        rec = lst[i % len(lst)]
        ev.append({"id": up + "-EV" + str(1001 + i), "part": "log", "type": typ, "label": label, "payload": {"ref": rec["id"], "entity": ent}, "source": ent, "actor": who(rec) or H[0],
                   "at": day(-(i // 5)) + "T" + str(8 + i % 9).zfill(2) + ":" + str((i * 7) % 60).zfill(2) + ":00", "outcomes": []})
    for i, (n, src, sev) in enumerate([("Incident P1 opened", "Incidents", "Urgent"), ("Incident P2 opened", "Incidents", "High"), ("Change approved", "Changes", "Normal"),
                                        ("Change failed", "Changes", "High"), ("Request approved", "Requests", "Normal"), ("Request breached its target", "Requests", "High"),
                                        ("Service level at risk", "Service levels", "High"), ("Invoice on hold", "Finance", "Normal"), ("Control test failed", "Controls", "High"),
                                        ("Agent paused by its sponsor", "Agents", "High")]):
        ev.append({"id": up + "-SE" + str(i + 1), "part": "service", "n": n, "src": src, "sev": sev, "to": "Owner and backup", "x": {"inapp": 1, "email": 1}})
    out["events"] = ev
    au, prev, seq = [], "0", 1
    for ent in ["projects", "budget_lines", "services", "changes", "incidents", "controls", "contracts", "vendors", "policies", "agents", "service_requests", "risks"]:
        lst = P if ent == "projects" else (BL if ent == "budget_lines" else out[ent])
        for x in lst[:20]:
            if seq > 150:
                break
            who = x.get("owner") or x.get("own") or x.get("requester") or H[seq % len(H)]
            if who not in H:
                who = H[seq % len(H)]
            h = hashlib.sha256((prev + ent + x["id"] + who).encode()).hexdigest()[:16]
            au.append({"id": up + "-AU-" + str(seq).zfill(4), "part": "store", "seq": seq, "t": day(-(150 - seq) // 10) + "T09:" + str(seq % 60).zfill(2) + ":00", "op": "create" if seq % 4 else "update",
                       "entity": ent, "rec": x["id"], "by": who, "keys": ["owner", "status"], "prev": prev, "hash": h})
            prev = h
            seq += 1
    out["audit_log"] = au

    # ---------------- checks: parts, ids, links, owners, people ----------------
    allrows = dict(rows)
    allrows.update(out)
    humans = set(H)
    pids = {p["id"] for p in people}
    for ent in ENTITIES:
        lst = out.get(ent)
        if not lst:
            E.append("records: entity " + ent + " has no rows")
            continue
        key = KEYS.get(ent, "id")
        seen_ = set()
        for x in lst:
            v = x.get(key)
            if v is None or v == "":
                E.append(ent + ": a row has no " + key)
            elif v in seen_:
                E.append(ent + ": duplicate " + key + " " + str(v))
            seen_.add(v)
            if x.get("part") not in PARTS[ent]:
                E.append(ent + " " + str(v) + ": part " + str(x.get("part")) + " is not one of " + ", ".join(PARTS[ent]))
        for field, tgt, by, part in LINKS.get(ent, []):
            tk = KEYS.get(tgt, "id")
            pool = {y.get(by or tk) for y in allrows.get(tgt, [])}
            for x in lst:
                if part and x.get("part") != part or x.get(field) in (None, "", []):
                    continue
                vals_ = x[field] if isinstance(x[field], list) else [x[field]]
                for v in vals_:
                    if v not in pool:
                        E.append(ent + " " + str(x.get(key)) + ": " + field + " " + str(v) + " is not a " + tgt + (" " + by if by else "") + " in the pack")
        for part, of, bf in PAIRS.get(ent, []):
            for x in lst:
                if part and x.get("part") != part:
                    continue
                o, b = x.get(of), x.get(bf)
                if o not in humans or b not in humans:
                    E.append(ent + " " + str(x.get(key)) + ": " + of + " and " + bf + " must be people in the pack (R12): " + str(o) + ", " + str(b))
                elif o == b:
                    E.append(ent + " " + str(x.get(key)) + ": " + of + " and " + bf + " must differ (R12)")
        for part, f, how in PEOPLE_F.get(ent, []):
            for x in lst:
                if part and x.get("part") != part or x.get(f) in (None, ""):
                    continue
                if (how == "name" and x[f] not in humans) or (how == "id" and x[f] not in pids):
                    E.append(ent + " " + str(x.get(key)) + ": " + f + " " + str(x[f]) + " is not a person in this pack")
    for x in out.get("role_assignments", []):
        if x.get("part") == "role":
            hs = [h.get("who") for h in x.get("holders") or []]
            if not hs or any(h not in humans for h in hs) or len(set(hs)) != len(hs):
                E.append("role_assignments " + x["id"] + ": holders must be different people in the pack: " + ", ".join(map(str, hs)))
    for ent in ENTITIES:
        rows[ent] = out.get(ent, [])
    return ENTITIES


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

    # ---- PR-32: the 58 tenant entities from spec["records"] (rules above build()) ----
    made = build_records(spec, rows, info, people, E, W)
    if not made:
        W.append("gap: the 58 PR-32 entities (no records section in the spec)")

    # ---- honesty and naming checks over everything the pack shows ----
    txt = json.dumps({"rows": rows, "info": info, "org": org}, ensure_ascii=False)
    for pat in BANNED:
        if re.search(pat, txt):
            E.append("banned text in the pack: " + pat.replace("\\b", ""))
    for nm in REAL:
        if re.search(r"\b" + re.escape(nm) + r"\b", txt):
            E.append("real organization or product name in the pack: " + nm)
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


def split_records(pack):
    """PR-32 rows go to on-demand data (CL-39): src/assets/data/pack_<id>.json, embedded in full.html and fetched by the split
    build, so the first-paint script stays inside its budget. The rest of the pack stays in the module."""
    rec = {e: pack["rows"][e] for e in ENTITIES if pack["rows"].get(e)}
    core = dict(pack, rows={k: v for k, v in pack["rows"].items() if k not in rec})
    return core, rec


def emit(pack):
    core, rec = split_records(pack)
    j = json.dumps(core, ensure_ascii=False, separators=(",", ":"))
    counts = ", ".join(k + " " + str(len(v)) for k, v in core["rows"].items() if v)
    lazy = ""
    if rec:
        n = sum(len(v) for v in rec.values())
        counts += "; on demand (assets/data/pack_" + pack["id"] + ".json): " + str(len(rec)) + " PR-32 entities, " + str(n) + " rows"
        lazy = ("/* PR-32 entities (" + str(len(rec)) + "): on-demand data src/assets/data/pack_" + pack["id"] + ".json (CL-39). full.html embeds it, so the rows load\n"
                "   at once; the split build fetches it when this tenant becomes active or the Tenancy screen opens. Until then they are gaps (R18). */\n"
                "const RN=\"pack_\"+PACK.id;\n"
                "try{if(W.BUNDLE&&BUNDLE.lazy){BUNDLE.lazy(RN,{screens:[\"tn_admin\"],use:d=>{try{DT.pack(PACK.id,d)}catch(e){console.error(\"pack \"+PACK.id,e)}}});\n"
                " if(DT.tenant()===PACK.id)BUNDLE.need(RN);\n"
                " if(W.HOOKS&&HOOKS.on)HOOKS.on(\"tenantChange\",id=>{if(id===PACK.id)BUNDLE.need(RN)},{id:\"pack-\"+PACK.id+\"-records\"})}}catch(e){console.error(\"pack \"+PACK.id,e)}\n")
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
            + lazy +
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
        dat = os.path.join(SRC, "assets", "data", "pack_" + pack["id"] + ".json")
        rec = split_records(pack)[1]
        if rec:
            with open(dat, "w", encoding="utf-8") as fh:
                fh.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")
        elif os.path.exists(dat):
            os.remove(dat)
        print("wrote", os.path.relpath(out, ROOT), "(" + counts + ")")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
