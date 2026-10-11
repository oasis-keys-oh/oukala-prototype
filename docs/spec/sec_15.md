# 15. Build handoff to Claude Code

Every row of the specification register becomes an epic or a user story with acceptance tests, the repository and pipeline enforce the same Feature Contract the product enforces, and the build is tracked inside the product itself so progress is a live record, not a status deck.

This section assumes sections 1 to 12 are written as a register (one row per requirement) and that sections 13 and 14 define setup and architecture. The register is the single input to the build; nothing is built that is not a register row, and every row ends with a passing test or an approved exception.

## 15.1 From register to stories

### Register row

Each register row carries these fields. Rows already exist for the prototype's screens (169), modules (123) and flows (745) and are extended by sections 13 to 16.

| Field | Meaning |
|---|---|
| reg_id | Stable id, `R-<section>-<seq>` (for example R-14-031) |
| section | Specification section |
| category | UX, DATA, PROC, API, SEC, INT, AI, OPS, NFR, COMM |
| priority | P1 (blocks pilot), P2 (blocks rollout), P3 (later) |
| statement | One testable sentence |
| acceptance | Acceptance criteria in Given/When/Then form |
| entities | Registry entities read or written (reuse, extend or new, with rationale) |
| owner and backup | Named humans (Feature Contract rule 5) |
| depends_on | Other reg_ids |
| phase | Build phase 0 to 7 (section 14.25) |
| status | Not started, In progress, In review, Done, Waived |

### ID mapping

| Level | ID pattern | Source | Count rule |
|---|---|---|---|
| Epic | `EP-<module>` | One per module on the module map (123 in the prototype); platform epics for the services in section 14 (identity, authorization, entity store, workflow engine, timers, notification, fabric, MCP, agents, reporting, observability, security, DR, CI/CD) | One epic per module or service |
| Feature | `FT-<module>-<nn>` | One per screen or capability inside a module | Reuse the existing `feature` entity |
| Story | `ST-<module>-<seq>` | One per register row that a person or agent can finish in a day or two | Reuse the existing `user_story` entity |
| Task | `TK-<story>-<n>` | Build, test, doc, migration | Reuse `work_item` |
| Test | `T-<story>-<n>` | Acceptance test, tagged with the story id | New entity `test_run` records results |

Mapping rules:

1. Every register row maps to at least one story; a row too big for one story becomes a feature with several stories, each carrying the parent reg_id.
2. Every story points back to its reg_id. The tracker reports unmapped rows (no story) and orphan stories (no row) as findings.
3. Stories inherit owner and backup from the row; the builder never assigns accountability to an AI agent.
4. Stories for the 12 workflow node types, 8 overlay guardrails, 11 workbook sheets, 10 existing and 6 new MCP tools, 70 events and the 13 connectors are generated from registry data rather than written by hand, so counts in the prototype become checkable counts in the build.

### Story template

```
ID: ST-<module>-<seq>
Title: <verb> <object> (user-visible outcome)
Register: R-<section>-<seq>
As a <role> I want <capability> so that <outcome>
Process: <PROCLIB id and step(s) affected>
Data: <entities and fields; reuse | extend | new; classification; authority>
Permissions: <entity, row filter, field masks, roles>
Events: <events emitted or consumed from the catalog>
Metrics: <metric ids moved by this story>
Owner / Backup: <named humans>
Acceptance (Given / When / Then):
  1. ...
Non-functional: <latency, volume, accessibility, audit>
Out of scope: ...
Definition of done: see 15.2
```

### Definition of ready

A story enters a sprint only when all are true:

1. Register row linked and acceptance criteria written in Given/When/Then.
2. Entities identified, with the reuse-first decision recorded and no unresolved duplicate.
3. Permissions stated at table, row and attribute tiers.
4. Events and metrics listed, or "none" with a reason.
5. Named human owner and a different backup.
6. Dependencies done or scheduled in the same sprint.
7. Estimate of two days or less; otherwise split.
8. Test approach named (unit, contract, UI, load).

### Definition of done

