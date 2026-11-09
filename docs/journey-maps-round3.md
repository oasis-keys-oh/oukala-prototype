# Journey maps: round 3 contents

Documents backlog items JM-11 and JM-12 (round 3 of the journey work, which the Project doc `claude/journey-maps-round2.md` covers only through round 2). It describes what the round 3 modules do, as changed by wave 2 (JM-01 to JM-09, DC-01, DC-24), so a reader does not have to open the code. It carries no status or priority. Source of the history: the journey handoff of 2026-10-19 (rounds 2 and 3; commit 0ff1e9a for round 3). Every claim was checked against the code in `src/` and against a build of the code on 2026-10-20.

All figures are **prototype facts** about the sample data unless labeled. Every hour, FTE and cost figure inside the journey screens is a **modeled** sample value: a robot is assumed to free 80% of a step's hours, an agent 60%, 140 hours is one full-time equivalent (FTE) a month, and one recommended step can release at most 2 FTE (section 3a). Wave order is a **hypothesis**. Nothing described here is live: agents and robots shown as recommended are proposed, not built. All organizations and people are fictional (Atlantic Systems and the Larkspur, Redstone and Corvane samples).

## 1. Where round 3 sits

Experience journeys is the screen `ppl_jrny` ("Journey maps"). A journey is a list of stages; a stage holds boxes (steps); a box carries who does it, minutes, volume, cost, experience score (1 to 5), pain, the owning team, the system and the processes behind it. The screen has ten tabs (`JX.TABS`): Dashboard, Map, Overlay, Fulfillment, Processes, Process map, Personas, Org chart, Build list, Building blocks. Round 3 added or changed the last five of those and the data that feeds them. The list is defined in `mod_people.js` (`JR_TABS`) and mirrored in `mod_r31_jzx.js` (`JX.TABS`).

| Module | What it does |
|---|---|
| `src/mod_r31_jx.js` | Data layer: trace numbers, strategy metrics per journey, avatars, draft processes behind each box, and how processes connect |
| `src/mod_r31_jxr.js` | Views: experience curve, box cards and drawer, process drawer, Fulfillment, Processes and Personas tabs |
| `src/mod_r31_jzx.js` | Process map tab, experience bars on Personas, Build list tab (with its permission check and pilot panel), Building blocks tab, demo view, and the cross-reference export |
| `src/mod_r31_jzorg.js` | Org chart with agent assist (a tab, and its own screen `orgassist`) |
| `src/mod_r32_orgprop.js` | Draws the Build list's recommendations on the real org chart screen (`org_chart`) as dashed cards |
| `src/mod_people.js` (journey section) | The one FTE model: `FTE_H`, `REC_CAP_FTE`, `capSave`, exposed on `JYX.api` |
| `src/mod_r28_jy4.js` | Shared touchpoints (`TP`) for the core, mining and storage samples |
| `src/mod_r28_od2.js` | COO brief tabs that follow the tenant (JM-07) |
| `src/mod_r31_jnav.js` | Back and Forward inside Experience journeys (round 2) |
| `src/mod_r30_jov.js` | Overlay tab (round 2): ranks shared touchpoints by friction hours, strategy target or staff capacity |

Styles: `src/mod_r31_jx.css`, `src/mod_r31_jzx.css`. Shared globals: `JYX` (journey internals and `JYX.api`), `JXR` (views and helpers), `JX` (tab list and demo view), `JOV` (overlay), `SCN` (demo scenario).

## 2. Trace numbers

Every box gets a trace number made of the journey id and a sequence, for example `JH3-07`. The number is stamped once (`stamp()`, `JXR.tn`) and then shown on every tab, so the same step is recognizable everywhere. Where a box is served by a process step, the chip also shows the process number, for example `JH3-07 -> P-014.3`. Process, step and build numbers (`P-014`, `P-014.3`, `B-012`) come from `src/mod_r32_num_b.js` (backlog DC-02). Both kinds are searchable and linkable.

## 3. Strategy metrics and the Overlay

Each journey has one outcome metric with a sample baseline and target (`KV` in `mod_r31_jx.js`), for example JY5 "Time from need to published standard" 540 to 420 days (modeled), JH5 "Discharge before noon" 18% to 38% (modeled). For each box the code computes the share of the journey's target gap that fixing that step could reach (`potentials`, `JXR.slice`), weighting by minutes, cost or friction hours depending on the metric, and by how much of the box a recommended agent or robot could remove. This is used to rank steps on the Overlay tab, which has three rank-by switches: friction hours, strategy targets, staff capacity. Friction hours are hours a month multiplied by how badly the step feels (1 counts in full, 5 counts for nothing).

## 3a. One FTE model

All journey views share one set of constants (DC-01), defined in the journey section of `src/mod_people.js` and read through `JYX.api`:

- `FTE_H` = 140 hours a month is one FTE.
- `REC_SAVE`: a robot frees 80% and an agent 60% of a step's hours.
- `REC_CAP_FTE` = 2, so `REC_CAP_H` = 280 hours a month. `capSave(h)` limits what one recommended step can release to that amount. A step that hits the limit is flagged `capped`, and its explanation says the release is capped at 2 FTE (280 hours a month) for one step, modeled.
- On the Build list a capped build shows a visible "capped" note, and the tab states the per-step limit (`JXR.capNote()`). Totals read "released if all built, modeled".

