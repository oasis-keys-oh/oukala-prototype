# Journey maps: round 3 contents

Documents backlog item JM-11 (round 3 of the journey work, which the Project doc `claude/journey-maps-round2.md` covers only through round 2). It describes what the round 3 modules do, so a reader does not have to open the code. It carries no status or priority. Source of the history: the journey handoff of 2026-10-19 (rounds 2 and 3; commit 0ff1e9a for round 3), checked against the code in `src/` and against the built prototype on 2026-10-19.

All figures are **prototype facts** about the sample data unless labeled. Every hour, FTE and cost figure inside the journey screens is a **modeled** sample value: a robot is assumed to free 80% of a step's hours, an agent 60%, and 140 hours is one full-time equivalent (FTE) a month. Wave order is a **hypothesis**. Nothing described here is live: agents and robots shown as recommended are proposed, not built. All organizations and people are fictional (Meridian Standards Foundation and the Larkspur, Redstone and Corvane samples).

## 1. Where round 3 sits

Experience journeys is the screen `ppl_jrny` ("Journey maps"). A journey is a list of stages; a stage holds boxes (steps); a box carries who does it, minutes, volume, cost, experience score (1 to 5), pain, the owning team, the system and the processes behind it. The screen has nine tabs: Dashboard, Map, Overlay, Fulfillment, Processes, Process map, Personas, Org chart, Build list. Round 3 added or changed the last four of those and the data that feeds them.

| Module | What it does |
|---|---|
| `src/mod_r31_jx.js` | Data layer: trace numbers, strategy metrics per journey, avatars, draft processes behind each box, and how processes connect |
| `src/mod_r31_jxr.js` | Views: experience curve, box cards and drawer, process drawer, Fulfillment, Processes and Personas tabs |
| `src/mod_r31_jzx.js` | Process map tab, experience bars on Personas, Build list tab, and the cross-reference export |
| `src/mod_r31_jzorg.js` | Org chart with agent assist (a tab, and its own screen `orgassist`) |
| `src/mod_r32_orgprop.js` | Draws the Build list's recommendations on the real org chart screen (`org_chart`) as dashed cards |
| `src/mod_r31_jnav.js` | Back and Forward inside Experience journeys (round 2) |
| `src/mod_r30_jov.js` | Overlay tab (round 2): ranks shared touchpoints by friction hours, strategy target or staff capacity |

Styles: `src/mod_r31_jx.css`, `src/mod_r31_jzx.css`. Shared globals: `JYX` (journey internals and `JYX.api`), `JXR` (views and helpers), `JOV` (overlay), `SCN` (demo scenario).

## 2. Trace numbers

Every box gets a trace number made of the journey id and a sequence, for example `JH3-07`. The number is stamped once (`stamp()`, `JXR.tn`) and then shown on every tab, so the same step is recognizable everywhere. Where a box is served by a process step, the chip also shows the process number, for example `JH3-07 -> P-014.3`. Process, step and build numbers (`P-014`, `P-014.3`, `B-012`) come from `src/mod_r32_num_b.js` (backlog DC-02). Both kinds are searchable and linkable.

## 3. Strategy metrics and the Overlay

Each journey has one outcome metric with a sample baseline and target (`KV` in `mod_r31_jx.js`), for example JY5 "Time from need to published standard" 540 to 420 days (modeled), JH5 "Discharge before noon" 18% to 38% (modeled). For each box the code computes the share of the journey's target gap that fixing that step could reach (`potentials`, `JXR.slice`), weighting by minutes, cost or friction hours depending on the metric, and by how much of the box a recommended agent or robot could remove. This is used to rank steps on the Overlay tab, which has three rank-by switches: friction hours, strategy targets, staff capacity. Friction hours are hours a month multiplied by how badly the step feels (1 counts in full, 5 counts for nothing).

## 4. Processes behind every step (draft generation)

`generate()` in `mod_r31_jx.js` makes sure every box has a process behind it, except three on purpose. For each scenario it leaves exactly three loud, painful unlinked steps so the red "No process yet" flag stays visible in demos. For all other unlinked boxes it groups them by shared touchpoint (or by stage), and builds a draft workflow definition (`wf_gx_...`, marked `drafted: "journey-map"`): receive the request, one step per box (an approval step when the title says approve or authorize), record the outcome. Each draft is registered with the workflow designer (`WFX`), so it opens like any other process.

| Scenario | Journeys | Boxes | Boxes with no process | Boxes with more than one process | Draft workflows generated |
|---|---|---|---|---|---|
| Meridian (core) | 5 | 48 | 3 | 2 | 11 |
| Healthcare (Larkspur) | 10 | 135 | 3 | 0 | 37 |
| Mining (Redstone) | 3 | 43 | 3 | 3 | 10 |
| Storage and backup (Corvane) | 3 | 45 | 3 | 0 | 6 |

Process connections (`JXR.conn`): for a process, the one before it in a journey ("fed by"), the one after ("hands off to"), processes that share a touchpoint, and the journeys it serves. They show in a process drawer.