1. Code merged to the main branch through a pull request with required checks green.
2. Acceptance tests exist, are tagged with the story id and pass in CI.
3. Feature Contract: the four rules pass (`run_feature_contract` returns pass or waived with an expiry), and gate check `ownx` passes.
4. Registry updated: entities, fields (class and authority), events, permissions, metrics, process steps, module flows.
5. Authorization verified: a negative test shows a user without access is denied at table, row and attribute tiers where they apply.
6. Audit events emitted for every state change; notification templates registered if users are notified.
7. Accessibility check passes (WCAG 2.1 AA scan on new screens); data-link walker passes.
8. Migration is forward-only, expand-and-contract and tested on representative data.
9. Documentation: runbook entry or guide updated; release note drafted.
10. No new findings in the technical debt ledger without an owner and expiry.
11. Deployed to the test environment behind a flag; product owner or delegate accepted in the tracker.

### Acceptance test conventions

1. One test file per story; the test name starts with the story id: `ST-ppm-014 creates a project from an approved demand`.
2. Given/When/Then structure maps one to one to the acceptance criteria.
3. Layers: unit for pure logic; contract tests for API and events (schema from the registry); UI end-to-end with a browser driver for screens, in light and dark themes, at desktop and phone widths; load tests for the scale checks in section 14.24.
4. Test data comes from the sample tenant seed (the sample standards foundation) and synthetic generators; no production data.
5. Cross-tenant and permission tests are mandatory for any story that reads or writes records.
6. Each test run is recorded as `test_run` with story id, commit, result, duration and artifacts.
7. A requirement is covered when every acceptance criterion has a passing test; the tracker computes coverage per register row.
8. Flaky tests are quarantined with an owner and a seven-day expiry.

## 15.2 Repository layout

Recommendation: one monorepo, one deployable, enforced module boundaries.

```
/apps
  /web                 web client (screens generated from registry plus hand-built views)
  /api                 modular monolith entry point (REST, GraphQL read model, MCP server)
  /worker              workflow, timer, ingest and connector workers
  /agent-runtime       sandboxed agent runner
/packages
  /registry            entity, field, event, process, permission, metric definitions (the source of truth)
  /modules/<module>    one package per module (ppm, itsm, itom, knowledge, workflow, approvals, grc, bcdr, agents, ...)
  /platform/<service>  identity, authz, entity-store, workflow-engine, timers, notify, reporting, audit, vault
  /fabric              connector SDK, runtime, certified connectors
  /ui-kit              tokens, components, data-link opener
  /contracts           OpenAPI, event schemas, MCP tool schemas (generated)
/infra
  /modules             Terraform modules (pooled, dedicated, customer account)
  /helm                private install bundle
  /envs                dev, test, prod definitions
/migrations            generated from registry diffs, reviewed
/seed                  base configuration: processes, workflows, metrics, roles, policies, templates
/tests
  /acceptance          per-story tests
  /contract            API, event and MCP contract tests
  /isolation           cross-tenant tests
  /load                scale checks
/tools
  /walker              data-link walker and reference-field check
  /contract-check      Feature Contract runner
  /register-import     register to epics and stories importer
/docs
  /spec                sections 1 to 16 and the register
  /runbooks
CLAUDE.md              build instructions for Claude Code
```

Rules:

1. The registry package is the only place entities and permissions are defined; migrations, API schema and forms are generated from it.
2. Modules import only platform packages and the registry; module-to-module access is through events and published interfaces. CI fails on a forbidden import.
3. A top-level `CLAUDE.md` states the Feature Contract, the naming rule (banned words list), the reuse-first rule, the build, test and lint commands and the guardrails in 15.5.
4. Skills and agents from the prototype (`skills/oukala-feature-contract`, `agents/`) move into the repository so the build is steered by the same rules as vibe-coded apps.

## 15.3 Tracking the build inside the system

Precedent: `mod_selfbuild.js` in the prototype loads the platform's own backlog into Demand, Projects, the WBS and the RAID log, and shows a gap analysis. Today it holds 16 workstreams (one per module group), 55 work packages, an average built depth of 84 percent, and 11 gaps (3 at P1, 5 at P2, 3 at P3), loaded from constants. It seeds a project "Oukala platform build: prototype to pilot" with three risks (in-memory persistence, no real authentication or row-level security, slow screens at enterprise scale). Production replaces constants with live data.

