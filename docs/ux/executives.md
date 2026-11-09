# Executive experience evaluation

Backlog item PR-31. This paper evaluates what each executive persona sees on a normal Monday and proposes fixes. It describes; it carries no status or priority of its own beyond the severity of each finding. Fixes become backlog rows, cited by the finding ids below (UX-E-01 to UX-E-34).

## Scope and method

**Personas walked (10):** CEO (`ceo`), CIO (`exec`, Casey Rowan, the default), COO (`coo`), CFO (`cfo`), CCO (`cco`), CHRO (`chro`), CISO (`ciso`), CAIO (`caio`), General counsel (`clo`), Board member, read only (`board`).

**For each persona:** the default menu (purview rail), Home and the role's top tasks on the Atlantic Systems sample; Home and three top tasks again on one industry company (switched with `TENANT.switch`, the same call the tenant badge makes); light theme, dark theme and 400 px width; the persona's Showroom lens on Executive lenses (`r18_lens`); every experiential mission listed for the role (`EXP.list({role})`) plus Your Monday, started in self-serve mode; four plain-language searches per role; keyboard order from a fresh load; the contribution thread and the My contribution card.

**Industry company per persona:** Larkspur Health System for CEO, CFO and CHRO; Redstone Resources for COO, CAIO and Board member; Corvane Data Protection for CIO, CCO, CISO and General counsel.

**Judged against:** `CLAUDE.md` hard rules, `docs/PLATFORM_RULES.md` (R34 to R38), `docs/ia/navigation-architecture.md` (principles 1 to 12, section b menus, section f contribution anchor) and `docs/showroom/experiences.md`.

**Skills applied:** `impeccable` (critique mode, anti-pattern rules), `critique` (Nielsen heuristics, cognitive load, persona red flags), `audit` (accessibility, performance, theming, responsive, anti-patterns), `clarify` (copy), `layout` (hierarchy, density, rhythm), `typeset` (type scale, sizes, families) and `design:accessibility-review` (WCAG 2.1 AA). The deterministic `impeccable detect` scanner ran over six rendered executive screens.

**Tools (prototype facts, measured 2026-10-21 on commit `d4f979b`, local `python3 src/build.py --full` build, headless Chromium 1440 x 900):**
- `tools/scratch/ux/walk_exec.js` walks all ten personas and writes `tools/scratch/ux/shots/<persona>/*.jpg` and `data.json` (per-screen word counts, control counts, targets under 24 px, text under 12 px, sampled contrast, unnamed controls, em dashes, Atlantic Systems leaks, thread and card text).
- `tools/scratch/ux/probe2.js` to `probe6.js` check keyboard order, banners, board read-only actions, chat answers, the mission card, the Showroom role picker, rail signals and Home structure. Output in `tools/scratch/ux/shots/_probe*/`.
- `tools/scratch/ux/dumpdom.js` saves rendered markup to `tools/scratch/ux/dom/` for `npx impeccable detect --json --fast`.
- `tools/scratch/ux/summ.js` prints the walk data.

**Screenshots are not committed.** They total about 26 MB (over the 5 MB limit) and stay in `tools/scratch/ux/shots/`. Rerun `node tools/scratch/ux/walk_exec.js` after `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` and a full build to regenerate them. Evidence paths below are relative to `tools/scratch/ux/shots/`.

**Labels.** Counts, timings and quoted text are prototype facts from the walk. Severity, scores and fixes are proposals. All people and companies named are fictional sample data.

**Severity.** P0 blocks the task. P1 hurts often. P2 polish.

**Limits.** The contrast sampler walks up to the first opaque background; it cannot see glass, gradient or image backgrounds, so its flags on pills over the hero ("Why am I seeing this?", 1.34:1) and on table headers (2.79:1) are false positives once checked by eye and by computed color (header `rgb(67,88,96)` on white, about 7:1). Only findings confirmed in a screenshot are reported. No screen reader was run; names and roles were read from the accessibility tree.

## Scorecards

### Design health (Nielsen, executive journeys)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Tenant banner is honest, but Home keeps Atlantic Systems numbers under another company (UX-E-01); rail counts disagree (UX-E-08) |
| 2 | Match between system and the real world | 2 | Builder records and raw ids reach executives ("(screen decision)", `screen:plat_proc`); undefined acronyms (UX-E-12, UX-E-25, UX-E-29) |
| 3 | User control and freedom | 3 | Missions can be minimized or closed; denial page offers Request access |
| 4 | Consistency and standards | 2 | Pins listed twice, three nav rows on one screen, two favorite stars (UX-E-07, UX-E-13, UX-E-17) |
| 5 | Error prevention | 2 | One-click Approve in a pop-up banner; read-only Board member offered Edit and Generate (UX-E-11, UX-E-24) |
| 6 | Recognition rather than recall | 3 | Role pins on Home ("For your role") are one click from every task |
| 7 | Flexibility and efficiency | 2 | Ctrl K works for nouns, fails for questions (UX-E-12) |
| 8 | Aesthetic and minimalist design | 1 | Strategy to execution: 3,281 words and 447 controls on one screen (UX-E-13) |
| 9 | Error recovery | 3 | Access denial explains the rule and offers next steps |
| 10 | Help and documentation | 3 | "Why am I seeing this?", "How to read this menu", mission hints |
| | **Total** | **23 / 40** | **Acceptable: the product logic is strong, the surface is crowded** |

Cognitive load checklist (critique skill): 4 of 8 fail on the executive screens (more than four choices at a decision point, repeated information, competing visual signals, no single primary action on dense screens). That is the critical band.

### Technical audit (audit skill)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | 0 unnamed controls on 49 screens walked; focus ring on every one of 30 tab stops; skip link is first in tab order. Gaps: text under 12 px (UX-E-15), a selected tab that looks disabled (UX-E-30), the rail's No owner dot named only in a tooltip (UX-E-08) |
| 2 | Performance | 2 | One 15.9 MB page; 6.1 to 10.6 seconds to an interactive Home headless on a local file; 37 width transitions (layout animation) |
| 3 | Responsive | 3 | No horizontal scroll at 400 px on all 30 screens checked; overlaps in the top bar (UX-E-17) |
| 4 | Theming | 3 | Dark theme renders every screen checked with no sampled contrast failure; tokens hold |
| 5 | Anti-patterns | 1 | About 91 side-stripe border rules, 14 top-accent borders on rounded cards, 3 bounce easings, a purple-to-blue gradient button and a violet chat dock (UX-E-16) |
| | **Total** | **12 / 20** | **Acceptable, significant work on anti-patterns and density** |

