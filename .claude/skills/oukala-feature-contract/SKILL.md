---
name: oukala-feature-contract
description: Run the four Oukala feature rules: editable process, data model with reuse decision, metrics with maturity, interconnectivity. Use when designing, vibe-coding or publishing a feature.
---

# Oukala Feature Contract

Use this skill whenever you add, change or publish a feature on the Oukala platform: a screen, a module, a citizen app or an AI agent. It stops a vibe-coded feature from shipping as an island with its own tables, no process, no numbers and no connections.

## When to invoke
- Before writing code for a new feature (design time).
- Before opening a pull request or registering a module (publish time).
- When retrofitting an existing screen that scores below 4 on the Feature contract matrix.
- When someone says "build rules", "feature contract", "is this feature done" or "does this meet the contract".

## The four rules (full text in `docs/FEATURE_CONTRACT.md`)
1. **Process model**, editable in the tool: `PROC.reg` plus `PROCLIB.addProcess`; at least 3 steps, each with who acts (human, agent, auto, gate), owner, SLA, input, output; a trigger; a named owner and backup; a cited reference standard.
2. **Data model and integration decision**: search the registry first; reuse, then extend, then new; a rationale for each; authority and classification on every field; register with `ATLAS.addEntity` and log the decision.
3. **Metrics and maturity**: `METRICS` entries with formula, owner, target and remediation; a maturity record on the process capability engine (`PROCLIB.maturity`, rolls up in `MAT`).
4. **Interconnectivity**: `MODMAP.addModule` and `addFlows` with a flow in and a flow out; links to projects, strategy, tickets, people, approvals; a search provider and a chat intent.

## Workflow
1. Frame the feature: name, purpose, named owner, band on the Master process flow, kind (module, citizen app, agent).
2. Check what exists: call the platform MCP tools `search_registry` and `check_reuse`. If the platform already has it, reuse it and stop.
3. Call the four agents in this order, one at a time, passing each result forward (use the Task tool; each is a sub-agent definition in `agents/`):
   - `oukala-process-architect`
   - `oukala-data-integrator`
   - `oukala-metrics-maturity-steward`
   - `oukala-connectivity-steward`
   Or call the orchestrator `oukala-feature-contract`, which does all four and the report.
4. Assemble a draft manifest (`process`, `data`, `metrics`, `maturity`, `links`) and call the MCP tool `run_feature_contract` with it. Repeat the agent for any rule that is not a pass.
5. Fill the checklist below. Do not claim done until every box is ticked or a waiver exists.
6. If a rule cannot be met now, prepare an exception (rule check id, reason, covering control, named owner, expiry within 90 days). A person raises it; it becomes a debt item.
7. Produce the report and attach it to the pull request.

## Checklist
- [ ] Process registered (`PROC.reg` and `PROCLIB.addProcess`), 3+ steps with owner, input, output; trigger; owner and backup; standard cited
- [ ] Every entity registered or planned; each decision recorded (reuse, extend or new) with rationale; no unresolved duplicate; every field has authority and classification
- [ ] 1+ metric with formula, owner, target, remediation; maturity model and target set; rolls up in Maturity models
- [ ] Flow in and flow out on the map; search record; chat intent; approvals, notifications and audit through platform services
- [ ] Naming rule clean
- [ ] `run_feature_contract` shows pass on all four rules (or waived with an expiry)

## Report format
```
Feature contract report: <feature>
Result: <score> of 4 (<level>) - Ready to publish | Blocked
1 Process model: PASS|GAP|WAIVED - evidence, fix
2 Data model and decision: PASS|GAP|WAIVED - decision reuse|extend|new, rationale
3 Metrics and maturity: PASS|GAP|WAIVED - metrics, model, target
4 Interconnectivity: PASS|GAP|WAIVED - flows in/out, search, chat
Naming rule: clean|violated
Exceptions: none | rule, owner, expiry
Next actions: ...
```

## Naming rule
Never use FAF, Codification or ASU (or ASC, FASB, GASB) in anything you write. This is a standalone product that may be shown to peers of the first customer. The sample customer is Meridian Standards Foundation, with the Standards Portal and the Standards Platform as sample systems. Other organizations' processes are added later as process content.

## Style
Plain American English, define acronyms on first use, no em dashes. AI-generated drafts are labeled and a person accepts them.

## Repo docs
- `docs/FEATURE_CONTRACT.md` (the rules, evidence, exceptions)
- `MODULE_GUIDE.md` (module conventions; the Feature Contract section replaces the older hard rules where they conflict)
- `agents/oukala-*.md` (the agent definitions)
- Screen Platform, Feature contract (`plat_contract`); MCP tool `run_feature_contract`
