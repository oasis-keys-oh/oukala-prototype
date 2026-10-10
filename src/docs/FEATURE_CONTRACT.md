# The Feature Contract

Standing rules for everything we build on the Oukala platform: internal modules, citizen apps and AI agents, whether a person or a coding agent writes the code. They apply from the first commit, are checked by agents while you design, by the platform gate when you publish, and by the retrofit matrix while the feature runs.

One line: **a feature is not done until it has a process model, a data model with an integration decision, metrics with a maturity record, and its connections to the rest of the app.**

Screen: Platform, Feature contract (`plat_contract`). Programmatic API: `window.CONTRACT {rules, agents, evaluate(featureId), matrix(), run(featureId|manifest), stats()}`. MCP tool: `run_feature_contract`.

## The four rules

### Rule 1. Process model (editable in the tool)

Every feature has a process model that was developed or researched from a reference standard, and it can be edited in the tool.

Artifacts, exactly:
- `PROC.reg(screenId, {title, std, steps})` so the process strip on the screen is editable (admins add steps or open the Workflow designer).
- `PROCLIB.addProcess({id, name, module, family, owner, trigger, steps:[{n,d,who,owner,sla,in,out}], inputs, outputs, entities, metrics, model})` so it joins the process library, the map and the maturity roll-up. `who` is one of `human`, `agent`, `auto`, `gate`.
- A RACI line for every gate step (who is responsible, accountable, consulted, informed).
- The reference standard named with a `stdChip` (for example ITIL 5, TBM, PMBOK, NIST, KCS).

Needs: at least 3 steps, every step has an owner, input and output, a trigger, a named accountable owner plus a backup.

### Rule 2. Data model and integration decision

Every feature has a data model, followed by a research-and-integration task that decides how it fits the larger data model. Order of preference: reuse, then extend, then new.

Artifacts, exactly:
- Entities and fields. Each field has an authority (`platform`, `external`, `shared`) and a classification (`public`, `internal`, `confidential`, `restricted`, `personal`).
- `ATLAS.addEntity({id,label,domain,source,status,fields})` (which calls `DATAMODEL.register`) for each new entity; extension fields for each extended entity.
- The decision per entity (reuse, extend, new) with a written rationale, the registry searches that were run and every near duplicate found. The decision is logged (`CONTRACT.decisions()`, the atlas coverage tab, and the contract report).

Needs: every entity read or written is registered or planned; a new entity says what the closest existing entity lacks; no unresolved duplicate; every field classified.

### Rule 3. Metrics and maturity model

Every feature has metrics and a maturity model, connected to the larger models.

Artifacts, exactly:
- `METRICS` entries: name, formula in words, unit, owner, target, `badAt`, direction, remediation (`rem`: SOP, knowledge article or agent), shown with `fchip`. Add an outcome metric and a health metric.
- A maturity record: `PROCLIB.maturity(procId)` on a chosen model (default `cmmi`, process capability scale), six dimensions (defined, owned, measured, integrated, automated, governed), target level. It must roll up in Maturity models (`MAT`). Do not invent a parallel scale.

Needs: at least one metric with formula, owner, target and remediation, plus a maturity model and target.

### Rule 4. Interconnectivity

Every feature is wired into the rest of the app where it needs to be.

Artifacts, exactly:
- `MODMAP.addModule({id,name,sn,band,own,r,w,proposed,flows})` and `MODMAP.addFlows([...])`: at least one flow in and one flow out, each with data, entity, mode (`event`, `batch`, `human`, `api`) and trigger.
- Links to projects, strategy items, tickets, people, the inbox and approvals, notifications and audit wherever they apply.
- A `SEARCHX` provider and an `ASKX` chat intent.
- Findings and exceptions flow to Technical debt.

Needs: valid flows both ways using registered entities; searchable; askable in chat; platform services used for approvals, notifications and audit (no private copies).

## Definition of done (checklist)

- [ ] 1. Process registered with `PROC.reg` and `PROCLIB.addProcess`; at least 3 steps, each with owner, input, output; trigger; owner and backup named; standard cited.
- [ ] 2. Entities registered or planned; each decision recorded as reuse, extend or new with rationale; no unresolved duplicate; every field has authority and classification.
- [ ] 3. At least one metric with formula, owner, target, remediation; maturity model and target set; process rolls up in Maturity models.
- [ ] 4. Flow in and flow out on the map; search record; chat intent; approvals, notifications and audit through platform services; debt findings route to the ledger.
- [ ] 5. Naming rule clean (see below).
- [ ] 6. `run_feature_contract` returns all four rules as pass (or waived with an expiry).
- [ ] 7. Hero, lens note, `procCard`, AI lineage chips, legends and the rest of `MODULE_GUIDE.md` still apply.

