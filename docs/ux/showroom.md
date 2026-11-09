# Showroom: buyer and presenter evaluation and rehearsal (PR-31, DC-39)

Date: 2026-10-21. Build: local full build of `main` at d4f979b (`src/build_out/full.html`). Viewports: 1440 x 900 desktop, 390 x 844 phone. Buyer window and facilitator console were two pages in one Playwright browser context (BroadcastChannel). Fictional sample data only (Atlantic Logistics and generated companies). This document describes; status and priority stay in the Product Backlog.

Method: every mission was driven through visible controls (home chips, sidebar, search palette, tabs, buttons) with human pauses (about 12 seconds to read the mission card, 6 to 10 seconds to scan each screen, a screen at a time when scrolling, 6 seconds to decide, 10 seconds to read the ripple). Where the buyer could not find a control, the run used what a presenter would (console Recover), and that is recorded. Skills applied: impeccable (critique), critique (Nielsen heuristics, cognitive load, personas), clarify, delight, animate, layout, design:accessibility-review (WCAG 2.1 AA).

Scripts: `tools/scratch/ux/` (`paced.js`, `extra.js`, `probe2.js`, `probe3.js`, `monday.js`, `monday2.js`, `seats.js`, `a11y.js`). Screenshots: `tools/scratch/ux/shots/showroom/` (103 files, 50 MB, not committed: over the 5 MB limit). Rerun with `node tools/scratch/ux/paced.js <mission>` after a full build.

Severity: P0 breaks the demo, P1 weakens it often, P2 polish.

## Timings against the 180 second clock

| Mission | Mode, role, company | Measured (paced buyer) | Outcome | Realistic first-time buyer |
|---|---|---|---|---|
| Bring your company (setup) | three-question dialog | 18 to 20 s per company | built (healthcare, mining, free text) | 40 to 60 s; but the Showroom button opens a different, older form (UX-S-06) |
| CFO: The invoice that breaks the budget | presenter, CFO, Atlantic Logistics | 0:48 (find 0:15, why 0:35, decide 0:48) | success | 1:15 to 1:45, inside the clock |
| COO: The step nobody runs | presenter, COO, Atlantic Logistics | 3:14 (find 0:26, fix 0:44, built 3:14) | success over the clock | 3:30 or more; the studio alone took 144 s (UX-S-03) |
| CISO: The agent that wants more | self-serve, CISO, Atlantic Logistics | stopped at 2:09 with 2 of 3 steps | failed: Deny was under the chat and the card (UX-S-01) | cannot finish self-serve at 1440 x 900; with a presenter 1:30 |
| CIO: The clash in board week | presenter, CIO, Atlantic Logistics | 1:05 (find 0:19 after a Recover, resolve and clear 1:05) | success with one presenter Recover | 1:45 to 2:30; search cannot find Releases (UX-S-09) |
| Your Monday | presenter and self, COO, Atlantic Logistics | self: stuck on step 1 at 1:57; presenter via sidebar: stuck on step 2 at 1:31; via the inbox focus view: 0:15 | fails on the natural path | 1:00 if the buyer lands in the right inbox, otherwise stuck (UX-S-10) |
| Break it | self-serve, CISO, Atlantic Logistics | 4 of 6 refused by 2:25 | failed: two Try buttons under the card (UX-S-02) | 2:30 to 3:00 with the card hidden; tight against the clock |
| Two seats | presenter, CFO plus Operations window | inbox approval in seat 2: no arrival by 1:36; invoice hold in seat 2: 0:11 | depends on the action (UX-S-05) | 0:45 when the action crosses |
| Guided tour backup (COO thin thread) | rehearsal | lint clean, 10 beats, 15:10 of a 20:00 limit | works | as designed |

Hints and stuck detection, measured: the first hint reached the console (facilitated) or the chat and card (self-serve) at 15 to 20 seconds idle, stuck fired at 40 seconds, a console nudge reached the buyer card in under one second, Recover took the buyer to the right screen in about 2 seconds.

