# Candidate extra demos: ratings from opening each screen

Read-only rating for backlog item DC-27. Each of the 13 candidate demos named in the Demo Center plan was checked by opening its screens in the built prototype (`python3 src/build.py --full`, headless Chromium, 2026-10-20, Meridian scenario, role CIO). Nothing was built. This page carries no status or priority; the backlog decides what, if anything, becomes a tour. A candidate that needs a screen that does not exist would be dropped and logged under DC-34; none of the 13 needs one.

All counts below are **prototype facts** measured on 2026-10-20. Every figure shown on the screens themselves is **modeled** sample data for the fictional Meridian Standards Foundation.

## How the rating works

| Rating | Meaning |
|---|---|
| A | Ready: the screens open clean, carry labeled metrics, and a 4 to 6 beat cut can be written from them today with only talk track work. |
| B | Usable: the screens exist and open clean, but the story needs a decision, a wording check or one more screen check before a cut is written. |
| C | Thin: the screens exist, but they do not yet carry the story on their own. |

Common to all 13: every screen opened with no page error; none is tenant-aware (`DATA.screenMode` is `core` for all), so each would run on the Meridian sample and be labeled that way under another tenant, exactly as the maturity tour is (DC-32, DC-36).

## Ratings

| # | Candidate | Screens it would use (id) | What opening them showed | Already in a Showroom cut | Rating |
|---|---|---|---|---|---|
| 1 | Outage | `itsm_mi` Run a major outage, `itsm_inc` Incidents, `obs_dash` Observability dashboards | War room for a degraded Standards Platform: elapsed time, people affected, an emergency change, empty comms roles blocking stakeholder updates; tabs for war room, communications, status page and post-incident review; 5 metric chips (time to restore 3.1 h against 3 h). Incidents adds 13 metric chips and the SLA timers. | No | A |
| 2 | Follow a dollar | `bst` Budget and spend traceability, `strat_exec` (its Trace detail view), `r18_spend` Enterprise spend | Approved against forecast by domain, funded dollars linked to a goal (97%), and in the trace $140K of orphan work against a target of $0. | Yes: COO cut beat "Follow the dollar", CFO lens | A |
| 3 | DOA and segregation | `bud_doa` Delegation of authority, `r15_iam` Identity and access (Separation of duties), `guard` (Fund guided view) | The approval matrix with "Try it: who approves this?" sample cases; one open segregation-of-duties conflict; the guardrail register shows which money caps are enforced and which are partial. | Yes: CLO lens, CISO lens, guardrail child "Fund" | A |
| 4 | Benefits | `bud_ben` Benefits realization | Planned against realized, register, checkpoints, payback; named benefits at risk or missed with modeled annual amounts; 3 metric chips. | Yes: CFO lens | B (amounts are modeled; a cut should say who signs off a realized benefit) |
| 5 | Board pack | `exe_board` Board pack, `r15d_evidence` Evidence room (Board pack tab) | Pack text cites records; the page itself labels what is simulated; the evidence room has a Board pack tab. | Yes: CEO lens | B (wording check: the pack must not read as a real board's material) |
| 6 | AI fleet and cost | `tower` AI Control Tower, `ai_runtime` Agent runtime, `r15d_agents` Agent registry | Fleet, lineage and kill switch tabs; spend against the daily cap (29%); 33 runs with their gates; owners and sponsors per agent; runtime labels its runs simulated. | Yes: CAIO lens, guardrail child "Deliver" | A |
| 7 | Citizen-app gate | `plat_gate` Citizen apps, `guard` (Build guided view), `adm_env` Environments and releases | Conformance gate, certification tiers and policies with 6 metric chips (reuse rate, duplicate rate); environments show packages blocked at a gate. | Yes: CIO lens, guardrail child "Build" | A |
| 8 | Data trust | `r18_access` Data access, `plat_data` Master data model | Access requests, review queue, active grants and who owns the data, with 3 metric chips; the data model lists entities and owners. No screen shows data quality or lineage of business data (lineage on the AI tower is model lineage). | No | C (the "trust" half has no screen; a cut today would be "data access and ownership" only) |
| 9 | Audit evidence | `r15d_evidence` Evidence room, `adm_audit` Audit and compliance | Read-only index of controls, approvals, audit trail, decisions and exports; "Verify the chain". Audit and compliance shows the line "SOC 2, ISO 27001 and the NIST AI Risk Management Framework have current evidence". | Yes: CISO and CLO lenses | B (that line reads close to a certification claim, which the hard rules forbid; reword on the screen or keep the beat on the evidence room) |
| 10 | Capacity and skills | `ppl_cap` Resource planning, `svc_skills` Skills and availability, `ppm_proj` Projects and teams (Skills tab) | Over capacity, bench and scenarios; 132 skills across people, contractors, providers and AI agents, 2 rota skills held by one person or none, 8 certificates expiring in 90 days. | Partly: CHRO lens uses `ppl_cap` | A |
| 11 | Delivery speed | `itom_dev` Environments and DORA, `ims` Master schedule, `itsm_rel` Releases | The four delivery measures with targets (deployment frequency 4.7 a week against 7, lead time 54 h against 24 h, change failure 10%, time to restore 5.3 h against 1 h), 11 metric chips; schedule variance on the master schedule. | No | A |
| 12 | Intake to portfolio | `port` Demand and priorities (Intake, Pipeline, Capacity vs demand), `bud_req` Budget requests | Intake form, scored pipeline, capacity overload by team; the budget decision funnel with 16 metric chips and real group routing on Approve. | Yes: COO cut "Demand", CFO lens approve beat (DC-37) | A |
| 13 | Agent Action | `orgdesign` Agent Action | Seven steps from the COO brief to adoption and impact, gaps with options, a roadmap; the screen labels its options modeled and its agents simulated. | Yes: COO lens | A |

## Reading the table

- Ready to cut next, not yet in any tour: **Outage** (1) and **Delivery speed** (11). Both fit the COO wedge (service health and delivery) and need only talk track work.
- **Capacity and skills** (10) is ready and would deepen the CHRO lens with `svc_skills`.
- **Audit evidence** (9) needs the wording on `adm_audit` checked against the no-certification rule before it is shown to anyone.
- **Data trust** (8) is the only thin candidate: a data quality or business lineage view does not exist, so under the Showroom rule it would be dropped and logged (DC-34) rather than built for a tour.

## Method notes

- Screens were opened with `go(id)` and read after 450 ms; "metric chips" counts `.fchip` and `[data-metric]` elements; text was searched for "simulated", "modeled" and "illustrative".
- Tab counts were not used for the rating because several screens draw extra buttons with the same roles.
- Not checked: other tenants (all 13 are Meridian-only today), mobile width, and how long each cut would run.