## Evidence the platform checks by itself

| Rule | Check id | Evidence read |
|---|---|---|
| 1 Process | `ct_process` | `PROC.defs[...]`, `PROCLIB.list()`, `PROCLIB.get()` (steps, named owner) |
| 2 Data | `ct_data` | `ATLAS.coverage()` record sets and module entities, `PLAT.reuseCheck()` duplicates, `DATAMODEL.tables` |
| 3 Metrics | `ct_metrics` | `METRICS` (formula, owner, target, remediation), `PROCLIB.maturity()` |
| 4 Links | `ct_links` | `MODMAP.modules` flows in and out, the `SEARCHX` index, declared links |

Scoring: 0 to 4 per feature. Met is 1, partly met or waived is 0.5, gap is 0. Levels: Full contract (4), Strong (3 or more), Partial (2 or more), Weak (1 or more), None. The Feature contract screen scores every screen, every module without a screen and every citizen app (the retrofit matrix). Chat intents cannot be introspected for legacy features, so for those the check counts the search record and the flows; new features declare their chat intent in the manifest.

## Where it is enforced

1. Design time: the four agents in `agents/` and the skill in `skills/oukala-feature-contract/`, called by a builder or a vibe-coding session. The MCP tool `run_feature_contract` is the same check for any coding client.
2. Publish gate: the four checks join the conformance gate (`GATE.CHECKS`). From the team tier up a failing check blocks promotion; the personal tier sees them as advice. Build a module runs them in its review step and keeps Register disabled until they pass or an exception is raised.
3. Runtime: the retrofit matrix re-scores everything whenever the registries change; metrics `m_contract_*` track coverage, features at full contract, open gaps, waivers and average days to close; stale gaps are sent to Technical debt as `contract_finding` records.

## Exceptions (waivers)

A feature that cannot meet a rule yet needs a waiver. It names the feature and the rule, the reason and the control that covers the risk, an accountable owner and an expiry of at most 90 days. It is raised as a debt item (`DEBT.add`, type exception, status accepted, `exp` set), so it is owned, priced and visible. Until the expiry the check shows Waived; afterwards it fails again. A waiver never removes the gap from the backlog, only from the block. In Build a module a waiver is an exception raised on the failing contract check and becomes a debt item at registration. Through MCP use `request_exception` with the check id (`ct_process`, `ct_data`, `ct_metrics`, `ct_links`).

## How it applies

- Internal modules (screens built by us): all four rules, no waiver needed for new work. Legacy screens are in the retrofit backlog with an owner and a target date.
- Citizen apps: declare the contract in the manifest (`contract` section) or in the Build a module wizard. Tier decides blocking: personal is advisory, team and enterprise block certification.
- AI agents: an agent is a feature. It needs the process it runs (who acts: `agent`), the entities it reads and writes, metrics for its quality and cost, and its place on the map. Its guardrails go through the AI gateway as usual.
- Coding agents: call `run_feature_contract` with a draft manifest before writing code, and again before opening the pull request.

## Draft manifest (what the tool accepts)

```json
{
  "name": "Facilities work orders",
  "owner": "Rina Okafor",
  "process": {"trigger": "...", "steps": [{"n": "Report", "who": "human", "owner": "Requester", "sla": "Same day"}]},
  "data": {"reuse": ["person"], "extend": [{"entity": "request_item", "add": ["facilities_category"]}],
           "new": [{"id": "repair_visit", "label": "Repair visit", "why": "...", "fields": [{"k": "arrival_window", "classification": "internal", "authority": "platform"}]}]},
  "metrics": [{"n": "Repair cycle time", "f": "Σ (completed − reported) ÷ repairs completed", "owner": "Rina Okafor", "tgt": 72, "rem": "Rebalance the queue"}],
  "maturity": {"model": "cmmi", "target": 3},
  "links": {"modules": [{"id": "ppl_org", "dir": "pull", "entity": "person"}, {"id": "chat_home", "dir": "push", "entity": "notification"}], "search": true, "approvals": true}
}
```

## Naming rule

This is a standalone product that may be shown to peers of the first customer. Never use the words FAF, Codification or ASU, and do not use ASC, FASB or GASB in new text. The sample customer is Meridian Standards Foundation; its sample systems are the Standards Portal and the Standards Platform. Other organizations' processes arrive later as process content. The contract report lints every draft and fails when it finds one.

## Related files

- `agents/oukala-feature-contract.md` (orchestrator), `agents/oukala-process-architect.md`, `agents/oukala-data-integrator.md`, `agents/oukala-metrics-maturity-steward.md`, `agents/oukala-connectivity-steward.md`
- `skills/oukala-feature-contract/SKILL.md`
- `MODULE_GUIDE.md` (Round 11 addendum), `mod_plat_contract.js`
