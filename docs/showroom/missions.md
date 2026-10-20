# Starter missions and engine notes (DC-40, DC-41, DC-42)

Describes what `src/mod_s_exp*.js` implement against `docs/showroom/experiences.md`. Status and priority live in the Product Backlog.

## Missions (each 180 seconds or less: one decision, one ripple, one success)
| Id | Role | Screens | Runs on | Checkpoints | Ripple |
|---|---|---|---|---|---|
| `cfo_invoice` | CFO | inv, bst | core (inv is core-only) | open the flagged invoice; follow it to the goal (Where it connects or Trace); hold, reject or approve | invoice > budget line variance > project > objective scores (`ZLINK.chains.invoiceToProject`, modeled sensitivity) |
| `coo_journey` | COO | ppl_jrny, studio (neutral) | the chosen company | find a red journey box; Build the fix in VibeCheck; studio builds a process with a robot or agent step | journey step > key result (a quarter of the gap) > objective score (`ROLLUP.att`, `ROLLUP.wmean`) |
| `ciso_agent` | CISO | r15_iam, guard | core | find the seeded agent request AR-0031; deny or approve (acting as the security administrator, audited); a guardrail attempt refused | request > restricted records exposed > trust objective |
| `cio_clash` | CIO | itsm_rel, itsm_chg | core | open the release with a hard clash; move the release or the change; clash detection shows none | release clashes > project > key result > objective score |
| `monday` | any | inbox, flw_appr | core | open the inbox; make one decision | item > waiting count (fact) > median wait (modeled) > the role's objective |

Seeding: `cfo_invoice` clears the invoice decision; `ciso_agent` adds a simulated request to the Identity and access state and restores it on stop; `monday` calls `INBOX.simNow()`. Nothing else is written.

## Engine notes
- Signals: `HOOKS` audit (read one tick later so the connectivity sandbox's dry-run entries, which it removes, never count), beforeGo, afterRender, afterOpenDrawer, tenantChange; `EVENTS.on("*")` (subscribed on first start, mod_zevt loads later); `ROUTER` click; a one-second timeout chain (no interval).
- A mission whose named screens (other than `neutral` ones) are core-only runs on the core sample; the card says so and the leave-behind speaks to the chosen company.
- `EXP.lint(list?)` checks a one-sentence brief, a goal, clock at most 180 s, labels, a ripple, hints and labeled claims, and that every named screen is registered.
- Test hooks: `EXP.STUCK` (default 40) and `EXP.hintScale` (default 1) shorten timings in `tools/tests/exp.js` only.
- Console messages beyond the contract: `{type:"hello"}` (console asks for state), `{type:"start", id, role, tenant}` and `{type:"stop"}`. The console window never acts as a buyer.
- No `EVENTS.emit` line was added to any business module; the engine itself emits `exp.<event>` on the bus.
