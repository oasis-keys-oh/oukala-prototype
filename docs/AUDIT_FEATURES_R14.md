# Feature Set Audit, Round 14

Baseline: out_v13/full.html (8.7 MB, single file). Read-only audit. No source edited.
Method: loaded the build in Chromium and read the live registries (NAVX, MODMAP, PROCLIB, ATLAS, METRICS, SEARCHX, ASKX), rendered all 120 navigable screens, grepped the module sources (58 mod_*.js files, about 7.4 MB of JS), and compared against public capability lists for ServiceNow (AI Platform, AI Control Tower, Action Fabric, SPM), Atlassian (Jira, JSM, Confluence), Planview (including its 2026 "agent resource management" launch), Workday, Monday, Smartsheet, Moveworks, Microsoft Planner/Project and Coupa. Web results returned titles only this round, so the comparison leans on well-known capability sets and should be read as directional. Confidence in the inventory: 85%. Confidence in the maturity scores: 70% (they are my judgment, not measured).

## 1. Inventory in numbers

- 120 screens in 14 navigation groups, 76 mapped modules (MODMAP), 544 declared data flows, 129 process records (PROCLIB), 284 metrics with formulas, 151 entities and 1,442 fields in the atlas, 60 search providers, 46 chat intents, 6 agents.
- Atlas honesty line: of 76 modules only 27 are "live" and 49 "proposed"; of 151 entities 66 are proposed; 487 of 1,442 fields still carry default authority; only 66% of fields are classified; 29 screens have no registered record set (log, plat_map, plat_data, meet_*, nav_studio, plat_build, plat_contract, fin_* and others); 5 entities are known missing (GL account, stakeholder, document, subscription, tag).
- Zero network calls in the whole bundle (no fetch, XHR or WebSocket). Persistence is localStorage only (persona, preferences, product log). Everything else is in-memory seed data that resets on reload.
- Strongest code mass: people (485 KB), flow/workflow (399 KB), service catalog (345 KB), ITSM (311 KB), chat (290 KB), knowledge (280 KB), observability (270 KB), ITOM (264 KB).

## 2. Capability maturity heat map (depth 0 to 5)

Scale: 0 absent, 1 label or static mock, 2 seeded data with list and detail, 3 working forms, state changes, computed logic, 4 deep: calculation engines, policy, traceability, scale handling, 5 production grade (persistence, real integrations, multi-user, tested at volume). Nothing can score 5 today because there is no backend and no real integration. "Cap" is therefore 4.