### Build tracker module

New module "Build tracker" (`plat_build`), reusing existing entities.

| Entity | Decision | Notes |
|---|---|---|
| register_item | New | One row per register row, imported from the register file; the closest existing entity (`demand_request`) lacks acceptance criteria, section and phase |
| project, raid_item | Reuse | The build is a project; build risks go to the RAID log |
| feature, user_story, work_item | Reuse | Epics, features, stories and tasks; no second backlog table |
| release | Reuse | Each build increment is a release with release tasks |
| pull_request | Reuse (extend) | Add repository, branch, commit range, check results |
| commit | New | Hash, author (human or agent), message, linked story ids |
| test_run | New | Story id, commit, suite, result, duration, artifact link |
| deployment | New | Environment, version, tenant ring, outcome |
| debt_item | Reuse | Findings and waivers |
| agent run record | Reuse | Build agents appear in the agent registry like any other agent |

### Flow

1. Import: `tools/register-import` reads the register and creates `register_item` records; the importer generates epics, features and stories with the ID mapping above, as proposed records for a person to accept.
2. Link: commit messages and pull request titles must contain a story id (`ST-ppm-014`). A CI check rejects a pull request without one.
3. CI events: the source host and the CI system send webhooks to the connector (a code-hosting connector in the fabric). The connector normalizes them and emits events on the EVENTS bus.
4. Status automation: rules update stories from events, with no manual status edits for the states below.

| Event | Emitted when | Rule effect |
|---|---|---|
| `build.branch.opened` | Branch with a story id is created | Story to In progress |
| `build.pr.opened` | Pull request opened | Story to In review; reviewer agent assigned |
| `build.checks.passed` | Required checks green | PR marked mergeable |
| `build.checks.failed` | Any required check red | Story flagged; failure linked to the PR |
| `build.pr.merged` | PR merged | Story to Merged; test runs linked |
| `build.deploy.succeeded` | Deployment to an environment | Story to Deployed to <env>; release task completed |
| `build.test.result` | Acceptance test finishes | `test_run` created; coverage recomputed |
| `build.story.accepted` | Product owner accepts in tracker | Story to Done only if the definition of done checks pass |

5. Acceptance is the only manual transition into Done, and it requires an owner (or backup) because approvals route to groups: the acceptance group for each epic is a named group with an owner and backup.
6. Everything writes audit events; the build history is queryable like any other record.

### Metrics on build progress

Each metric has formula, owner, target, remediation, as the Feature Contract requires.

| Metric | Formula in words | Direction |
|---|---|---|
| Register coverage | Register rows with at least one story ÷ all register rows | Up |
| Acceptance coverage | Register rows whose acceptance criteria all pass ÷ all rows | Up |
| Stories done | Done stories ÷ planned stories, by epic, phase and priority | Up |
| Cycle time | Median days from In progress to Done | Down |
| PR lead time | Median hours from PR opened to merged | Down |
| Check pass rate | Merged PRs with green checks on first run ÷ merged PRs | Up |
| Escaped defects | Defects found after Done ÷ stories done | Down |
| Waivers open | Open Feature Contract waivers and their age | Down |
| Debt added versus closed | New debt items minus closed items per sprint | Down |
| Deploy frequency, change failure rate, restore time | Standard delivery metrics from `deployment` | Per target |
| Agent contribution | Share of merged PRs authored by build agents, review override rate | Monitor |
| Phase exit readiness | Exit criteria met ÷ exit criteria in section 14.25 | Up |

Maturity: the build process registers in the process library with a maturity record on the default model (six dimensions: defined, owned, measured, integrated, automated, governed) so it rolls up with other processes.

Screens: build dashboard (phase burn-up, coverage, blocked items), epic and story views through the shared record shell, the gap analysis from the prototype driven by live data, and a "what changed since last review" view for the sponsor.

## 15.4 Agent roles for the build

