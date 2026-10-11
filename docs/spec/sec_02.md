# 2. Standing rules and product principles

Every screen, module, agent and record must obey seven standing rules, each with an automatic check, a named owner and a register filter.

The rules below were set by the product owner across Rounds 11 to 16 and apply from the first commit. Where a later rule conflicts with an earlier one, the later rule wins. Facts in this section were read from the build `out_v16b` (169 screens, 123 modules).

## 2.1 The seven rules at a glance

| # | Rule | One-line test | Enforced by | Register |
|---|---|---|---|---|
| 1 | No chatty AI voice | A screen shows facts, deltas and labeled chips, never conversational prose | Prose audit script, `aiChip` labeling, review | OK-AI-nnn |
| 2 | Guardrails in a box | Every agent runs inside tier, scope, budget, confidence floor and kill switch | Agent runtime, gate check `aigw` | OK-AI-nnn |
| 3 | Owner and backup on everything | Two different named humans per record | Gate check `ownx`, Ownership and gaps screen | OK-PLAT-nnn |
| 4 | Reuse first | Reuse, then extend, then new; decision recorded | Gate check `nodup`, `ct_data`, registry search | OK-PLAT-nnn |
| 5 | Naming bans | Banned words never appear in product text, data, code or commits | Contract report lint, build sweep | OK-PLAT-nnn |
| 6 | One name per screen | Sidebar label, h1, breadcrumb and tab title are one string | Names audit, `R15.alias` | OK-SHELL-nnn |
| 7 | Feature Contract | Every feature has process, data, metrics and links | Gate checks `ct_*`, retrofit matrix | OK-PLAT-nnn |

## 2.2 No chatty AI voice

The product does not talk to people. It shows numbers, trends, deltas, labeled chips and formula lineage.

Allowed text sources are authored labels, data values and text a person asked for. AI-authored text appears only after a person uses Ask or Why am I seeing this, and it carries an AI label with model and basis.

1. A confidence percentage appears only with a stated basis (for example "est. 86% on 41 cases") or when it is unique on the screen. Otherwise the chip shows the evidence count or "draft".
2. Home insights are facts and deltas as chips. They contain no advice sentences.
3. Agent profiles show data chips, sparklines and a tier-rule check. They contain no description prose beyond the registered "does" line.
4. Sentences in specifications and help text stay under 25 words and avoid first-person voice.

## 2.3 Guardrails in a box

Each agent is governed by a fixed set of controls shown beside it and checked before every run. A control that is not set blocks the run, not the screen.

| Control | Default | Where enforced |
|---|---|---|
| Human sponsor and backup | Required; an agent is never an owner | Agent registry, gate check `ownx` |
| Autonomy tier | Tier 1 suggest, Tier 2 act with approval, Tier 3 act within rules | Agent runtime `gate` |
| Daily budget cap | $10 / $15 / $20 by tier | Agent runtime, AI usage and cost |
| Confidence floor | 0 / 75 / 80 percent by tier | Agent runtime |
| Kill switch | Global, tier or single agent; pause or kill | Agent runtime `setControl` |
| Lifecycle | draft, testing, active, paused, retired | Agent registry state machine |
| Run record | Inputs, tools, output, cost, confidence with basis, decider | `agent_run` entity |

Details and measured counts are in section 11. The 13 working agents shown in the rail come from one source, `AGENTS_STATE`, which also feeds the org chart and the Control Tower.

## 2.4 Owner and backup on everything

Every feature, module, process, metric, entity, agent, policy, budget line, vendor, contract, risk and knowledge item has one accountable human and a different named backup. A team, a role or an AI agent does not count.

The ownership registry `OWNX` holds about 1,290 records. Owners resolve through the org chart: 60 people (45 humans, 15 agents) and 40 accountability domains with owner and backup. Gaps are never hidden. A badge appears on screen headers, process pages, metric cards, entity tables and nav entries.