| Domain | Depth | Evidence (screens, engines) | Main hole |
|---|---|---|---|
| PPM and portfolio | 4 | ppm_proj (8 tabs), ims master schedule, plan with earned value, WBS editor, RAID with heat map and 28 drag lists, agile boards and release trains, Monte Carlo date confidence (2,000 trials, seeded) and critical path, scenario compare, board pack | No employee timesheets, no program level, no baseline compare of scope, no external schedule import (MS Project, Jira) |
| Demand and funding | 4 | port (priorities, pipeline, capacity vs demand, intake), bud_req decision funnel with routing rules, fin_gates G1 to G3, benefits tracking | Scoring models fixed; no stage-gate templates per project type |
| Financials and budgeting | 4 | bud_over, fin_budget versions and variance, color of money (capex/opex funding colors), spend-order simulator, capitalization and depreciation, TBM cost model and showback, FinOps | No GL or ERP posting; no timesheet or actuals feed; money logic is rich but unreconciled to a real ledger |
| ITSM incident | 4 | priority matrix calculator, SLA timers with hold pause, major incident (war room, comms, status page, PIR), board, routing | Real clock is simulated against a fixed "today" (Oct 6 2026) |
| ITSM request and catalog | 4 | svc_cat (workflows, approval rules, pricing, requester view, trace), request queue, notifications matrix | No inbound email or chat-to-ticket channel; no virtual agent deflection metric |
| ITSM change and release | 4 | change calendar, CAB, approval policies, standard templates, risk and DORA, release readiness tree, go or no-go, clash register, freeze windows | Change risk is rule based, not learned from history |
| ITSM problem | 3 | fishbone RCA, known error DB, trends | No automatic problem proposal from incident clustering visible |
| Knowledge | 4 | KCS lifecycle, freshness, AI generate, ask-the-KB with cost lineage, knowledge graph, gap-to-article loop, prompt library, AI quality tests with second-model judge | No real retrieval or LLM; no translation or external publishing |
| Service catalog and portfolio | 4 | svc_cat, svc_360 (9 tabs from technical composition to financial), SLAs/OLAs/XLAs designer, breach credits | Customer-facing portal is the same app; no branded or external portal |
| CMDB and service mapping | 4 | class hierarchy, CSDM 5 domains, identification and reconciliation rules, health scoring, attestation campaigns, duplicates and merge, dependency graph with focus mode, 2,600-CI scale mode | Discovery is simulated import; no real agent or cloud scan |
| ITOM events and observability | 3.5 | NOC wall, correlation, noise reduction, false-positive loop, SLOs and error budgets, synthetic checks, metrics explorer, runbooks, automation rules with simulator | Metrics, logs and traces are synthetic; no ingest endpoint |
| DevOps and release | 3.5 | pipeline, runs, gate policy, "where is my change", environments, DORA, freezes | No real Git or CI connection; PR and story data seeded |
| Workflow, automation, decision rules | 4 | flw_design (33 forms; trigger, human, approval, assessment, agent, decision, wait, parallel, loop, subflow nodes), DMN-style decision tables with hit tracing and overlap/gap checks, assessments, simulator with run log | Workflows are simulated, not executed against live records (FLOWX.start only logs a run with the simulated outcome) |
| Process modeling | 4 | PROC strip on every screen, PROCLIB with steps, RACI, maturity, BPMN draw studio, process map and coverage | Three overlapping drawing/modeling surfaces (see section 4) |
| AI agents and governance | 3.5 | AI Control Tower, org chart with agent roster and autonomy levels, agent skills registry, AI gateway and tokenomics, guardrails, MCP page, accountable-human rule enforced by OWNX | No runtime: no model calls, tool execution is not real; token costs are formula |
| Identity and access, approvals | 3.5 | roles, policies and labels, "who can see this", break-glass, access reviews, delegation of authority, SoD tab, unified approvals inbox with delegation and auto-approval | No SSO/SCIM behavior, no enforcement (roles do not gate the UI), no joiner-mover-leaver automation |
| People and org | 4 | org chart (human and agent), workload heat map, resource planning grid, skills matrix, performance, training, journeys, rooms | No timesheet, no recruiting or HR case, no compensation (appropriate scope) |
| Vendor and contract management | 4 | vendors, contracts, renewals, SOW analyzer, clause library, negotiation, proposal vs contract, obligations calendar, POs tab, invoice approval | No supplier onboarding or risk scoring, no sourcing/RFP, no three-way match against receipts |
| Risk, compliance, audit | 2.5 | audit log with hash chain, controls tab, retention and holds, exe_risk (project risk and Monte Carlo), RAID, conformance gate, technical debt ledger | No enterprise risk register, no policy library with attestation, no control testing cycle, no issue management, no vendor risk, no privacy requests |
| Analytics and reporting | 3.5 | 284 metrics with formula and remediation, metric popovers, visualization builder (5 tabs), exec dashboard, board pack from live data, maturity engine | No scheduled or subscribed reports, no export formats beyond CSV copy, no governed semantic layer exposed to BI |
| Collaboration and meetings | 3.5 | meeting hub (agendas, minutes, actions, decisions, forums, series), room booking, decisions log | Meeting surface is split over six screens; no comments or @mentions on records, no shared documents |
| Notifications | 3 | pipeline, channel matrix, personas and quiet hours, templates, delivery log; inbox with queue and board | Delivery log is generated; no push or email send; subscription entity missing |
| Integration fabric and MCP | 3.5 | connectors, mappings, field authority, runs and quarantine, reconciliation, event bus, webhooks and keys, dead letters; MCP tools tab with request/response preview | All simulated; no connector actually connects; MCP is a contract preview, not a server |
| Platform admin and security | 3.5 | studio (fields, layouts, views, theme, localization), environments and promotion, feature flags, licensing and meters, citizen app gate with tiers, feature contract, ownership registry | Admin changes do not alter runtime behavior of other screens in most cases |
| Mobile | 1.5 | Phone-width layouts tested at 400 px with no horizontal scroll | No PWA manifest, no service worker, no offline, no push; approvals and on-call acknowledgement are not mobile-first |

