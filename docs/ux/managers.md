# Manager and specialist experience evaluation (PR-31)

Evaluation only: no product code was changed. Stream ux-mgr, 2026-10-21. It describes; status and priority live in the Product Backlog. Work that follows becomes backlog rows that cite the finding ids below (UX-M-01 and on).

**Labels.** Counts of clicks, screens, buttons, words, contrast ratios and rows are **prototype facts**, measured on 2026-10-21 by driving a local build (`python3 src/build.py --full`, `full.html`) with Playwright. Severity and fixes are **proposals**. All people, companies and records named are the fictional sample data of the prototype.

## Method

- **Who**: the eleven manager and specialist personas, each in its default menu (purview): Portfolio lead (`portfolio`), Project manager (`pm`), Service desk lead (`ops`), Change manager (`change`), Finance approver (`fin`), Auditor read only (`audit`), Distribution manager (`dist`), Facilities lead (`fac`), Procurement lead (`scm`), Plant manager (`plant`), Process control lead (`proc`).
- **Where**: Atlantic Logistics for everyone, then the industry company where the role fits: Corvane Data Protection for Service desk, Change and Portfolio; Larkspur Health for Distribution, Facilities, Project manager and Finance; Redstone Resources for Plant manager, Process control, Procurement and Auditor. Tenant switched through the same path the tenant badge uses (`TENANT.switch`).
- **Tasks per persona**: open Home; open each role pin; approve, assign or update the persona's most common item; find a record through search (Ctrl K) with a word from the role's own vocabulary; follow the contribution thread from the first pin to the objective it serves.
- **Captures**: light at 1440 px, dark, and 400 px phone width, plus full-page shots of Home and each pin on Atlantic Logistics. 475 screenshots, 253 MB, so they are **not committed** (over the 5 MB limit). They are in `tools/scratch/ux/shots/<persona>/` and are regenerated with `tools/scratch/ux/walk.js` (see "Reproduce" at the end). Screenshot names are `<tenant>_<screen>[_dark|_phone|_full].png`.
- **Skills and heuristics applied**: impeccable (critique mode and its anti-pattern list), critique (Nielsen's ten heuristics, cognitive load, persona red flags), audit (accessibility, theming, responsive, anti-patterns), clarify (copy), layout (hierarchy, rhythm, density), typeset (hierarchy, numerals, readability), distill (remove what does not serve the task), and design:accessibility-review (WCAG 2.1 AA). Judged against CLAUDE.md, `docs/PLATFORM_RULES.md` R34 to R38 and `docs/ia/navigation-architecture.md`.

## Headline

The craft screens for the IT-native roles (Service desk lead, Change manager, Project manager, Portfolio lead, Finance approver on Atlantic Logistics) are strong: dashboard first, a clear sentence that states the situation, owners and backups on every record, honest labels on the industry tenants, and working drawers with real actions. The experience breaks in four places:

1. **Permissions do not know the five newer operations roles.** Distribution, Facilities, Procurement, Plant and Process control are evaluated as plain employees, so 10 of their 20 role pins open a "not available to you" page. Procurement lead cannot open any of its four pins (UX-M-01, P0).
2. **Approve is unreliable.** In My approvals the Approve button looks enabled, the drawer says "You can decide this", and the button is locked (UX-M-02, P0). The Finance approver's own inbox shows 0 items while invoices and budget requests wait for her (UX-M-03).
3. **Identity and tenant leak.** In an industry tenant Home greets the Atlantic Logistics person, the contribution card names the tenant person, chat greets Casey Rowan, and search names Casey Rowan and Atlantic Logistics people (UX-M-04, UX-M-05, UX-M-11). Home's headline numbers stay Atlantic Logistics' in every tenant (UX-M-06).
4. **Numbers disagree with themselves.** The same measure shows two values on one screen or between Home and its screen (UX-M-07), and "no data yet" chips sit beside a figure for the same measure (UX-M-10).

Design health, scored with the critique skill's Nielsen rubric across the eleven walks (proposal): 23 of 40. Visibility of status 2, match with the real world 2 (industry vocabulary is uneven), user control 3, consistency 2, error prevention 2, recognition 3, flexibility 3 (search palette, keyboard reorder), minimalist design 1 (Home and Projects repeat the same numbers three times), error recovery 2, help 3 ("Why am I seeing this?", formulas on every metric).

AI-slop verdict (impeccable): the painted rail, serif display face and owner chips give it character; the tells that remain are the purple to blue gradient VibeCheck button in the rail, glass cards over painted imagery behind body text in the record drawer, and the repeated hero-metric tile rows (three tiles with sparkline, then six summary tiles, then chips that repeat them).

---

## Shared findings (seen by several personas)

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix (module) |
|---|---|---|---|---|---|
| UX-M-01 | P0 | `plat_proc`, `bud_ven`, `r15_p2p`, `ppm_sow`, `exe_mat` | `dist/core_plat_proc.png`: "Process library is not available to Distribution manager", role evaluated as Employee. Same page for Facilities (`plat_proc`, `bud_ven`), Procurement (all four pins), Plant (`plat_proc`, `exe_mat`), Process control (`plat_proc`). 10 of 20 pins for these five roles are denied. Root cause: `PERSONA_ROLES` in `mod_r16g_a_perm.js` has no entry for `dist`, `fac`, `scm`, `plant`, `proc`, so they fall back to `employee`. | Task completion; consistency between menu and permission (IA section g.4: "nothing is hidden by navigation alone that permissions should hide", and the reverse) | Add the five roles to `PERSONA_ROLES` and grant each its pinned screens in the screen rules (`mod_r16g_a_perm.js`). Add a check to `tools/tests/nav_ia.js`: every role pin passes `PERM` for its persona. |
| UX-M-02 | P0 | `flw_appr` drawer | Project manager, AP-2121 release go or no go (`pm/core_flw_appr_row.png`): drawer says "You can decide this: you hold the Release manager role", Approve is a filled primary button at full opacity, but it is `disabled` with title "Not permitted: Deny by default: approve needs an explicit rule". Same for Service desk lead ("A required gate is not passing · Not permitted: Deny by default..."). Reject is locked too; Return and Delegate work. | Visibility of status; error prevention; WCAG 3.3.1 (reason only in a tooltip on a disabled control, which keyboard and touch users never see) | Make "who can decide" and the lock use one function (`mod_flow.js` decision panel and `PERM.approverOf`, `mod_r16g_a_perm.js`). A locked action renders as locked (`.pm-locked` gets muted styling in `mod_r16g_perm.css`) with the reason inline in plain words: "Approval needs the Release manager rule for this service. Ask Casey Rowan to add it." Never count an item as "on you" when you cannot decide it. |
| UX-M-03 | P1 | `flw_appr`, `inv`, `bud_req` | Finance approver: My approvals reads "0 approvals are waiting on you" while Home shows "Approvals past service level 18%", the rail shows My work 2, `inv` has INV-20433 waiting, and `bud_req` has 3 requests in Finance review. | Recognition over recall; the screen's own claim "One inbox for every decision that needs a person" | Feed invoice holds and budget-request stage reviews into the approvals inbox (`mod_flow.js` inbox sources; `mod_budget.js` invoice queue; `mod_budget3.js` request funnel). |
| UX-M-04 | P1 | Home, `flw_appr`, search, chat | Larkspur, Project manager (`pm/health_home.png`): hero "Welcome, Priya."; rail "Priya Shah"; card "Viewing as Dr. Marcus Hale (Project manager, the person in this seat in this tenant: a sample mapping)". Search in Larkspur, Corvane and Redstone: "Casey Rowan has neither role" for every persona. | Consistency; match with the real world | One accessor for the current person per tenant (`IDENT.cur` in `mod_s_tenant.js`) used by the Home greeting (`mod_r15d_front.js`, `mod_r21_home.js`), the rail profile (`mod_nav.js`), the contribution card (`mod_s_contrib.js`), search (`mod_s_search.js`) and `PERSONA_USER` (`mod_r16g_a_perm.js`, which defaults to Casey Rowan). |
| UX-M-05 | P1 | chat dock | For the Project manager the chat context shows "You: Casey, CIO" and greets "Hi Casey. I can answer, and I can do things..." on every screen, for every persona tried. | Visibility of status (who is acting); R35 every action is audited, so the actor must be right | Chat context follows `S.persona` and the tenant person (`mod_chat.js`). |
| UX-M-06 | P1 | Home | In every industry tenant the banner says "This screen is not tenant-aware yet and still shows the Atlantic Logistics sample data", and the three hero tiles stay Atlantic Logistics' (Project manager in Larkspur: SPI 0.96, milestones 78%, vendor 0.86). The banner collides with the Lens chip ("Wl", "ia" fragments visible, `pm/health_home.png`; clipped on phone, `fac/core_home_phone.png`). | R16 to R20 tenant rules; peak-end (the first thing a buyer sees after switching is another company's numbers) | Hero tiles read the tenant's metrics through `DATA.get('metrics')` by role (`mod_r15d_front.js` KPI pick); place the banner above the hero, not in the chip row (`mod_s_tenant.css`). |
| UX-M-07 | P1 | Home and `ims`; `itsm_rel`; `itsm_inc` (Corvane) | Portfolio lead Home: "Schedule performance 0.91, Watch"; `ims` header: "0.96, target 0.95". `itsm_rel` (dark, `change/core_itsm_rel_dark.png`): header "Release change failure rate 16%" and "Lead time 48 h", DORA cards on the same screen "15.4%" and "64 h". Corvane `itsm_inc` (`ops/storage_itsm_inc.png`): tile "Time to restore 15.8h" over a chip "Time to restore: no data yet". | Consistency; trust in numbers (R25 every number is a defined metric) | Every tile and sentence reads the one `METRICS` value through `fchip`; a lint that a metric id renders one value per screen (`tools/lint`). Modules: `mod_r15d_front.js`, `mod_rel.js`, `mod_itsm.js`. |
| UX-M-08 | P1 | notification toasts (all screens) | Toasts offering Approve land over content and are not routed to the viewer: "SR0010698 Access request, Waiting on Budget owners, Approve" for Distribution and Facilities (`fac/core_svc_req_dark.png`); "RTP-074 Scheduled publish cancel..., Waiting on Knowledge reviewers, Approve" for Change manager (`change/core_itsm_chg.png`); "Contoso Cloud Operations: renew 36..., $890,000" over the RAID header on phone for the Project manager (`pm/core_ppm_raid_phone.png`) and over "What needs attention" on Timesheets (`pm/core_r15_time_full.png`). | PH-10 (controls never over content); signal per place (IA principle 9); error prevention (Approve one tap from a toast for an item you do not own) | Filter toasts by the viewer's approver roles; dock them in a reserved region that never covers the work list; on phone show a count on the bell, not a banner (`mod_r17n_notify.js`, `mod_r17n_notify.css`). |
| UX-M-09 | P1 | tenant record drawers (`svc_req`, `itsm_chg` CAB tab, `port`) | Larkspur request drawer (`dist/health_task_assign_svc_req_row.png`): title is the id "LH-SR0010001", fields "State new", "Created 2026-10-04", "Service level on track", no owner, no backup, no Assign or Reassign. Corvane CAB tab: no approve control and the rows are not visible. Corvane `port`: projects table only, no fund action. Atlantic Logistics drawers for the same objects have owner, backup, Reassign, Mark step done, Expedite. | R12 owner and backup on every record; task completion; consistency | Tenant screens open the core record drawer (owner chip, status actions) with simulated actions labeled, or say once in plain words "Actions are available on the Atlantic Logistics sample only in this prototype" (`mod_s_tenant_screens.js`). Show the record name as the title and format dates and states. |
| UX-M-10 | P1 | tenant screens (`itsm_inc`, `svc_oncall`, `kcs_home`, `itsm_chg`, `dev_pipe`, `itom_run`, `svc_req`, `svc_guides`) | Three to six "ƒ ... no data yet" chips per screen. Contradictions: `svc_oncall` (Corvane) "76.3% of required hours are covered" beside "On-call coverage: no data yet"; `kcs_home` "with a no data success rate"; `itsm_chg` "The change failure rate is n/a% against..."; `itsm_inc` "0 are P1 or P2 ... CV-INC0501 is a major incident" and tile "0 is a major incident". | Clarify (never inject a placeholder into a sentence); gaps should be clear and not alarming | One gap line per screen in plain words: "Corvane has no history for these three measures yet (sample data)". Compute from the tenant rows when the sentence already has the number; drop the sentence when it would read "n/a%" (`mod_s_guard.js`, `mod_s_tenant_screens.js`, `mod_oncall.js`, `mod_kcs.js`, `mod_itsm.js`). |
| UX-M-11 | P1 | search palette | Corvane and Redstone: "Search follows the active tenant ... 427 results from the Atlantic Logistics sample are hidden", then "Who to ask: Nia Brooks, Hollis Grey, Owen Pryce, Leila Haddad, Elena Marsh" (all Atlantic Logistics people) for Change manager and Process control; Facilities and Procurement in Larkspur and Redstone get Tom Becker and Camille Ortega. | Tenant isolation (R18: a gap is empty, never Atlantic Logistics rows); honesty | Who-to-ask reads the tenant's owners (`mod_zsearch.js` provider, `mod_s_search.js`). |
| UX-M-12 | P1 | search palette | Facilities "work order": groups "Data entities: Work order, Permit to work, Rule action", "Data connections: Work order (work_order) 0 writers, 0 readers", "Fields", no work orders. Procurement "purchase order": "Data entities: Purchase order, fin, 9 fields", no purchase orders. | Information scent; distill (builder objects are noise for a business user) | Hide Data entities, Data connections and Fields groups outside builder mode; map role words to record types (`mod_zsearch.js`, `mod_s_search.js`). |
| UX-M-13 | P1 | `inv`, `r15d_evidence` and other core-only screens inside a tenant | Finance approver in Larkspur: `inv` shows Atlantic Logistics' Lumen invoice INV-20433 under the not-tenant-aware banner, and Approve works in one click. Auditor in Redstone: the evidence room shows Atlantic Logistics' 15 controls and 658 audit entries. | Error prevention; an auditor sampling another company's evidence is the worst possible confusion | Inside a non-core tenant, core-only screens are read only with the banner, or show an empty state that names the gap ("Redstone has no evidence records in this sample yet"). `mod_budget.js`, `mod_r15d_evidence.js`, guard in `mod_s_tenant.js`. |
| UX-M-14 | P1 | every table | Table headers measure 2.79 to 1 contrast at 11 px (`th` in `pm:home`, `ppm_raid`, `itsm_inc`); seven status pills on `ppm_raid` at 1.65 to 1. | WCAG 1.4.3 contrast (4.5 to 1 for text under 18 px); typeset (11 px uppercase headers are hard to read at scale) | Header text token with at least 4.5 to 1 and 12 px or more; pill text token audit (`mod_r17r_tables.css`, `style*.css` token for `th`, `css-tokens.md`). |
| UX-M-15 | P1 | record drawer (all) | `ppm_raid`, row opened with Enter: drawer has `role=dialog`, `aria-modal=false`; focus stays on the table row, 40 Tabs never enter the drawer; Escape closes it but focus goes to "Skip to main content", not back to the row. | WCAG 2.4.3 focus order; 2.1.2 keyboard | On open move focus to the drawer title, keep Tab inside while it is open, return focus to the opener on close (`ui.js` `openDrawer`, `mod_r15f2_a_shell.js`). |
| UX-M-16 | P2 | every screen | "Lens CIO" or "Lens COO" sits top right on every screen for managers (title: "see what a CEO, CFO, CIO or other executive would weigh"). It is the first Tab stop on every screen. | Distill; R38 information by level (managers get working views) | Show the lens control only for CxO and board personas; for others keep it in the profile panel (`mod_r18a_shell.js`, `mod_r18e_lens.js`). |
| UX-M-17 | P2 | rail flyouts | Role pins repeat as entries further down the same flyout (Projects twice, Schedules twice, Work the request queue twice, Fix what is broken twice), and sub-group headers show with no entries under them: "Processes and maturity" and "Scale what was built" (Distribution), "Technology and services", "Monitoring" (Facilities), "Choose the work" (Change manager). | Recognition; Hick and Hyman (fewer, distinct choices); layout | Drop a sub-group header when it has no visible entry after purview and permission; mark pins in place with the star instead of duplicating them (`mod_nav.js` flyout render). |
| UX-M-18 | P2 | Home | Project manager Home is 5,295 px tall. Order: painted hero with three tiles, role pins, the contribution card, then "Your work, prioritized" (below the first screen), then "Needs you" (a second list of things waiting), then schedule and projects. Schedule performance appears three times. | IA section f.2 habit loop (waiting on me, my contribution, what changed, in a fixed place); distill; layout (squint test: the hero image wins) | Put "Your work, prioritized" first under a shorter hero, fold "Needs you" into it, show each metric once (`mod_r21_home.js`, `mod_r15d_front.js`). |
| UX-M-19 | P2 | owner chips in sentences | `ppm_proj` attention cards (`pm/core_ppm_proj_full.png`): "Tate ( Tate · Triage Agent ) on Portal", "Elise Park 's contract", double avatars before owner names in the project drawer and watchers. | Clarify; typeset | `ownerChip` gains an inline variant without the duplicated name; attention-card templates stop wrapping a chip in parentheses (`platform.js` `ownerChip`, `mod_s_owner.js`, `mod_ppm.js`). |
| UX-M-20 | P2 | many | "1 of your items are not linked", "1 approvals are waiting", "1 collide on the same CI", "1 providers", "with the Elena Marsh", "lumen slips the search indexer again" (proper noun lowercased mid sentence), "ƒ ƒ" doubled glyph on tiles (`bud_req`, `r15_time`), "Auditor (read only) (read only)" nesting, "ser- vice" and "re- lease" hyphen breaks in metric cards, "Experience level a" chip clipped. | Clarify; typeset (`hyphens:auto` on short labels) | A shared plural helper (`U.plural`) and a sentence-case helper that keeps proper nouns; `hyphens:manual` on metric card titles; let chip rows wrap (`platform.js`, `mod_s_contrib.js`, `mod_r16j_h_metrics.js`). |
| UX-M-21 | P1 | `ims`, `ppm_raid`, Home lists, `ppm_proj` | Banned name visible: filter label "Core projects" on `ims` and `ppm_raid`. Real brands in visible text: "Azure August actuals" (approval AP-2103), "Shared mailbox or Teams channel", "Decommission Project Online export bridge", "Contoso Cloud Operations", "Claude + GPT council". | CLAUDE.md hard rules (no banned names; no real organization's brand) | Rename the filter "Main projects" (`mod_ppm.js`, `data2.js`); replace brand names in seed data with generic ones ("cloud hosting", "team chat channel", "project tool export bridge", a fictional cloud vendor) (`data2.js`, `kit2.js`, `mod_devops.js`). |
| UX-M-22 | P2 | Home | The page `h1` is the eyebrow "HOME"; the welcome line is not a heading. | WCAG 1.3.1; typeset | Make the welcome line the `h1` and the eyebrow a plain label (`mod_r21_home.js`). |
| UX-M-23 | P2 | phone, 400 px | No horizontal scroll on any captured screen (good, R36). But: the tenant banner hides behind the Lens chip; toasts cover the screen header; filter pills stack full width and push the RAID list two screens down; the bottom bar shows Approvals 16 while desktop My work shows 2. | Adapt; consistency of counts | Collapse filters into one "Filter" sheet on phone; one count source for the badge (`mod_r17o1_shell.js`, `mod_r17o2_content.css`). |
| UX-M-24 | P2 | Home hero, `svc_req`, `itsm_inc` | Vocabulary is uneven: Larkspur calls IT access requests "Referral" (a clinical word) in the queue and drawer; Corvane keeps "Log incident" next to "data recovery events"; the Plant manager hero in Redstone shows "Batches right first time" (a batch plant measure, not a mine); Atlantic Logistics shows Distribution, Facilities and Plant heroes with order, stock and equipment measures that have no matching records in a standards body. | Match between system and the real world | Vocabulary per tenant pack for buttons and record labels, not only headlines (`mod_s_pack_*.js` vocabulary, `mod_s_tenant_screens.js`); hero tiles per tenant (see UX-M-06). |
| UX-M-25 | P2 | contribution card and thread | Six of eleven personas have no team objective on Atlantic Logistics and see "No team objective is linked to your team yet [modeled]." with the label chip mid sentence. Mapping oddities: Facilities lead in Larkspur sits in "Pharmacy"; Portfolio lead's teams are "Vendor management, Contracts"; Procurement lead earns points "through Clear invoices by rule". On Corvane the top-bar thread for the Service desk lead ends at "Gross renewal rate" while the card shows "Every customer restores on time". | Purpose and progress (IA principle 11); gaps clear and not alarming | Gap copy: "Distribution is not linked to an objective yet. Ask Casey Rowan to link it." with a link action; fix the team mapping in the packs; derive the top-bar thread and the card from the same anchor (`mod_s_contrib.js`, `mod_s_packgen.js`). |
| UX-M-26 | P1 | `r18_builds` | All eleven personas see the same list: 13 builds, "391 people use them", heading "What you built". Not filtered by purview. | IA section g.4 (Build list adopts the purview function, JM-13) | Filter builds by `NAVX.purview()` with an "All builds" toggle; title "Builds in your area" (`mod_r18c_builds.js`). |
| UX-M-27 | P1 | `metrics` (pin for Distribution, Facilities, Plant, Process control) | Atlantic Logistics: "462 metrics, 335 off trend", unfiltered, 1,703 words, 30 inputs. The persona's own three measures are not first. | Purview; distill; density versus scanning | Default the view to measures owned by the persona's team or named on its Home, with "All measures" one click away (`mod_r16j_h_metrics.js`). |

## Per persona

### Portfolio lead (Maya Ortiz; Corvane: Elif Arslan)

Tasks tried: decide the demand queue (`port`), staff a request (`ppl_cap`), update a risk (`ppm_raid`), search "demand", follow the thread from `port`.

What worked: `port` is the best decision screen in the walk: a stated decision ("4 of 10 ranked requests are funded: $1.44M of the $2.0M envelope"), the funding line drawn in the ranked list, levers that re-rank, a reason captured on override, and keyboard reorder with Alt and arrows. Search "demand" returns the screen, its tabs and 20 demand requests. Corvane `port` labels every figure "Sample count" or "Simulated".

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-28 | P2 | `port` | Funding happens only by dragging a row above the line; there is no visible "Fund" or "Send to the review board" action on a row, and the review board stage has no decision control (`portfolio/core_port_full.png`). | Flexibility; recognition | Add a row action "Fund" and "Hold" that moves the row and asks for the reason (`mod_ppm.js` ranked demand). |
| UX-M-29 | P2 | `ppl_cap` | 1,101 words, 351 numbers, 178 controls on one screen; "55 people over capacity" in the opening sentence. In Corvane the screen is not tenant-aware and shows Atlantic Logistics' 113 people. | Distill; density | Lead with the three staffing decisions waiting; tenant gap per UX-M-13 (`mod_people.js`). |
| See also | | | UX-M-07 (Home SPI 0.91 against 0.96), UX-M-09 (Corvane `port` read only), UX-M-25 (team mapping), UX-M-16 | | |

### Project manager (Priya Shah; Larkspur: Dr. Marcus Hale)

Tasks tried: update a project (`ppm_proj`), assign a risk owner (`ppm_raid`), approve a timesheet (`r15_time`), approve a release go or no go (`flw_appr`), search "beta", follow the thread.

What worked: search "beta" finds 7 meetings, 4 minutes and the projects; the RAID drawer has owner, backup and a status pencil; the thread on `ppm_raid` reaches "O-001.2 Earn the Standards Platform plan, your team 60% toward 100%". Larkspur `ppm_proj` and `ims` are tenant-aware and honest ("Sample data, simulated").

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-30 | P1 | `r15_time` | Headline "9 sheets wait for approval; approving posts labor cost..." on a role pin, but "Approve and post" is disabled for the Project manager with the reason only in a tooltip ("decided by People managers (reporting chain); Priya Shah is not a member"). | Visibility of status; WCAG 3.3.1 | Say who decides in the row ("Waiting on Dev Rao's manager") and drop the dead button for non-approvers (`mod_r15f3_time.js`). |
| UX-M-31 | P2 | `ppm_proj` | Status cannot be changed from the project drawer; assigning an owner is an unlabeled pencil beside "Owner"; RAID drawer shows the tag "project" twice, raw "-" for Service and Vendor, and the acronym RAID undefined ("Open RAID log"). | Recognition; R37 acronyms defined | Label actions "Change owner", "Change status"; dedupe tags; show "None" (`mod_r15f2_a_shell.js` drawer, `mod_ppm.js`). |
| UX-M-32 | P2 | `ppm_proj` | Projects shows an AI agent strip ("16 agents registered, 13 working, 2 idle") and four rows of measures before the project list; milestones and SPI appear three times (`pm/core_ppm_proj_full.png`). | Distill; R34 (dashboard first, but one dashboard) | Remove the agent strip from Projects (it lives on the AI agents screen); one measure row (`mod_ppm.js`, `mod_r15d_facts.js`). |
| See also | | | UX-M-02 (release approval locked), UX-M-04 (Priya and Dr. Marcus Hale), UX-M-08 (renewal toast on phone), UX-M-18 (Home length), UX-M-19, UX-M-21 ("Core projects") | | |

### Service desk lead (Tom Becker; Corvane: Aisha Rahman)

Tasks tried: assign an incident (`itsm_inc`), update the major incident (`itsm_mi`), edit a rota (`svc_oncall`), search "outage", follow the thread.

What worked: the incident drawer is complete (Assign or swarm, Resolve, Put on hold, Create problem, Raise change, SLA timers with "Met, 41m to spare" and "Breached 22h 54m ago"); one click from the row. The thread reads "O-002.1 Keep Tier 1 available, your team 99.6% toward 99.9%". Corvane uses "data recovery events" in the headline and runs on its own incidents.

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-33 | P2 | incident drawer | Two filled primary buttons (Impact analysis and Resolve) among seven actions (`ops/storage_task_assign_itsm_inc_row.png`). | Make one action primary (impeccable: hierarchy) | Resolve is primary; Impact analysis secondary (`mod_itsm.js`). |
| UX-M-34 | P2 | `kcs_home` | "Article reuse rate 79.3x, target ≥ 6x" reads as an error. | Clarify | Express as uses per article or cap the display (`mod_kcs.js`). |
| See also | | | UX-M-02 (approval locked by a gate), UX-M-10 (Corvane contradictions), UX-M-25 (thread and card disagree), UX-M-17 | | |

### Change manager (Nia Brooks; Corvane: Aisha Rahman)

Tasks tried: approve a change (`itsm_chg`, CAB and approvals tab), record a release go or no go (`itsm_rel`), assign a change, search "change", follow the thread.

What worked: Approve in the CAB tab takes 2 clicks (tab, Approve) beside Reject, Defer and Delegate. `itsm_rel` offers "Record go or no-go" from the release drawer. Redstone calls changes "management of change records".

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-35 | P1 | `itsm_chg` | The change record drawer opened from the list (`change/core_task_approve_itsm_chg_row.png`) has no decision controls; approving is only possible from the CAB tab, and Approve there gives no confirmation message. | Consistency; visibility of status | Put the CAB decision block in the change drawer; confirm with a toast that names the change and offers undo (`mod_itsm.js`). |
| UX-M-36 | P2 | Corvane `itsm_chg`, `itsm_rel`, `dev_pipe` | Corvane has no release records: "release records are not in its data yet" (clear and calm, good) but the CAB tab shows no visible rows and three chips say "no data yet". The Change manager and Service desk lead are the same person in Corvane (Aisha Rahman). | Gaps clear; persona realism | One gap line (UX-M-10); map a distinct change manager in the Corvane pack (`mod_s_pack_storage.js`). |
| See also | | | UX-M-07 (two values for change failure rate and lead time on `itsm_rel`), UX-M-08 (publish approval toast), UX-M-17 (empty "Choose the work") | | |

### Finance approver (Avery Chen; Larkspur: Samuel Okonjo)

Tasks tried: approve an invoice (`inv`), approve a budget request (`bud_req`), update a budget line (`bud_over`), search "invoice", follow the thread.

What worked: `inv` states the case in one sentence ("paying now overpays by $22,000"), shows the advisor's recommendation with its evidence, and Approve takes 1 click. The thread reads "O-003.1 Clear invoices by rule, your team 38% toward 60%". Larkspur `bud_over`, `bud_req` and `bud_ven` are tenant-aware ("Capital requests", "Suppliers and supplier contracts").

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-37 | P1 | `inv` | Approve against the advisor's "Hold" goes through in 1 click with no reason and no undo, on a $62,900 invoice that overpays by $22,000. `port` asks for a reason on every override; `inv` does not. | Error prevention; emotional valley at a high-stakes moment (critique) | Overriding a Hold opens a one-line reason and shows an undo toast (`mod_budget.js`). |
| UX-M-38 | P2 | `bud_req` | No approve control for the finance approver; the only match is the stage card "Approved and funded, End state", which looks like a button and opens a stage description. | Affordance; recognition | A "Decide" action on requests in Finance review; stage cards styled as information (`mod_budget3.js`). |
| See also | | | UX-M-03 (empty inbox), UX-M-13 (Atlantic Logistics invoice approvable in Larkspur), UX-M-20 ("ƒ ƒ") | | |

### Auditor, read only (Rina Okafor; Redstone: Aroha Whitcombe)

Tasks tried: sample evidence (`r15d_evidence`), read governance (`grc_home`), check approval authority (`bud_doa`), search "evidence", follow the thread.

What worked: read-only is visible from Home ("Read-only view") and the evidence room offers Verify chain and Export everything. Redstone `bud_doa` and `exe_board` are tenant-aware with record numbers behind each section.

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-39 | P1 | `grc_home`, `bud_doa` | A read-only role sees "Log a finding" (a create action), and `bud_doa` tells the auditor "Anything up to $100,000 you can approve" (the CIO's line). The IA paper says Auditor never sees a create action. | Consistency with R38 and IA section e | Hide create actions when `readonly`; write `bud_doa` copy for the viewer's authority ("You approve nothing; this shows who does") (`mod_r15f2_b_grc.js`, `mod_budget.js`). |
| UX-M-40 | P2 | Auditor persona | Auditor and CISO are the same named person (Rina Okafor); the card reads "Auditor (read only) (read only)". | Persona realism; clarify | Give the auditor a distinct sample person (`mod_r15d_persona.js`). |
| See also | | | UX-M-13 (Atlantic Logistics evidence inside Redstone), UX-M-06, UX-M-25 | | |

### Distribution manager (Tomas Reyes; Larkspur: Owen Ashdown)

Tasks tried: assign a request (`svc_req`), update a process (`plat_proc`), update a measure (`metrics`), open order guides (`svc_guides`), search "request", follow the thread.

What worked: Reassign is available in the Atlantic Logistics request drawer. Larkspur `svc_guides` says plainly "Larkspur Health System: no order guide or order yet" (a calm, clear gap).

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-41 | P1 | `svc_req` | The pinned queue is the IT service desk queue ("Shared mailbox or Teams channel", "Software license", "Role or location change") with 86 open; the thread on it is "Keep Tier 1 available". Nothing is about shipping or stock. Same for Facilities, Plant and Process control. | Purview; information scent | Filter the queue to the persona's service lines and teams by default, with "All requests" one click away (`mod_svc.js`, `mod_svc3.js`). |
| See also | | | UX-M-01 (`plat_proc` denied), UX-M-08 (access request toast), UX-M-17 (empty sub-groups), UX-M-24 ("Referral"), UX-M-27 | | |

### Facilities lead (Ruben Castillo; Larkspur: Theodore Quist)

Tasks tried: assign a work request (`svc_req`), update a vendor (`bud_ven`), update a measure (`metrics`), search "work order", follow the thread.

What worked: the Home hero speaks the role ("Maintenance on time", "Age of open work orders", "Safety inspections complete"). Dark mode reads well on `svc_req`.

Findings: no Facilities-only findings beyond the shared ones. Two of four pins denied (UX-M-01), IT queue instead of work orders (UX-M-41), search finds data entities not work orders (UX-M-12), Larkspur team mapped to Pharmacy (UX-M-25), toasts (UX-M-08), unfiltered measures (UX-M-27).

### Procurement lead (Camille Ortega; Redstone: Tobias Renner)

Tasks tried: approve a purchase order (`r15_p2p`), update a vendor (`bud_ven`), review a statement of work (`ppm_sow`), search "purchase order", follow the thread.

What worked: the Home hero ("Supplier on-time delivery", "Days to purchase order", "Spend under contract") and the rail match the role. The denial page explains itself and offers "Request access".

Findings: every task is blocked. All four pins are denied (UX-M-01, P0). Search "purchase order" returns data entities and no orders (UX-M-12). The contribution card credits "Clear invoices by rule", a finance team objective (UX-M-25).

### Plant manager (Dmitri Kowal; Redstone: Callum Fairweather)

Tasks tried: update a measure (`metrics`), update process maturity (`exe_mat`), assign a work request (`svc_req`), search "haul", follow the thread.

What worked: in Redstone, search "haul" finds the project "Condition monitoring on the haul fleet" and the metrics "Haul truck availability" and "Mean time between failures, haul trucks"; Redstone `metrics` is tenant-aware with owners, backups and formulas. In Atlantic Logistics, "haul" correctly finds nothing and suggests asking.

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-42 | P2 | Home (Redstone) | Hero "Equipment effectiveness 71%, Unplanned downtime hours 18, Batches right first time 93%" is Atlantic Logistics' not-tenant-aware set; Redstone's own "Haul truck availability" is one search away but not on Home. | Match with the real world; R16 | Hero from the tenant's metrics by role (UX-M-06). |
| See also | | | UX-M-01 (`plat_proc`, `exe_mat` denied), UX-M-27, UX-M-41 | | |

### Process control lead (Sofia Arenas; Redstone: Dr. Kwame Asante)

Tasks tried: approve a management of change record (`itsm_chg`), update a process (`plat_proc`), assign a request (`svc_req`), search "change", follow the thread.

What worked: Redstone `itsm_chg` uses the right words ("3 management of change records are scheduled"); the contribution card in Redstone reaches "Everyone goes home safe > Corrective actions closed on time, your team 63% toward 90%".

Findings:

| Id | Sev | Screen | Evidence | Skill or heuristic | Fix |
|---|---|---|---|---|---|
| UX-M-43 | P2 | `itsm_chg` | The pin is named "Plan and approve changes", but the CAB Approve is locked: "held by Change advisory board; Sofia Arenas is not a member", reason only in a tooltip. | Information scent; WCAG 3.3.1 | For non-members label the pin "Plan changes" and show "CAB decides: Nia Brooks, Rina Okafor, Sam Patel, Tom Becker" inline (`mod_itsm.js`, `mod_nav.js` labels). |
| See also | | | UX-M-01 (`plat_proc` denied), UX-M-11 (Atlantic Logistics people in Redstone search), UX-M-41 | | |

## What held up (keep)

- No horizontal scroll at 400 px on any of the 55 phone captures (R36).
- No em dashes found in any captured screen text.
- Honesty labels on every industry-tenant screen that reads the tenant layer ("Sample data, simulated", "Tenant isolation simulated").
- The not-permitted page explains the decision, names the roles evaluated and offers "Request access" and "Explain this decision".
- Keyboard focus is visible on every control tabbed through on `ppm_proj`; all images have `alt`; one `main` landmark; `lang="en"`.
- Formulas behind every metric chip, and "Why am I seeing this?" on every screen.

## Severity counts (prototype fact, this document)

| Severity | Count | Ids |
|---|---|---|
| P0 blocks the task | 2 | UX-M-01, UX-M-02 |
| P1 hurts often | 21 | UX-M-03 to 15, 21, 26, 27, 30, 35, 37, 39, 41 |
| P2 polish | 20 | UX-M-16 to 20, 22 to 25, 28, 29, 31 to 34, 36, 38, 40, 42, 43 |
| Total | 43 | |

## The ten highest-value fixes, grouped by module

1. **`mod_r16g_a_perm.js`** (with a check in `tools/tests/nav_ia.js`): add `dist`, `fac`, `scm`, `plant`, `proc` to `PERSONA_ROLES`, grant their pinned screens, and fail the build when a role pin is denied to its persona. Fixes UX-M-01 (P0); unblocks five personas.
2. **`mod_flow.js` with `mod_r16g_a_perm.js` and `mod_r16g_perm.css`**: one function decides "who can decide" and the lock; locked buttons look locked and say why inline; nothing is "on you" that you cannot decide. Fixes UX-M-02 (P0), UX-M-30, UX-M-43.
3. **`mod_flow.js` inbox sources, `mod_budget.js`, `mod_budget3.js`**: invoice holds and budget-request reviews feed My approvals; overriding an advisor's Hold asks for a reason and offers undo. Fixes UX-M-03, UX-M-37, UX-M-38.
4. **`mod_s_tenant.js` identity accessor, used by `mod_r15d_front.js`, `mod_r21_home.js`, `mod_s_contrib.js`, `mod_chat.js`, `mod_s_search.js`**: one current person per tenant everywhere (greeting, card, chat, search). Fixes UX-M-04, UX-M-05.
5. **`mod_r15d_front.js` and `mod_r21_home.js`**: hero tiles from the tenant's metrics by role, work queue first, one value per metric, welcome line as `h1`. Fixes UX-M-06, UX-M-18, UX-M-22, UX-M-42 and part of UX-M-07.
6. **`mod_s_guard.js` and `mod_s_tenant_screens.js`**: one calm gap line per screen, no placeholders inside sentences, core drawer with owner and actions on tenant records, core-only screens read only inside another tenant. Fixes UX-M-09, UX-M-10, UX-M-13, UX-M-36.
7. **`mod_r17n_notify.js` and `.css`**: toasts filtered to the viewer's approver roles and docked where they never cover content; a count on the bell on phone. Fixes UX-M-08 and part of UX-M-23.
8. **`mod_zsearch.js` and `mod_s_search.js`**: tenant owners in Who to ask; data entities and fields only in builder mode; role words map to record types. Fixes UX-M-11, UX-M-12.
9. **`mod_nav.js`, `mod_r18c_builds.js`, `mod_r16j_h_metrics.js`, `mod_svc.js`**: purview everywhere it is promised: no empty sub-group headers or duplicated pins, Build list and Measures and targets filtered by purview, request queue filtered to the persona's service lines. Fixes UX-M-17, UX-M-26, UX-M-27, UX-M-41.
10. **Shared tokens and shell (`mod_r17r_tables.css` and the `th` token, `ui.js` `openDrawer`, `platform.js` `ownerChip` and a `U.plural` helper)**: header contrast to 4.5 to 1, drawer focus in and back, chips without duplicated names, plural and casing helpers. Fixes UX-M-14, UX-M-15, UX-M-19, UX-M-20.

Not in the ten but quick and required by the hard rules: UX-M-21 (rename "Core projects"; replace Azure, Teams, Project Online, Contoso and GPT in seed data, `mod_ppm.js`, `data2.js`) and UX-M-39 (no create actions for the read-only auditor, `mod_r15f2_b_grc.js`).

## Reproduce

```
python3 src/build.py --full --out build_out        # writes src/build_out/full.html when run from the repo root
NODE_PATH=<repo>/node_modules node tools/scratch/ux/walk.js [persona ...]   # shots and out/<persona>.json
node tools/scratch/ux/sum2.js <persona>            # digest of one walk
sh tools/scratch/ux/approve_all.sh                 # approve probes
NODE_PATH=<repo>/node_modules node tools/scratch/ux/a11y.js                 # contrast, landmarks, drawer focus, chat identity
NODE_PATH=<repo>/node_modules node tools/scratch/ux/builds.js               # Build list by purview
```
