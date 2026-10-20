# Experiential Showroom: design and contracts

Describes how the Showroom moves from guided tours to experiences (Omar, 2026-10-20). Status and priority live in the Product Backlog (DC-40 to DC-45). Guided tours (`SHOW.demos`) stay as rehearsal and backup.

## Principles
- **The buyer drives.** They hold the mouse, choose, and discover; nobody narrates.
- **One engine, two modes.** The same mission runs facilitated (a presenter coaches from a console in a second window) or self-serve (the product coaches by itself through chat hints and checkpoint cards).
- **Their company first.** Setup generates the buyer's own tenant in about five minutes; it falls back to the closest sample company (Meridian, Larkspur, Redstone, Corvane).
- **Consequences, not claims.** Every decision visibly moves budget, metrics, risk and the objective score (ripples). A claim chip appears only after the buyer has seen the thing it claims.
- **Existing screens only.** A mission plays on screens that exist (DC-34 still holds). New code is the engine, the console, the setup, the ripple trail and the leave-behind.
- **Honest.** Generated tenants, ripples, two seats and agent actions are labeled simulated; numbers keep their labels (modeled, hypothesis).

## Contracts

### Signals the engine listens to (no business module edits needed)
- `HOOKS.on("audit", entry)`: every audited user action (`{t, p, s, a, d}`: time, persona, screen, action, detail). 3,504 call sites already audit.
- `HOOKS.on("beforeGo" | "afterRender" | "afterOpenDrawer" | "tenantChange")`, `EVENTS.on(type, fn)` (mod_zevt), `ZLINK.chains`, `ROLLUP`, `APG.check`, `GUARD`.
- A module may add one-line `EVENTS.emit("exp.<thing>", data)` calls at action points only when an audit entry does not carry enough detail; report each one.

### `window.EXP` (mod_s_exp.js, stream exp-core)
- `EXP.register(mission)`; `EXP.list({role, tenant})`; `EXP.start(id, {tenant, role, mode: "facilitated" | "self"})`; `EXP.stop()`; `EXP.state()`; `EXP.on(event, fn)` with events `start`, `checkpoint`, `hint`, `ripple`, `success`, `stuck`, `end`.
- Mission shape:
  ```
  { id, title, role: ["cfo", ...] | "any", tenants: "any" | ["health", ...],
    brief: "the job in one sentence", goal: "what done looks like", clock: seconds,
    setup(ctx),                         // seed the situation (records, inbox items) through existing APIs, labeled simulated
    checkpoints: [{ id, when(ev, ctx), hint: { after: seconds, text }, claim }],  // when() reads audit entries or EVENTS
    success(ctx), ripples: ["budget", "metric", "risk", "objective"], debrief(ctx) }
  ```
- Ripples: `EXP.ripple(record)` computes before and after along `ZLINK.chains` and `ROLLUP` and shows a cause and effect trail (record, line, project, objective score).
- Leave-behind: `EXP.story()` returns a printable one-page story of the session (what they did, what moved, what it would mean at their company), labeled simulated.
- Engagement signal (DC-26): `U.store` key `exp.sessions` (this browser only): missions started, finished, time, stuck points.

### Facilitator console (stream exp-core)
- Opens with `?exp=console` in a second window; talks to the buyer window over `BroadcastChannel("falconaire-exp")`.
- Messages: `{type: "state", mission, checkpoint, screen, elapsed}` (buyer to console); `{type: "nudge" | "claim" | "recover" | "skip"}` (console to buyer).
- Shows: where the buyer is, the next good nudge, the claim to land when a checkpoint fires, a recover action when stuck for 40 seconds.

### Two seats (stream exp-world)
- `BroadcastChannel("falconaire-seats")`: each window picks a role; audited actions in one window are mirrored as simulated arrivals in the other (inbox item, notification, changed number). Same machine only; labeled simulated.

### Bring your company (stream exp-world)
- `PACKGEN.fromAnswers({industry, size, pain, name})` builds a tenant pack in the browser with the same checks as `tools/generators/gen_pack.py` (links, owner and different backup, metric definitions, six maturity dimensions, no real or banned names, no collision with Meridian people) and registers it with `DATA.pack` and `DATA.addTenant`. Falls back to the closest sample when an answer is missing.

### Break it sandbox (stream exp-world)
- Extends the guardrail playground (`GUARD.attempt`) into free play: every attempt runs the real check and explains the control that held.

## Starter missions (exp-core writes them; each on existing screens)
1. CFO: an invoice is over budget before the steering meeting; find why and fix it (inv, bst, Trace this).
2. COO: a journey step is failing customers; find the process, fix it with a robot or agent, see the objective move (ppl_jrny, Build list, studio).
3. CISO: an agent asks for access to restricted records; decide, and see what the guardrails do (guard, r15_iam, tower).
4. CIO: a change collides with a release the week of a board meeting; resolve it (itsm_chg, itsm_rel, exe_dash).
5. Any role, Your Monday: the day's inbox and decisions with consequences (inbox, flw_appr, the role's pins).

## Showroom rules (approved by Omar 2026-10-20; now in CLAUDE.md)
- An experience is a mission on existing screens; a mission with no existing feature is dropped and logged (DC-34).
- Each mission has a one-sentence brief, a goal, a clock of 10 minutes or less, at least one ripple the buyer sees, and claims that appear only after the buyer has seen the thing claimed.
- Every simulated element is labeled; `EXP.lint()` checks briefs, clocks, labels and that every screen a mission names exists; `tools/tests/exp.js` runs it.
- Guided tours keep their rules (`SHOW.lint`, 1,200-second cap) as rehearsal and backup.