## Design health (critique, Nielsen 0 to 4)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Clock and checkpoints are clear; nothing shows during the 8 second inbox undo window before the ripple |
| 2 | Match with the real world | 2 | Hints name "My inbox", "the bell", "Releases", "red box": none of these labels exist on screen |
| 3 | User control and freedom | 2 | Card has hide and end; but it covers the controls the buyer needs and does not get out of the way by itself |
| 4 | Consistency and standards | 2 | Two "Bring your company" flows; "Try to break it" and "Break it" tabs; persona names differ between chat, page and seat |
| 5 | Error prevention | 2 | Monday invites approving a high-risk break-glass request; CIO and Monday accept actions on screens that do not count |
| 6 | Recognition over recall | 3 | Checkpoint list is good; the buyer must remember where the next control is when it sits two screens down |
| 7 | Flexibility and efficiency | 2 | Keyboard users cannot reach the card; no shortcut to the mission's first screen |
| 8 | Aesthetic and minimalist design | 3 | Calm, branded, readable; the card grows tall as claims pile up |
| 9 | Error recovery | 3 | Show me, Skip and console Recover work well |
| 10 | Help and documentation | 3 | Hints arrive on time; some point at things that are not there |
| | Total | 25 of 40 | Decent: strong engine, weak fit with the screens it plays on |

Anti-patterns verdict (impeccable): it does not read as generic. The falcon rail, painted navy panel and serif display headings give a real brand moment on the Showroom home and on every mission start. Tells that remain: glass cards everywhere (mission card, trail, seat bar and console cards are all the same blurred panel), identical mission card grid on the home, and three primary buttons side by side in the setup result. Cognitive load checklist: 3 of 8 fail (visible options on the home exceed four at each step: 7 roles, 5 companies, 4 cards with 3 buttons each; the card shows brief, goal, situation, checkpoints and claims at once; the console shows five panels with equal weight), so moderate.

## Setup: Bring your company

What worked
- The three-question dialog (name, industry chips or free text, what hurts) is fast: 18 to 20 seconds of buyer time per company, with a short building animation that shows what is made. Shots `b_2q2_health.png`, `b_5result_health.png`.
- Free text "veterinary clinics" matched Healthcare and said so ("Closest: Healthcare"). Checks passed and are listed, the company is labeled simulated, and "Forget my company" is visible.
- The result names the company and its first goal in plain words ("every patient is seen within a week of referral"), a good ten-second hook.

Findings: UX-S-06, UX-S-07, UX-S-24.

## Mission 1: CFO, The invoice that breaks the budget

What worked
- Best mission. The Home "For your role" row has an "Approve invoices" chip, so the buyer finds the screen in one click; the flagged invoice is the first card and says "Recommend hold"; the advisor text explains the overpay in one paragraph.
- The ripple is the aha: invoice $63K to $0, line variance $45K to -$18K, both objective scores up, with the modeled rule under it (`m_cfo_invoice_4ripple.png`, `p_cfo_4.png`).
- Claims land in order and the console's "Claim to land" card tells the presenter to say it in one sentence.

Findings: UX-S-08 (why claim fires on the tab click while the chain is below the fold), UX-S-11 (negative variance reads oddly), UX-S-14, UX-S-28.

## Mission 2: COO, The step nobody runs

What worked
- Journey maps chip on Home, red flags on the mood chart, and "Build the fix in VibeCheck" turn a gap into a build in one click; the studio opens with the request already written.

Findings: UX-S-03 (over the clock), UX-S-08 (find fires before the red step is in view), UX-S-09 ("red box" versus red flag), UX-S-12 (trail drawn under the studio panes, `m_coo_journey_3built.png`), UX-S-13 (false stuck during Auto), UX-S-15 (access request toast over the chat Continue, `p_coo_3.png`), UX-S-22, UX-S-25.

## Mission 3: CISO, The agent that wants more

What worked
- Home chip "Identity and access", the Access requests tab, and the seeded AR-0031 at the top of the table: finding the request takes about 25 seconds.
- Guardrails "Try to break it" refuses the restricted record and says which control held.

Findings: UX-S-01 (self-serve: Deny unreachable, `m_ciso_agent_1req.png`), UX-S-02 (presenter mode: Deny at x 1235 under the card, `p_ciso_2.png`), UX-S-11 (deny gives a flat ripple), UX-S-12 (trail covers Try it, `p_ciso_4.png`), UX-S-19, UX-S-29.

## Mission 4: CIO, The clash in board week

What worked
- Clash detection is live and the release drawer offers "Move to first clear day"; hard clashes go 1 to 0 and the trail says "Checked live".

Findings: UX-S-09 (search for "Releases" finds no screen, `x_search_releases.png`), UX-S-20 (starts on Home with no chip for releases), UX-S-21 (two hard clashes, target two screens down, Move button eight scrolls deep), UX-S-08 (clear fires the same second as resolve), UX-S-11 (key result 99.6% to 99.6% shown red, `m_cio_clash_2ripple.png`).