## What works for every executive

- **Role-specific Home headline.** Eight of ten personas land on three numbers that are theirs (the CFO sees forecast against approved, days to collect dues, days to close the books; the CISO sees risks above appetite, access reviews complete, controls with evidence), each with a status word and a target. Time to the first useful number is the page load.
- **One click to the top tasks.** "For your role" on Home lists the four role pins; every pin opened its screen (except UX-E-25).
- **Screens open with a sentence, not a chart.** Approve invoices opens with "Lumen billed $62,900 for milestone 3, which is not accepted yet... paying now overpays by $22,000"; Identity and access opens with "1 segregation-of-duties conflicts, 3 live permission-set grants, 2 access requests waiting". R34 hero and lens note are present on all 49 screens.
- **Honesty labels are mostly in place.** Tenant-aware screens say "Sample data, simulated" and "Tenant isolation simulated"; screens that are not tenant-aware say so in a banner; contribution points carry "modeled" and the formula chip names formula, owner and target.
- **Accessibility basics.** Every interactive element has a name; focus rings are visible; dark theme and 400 px both work without horizontal scroll; the 400 px More menu keeps the same areas in the same order.
- **Missions are well briefed.** Each mission card states the job, what done looks like and what is simulated, with three numbered steps and a 3:00 clock; a hint arrives at 20 seconds.

## Findings that touch every executive

Each finding: id, severity, screen id, evidence, rule or heuristic, fix.

**UX-E-01 (P1). Home stays on Atlantic Systems after a tenant switch.** Screen `home` (also `r18_lens`, `tower`, `inv`, `org_chart`, `ppl_perf`, `r15_iam`, `r15d_evidence`). Evidence: `ceo/ten_health_home.jpg`: under Larkspur Health System the CEO hero still shows Member renewal 92% and Days to publish a standard 41 days; the eyebrow is hard-coded "Atlantic Systems" in `mod_r21_home.js`; the banner reads "This screen is not tenant-aware yet and still shows the Atlantic Systems sample data" on Home for all ten personas. Violates: R16 to R20 tenant rules, visibility of status, the "their company first" Showroom principle. Fix: make Home read its hero KPIs and eyebrow from the active tenant (`DATA.get('metrics')`, `DATA.tenantInfo().org`) in `mod_r21_home.js`; each industry pack already carries owned metrics with targets. Then the pinned screens in the list above, in that order.

**UX-E-02 (P1). "What should I look at first?" has no answer.** Screen `home`. Evidence: `_probe6/first_ceo.jpg`, `_probe6/data.json`: for CEO, CFO and Board member the hero button sends "What should I look at first today?" and the chat replies "I have nothing in your history for today." Violates: time to first useful answer, the habit loop cue (navigation principle 10). Fix: answer from what the page already knows: the off-target hero KPI, the top item in Decisions waiting for you and the first role pin, each with Take me there. Home button in `mod_r21_home.js`, intent in `mod_chat.js` or `mod_r15d_ask.js`.

**UX-E-03 (P1). What waits on me is buried.** Screen `home`. Evidence: `_probe6/data.json`: section tops on the CEO Home are For your role 614 px, My contribution 713 px, What you care about 1,623 px, Decisions waiting for you 2,200 px, of a 3,915 px page; the Board member's sits at 2,354 px. Violates: navigation principle 10 (Home always shows waiting on me, my contribution, what changed in a fixed place), R34 (what needs attention before lists), layout squint test. Fix: order Home as hero, Decisions waiting for you (top three with Review), My contribution as a one-line strip that opens the full card, then the rest. `mod_r21_home.js`, `mod_s_contrib.js`.

**UX-E-04 (P1). My contribution tells executives they have no team.** Screen `home`, `flw_appr`. Evidence: `exec/core_home_contrib.jpg`: headline "No team objective is linked to your team yet" for CEO, CIO, CCO, CHRO, CISO, CAIO and Board member, while the same card lists O-004 Trusted AI with the CIO as owner and O-002 and O-003 with the CFO; the card is about 900 px tall for that message. Copy defects: "yet modeled ." (chip before a lone period), "1 of your items are not linked", a line that starts with ", through". Violates: navigation architecture section f item 5 (an executive sees the company and enterprise levels), clarify (lead with what the reader owns). Fix: for `level: executive`, headline the enterprise objectives the viewer owns ("You own O-004 Trusted AI: 50% progress, 5 points of the company score, modeled"), keep the no-team gap as a small note, fix the punctuation and plural. `mod_s_contrib.js`.

**UX-E-05 (P1). Who am I? Three names for one seat.** Screens `home`, rail, chat dock. Evidence: `board/core_r15d_evidence.jpg`: the Board member's rail profile, owner chip and contribution card read Casey Rowan (the CIO); Home says "Welcome." with no name. `_probe3/chat_answer.jpg` and `_probe4/cfo_t26.jpg`: the chat composer shows "You Casey" with the role switched to CAIO or CFO while the rail says Kenji Watanabe or Marcus Reid. `ceo/ten_health_home.jpg`: under Larkspur the card says "Viewing as Ben Kowalski" while the rail says Catherine Doyle. Violates: consistency, R12 (accountable owner shown correctly), the Board member's credibility in a demo. Fix: give the Board member a fictional person in `mod_r15d_persona.js` (the `meOf` fallback is "Casey Rowan"); show the active persona in the chat "You" chip (`mod_chat.js`); when a seat maps to a tenant person, show "Catherine Doyle, seen as Ben Kowalski at Larkspur (sample mapping)" in both rail and card.