Build agents are registered in the agent registry with a human sponsor and backup, a tier, a tool allow list, a budget and kill switches, like any agent. Roles:

| Role | Responsibility | Reads | Writes | Cannot |
|---|---|---|---|---|
| Planner | Turns register rows into epics and stories; checks readiness; sequences by dependency and phase; proposes splits | Register, registry, tracker | Proposed stories, dependency links | Accept its own proposals; change priority P1 without owner |
| Builder | Implements one story on a branch: code, migration, registry changes, tests | Story, registry, repository | Branch, commits, pull request | Merge; touch production; edit another story's files without a link |
| Tester | Writes and runs acceptance, contract, isolation and load tests from the acceptance criteria; hunts edge cases | Story, repository, test environment | Tests, test runs, defects | Modify production code except test fixtures |
| Reviewer | Reviews diffs against the Feature Contract, naming rule, security checklist, reuse-first; checks the story's definition of done | Pull request, registry, checks | Review comments, approve or request changes | Review its own authored change; approve a failing check |

Operating rules:

1. A builder and its reviewer are always different agent identities; for P1 security-sensitive changes a human reviewer from the owning group must also approve.
2. Agents act through the same MCP server and permissions as everyone: their effective access is the intersection of the sponsor's access and the agent scope.
3. Each run is a recorded run with prompts, tool calls, diffs, cost and outcome; sponsor reviews exceptions weekly.
4. Budget caps per story and per sprint; hitting a cap stops the run and opens a question to the human owner.
5. Agents propose; humans accept. Planner proposals, new entities, new permissions and waivers need an approver group.

## 15.5 Guardrails