| Gap type | Records now | Meaning |
|---|---|---|
| Unowned | 3 to 4 | No person resolved |
| No backup | 23 | Owner named, backup missing |
| Role only | 96 | Record names a role or team; owner inferred and flagged |
| Agent only | 8 | An agent is named with no human sponsor |
| Inferred owner | 438 | Resolved from the domain; a person must confirm |

An accepted gap is an exception of at most 90 days with a reason, an owner and a Technical debt item. The Ownership and gaps screen (`own_gaps`) is the single place to resolve them.

## 2.5 Reuse first

Before any new entity, field, list or screen, the builder searches the registry and chooses in this order: reuse, extend, new. A new entity states what the closest existing entity lacks.

The data atlas holds 237 entities and 2,165 fields, and all fields carry a classification. The reuse check flags 5 near duplicates and 11 entities marked duplicate. One registry per list is the same rule applied to pickers: `LISTS` defines 14 lists once and every picker reads them.

## 2.6 Naming bans

The product may be shown to peers of the first customer, so some words and names are banned everywhere. This covers product text, seed data, code comments, documents and commits.

| Ban | Applies to | Check |
|---|---|---|
| The owner's real name; the executive persona is Casey Rowan (CIO) | Text, data, code, commits | Build sweep; neutral commit author |
| Six listed standards-body and framework terms (see the contract lint list) | New and existing text | Contract report lint; build sweep |
| Sample customer is Meridian Standards Foundation | Sample data | Review |
| Sample systems are the Standards Portal and Standards Platform | Sample data | Review |
| Product name is not final; no name in identifiers | Code, config | One configuration value |
| Agent display name is "FirstName · Role Title" | Agent lists, org chart | `agentDisplay()` |

Process content from other organizations arrives later as tenant content, never as product text.

## 2.7 The Feature Contract

A feature is not done until it has a process model, a data model with an integration decision, metrics with a maturity record, its connections to the rest of the app, and a named human owner and backup. Rules 1 to 4 are scored 0 to 4; rule 5 is a gate.

| Rule | Artifacts | Check id | Design time | Publish gate | Runtime |
|---|---|---|---|---|---|
| 1 Process | `PROC.reg`, `PROCLIB.addProcess` with 3 or more steps, owner, backup, cited standard | `ct_process` | Process architect agent | Blocks from team tier | Retrofit matrix |
| 2 Data | Entities with authority and classification; reuse, extend or new with rationale | `ct_data` | Data integrator agent | Blocks from team tier | Atlas coverage |
| 3 Metrics | Metric with formula, owner, target, remediation; maturity record | `ct_metrics` | Metrics steward agent | Blocks from team tier | `m_contract_*` metrics |
| 4 Links | `MODMAP` flow in and out, search provider, Ask intent | `ct_links` | Connectivity steward agent | Blocks from team tier | Connections and gaps |
| 5 Owner | Entry in `OWNX`, named owner and different backup | `ownx` | Orchestrator agent | Blocks Register | Ownership and gaps |

Current state of the retrofit matrix: 181 features scored, 109 at full contract (60 percent), 147 open gaps, 2 waivers and 11 days average time to close. The gate runs 18 checks in total. The Connections and gaps score is 99 and must not fall.

## 2.8 Exceptions

A waiver names the feature and rule, the reason, the covering control, an accountable owner and an expiry of at most 90 days. It is raised as a Technical debt item, so it stays priced and visible. After expiry the check fails again.

The contract is also callable from any coding client through the MCP tool `run_feature_contract` with a draft manifest. Run it before writing code and again before the pull request.

## Known gaps

1. Chatty-prose detection is an audit script run by hand (`a14_prose.js`); it is not a blocking build step.
2. 147 features have open contract gaps; 26 lack a process model and 20 lack a data decision.
3. 130 ownership records have gaps; 438 owners are inferred and need confirmation.
4. The banned-word lint covers the contract report and a build sweep; commit messages are checked by convention only.
5. The product name is undecided, and a trademark search is pending.

Register filter: Module=PLAT (rules 3, 4, 5, 7) and Module=AI (rules 1, 2); Module=SHELL (rule 6).