The cap is a **modeled** assumption so invented sample volumes cannot produce an implausible total. It is not a finding.

## 4. Processes behind every step (draft generation)

`generate()` in `mod_r31_jx.js` makes sure every box has a process behind it, except three on purpose. For each scenario it leaves exactly three loud, painful unlinked steps so the red "No process yet" flag stays visible in demos. For all other unlinked boxes it groups them by shared touchpoint (or by stage), and builds a draft workflow definition (`wf_gx_...`, marked `drafted: "journey-map"`): receive the request, one step per box (an approval step when the title says approve or authorize), record the outcome. Each draft is registered with the workflow designer (`WFX`), so it opens like any other process.

| Scenario | Journeys | Boxes | Boxes with no process | Boxes with more than one process | Draft workflows generated |
|---|---|---|---|---|---|
| Atlantic Systems (core) | 5 | 48 | 3 | 2 | 11 |
| Healthcare (Larkspur) | 10 | 135 | 3 | 0 | 37 |
| Mining (Redstone) | 3 | 43 | 3 | 3 | 11 |
| Storage and backup (Corvane) | 3 | 45 | 3 | 0 | 7 |

Process connections (`JXR.conn`): for a process, the one before it in a journey ("fed by"), the one after ("hands off to"), processes that share a touchpoint, and the journeys it serves. They show in a process drawer.

Counts above are prototype facts, read from a build on 2026-10-20.

Maturity note: the generated drafts are workflow definitions only. They have numbers but no maturity record (see `docs/inventory/maturity-tour-map.md`, DC-33).

## 5. The views

- **Box cards and drawer.** Larger cards with an image that fades from grey to color on hover. Images are optional and come from `journey/manifest.json` (keys, most specific first: trace number, `tp:<touchpoint>`, `persona:<name>`, `default`; JM-06); the images are placeholders until supplied. The drawer shows the step, its metrics and the process behind it.
- **Experience curve.** A smooth monotone line through the experience scores (it never overshoots a real value) with faces and colored zones.
- **Avatars.** People, agents and robots look different; a dashed ring means proposed, not running (rule R23). A solid agent or robot means the linked process is automated in the sample; it is labeled "automated today, modeled", read from the process automation level (JM-02), and is never a live run.
- **Fulfillment tab.** Every step against its process, with its trace number.
- **Processes tab** (`R.procTab`). One row per process with its number, type (workflow or screen process), automation level, the number of journey steps it serves, the journeys, an experience score and a connection count. A row opens the designer; the Connections button opens the drawer. A second card lists "Steps with nothing behind them".
- **Personas tab.** Per persona (a main role such as Patient or Service desk agent): experience now and after the proposed fixes, a volume-by-feeling histogram, the steps that drag most, and how many people, agents and robots to add or release (agents and robots counted by the shared rule in section 7a). Experience **bars** replace the earlier speedometer dials in round 3.

## 6. Process map tab

`mod_r31_jzx.js`, section 1. For one selected journey, the processes behind its steps are laid out by stage as an SVG, with arrows for hand-offs between processes, a badge where a touchpoint is shared with another journey, and red dashed "No process yet" boxes. Clicking a process opens how it connects. Keyboard and screen-reader pass (JM-08): the map is a labeled group; each process is a focusable button (Tab or arrow keys move, Enter or Space opens it); gaps are labeled images; stage headings and arrows are hidden from assistive technology because every node names its stage and the hand-offs are listed as text below the map; after the pane redraws, focus returns to the same process. No test with an assistive-technology user is recorded.

## 7. Build list tab

`builds()` in `mod_r31_jzx.js`. A **build** is one agent or one robot to create. A step that the journey code classes as a candidate for an agent or a robot becomes a row; rows of the same kind that share a process are combined into one build card (counting rule in section 7a). For each build: kind, number (`B-0nn`), title, steps covered, hours a month covered, FTE released, capped per step (or hours given back for external roles such as a patient), risk out of 5, roles and owning team, and readiness ("Process exists" or "Needs a process first"). Each card has a proposed starting box: for a robot "Rule: no model; fails closed and alerts the owner"; for an agent, a tier, a confidence floor (0.75, or 0.85 where risk is 4 or more), an ask-first behavior, and a kill switch with a named owner and a different backup. No budgets and no prices.

Waves are a hypothesis: sorted by hours freed, wave 1 is risk 3 or lower, has a process, and is in the top 30%; wave 3 is risk 5, has no process, or is in the bottom 30%; the rest are wave 2.

| Scenario | Builds | Agents | Robots | Wave 1 / 2 / 3 | Steps covered | FTE released (modeled) |
|---|---|---|---|---|---|---|
| Atlantic Systems (core) | 4 | 2 | 2 | 1 / 2 / 1 | 4 | 0.6 |
| Healthcare | 40 | 18 | 22 | 9 / 18 / 13 | 78 | 127 |
| Mining | 10 | 5 | 5 | 2 / 5 / 3 | 16 | 21 |
| Storage and backup | 13 | 6 | 7 | 3 / 7 / 3 | 19 | 28 |