## Mission 5: Your Monday

What worked
- The inbox focus view is excellent once reached: one item, the advisor, the guardrail, keyboard keys, undo (`m_monday_3needs.png`).

Findings: UX-S-10, UX-S-09, UX-S-15, UX-S-16 (My approvals says "as Casey Rowan (CIO)" in a COO mission, `m_monday_1focus.png`), UX-S-11 (queue 17 to 17).

## Mission 6: Break it

What worked
- Six concrete attempts, each refused by a named control; the fastest way to make the guardrail story tangible.

Findings: UX-S-02 (two Try buttons under the card, run stopped at 4 of 6), UX-S-20 (starts at the top of a long register; the Break it tab is below the fold), UX-S-29.

## Mission 7: Two seats

What worked
- The second window opens in 4 seconds, the seat bar says which seat this is, and an invoice hold in Operations arrived in Finance as an inbox item and notification within 3 seconds (`m_two_seats_5arrival.png`).

Findings: UX-S-05 (inbox approvals never cross), UX-S-08 (step 1 ticks at 0:00), UX-S-16 (Operations seat opens as the CFO persona), UX-S-17 (bookkeeping noise crosses).

## Facilitator console

What worked
- Coaches without narrating: "Where the buyer is", "Next good nudge" with one button, "Claim to land" that appears only after the checkpoint, Recover and Skip turning primary when the buyer is stuck (`c_coach_42.png`), and a time-stamped feed. Nudge and Recover worked first time.
- The empty state lets the presenter start a mission in the buyer window from the console.

Findings: UX-S-13, UX-S-30.

## Leave-behind story

What worked
- One printable page: the job, what you did with timestamps, what moved with the rule, what you saw for yourself, what it would mean at the buyer's company, and honest labels (`s_cfo_invoice_story.png`).

Findings: UX-S-26, UX-S-18 (dialog focus and Escape).

## Phone (self-serve link)

What worked
- Showroom home has no horizontal scroll at 390 px; the self-serve link starts the mission by itself.

Findings: UX-S-04 (card 371 of 844 px covers Hold, `ph_4hold.png`), UX-S-15 (break-glass toast over the invoice).

## Brand moment and honesty labels

- The falcon rail is the strongest brand element and the painted panel reads as premium. It collapses to icons whenever the chat opens (studio, self-serve hints), so the brand and the wayfinding disappear mid mission (UX-S-31).
- Labels are thorough: every seeded situation, generated company, coach message ("Simulated coaching from the prototype, not a person"), ripple rule and seat arrival is labeled. Exceptions: claims shown before the thing claimed (UX-S-08) and the Two seats trail chip saying Modeled for a simulated arrival (UX-S-17).

## Findings

### P0: breaks the demo

**UX-S-01 (P0) Self-serve CISO: the coach chat and the card cover the decision.** Evidence: `m_ciso_agent_1req.png`; at the first hint the chat opens on the right and the card moves left, together covering the Approve and Deny columns of the Access requests table; the click on Deny AR-0031 failed and the run ended at 2:09 without success. Heuristic: user control, Fitts. Fix: in self mode do not auto-open the chat; show the hint in the card only, and offer "Open coach" as a link (`mod_s_exp.js` `chatHint`, drop `CHATX.open`). If the chat must open, dock the card inside the chat panel instead of over the content.

**UX-S-02 (P0) The mission card sits on top of the controls it asks for.** Evidence: at 1440 x 900 the Deny button for AR-0031 is at x 1235 under `#expHud` (`p_ciso_2.png`); in Break it the "Pull the kill switch" and "Cross into another tenant" Try buttons were covered and the run stopped at 4 of 6 (`m_break_it_1tab.png`); the studio card covers Closest matches (`p_coo_3.png`). `body.exp-on #view{padding-right:400px}` does not stop wide tables and the studio from running under it. Skill: layout, Fitts. Fix: collapse the card to a slim bar (title, clock, current step) after the brief has been read or on the first click in the page, and expand on hover or tap; or make it a true right column that the page reflows around, including drawers and the studio (`mod_s_exp.css`, `.exp-hud`).

**UX-S-03 (P0) COO mission takes 3:14, over its clock.** Evidence: `paced.log`: studio Auto at Normal speed took 144 s after the buyer had already spent 50 s; console shows "3:14 of 3:00" (`c_coo_journey_end.png`). Rule: 180 seconds. Fix: start the studio at Faster for the mission, or fire `built` as soon as the first robot or agent step is drawn and let the rest finish in the background (`mod_s_exp_missions.js` `coo_journey`, `STUDIO` speed). Add a run test that times Auto at normal speed so lint cannot pass a mission the screen makes too long.

