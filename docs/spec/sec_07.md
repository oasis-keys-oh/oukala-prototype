# 7. Process model

The process library holds 252 processes in four levels, each with a five-level guide, tenant overlays inside fixed guardrails, and approvals that name groups only.

Counts were read from `PROCLIB`, `FLOWX`, `DECX` and `R16M` in the build `out_v16b`. The library covers all 123 modules.

## 7.1 Process library and levels

| Level | Meaning | Processes |
|---|---|---|
| 1 | Process family | 36 |
| 2 | Process | 74 |
| 3 | Activity | 122 |
| 4 | Task | 20 |
| Total | 21 families | 252 |

Each process has an owner, a backup, a cited standard and at least three steps. A process without a registered owner fails the Feature Contract check `ct_process`. Requirements: see OK-PROC-001 to OK-PROC-nnn (register filter: Module=PROC).

## 7.2 Five guide levels

Every process can be opened as a guide at five depths. A reader chooses the depth; the content is not duplicated between depths.

| Guide | Audience | Content |
|---|---|---|
| L1 | Executive | Purpose, trigger, owner, maturity |
| L2 | Manager | Flow overview and handoffs |
| L3 | Practitioner | Step detail: inputs, outputs, SLA, control |
| L4 | New starter | Work instruction with screens and examples |
| L5 | Auditor and builder | Reference: entities, metrics, standards, exceptions |

## 7.3 Tenant overlays

A tenant adapts the shared library through overlays, not copies. The base process stays intact and the overlay records the difference, so a library update still flows through.

| Overlay operation | Effect |
|---|---|
| approvals | Change levels, groups or mode |
| owner_group | Move ownership to another group |
| sla | Change a service target |
| add_step | Insert a step |
| remove_step | Remove a step |
| parameter | Change a threshold or value |

Eight guardrails (GR-01 to GR-08) check every overlay before it saves.

1. The gate keeps at least one approval level.
2. Levels use distinct groups.
3. Separation of duties holds (section 9).
4. Approvals name groups, never people.
5. Protected classes keep their approvals.
6. The structure floor is kept: steps required by a standard stay.
7. An SLA may not exceed its ceiling.
8. Parameters stay inside declared limits.

Overlays persist through `STORE` (`tenant_overlay`). The tenant in the sample is TEN-MSF, with go-live 2026-11-13. Editions and deployment models are in section 14.

## 7.4 Approvals

Approvals go to groups. A person approves because they belong to a group, so leavers and movers need no rule change. The 15 approval groups are below.

| Group | Group | Group |
|---|---|---|
| G-CAB | G-EXEC | G-FIN |
| G-SEC | G-PGB | G-PROC |
| G-PPL | G-DATA | G-ARCH |
| G-PLAT | G-SD | G-PMO |
| G-REQ | G-OWN | G-AUTO |

A process can have nested levels, evaluated in order. Each level names one group and one mode.

| Mode | Rule |
|---|---|
| Any one | The first member to decide closes the level |
| All members | Every member must approve |
| N of M | A set number of members must approve |
| First responder | The first response wins, approve or reject |

A requester never approves their own request. Escalation, delegation and deferral emit events (section 10). Membership is managed on the access screens (section 9).

## 7.5 Workflow runtime

`FLOWX` holds 312 workflows with 43 percent of nodes automated. A workflow is a graph of typed steps.

| Node kind | Count | Node kind | Count |
|---|---|---|---|
| trigger | 312 | wait | 5 |
| auto | 576 | assessment | 4 |
| agent | 190 | end | 318 |
| decision | 23 | parallel | 3 |
| approval | 346 | subflow | 3 |
| human | 683 | loop | 1 |

The runtime has five calls: start, control, decide, instances and tick. Instances persist in `STORE` (`workflow_instance`, `step_run`). Timers, retries and SLA breaches fire events. A design tool draws the graph with drag, drop and auto-connect, and Fit on open.

## 7.6 Order guides

An order guide bundles several catalog items and tasks into one request with one owner. The build has five, including onboarding, project start, move and offboarding. Each launches its tasks to the right group and tracks them as one record.

## 7.7 Change status launches

A status change in the org model starts work (section 6.6). The 14 statuses launch three processes, two order guides, an asset return and catalog access items.

| Status category | Process | Order guide or catalog item |
|---|---|---|
| Transfer, move | `org_status_change` | Move |
| Absence | `org_absence` | Handover rule per status |
| Separation | `org_separation` | Offboarding; asset return; catalog access |

Handover is never, by rule or always, per status.

## 7.8 Decision rules

`DECX` records each decision point in a process as a rule. Kinds are approval, route, review, eligibility, release and completion. Modes are human, recommend and auto.

| Measure | Value |
|---|---|
| Processes scanned | 253 |
| Decision points | 624 |
| Accepted by an owner | 6 |
| AI drafts awaiting review | 618 |
| Without a test | 621 |
| Coverage | 2 percent |

An AI draft is never active. An owner accepts it, adds a test case and sets the mode. Auto mode requires Tier 3 limits (section 11).

## 7.9 Maturity of processes

Each process is scored on six dimensions: defined, owned, measured, integrated, automated and governed. The average maturity is 2.7 of 5 and 148 processes sit below target. The model is in section 8.

## Known gaps

1. Only 6 of 624 decision points are accepted; 621 lack a test.
2. 148 processes are below target maturity.
3. Only 43 percent of workflow nodes are automated; 683 are manual steps.
4. Level 4 holds 20 processes, so most task-level work instructions are missing.
5. The library says 252 processes while the decision scan reads 253.
6. Overlays are stored in the browser for the prototype; no tenant has a published overlay set.

Register filter: Module=PROC (7.1 to 7.3, 7.6 to 7.9), Module=APPR (7.4), Module=AUTO (7.5).