The table shows the default scope, Detailed journeys. The Healthcare figure was 345 FTE before the per-step cap (section 3a) and is now 127 (modeled); the sample volumes are invented and no step may release more than 2 FTE. Under All journeys the counts are: Atlantic Systems 12 builds (6 agents, 6 robots), 13.3 FTE; Healthcare 48 builds, 164 FTE; Mining 18 builds, 32 FTE; Storage and backup 21 builds, 45 FTE (all modeled).

**Access (JM-09).** The Build list is behind the permission section `section:journey.build`, checked with `PERM.can`. With no explicit rule, these roles see it: executive, portfolio lead, project manager, architect, change manager, platform admin. Other roles see a note saying so. This is a **simulated** permission, not a real access control; switching permission checks off on the Permissions screen shows the tab to everyone.

**Pilot scope panel.** "What next: a pilot scope" proposes up to three builds (wave 1 first, then any with a process behind them) and lists what is not in the pilot: steps with risk 4 or 5, steps with no process yet, anything outside the organization's own systems, and any price or contract. It is labeled **hypothesis**, its figures are **modeled**, and it carries no prices.

The tab also has a cross-reference CSV export from journey step to process step to build (`R.xrefJourney`).

## 7a. One counting rule and the scope switch (JM-04)

`JXR.countBuilds(rows)` is the one rule for proposed teammates. `JXR.buildKey(j, s, b, r)` makes the key: the kind (agent or robot) plus the build group, which is the shared process, else the shared touchpoint, else the stage. One key is one build. The Build list, the org chart, the dashed cards on the real org chart (`mod_r32_orgprop.js`) and the Personas tab all call it, so they agree.

Scope is one switch: **Detailed journeys** or **All journeys** (`JXR.scopeNow()`, `JXR.inScope(j)`). In Detailed scope the end-to-end journey is left out when detailed journeys exist, because it summarizes work they already cover. Detailed is the default whenever detailed journeys exist, which is all four samples. The switch appears on the Build list and the org chart. Counts in the sections above are for Detailed scope unless stated.

## 8. Org chart with agent assist

`mod_r31_jzorg.js`. Teams come from the owning team named on each box, roles from the personas, plus a branch for people outside the organization (Patient, Payer, Vendor, Regulator, Member, Customer IT admin, Referring clinician). Each role shows the recommended agents and robots for the steps it does, proposed versus running, FTE released and where to start. Filters, and a switch between "detailed journeys" and "all journeys", and a step drawer. One proposed teammate stands for one build, counted by `JXR.countBuilds` (section 7a), so the org chart and the Build list agree. The same screen is registered as `orgassist` and appears in search and the COO menu. For an industry tenant (healthcare, mining, storage) the org chart is built from the journey box owners by default (JM-01): each team is the owning team named on a step and each role is the persona doing it. The hand-typed grouping under functions is an optional view. Importing an HR org chart is an open decision and is not built. "Running" robots and agents are derived from the process automation level, shown as "automated today, modeled", and must never read as a live capability.

## 9. Recommendations on the real org chart

`mod_r32_orgprop.js` takes the same builds and draws each as a dashed card under the head of the team it would help, the way an open position is drawn on the existing org chart (`org_chart`). It maps box owners that are not org units to units (for example People office to People operations), falls back to the Executive office when no unit matches, and works for the Atlantic Systems scenario only, because the industry scenarios have no real org chart (they use the box-owner org chart in section 8). Core shows 4 such cards in Detailed scope. A toolbar switch ("Recommended agents and robots") turns them on. They are labeled proposed, not built.

## 10. Known limits carried from the handoff
- The org chart is built from box owners, not from imported HR data; whether to import an org is undecided.
- Shared touchpoints: 20 keys exist for the core (6), mining (6) and storage (8) samples (JM-05, DC-24), each used in at least two journeys of its own scenario, so overlays and the Process map "shared" count are no longer empty there.
- COO brief tabs follow the tenant (JM-07). Under an industry tenant, people, load and agent figures read that tenant's rows; where its pack has no data a tile says "No data" instead of showing Atlantic Systems figures, panels that can only be drawn from Atlantic Systems carry a "Atlantic Systems sample" label, and no Atlantic Systems person or agent name appears.
- The "Journey experience score" tile reads "x of 5", not a percentage (DC-01, CL-33).
- Demo view (DC-24): `JX.demoTabs(true)`, or a Showroom tour, hides Fulfillment, Processes, Personas and Building blocks (`JX.DEMO_HIDE`, tab positions 3, 4, 6, 9). The active tab always stays visible, and a "Show every tab" button restores the rest.
- Building blocks tab (DC-24): lists each journey building block with what it is, where it is used, the function that draws it and a live example from the current tenant, including the build card and the teammate count rule.
- No buyer has tested the Build list or the org chart.
