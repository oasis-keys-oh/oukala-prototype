# Oukala: IA reorganization plan (Round 18 design)

Status: design agreed in conversation 2026-10-14, not yet built. Restore point: git tag `r17-restore-point` (commit 9dbc2bf) plus archive `oukala-prototype/_backups/oukala_r17_restore_point.tgz`. Live site at that point: https://oukala-prototype.netlify.app

## 1. The story (one paragraph)
Oukala is guardrails in a box for AI-built work. Anyone can vibe code a solution for their own role in the frontier model they already use. Oukala supplies the skills and workflow designer that make every build arrive with its process map, metrics, maturity roadmap, tech debt register, data lineage, security review, controls and kill switches. If the build proves valuable, the enterprise can scale it. Sits on top of existing systems for now; may replace them later.

Three beats: build anything; guardrails come with it; the enterprise gets smarter as people build.

## 2. Structure: one spine, three surfaces, a lens layer
Spine: the process map. Every step has an owner (role, person or AI), data, a metric and a control.

| Surface | Who | Question | Built from |
|---|---|---|---|
| Make | Anyone who builds for their own role | What did I build, and is it safe and ready to scale? | App record with eight guardrail facets |
| Work | Everyone, by role | What is waiting on me across the processes I take part in? | The process steps assigned to my role |
| Oversee | Owners and executives | Is it creating value within acceptable cost and risk? | The same processes, cut by value, cost, risk, scale |

Eight guardrail facets on every App record: Process, Data, Metrics, Maturity, Risk and debt, Security and access, Controls (kill switch, approvals, SLAs), Operations (notifications, integrations, reporting).

Sidebar is built from role. Everyone gets Work. Makers add Make. Owners and executives add Oversee. IT-specific modules sit behind an Enterprise IT lens and search.

## 3. Executive value lens
Every executive balances value against cost and risk. One structure for all: Value, Cost, Risk. A lens picks which two to weight and renames them.

| Lens | Balance they run | Value side | Cost or risk side | Headline question |
|---|---|---|---|---|
| COO (lead) | Throughput vs cost to serve | Cycle time, capacity freed, scale-ready processes | Rework, handoffs, change load | Where does work stall and what scales? |
| CFO (lead) | Spend vs profitability | Cost and tool sprawl avoided, benefits realized | Spend outside control, unfunded builds | Where is money going and is it controlled? |
| CAIO (lead) | AI value vs AI risk | Value from AI steps, reuse of AI builds | Ungoverned agents, data exposure, AI cost | What would a CAIO make us do, done for us? |
| CEO | Strategic progress vs investment | Strategy pillars enabled | Investment, stalled pillars | How does every function enable our strategy? |
| CISO | Security vs cost | Controls coverage, access reviewed | Over-privileged apps, open findings | Can I prove control without blocking people? |
| CIO | Productivity vs cost | Productivity gain, integration reuse | Sprawl, tech debt, run cost | How do I stop sprawl without blocking builders? |
| CHRO | Capacity freed vs workforce impact | Hours freed, skills built | Role disruption, trust | How does work shift between people and AI? |

Positioning for the lead pitch: "If you had a CAIO, this is what they would want you to do. For this class of work you no longer need one." The CAIO playbook the platform runs automatically: inventory all AI use, risk-tier each use, route data access to the data owner, enforce kill switches, measure value, prevent duplicate builds, report to the board.

Strategy enablement map (COO and CEO): function x strategy pillar matrix. Every App record must name the objective it advances (a required field in the Process facet). The map shows contribution per cell, pillars with no enabling work, functions not tied to any pillar, and value realized. Reuse existing: strat_exec, trace, exe_strat.

## 4. New Make feature: data access and approval (security review as a standard guardrail)
Scenario: I build a view of sales and pipeline. It needs the authoritative strategy, the budget and more. I submit the app for approval to receive those data elements.