Maturity note: the generated drafts are workflow definitions only. They have numbers but no maturity record (see `docs/inventory/maturity-tour-map.md`, DC-33).

## 5. The views

- **Box cards and drawer.** Larger cards with an image that fades from grey to color on hover. Images are optional and come from `journey/manifest.json` (keys: trace number, `tp:<touchpoint>`, `persona:<name>`, `default`); the images are placeholders until supplied. The drawer shows the step, its metrics and the process behind it.
- **Experience curve.** A smooth monotone line through the experience scores (it never overshoots a real value) with faces and colored zones.
- **Avatars.** People, agents and robots look different; a dashed ring means proposed, not running (rule R23).
- **Fulfillment tab.** Every step against its process, with its trace number.
- **Processes tab** (`R.procTab`). One row per process with its number, type (workflow or screen process), automation level, the number of journey steps it serves, the journeys, an experience score and a connection count. A row opens the designer; the Connections button opens the drawer. A second card lists "Steps with nothing behind them".
- **Personas tab.** Per persona (a main role such as Patient or Service desk agent): experience now and after the proposed fixes, a volume-by-feeling histogram, the steps that drag most, and how many people, agents and robots to add or release. Experience **bars** replace the earlier speedometer dials in round 3.

## 6. Process map tab

`mod_r31_jzx.js`, section 1. For one selected journey, the processes behind its steps are laid out by stage as an SVG, with arrows for hand-offs between processes, a badge where a touchpoint is shared with another journey, and red dashed "No process yet" boxes. Clicking a process opens how it connects. Not yet tested for screen-reader access (the SVG is labeled but has not had an accessibility pass).

## 7. Build list tab

`builds()` in `mod_r31_jzx.js`. A **build** is one agent or one robot to create. A step that the journey code classes as a candidate for an agent or a robot becomes a row; rows that share a process are combined into one build card. For each build: kind, number (`B-0nn`), title, steps covered, hours a month covered, FTE released (or hours given back for external roles such as a patient), risk out of 5, roles and owning team, and readiness ("Process exists" or "Needs a process first"). Each card has a proposed starting box: for a robot "Rule: no model; fails closed and alerts the owner"; for an agent, a tier, a confidence floor (0.75, or 0.85 where risk is 4 or more), an ask-first behavior, and a kill switch with a named owner and a different backup. No budgets and no prices.

Waves are a hypothesis: sorted by hours freed, wave 1 is risk 3 or lower, has a process, and is in the top 30%; wave 3 is risk 5, has no process, or is in the bottom 30%; the rest are wave 2.

| Scenario | Builds | Agents | Robots | Wave 1 / 2 / 3 | Steps covered | FTE released (modeled) |
|---|---|---|---|---|---|---|
| Meridian (core) | 4 | 2 | 2 | 1 / 2 / 1 | 4 | 1 |
| Healthcare | 40 | 18 | 22 | 8 / 19 / 13 | 78 | 345 |
| Mining | 10 | 5 | 5 | 2 / 5 / 3 | 16 | 31 |
| Storage and backup | 13 | 6 | 7 | 3 / 7 / 3 | 19 | 45 |

The Healthcare FTE figure is large because the sample volumes are invented; it is on the journey handoff's list of things to cap or re-check before anyone sees it. The tab also has a cross-reference CSV export from journey step to process step to build (`R.xrefJourney`).

## 8. Org chart with agent assist

`mod_r31_jzorg.js`. Teams come from the owning team named on each box, roles from the personas, plus a branch for people outside the organization (Patient, Payer, Vendor, Regulator, Member, Customer IT admin, Referring clinician). Each role shows the recommended agents and robots for the steps it does, proposed versus running, FTE released and where to start. Filters, and a switch between "detailed journeys" and "all journeys", and a step drawer. One proposed teammate stands for one recommended step, so this view counts steps while the Build list combines steps per process; the two counts can differ by design (open point on the handoff). The same screen is registered as `orgassist` and appears in search and the COO menu. "Running" robots are derived from the process automation level in the prototype and must never read as a live capability.

## 9. Recommendations on the real org chart

`mod_r32_orgprop.js` takes the same builds and draws each as a dashed card under the head of the team it would help, the way an open position is drawn on the existing org chart (`org_chart`). It maps box owners that are not org units to units (for example People office to People operations), falls back to the Executive office when no unit matches, and works for the Meridian scenario only, because the industry scenarios have no real org chart. Core currently shows 4 such cards. A toolbar switch ("Recommended agents and robots") turns them on. They are labeled proposed, not built.

## 10. Known limits carried from the handoff
- The org chart is built from box owners, not from imported HR data; whether to import an org is undecided.
- Shared touchpoints are thin or absent for Meridian, Mining and Storage, so overlays and the Process map "shared" count are small there.
- COO brief tabs are Meridian-only under industry scenarios.
- The "Journey experience score" tile reads like a percentage (2.91%) where it should read as a score of 5 (backlog DC-01, CL-33).
- No buyer has tested the Build list or the org chart.
