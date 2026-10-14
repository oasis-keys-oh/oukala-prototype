# Oukala Go-to-Market and Demo Playbook

As of 2026-10-14. Plain-markdown export of the living doc: https://claude.ai/code/artifact/104ad37f-11a4-4c80-ae98-4c5188cbecbf

## 1. The pitch and three audience versions

Lead with one claim: the product runs enterprise work and proves its own value from the same data. Everything below supports that claim. Names in this playbook are working names; the product name is undecided.

**Master pitch (draft, about 90 words).** Oukala (working name) is an AI-native work platform for enterprise IT and operations leaders. Projects, services, change, risk and resilience run on one data model. Approvals route to groups, access is denied unless a rule allows it, and every AI agent works inside a box: a tier, a budget, a confidence floor and a kill switch. Every number on screen is a defined metric with an owner, a formula and a baseline. The platform measures its own value and shows its working.

**Honesty line to say early.** The prototype at https://oukala-prototype.netlify.app has 169 screens. In the requirements register of 15,104 rows, 64.3 percent are Built in the prototype, 21.3 percent Partial, 7.4 percent Simulated and 7.0 percent Gap (register_summary, build v16). Connectors, AI runs and sync are simulated and labeled so.

| Audience | One-line hook | Three points to land | First screen to open |
| --- | --- | --- | --- |
| CIO and IT operations | One platform for the work, the services and the AI agents, with the controls built in. | 1. One data model joins strategy, projects, services and change. 2. Every CI has an owner, a support group and an approver group. 3. Agents are governed from day one. | Strategy to execution |
| CFO and finance | Every dollar of IT work traces from a goal to a project to a ticket, and the benefit is measured against a baseline. | 1. Budgets drill to purchase orders, invoices and vendors. 2. Benefits track against plan. 3. Value is modeled from your own inputs, with formulas shown. | Value screen (#value, being added this round) |
| Risk, audit and security | Prove who could do what, who approved it, and what the AI did, without assembling evidence by hand. | 1. Deny-by-default permissions at table, row and attribute level. 2. Approvals name groups, with separation of duties checked. 3. Tamper-evident audit chain and agent run records. | Permissions |

Sources for the numbers above: build v16 specification sections 7, 9, 11 and the register summary. Treat counts as prototype facts, not production results.

## 2. What it is and is not

The product is a governed system of work for IT and operations, not a point tool. It sits beside identity, HR and finance systems and replaces the stitched-together layer of spreadsheets, ticket tools and portfolio tools between them. This positioning is a hypothesis to test with design partners.

**Category framing.** No single analyst category covers the whole combination (assumption, unverified). Buyers will map it to three existing ones:

1. Strategic portfolio management. Gartner publishes a Magic Quadrant for it ([Gartner abstract, 2024](https://www.gartner.com/en/documents/5468395)).
2. IT and enterprise service management, where ServiceNow and Atlassian are the reference points.
3. AI agent governance. Gartner published its first Market Guide for guardian agents on 25 February 2026, as summarized in a vendor-contributed article ([The Hacker News](https://thehackernews.com/2026/03/5-learnings-from-first-ever-gartner.html?hl=en_US)). Treat that summary as secondary.

Suggested phrase to test: "an AI-native work platform with governance built in". Avoid claiming a category leader position.

| The product is | The product is not |
| --- | --- |
| One data model and one permission model across projects, services, change, risk and resilience | A replacement for ERP, the general ledger or the HR system of record (HR data stays referenced, masked) |
| A place where AI agents run inside tier, budget, confidence floor and kill switch | A model-risk platform for data science teams (those tools govern models, not daily work) |
| A tool that reports its own metrics with owner, formula and baseline | Proven at production scale today (the prototype is a single page; connectors and AI runs are simulated) |
| Configurable per tenant through overlays, not forks | A finished product: 84 of 123 modules are proposed, 39 live in the prototype (spec 14.1) |

### Honest comparison

Rows cite pages opened on 14 October 2026. Vendor statements are the vendor's own claims. The last column is what we can say, not what we have proven in production.

| Competitor | What the source says | Where they are strong (assumption unless cited) | Where the product differs today |
| --- | --- | --- | --- |
| [ServiceNow AI Control Tower](https://www.securityinfowatch.com/ai/press-release/55289138/servicenow-launches-ai-control-tower) | "Centralized command center" to govern, manage, secure and realize value from native and third-party agents; announced May 2025 | Installed base, depth in service and risk workflows, ecosystem | Agent controls ship inside the same data and permission model as the work. We lack their scale, certifications and partner network. |
| [Atlassian Rovo, Jira Service Management, Compass](https://sdtimes.com/ai/atlassian-shares-major-updates-to-its-genai-assistant-rovo-at-team-25-europe/) | Rovo Studio builds agents with fine-grained agent permissions; JSM sits in a Service Collection with Assets; Compass sits in a Software Collection | Developer adoption, price point, marketplace | Our wedge is the executive and risk view across portfolio, service and resilience, not developer workflow. |
| [monday.com for PMO](https://monday.com/departments/pmo) | Portfolio rollup, named agents for intake, planning and portfolio health, audit logs and controls over agent actions; lists SOC 2 Type II and ISO 27001 | Ease of use, speed to start, large user base | We add ITSM, CI ownership, resilience and BETH3D. They are ahead on certifications and polish. |
| [Asana AI Studio](https://investors.asana.com/news-releases/news-release-details/asana-announces-ai-studio-no-code-builder-designing-and) | No-code agent builder announced 22 October 2024; the release does not describe governance controls | Team adoption, no-code agent building | Governance is our point of difference only if we show it live. |
| [Planview](https://www.businesswire.com/news/home/20250807268238/en/Planview-Again-Named-by-Gartner-as-a-Leader-in-Strategic-Portfolio-Management) | Says it was named a Leader in Gartner SPM for the fourth consecutive year (August 2025, vendor claim) | Depth in portfolio, capacity and strategy planning | We cover the full path to operations, but their portfolio depth is greater. |
| [Workday Agent System of Record](https://www.workday.com/en-us/ai-platform/agent-system-of-record.html) | Directory of agents, lifecycle, inherited permissions, action logs, Agent Gateway for third-party agents | HR and finance data, existing executive relationships | Closest in idea to our agent registry. Theirs is anchored in HR and finance data; ours in IT and operations work. |
| [IBM watsonx.governance](https://www.ibm.com/forms/mkt-53939) | Named a Leader in the Forrester Wave for AI Governance Solutions, Q3 2025 (per IBM; report not opened) | Model risk, regulatory mapping | They govern models. We govern agents doing daily work. We could sit beside them, not replace them. |

**Where we lose today.** Certifications, references, scale evidence, integrations and brand. Say this before the buyer does. Pricing of ServiceNow and Atlassian packages was not verified; do not quote competitor prices.

## 3. Key features to show

Ten features carry the story. Open each by route, cite the proof number from the screen, then say the talk track. Routes are screen ids appended to the site address, for example `#r16g_perm`. Where a friendlier route exists it is shown. Confirm each route in the address bar before a live demo.

Proof numbers come from the seeded Meridian Standards Foundation sample tenant in build v16 (spec sections 7 to 12). They show the prototype's data, not a customer result. Read the number off the screen before you quote it.

| Feature | Problem it removes | Route | Live proof number | 30-second talk track |
| --- | --- | --- | --- | --- |
| Permissions | Access rules scattered across tools; nobody can say who sees what | `#r16g_perm` (Permissions, under Admin) | 222 object rules, 43 field rules, 17 roles; 13 personas tested on 149 screens with 0 violations. Coverage about 44 percent, about 264 seed rules unreviewed (status v16) | "Access is denied unless a rule allows it, at table, row and attribute level. Switch persona to Service desk and watch performance data disappear. Rules are data, so you can simulate and explain any decision." |
| Change status workflows | Joiner, mover and leaver steps handled by email and memory | `#r16h_status` (Change status) | 14 configurable statuses, such as PTO, leave, sabbatical, retire, resign, terminate | "One status change launches the right process, workflow, catalog item or order guide through the event bus. Nothing depends on someone remembering the checklist." |
| Approvals to groups | Approvals tied to named people break when people move | `#r16h_groups` (Approval groups) and `#r16h_rules` | 21 approval groups; 889 steps migrated to group routing | "Every approval names a group, never a person. The designer blocks an empty gate and checks separation of duties before it saves." |
| CI ownership | Infrastructure nobody owns; changes with no approver | `#r16h_ci` (CI ownership) | 302 CIs; 52 percent have owner, support group and approver group | "Every configuration item has an owner, a support group and an approver group with decision criteria. The coverage gap is shown, not hidden." |
| Strategy to execution | Goals, projects, money and tickets live in separate tools | `#strat_exec` (alias `#trace`) | Untraced metrics reduced from 63 to 2 in Round 16 | "Start at a goal, follow it to capabilities, roadmap items, projects, money and work. Gaps view shows what is not connected to any goal." |
| Resilience on BETH3D | Continuity plans in documents, not tied to applications or exercised | `#bc_home`, then `#bc_trace` and `#bc_tiers` | 6 dimensions (BETH3D), 4 tiers, 15 plans, 244 trace nodes, 8 screens | "BETH3D scores continuity across buildings, equipment, technology, human resources, third parties and data. Pick an application and trace it to its people, sites and vendors." |
| Agent governance and kill switch | AI agents running with no owner, budget or off switch | `#tower` (AI agents) | 15 agents in registry; 3 tiers; daily caps $10, $15, $20; confidence floors 0, 75, 80 percent; 33 runs recorded | "Each agent has a human sponsor, a tier, a budget, a confidence floor and a kill switch. Pause one agent, one tier or all of them, and the run record shows who decided." |
| Order guides and portal | Employees file separate requests for one life event | `#portal`, admin at `#svc_guides` | 5 order guides in the sample; guides include onboarding, project and move | "One portal for catalog items and order guides. Order the onboarding guide and see the critical path and fulfiller queues." |
| Metrics baseline and dashboards | Dashboards no one trusts; no baseline to prove improvement | `#metrics` (Measures and targets), `#exe_dash` | 381 metrics, all with owner and formula; 208 better than baseline, 128 worse, 45 flat; 115 (30 percent) at target | "Click any metric chip to see Baseline, Now, Change and Gap, with the formula and owner. Personal dashboard layouts, saved charts and a permissioned shared default." |
| Setup and import path | Every new customer is a custom project | `#r16m_setup`, `#r16m_deploy`, `#r16m_import` | 11-sheet foundation workbook; 10-step provisioning runbook; 4 deployment paths | "No database cloning. Provision a tenant, seed the base configuration, import the customer's own data from the workbook with a dry run and an error report." |

**Limits to state when asked.** Connectors, sync, agent execution and provisioning are simulated in the prototype and labeled so. Catalog, budget and change approvals show group bindings but do not enforce them yet (status v16).

## 4. Demo scripts

Three scripts share one rule: show the work, then show the number, then show the formula. The Demo Tour at `#tour` or `#demo` (stories, presenter bar, moments) is being added this round. Use it for the 5-minute story once it ships; the manual stop lists below are the fallback and the rehearsal source.

Click paths are as designed in build v16. Rehearse each one, because a screen may change before you present.

### Pre-demo checklist

1. Reset data. Edits persist in the browser store (IndexedDB), so clear site data for the prototype address, or use a reset control if the tour adds one (unverified).
2. Set the persona to Casey Rowan, CIO, through View as in the top bar. Keep one second persona ready for the permissions stop.
3. Set screen size to 1440 by 900 and the theme your room needs. The owner reviews in dark; use light for bright rooms or projectors.
4. Do not demo on a phone. Mobile is a known weak point; show `#m` mobile approvals only if asked.
5. Prepare the offline fallback. The prototype is one static page, so keep a local copy of `full.html` from the build and a 5-minute screen recording.
6. Open the site in a tab 10 minutes ahead. Load takes about 7 to 9 seconds on a cold start.
7. Rehearsal check: walk every route in the script, note any console error, time the run, and write down the numbers you will quote.

### Script A: 5-minute executive story

Audience: CIO or business sponsor. Goal: agree to a second meeting.

| Stop | Route | Click path | What to say | What to prove | If asked |
| --- | --- | --- | --- | --- | --- |
| 1 (0:00) | `#home` | Open site as Casey Rowan | "One place for the work, the services and the AI agents, with the controls built in." | Home shows live facts and deltas, not chatty text | "Is this real?" Say prototype, 169 screens, simulated connectors. |
| 2 (0:45) | `#strat_exec` | Tree view, then Gaps | "Every goal traces to projects, money and work. Gaps show what has no goal." | Untraced metrics 63 down to 2 | "Where does data come from?" Imports and connectors; today seeded. |
| 3 (1:45) | `#tower` | Open an agent, show tier, budget, floor; pause it | "Agents work inside a box. One switch stops one agent, a tier, or all." | Kill switch, run record, human sponsor | "Which models?" Gateway with adapters; frontier models first (decision D-06). |
| 4 (3:00) | `#r16g_perm` | View as Service desk, then Permissions Simulate | "Deny by default. Same data, different persona, different view." | 13 personas, 0 violations on 149 screens | "SSO and SCIM?" Specified, simulated in prototype. |
| 5 (3:45) | `#value` | Change two assumptions | "Layer A is this tenant's data. Layer B is your assumptions, with formulas." | Every figure labeled measured or modeled | "Is the ROI real?" It is a model until baselined in a pilot. |
| 6 (4:30) | `#thinking` | Open decisions view | "These are the principles and what we refused to build." | Rule list, decision log | "Name?" Undecided; trademark work pending. |

### Script B: 15-minute CIO deep dive

Audience: CIO plus one architect or operations lead. Goal: agree a discovery session and a pilot scope.

| Stop | Route | Click path | What to say | What to prove | If asked |
| --- | --- | --- | --- | --- | --- |
| 1 (0:00) | `#home` | Persona banner, search with `/` | "Search finds records, people and what they own." | Ownership search ("budget") | "Who owns the owner list?" Gap screen shows missing owners. |
| 2 (1:30) | `#strat_exec` | Tree, Trace graph, Gaps | "Strategy to execution in one view." | Untraced metrics 2 | "Can we import our goals?" Goals are not in the 11-sheet workbook today; the sheet set is open (D-14). |
| 3 (3:00) | `#portal` | Order guide: onboarding | "One request for a life event. Critical path and fulfillers show." | 5 sample guides | "Can we use our catalog?" Import path, section 6 of the playbook. |
| 4 (4:30) | `#r16h_groups` | Approval designer, add a level | "Approvals go to groups. The gate checks separation of duties." | 21 groups, 889 steps | "Is it enforced?" Group bindings shown; enforcement on catalog, budget, change is open (status v16). |
| 5 (6:00) | `#r16h_ci` | Filter to no owner | "Every CI gets owner, support group and approver group." | 302 CIs, 52 percent covered | "CMDB discovery?" Connector, simulated today. |
| 6 (7:30) | `#tower` | Agent, pause, run record | "Guardrails in a box." | 15 agents, caps, floors, 33 runs | "Prompt injection?" Output treated as untrusted; risk R-06 in spec 16. |
| 7 (9:30) | `#bc_home`, `#bc_trace` | Pick an application | "Resilience on BETH3D." | 244 trace nodes, 15 plans | "Why BETH3D?" Working name, spelling not final (D-11). |
| 8 (11:00) | `#metrics` | Click a chip: Baseline, Now, Change, Gap | "Every number has owner, formula and baseline." | 381 metrics, 115 at target | "Who audits the formula?" Owner and backup, lineage view. |
| 9 (12:30) | `#value` | Edit assumptions, view one-page case | "Your inputs, our formulas." | Measured versus modeled labels | "Can we trust it?" Only after a pilot baseline. |
| 10 (14:00) | `#thinking` | Principles, refusals | "How we decide." | Decision log | "Next step?" Discovery worksheet, then pilot charter. |

### Script C: 45-minute working session

Audience: IT operations, architecture, security, finance partner. Goal: shortlist two processes for a pilot and collect value inputs.

| Block | Route | Click path | What to say | What to prove | If asked |
| --- | --- | --- | --- | --- | --- |
| 1. Frame (0:00 to 5:00) | `#home`, `#thinking` | Principles view | "Here is what we built and what we refused to build." | Rule set, honest status split (64.3 percent built) | "What is missing?" 84 of 123 modules proposed. |
| 2. Service (5:00 to 15:00) | `#portal`, `#itsm_chg`, `#r16h_status` | Order guide, raise a change, trigger a status change | "Request, change and people events share one workflow runtime." | Status launches a process | "Our ServiceNow stays?" Coexistence is a pilot choice. |
| 3. Approvals and CI (15:00 to 22:00) | `#r16h_groups`, `#r16h_rules`, `#r16h_ci` | Edit an approval level; assign a CI | "Groups, criteria, ownership." | Guardrail blocks an empty gate | "Delegation?" A delegation dialog exists (route unverified). |
| 4. Setup (22:00 to 29:00) | `#r16m_setup`, `#r16m_import`, `#r16m_deploy` | Dry run an import; open deployment paths | "No cloning. Provision, seed, import." | Error report, 11 sheets | "Data residency?" US first; EU on demand (decision D-22, hypothesis). |
| 5. Governance (29:00 to 36:00) | `#r16g_perm`, `#adm_audit`, `#tower` | Simulate a rule; open audit; pause an agent | "Evidence without assembling it." | Audit chain, agent run record | "SOC 2?" Target Type I about 6 months after first tenant (decision D-23, hypothesis). |
| 6. Resilience and metrics (36:00 to 41:00) | `#bc_home`, `#metrics` | Tier policy; metric chip | "RTO and RPO by tier, exercised in change windows." | 4 tiers, 15 plans | "Our DR tool?" Reference plans, not replace tooling. |
| 7. Value and close (41:00 to 45:00) | `#value` | Fill worksheet live | "We leave with your numbers." | Formula shown | "Cost?" Pricing is a hypothesis; section 7. |

### Recovery moves

| What breaks | Move |
| --- | --- |
| Slow first load | Narrate the pitch while it loads; keep the tab pre-opened. |
| Blank or wrong screen | Reload, then press `/` and search for the screen name. |
| Wrong persona | Use View as in the top bar and return to Casey Rowan. |
| Number differs from script | Say the data is seeded; quote the number on screen. |
| A control does nothing | Move to the alternate stop in the same script; note it for the fix list. |
| Network or hosting down | Open the local `full.html` copy; else play the recording. |
| An edit persists unexpectedly | Clear site data and reload after the session. |
| Question on a simulated feature | State that it is simulated and show the specification section. |

## 5. How to show the thought process

Buyers trust a platform when they can see why it is shaped this way. Use a five-beat arc and open the How it was built screen (`#thinking`, being added this round) at each beat. If the screen is not ready, use the same evidence from the specification and the decisions log.

| Beat | What to say | Evidence to open | Maps to `#thinking` |
| --- | --- | --- | --- |
| 1. Problem | "Enterprise work runs across tools that disagree. Nobody can trace a goal to a ticket, and AI agents add risk with no owner." | `#strat_exec` Gaps view; `#tower` | Problem view (assumed name; confirm with agent Q) |
| 2. Principles | "Seven standing rules apply to every screen, with an automatic check, a named owner and a register filter." | Spec section 2: no chatty AI voice, guardrails in a box, owner and backup on everything, reuse first, naming bans, one name per screen, Feature Contract | Principles view |
| 3. Decisions | "Each choice has a recommendation, an owner and a date. Several are still open, and we say so." | Decisions log; spec section 16 (24 decisions, 14 risks) | Decisions view |
| 4. What we refused to build | "The refusals define the product as much as the features." | List below | Refusals view |
| 5. Evidence | "Every claim ties to a screen, a registry count or a test." | Requirements register (15,104 rows, 64.3 percent built); scans with 0 permission violations on 13 personas | Evidence view |

### What we refused to build

Each refusal is recorded in the decisions log or the specification. Use three, not all, in a given meeting.

1. Chatty AI. The product shows data, deltas and labeled chips. AI prose appears only on request and carries a label.
2. Headcount-reduction framing. Agent value is framed as capacity returned (Round 12 decision).
3. AI as an owner. An agent always has a human sponsor and a different backup.
4. Approvals by named person. Approvals route to groups, with separation of duties checked.
5. Cloned customer databases. Each tenant is provisioned from code and the same migration set (D-R16-01).
6. Forks per customer. Tenants use overlays inside eight guardrails, so library updates still flow through.
7. Storing health-like HR data in the first release (D-10 recommendation, a hypothesis until approved).
8. Quoting prices before a priced bill of materials exists (D-07 recommendation).

### Time-boxed versions

| Time | Beats | Note |
| --- | --- | --- |
| 3 minutes | 2 and 4 | Two principles, three refusals. Use in the 5-minute story. |
| 8 minutes | 1 to 4 | Add one decision with its open status. |
| 15 minutes | 1 to 5 | Walk one decision from log entry to the screen that implements it. |

**Rule for evidence.** If a claim has no screen, count or test behind it, drop it from the talk track.

## 6. How to quantify value with the site

The Value screen (`#value`, being added this round) separates two kinds of number. Never let them blend on a slide.

| Layer | Source | Label on screen | What it proves | What it cannot prove |
| --- | --- | --- | --- | --- |
| A: live from this tenant | Registries and metrics in the sample tenant, read at load | "From this tenant's data" | The platform measures itself: baseline, now, change, gap | Anything about the prospect's results |
| B: modeled business case | Assumptions the viewer edits, with a source or "illustrative" | "Modeled" | A defensible range for the prospect, with formulas shown | A measured result, until a pilot baseline exists |

### Layer A: what the tenant already measures

These are Meridian sample figures from build v16. They show the product tracking itself.

| Measure | Value | Screen |
| --- | --- | --- |
| Metrics with a trend | 381; 208 better than baseline, 128 worse, 45 flat | `#metrics` |
| Metrics meeting target | 115 (30 percent) | `#metrics` |
| Untraced metrics after strategy mapping | 63 down to 2 | `#strat_exec` |
| CIs with owner, support group and approver group | 52 percent of 302 | `#r16h_ci` |
| Approval steps routed to groups | 889 across 21 groups | `#r16h_groups` |
| Agent runs recorded | 33 | `#tower` |

Say: "These numbers are seeded sample data. They show the method, not your result."

### Layer B: formulas

Each line is a hypothesis until the prospect supplies inputs. Show the formula on screen next to every result.

```latex
H_{req} = N_{req} \times (t_{before} - t_{after}) / 60 \times a
```

```latex
V_{labor} = (H_{req} + H_{appr} + H_{audit} + H_{agent}) \times C_{hour}
```

```latex
V_{tools} = \sum_i L_i - L_{platform}
```

```latex
V_{change} = N_{chg} \times (f_{before} - f_{after}) \times C_{fail}
```

```latex
V_{net} = (V_{labor} + V_{tools} + V_{change}) \times k - C_{total}
```

```latex
Payback_{months} = C_{upfront} / ((V_{labor} + V_{tools} + V_{change}) \times k / 12)
```

Symbols: N is a yearly count, t is minutes per item, a is adoption share, f is the failed-change rate, C is a cost, L is a license, and k is a confidence factor the prospect sets. Agent hours are capacity returned, not headcount removed.

### Discovery worksheet

Collect these in the first working session. Leave a cell blank rather than guess. No default values are supplied here.

| # | Input | Symbol | Ask | Likely owner at prospect |
| --- | --- | --- | --- | --- |
| 1 | Requests handled per year | N_req | Tickets and requests last 12 months | Service desk lead |
| 2 | Minutes per request, now and target | t_before, t_after | Sampled handle time | Service desk lead |
| 3 | Share of work moving to the platform | a | Pilot scope, in percent | Sponsor |
| 4 | Approvals per year and waiting time | N_appr, d_before | Export from current approval tool | Process owner |
| 5 | Audit evidence hours per cycle | H_audit | Last audit prep effort | Risk and audit lead |
| 6 | Blended hourly cost | C_hour | Finance rate card | Finance partner |
| 7 | Tools that could be retired, with licenses | L_i | Contract list and renewal dates | Procurement |
| 8 | Changes per year, failure rate, cost per failure | N_chg, f_before, C_fail | Change records, incident cost | Change manager |
| 9 | Agent use cases, minutes saved per run, runs per year | agent inputs | Shortlist from agent studio | Automation lead |
| 10 | Platform cost, one-time and yearly | C_upfront, C_total | Pricing proposal (hypothesis) | Seller |
| 11 | Confidence factor | k | Prospect's own judgment, 0 to 1 | CFO partner |

### How to avoid overclaiming

1. Label every figure measured, modeled or illustrative. No unlabeled numbers.
2. Show the formula and the input source beside each result.
3. Present a range from low and high inputs, not one point.
4. Count only benefits the prospect's finance partner accepts. Drop the rest.
5. Treat soft benefits (risk reduction, speed) as a separate list, not a dollar total.
6. State the baseline date. Without a baseline, say "modeled".
7. Never present a sample tenant figure as a customer outcome. Do not name customers other than Meridian Standards Foundation (sample).

### One-page business case

Export the Value screen to one page with these blocks:

1. Situation in three lines, from the discovery worksheet.
2. Scope: processes and users in the pilot.
3. Costs: one-time and yearly, labeled hypothesis until a proposal exists.
4. Benefits: table of formulas, inputs and results, each tagged modeled.
5. Range: low, base, high, with payback in months.
6. Risks and assumptions, including what a pilot will measure.
7. Decision requested and date.

## 7. Go-to-market motion

Everything in this section is a hypothesis to test, except facts quoted from the deployment paths and editions work. The first goal is one design partner, not a market launch.

### Ideal customer profile (hypothesis)

1. Enterprise or large midsize organization with thousands of users and millions of records, matching the scale target in the decisions log (2026-10-08).
2. IT and operations organization running several tools for projects, services and approvals, with an audit or regulatory duty.
3. Already piloting AI agents and asking who owns them, what they cost and how to stop them.
4. A named sponsor at CIO, CFO-partner or risk level, and a service or PMO lead who can run a pilot.
5. Willing to coexist with its current service and portfolio tools for the first phase.

### Buyer personas and their questions

| Persona | What they ask | Proof to show |
| --- | --- | --- |
| CIO | Does this reduce tools and risk? Can it run next to what we have? | `#strat_exec`, `#tower`, `#r16m_deploy` |
| CFO or finance partner | Can I trust the value case? What does it cost? | `#value`, `#metrics`, section 6 worksheet |
| CISO and risk lead | Who can see what? What can the agents do? How do you prove it? | `#r16g_perm`, `#adm_audit`, `#tower` |
| Head of service and operations | Will my team's work get easier? What about our change process? | `#portal`, `#r16h_groups`, `#r16h_ci` |
| PMO leader | Can I see goals to delivery without spreadsheets? | `#strat_exec`, portfolio screens |
| Internal audit | Can I get evidence without a scramble? | Audit trail, access reviews |

### Land-and-expand wedge options (hypothesis)

| Wedge | Land with | Why it might work | Why it might not | Expand to |
| --- | --- | --- | --- | --- |
| A. Governed AI agents | Agent registry, tiers, budgets, kill switch | Urgent topic; analysts name the category | Crowded; ServiceNow, Workday, IBM already present | Approvals, then service |
| B. Approvals and CI ownership | Approval groups, CI owner and approver groups, change status | Fixes a daily pain; can sit beside existing ITSM | Needs integration with the incumbent tool | Agents, resilience |
| C. Strategy to execution | Goals to projects to money to work | Executive visibility; clear value story | Needs data from several tools; PPM incumbents | Budgets, metrics |
| D. Resilience on BETH3D | Tiers, plans, trace, exercise calendar | Distinct framework; audit pull | Name not final; narrow buyer | Risk, CI ownership |
| E. Nest inside Autom8Ops | Shared login and ecosystem | Faster access to a sibling's audience | Relationship undecided | Open question |

**Recommendation (hypothesis, confidence about 50 percent, judgment not data).** Land with B plus the agent controls from A as one "governed work" offer for IT change and service. It solves a daily pain, coexists with the incumbent, and carries the differentiator. Expand to C within the first year, then D. Test it against two design-partner conversations before committing.

### Pilot design: 30, 60 and 90 days

Success criteria use metrics the product already tracks. Targets are set in the pilot charter with the sponsor; none are assumed here.

| Window | Scope | Activities | Success criteria (metric in product) | Exit gate |
| --- | --- | --- | --- | --- |
| Days 0 to 30 | Pooled sandbox, 1 to 2 processes, 25 to 100 users | Charter, provision tenant, identity connection, foundation import with dry run, baseline capture | Import errors cleared; baseline recorded for the chosen metrics; owner and backup on all pilot records | Signed charter with sponsor, owner, backup |
| Days 31 to 60 | Add approval groups and CI ownership for pilot scope; 1 to 2 agents at Tier 1 | Run live work; weekly metric review; guardrail and permission checks | CI ownership coverage against charter target; approvals routed to groups; agent runs within caps and floors | Midpoint review with finance partner |
| Days 61 to 90 | Production-like tenant, 3 to 5 processes if criteria met | Measure against baseline; fill the Value screen with real inputs; security review | Agreed metrics met; readiness at 80 percent or more (deployment paths); value case accepted | Go or no-go for rollout |

### Proof-of-value structure

1. Charter: scope, users, sponsor, owner and backup, metrics, exit criteria.
2. Baseline: capture start values in the product on a dated day.
3. Run: use the product for real work, with weekly reviews.
4. Measure: Baseline, Now, Change and Gap for each agreed metric.
5. Decide: finance partner signs the value case; risk lead signs the security review.

### Editions and pricing hypotheses

Edition names Core, Fabric and Fabric Enterprise are working names. The decisions log says not to use them externally until naming is settled. No price points exist; set them only after a priced bill of materials (D-07).

| Item | Hypothesis | Source |
| --- | --- | --- |
| Packaging | Core, Fabric, Fabric Enterprise differ by connectors (3, 15, 60), environments (1, 2, 5) and freshness options | Deployment paths, editions work |
| Pricing shape to test | Per-connector tier plus run volume plus an enterprise platform fee; user tiers (full, light, requester-only) | Fabric evaluation, D-07 |
| Levers | Edition, users, deployment model, connectors and run volume, environments, AI usage, support and services | Deployment paths |
| Default deployment | Pooled SaaS, per-tenant schema and key | D-R16-01 |
| Upgrades | Dedicated stack in vendor cloud account; dedicated stack in customer account (add-on); private install (exception) | D-R16-01 |
| Commercial path | Paid pilot credited to year one (4 to 6 weeks), proof of value (8 to 12 weeks), annual subscription, add-ons | Deployment paths, D-16 |

### Channels and assets: first 90 days

Owners are suggestions by role. The owner decides who fills each role.

| Order | Asset or channel | Purpose | Suggested owner | Weeks |
| --- | --- | --- | --- | --- |
| 1 | Name clearance and decision | Unblock every public asset | Product owner with counsel | 1 to 6 |
| 2 | One-pager (three audience versions) | Leave-behind; section 1 text | Product owner | 1 to 2 |
| 3 | Interactive demo link and Demo Tour | Self-serve proof; prospects explore | Product owner with build agents | 2 to 4 |
| 4 | Deck, 10 slides | Executive meetings | Product owner | 3 to 4 |
| 5 | Security brief (tenancy, keys, permissions, audit, AI controls) | Answer risk questions early | Security lead | 4 to 6 |
| 6 | Trust page (status of certifications and roadmap, stated honestly) | Reduce diligence friction | Security lead | 5 to 7 |
| 7 | Short video, 3 minutes, from the 5-minute story | Share and scale | Designer or producer | 6 to 8 |
| 8 | Design-partner outreach, 10 to 15 conversations | Find one partner | Product owner | 4 to 12 |
| 9 | Analyst and peer briefings | Credibility | Product owner | 8 to 12 |

Channel note: any use of an employer's client network needs a check of employment, conflict and IP policies first. That is the owner's call and is not verified here.

## 8. Positioning risks and objections

Answer the objection, then point to a screen or a document. Where the honest answer is "not yet", say so and name the plan.

| Objection | Why it is fair | Answer | Proof or plan |
| --- | --- | --- | --- |
| AI hype fatigue | Every vendor now says agents | "We lead with controls, not AI. The product shows data and deltas, and AI text appears only on request, labeled." | `#tower`; rule 1 and 2 in spec section 2 |
| Another platform | Platform sprawl is a real cost | "Start with one governed offer next to your current tools. Retire a tool only when the value case says so." | Section 7 wedge B; deployment paths coexistence |
| Security | A new vendor with no track record | "Tenant schema, row-level security and key per tenant; deny-by-default permissions; tamper-evident audit; agents sandboxed with allow lists." Certifications are planned, not held. | Spec 9 and 14.21; SOC 2 Type I target about 6 months after first production tenant (D-23, hypothesis) |
| Data residency | Regulated buyers need regional control | "US region first. An EU region comes at the top edition or on demand. Customer-account deployment is a priced add-on." | D-22 and D-R16-01 (recommendations, not commitments) |
| Switching cost | Migration is where projects fail | "Import your own foundation data from an 11-sheet workbook with a dry run. Overlays keep your process changes separate from the library." Migration quality remains a risk. | `#r16m_import`; risk R-11 |
| Trademark and name | The working name may change | "The name is a single configuration value. Clearance is under way before any public launch." Do not print the name on external assets until cleared. | D-08, D-09; Trellis already rejected |
| Relationship with Autom8Ops | Buyers will ask if this overlaps a sibling product | "Complementary, with shared login as the likely link. The exact nesting is under discussion." Do not describe Autom8Ops features. | Open decision, section 9 |
| Prototype versus production | The demo is broad; production is deep | "169 screens exist; 64.3 percent of register rows are built in the prototype, and connectors and AI runs are simulated. Sell the spine plus two or three modules." | Register summary; risk R-09 |
| No references | No customers yet | "We are looking for one design partner and will agree reference terms in the pilot charter." Never name a customer. | D-16 |
| AI cost and vendor lock | Model prices and policies change | "A gateway with adapters for at least two providers, budgets per agent, and agents can be paused without stopping work." | Spec D-06; risk R-05 |

## 9. Open decisions and next steps

Six decisions block external use. Each recommendation is a hypothesis for the owner to accept, change or reject.

| Decision | Options | Recommendation (hypothesis) | Needed before |
| --- | --- | --- | --- |
| Product name | Keep Oukala (working); shortlist of three; new name after clearance | Shortlist three, run professional clearance on each, keep the name as one configuration value (D-08, D-09) | Any public asset or first external demo |
| Nesting with Autom8Ops | Separate product with shared login; module inside Autom8Ops; Autom8Ops module inside this platform; partnership only | Separate product with shared login, decided in a conversation with its owner, Katelyn. Confidence about 40 percent: too little known. | Design-partner outreach |
| First design-partner profile | Large enterprise IT; midsize regulated firm; public-sector IT | Midsize to large regulated enterprise with an audit duty and AI agent pilots; sponsor at CIO level; a second partner in a different sector later (R-10) | Week 4 of the 90-day plan |
| Pricing | Per user; per connector plus run volume plus platform fee; flat platform fee | Test the per-connector plus volume plus platform fee shape; set price points only after a priced bill of materials (D-07) | First pilot proposal |
| Hero demo: three screens | See below | `#strat_exec`, `#tower` (agent kill switch), `#value` | Demo Tour finalized |
| Residency and compliance claims | US only; US and EU; SOC 2 first | US first, SOC 2 Type I target, state both as plans (D-22, D-23) | Trust page |

**Hero three screens (hypothesis, confidence about 65 percent).** Strategy to execution shows breadth in one view. AI agents shows the differentiator and the kill switch live. Value shows the self-quantifying claim. Permissions is the first backup, because risk leaders ask for it.

### What to build next for the demo

1. Demo Tour (`#tour`, `#demo`) with presenter bar and moments: in progress, agent P.
2. Value screen (`#value`) and How it was built (`#thinking`): in progress, agent Q.
3. A one-click data reset and a persona preset, so every demo starts the same.
4. A one-page business case export from the Value screen.
5. Stable, friendly routes for the ten features in section 3 (today several use internal ids).
6. A mobile pass on the screens used in the tour. The owner has flagged mobile as weak.
7. Enforce approval group bindings on catalog, budget and change, so the "is it enforced" answer improves (status v16 open item).
8. An offline demo bundle: a local copy and a recording.

### Next steps

1. Owner decides the six items above; record each in the decisions log.
2. Rehearse Script A twice, then record it for the video asset.
3. Start name clearance and hold all external assets until the name is chosen.
4. Draft the one-pager from section 1 and the security brief from spec sections 9 and 14.
5. Book a conversation with Katelyn on nesting and shared login.
6. List 15 candidate design partners by the ICP, then hold two discovery sessions using the section 6 worksheet.
7. Re-run this playbook against the live site after the Tour, Value and How it was built screens land, and fix routes and numbers.

### Sources

Pages opened on 14 October 2026: [ServiceNow AI Control Tower launch](https://www.securityinfowatch.com/ai/press-release/55289138/servicenow-launches-ai-control-tower), [Planview and Gartner SPM](https://www.businesswire.com/news/home/20250807268238/en/Planview-Again-Named-by-Gartner-as-a-Leader-in-Strategic-Portfolio-Management), [Gartner SPM Magic Quadrant abstract](https://www.gartner.com/en/documents/5468395), [Atlassian Team 25 Europe via SD Times](https://sdtimes.com/ai/atlassian-shares-major-updates-to-its-genai-assistant-rovo-at-team-25-europe/), [Gartner guardian agents summary](https://thehackernews.com/2026/03/5-learnings-from-first-ever-gartner.html?hl=en_US), [Workday Agent System of Record](https://www.workday.com/en-us/ai-platform/agent-system-of-record.html), [monday.com PMO](https://monday.com/departments/pmo), [Asana AI Studio release](https://investors.asana.com/news-releases/news-release-details/asana-announces-ai-studio-no-code-builder-designing-and), [IBM and Forrester AI governance](https://www.ibm.com/forms/mkt-53939).

Internal: platform specification sections 2 to 16, requirements register summary, deployment paths (Round 16), names (Round 15), prototype status v16, decisions log, and the project's fabric editions evaluation. Not verified: ServiceNow and Atlassian pricing, analyst category names for the combined product, route names for screens being added this round.