**UX-E-06 (P2). Tenant seat mapping puts executives in odd teams.** Screen `home` (My contribution). Evidence: `*/data.json` tenant section: Board member maps to "Your teams: Supply" (Redstone), General counsel to "Supply chain" (Corvane), CISO to "Account management" (Corvane), CHRO to "Clinical operations" (Larkspur). Violates: match with the real world. Fix: tighten the `SEAT` patterns in `mod_s_contrib.js` so a seat maps by title (chief legal, chief security, people) before department words, and fall back to the executive office team.

**UX-E-07 (P1). Role pins appear twice in an open area.** Screen: rail (every screen). Evidence: `cfo/core_bud_over.jpg`, `_probe5/data.json`: in Money and contracts the CFO sees Approve invoices twice and Budgets twice; in Strategy and value Budget and spend traceability and Dashboards twice; the CHRO sees Org chart, Performance reviews and Training and courses twice (`chro/core_org_chart.jpg`); the CEO sees Board pack, Goals and objectives and Executive lenses twice (`ceo/core_exe_board.jpg`). Violates: navigation principle 8 (duplicates fold into one entry), stable placement, Hick's law. Fix: render pins once, either as a labeled "Your pins" block with the same items removed from their sub-groups, or by marking pinned entries in place. Area flyout render in `mod_nav.js` with the persona pins of `mod_r15d_persona.js`.

**UX-E-08 (P1). Rail signals compete and disagree.** Screen: rail, top bar, 400 px tab bar. Evidence: `exec/core_bst.jpg`, `exec/w400_home.jpg`, `_probe5/data.json`: each area shows a grey entry count and a gold badge side by side ("Strategy and value 9 1"); My work shows "2" (its entry count) while My approvals inside it holds 16, the bell shows 9+ and the phone tab bar shows 16; a red dot on "Measures and targets" and "Watch and control AI agents" means No owner but says so only in a `title`; anchor marks sit on nearly every CFO entry. Violates: navigation principle 9 (one salient signal per place, only for items waiting on the viewer), WCAG 1.3.1 (meaning by color only). Fix: drop entry counts from the rail; one badge per area for items waiting on the viewer, with an `aria-label`; one number for approvals everywhere; move No owner to a text badge on the screen header only; keep anchor marks but only in All screens. `mod_nav.js`, `mod_s_owner.js` (`ownx-ndot`), `mod_s_contrib.js` (`ctb-anc`), `mod_inbox.js` (bell).