| Guardrail | Mechanism |
|---|---|
| Tests gate merges | Required checks: lint, type check, unit, contract, acceptance for the story, isolation, Feature Contract, data-link walker, accessibility scan, secret scan, dependency scan; branch protection blocks merge on any red |
| No self-merge | Author cannot approve; code owners per package |
| Reuse-first | `check_reuse` runs in CI; a new table or field that duplicates a registry item fails unless a waiver exists |
| Naming rule | Lint for banned words (the foundation-specific terms listed in the repository's `CLAUDE.md`) and for the owner's personal name in code, data, fixtures and commit messages; commits use a neutral author |
| Production changes | Require approval from the change approver group; emergency path with after-the-fact review; deployments by pipeline only, no manual access |
| Approver groups | Every approval routes to a group with an owner and backup; segregation of duties applies to build approvals too |
| Audit trail | Every PR, check, deploy, approval, agent run and waiver writes audit events into the chain |
| Waivers | Maximum 90 days, owner, reason, covering control, debt item |
| Data safety | Agents work on synthetic and sample-tenant data only; no production credentials in agent environments |
| Cost | Budgets per agent and per sprint; weekly spend review |
| Kill switches | Global, tier and per-agent, as in section 14.16 |
| Scope control | Agents may touch only files in their story's packages unless the planner links additional ones |

## 15.6 First 90 days

Assumptions: a small human team (product owner, two to three senior engineers, one platform or DevOps engineer, one designer who owns the UI kit, a security lead part time) with build agents doing a large share of implementation. Dates are relative to day 0.

| Window | Focus | Milestone | Exit criteria |
|---|---|---|---|
| Days 1 to 10 | Register final; repository skeleton; CLAUDE.md; CI baseline; tracker import | M0: repo and register live | Register imported with zero unmapped P1 rows; CI runs lint, tests, Feature Contract and walker on the skeleton; build agents registered with sponsors |
| Days 11 to 30 | Phase 0 and the start of phase 1: IaC for pooled path, tenant create and migrate, registry schema and generator, entity store for the first 40 entities, identity (OIDC), audit chain | M1 (day 30): "tenant from code" | A tenant is created, migrated and seeded by one pipeline run; sample tenant signs in through an identity provider; registry seed has zero unclassified fields; audit chain verifies |
| Days 31 to 60 | Phase 1 completion and phase 2 start: authorization service (table, row, attribute) with ported rules, outbox and event bus, notification service, workflow engine core (trigger, auto, human, approval, end), timers | M2 (day 60): "governed work" | Cross-tenant tests pass; one end-to-end approval flows to a group with segregation of duties; 70 events registered; timer lag under 5 seconds at 50 events per second; build tracker shows live CI status |
| Days 61 to 90 | Phase 2 completion and phase 3 start: remaining node types, overlays and guardrails, foundation import pipeline, PPM and ITSM first stories, MCP server read tools | M3 (day 90): "pilot-ready core" | Foundation workbook (11 sheets) loads into a pilot tenant with a clean dry run; change approval runs under two overlays (Customer A and B behavior) with guardrails enforced; PPM and ITSM top-priority stories accepted; MCP read tools pass contract tests; Tier 1 restore test of the database completed once |

Weekly rhythm: Monday plan (planner proposes, owners accept), daily builds and reviews, Thursday demo from the test environment, Friday review of metrics, risks and waivers with the sponsor. Day 45 and day 90 include a stakeholder review of scope against the register.

Capacity check: the prototype has 169 screens across 123 modules. The first 90 days do not rebuild them one for one. They stand up the platform spine and two modules and prove the pattern; remaining modules follow the same templates in phases 3 to 7.

## 15.7 Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation | Owner role |
|---|---|---|---|---|---|
| B-01 | Scope: 123 modules and 745 flows swamp a small team | High | High | Build the spine first; value-ordered modules; P1/P2/P3 on every row; hold the line on phase exits | Product owner |
| B-02 | Prototype shortcuts leak into production (simulated data, in-memory registries, unclassified fields) | High | High | Registry seed gate: zero unclassified fields; remove simulated labels only when a real path exists; track in debt ledger | Tech lead |
| B-03 | Agents generate code that duplicates or bypasses platform services | Medium | High | Reuse-first check in CI; reviewer agent plus human code owner; scoped file access | Tech lead |
| B-04 | Authorization gaps: only 25 of 274 entities have an entity rule today | High | High | Default deny; port rules first; negative tests mandatory; policy simulation before enabling | Security lead |
| B-05 | Workflow engine in-house takes longer than expected | Medium | High | Port interface; review at end of phase 3; Temporal as the fallback executor | Tech lead |
| B-06 | Cross-tenant data leak | Low | Critical | Schema plus row-level security plus key per tenant; isolation tests gate every release | Security lead |
| B-07 | Test suite becomes slow or flaky and gates stall | Medium | Medium | Test pyramid; quarantine with expiry; parallel runs; targeted runs by changed package | Tester agent sponsor |
| B-08 | Tracker adds overhead and drifts from reality | Medium | Medium | Status from CI events, not manual edits; one manual transition (acceptance) | Product owner |
| B-09 | Naming rule breach reaches code, data or commits | Medium | High | Lint in CI and pre-commit; neutral commit author; scan of seed and fixtures | Product owner |
| B-10 | Cost of model usage by build agents overruns | Medium | Medium | Budgets per story and sprint; weekly review; smaller models for mechanical tasks | Product owner |
| B-11 | Key-person dependency | Medium | High | Named backup for every owner and agent sponsor; runbooks; pairing | Product owner |
| B-12 | Compliance expectations (SOC 2, privacy) land late | Medium | High | Control mapping from phase 1; evidence collected by the GRC module; early readiness assessment | Security lead |
| B-13 | Performance at scale: slow screens (itom_evt, ppm_proj, exe_mat, ppm_sow, svc_sla) | Medium | Medium | Replica routing, rollups, virtualized lists; load tests in CI from phase 3 | Tech lead |
| B-14 | Product name changes mid-build | High | Low | Name held in one configuration value; no name in identifiers; trademark search before launch | Product owner |

Register filter: layer = build; type in (PROC, OPS, SEC, AI); entities in (register_item, user_story, work_item, pull_request, commit, test_run, deployment, release).

Decisions needed: D-17 repository and language stack; D-18 build agent autonomy limits and human review rules; D-19 acceptance group membership per epic; D-20 sample tenant and test data policy; D-21 who is the product owner and tech lead of record (all detailed in section 16).