Average across the 26 rows: about 3.5. Shape: broad and deep on process design and traceability, thin on risk and compliance, mobile and anything that needs a runtime.

## 3. Simulated versus real (honest)

Real, working in the browser:
- Monte Carlo schedule confidence, critical path, earned value arithmetic, scenario compare.
- Decision-table evaluation, overlap and gap checks, hit tracing.
- Priority matrix, SLA clock evaluation with hold, breach reasons and credits.
- CMDB health scoring, duplicate detection and merge, scale generators (2,600 CIs, 6,400 tickets, 330 people).
- Hash-chained audit view with a tamper demonstration.
- Registry logic: atlas coverage, duplicate checks, feature contract scoring, ownership resolution, conformance gate checks, maturity roll-ups.
- Forms, validation, drag and drop, search across 60 providers, chat intents over seeded data.

Simulated or presented as if live:
- Every integration (Entra ID, M365, Jira-style connectors, SolarWinds lab, ERP/lease subledger). No bytes leave the page.
- Every AI answer, generated article, agent action, token cost, quality score and model comparison. Lineage chips describe a pipeline that does not run.
- Workflow execution. `simulate()` walks the graph and writes a log; `FLOWX.start` records a run with that outcome. No timers, no waiting on a human task, no record mutation.
- Observability data (metrics, logs, traces, synthetic checks), discovery runs, delivery logs, DORA numbers.
- Role enforcement. Roles and policies are editable but do not restrict what a persona can see or do.
- Persistence. State resets on reload; only persona and the product log survive.
- MCP and the "contract file". The tool catalog and JSON-RPC preview are generated text, not a listening server.

Statuses worth a plain label in the UI: 49 modules and 66 entities marked "proposed" already have rich screens, so a user cannot tell a designed feature from a backed one.

## 4. Duplicated or overlapping features

1. Budgets: bud_over, bud_model, fin_budget, fin_model, bud_req, plus fin_p_* and fin.* process pairs. Six process records duplicate each other (fin_p_budget vs fin.budget_cycle, fin_p_reforecast vs fin.quarterly_reforecast, fin_p_color vs fin.color_assignment, fin_p_recon vs fin.gl_reconciliation, fin_p_release vs fin.release_event, fin_p_variance vs fin.variance_review). bud_req and bud_req_funnel are the same process twice.
2. Platform maps: plat_map, plat_pmap, plat_dmap, plat_data, plat_data_old (explicitly legacy but still routed), plus mm_v "Process areas (original)" inside the module map.
3. Meetings: meet_hub, ppl_meet, fo (calendar), meet_act, meet_dec, meet_series. Six entry points, two nav groups, three process records overlap.
4. Process drawing: flw_bpmn, draw_studio, flw_design, plat_proc. Two drawing tools and a designer for related graph models.
5. AI agent surfaces: tower, org_chart agent roster, flw_agent, kcs_skills, chat_home Tool registry, plat_mcp. Agents are described in four registries.
6. Integration: flw_hub (connectors, MCP servers, webhooks) vs plat_fab (connectors, mappings, event bus) vs plat_gate core services.
7. Approvals: inbox, flw_appr, svc_req approvals tab, bud_doa. One engine, four front doors.
8. Dashboards and metrics: metrics, obs_dash, kcs_viz, exe_dash.
9. Feature governance: decision_rules vs dec_cov, feature_contract vs plat_contract, own_gaps vs plat_cov (each pair also double registered in PROCLIB).
10. Risk: ppm_raid, exe_risk register, itom_health, plat_debt each keep a risk or issue register with different fields.
11. Notifications: svc_notify, inbox Notifications tab, flw notification nodes, notification_preference entity.

## 5. Gap list (against best-in-class and the product's own purposes)

Core services the contract promises but are not shared yet: document/attachments, tags, subscriptions, comments with @mentions, watchers, a common activity stream. Each module keeps its own notes array.