**UX-E-09 (P1). Real vendor and organization names in visible chips.** Screens `exe_board`, `inv`, `tower`, `ppm_sow`, `org_chart`, search results, chat. Evidence: `ceo/core_exe_board.jpg` ("Claude Sonnet · est. 90%" on every section), `cfo/core_inv.jpg` ("Claude + GPT council · est. 81%"), `exec/core_tower.jpg` ("Copilot in Teams"), `clo/core_ppm_sow.jpg` ("WorldCC contracting practice"), `chro/core_org_chart.jpg` ("TOGAF"), search for "privileged access review" returns "Identity (Entra ID)" and "Azure landing zone". Violates: `CLAUDE.md` hard rule (no real organization's brand in a product asset), R32. Fix: replace with generic, labeled wording ("AI draft, simulated, confidence 90%", "Chat assistant in the team workspace", "contracting practice"); sweep `mod_exec.js`, `mod_budget.js`, `mod_admin.js`, `mod_dec.js`, `mod_chat.js`, `mod_flow.js`, `screens1.js`, `data.js`, `screens2.js`, `mod_sow.js`, `mod_org.js`, `mod_org5.js` and the TOGAF chip modules (`kit2.js`, `mod_mat.js`, `mod_plat_links.js`, `mod_r16k_trace.js`); add the names to the visible-text lint.

**UX-E-10 (P1). Simulated capabilities presented as live.** Screens `tower`, `exe_board`, `r17q_value`. Evidence: `exec/core_tower.jpg`: a green "Live" badge beside "Gateway · 3 sources"; `ceo/core_exe_board.jpg`: subtitle "The quarterly pack, written from live data"; `r17q_value` reads "15 figures are computed live from this tenant's registries (Layer A)". Violates: `CLAUDE.md` hard rule (never present a simulated capability as live), R30. Fix: "Simulated gateway, 3 sample sources"; "written from the sample records"; "computed from the sample registries". `mod_exec.js`, `mod_r17q_c_value.js`.

**UX-E-11 (P1). Approval banners cover the right column and invite a blind approve.** Screen: any, after a persona change. Evidence: `exec/core_tower.jpg` (covers the fourth gauge), `cfo/core_bud_over.jpg` (covers a KPI card), `exec/show_home.jpg` (tenant toasts cover mission buttons), `_probe3/chat_answer.jpg` (covers the chat composer): "CHG0312 Raise Standards Portal ho... Waiting on Change advisory board · $48,... Approve / Review", 15 seconds per banner, re-raised on each persona switch. Violates: PH-10 (never over content), error prevention (a $48K approval from a truncated toast). Fix: no banner on persona switch (seed the seen list first); keep the bell count; remove Approve from the banner so it only offers Review; reserve a bottom-right gutter so banners never cover content. `banner()` and `poll()` in `mod_inbox.js`.

**UX-E-12 (P1). Questions fail in search and chat.** Screen: search palette, chat dock. Evidence: `*/data.json` search section: 0 results for "are we on track against strategy", "largest open investment", "where does work stall", "change collides with release", "refunds waiting for approval", "agents without a human owner", "where is AI saving time"; the CAIO's own suggested question "Which agents lack an accountable human?" gets "I do not have a tool for that, but I found 4 records" and its first source is the chat thread itself (`_probe3/chat_answer.jpg`). Noun searches work ("board pack", "approve invoices", "process maturity"), but results mix builder records: "Board pack (screen decision)", "Draw: Board pack", "data: Member renewal rate". Violates: navigation principle 12 (search and chat are doors), R35 (every feature has a chat intent), information scent. Fix: strip question words and map to the nearest screen or metric ("on track" to Goals and objectives, "stall" to Journey maps); answer each persona's `sugg` questions with a tool; hide decision, draw and data records for the decide family unless builder mode is on. `runSearch` in `mod_nav.js`, `mod_s_search.js`, `mod_r15d_ask.js`, `mod_chat.js`.

**UX-E-13 (P1). Three navigation rows and wall-to-wall content on executive screens.** Screens `bud_over`, `tower`, `org_chart`, `strat_exec`, `exe_board`, `grc_home`. Evidence: `cfo/core_bud_over.jpg`: an action row (Request budget, All budget lines, Reforecast, Cost center mapping), the family switcher (Budgets, All budget lines, Forecast model, Budget by funding type, IT financial model) and a tab row (Overview, By project, By category, Forecast, Reserve and approvals); "All budget lines" appears twice. `exec/core_tower.jpg`: four count chips, seven family views and four tabs. `coo/core_strat_exec.jpg`: 3,281 words, 447 controls, 196 targets under 24 px. Violates: R38 (executive headline with drill-down), cognitive load (more than four choices per decision point), layout squint test. Fix: for the decide family show the family as a title menu, not a row; keep one tab row; move secondary actions into a single More menu; give `strat_exec` an executive summary (the five goals and their gaps) with the tree behind Expand. Family switcher in `mod_r15c_merge.js` and `mod_r18b_families.js`; screen bodies in `mod_budget.js`, `mod_exec.js`, `mod_r16k_trace.js`.

**UX-E-14 (P2). The same name three times at the top of a screen.** Screens `bst`, `strat_exec`, `r18_strategy`, `grc_exc`, `r15d_agents`. Evidence: `exec/core_bst.jpg`: "Budget and spend traceability" as h1, as the switcher label and as the active switcher button; h1 "Budget and spend traceability: Trace goals to money and work"; "Risk: Exceptions and acceptances". Violates: impeccable "do not repeat information", typeset hierarchy. Fix: h1 is the view name; the family goes in the breadcrumb only; drop the switcher's leading label. `mod_r15c_merge.js`, `mod_r18b_families.js`.

**UX-E-15 (P2). Small type and a three-family mix.** Screens: all. Evidence: `*/data.json` sizes: text elements under 12 px per screen run 20 to 60 on most executive screens, 138 on `org_chart` and 186 on `strat_exec`; table headers are 11 px; three families (Hanken Grotesk, Newsreader, ui-monospace) with serif numerals beside sans labels inside the same KPI card. Violates: typeset (body at least 16 px, five sizes at a 1.25 ratio), WCAG 1.4.4 risk at 200% zoom. Note: Newsreader is on the impeccable reflex-font list. Fix: set a floor of 12 px for captions and 13 px for table text in the token scale; reduce the 14 sizes in use on Home to five; pick one numeral style for KPIs. `style.css` tokens (`docs/css-tokens.md`).

**UX-E-16 (P2). Recognizable AI-template patterns.** Screens: all. Evidence: `impeccable detect` over six rendered screens (`tools/scratch/ux/detect.err`): about 91 side-stripe border rules (BAN 1), 14 top-accent borders on rounded cards, 37 width transitions, 3 bounce easings (`cubic-bezier(.2,.8,.3,1.2)`), 1 dark glow; most side stripes in `mod_people.css` (16), `mod_meet.css` (7), `mod_itsm.css`, `mod_r16l_a.css` (6 each), `mod_obs.css`, `mod_r17q_a.css`, `mod_r25_b_studio.css` (5 each). Visible on `cfo/core_inv.jpg` (invoice list cards with a colored left stripe). The VibeCheck button is a purple-to-blue gradient and the chat dock is violet with a purple Send (`_probe3/chat_answer.jpg`); KPI labels on `exe_dash` and `strat_exec` are purple. Violates: impeccable absolute bans and color rules. Fix: replace stripes with a full hairline border plus a status chip; move the chat dock and VibeCheck to the navy and gold brand palette (`src/brand.json`); replace bounce easing with ease-out quart; animate transform, not width.

**UX-E-17 (P2). Header controls collide.** Screens `strat_exec`, `r18_lens`, `home`, any at 400 px. Evidence: `coo/core_strat_exec.jpg`: the Lens button covers the owner chip ("Own..."); `exec/exp_cio_clash.jpg`: two favorite stars on Executive lenses; keyboard walk on Home reaches "Add Home to favorites" twice; `exec/w400_home.jpg` and `cfo/w400_inv.jpg`: the Lens and Why row overlaps the thread line and two stars stack. Violates: R36, PH-10. Fix: one favorite star per screen in the header cluster; let the header cluster wrap below the breadcrumb when space runs out; hide the thread line under 600 px behind the anchor button. `mod_r20a_topbar.js`, `mod_s_thread.css`, `mod_r17o1_shell.css`.

**UX-E-18 (P2). The Home thread points at someone else's team.** Screen `home`. Evidence: `exec/core_home.jpg`, `ceo/core_home.jpg`: for CEO, CIO and Board member the thread on Home ends at O-001.2 "Earn the Standards Platform plan". Violates: navigation architecture section f (the thread is the viewer's path), information scent. Fix: anchor Home to the viewer's own path, or to Company only when the viewer has none. `CONTRIB.anchor` in `mod_s_contrib.js`, `mod_s_thread.js`.

**UX-E-19 (P2). Text is cut where there is room.** Screens: top bar, `home`, `bud_over`, `ppm_sow`, rail. Evidence: thread segments cut at about 25 characters with free space to the right (`exec/core_home.jpg`); objective names "Modernize stand..." with 600 px free in the contribution list (`exec/core_home_contrib.jpg`); "$503K more is forecast to be needed" clipped and "ap-proved" hyphenated in a KPI label (`cfo/core_bud_over.jpg`); toolbar "Request a" cut at the right edge (`clo/core_ppm_sow.jpg`); rail "Watch and control AI agent..." (`exec/core_tower.jpg`). Violates: R36 (text is never squeezed). Fix: let the last thread segment and the objective names take the remaining width; `hyphens: manual` on KPI labels; wrap the toolbar. `mod_s_thread.css`, `mod_s_contrib.css`, `mod_budget3.css`, `mod_sow.css`.

