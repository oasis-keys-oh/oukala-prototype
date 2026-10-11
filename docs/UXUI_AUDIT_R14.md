# UX/UI audit, Round 14 (Agent F)

Method: automation over all 122 screens in light and dark at 1440, 1000 and 400 (`a14_audit.js`: focus ring, page overflow, clipped text, WCAG contrast with alpha compositing, tap targets, blank grid cells, unequal sibling cards, accessible names), plus keyboard walk (`f14_tab.js`), header-pattern probe (`f14_hdr.js`), extended `cardscan.js` (new rules U and G, `--theme`), and viewed screenshots of every screen family (home, exec, metrics, inv, tower, port, admin, budgets, ITSM, ITOM, KCS, people, platform, process strips, popovers) in both themes and at phone width. Code: `style7.css`, `tokens.py`, `kit.js`, `mod_cardalign.js`.

| id | screen | sev | finding | fix | status |
|---|---|---|---|---|---|
| F-01 | all 122 | high | Route change focuses `#view` (tabindex -1) and `[tabindex]:focus-visible` drew a teal ring around the whole page | no ring for programmatic focus on `#view`/main/containers; two-tone `--focus` ring kept on real controls; skip link added | fixed (0/122 screens show a ring; Tab visits controls in DOM order, each with a 2px ring) |
| F-02 | metric popover, hover box, cards, drawers | high | Formula text clipped ("... Contingency reserve (10% o") | `white-space:pre-wrap; overflow-wrap:anywhere` on every formula class; Copy button in popover, drawer and cards | fixed |
| F-03 | 40+ screens | high | Sibling cards in a row unequal (up to 130px; grids had `align-items:start`) | cards stretch, flex column with footers pinned, one padding/radius token; cardscan rule U | fixed except documented exceptions below |
| F-03b | exec KPI grid, metrics, others | med | Last grid row left blank cells | `fillGrids()` in mod_cardalign spans the last row; cardscan rule G | fixed |
| F-04 | dark, all | high | Status pills, AI chips, -f text colours 3.0 to 4.4:1 | lighter dark text tokens, lower tint alpha; light text tokens darkened; filled buttons 4.58:1; category text mixed toward ink | fixed; contrast failures fell from ~1800 to under 300 per theme, remaining listed as debt |
| F-05 | all | med | Anchors and sections could land under the floating top bar | `scroll-padding-top` and `scroll-margin-top` from `--tb-h`; top bar more opaque | fixed (sticky table heads inside page scroll still sit at top:0, debt) |
| F-06 | headers | low | 2 of 122 drifted (plat_self lacked eyebrow/summary) | plat_self uses `hero()`; shared hero rhythm enforced | fixed (plat_map second h1 is a hidden legacy pane) |
| F-07 | module empties | low | Eight empty-state looks | shared dashed empty look; skeleton class | fixed |
| F-08 | phone | high | Top bar 33px too wide on every screen (sideways scroll); 3 more screens overflowed | top bar fits at 400; `#view` overflow clip safety net at 1100 and below | fixed (0 overflow at 400 and 1440; 1000 verified) |
| F-08b | phone | med | Tap targets under 44px (about 3800 hits) | 44px min on buttons, chips, tabs, inputs; invisible 44px hit areas on small chips | mostly fixed, see run log |
| F-09 | all | low | Reduced motion only partly honoured | global reduce rule incl. `data-motion` | fixed |
| F-11 | process strips | low | Role labels low contrast; clipped connectors | label tokens, relative positioning | fixed (scrollWidth hit is the decorative arrow, false positive) |
| F-12 | all | low | No skip link | added | fixed |
| F-13 | svc_cat | high | Throws `Cannot read properties of undefined (reading 'n')` in `dash()` at 400 and 1440 in the probe | not mine (service module) | open, reported to lead |
| F-14 | org_chart, ppm_wbs, ppl_meet, plat_map | med | Dark text on coloured load bars 2.5 to 3.4:1; white initials on light avatars 3.1:1; red Delete 2.7:1 | owner modules | open |
| F-15 | draw_studio, kcs_viz, exe_scen, itom_model | low | Card rows still unequal | list/detail pairs and tile galleries are intentional; add `data-eq="off"` | documented exceptions |