Missing capabilities, by domain:
- PPM: employee timesheets and actuals; program and dependency management across projects; MS Project / Jira import; resource leveling with what-if on skills; stakeholder entity and communications plan; lessons learned.
- Demand and funding: configurable scoring models per portfolio; stage-gate templates by project type.
- Finance: GL account entity (flagged missing), actuals reconciliation to ERP, accruals, requisition to PO to receipt to invoice three-way match, travel and expense (out of scope, but say so).
- ITSM: inbound email and chat channels, virtual agent deflection reporting, customer satisfaction survey closing the loop (XLA tab exists, survey capture does not), change risk learned from history, problem proposals from clusters, field service.
- ITOM: ingest endpoint for events and metrics, topology-based event correlation tied to service maps, auto-remediation approvals tied to DOA, patch and vulnerability management (no CVE or SBOM content).
- Workflow: durable execution, retries, SLA timers on human tasks, versioning with rollback, test cases for flows, subflow library with owners.
- AI: model adapter with a recorded trace, evaluation suites running against real answers, prompt-injection tests, human-in-the-loop review queue per agent, agent budget per accountable human, "Why am I seeing this" explanation as the only AI prose (owner rule).
- Identity: SCIM-style joiner, mover, leaver; access request catalog; certification campaigns that actually revoke; just-in-time elevation with expiry; SoD enforced at action time.
- Vendor: supplier onboarding, risk assessments, performance scorecards, sourcing events (RFP), contract renewal automation.
- Risk and compliance: enterprise risk register with appetite, KRIs and treatment plans; policy library with versioning and attestation; control library mapped to frameworks (SOC 2, ISO 27001, NIST CSF, HIPAA) with test schedules and evidence requests; issues and findings; privacy requests; audit engagement planning.
- Analytics: scheduled and subscribed reports, PDF and slide export, governed semantic layer served to Power BI, row-level security demonstration, data quality rules on metrics.
- Collaboration: record comments, shared notes, whiteboard, document co-authoring links (M365 assumed).
- Notifications: a real digest engine, delivery preferences honored by senders, push.
- Integration: at least one live connector pattern (file drop CSV/JSON import with real parsing), webhook receiver, OpenAPI export of entities.
- Platform: tenant/environment config export, backup and restore of state, import of a state snapshot, accessibility statement and automated checks, data residency stance.
- Mobile: installable PWA, push, offline queue for approvals and on-call acknowledgement.

## 6. Prioritized backlog

P0 (do first, unlock everything else)
1. Durable workflow runtime (executes designed flows on record events; real human tasks in inbox; timers).
2. Typed entity store with event log behind ATLAS (snapshot to IndexedDB, import/export, hash-chained change log).
3. Shared record shell: comments, @mentions, attachments, tags, subscriptions, watchers, activity stream.
4. Label every module and entity as live or designed in the UI (uses existing atlas status).

P1 (customer value)
5. Risk and compliance suite (risk register, policy attestation, control testing, findings).
6. Timesheets and actuals, plus requisition to PO to receipt to invoice match.
7. Consolidate duplicate screens and process records (section 4).
8. Agent runtime stub with model adapter, trace and human review queue.
9. Scheduled reports, subscriptions, exports, semantic-layer API.
10. Joiner, mover, leaver and access request automation, with enforced roles.

P2
11. Mobile approvals PWA with push and offline queue.
12. Inbound email and chat channels, CSAT survey capture.
13. One real connector pattern (CSV/JSON drop, webhook receiver).
14. Supplier onboarding and vendor risk scoring.
15. Change risk learned from history; problem proposals from incident clusters.
16. MS Project / Jira import; program management.
17. Vulnerability and patch content in ITOM.
18. Accessibility audit pass and statement.

## 7. TOP 10 RECOMMENDATIONS

Ranking weights: customer value 40%, differentiation (AI-native, traceability) 35%, effort inverse 25%. Effort in person-weeks for the prototype (S 1 to 2, M 3 to 5, L 6+).

1. **Durable workflow runtime.** Value 5, differentiation 5, effort L.
   Evidence: flw_design has 33 forms and every node type, but `simulate()` only logs and `FLOWX.start` writes a fake run; there is no run engine.
   Build: a small interpreter that fires on `record.changed` events, creates real inbox items for human and approval nodes, honors wait timers on a virtual clock, writes each step to audit, and mutates the target entity.