**UX-S-04 (P0) Phone self-serve: the card covers the decision buttons.** Evidence: `ph_4hold.png`, card 371 px of an 844 px screen; the Hold button at y 438 is under the card and the click timed out. Skill: adapt, layout. Fix: on phones render the card as a bottom bar (clock, current step, chevron) that opens as a sheet on tap and closes on the next page tap (`mod_s_exp.css` max-width 700 rule).

**UX-S-05 (P0) Two seats: the action the hint suggests never crosses.** Evidence: seat 2 approved an inbox item; seat 1 had no arrival after 15 s and the mission was stuck at 1:36. Cause: the inbox commits and audits after its 8 second undo window, but Two seats only mirrors audits within 4 seconds of a gesture (`mod_s_exp_seats.js` `byPerson`). An invoice hold, which audits at once, crossed in 3 s. Fix: treat an inbox commit as a person's action (for example a 12 second window, or listen to the inbox decision itself), and say "lands after the 8 second undo" in the seat bar.

### P1: weakens it often

**UX-S-06 (P1) Two different Bring your company flows.** Evidence: the Showroom home button runs `bring()` in `mod_s_exp.js`, an older four-field form ("Four answers build a company", `01_bring_from_home.png`); the three-question dialog (`mod_s_exp_company.js`) is reachable only with `?company=1`; the search palette finds neither (`b_0search.png`). The home also says "About five minutes" while the dialog says "about a minute". Skill: clarify, consistency. Fix: `bring()` calls `PACKGEN.openSetup()`; home copy "About a minute: three questions"; register the setup in the palette index the search actually uses.

**UX-S-07 (P1) "Their company first" holds for one mission of seven.** Evidence: after building Pawprint Veterinary Group, only the COO mission ran on it; the setup offered "Try it in your company: Your Monday, Two seats" and both then said "Runs on the Atlantic Logistics sample: this company has no data for it yet" (`extra.js company` log). Skill: honesty, peak-end. Fix: list only missions that run on the company under "Try it in your company" and show the rest as "Also on the Atlantic Logistics sample"; mark Two seats and Break it as neutral since they need no tenant rows (`neutral` in each mission), and keep PR-36 for releases.

**UX-S-08 (P1) Claims appear before the buyer has seen the thing.** Evidence: Two seats ticks "Open the second seat" and shows its claim at 0:00 because setup's own seat audit matches `/seat/` (`p_two_1.png`); CFO "why" fires on the tab click while the chain renders below the fold (tab at y 873); COO "find" fires when a journey opens while the red steps are below the fold (`p_coo_2.png`); CIO "clear" fires in the same second as "resolve", before the buyer looks. Rule: claims only after seen. Fix: when() checks that the evidence is in the viewport for two seconds (IntersectionObserver on the tab panel, the red step, the clash panel); Two seats waits for a peer in `SEATS.peers()`.

**UX-S-09 (P1) Hints name labels that are not on screen.** Evidence: "Open My inbox from the menu or the bell" (menu says My approvals and Approvals inbox; no bell on desktop); "Open Releases" (screen is "Plan and track releases"; palette search "Releases" shows people and "3 hidden screens", `x_search_releases.png`); "red boxes" (the journey shows red flags on faces). Skill: clarify. Fix: rewrite hints with the exact on-screen labels (`mod_s_exp_missions.js`), add "releases" and "inbox" aliases to search, and unhide the releases screen for the CIO lens during a mission.

**UX-S-10 (P1) Your Monday sends the buyer to a screen that does not count, then asks for a risky approval.** Evidence: sidebar My work, My approvals opens Approvals inbox (`flw_appr`), one of the two screens the mission names, but `decide` only listens for "Inbox:" audits, so the buyer stalls at 1:31; the brief says "Three things are waiting" while the screen says 45; the top item is "Reactivate a break-glass admin account", High risk, and approving it is praised ("You cleared a decision"). Fix: accept decisions on `flw_appr`; seed or sort a low-risk, clearly COO item to the top for the mission; brief "Your inbox has 45 items; the top three are waiting on you today"; let the debrief notice a high-risk approval.

