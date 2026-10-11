# Round 14 Multi-Perspective Evaluation of Oukala (baseline out_v13/full.html)

Method. Copied the baseline, drove it with Playwright (chromium), switched the four available personas (Executive, Finance approver, Project manager, Service desk lead), captured about 95 screens in dark mode and a smaller set in light mode and at 400 px phone width, and viewed roughly 20 of the screenshots. I also measured accessibility basics and scale behavior in the page, and tried the Ask assistant with four ordinary questions. Everything below is from what I saw or measured. Where a rating rests on reading screen text and not on a screenshot, it says "text only".

Caveat on speed numbers: the machine was busy (load average 25 to 40 from other agents), so absolute times are inflated. The ratios between demo and enterprise data are the signal.

Honest gaps: I did not complete full transactions (for example submit a request and watch it fulfill), did not test drag and drop, and did not open every tab of the 121 screens.

## 1. What I found first (applies to every perspective)

- Only four personas exist (`PERSONAS` has exec, fin, pm, ops). The persona changes the Home page, the favorites and the Ask permissions. The sidebar is the same for all four: nine groups, counts up to 22. The admin screen already defines 11 roles, so the data for more personas exists.
- The teal focus border around the main content (#view) is still there on every screen in light and dark. Computed outline is 2 px rgb(110,190,205). The owner reported it in R14 and it is unchanged in the baseline.
- Three stacked notification cards (each with Approve, Review, Open buttons) slide in over the top right of the screen and cover the KPI row. I saw them on Invoice approval, Incidents, Major incident and Changes. On the war room screen they hide the review and blameless metrics.
- The Self-service portal says "Hi Priya" while the signed-in user is Casey Rowan.
- Numbers disagree across screens (details in recommendation 2).
- `<html>` has no `lang` attribute and there is no skip link.

## 2. Perspective matrix

Rating is fit for that role today, 1 (poor) to 5 (strong). "First 5 minutes" is what the product gave me when I played that role.

| # | Perspective | Top 3 jobs to be done | First 5 minutes | Missing or confusing | Delights | Fit |
|---|---|---|---|---|---|---|
| 1 | Board audit chair | See if controls and numbers are trustworthy; read the quarterly pack; see AI oversight | Board pack screen: 9 sections, 49 cited sources, "edited by a person: 0", drag to reorder, toggle sections | No read-only board role or portal; Home is the CIO view; pack is Draft and tied to the CIO's session | Every claim links to a record; formula and source lineage | 4 |
| 2 | CEO | Know if strategy is on track; see money vs outcomes; approve big items | Executive persona Home: three health rings with formulas, "Needs you" ranked by money and time | Rings are 71, 62, 82 with no strategic framing beyond one story line; heavy sidebar | Plain headline "Delivery is amber and finance is red for one reason"; Executive dashboard offers five views from one set of numbers | 4 |
| 3 | CFO | Pay only what was earned; forecast and reforecast; control funding colors | Finance persona opens on "Pay what was earned": hold, approve, reject with reason, accepted work vs paid | Toasts cover the KPI tiles on that screen; a CFO would want one close-calendar view; units off on some chips | Invoice screen with three-way logic, Color of money, spend-order simulator, TBM, funding gates, delegation of authority | 4.5 |
| 4 | CIO | Portfolio health, risk, AI spend and governance, vendor performance | Home plus Needs you; Control Tower; Master data atlas | Too many places to look (121 screens); the "why is it amber" path is good but the rest relies on search | Formula on every score; Why am I seeing this; Clarity lens | 4 |
| 5 | COO | Operational health, capacity, service levels, cost to serve | Ops persona shows availability, knowledge freshness, incidents; People screens show load | No cross-functional operating review screen; "Operational health" is IT only; capacity numbers contradict (19 of 22 over capacity on Projects, 18 on People, headcount 22 vs 45 vs 89) | Resource planning and Org chart with human vs agent visual language | 3 |
| 6 | CISO | Who can access what; evidence for controls; AI risk | Security and access: 11 roles, 6 policies, 1 break-glass, access review only 13% done, capability matrix with risky-pair flags | No threat, vulnerability or identity-provider feed; "Policy engine: draft" chip on its own screen; no exposure view tied to CMDB | Access exceptions list (non-compliant device, unmanaged guest); capability matrix simulator; AI gateway with guardrail pass rate | 3 |
| 7 | VP or department head | Team load, budget status, approvals, hiring | No persona for this role; closest is PM or Executive | No department-scoped Home; cannot see "my budget, my people, my projects" in one place; Inbox shows 75 items for the CIO | Org chart and workload; Inbox with kinds and wait times | 3 |
| 8 | Program or project manager | Schedule vs baseline; RAID; vendor impact | PM persona Home: milestone 3 needs acceptance criteria; portfolio schedule; Projects and teams | SPI shown as "0.96%" (it is a ratio); "19 of 22 over capacity" reads as a data error and is noise | Master schedule, RAID log, WBS, trace from goal to money to work; flags like contract ends before work | 4 |
| 9 | Product owner | Backlog and priorities; releases; outcomes vs benefits | Sprints and backlogs, Release trains, Demand and priorities (text only for last two) | No product-level view joining backlog, usage and benefits; Product log exists but is hidden under "undefined" group in data | Benefits realization linked to budget | 3 |
| 10 | Scrum master | Sprint health, impediments, ceremonies | Sprints and backlogs board; Meetings and Meeting actions | No persona; no impediment or team-health view that I could find; velocity and flow metrics not seen on first screen | Meeting actions and decisions captured and traceable | 3 |
| 11 | IT service desk agent | Work the queue; resolve first time; find the right article | Ops persona is a lead, not an agent. Incidents: board, priority calculator, SLA timers, team-first assignment | No agent workspace (single-ticket view with customer context, suggested article, macros, phone or chat intake); first row of tiles dominated by toasts | Priority calculator with formula; backlog and SLA chips on the list | 3.5 |
| 12 | Resolver engineer or on-call SRE | Triage alerts, know who is on call, run the runbook | Event management "7,999 signals, 5 worth a person's time"; On-call and escalation; Runbooks and automation; SLOs with error budget | No real alert source shown; paging and acknowledgment not demonstrated; major-incident screen toasts hide metrics | Noise reduction story with a number; runbook to alert linkage; war room with blast radius (services, users, cost at risk) | 3.5 |
| 13 | Change manager | Avoid collisions; run CAB; keep failure rate down | Changes: calendar, collision (CHG0314 vs CHG0315), freeze exception, CAB and approvals, standard templates | Change failure rate appears three times on one screen; risk and rollback detail not seen on first view | Collision and freeze detection with named changes; DORA metric tie-in | 4 |
| 14 | Finance analyst | Build the model, allocate, explain variances | Five-versions-of-every-line budget, TBM cost transparency, allocation and showback, cloud FinOps | Little export or "bring your own spreadsheet" path; numbers and units need one catalog | Color of money and spend-order simulator is rare; formula chips everywhere | 4 |
| 15 | Procurement or vendor manager | Renewals, scorecards, three-way match, contracts | Vendors and contracts: scorecard with worked example (Lumen 0.74), renewals in 90 days, SOW analyzer | Renewal chip reads "5 days target <= 2 days" (a count shown as days); match rate 82% vs 95% with no drill path seen | Worked-example formula with real numbers; PO, contract, SOW and rate card in one place; rates redacted without finance or HR permission | 4 |
| 16 | HR business partner | Review cycle, training compliance, org design, case handling | Performance and growth (61% reviews in), Training (91% mandatory), Org chart, Skills | "Calibration spread 0.74%" (should be points); no onboarding or employee-case workflow; no HR persona; HR data gated only by two caps | "AI never rates anyone" stated and enforced; 9-box, OKR, 360 in tabs; SCORM or xAPI import | 3.5 |
| 17 | Ordinary employee requesting services | Ask for laptop or access; check status; find an answer | Self-service portal: search box with "I need a new laptop", category tiles, "Customer view" toggle | Greets "Priya" while signed in as Casey; only 15 items, 39 services with nothing to order; no employee persona; Ask got the amount wrong in one test | Natural-language request with form fill; plain categories | 3 |
| 18 | New hire | Know what to do on day one; get accounts; learn the tools | Same Executive Home as everyone; sidebar of nine groups with a "How to read this menu" link | No onboarding persona or checklist; Ask for "what should I do on my first day" returned four Contract data-model records | Task-named menu ("Fix what is broken") instead of module names | 2.5 |
| 19 | External auditor | Sample evidence; trace who did what; see control status | Audit and compliance: 107 log entries (10 by agents), 15 controls across SOC 2, ISO 27001, NIST AI RMF, 73% with current evidence, legal hold | No read-only auditor role; log claims "chained and tamper evident" but also says "78 from this session", so what backs it is unclear; no evidence package export seen | Actor-type split (human vs agent); stale controls list by framework | 3 |
| 20 | Citizen developer | Build a small app; reuse registry entities; get certified | Citizen apps: tiers, conformance gate, reuse 84%, duplicate rate 40%, New citizen app; Build a module | Duplicate rate 40% is red with no guidance; table headers clipped at the right edge with no scroll cue; no live builder preview verified | Reuse and conformance gate is a real differentiator | 3.5 |
| 21 | Platform administrator or data steward | Shape fields and forms; manage data model; approve entities | Admin studio (fields, layout, theme, localization), Data atlas (151 tables, 1,442 fields, metric lineage), Registry, Feature contract | 39% of metrics traced to fields; 66 proposed entities waiting; promotion path Dev to Prod is described but not shown running | Atlas with color by authority or classification; every field has authority and classification | 4 |
| 22 | AI governance lead | See every agent, spend, guardrails, test results, kill switch | AI Control Tower: governance posture 87, spend $22, guardrail pass 99.2%, override rate 22%, fleet, lineage, kill switch; test management with a regression gate | Spend cap disagrees ($75 daily cap in tiles, $12 in chart); "draft" chips on gateway and policy; judge disagreement 10% vs 16.7% on two screens | Second-model judge, golden sets, gate closed at 58.3% vs 91.7% baseline; prompt library with owner, version and test | 4.5 |
| 23 | Skeptical buyer (CIO at a midsize company vs ServiceNow) | Judge breadth vs depth, integration reality, time to value, cost | Breadth is impressive (ITSM, ITOM, PPM, finance, knowledge, AI governance in one shell); formulas everywhere | Single HTML file with simulated data; no proof of real connectors, scale, or admin at tenant level; Enterprise toggle takes about 29 s here; no implementation plan or TCO view; four personas only | Formula and lineage on every number; feature contract and gate; AI governance depth is ahead of most platforms | 3 |

Average fit across the 23 rows (platform administrator and data steward share one row): 3.5.

## 3. Cross-cutting lenses

| Lens | Rating | Evidence | Gap |
|---|---|---|---|
| Trust and explainability | 4 | Formula on every metric; worked example on vendor score; board pack cites 49 sources; Ask shows "How I got there, 3 steps" and sources; "Ask before acting" mode | Same confidence number on many chips ("Claude 90%" on all three Needs-you items, "Claude Sonnet 86%" on all insights); unit mistakes (0.96%, 0.74%); contradictory figures across screens |
| Accessibility | 3.5 | 0 unnamed controls out of the visible ones I scanned; 1 h1, 1 main, 2 nav; profile popover offers text size, density, motion, contrast "High", guidance level; phone layout works with bottom nav | No `lang`; no skip link; teal ring on #view after every navigation; 6 targets under 24 px; 22 text nodes at 11 px; tab order starts inside the page content; toasts with action buttons are time-limited; phone KPI row is cut off with no cue beyond the edge |
| Security and privacy posture | 3 | Role caps drive Ask; rates redacted without permission; guest and unmanaged-device exceptions; break-glass; AI gateway redaction count | All client side, so nothing is enforced; "tamper evident" is a claim; no data residency, key, tenant isolation or retention evidence beyond text |
| Performance and scale (midsize) | 2 | Cold load of an 8.7 MB single file; Home 4 to 8 s under load; Projects screen 3.7 s demo and 14.7 s enterprise; switching to Enterprise took 29 s; heap about 660 MB; DOM 4.9k to 7.4k nodes | Needs lazy loading, list virtualization, precomputed data. At 554 open incidents the Incidents screen still ran (1.2 s) so some screens are fine |
| AI usefulness vs noise | 3 | Useful: invoice advisor, board pack, test gate, Why am I seeing this. Noise: identical confidence chips, "5 agents working" always on, 73 to 99+ notification badge, AI sentences like "The advisor may be too strict on Lumen" | Ask missed "$120,000" (said 0 fields filled) and gave irrelevant records for "first day"; that honesty ("I do not have a tool for that") is good but not helpful |
| Change management and adoption | 2.5 | Task-named menu, "How to read this menu", Clarity lens, favorites | No role onboarding, no guided first run, no training path for admins, no adoption metrics view; 121 screens with equal weight |
| Total cost to implement | 2.5 | Licensing and billing screen, integration fabric, feature contract reduce custom work | No implementation estimate, data migration plan, or integration effort per connector; buyer cannot size a project from the product |

## 4. TOP 10 RECOMMENDATIONS (ranked by perspectives helped, then impact)

Perspectives helped are counted from the matrix above (23 rows).

### 1. Build personas from the existing roles, not four hand-written ones
Helps about 16 perspectives (1, 5 to 7, 9 to 13, 16 to 19, 21, 22, 23). Impact: high.
Evidence: `PERSONAS` has four keys; the admin screen already lists 11 roles; the sidebar is identical for all personas; there is no employee, new hire, auditor, CISO, COO, change manager, SRE or procurement view.
Fix: generate a persona per role from the Security and access role list, each with a Home template per job family (decide, operate, build, assure, request), a trimmed sidebar (hide groups with no capability), and 3 starter Ask prompts. Add a read-only Auditor persona.
Effort: M for the template engine, L to polish each home.

### 2. One source of truth and correct units for every number
Helps about 13 (1 to 5, 8, 14, 15, 16, 19, 22, 23 and trust lens). Impact: high.
Evidence: SPI shown as "0.96%"; calibration "0.74%"; "Renewals in 90 days: 5 days target <= 2 days"; over capacity 19 of 22 (Projects) vs 18 (People); headcount 22 vs 45 vs 89; AI daily cap $75 vs $12; SLA compliance 96% beside 143 breached of 554; judge disagreement 10% vs 16.7%; fulfillment time "0.8" with no unit.
Fix: add `u` kinds (ratio, points, count, days) in METRICS and format from it; add a gate check that metrics sharing a name or entity must agree; make headcount and capacity selectors shared. 
Effort: M.

### 3. Stop notification cards from covering content
Helps about 13 (3, 5, 11 to 13, 8, 2, 4, 1, 14, 15, a11y). Impact: high, cheap.
Evidence: three stacked cards with Approve buttons sit over the KPI row on Invoice approval, Incidents, Major incident and Changes within 1 to 2 seconds of load. During a major incident they hide the review and blameless metrics.
Fix: one card at most, auto-collapse into the bell, never overlay the hero or KPI region (dock under the bell), no Approve button inside a transient toast, off during war room. Make dismissal persistent.
Effort: S.

### 4. Fix the focus ring and basic accessibility
Helps all 23 in some way (keyboard and low-vision users most). Impact: medium to high, cheap.
Evidence: `#view` shows a 2 px teal outline after every navigation (owner flagged this); `<html lang>` is empty; no skip link; 6 interactive targets under 24 px; 22 text nodes at 11 px.
Fix: send programmatic focus to the page h1 with `outline:none` and show rings only for `:focus-visible` on controls; set `lang="en"`; add "Skip to content"; raise minimum target to 24 px and text to 12 px.
Effort: S.

### 5. De-duplicate metrics on a screen and trim the sidebar by role
Helps about 12 (2, 4, 5, 7, 8, 11, 13, 17, 18, 21, 23, 16). Impact: medium.
Evidence: Change failure rate three times on Changes; Backlog age twice on Incidents; Vendor performance index twice on Vendors; sidebar shows nine groups and counts up to 22 to every user.
Fix: render each metric chip once per screen (hero chip or tile or card, not all three); collapse sidebar groups the persona cannot use behind "More".
Effort: S for dedupe, M for sidebar rules (depends on rec 1).

### 6. Make AI confidence and voice honest
Helps about 10 (1 to 4, 19, 22, 23, 3, 6, 21). Impact: high for trust.
Evidence: the same "Claude 90%" on every Needs-you item and "Claude Sonnet 86%" on every insight; sentences like "The advisor may be too strict on Lumen"; "draft" chips on the gateway and policy engine on their own screens.
Fix: show confidence only when computed (and from what: eval set, N cases); otherwise show evidence count and data freshness. Replace advice sentences with chips (4 of 6 holds overridden, override rate 22%) per the no-chatty-AI rule. Label AI text only when requested.
Effort: S to M.

### 7. Performance at midsize scale
Helps about 9 (23, 5, 11, 12, 8, 4, 21, 14, 13). Impact: high for the buyer.
Evidence: switching to Enterprise data took about 29 s; Projects screen 14.7 s vs 3.7 s demo; 8.7 MB single file; JS heap about 660 MB; DOM up to 7.4k nodes (machine was loaded, so treat as relative).
Fix: split modules and load on first visit; generate scale data in a worker or precompute; virtualize long lists; render hidden tabs lazily (the Projects screen renders all tabs on entry).
Effort: L.

### 8. Make Ask good at ordinary questions
Helps about 9 (17, 18, 11, 3, 14, 15, 20, 16, 7). Impact: medium to high.
Evidence: "Who can approve a $120,000 invoice?" replied "I filled 0 fields... still need Amount" (the amount was in the question); "I am new, what should I do on my first day?" returned four Contract data-model records.
Fix: parse currency, dates and names into form fields; route how-to and onboarding questions to the knowledge base before record search; when no tool fits, offer three screens by persona.
Effort: M.

### 9. Fix the employee and new-hire front door
Helps about 7 (17, 18, 16, 7, 20, 23, 11). Impact: high for adoption.
Evidence: portal greets "Priya" for signed-in Casey; no onboarding checklist; "Onboarding: 2 items" and "39 service offerings still have nothing to order".
Fix: portal reads the current user; add a New hire home (accounts, equipment, training due, who to ask, buddy) driven by the Training and Catalog data; hide unorderable services.
Effort: M.

### 10. Auditor and board evidence room
Helps about 6 (1, 19, 6, 3, 22, 23). Impact: medium to high.
Evidence: audit log says "chained and tamper evident" but also "78 from this session and 29 earlier"; 4 controls stale; no read-only role; board pack tied to the CIO's session.
Fix: read-only Auditor and Board personas; "Verify chain" button that recomputes hashes and shows the result; one-click evidence pack per control (log extract, policy version, owner, date); state plainly what stores the log.
Effort: M.

## 5. Notes for the product owner

- Strongest areas to lead demos with: Pay what was earned (finance), Board pack with citations, AI Control Tower with test gate, Vendors scorecard worked example, Changes collision detection.
- Weakest first impression: new hire and employee, because the product assumes you are the CIO.
- Items already known to the owner (org chart connectors, card sizes, metric popover wrapping, stepper, workflow designer overlap) were not re-audited here, except the focus ring which I confirmed is still present. The org chart still showed a long horizontal line crossing the canvas in dark mode.