**UX-E-20 (P2). The Showroom picker ignores who is driving.** Screen `showroom`. Evidence: `exec/show_home.jpg`, `_probe4/data.json`: "Who is driving" offers CFO, COO, CISO, CIO, CEO, CHRO, CAIO and defaults to CFO for every viewer; CCO, General counsel and Board member are missing; the CCO and Board member have no Showroom lens (`SHOW.lenses` holds eight). Violates: experiences principle "their company first" (and their role first), recognition over recall. Fix: default the role to the viewer's persona; add CCO, General counsel and Board member to `ROLES` in `mod_s_exp.js`; add CCO and Board lenses to `mod_s_showroom_lens.js` (the Board can reuse the CEO cut with read-only beats).

**UX-E-21 (P1). Six executives have only a generic mission, and it does not fit them.** Screen `showroom`, mission `monday`. Evidence: `chro/exp_monday_t6.jpg`: Your Monday seeds three Access requests (SR0010698, SR0010575, SR0010626) for the CHRO; the same three for every role; hint "Open My inbox from the menu or the bell" while the rail item is My work, and the Board member's rail has no My work at all; the Board member (read only) is asked to "make one decision". Only CFO, COO, CISO and CIO have a role mission. Violates: experiences rules (a mission per role on existing screens, a ripple the buyer sees), honesty of a read-only role. Fix: seed Your Monday from the role's pins and the role's own waiting items (CHRO: a review calibration on `ppl_perf`; CEO: the open decision in `exe_board`; CAIO: an agent over its cap on `tower`; General counsel: an off-playbook clause on `ppm_sow`; CCO: a late customer request on `svc_req`); give the Board member a read mission (find the claim behind a board pack number); use the rail's words in hints. `mod_s_exp_missions.js`. These use existing screens only (DC-34).

**UX-E-22 (P2). Missions start where you happen to be and coach twice.** Screen: mission card. Evidence: `exec/exp_cio_clash.jpg`, `_probe4/cfo_t26.jpg`: the CIO clash started on Executive lenses with step 1 "Find the release with a hard clash" and no link; at 20 seconds the hint appears in the card and the chat dock opens with the same text, pushing the card left over the page; the CIO hint says "Open Releases" while the menu says "Plan and track releases". Violates: user control (two coaching surfaces), information scent. Fix: put a "Take me there" link on step 1 after the first hint; show the hint in one place (the card in self-serve, the console when facilitated); match menu labels. `mod_s_exp.js`, `mod_s_exp_missions.js`.

**UX-E-23 (P1). The CLO lens tile names whoever is viewing.** Screen `r18_lens`. Evidence: `*/data.json` showroom lens text: the CLO tile reads "CLO Catherine Doyle" for the CEO, "CLO Marcus Reid" for the CFO, "CLO Rina Okafor" for the CISO, and is blank for the CIO (`exec/exp_cio_clash.jpg`); the General counsel is Theo Marlowe. Violates: R12 (accountable owner), consistency. Fix: resolve the CLO holder from the persona table (`clo.as`), not the viewer. `mod_r18k_biz.js`, `mod_r18e_lens.js`.

## CEO (Catherine Doyle)

**Top tasks tried.** Read the board pack (`exe_board`); see whether money points at the strategy (`exe_strat`); compare lenses (`r18_lens`, `r18_strategy`); scan the dashboard (`exe_dash`); on Larkspur Health System, Home, board pack, lenses and goals; Showroom CEO lens and Your Monday.

**What worked.** The hero names three CEO numbers (Member renewal 92%, Budget against forecast 5.6%, Days to publish 41 days, each with a target). Goals and objectives answers the question it asks in its first line ("The alignment score is 89 of 100. 4 of 5 objectives have funded work"). The board pack on Larkspur is tenant-aware and says "written from this company's records... Sample data, simulated". Board pack numbers cite records.

**Findings.** UX-E-01, UX-E-02, UX-E-03, UX-E-04, UX-E-07, UX-E-09, UX-E-10, UX-E-12 ("are we on track against strategy" and "largest open investment" return nothing), UX-E-21, UX-E-23, and:

**UX-E-33 (P2). The board pack is a builder's workbench.** Screen `exe_board`. Evidence: `ceo/core_exe_board.jpg`: 1,159 words, 108 controls, 66 targets under 24 px; first view shows Generate pack, a decision-age KPI, five count tiles, a draggable section list with an AI chip and an Edit and toggle per section, and the pack itself starts below the fold. Violates: R38 (executive headline first), layout hierarchy. Fix: open on the pack (reading view) with a one-line status ("Draft, 7 decisions open, awaiting approval"); move section editing behind Edit pack. `mod_exec.js`.

## CIO (Casey Rowan, default persona)

**Top tasks tried.** Spend against plan (`bst`); dashboard (`exe_dash`); AI agents (`tower`); the build list (`r18_builds`); the change calendar (`itsm_chg`); on Corvane Data Protection, Home, `bst`, `exe_dash`, `tower`; Showroom CIO lens and the mission "The clash in board week" plus Your Monday.

**What worked.** Budget and spend traceability states the scope ("Only the domains you own") and the four headline numbers sit above the table. Watch and control AI agents opens with "5 of 6 agents are running inside the gateway and spend is at 30% of the cap". On Corvane, `bst` and `exe_dash` follow the tenant and say "(simulated)". The CIO mission falls back to Atlantic Systems with a reason (release records exist only there, DC-40).

**Findings.** UX-E-01 (Home and `tower` stay on Atlantic Systems under Corvane), UX-E-04, UX-E-07, UX-E-08, UX-E-09 ("Copilot in Teams"), UX-E-10 ("Live"), UX-E-11, UX-E-13 (`tower`), UX-E-17, UX-E-18, UX-E-22, and:

**UX-E-29 (P2). Acronyms an executive is not given.** Screens `itsm_chg`, `exe_dash`, `plat_proc`, `bst`. Evidence: `exec/data.json`: `itsm_chg` opens "1 collide on the same CI (CHG0314 and CHG0315)"; `exe_dash` carries WBS, RAID, SOW and TBM; `plat_proc` carries BPMN, DMN, SLO and CMDB; `bst` uses SOW. Violates: R37 (acronyms defined on first use, plain English), clarify. Fix: first use spelled out ("the same server or service (configuration item)"), or a glossary tooltip from one shared term list; `mod_itsm.js`, `mod_exec.js`, `mod_plat_proclib.js`.

