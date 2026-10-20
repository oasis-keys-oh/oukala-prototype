# Falconaire prototype: project guide for Claude

Read this first in any session that touches the Falconaire (Enterprise Work Platform) prototype. It is short on purpose. The rules live in `docs/PLATFORM_RULES.md` once CL-50 copies them here; until then in the Project doc `claude/PLATFORM_RULES.md`.

## What this is
A database-free, single-page prototype of Falconaire, an AI-native work platform for enterprise IT and operations leaders. Live at https://oukala-prototype.netlify.app (Netlify project `oukala-prototype`). The product name is **Falconaire** (`src/brand.json`). It is not trademark-cleared (backlog BR-01): do not use it in anything external, and do not file domains or marks.

## Hard rules (every session)
- Fictional sample data only. Sample customer Meridian Standards Foundation, sample executive Casey Rowan. Never put the owner's real name, employer, clients or any real organization's data or brand in a product asset.
- Label every number: prototype fact, modeled, hypothesis or simulated. Never present a simulated capability (connectors, AI runs, sync, isolation) as live.
- No price points until a priced bill of materials exists. No certification claims (SOC 2 and similar), only stated plans.
- No em dashes in user-visible strings. No banned external names (Core, Fabric, Fabric Enterprise, Trellis) in visible text.
- Steps are human, robot or agent. "Automatic" is retired as a step kind.

## One list of work
The **Product Backlog** is the only list of work. Source of truth: the vault note `Product Backlog` at `OH-Vault/10-Projects/Enterprise Work Platform/Development/Product Backlog.md`. The Project doc `claude/product-backlog.md` is a read-only mirror, refreshed at the end of any session that changes the vault note. Never edit the mirror except its Inbox when the vault is unreachable.
- Add the row first, then do the work. IDs are permanent: never renumber, reuse or delete.
- Omar sets priority. `*` after a priority means proposed by Claude. Never promote your own item to P0 and never change a priority Omar set.
- Handoffs, plans, specs and reviews cite IDs and carry no status or priority of their own.
- Questions and decisions live in `Open Questions.md`, not in the backlog.
- Start of session: invoke the Ariane skill to read vault context. End of session: update the rows you touched, write a handoff (newest entry on top of `Handoff.md`) citing IDs.

## Who owns what
- Claude Code: src/, tools/, build, tests, commits, pushes. Only it pushes to main.
- Cowork: GTM assets, Project docs, vault GTM and Decisions notes. Never edits src/ or pushes.
- Both: add the backlog row first, cite IDs, and re-read Product Backlog.md and Handoff.md right before editing them.
- Parallel Claude Code sessions: one git worktree each (git worktree add ../wt-<ID> -b <ID>-short-name).

## Build, test, ship
- Build: `python3 src/build.py --out build_out`. Output: `index.html`, `oukala-js.js`, `full.html` (single file used by tests).
- Tests: `tools/tests/run.sh` builds then runs `smoke.js` (every registered screen), `tabs.js` (4 scenarios x 9 journey tabs) and `showroom.js` (tours). Needs Node, Playwright and a Chromium (`CHROMIUM_PATH` if Playwright's own is not installed). All must pass before any push.
- Ship: a push to `main` auto-deploys the public site (standing decision PH-09). Keep commit trailers `Co-Authored-By` and `Claude-Session`. Commit only your own files: other sessions may leave uncommitted changes in the working tree; do not sweep them into your commit.
- Working tree notes: the " 2" duplicate files are quarantined until 2026-11-17 (CL-07); do not delete them earlier without Omar's say-so.

## Code conventions
- Shared foundation is `src/platform.js` (`U`, `HOOKS`, `DATA`, `STEPMODE`, `TRIGGERS`, `CHATADDR`, `ownerChip`); contracts, file territories and build waves are in `docs/ARCHITECTURE.md`. New modules are `mod_s_<domain>`. Tests: `npm test`.
- Each feature is a module pair `mod_<name>.js` and `.css` in `src/`, wrapped in an IIFE, with a unique CSS prefix. `build.py` concatenates core files, then modules in filename order. New modules sort after `mod_r32_*`. Do not name new files by build round when a domain name works.
- Register a screen with `REG(id,name,suite,icon,render)`; add search and menu with `NAVX.add`. Read data through accessors, not module-level captures (tenant rules R16 to R20, CL-55).
- Tokens only in CSS (`var(--...)`); no new hex colors, no new `!important`, one z-index from the token list once CL-23 lands. Close controls sit top right, never over content (PH-10).
- Brand assets live in `src/assets/brand/`. The imagery is AI-generated: provenance applies (BR-05) before any external use.
- After adding screens, rerun `python3 src/gen_scrmap.py src` and rebuild so the Screen map stays current.

## Showroom
The demo space is **Showroom**. Demos are **experiential**: the buyer drives and the presenter coaches (Omar, 2026-10-20). Design and contracts: `docs/showroom/experiences.md` (`window.EXP`, missions, ripples, facilitator console, self-serve links, Bring your company, Two seats, Break it).
- An experience is a mission on existing screens; a mission that needs a feature that does not exist is dropped and logged, never built as a new business screen (DC-34).
- Each mission has a one-sentence brief, a goal, a clock of 10 minutes or less, at least one ripple the buyer sees (budget, metric, risk or objective moving), and claims that appear only after the buyer has seen the thing claimed.
- One engine serves facilitated sessions (console in a second window, `?exp=console`) and self-serve links; the buyer starts with their own company and falls back to the closest sample company.
- Every simulated element is labeled (generated tenants, ripples, two seats, agent actions). `EXP.lint()` checks briefs, clocks, labels and that every named screen exists; `tools/tests/exp.js` runs it.
- Guided tours (`window.SHOW`, `SHOW.demos`) stay as rehearsal and backup and keep their rules: a beat has a point of 12 words or fewer, seconds, two spoken sentences, one interaction and a claim chip, and every cut stays under 1,200 seconds (`SHOW.lint()`, `showroom.js`). Deep link: `?showroom=coo&beat=4`.

## Where things live
- Vault: `OH-Vault/10-Projects/Enterprise Work Platform/` (GTM and Development folders, Decisions, Handoff, Open Questions, Product Backlog).
- Project docs on claude.ai ("Falconaire - Development"): build state, specs, rules, reviews. They describe; the backlog tracks.
- Prototype repo: `oasis-keys-oh/oukala-prototype`. Rollback tag before cleanup: `pre-cleanup-baseline`.