Feature Contract
- Process: Declare data needs (attributes from the entity catalog) -> system resolves the authoritative source and owner group per attribute -> one request splits into per-source approvals routed to the owning GROUP -> automated security review (classification, purpose, minimum necessary, retention, AI exposure) -> decision: approve, approve with masking, limited scope, deny -> time-boxed grant with recertification -> monitoring, revoke, kill switch. States: Draft, Submitted, In review, Partially approved, Approved, Expired, Revoked.
- Data model (reuse first): AccessRequest, AccessGrant, ReviewFinding; reference existing ATLAS/DATAMODEL attributes, the ownership registry, the approvals engine and the single global nested permission model. No parallel permission store.
- Metrics (with maturity): time to access decision, percent decided by policy without a human, grants expiring unrecertified, over-privileged apps, denial rate by source, requests per app.
- Interconnectivity: MODMAP edges app -> attribute -> source; NAVX entry under Make; search and chat keywords; shows on the App record Security and access facet and in the Work inbox of each approver group.
- Owner and backup: data governance steward group as owner; named human owner and backup required before release (to be assigned).

## 5. Screen map (all 167 screens)
Counts: Work 54, Oversee 52, Make 40, Depth (admin) 11, Enterprise IT lens 8, Demo 2. Full row-level map: `screens_mapped.json` (scratchpad) and appendix of this doc once built.

- Make (40) by facet: Operations 10, Data 8, Process 6, Controls 6, Security and access 5, Metrics 4, Risk and debt 1, Maturity 0.
- Work (54): My tasks 10, Get help 5, and installed apps: Service and support 10, Projects and delivery 10, Money and contracts 11, People 4, Knowledge 4.
- Oversee (52): Strategy and value 11, Risk and control 10, Value and cost 9, Registry and truth 8, Resilience 8, AI oversight 4, Workforce 2.

Key reframing: the ITSM, PPM, finance, GRC and resilience modules are reference apps built on the platform. They become proof that the platform can host enterprise-grade work, not the product's front door.

### Gaps found
1. No Make screen for access and data approval (section 4).
2. No Make screen for Maturity; only an Oversee view exists.
3. Risk and debt facet has one screen.
4. No App record page, no My builds list, no role-based Work home, no lens switch.
5. No required strategic-link field on processes.

### Duplicate clusters to resolve in the screen-simplification pass
- Dashboards: exe_dash, obs_dash, r17u_dash, r16j_dash, kcs_viz
- Metrics: metrics, bc_metrics, itom_slo, svc_sla
- Approvals: flw_appr, r16h_groups, r16h_rules, plat_gate, inv
- Risk: exe_risk, grc_risk, ppm_raid
- Permissions: r16g_perm, adm_sec
- Process: plat_proc, plat_pmap, draw_studio, flw_bpmn, flw_design, r16m_guides
- AI governance: tower, r15d_agents, ai_runtime, flw_agent, adm_gate
- Registries: plat_reg, svc_360, exe_apps, itom_cmdb, own_gaps
- Rules: flw_dmn, r17s_rules, r16h_rules, zevt, fin_rules, svc_notify

## 6. Build sequence (each phase reversible to the restore tag)
1. IA shell: Make / Work / Oversee navigation, role-built sidebar, lens switch, vocabulary layer. Reuses existing screens; deletes nothing.
2. App record page with eight facets, My builds list, strategic-link field.
3. Data access and approval flow plus security review facet; feeds approver group inboxes.
4. Lens homes for COO, CFO, CAIO; strategy enablement map.
5. Demo rework around one cross-functional example (vendor invoice exceptions) ending in the value screen.
6. Screen-level simplification and consistency audit (including metrics modals that use all caps).

## 7. Open decisions
- Names for the three surfaces (leave product naming alone for now).
- Which first design-partner function (COO and CFO suggested).
- Whether Work aggregates tasks from external systems (connector scope).
- Whether the eight facets are the right eight.
