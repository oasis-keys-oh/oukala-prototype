# Falconaire information architecture (PH-14)

One-page summary of the navigation proposal for the sidenav sprint (PH-14, with PR-06, CL-51, CL-41, PH-12, JM-13 and PR-18). It describes; status and priority live in the Product Backlog.

- `navigation-architecture.md`: principles, the menu for each of the 26 personas, merges and families, what is hidden, the contribution anchor, the scaling model for 1,000 and 9,000 screens, the migration plan and the open decisions.
- `screen-inventory.csv`: one row per registered screen (195), with current name, group, module, archetype, personas, objects, proposed area, sub-group, label, action, reason, R3 comparison, contribution anchor and tenant mode.
- Scripts that produced the facts: `tools/scratch/ia/` (`extract.js`, `demos.js`, `gen_csv.py`, `families.py`).

All counts are **prototype facts** measured on 2026-10-20 from the built prototype, except where a row says proposal. Sample data is fictional (Meridian Standards Foundation).

## The five most important changes

1. **Seven business areas, menus by role.** Strategy and value; Portfolio and delivery; Operations and service; Money and contracts; People and organization; Risk, control and AI; Transformation, always in that order. Each persona sees only its purview (at most 6 areas, 4 role pins first), plus My work, Ask or request, All screens, Showroom and the Build and admin gear. Visible menu entries drop from 138 to 92; 20 groups become 7 areas plus 4 fixed items.
2. **Build and admin leaves the business menu.** 48 screens (24 entries) move behind the gear at the bottom of the rail: Screen map, Feature contract, registries, platform maps, rules, permissions, tenancy and setup. Architects and admins see the gear; everyone reaches it through search and All screens, so the Screen map is never lost again.
3. **Duplicates become families, never deletions.** 36 view-switcher families (17 exist today, 19 new) and 10 merges into existing tabs. Every old id keeps working through the family switcher or an alias, and no Showroom beat lands on a merged or retired id.
4. **A contribution thread on every screen.** A thread from company objective to enterprise, group and team objective to the screen and to my own work, computed from the existing cascade (DC-12), work links and owners. My contribution shows modeled points in My work and on Home; work with no objective shows "Not linked to an objective".
5. **A taxonomy that registers itself and cannot sprawl.** `REG` gains metadata (area, sub-group, object types, archetype, personas, objective level, R3 comparison, menu role). New screens start as search only; the menu has a fixed budget of 7 areas, 7 sub-groups and 7 entries per sub-group; navigation moves from screens to object types, facets and intent (search and chat) as the platform grows to 1,000 and 9,000 screens.

## Counts (195 registered screens)

| Action | Screens |
|---|---|
| Keep as a menu entry (business areas, My work, Ask or request, Home, Showroom) | 68 |
| Merge into an existing screen as a view | 10 |
| Fold into a family (view switcher; 46 of these are already family views today) | 85 |
| Move to Build and admin (as an entry) | 24 |
| Hide from everyone except a named role (tenant test views, Platform admin) | 3 |
| Remove from the menu, search only | 2 |
| Candidate to retire, Omar decides (`trace`, `plat_data_old`, `loop`; ids keep redirecting) | 3 |
| **Total** | **195** |

Screens placed per area (all actions): Strategy and value 18; Portfolio and delivery 13; Operations and service 28; Money and contracts 19; People and organization 5; Risk, control and AI 30; Transformation 15; Build and admin 48; My work 10; Ask or request 4; Showroom 4; Home 1.

## Decisions waiting for Omar

The full list with options is in section (i) of `navigation-architecture.md`. The recommendations in short: Knowledge in Operations and service; Resilience in Risk, control and AI; the process library in Transformation; areas only at the top level with pins inside; accept all families and merges; retire `trace` and `plat_data_old` after CL-41 evidence; the gear for Architect and Platform admin only; contribution points display only, labeled modeled, until a people policy exists; generic names for the real product names in two tabs and a reworded audit line.