2. **Entity store and event log behind the atlas.** Value 5, differentiation 5, effort L.
   Evidence: 66 of 151 entities proposed, 487 default-authority fields, 29 screens with no record set, all module data in private arrays, state lost on reload.
   Build: one store keyed by atlas entity id with typed CRUD, an append-only hash-chained change log, IndexedDB snapshot, and import/export; migrate ITSM, PPM and finance first.

3. **Governance, risk and compliance suite.** Value 5, differentiation 4, effort M.
   Evidence: risk and compliance scores 2.5; adm_audit has three tabs; control testing appears once in source; exe_risk covers schedule risk only.
   Build: risk register with KRIs, policy library with attestation campaigns, control library mapped to SOC 2 / ISO 27001 / NIST, test cycles with evidence requests, findings flowing to the debt ledger, all owned through OWNX.

4. **Agent runtime with accountable-human controls.** Value 4, differentiation 5, effort M.
   Evidence: zero network calls; agent costs and quality scores are formulas; tower and org chart already hold autonomy levels and human sponsors.
   Build: a model adapter (stub plus bring-your-own key) that records prompt, tools, tokens and result in a trace, gates tool calls by autonomy level and DOA, queues proposals for the sponsor, and labels every AI-authored line per the owner's no-chatty-voice rule.

5. **Shared record shell (core services).** Value 4, differentiation 4, effort M.
   Evidence: document, tag, subscription entities listed as missing; comments and notes re-implemented per module; the contract demands consistent core services.
   Build: one drawer component and API (`SHELL.attach(entity,id)`) giving comments with @mentions, attachments, tags, watchers, and an activity stream, wired to notifications and search.

6. **Consolidate overlapping screens and processes.** Value 4, differentiation 2, effort S to M.
   Evidence: 11 overlap clusters in section 4, six duplicate finance process pairs, a legacy data model screen still routed, six meeting entry points.
   Build: merge into one budgets hub, one maps hub, one meetings hub, one agent registry; keep old ids as NAVX aliases; delete duplicate PROCLIB records and re-run the contract matrix.

7. **Time, actuals and procure-to-pay.** Value 5, differentiation 3, effort M.
   Evidence: no employee timesheet screen (only vendor time in budget and SOW code); purchase orders exist as a tab and proposed entity; GL account entity flagged missing.
   Build: timesheet grid tied to WBS tasks and resource plan, requisition to PO to receipt to invoice with three-way match in `inv`, GL account entity and color-of-money posting.

8. **Scheduled reports and a governed semantic layer.** Value 4, differentiation 4, effort S to M.
   Evidence: 284 metrics with formula, owner, target and remediation already exist; board pack draws live data; no scheduling, subscriptions or export.
   Build: report definitions that bind metric ids, a subscription entity with schedule and recipients, PDF/PPT/CSV export, and a metrics JSON endpoint contract for Power BI.

9. **Identity lifecycle with enforced roles.** Value 4, differentiation 3, effort M.
   Evidence: roles, access reviews and DOA screens exist but roles do not gate any screen; no joiner-mover-leaver flow.
   Build: JML workflow template on the runtime (item 1) that provisions role bundles, an access request catalog, campaign results that revoke, and a role check wrapper in `go()` and form submit.

10. **Mobile approvals and on-call PWA.** Value 3, differentiation 3, effort S.
    Evidence: mobile depth 1.5; no manifest or service worker; approvals inbox and on-call already have the data model.
    Build: manifest and service worker, a phone-first approvals and acknowledgement view, offline queue replayed to the inbox, and web push for P1 pages.

## 8. Notes for the next round

- The product's differentiator is traceability (goal to money to work to service, with owner and backup on everything). The weakest link is that the trace runs over seed data. Items 1 and 2 turn it into a working system of record.
- Do not add more screens before item 4 of the backlog (live vs designed labels); the heat map risks overselling.
- Sources (directional): servicenow.com AI Platform pages, Cloud Wars and Businesswire coverage of ServiceNow AI Platform and Action Fabric, Planview newsroom (agent resource management, mid 2026), Avasant on Knowledge 2026.