**UX-E-32 (P2). Grammar slips in generated sentences.** Screens `itsm_chg`, `grc_home`, `home`, `kcs_test`, `ppl_train`. Evidence: "1 collide on the same CI" (`itsm_chg`), "1 exceptions are expiring or expired" (`grc_home` on Corvane), "1 of your items are not linked to an objective" (My contribution), "No data in this sample company yet test suites: the gap is recorded." (`kcs_test` on Redstone), "0% of mandatory courses due to date are complete" (`ppl_train` on Larkspur, which reads as broken data rather than a gap). Violates: clarify (be specific, be correct), honesty (a 0% that is really "no data"). Fix: one plural helper in `platform.js` (`U.n(count, "exception")`) used by `mod_itsm.js`, `mod_r15f2_b_grc.js`, `mod_s_contrib.js`; rewrite the tenant gap empty state as "Redstone Resources has no AI test suites in this sample. The gap is recorded."; show "No course data in this sample" instead of 0%.

## COO (Elena Marsh, Chief Editor)

**Top tasks tried.** Goals and objectives (`exe_strat`); trace goals to money and work (`strat_exec`); journey maps (`ppl_jrny`); Agent Action (`orgdesign`); processes (`plat_proc`); on Redstone Resources, Home, `exe_strat`, `strat_exec`, `ppl_jrny`; Showroom COO lens and the mission "The step nobody runs".

**What worked.** My contribution works as designed for the COO: "Your work this quarter: 5.9 points of the company score (modeled), through Shorten the time to publish and 2 more". Journey maps and Strategy to execution follow Redstone (3 journeys, its own projects). The COO mission has a clear first step ("Find a journey step nothing runs (a red box)") and a hint that names the screen.

**Findings.** UX-E-01, UX-E-06 (Redstone maps the COO seat to the executive office with no team), UX-E-12 ("where does work stall" returns nothing), UX-E-13 (`strat_exec`), UX-E-14, UX-E-16, UX-E-17 (owner chip hidden under Lens on `strat_exec`), UX-E-29 (TOGAF, BPMN), and:

**UX-E-31 (P2). Library screens open on a warning, not on the answer.** Screens `plat_proc`, `metrics`. Evidence: `coo/data.json`, `cco/data.json`: both headers carry a red "No owner" pill; `plat_proc` opens "331 processes... 208 are below their Year 1 target"; `metrics` opens "462 metrics, 335 off trend". For an executive, 72% off trend reads as a failing company or a broken product. Violates: R12 (every screen has an owner), R34 (what needs attention, ranked), R38. Fix: assign owners for both screens in their registrations; lead with the five off-trend measures that touch the viewer's objectives and label the rest as the sample library. `mod_plat_proclib.js`, `mod_r16j_h_metrics.js`.

## CFO (Marcus Reid)

**Top tasks tried.** Approve or hold the largest invoice (`inv`); budgets (`bud_over`); spend traceability and spend detail (`bst`, `r18_spend`); dashboard (`exe_dash`); on Larkspur Health System, Home, `bst`, `inv`, `bud_over`; Showroom CFO lens and the mission "The invoice that breaks the budget".

**What worked.** Approve invoices is the best executive screen walked: one sentence names the problem, the money at stake and the recommendation; the decision buttons and a reason field sit with the invoice. The thread on `inv` reads "your team 38% toward 60%". On Larkspur, `bst` and `bud_over` follow the tenant ("Approved $7.57M, forecast $7.71M... Sample figures, simulated"). The CFO mission's hint names the exact invoice state to look for.

**Findings.** UX-E-01 (`inv` stays on Atlantic Systems under Larkspur), UX-E-02, UX-E-07, UX-E-09 ("Claude + GPT council"), UX-E-11 (banner over `bud_over`), UX-E-13 (`bud_over`), UX-E-16 (invoice list side stripes), UX-E-19 (`bud_over` clipping and hyphenation), UX-E-22.

## CCO (Lena Hargrove)

**Top tasks tried.** Measures and targets (`metrics`); the request queue (`svc_req`); org chart (`org_chart`); processes (`plat_proc`); searches for late customer cases, publication revenue, refunds waiting for approval; on Corvane Data Protection, Home, `metrics`, `svc_req`, `org_chart`; Showroom.

**What worked.** The request queue opens with "86 open, 34 approvals waiting" and the SLA risk; on Corvane, `metrics` and `svc_req` follow the tenant; "publication revenue" and "customer satisfaction" find the right metrics.

**Findings.** UX-E-01, UX-E-04, UX-E-12 ("refunds waiting for approval" returns nothing), UX-E-20 (no CCO in Showroom, no CCO lens), UX-E-21, UX-E-31, and:

**UX-E-25 (P0). The CCO's pinned Processes is denied.** Screen `plat_proc`. Evidence: `cco/core_plat_proc.jpg`: "Process library is not available to CCO. Screen is limited to the roles named in its rules; none of Lena Hargrove's roles is listed", with "deny by default", "Roles: Employee" and the raw id `screen:plat_proc` on the page. The pin is one of the CCO's four (`mod_r15d_persona.js`), but the CCO's platform roles are `["employee"]` (`PROLES` in `mod_r24_ops.js`). Violates: blocks a top task; R37 (no raw text); navigation architecture section e (nothing hidden by navigation that permissions allow, and nothing pinned that permissions deny). Fix: give the CCO a read role for processes in `mod_r24_ops.js`, or replace the pin; add a test that every persona pin passes `PERM` for that persona; never print `screen:<id>` on the denial page (`mod_r16g_b_enforce.js`).

**UX-E-26 (P1). CCO and Board member Home borrow the CEO's numbers.** Screen `home`. Evidence: `cco/core_home.jpg`, `board/core_home.jpg`: hero "Chief executive officer lens · your access has not changed" with Member renewal, Budget against forecast and Days to publish a standard; the CCO's own KPIs (`m_ops_pubrev` Revenue against plan, `m_ops_csat` Customer satisfaction, `m_ops_case` Days to resolve a case in `mod_r24_ops.js`) never appear. The header Lens chip says CEO for both. Violates: R38, time to first useful answer, clarify ("your access has not changed" answers a question nobody asked). Fix: render the persona's `kpis` in the hero; label the lens as "CEO view" only where a lens is really borrowed; drop the access sentence. `mod_r21_home.js`.

