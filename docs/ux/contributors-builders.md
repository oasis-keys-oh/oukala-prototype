# Contributor and builder experience evaluation

Backlog item PR-31. This paper describes what a walk of the prototype found; it carries no status or priority of its own. Severities below are the evaluator's proposal (P0 blocks the task, P1 hurts often, P2 polish); Omar sets backlog priority. Fixes are proposals for the session that implements them.

## How this was done

- **Build and driver.** Local build of `main` at `d4f979b` (`python3 src/build.py --full --out build_out`), opened from `build_out/full.html` in headless Chromium through Playwright. Network calls were blocked, so nothing left the machine. Scripts are in `tools/scratch/ux/` (`walk.js`, `kb.js`, `trap2.js`, `a11y.js`, `tasks.js`, `builds.js`, `jbuild.js`, `tok.js`, `lint.js`, `sum.js`).
- **Personas.** Set with `NAVX.persona.set(key)`: Employee (`emp`), New hire (`newhire`), Vendor guest (`guest`), Architect (`arch`), Platform admin (`admin`). For the JM-13 purview rule: department head = Service desk lead (`ops`, Tom Becker, "Department head of Service desk, 7 direct reports"); individual contributor = Project manager (`pm`, Priya Shah, "Your own builds"). Both were read back from `JXR.purview()`.
- **Views.** Every task screen in light (1440 x 900), dark (operating system set to dark, theme left on "Match device") and phone (400 x 860). 139 screenshots, about 10 MB, so they stay uncommitted in `tools/scratch/ux/shots/<persona>/<screen>-<light|dark|phone>.jpg`. Rerun `node tools/scratch/ux/walk.js` to regenerate them.
- **Keyboard.** Tab order captured from page load (90 stops), the search palette, the rail flyouts, the Bring your company dialog and table rows, with no mouse input.
- **Accessibility measures (prototype facts).** Computed text contrast per text node against the nearest opaque background, focus ring presence, accessible names, labels, target sizes, heading order, running animations with reduced motion, and overflow at 720 px wide (1440 at 200 percent zoom).
- **Skills and heuristics applied.** impeccable (critique mode and its anti-pattern bans), critique (Nielsen's ten heuristics, cognitive load, persona red flags), audit (accessibility, theming, responsive, anti-patterns), clarify (labels, empty states, errors), adapt (phone at 400 px), delight (first-run moments), and design:accessibility-review (WCAG 2.2 AA). The impeccable detector (`npx impeccable detect --fast src`) ran on the source. There is no `.impeccable.md` design context file yet, so CLAUDE.md, R34 to R38 and `docs/ia/navigation-architecture.md` stood in as the design brief.

Numbers in this paper are **prototype facts** measured on 2026-10-21 unless marked otherwise. Contrast ratios are computed, not estimated.

## What works across personas

- Reduced motion is honored: 0 running animations with `prefers-reduced-motion: reduce` on Home.
- 200 percent zoom (720 px wide) gives no page-level horizontal scroll on the portal.
- At 400 px every control measured is at least 24 x 24 px (WCAG 2.5.8): 0 undersized targets on all phone views walked.
- The rail uses native `summary` elements and marks the current page with `aria-current="page"`. KPI tiles carry a group role and a spoken label.
- The JM-13 purview bar on the Journey maps Build list tab is clear and honest: it names the scope, the reason, the viewer and "Showing 3 of 4 builds", and says the permission is simulated.
- Guest permission denial is well written: "Invoice approval is not available to Vendor guest. Vendors only reach the portal, knowledge answers and shared items", with "How this was decided".
- Builder screens follow R34: a lens note, a process strip, measures first, then lists. Every measure has a target, a trend and a formula chip.
- Simulated things are labeled: "Sample data, simulated", "Tenant isolation simulated", "Simulated" on Experiences, "modeled" on contribution points.

## Contributors

### Employee (Casey Rowan is shown, see UX-C-01)

Tasks tried: first visit to Home; find help (Find an answer); order a laptop; report a problem; see my own work and contribution (Home, My approvals, Build list); phone; keyboard-only walk from load.

What worked: "For your role" pins on Home are the four right doors (Report a problem or order something, Find an answer, Order guides, Training). Ordering a laptop works with the mouse: catalog card, form, "Allowed: Ordering for yourself. Normal approvals apply." Search finds the portal from the words "report a problem".

### New hire (shown as Jamie Okoro; the permission model says Rosa Delgado)

Tasks tried: first visit, My first week, finding help, ordering, training, phone.

What worked: My first week lists accounts, laptop, role, clearance and workplace in plain words, and "Who to ask" names a manager, a buddy, IT help and Ask Falconaire. That is the right first-run content.

### Vendor guest

Tasks tried: first visit, the portal, Find an answer, reaching a restricted screen (`inv`, `scr_map`), search.

What worked: restricted screens show a clear denial with the reason, no All screens entry, no Showroom.

### Department head (Service desk lead, Tom Becker) and individual contributor (Project manager, Priya Shah)

Tasks tried: Home, Build list (both versions), My approvals, the team's own screens (`itsm_inc`, `org_chart`, `ppm_proj`).

What worked: on Journey maps, Build list tab, the department head sees "Your department: Service desk ... Showing 3 of 4 builds" and the contributor sees "Your own builds ... Showing 1 of 4 builds". The rule reads as intended. My approvals for Priya Shah says "1 approvals are waiting on you as Priya Shah (Project manager, Release manager, Budget owner)".

### Contributor findings

**UX-C-01. P0. The Employee persona is the CIO.** Screens `home`, `flw_appr`, rail identity card.
Evidence: `shots/employee/home-light.jpg` says "Welcome, Casey." with "Viewing as Casey Rowan (Employee)"; `shots/employee/flw_appr-light.jpg` says "16 approvals are waiting on you as Casey Rowan (CIO, Portfolio board, Executive sponsor)". `JXR.purview()` for `emp` returns user Casey Rowan, role "Chief information officer". The Vendor guest rail card also reads "Casey Rowan, Vendor guest". The New hire is "Jamie Okoro" on Home and in the rail but "Rosa Delgado" in the permission model.
Violates: Nielsen 2 (match with the real world), R38 (contributors see their own work), the purview rule JM-13 (an employee inherits an executive's approvals and builds).
Fix: one persona-to-person table. In `src/mod_r16g_a_perm.js` line 36, `PERSONA_USER.emp` is "Casey Rowan"; give `emp`, `guest` and `newhire` their own fictional people from Atlantic Logistics' directory and make `R15F3.PERSONA_USER` (synced at line 419) read from the same table instead of keeping its own. The rail card, Home greeting, My approvals and the purview all follow from that one change.

**UX-C-02. P0. "Report a problem" has no path.** Screen `svc_portal`.
Evidence: the screen is titled "Report a problem or order something" but its first heading is "Order something", and its 16 items are all orders (laptop, license, access, phone, AV support, onboarding and so on). No card, tab or button on the page says broken, problem, issue or incident (`tools/scratch/ux/chk.js`). The search palette does offer "Create an incident: Log something that is broken" as a quick action, so the capability exists but is hidden from the screen that promises it.
Violates: information scent (navigation principle 6), Nielsen 2 and 6, R35 (every feature reachable).
Fix: in `src/mod_svc.js` (`svc_portal`), put a "Something is broken" choice beside "Order something" at the top, opening the same incident form the quick action uses, with three plain fields (what, since when, how bad) and a follow-up in My requests.

**UX-C-03. P1. The vendor guest sees internal history, favorites and actions.** Screens `home`, search palette.
Evidence: `shots/vendor-guest/task-search-invoice.jpg`: Recently viewed "Vendors and contracts", "Plan and approve changes", "Risk"; Favorites "My approvals", "Dashboards", "Budgets"; Quick actions "Create an incident", "Raise a change", "Open a problem record", "Open my approvals". Home shows a "My approvals" button and the VibeCheck build button to a read-only guest.
Violates: least privilege as a design principle, Nielsen 5 (error prevention), the guest row of the navigation architecture ("only the request portal and items shared with the vendor").
Fix: in `src/mod_s_search.js` and `src/mod_nav.js`, filter recents, favorites and quick actions through `PERM.can(...)` for the active persona and start a guest with empty history; hide VibeCheck and My approvals when `NAVX.purview().readonly`.

**UX-C-04. P1. A $48,000 change approval pops up for everyone.** All screens, `src/mod_r17n_notify.js`.
Evidence: the card "CHG0312 Raise Standards Portal hosting tier (Northwind, +$48,000 per year). Waiting on Change advisory board" with **Approve** and **Review** appears for the Employee, the Vendor guest, the New hire and both builders (`shots/employee/kb-search-tab-loop.jpg`, `shots/architect/scr_map-light.jpg`). It was still on screen after 8 seconds, covers table columns (Retrofit "Gate" column) and overlaps the chat and formula buttons. On the phone it covers the page header (`shots/architect/scr_map-phone.jpg`).
Violates: Nielsen 5 (a one-click approve of money from a transient card), WCAG 2.4.11 Focus Not Obscured (the card sits over focusable content), R38.
Fix: show the card only to members of the approving group (`PERM.approverOf`), never offer Approve on a toast (open the approval instead), dock it in the inbox after a few seconds, and keep it clear of the bottom-right controls.

**UX-C-05. P1. Contributors see executive counts on badges.** Phone bottom bar, top bar.
Evidence: Employee on the phone: "Approvals, 16 waiting", bell "9+", top bar "Needs you: 131 items, 24 urgent" (`kb.js emp phone`, `shots/employee/home-phone.jpg`). New hire rail: "My approvals 16".
Violates: navigation principle 9 (one badge, only for items waiting on the viewer), R38.
Fix: badges read the active person's queue only (follows from UX-C-01), and the New hire and Vendor guest show no approvals badge at all.

**UX-C-06. P1. The executive lens "CIO" chip is on every screen for every persona.** All screens.
Evidence: "Lens CIO" plus "Why am I seeing this?" sit at the top right of every page for Employee, New hire and Vendor guest. Its menu reads "See it through another executive's eyes" with nine executive roles. On the phone the chip covers the objective strip text (`shots/employee/home-phone.jpg`: "Te... d:").
Violates: R38 (contributors see their own work), Nielsen 8 (aesthetic and minimalist design), WCAG 1.4.13 and 2.4.11 on the phone overlap.
Fix: in `src/mod_r18e_lens.js`, show the lens chip only to personas with an executive or manager scope; for contributors keep "Why am I seeing this?" only.

**UX-C-07. P1. Home's three numbers are not the contributor's own work, and two disagree.** Screen `home`.
Evidence: Employee hero: "Open orders 5, placed by or for you", "Open requests 0, in the service portal", "Service levels met 94%, Watch, target at least 95%". The portal says "You have 5 requests in progress". A Vendor guest sees "Service levels met 94%" too.
Violates: Nielsen 1 and 4 (status and consistency), R38, R29 (a number should say what it measures).
Fix: in `src/mod_r21_home.js`, give contributor personas three own-work numbers (my open requests, my approvals or tasks due, my training due) and use one count for requests and orders.

**UX-C-08. P1. "My contribution" is a dead end for a contributor.** Screens `home`, `flw_appr`.
Evidence: "No team objective is linked to your team yet [modeled]. Viewing as Casey Rowan (Employee). No team in the cascade. PMO has no team objective in the cascade. Not linked to an objective. No projects, hours or key results are recorded for you in this tenant." There is no action.
Violates: clarify (empty states should explain and offer the next step), delight (first-run moment), navigation principle 11 (purpose and progress).
Fix: in `src/mod_s_contrib.js`, when nothing links, show what the person did do (requests closed, training done, articles rated) and one action: "Ask your manager to link your team to an objective". Move the "modeled" chip out of the heading.

**UX-C-09. P1. My first week is a manager's view, and it shows to people who are not new.** Screen `r15d_firstweek`.
Evidence: `shots/new-hire/r15d_firstweek-light.jpg`: a picker "New hire: Jamie Okoro (Wed, Oct 14)", "Jamie Okoro starts Wed, Oct 14, in 8 days", other new hires listed (Lena Fischer, Marcus Webb). The New hire's My work also lists My approvals with a badge of 16, and My first week twice (pinned and under "Start here"). The Employee also sees My first week under My work (`shots/employee/flw_appr-light.jpg`).
Violates: R38, Nielsen 2, navigation principle 8 (no duplicate entries).
Fix: in `src/mod_r15d_front.js`, open on the signed-in new hire with no picker (the picker stays for managers and HR), list it once, and hide it from personas without the `new_hire` role.

**UX-C-10. P1. Find an answer starts as a service desk analyst.** Screen `kcs_ask`.
Evidence: `shots/employee/kcs_ask-light.jpg`: "Ask as: Service desk analyst" by default; suggested questions are "How do I fail over the portal?", "What is the break-glass procedure for Entra ID admin roles?" and "Who approves a discount rate change?". The Employee's Home suggests "How do I reset my password?".
Violates: recognition over recall (principle 4), R38, R32 (a real product name, Entra ID, in visible text).
Fix: in `src/mod_kcs.js`, default "Ask as" to the active persona, draw the suggested questions from that persona's Home suggestions, and replace the product name with a generic one ("identity provider admin roles").

**UX-C-11. P1. At 400 px the portal and several screens clip content instead of wrapping.** Screens `svc_portal`, `flw_appr`, `itsm_inc`, `ppm_proj`, `r18_builds`, `org_chart`.
Evidence: `shots/employee/svc_portal-phone.jpg`: the title is cut at "Report a problem or order someth", the intro is cut mid-line, "Someone else" is cut. Measured: the hero section and objective chip end at 478 px on a 400 px screen; the process strip (`.mpp`) ends at 606 px on `flw_appr` and `itsm_inc`; Build list mode buttons end at 640 px; org chart tabs at 664 px. The page reports no horizontal scroll, so the smoke test passes while text is hidden.
Violates: R36 (text is never squeezed, no horizontal scroll at 400 px), WCAG 1.4.10 Reflow.
Fix: in the portal stylesheet (`src/mod_svc.js` with its CSS) and the process strip, use `minmax(0,1fr)` and `overflow-wrap:anywhere` on the hero and strip; make the strip and tab rows scroll inside their own container with a visible edge. Add a check to the phone smoke test for elements whose right edge passes the viewport.

**UX-C-12. P1. Floating controls cover content on the phone.** All phone views.
Evidence: the formula button sits over cards and the bottom bar; the Lens chip covers the objective strip; the change toast covers the page title (`shots/architect/flw_design-phone.jpg`).
Violates: WCAG 2.4.11 Focus Not Obscured (Minimum), PH-10 (close controls never over content), adapt (thumb zone).
Fix: in `src/mod_r17o1_shell.js`, reserve a bottom safe area above the tab bar for one floating control, and move the formula and lens controls into the More sheet on phones.

**UX-C-13. P1. Dark mode by device setting uses light-mode ink colors.** All screens, `src/mod_r27_prefs.css`.
Evidence: with the device in dark mode and the theme on "Match device" (the default), measured contrast on the near-black page: muted pills 2.68 to 1 ("Not started", "None", "internal"), info pills 2.97 to 1 ("modeled", "Sandbox"), formula chips 2.56 to 1 ("Contribution points"), amber notes 2.15 to 1 ("4 certified", "1 behind baseline"), gap labels 2.31 to 1 ("No owner"), order guide labels 2.81 to 1. See `shots/employee/home-dark.jpg` and `shots/platform-admin/plat_gate-dark.jpg`, where KPI sublabels nearly vanish. Cause: the Round 27 contrast fixes are scoped with `:root:not([data-theme=dark])`, which also matches when no theme is set and the device is dark.
Violates: WCAG 1.4.3 Contrast (Minimum), R36 (dark checked on every build), audit theming.
Fix: scope those rules to light only: `:root[data-theme=light] ...` plus `@media (prefers-color-scheme: light){:root:not([data-theme=dark]) ...}`. One file, no new colors.

**UX-C-14. P1. The skip link comes after the content and stays off screen.** All screens.
Evidence: from load, the first 38 Tab stops are inside the page; "Skip to main content" is stop 46 and, when focused, stays at y = -72 px (`shots/employee/a11y-skiplink-focused.jpg`). Three 1 x 1 px inputs ("Collapse sidebar", "Clarity lens", "Ask Falconaire") take focus with nothing visible.
Violates: WCAG 2.4.1 Bypass Blocks, 2.4.3 Focus Order, 2.4.7 Focus Visible.
Fix: make the skip link the first focusable element in the body and slide it into view on `:focus-visible` (`src/kit.js` or `src/mod_r15c_core.js`, wherever it is rendered); set `tabindex="-1"` on the three hidden toggle inputs and expose their labels as buttons.

**UX-C-15. P1. Tab cannot leave the top bar search.** Top bar, `src/mod_nav.js` or `src/mod_s_search.js` (`#nxPalIn`).
Evidence: after the rail, Tab lands on the search box and stays there for every further press (stops 62 to 90 are all "Search"). Only Escape releases it, and nothing tells the user that. The input also reports `aria-expanded="true"` while the palette is closed.
Violates: WCAG 2.1.2 No Keyboard Trap (no documented way out), 4.1.2 Name, Role, Value.
Fix: let Tab move focus on when the palette is closed (and close it and move on when open); set `aria-expanded` from the real open state.

**UX-C-16. P1. Many controls share the name "Open".** Screen `home`, order lists.
Evidence: Home's open orders list gives a screen reader five buttons named "Open", two "Order guides" buttons, and person chips that are `span role=button` ("Zoe Hart", "Elise Park").
Violates: WCAG 2.4.6 Headings and Labels, 2.4.4 Link Purpose, 4.1.2.
Fix: name each button for its record ("Open ORD-1042 Role or location change") through `aria-label`; make person chips real buttons.

**UX-C-17. P1. Two "Build list" screens apply different purview rules.** Screens `r18_builds` (Transformation) and `ppl_jrny` Build list tab.
Evidence: on `r18_builds` every persona, from Employee to Architect, sees "Builds 13, 391 people use them", "Modeled net value a month $77,193" and an "Approve citizen-built apps" tab; there is no purview bar (`tools/scratch/ux/builds.js`). On Journey maps, Build list tab, the same department head sees "Showing 3 of 4 builds" and the contributor "1 of 4" (`tools/scratch/ux/jbuild.js`, `shots/dept-head-ops/journey-build-tab.jpg`).
Violates: JM-13 (department heads see their department, contributors only their own), Nielsen 4 (consistency), R38.
Fix: in `src/mod_r18c_builds.js`, filter through `JXR.buildsFor(JXR.purview())` and show the same purview bar; scope the headline numbers to the purview with "of 13 across the company" as the drill-down; reconcile 13 versus 4 builds or name them differently.

**UX-C-18. P2. The Ask or request flyout lists entries twice and its badge is unclear.** Rail.
Evidence: "Find an answer" and "Report a problem or order something" each appear twice in the flyout (`shots/employee/kcs_ask-light.jpg`); the "6" next to Ask or request counts entries, not items waiting.
Violates: navigation principles 8 and 9.
Fix: in `src/mod_nav.js`, list each entry once; show numbers only for items waiting on the viewer.

**UX-C-19. P2. The objective breadcrumb speaks planning jargon to contributors.** Top bar.
Evidence: "Company: Trusted standards, published f... > O-001 Modernize standards pub... > Group Publish standards fa... > O-001.2 Earn the Standards Platform..." truncated on every screen.
Violates: R37 (plain English), R38.
Fix: for contributors show one line, "This work supports: Publish standards faster", with the full chain on hover or tap.

**UX-C-20. P2. The portal stacks two headers and drops the rail.** Screen `svc_portal`.
Evidence: `shots/employee/svc_portal-light.jpg`: a portal bar (Portal, My requests, Knowledge, First week, Open the console) above the app top bar, two search boxes, and no rail.
Violates: Nielsen 4, navigation principle 5 (stable placement).
Fix: in `src/mod_svc.js`, render the portal tabs as a view switcher inside the page and keep the app shell.

**UX-C-21. P2. Real product names in contributor content.** Screens `svc_portal`, `kcs_ask`, `r15d_firstweek`.
Evidence: "enrolled in Intune", "Shared mailbox or Teams channel", "Entra ID account created before the start date", "break-glass procedure for Entra ID admin roles".
Violates: R32 (generic names in visible text).
Fix: "enrolled in device management", "Shared mailbox or team channel", "identity account".

**UX-C-22. P2. Headings skip a level.** Screens `home`, `kcs_ask`, `ppl_train`, `r18_builds`, `flw_appr`.
Evidence: an `h3` follows the page `h1` with no `h2` ("No team objective is linked to...", "Answer groundedness").
Violates: WCAG 1.3.1 Info and Relationships (advisory), screen reader navigation by heading.
Fix: make card titles `h2` under the page `h1` in the shared card helpers (`src/kit.js`).

**UX-C-23. P2. Small copy breaks.** Screens `home`, `svc_portal`, `r15d_firstweek`.
Evidence: the "modeled" chip sits inside the contribution heading and leaves an orphan comma on the next line for the Architect ("1.7 points of the company score [modeled] , through..."); "Jamie Okoro : first week" has a space before the colon; "Price, approvals and delivery follow you." does not say what follows; "1 approvals are waiting".
Violates: clarify.
Fix: chip after the sentence, no space before colons, "We show the price, the approvers and the delivery date as you fill in the form", plural rules.

**UX-C-24. P2. Two favorite stars on the phone Build list.** Screen `r18_builds` at 400 px.
Evidence: `shots/employee/r18_builds-phone.jpg`: two star buttons stacked under the lens chip.
Violates: Nielsen 4.
Fix: render the favorite control once in the phone shell.

**UX-C-25. P2. The purview bar leads with mechanics.** Journey maps Build list tab.
Evidence: one paragraph with the scope, the reason, the viewer, the rule for all three scopes and the simulation note.
Violates: clarify (primary message first), R38.
Fix: headline "Your department: Service desk, 3 of 4 builds"; move the rule and simulation note behind "Why".

## Builders

### Architect (Jordan Lee)

Tasks tried: the Build and admin gear, Screen map, Workflow designer, Registries, Feature contract and its "Run on a feature", Retrofit matrix, Approve citizen-built apps, Platform maps, phone and dark.

What worked: the gear sits after the business areas with sub-groups (Build, Automate, Data and integration, Access and tenants, Run the platform, Product), so Screen map and Product log are two clicks away. Screen map explains the job in one sentence ("Mark each screen Wedge, Keep, Defer or Cut, then export the list") with a legend. Feature contract names the three places the rules run (design, publish, runtime).

### Platform admin (Sam Patel)

Tasks tried: Tenancy, Permissions, Fields forms and themes, Registries, Screen map, Showroom with Bring your company, Approve citizen-built apps.

What worked: Tenancy states the model in one sentence and labels the simulation ("Tenant isolation simulated"). Bring your company asks four questions, says "no answer leaves this device", and validates the required name.

### Builder findings

**UX-B-01. P1. The same universe has four different counts.** Screens `scr_map`, `plat_retrofit`, `plat_contract`.
Evidence: Screen map "registers 196 screens; 101 are hidden from every menu"; Retrofit "0 of 196 screens" over "210 rows"; Feature contract "118 of 219 screens, modules and citizen apps"; the navigation paper measured 195 screens and 57 hidden.
Violates: Nielsen 4, R29 (label what a number counts).
Fix: one count source (the Screen map data in `src/mod_r32_scrmap_a_data.js`), and each screen says what it counts ("196 screens plus 14 citizen apps") with a link to the definition.

**UX-B-02. P1. The Retrofit matrix uses internal ids and gives no first step.** Screen `plat_retrofit`.
Evidence: `shots/architect/plat_retrofit-light.jpg`: tiles "ct_reuse met", "ct_tenant met", "ct_people met"; facets "kind", "6 Reuse", "7 Tenant", "8 People" with unexplained numbers. "0 of 196 screens pass" with no suggested order. Rows are `tr tabindex=0` with no role or button, so a screen reader hears a row with no action.
Violates: R37 (plain English), clarify, WCAG 4.1.2, Nielsen 10.
Fix: in `src/mod_plat_contract.js` (`plat_retrofit`), label "Reuse check", "Tenant check", "People check"; add "Start here: the 5 screens with the most traffic and the fewest gaps"; give each row a named "Open evidence" button.

**UX-B-03. P2. Gate screens repeat their numbers and use a bare glyph.** Screens `plat_contract`, `scr_map`, `plat_gate`.
Evidence: Feature contract shows 80 percent, 118 and 238 in metric cards and again in the stat row below; Screen map shows 0 percent confirmed and 196 twice; formula chips render as "ƒƒ" with no words (read aloud as "f f").
Violates: impeccable (do not repeat information), Nielsen 8, R28 (a mark with meaning needs a legend or tooltip).
Fix: keep one row of measures per screen; give formula chips an accessible name ("Formula for contract coverage").

**UX-B-04. P1. Tenancy shows a different person from the one signed in.** Screen `tn_admin`.
Evidence: `shots/platform-admin/tn_admin-light.jpg`: the rail says Sam Patel, Platform admin; "Who you are" says "Casey Rowan, Chief information officer (demo presenter)". The tile "Screens reading through DATA" exposes an API name.
Violates: Nielsen 1 and 2, R37.
Fix: in `src/mod_s_tenant.js`, default "Who you are" to the active persona's person (same table as UX-C-01) and label the tile "Screens that follow the active tenant".

**UX-B-05. P1. The Bring your company dialog does not hold focus and its fields are unlabeled for assistive technology.** Screen `showroom`, `src/mod_s_exp_company.js`.
Evidence: after opening, focus stays on the trigger and Tab walks the blurred page behind ("Atlantic Logistics", "Larkspur Health System", "Start with a presenter"...); after Escape, focus does not return to "Bring your company". The four fields share `name="fk"` and are not tied to their visible labels. Submitting empty shows "Needed so the record tells its story" but sets no `aria-invalid`. Example text in Industry ("A regional health system") and People ("5000") looks like entered values over the painted background (`shots/platform-admin/task-byc-1.jpg`).
Violates: WCAG 2.4.3 Focus Order, 2.4.11 Focus Not Obscured, 1.3.1, 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 4.1.2.
Fix: move focus to the first field on open, keep Tab inside, return focus on close; connect labels with `for`/`id`; set `aria-invalid` and `aria-describedby` on error with "Enter a company name (a made-up one is fine)"; put fields on a solid surface and show examples as hints below the field, not as values.

**UX-B-06. P2. Showroom shows two companies selected.** Screen `showroom`.
Evidence: `shots/platform-admin/showroom-light.jpg`: "Bring your company" and "Atlantic Logistics" both have the selected fill.
Violates: Nielsen 1.
Fix: in `src/mod_s_showroom.js`, style Bring your company as an action button, not a choice in the company group.

**UX-B-07. P2. Owner chips change between renders.** Screens `scr_map`, `plat_contract`.
Evidence: Screen map owner is Rina Okafor for the Architect and Sam Patel on the guest's denial page; Feature contract is Rina Okafor and becomes Carla Reyes after "Run on a feature".
Violates: Nielsen 4, the owner contract (CL-55, `ownerChip`).
Fix: read the owner once from the screen registry in `src/mod_s_owner.js`, not from the tab that rendered last.

**UX-B-08. P2. The gear is heavier than designed and carries an unlabeled mark.** Rail.
Evidence: Build and admin shows 25 entries for the Architect and 32 for the Platform admin (the navigation paper proposes 24). Every entry carries an anchor glyph with no label. VibeCheck appears both as a Transformation entry and as the large rail button.
Violates: navigation principles 1 and 3, R28.
Fix: in `src/mod_nav.js`, fold family members into their family entry, explain the anchor in "How to read this menu" or drop it from the rail, list VibeCheck once.

**UX-B-09. P2. Approve citizen-built apps nests three levels of tabs.** Screen `plat_gate`.
Evidence: `shots/architect/task-gate.jpg`: the family switcher (Build list, Approve citizen-built apps), then seven inner tabs (Overview, Apps, New app, Conformance gate, Certification tiers, Policies, Core services). A "TOGAF" chip has no explanation.
Violates: Hick and Hyman (principle 3), R37 (acronyms defined on first use).
Fix: make Conformance gate the default for builders, fold Policies and Core services into one tab, and expand TOGAF on first use.

**UX-B-10. P2. The Workflow designer opens on measures and clips at 1440.** Screen `flw_design`.
Evidence: `shots/architect/flw_design-light-top.jpg`: four metric cards and four stat tiles come before the canvas; the standard chip "BPMN 2.0 and DM..." is cut at the right edge on a 1440 px screen; subtitles are formulas ("Σ agent + robot steps ÷ work steps"). On the phone there is a "Draw a process" button but no note that drawing needs a larger screen.
Violates: R34 read too literally for a tool screen, R36 (no clipping), R37.
Fix: when arriving from "Draw a process", open on the canvas with the measures one tab away; wrap the chip row; write subtitles in words; on phones say "Drawing works on a tablet or larger".

**UX-B-11. P2. Builder filters mix native selects with pill controls.** Screens `scr_map`, `plat_retrofit`.
Evidence: "Group by", "Decision" and "Show" are unstyled native selects beside styled pills and search fields.
Violates: Nielsen 4, impeccable (consistent controls).
Fix: use the shared filter control from the kit.

**UX-B-12. P2. Lint and gate results are invisible in the product.** Screens `showroom`, `plat_contract`.
Evidence: `EXP.lint()` and `SHOW.lint()` both return no problems in the page, but no screen shows that; a builder only learns it from `tools/tests`. The Feature contract Enforcement tab describes where checks run, not their latest result.
Violates: Nielsen 1 (visibility of system status).
Fix: add a "Checks" line to Showroom and to the Feature contract Enforcement tab: "Experience lint: 0 problems, checked just now", with the failing item listed when there is one.

**UX-B-13. P2. Screen map renders everything at once.** Screen `scr_map`.
Evidence: 1,166 controls and 5,861 words on one page, the same on the phone.
Violates: cognitive load (critique), progressive disclosure (principle 7).
Fix: collapse bands by default, show undecided screens first, and page the table.

**UX-B-14. P2. Older stylesheets carry patterns the design rules ban.** `src/*.css`.
Evidence: the impeccable detector on `src` found 205 matches: 131 side-stripe borders, 31 accent borders on rounded cards, 39 layout-property transitions, 3 bounce easings and 1 overused font, mostly in older modules (`mod_budget.css`, `mod_chat.css`, `mod_exec.css`, `mod_devops.css`, `mod_itom.css`).
Violates: impeccable absolute bans (side-stripe borders), motion guidance (animate transform and opacity only).
Fix: a CSS lint rule in `tools/lint` that fails new side stripes and layout transitions, then a sweep per module when it is next touched.

## Counts (prototype facts, this walk)

| Group | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Contributors (UX-C) | 2 | 15 | 8 | 25 |
| Builders (UX-B) | 0 | 4 | 10 | 14 |
| **All** | **2** | **19** | **18** | **39** |

## The ten highest-value fixes, grouped by module

**`src/mod_r16g_a_perm.js` (and the `R15F3.PERSONA_USER` copy it syncs)**
1. One fictional person per persona so the Employee, New hire and Vendor guest are no longer the CIO. This one table fixes the greeting, approvals, badges, purview and Tenancy identity (UX-C-01, UX-C-05, UX-C-09 in part, UX-B-04).

**`src/mod_svc.js`**
2. Add the "Something is broken" path to the portal, beside "Order something", using the incident quick action that search already has (UX-C-02). Keep the app shell and fix the 400 px clipping of the hero while there (UX-C-11, UX-C-20).

**`src/mod_r17n_notify.js`**
3. Show the change approval card only to approvers, never with an Approve button on a toast, and dock it after a few seconds (UX-C-04).

**`src/mod_r27_prefs.css`**
4. Scope the Round 27 contrast fixes to light mode only so "Match device" dark mode reaches 4.5 to 1 (UX-C-13).

**`src/mod_nav.js` and `src/mod_s_search.js`**
5. Let Tab leave the search box, report `aria-expanded` truthfully, and filter recents, favorites and quick actions by permission for the guest (UX-C-15, UX-C-03).

**`src/kit.js` or `src/mod_r15c_core.js` (skip link and hidden toggles)**
6. Make "Skip to main content" the first Tab stop and visible on focus; take the three 1 x 1 px inputs out of the Tab order (UX-C-14).

**`src/mod_r18e_lens.js` and `src/mod_r21_home.js`**
7. Hide the executive lens from contributors and give contributor Homes three own-work numbers (UX-C-06, UX-C-07).

**`src/mod_r18c_builds.js`**
8. Apply the JM-13 purview to the Transformation Build list with the same purview bar as the Journey maps tab (UX-C-17).

**`src/mod_s_exp_company.js`**
9. Give the Bring your company dialog real focus handling, labels and error states (UX-B-05).

**`src/mod_plat_contract.js` and `src/mod_r32_scrmap_a_data.js`**
10. One count of screens across Screen map, Retrofit matrix and Feature contract, plain labels instead of `ct_*` ids, and a "Start here" list on the Retrofit matrix (UX-B-01, UX-B-02).

## Limits of this walk

- Headless Chromium only; no VoiceOver or NVDA session. Screen reader findings come from names, roles and states read from the DOM.
- Contrast is computed against the nearest opaque background; text over the painted hero images and glass panels was checked by eye only.
- The rail and screens were walked on the Atlantic Logistics sample tenant. Generated tenants were not walked.
