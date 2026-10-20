# ADR-002: Persistence and authentication plan

An ADR (architecture decision record) states a design decision, its context, consequences and alternatives. This one covers backlog item CL-69 and is the plan for PR-13 (persistence layer, real authentication, connectors and model-backed agents for a pilot). It carries no status or priority of its own; those live in the Product Backlog.

**Document state: draft.** Omar has not set the persistence and authentication timeline (decision 9, `docs/PLATFORM_RULES.md`: "not yet"). This paper therefore sets an **order** and **dependencies**, not dates, and recommends a direction on the open data-store and workflow-runtime question. It commits to nothing until Omar accepts it.

**Security review note.** Sign-in, tenant isolation, connectors and agents are security-critical. This document is a plan, not a claim that any control exists. It must be reviewed by a qualified security architect before any real customer data is stored (CL-70). It makes no certification claim (R52).

Date drafted: 2026-10-19. Related: ADR-001 (tenant isolation), ADR-003 (tenant controls), ADR-004 (identity and membership). Rules: R12, R14, R16 to R22, R35, R43 to R45, R49, R51, R52.

## 1. Context

The prototype is database-free and single-page (prototype fact, 2026-10-19). It simulates, and does not perform, these things:
- **Persistence.** Sample data is in the page; state is kept in memory and some browser storage (`U.store`). There is an in-memory entity store (`STORE`, `src/mod_r15f1_a_store.js`) and a design catalog of entities (`ATLAS`, `DATAMODEL`).
- **Sign-in.** There is no authentication. A role guard (`GUARD.can(user, action, resource)`, `src/mod_r15f3_iam.js`) and an "act as" switch demonstrate permission checks in the page.
- **Workflows.** `src/mod_r15f1_b_wf.js` is a simulated durable workflow runtime: it executes saved definitions with task, approval, decision, parallel, wait or timer, connector call (simulated and labeled), notify, sub-process and loop steps, keeps instance state in `STORE`, resumes after a reload, and runs a demo clock faster than real time. The run monitor screen is `wf_runs`.
- **Connectors and agents.** Connectors, sync, AI runs and the agent runtime (`src/mod_r15f1_c_agent.js`) are scripted and labeled simulated. An AI gateway screen (`adm_gate`) shows budgets and policies without a real gateway.

Tenant rules can be demonstrated but not proven until a real store and sign-in exist (Open Questions, 2026-10-19). The two open technical choices are the data store (assumed PostgreSQL, from the row-level security decision in ADR-001) and the workflow runtime: a state machine built on Postgres, or Temporal (a durable-execution workflow engine).

## 2. Decision (proposed)

### 2.1 Order of work
Each step depends on the ones before it. The order is the point; no durations or dates are implied.

| Step | What | Why here | Depends on |
|---|---|---|---|
| 1 | **Persistence foundation**: PostgreSQL with the tenant model of ADR-001 (tenant column, row-level security, tenant-scoped keys), migrations, an application programming interface (API) layer behind the existing `DATA` seam, tenant packs (DC-09) as import and seed format | Everything else stores something. Isolation is cheapest to build in at the start and costliest to retrofit | ADR-001 reviewed |
| 2 | **Real sign-in and memberships** (ADR-004): a managed identity provider using OpenID Connect and SAML, identities, memberships, roles per membership, default deny, audited tenant switch, a session that carries one explicit active tenant | Row-level security needs a verified tenant context from an authenticated identity. Without it, isolation is untestable | Step 1 (can be built as one thin vertical slice with it) |
| 3 | **Audit log and tenant controls** (ADR-003): append-only audit events for sign-ins, switches, exports and support access; retention and deletion machinery | Rule R35 says every action is audited; later steps produce events that must land somewhere | Steps 1 and 2 |
| 4 | **Workflow runtime** for processes, approvals and timers (section 3) | The platform's core objects are processes with steps owned by people, robots and agents. Human tasks, service-level timers and approvals need durable state | Steps 1 to 3 |
| 5 | **Connectors**, read-only first: one directory or identity source and one ticketing or finance source, with per-tenant secrets held in a secrets service, scheduled sync, honest freshness and failure display. Write-back later, by robot steps under approval | Agents and processes need real data; reading is lower risk than writing | Steps 1 to 4 |
| 6 | **Model-backed agents** behind an AI gateway: per-tenant context, a box for each agent (tier, budget, confidence floor, kill switch, named human sponsor, versioned prompts: R22), start with agents that suggest and a person decides, then act-and-report only where tested | Agents need identity, audit, data and a workflow to act through. R49 requires no mixing of tenants | Steps 1 to 5 |