**UX-S-11 (P1) Some ripples show nothing moving, or the wrong direction.** Evidence: CISO deny (the choice most CISOs make) shows 0 to 0 and 41.7 to 41.7 (`p_ciso_4.png`); CIO key result 99.6% to 99.6% painted red with a strike-through (`m_cio_clash_2ripple.png`); Monday queue 17 to 17 and a median wait of 1 h while the screen says 10 h; CFO variance $45K to -$18K reads as a loss. Skill: delight (the aha), clarify. Fix: when before equals after, render "No change" in neutral and add a counterfactual row ("Had you granted: every person's pay records readable by the agent, trust objective 3 points lower", using the mission's own modeled rule); round with one more digit when the change is real but small; label variance "over plan $45K, now under plan $18K" (`mod_s_exp.js` `trailHTML`).

**UX-S-12 (P1) The ripple trail is hidden or in the way.** Evidence: COO trail drawn under the studio panes and barely readable (`m_coo_journey_3built.png`); CISO trail stays open on the next screen and covers the Try it button (`p_ciso_4.png`). Skill: layout, animate. Fix: raise the trail above the studio layer and close it on the next navigation (the card keeps "Show the ripple").

**UX-S-13 (P1) The console does not warn the presenter at the moments that matter.** Evidence: "3:14 of 3:00" in plain text, no colour (`c_coo_journey_end.png`); "Stuck for 40 seconds" and "Hint due: press Auto" fired while the buyer was watching Auto run; "Next good nudge" repeats the hint word for word; "Where the buyer is" shows only the screen name. Fix (`mod_s_exp_console.js`): clock bar with warn at 80% and over states; pause idle detection while a scripted run is playing; a short coaching line separate from the buyer-facing hint (a question to ask, not the answer); show tab and open drawer next to the screen.

**UX-S-14 (P1) The mission card keeps growing.** Evidence: after three checkpoints the card holds brief, three claims and the debrief and fills about 70% of the height (`p_cfo_4.png`); the presenter nudge lands at the bottom, below the checkpoints (`c_coach_buyer_nudge.png`). Skill: distill, cognitive load. Fix: show only the latest claim with a count ("3 seen"); put nudges and hints at the top under the clock; collapse "Done when" after the first checkpoint.

**UX-S-15 (P1) Notifications interrupt the mission.** Evidence: "SR0010575 Access request, Approve, Review" toast over the studio chat Continue (`p_coo_3.png`); "Reactivate a break-glass admin account" over the invoice on the phone (`ph_4hold.png`); CHG0312 toast on Home. Fix: quiet notifications while an experience runs (`INBOX.quietNow`, `R17N`), except those the mission seeds.

**UX-S-16 (P1) The buyer's identity changes between surfaces.** Evidence: chat says "You: Casey, CISO" while the rail says Rina Okafor (`m_ciso_agent_1req.png`); My approvals says "as Casey Rowan (CIO, Portfolio board)" in a COO mission (`m_monday_1focus.png`); the Operations seat window opens with the CFO persona. Fix: the experience sets one persona across chat, page header and the second seat (`mod_s_exp.js` start, `mod_s_exp_seats.js` openSeat passes the persona).

**UX-S-17 (P1) Two seats arrivals are noisy.** Evidence: one hold produced five arrivals; the seat bar showed two "Ownership: assigned owner" rows and not the hold; the debrief says "1 action arrived"; the trail chip says Modeled. Fix: extend `NOISE` to bookkeeping (ownership, downstream effects), show the arrival that came from the click, and use the Simulated chip.

**UX-S-18 (P1) Keyboard and screen reader users cannot follow the mission.** Evidence (`a11y.js`): focus stays in the page at start; the card is not reached in 80 Tab presses (appended at the end of the body); no live region announces a checkpoint or a ripple; the leave-behind dialog does not take focus and Escape does not close it. WCAG 2.1.1, 2.4.3, 4.1.3. Reduced motion is respected. Fix: a shortcut and skip link to the card, `aria-live="polite"` for checkpoint ticks and the trail heading, focus into the story sheet with Escape to close.

**UX-S-20 (P1) Every mission starts on Home.** Evidence: CIO and Monday have no Home chip for their screen; Break it starts at the top of a long register with the Break it tab below the fold. Fix: a mission `go` to the module's first screen when finding the screen is not the job (CIO to releases, Break it to its tab), keeping Home only where the Home chip is part of the story (CFO, COO, CISO).

**UX-S-21 (P1) CIO: the clash is hard to find and the move is hard to reach.** Evidence: two releases have hard clashes (REL-2610, REL-2614) and only REL-2610 counts; REL-2610 sits about two screens down; "Move to first clear day" took eight scrolls inside the release. Fix: accept either clashing release, or seed one; put the move action at the top of the release drawer.

### P2: polish

**UX-S-19 (P2) CISO steps can finish out of order.** The guardrail step ticked while "Decide the request" was still open, so the card showed step 3 done and step 2 open. Fix: hold later checkpoints until earlier ones are done, or say "in any order".

**UX-S-22 (P2) COO ripple is too large to believe.** One process moved "Improve editor and reviewer experience" from 25 to 42.5 points. Fix: cap the modeled jump (for example 5 points, like the CFO rule) and state it.

**UX-S-23 (P2) Showroom home asks too much before the first click.** Experiences start at y 366 below the hero and four tabs; 7 roles, 5 companies and cards with three buttons each; every card has a primary "Start with a presenter". Fix: one sentence and one primary action per step; secondary buttons quiet; move "Copy self-serve link" into a menu.

**UX-S-24 (P2) Setup result details.** Three primary buttons in a row; Pawprint Veterinary Group is called "a health system" with patients and beds; every build reuses the id `yourco` and silently replaces the previous company. Fix: one primary; industry text from the matched pack's noun ("a veterinary group, built on the healthcare sample"); say "This replaces Harborview Clinics" before building.

**UX-S-25 (P2) Escaped quote shows in the studio chat.** Evidence: `p_coo_3.png`, "Review the draft and vote on changes&quot;". Fix: decode before rendering the request bubble.

**UX-S-26 (P2) The leave-behind is a text sheet.** The peak of every mission is the visual trail, but the story lists it as bullets and ends with a footer. Fix: render the trail in the story, add one line "Try next: <the next mission for this role>", and drop claims that were skipped or fired before seen.

**UX-S-27 (P2) "Done when, and what is simulated" opens by default.** It doubles the reading at start. Fix: closed by default with the simulated chip visible in the summary line.

**UX-S-28 (P2) "Approve invoices" appears twice in the Money and contracts menu** (`p_cfo_3.png`).

**UX-S-29 (P2) Guardrails has both "Try to break it" and "Break it" tabs.** Fix: one name, or "Try one" and "Free play".

**UX-S-30 (P2) Console empty state says "Following the buyer's window" when no buyer is running** (`ph_6console.png`). Fix: "Waiting for the buyer's window" until a state arrives.

**UX-S-31 (P2) The falcon rail collapses to icons whenever the chat opens.** Brand and wayfinding vanish in the studio and self-serve. Fix: keep the rail labeled during experiences, or open the chat as an overlay.

**UX-S-32 (P2) Self-serve chat keeps the previous mission's state.** The CISO coach thread shows the COO "Building: Build the process" banner. Fix: reset the chat build banner on `EXP.start`.

## Counts

P0: 5 (UX-S-01 to UX-S-05). P1: 15 (UX-S-06 to UX-S-18, UX-S-20, UX-S-21). P2: 12 (UX-S-19, UX-S-22 to UX-S-32). Total 32.

## Ten highest-value fixes

1. UX-S-02 and UX-S-04: collapse the mission card to a slim bar (desktop) and a bottom bar (phone) so it never covers the controls (`mod_s_exp.css`, `mod_s_exp.js`).
2. UX-S-01: self-serve hints stay in the card; do not auto-open the chat (`mod_s_exp.js` `chatHint`).
3. UX-S-03: bring the COO mission under 180 s (studio Faster or fire on the first robot or agent step) and add a timed test (`mod_s_exp_missions.js`, `tools/tests/exp.js`).
4. UX-S-05: let inbox decisions cross Two seats after the undo window (`mod_s_exp_seats.js`).
5. UX-S-08: claims fire only when the evidence is in view; Two seats waits for a real peer (`mod_s_exp_missions.js`, `mod_s_exp_seats.js`).
6. UX-S-09 and UX-S-20: hints use on-screen labels, search finds Releases and the inbox, and CIO and Break it start on their screen.
7. UX-S-10: Monday accepts decisions on Approvals inbox, leads with a low-risk item and matches its brief to the count.
8. UX-S-11 and UX-S-12: ripples never show a flat or red no-change; add the counterfactual for a denial; trail above the studio and closed on the next screen.
9. UX-S-06 and UX-S-07: one Bring your company flow from the Showroom home, and "Try it in your company" lists only missions that run on it.
10. UX-S-13 and UX-S-15: console clock warning, no false stuck during scripted runs, a coaching line separate from the hint, and quiet notifications during experiences.
