# Rules and scripts (Round 17, Agent S)

Screen `r17s_rules` (alias `#rules`), under Platform and administration > Build and connect. Runtime: `window.RULES` (not the bare `RULES` array in data.js).
Files: `mod_r17s_a_engine.js` (engine), `_b_seed.js` (12 rules, 2 choice lists, library), `_c_ui.js` (Overview, Rules, Firing log, Library, Governance), `_d_edit.js` (Editor, Test), `_e_wire.js` (Feature Contract), `mod_r17s.css`.

## Model
One rule store holds five types: client (form), business (record store), notify (who, when, digest), uiaction (role-gated button), choice (drop-down values, registered in LISTS as `r17s_<id>`).
A rule is `{id, status draft|pending|active|retired, ver, liveVer, body, live, hist[], rt}`. The engine runs only `live`, the frozen approved snapshot. Edits create a new draft version; the live version keeps running until the new one is approved.
Body: name, type, entity, trigger, watch, event, schedule, order, stop, when (condition tree), script (one expression), then, else, scope (all|roles|groups), window, owner, backup, deliver, ui, choice.
Condition tree compiles to an expression in the approval-rule grammar (`urgency == 1 && users_affected >= 100`). The script is evaluated by an own parser: no eval, whitelisted functions only (len, lower, upper, trim, contains, startsWith, isBlank, round, floor, ceil, min, max, abs, number, concat, today, addDays, addHours, daysBetween, slaHours, hasRole, inGroup, iff, coalesce, changed, wasValue), `old.field` for the stored value, 600-step cap.
Activation: `R.requestActivation(id)` sends a request to the Platform governance board (a group, quorum 2, requester cannot decide). Rollback to an approved version is live at once; any other version returns as a draft. Kill switch, all or per type, audited. Loop guard: depth 4, cycle detection by stack key, 40 firings in 5 s suspends a rule (schedule sweeps are exempt), `R.cycles()` static check.
Persistence: ATLAS entities rule_definition, rule_action, rule_firing, choice_list through STORE, change-detected, begins after `R.ready`.

## Runtime hooks (shared files)
- `kit.js` line 54, 55: `submitForm` calls `RULES.beforeForm` (submit rules, can block or ask) and `RULES.afterForm` (after-save rules on the new record).
- `mod_r15f2_a_shell.js` line 205, 216: RECSHELL `applyEdit` calls `RULES.recEdit` (cell edit and before-save rules, can block or rewrite the value) and `RULES.recDone`.
- No other shared edits. The engine wraps global `openForm`, `refreshForm` and `STORE.put`, and adds delegated input, change and click listeners (field-change rules diff FORMST values).

## Seeded rules and how to trigger each (all owners and backups are named, different people)
| Rule | Owner / backup | Trigger it live |
|---|---|---|
| RUL-0101 require description, Critical and high impact | Tom Becker / Nia Brooks | Incident form (New incident): choose urgency Critical, set Users affected to 100 or more. Banner appears, Description becomes required. |
| RUL-0102 category narrows team (choice list RUL-0201) | Sam Patel / Jordan Lee | Incident form: pick a Category; the Assignment team drop-down offers only the matching teams. |
| RUL-0103 notify Service owners on new P1 | Tom Becker / Jordan Lee | Save an incident whose priority computes to 1 (Critical urgency, a role that may call it or an approval lead, large impact). A notice appears top right. |
| RUL-0104 block closing a change with open tasks | Nia Brooks / Priya Shah | Close form of CHG0312 (project PR3, 20 open tasks). Or Test tab, rule RUL-0104, record CHG0312, override new_state = Closed. |
| RUL-0105 hide cost without finance role | Avery Chen / Maya Ortiz | Open the change form as any persona except Finance (Avery Chen). Cost is absent. Switch to Finance: cost shows. |
| RUL-0106 set response due from priority SLA | Tom Becker / Nia Brooks | Save any incident with an empty due time; the due field is filled. |
| RUL-0107 confirm before retiring a CI | Sam Patel / Jordan Lee | Retire a CI from the CMDB retire form. A confirm dialog names the dependents. |
| RUL-0108 escalate approvals after 48 hours | Maya Ortiz / Avery Chen | Rules > Firing log > Run scheduled rules now. |
| RUL-0109 vendor needs security review (untested) | Rina Okafor / Jordan Lee | Edit owner or renewal of contract CT-106 (Apex Print) on its record page: the cell edit is blocked. CT-107 passes. |
| RUL-0110 Standard changes go to CAB digest | Nia Brooks / Tom Becker | Save a Standard change; a digest entry appears on Firing log. |
| RUL-0111 UI action: page service owners | Tom Becker / Sam Patel | A button on the incident form for roles service_desk, executive, change_manager, platform_admin, architect. |
| RUL-0112 raise event when flagged major (untested) | Jordan Lee / Sam Patel | Save an incident with Major flagged; event incident.major_declared is raised. |
| RUL-0201 teams by category, RUL-0202 CI retire reasons | Sam Patel / Tom Becker, Jordan Lee / Sam Patel | Choice lists; used by RUL-0102. |
Verified in a browser run: 0101, 0102, 0103, 0106 fire on a real incident submit; 0108 fires from the sweep; 0104, 0105, 0107, 0109 verified through the dry-run on real records.

## API
`RULES.register(body, meta)`, `.save(id, body, note)`, `.retire(id)`, `.rollback(id, ver)`, `.get(id)`, `.list()`, `.requestActivation(id)`, `.decide(approvalId, memberName, "approve"|"reject")`, `.kill(scope, on, reason)`, `.evaluate(opts)` / `.run(opts)` (entity, trigger, rec, old, dry), `.test({entity, trigger|"__save", ruleId, recId|rec, overrides, isNew, useDraft})` returns checked, fired, trace, diff, msgs, notifs, effects, blocked, confirm, errors (never commits; a test on one rule records it as tested), `.countMatches(body)`, `.expr.compile|validate|eval`, `.entities()`, `.fieldList(entity)`, `.stats()`, `.cycles()`.

## Limits
- Live entities (incident, change, ci, contract, vendor, approval, plus RECSHELL record pages) have field lists and hooks; other tables can hold rules but run only on STORE writes.
- Client effects are applied to forms bound with `bindForm` (itsm_inc, itsm_chg, itsm_out, itom_ret). Other forms need a binding.
- Scripts are one expression; there are no loops, assignments or calls to the network.
- The "Draft from a sentence" helper is a template matcher, labeled as such; it never activates a rule.
- Approvals for rule activation use an internal queue that routes to a group; it does not yet appear in the shared approvals inbox.