A "pilot" in PR-13 means steps 1 to 4 plus a read-only slice of step 5 for one design-partner tenant, with agents limited to suggest-only. This definition is a proposal for Omar to confirm.

### 2.2 Authentication choices (outline)
- Use a **managed identity provider** rather than building credential storage: standards-based OpenID Connect for login, SAML and SCIM (System for Cross-domain Identity Management) for enterprise customers' own single sign-on and provisioning, multi-factor authentication required.
- Identities are keyed by identity-provider issuer and subject, not by email address, so account linking is explicit (ADR-004).
- Per-tenant sign-in configuration (a customer's own identity provider) is a tenant setting.
- Sessions are short-lived; a tenant switch mints a tenant-scoped token (ADR-004).
- Product staff use the same system with tenant-approved, time-boxed grants (R51).

### 2.3 What stays simulated until each step lands
Until a step exists, the prototype keeps labeling the matching capability as simulated (R29, R52). No sign-in, isolation, sync or AI run may be shown as live before then.

## 3. Open question: Postgres-backed state machine or Temporal

### 3.1 What the platform needs from a workflow runtime
Drawn from the prototype's own process model:
1. **Definitions are data, edited by non-engineers** in the workflow designer (R4). Each step has a mode (human, robot, agent, or an approval gate: R21), conditions, next steps, service-level timers and owners. Any engine must run these definitions, which means an interpreter of the definition exists whichever engine is chosen.
2. **Human-paced work.** Tasks assigned to groups (R15), approvals routed to groups never to the requester (R14), waits of hours to days, escalations on timers.
3. **Robots are deterministic**; **agent steps call a language model**, which is slow and unreliable, so they need timeouts, retries, backoff and a record of every attempt (R22, R35).
4. **Tenant isolation** (R43, R45): every instance, task, timer and audit event belongs to one tenant, and a tenant's data can be exported and deleted with proof (ADR-003).
5. **Definition versioning** while instances are in flight.
6. **Visibility**: a run monitor, search of instances, per-step history.
7. **Scale for a pilot** is small (hundreds to low thousands of instances a day, **hypothesis**); the design must not close the door on more.

### 3.2 Options
| | A. Postgres-backed state machine (own) | B. Temporal | C. Hybrid |
|---|---|---|---|
| How | Tables for instances, step runs, tasks and timers in the same Postgres; workers claim work with row locks that skip rows other workers hold; an interpreter walks the definition; an outbox table publishes events. Candidate libraries for the queue and timer layer exist and should be evaluated before building any of it | A workflow engine service (self-hosted or the vendor's cloud) runs workflows written as code; activities do side effects; a generic "interpreter workflow" would run the data definitions | State machine for process and approval instances; durable job queue for robot and agent activity; Temporal adopted later if triggers are met |
| Tenant isolation | Native: same database, same row-level security, one transaction can change a step and a business record together | Separate store. Isolation by namespace per tenant or by identifiers and search attributes; payloads in history must be encrypted per tenant; cross-store consistency needs idempotent activities and an outbox | As A, with isolation at the queue |
| Offboarding proof (ADR-003) | One purge path through the same database | History retention and deletion in a second system must be added to the purge contract | As A |
| Reliability of timers, retries, long waits | Must be built and tested; well-known patterns, real effort | Strong out of the box: durable timers, retries, signals for human tasks, history replay, versioning by patching | Partial |
| Fit to editable definitions | Direct: the interpreter is the product | Needs an interpreter workflow inside the engine; code determinism rules apply to it | Direct |
| Operations | One more set of tables and a worker; same backup, restore and monitoring | A cluster to run or a vendor service to adopt, with its own data location, residency and cost questions (no price implied) | A plus later B |
| Failure of the dependency | Postgres is already critical | A second critical system | |
| Lock-in | Low | Medium: code written to the engine's API | Low at first |
| Main risk | Rebuilding durable-execution features and getting edge cases wrong; polling limits at high volume | Operating burden and isolation, deletion and residency complexity for little gain at pilot scale | Two paths to maintain |

### 3.3 Recommendation (hypothesis)
Choose **A, with a narrow interface**, for the pilot and early customers:
- Process instances are human-paced and small in number; the prototype's runtime already shows the step types needed and fits a database state machine.
- Keeping state in the same Postgres makes row-level security, transactional business-plus-workflow updates, audit and deletion-with-proof simple and easier for a security reviewer to verify. Those are the hardest parts of Option B for a multi-tenant product.
- The interpreter of editable definitions has to be built either way.
- Put the runtime behind a small **workflow core interface** (start instance, complete task, signal, cancel, query) so the engine underneath can be swapped.

Move to Temporal (or add it for specific flows) if **any** of these happen (thresholds are placeholders):
1. Multi-day agent sagas with compensation steps become a main use, or retry and timer code grows beyond a few modules that need constant care.
2. Concurrent active instances or timers exceed what polling workers handle with headroom.
3. A customer requires dedicated worker pools or regional execution that the database approach cannot meet.
4. Engineering time spent on durable-execution defects is a visible share of effort.

### 3.4 Spike that would settle it
A time-boxed comparison on one real slice, built both ways. Estimated effort is **5 to 8 working days (hypothesis)**; it is not scheduled.

Slice: the invoice approval flow (`inv`) or the budget request funnel, as a six-step process with a human approval routed to a group, a timer that escalates after two days, a robot step, an agent step with a stubbed model that fails some calls, and a mid-flight change of definition.

Measure on each build:
| Measure | Pass looks like |
|---|---|
| Crash recovery | Kill the worker mid-flight; all instances resume with no lost or double-run step |
| Timer accuracy | Escalations fire within a stated tolerance after restart |
| Retry behavior | Agent failures retried with backoff and recorded; no duplicate side effect |
| Definition change | In-flight instances finish on the old version; new ones use the new |
| Tenant isolation | Two tenants, same definitions: no cross-visibility in queries, logs or history; leakage test passes (R18) |
| Offboarding | Delete one tenant: a purge report shows zero remaining instances, tasks, timers and history for it |
| Effort and size | Lines of code, days to build, number of moving parts, operating steps |
| Latency | 95th percentile for task creation and completion at a stated load |

The decision rule: if Option A passes every row with modest code, choose A; if Option B removes a failure class that A cannot be made to pass within reasonable effort, choose C or B.

## 4. Consequences

- Persistence, sign-in and audit land before workflow, connectors and agents. Until they do, the product demonstrates tenancy and agents but cannot prove them.
- Workflow state sits in the same store as business data, which simplifies isolation and deletion but means the workflow load shares capacity with the rest. Quotas per tenant (ADR-001) apply.
- A swap interface costs a little design effort now and protects against being locked to the first engine.
- The first connector and the first agent are small on purpose; each is added only when audit, secrets and isolation for it are reviewed.
- The plan implies work on screens currently simulated (`wf_runs`, `adm_gate`, `r15_iam`, `plat_fab`): they become real surfaces and must stop saying "simulated" only when true.

## 5. Alternatives considered for the order
| Alternative order | Why not |
|---|---|
| Connectors first, to get real data into demos | Needs tenant-scoped secrets and storage first; real data before isolation is the risk this program avoids |
| Agents first, because they are the differentiator | They need identity, audit, data and a workflow; an agent without a box and audit is the failure R22 prevents |
| Workflow engine first | Needs persistence and identity; nothing to run on |
| Build everything in parallel | Possible later for separate teams; the dependencies above remain |

## 6. Open points for Omar and the security architect
- Timeline, and who builds it (decision 9).
- The definition of "pilot" in 2.1.
- Managed identity provider selection and where it runs (region, residency).
- Managed Postgres product and region.
- Whether to evaluate any queue and timer libraries before the spike.