## CHRO (Joanna Pierce)

**Top tasks tried.** Org chart (`org_chart`); performance reviews (`ppl_perf`); training (`ppl_train`); who is available (`ppl_cap`); on Larkspur Health System, Home, `org_chart`, `ppl_perf`, `ppl_train`; Showroom CHRO lens and Your Monday.

**What worked.** The hero shows Headcount against plan 85%, Days to fill a role 52, Training completion 91%. Performance reviews opens with the cycle status ("55% of 85 reviews are submitted, and 38 are still with managers"). Searches for performance reviews, headcount plan and who is available all land.

**Findings.** UX-E-01 (`org_chart` and `ppl_perf` stay on Atlantic Systems under Larkspur), UX-E-04, UX-E-06 (Larkspur maps the CHRO to Clinical operations), UX-E-07, UX-E-15, UX-E-21 (Your Monday hands the CHRO three access requests), UX-E-32 (`ppl_train` 0% on Larkspur), and:

**UX-E-27 (P2). A CHRO pin lives in an area the CHRO cannot see.** Screen `ppl_cap`. Evidence: `chro/data.json`: the breadcrumb reads "Portfolio and delivery / Who is available to do the work" while the CHRO rail has Strategy and value, People and organization and Transformation only. Violates: navigation principle 5 (stable placement) and the purview rule (pins sit inside an area the persona sees). Fix: place Who is available to do the work in People and organization (Capacity and skills), where the navigation paper lists Skills and availability, or show it under People for the CHRO. Taxonomy in `mod_nav.js`.

**UX-E-28 (P2). The org chart opens on controls and jargon.** Screen `org_chart`. Evidence: `chro/core_org_chart.jpg`: chips "TOGAF" and "Agentic AI governance" beside the KPIs; a ten-tab row that overflows ("Directory" cut); filters, search and "More filters" before the chart; 138 text elements under 12 px (10 px node labels). Violates: clarify, layout, typeset. Fix: drop the framework chips for the decide family; collapse tabs past five into More; start the chart at the viewer's level; 12 px floor for node text. `mod_org.js`, `mod_org5.js`, `mod_org.css`.

## CISO (Rina Okafor)

**Top tasks tried.** Governance, risk and compliance (`grc_home`); privileged access (`r15_iam`); risk (`exe_risk`); guardrails (`guard`); control evidence (`grc_ctl`); on Corvane Data Protection, Home, `grc_home`, `r15_iam`, `exe_risk`; Showroom CISO lens and the mission "The agent that wants more".

**What worked.** The CISO has the strongest search scent of the group: "privileged access review", "risks above appetite", "control evidence" and "break glass" all return the right records first. Guardrails states "All of it is simulated in this prototype". `grc_home` and `exe_risk` follow Corvane. The CISO mission's hint names the tab ("Open Identity and access, then the Access requests tab").

**Findings.** UX-E-01 (`r15_iam` stays on Atlantic Systems under Corvane), UX-E-04, UX-E-06 (Corvane maps the CISO to Account management), UX-E-09 ("Entra ID" in results), UX-E-13 (`grc_home`: 120 controls, 54 targets under 24 px), UX-E-32 ("1 exceptions are expiring").

## CAIO (Kenji Watanabe)

**Top tasks tried.** Watch and control AI agents (`tower`); agent registry (`r15d_agents`); test AI answers (`kcs_test`); value realized (`r17q_value`); the three suggested chat questions; on Redstone Resources, Home, `tower`, `r15d_agents`, `kcs_test`; Showroom CAIO lens and Your Monday.

**What worked.** The hero leads with AI with an accountable human 71%, Agent override rate 22%, AI spend 29% of the daily cap. Test AI answers states the gate in one line ("candidate v4 scores 58.3% against 91.7%, so the regression gate is closed"). The agent registry follows Redstone.

