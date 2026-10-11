# 11. AI agents and guardrails

Agents suggest or act only inside a tier, a budget, a confidence floor and a kill switch, and every run leaves a record.

Counts were read from `AGENTS_STATE`, `AGENTRT`, `GUARD` and `ORGX` in the build `out_v16b`. The rule that AI never speaks in chatty prose is in section 2.2.

## 11.1 Registry

The registry (`agent_registry`) holds 15 agents. Each has a named human sponsor and a different backup, a purpose line, a tier, a scope and a lifecycle state. An agent is never an owner.

| Measure | Value |
|---|---|
| Agents in the registry | 15 |
| Registered in the runtime view | 16 |
| Working now | 13 |
| Idle | 2 |
| Enabled | 15 |
| Behind the gateway | 5 |
| Runs recorded | 33 |

The registry, the org chart and the Control Tower read one source, `AGENTS_STATE`. Requirements: see OK-AI-001 to OK-AI-nnn (register filter: Module=AI).

## 11.2 Tiers

| Tier | Name | Gate | Daily cap | Confidence floor |
|---|---|---|---|---|
| 1 | Suggest | None; a person acts | $10 | 0 |
| 2 | Act with approval | Sponsor approves each action | $15 | 75 percent |
| 3 | Act within rules | Acts alone at or above the floor | $20 | 80 percent |

A tier is set per agent. A tier change is a recorded decision of the sponsor.

## 11.3 State machine

An agent moves through five lifecycle states.

| State | Meaning | Runs |
|---|---|---|
| draft | Defined, not tested | No |
| testing | Runs on test data | Test only |
| active | In service | Yes, inside its tier |
| paused | Held by a person | No |
| retired | Withdrawn; record kept | No |

Each move writes an `agent_event`.

## 11.4 Kill switch

A control has a scope and a kind. A control wins over the lifecycle state, so a paused scope stops an active agent.

| Scope | Kinds |
|---|---|
| Global | Pause, kill |
| Tier | Pause, kill |
| Agent | Pause, kill |

Controls persist in `agent_control` and write an event.

## 11.5 Gates

Before each run the runtime checks the items below. Any failure blocks the run and records why.

1. The agent is active and no control covers it.
2. The scope allows the data requested.
3. The daily budget cap has room.
4. The tier gate is met: none, sponsor approval or confidence at or above the floor.
5. The caller's permission covers the target (section 9).

## 11.6 Budgets

Each agent has a daily cap by tier ($10, $15, $20). Spend is the sum of run costs for the day. At the cap the agent stops until the next day. Usage and cost appear on the AI usage screen.

## 11.7 Run records

Every run writes an `agent_run` record.

| Field | Content |
|---|---|
| Inputs | Entities and fields read |
| Tools | Tools or connectors called |
| Output | What was produced or changed |
| Tokens and cost | Count and dollars |
| Confidence | A percentage and its basis |
| Tier gate | Gate result and the decider |
| Decider | The human who approved, or "within rules" |

## 11.8 Confidence and evidence

1. Confidence shows as a percentage only with a basis, for example "est. 86% on 41 cases".
2. If the percentage is unique on the screen, a basis is not required.
3. Otherwise the chip shows the evidence count or "draft".
4. Tier 3 acts only at or above 80 percent.
5. An AI draft in a register has no standing until an owner accepts it. Decision rules show 618 such drafts (section 7.8).

## 11.9 Naming

An agent displays as "FirstName · Role Title", produced by `agentDisplay()`. The sponsor and backup show beside the name, for example Maya Ortiz with Casey Rowan as backup for the First Officer agent. Agents have no employee id and appear in the directory with type "ai": 15 of 89 records.

## Known gaps

1. The runtime view shows 16 agents while the registry holds 15.
2. Only 5 agents sit behind the gateway.
3. Agent runs are simulated; no model is called from the page.
4. The 33 recorded runs are seed data and the cost figures are estimates.
5. Tier changes do not yet require a recorded test pass.

Register filter: Module=AI (all subsections).