**Findings.** UX-E-01 (`tower` stays on Atlantic Systems under Redstone), UX-E-04, UX-E-05 (chat shows "You Casey"), UX-E-09, UX-E-10 (`r17q_value` "computed live", "Layer A"), UX-E-12 (two of the CAIO's three suggested questions return nothing in search and "I do not have a tool for that" in chat), UX-E-21, UX-E-32 (`kcs_test` empty state on Redstone).

## General counsel (Theo Marlowe)

**Top tasks tried.** Review a statement of work (`ppm_sow`); policies (`grc_pol`); exceptions (`grc_exc`); vendors and contracts (`bud_ven`); on Corvane Data Protection, Home, `ppm_sow`, `grc_pol`, `grc_exc`; Showroom CLO lens and Your Monday.

**What worked.** The hero shows Contracts reviewed in time 86%, Licensing answered in 5 days 83%, Policy acknowledgement 86%. Review a statement of work opens with the exposure ("12 of 41 lines off playbook, 4 of them with no standard term yet. 11 obligations fall due in 30 days and 2 are overdue"). All four pins are tenant-aware on Corvane. My contribution shows 0.2 modeled points through Earn the Contract Repository plan.

**Findings.** UX-E-01, UX-E-06 (Corvane maps General counsel to Supply chain), UX-E-09 ("WorldCC contracting practice"), UX-E-12 ("regulatory exposure" returns Incident impact score), UX-E-19 ("Request a" cut off), UX-E-20 (no General counsel in the Showroom picker), UX-E-21, UX-E-23 (the CLO lens tile names the viewer, not Theo Marlowe).

## Board member (read only)

**Top tasks tried.** Read the board pack (`exe_board`); sample evidence (`r15d_evidence`); risk (`exe_risk`); dashboard (`exe_dash`); AI oversight (`tower`); on Redstone Resources, Home, `exe_board`, `r15d_evidence`, `exe_risk`; Showroom and Your Monday.

**What worked.** The rail is the smallest of any executive (two areas plus Ask or request). The evidence room says "Read only" and "Nothing here changes a record", and offers Verify chain and Export everything. On Redstone the board pack and risk follow the tenant.

**Findings.** UX-E-01, UX-E-03, UX-E-05 (the Board member is Casey Rowan, "Welcome." with no name), UX-E-20, UX-E-21 (Your Monday asks a read-only member to make a decision from an inbox the rail does not show), UX-E-26, and:

**UX-E-24 (P1). Read only, but offered edits.** Screens `exe_board`, `exe_risk`, `exe_dash`, `home`. Evidence: `_probe2/data.json`, `_probe2/board_exe_board.jpg`: enabled buttons Generate pack, Edit, Submit for CIO review (`exe_board`); Assign mitigation owner (`exe_risk`); Add a step and Run this process on the process card of every screen; Home shows "Decisions waiting for you" and "Things you built"; a toast "Read-only role: Board member (read only) cannot change records" fires during plain browsing (`board/core_r15d_evidence.jpg`). Violates: navigation architecture section e (Board member never sees a create action), error prevention, R35 (every action audited, so a denied action is noise in the audit trail). Fix: when `PERSONAS[k].readonly`, hide create and change controls (or render them disabled with "Read only" as the reason) in `kit2.js` (`procCard`), `mod_r15f1_b_wf.js` (Run this process), `mod_exec.js` (board pack) and `mod_exec.js` or `mod_r16k_trace.js` (risk); drop the two Home sections for read-only personas in `mod_r21_home.js`; route the check through `mod_r16g_b_enforce.js`.

**UX-E-30 (P2). The evidence room's selected tab looks disabled.** Screen `r15d_evidence`. Evidence: `board/core_r15d_evidence.jpg`: the active "Controls" tab is pale grey on grey (sampled 1.19:1) while inactive tabs are dark on white; each row ends with "Open feature", a builder phrase. Violates: WCAG 1.4.3 and 1.4.11, consistency with every other tab row (selected is filled teal). Fix: use the shared selected tab style; rename "Open feature" to "Open the control". `mod_r15d_evidence.js`.

**UX-E-34 (P2). VibeCheck sits in every executive rail unexplained.** Screen: rail. Evidence: `exec/core_home.jpg` and every rail shot: a gradient VibeCheck button between Showroom and the profile, for all ten executives including the read-only Board member; no tooltip or description. Violates: information scent (navigation principle 6), the fixed rail layout of section b (VibeCheck is a Transformation entry). Fix: show VibeCheck only inside Transformation (Scale what was built), where the navigation paper places it, and use the brand palette. `mod_nav.js`, `mod_s_rail_art.css`.

## Severity count

| Severity | Count | Ids |
|---|---|---|
| P0 | 1 | UX-E-25 |
| P1 | 16 | UX-E-01, 02, 03, 04, 05, 07, 08, 09, 10, 11, 12, 13, 21, 23, 24, 26 |
| P2 | 17 | UX-E-06, 14, 15, 16, 17, 18, 19, 20, 22, 27, 28, 29, 30, 31, 32, 33, 34 |
| **Total** | **34** | |

## The ten highest-value fixes, grouped by module

**Home: `mod_r21_home.js`, `mod_s_contrib.js`, `mod_s_thread.js`**
1. **Make Home tenant-aware and role-true** (UX-E-01, UX-E-26). Read the hero KPIs and eyebrow from the active tenant and the persona's own `kpis`; drop "your access has not changed". Every industry demo starts here.
2. **Put what waits on me first and fix My contribution for executives** (UX-E-03, UX-E-04, UX-E-18). Decisions waiting for you directly under the hero; My contribution as a one-line strip that leads with owned enterprise objectives; Home thread on the viewer's own path.
3. **Answer "What should I look at first?"** (UX-E-02). Off-target KPI, top waiting decision and first pin, each with Take me there (`mod_r21_home.js` with the chat intent in `mod_chat.js` or `mod_r15d_ask.js`).

**Persona and rail: `mod_r15d_persona.js`, `mod_r24_ops.js`, `mod_nav.js`, `mod_chat.js`, `mod_s_owner.js`**
4. **Unblock the CCO's pinned Processes and test every pin against permissions** (UX-E-25). The only P0; also stop printing `screen:<id>` on the denial page (`mod_r16g_b_enforce.js`).
5. **One entry and one signal per place in the rail** (UX-E-07, UX-E-08). Render pins once; drop entry counts; one labeled badge for waiting items; one approvals number everywhere; No owner as text on the screen header.
6. **One identity per seat** (UX-E-05, UX-E-06). A fictional person for the Board member, the active persona in the chat "You" chip, a visible "seen as" when a tenant maps the seat, and title-first seat matching.

**Copy and claims sweep: `mod_exec.js`, `mod_chat.js`, `mod_budget.js`, `screens1.js`, `data.js`, `mod_sow.js`, `mod_r17q_c_value.js`, `mod_r18k_biz.js`**
7. **Remove real vendor names and live claims; fix the CLO lens holder** (UX-E-09, UX-E-10, UX-E-23). Generic labeled wording for AI chips, "simulated" on the gateway and the board pack, and the CLO tile resolved from the persona table. Add the names to the visible-text lint.

**Read-only enforcement: `kit2.js`, `mod_r15f1_b_wf.js`, `mod_exec.js`, `mod_r16g_b_enforce.js`**
8. **Make the Board member truly read only** (UX-E-24). Hide or disable with a reason every create and change control for `readonly` personas, including the process card on every screen.

**Inbox: `mod_inbox.js`**
9. **Stop banners covering content and drop one-click Approve** (UX-E-11). No banner on persona switch, Review only, a reserved gutter.

**Search and chat: `mod_nav.js` (`runSearch`), `mod_s_search.js`, `mod_r15d_ask.js`**
10. **Let executives ask questions** (UX-E-12). Map question phrasing to screens and metrics, give each persona's suggested questions a tool, and hide builder records (screen decisions, Draw, data) outside builder mode.

Next in line after these ten: the executive density pass (UX-E-13, UX-E-14), role missions and a role-true Your Monday on existing screens (UX-E-21, UX-E-20), and the anti-pattern and type sweep (UX-E-15, UX-E-16).
