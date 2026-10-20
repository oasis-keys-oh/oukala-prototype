# Mobile content audit, Round 17 (Agent O2)

Method: `r17_mobile_content.js` loads every one of the 169 screens in Chromium (isMobile, hasTouch) and inspects the contents of `#view`. Widths 390, 360 and 430 were run; tables below are for 390 unless stated. "Before" is the R16 build (out_v16g); "After" adds mod_r17o2_content.js/.css (and a one-line phone default in mod_r16k_trace.js).

Note on document overflow: #view already uses overflow-x:clip, so the document never scrolls sideways. That hides content that is cut off instead of fixing it, so the audit counts elements that extend past the viewport outside a scroll container ("wide"). That is the real overflow number.

## Counts at 390px

| Pattern | Before | After | Screens before | Screens after |
|---|---:|---:|---:|---:|
| Document-level horizontal overflow (screens) | 0 | 0 | | |
| Elements wider than the viewport (clipped, outside scroll containers) | 90 | 0 | 3 | 0 |
| Text elements under 12px | 4669 | 15 | 162 | 3 |
| Tap targets under 44x44 | 14 | 0 | 1 | 0 |
| Tables | 124 | 124 | 100 | 100 |
| Tables wider than the screen | 123 | 85 | 99 | 78 |
| Fixed-width canvases / SVGs | 7 | 6 | 7 | 6 |
| Horizontal scroll containers with overflow | 503 | 340 | 161 | 158 |
| Nested vertical scroll regions over 200px | 59 | 55 | 56 | 52 |
| Inputs under 16px font | 0 | 0 | 0 | 0 |
| Sticky or fixed elements inside the view | 35 | 35 | 5 | 5 |

## Counts at 360px

| Pattern | Before | After | Screens before | Screens after |
|---|---:|---:|---:|---:|
| Document-level horizontal overflow (screens) | 0 | 0 | | |
| Elements wider than the viewport (clipped, outside scroll containers) | 102 | 1 | 7 | 1 |
| Text elements under 12px | 4669 | 12 | 162 | 2 |
| Tap targets under 44x44 | 14 | 0 | 1 | 0 |
| Tables | 124 | 124 | 100 | 100 |
| Tables wider than the screen | 124 | 85 | 100 | 78 |
| Fixed-width canvases / SVGs | 10 | 6 | 8 | 6 |
| Horizontal scroll containers with overflow | 509 | 342 | 161 | 159 |
| Nested vertical scroll regions over 200px | 59 | 55 | 56 | 52 |
| Inputs under 16px font | 0 | 0 | 0 | 0 |
| Sticky or fixed elements inside the view | 35 | 35 | 5 | 5 |

## Counts at 430px

| Pattern | Before | After | Screens before | Screens after |
|---|---:|---:|---:|---:|
| Document-level horizontal overflow (screens) | 0 | 0 | | |
| Elements wider than the viewport (clipped, outside scroll containers) | 92 | 3 | 3 | 1 |
| Text elements under 12px | 4669 | 18 | 162 | 3 |
| Tap targets under 44x44 | 14 | 0 | 1 | 0 |
| Tables | 124 | 124 | 100 | 100 |
| Tables wider than the screen | 123 | 85 | 99 | 78 |
| Fixed-width canvases / SVGs | 7 | 5 | 7 | 5 |
| Horizontal scroll containers with overflow | 488 | 325 | 161 | 158 |
| Nested vertical scroll regions over 200px | 59 | 55 | 56 | 52 |
| Inputs under 16px font | 0 | 0 | 0 | 0 |
| Sticky or fixed elements inside the view | 35 | 35 | 5 | 5 |

Tap targets, original method: the first run counted 621 targets under 44px, but 607 of them were the visually hidden radio inputs behind the tab switchers (views()), which are not touchable. The audit now skips them: 14 real targets before (all org chart expand toggles), 0 after.

## Pattern census (before, 390px)

### Small text by element

- `th`: 812
- `span.who`: 690
- `small`: 604
- `span`: 328
- `span.pmode.hum`: 242
- `span.sx-kind`: 234
- `span.pmode.det`: 220
- `span.pmode.mix`: 139
- `i.pre`: 139
- `i.ai`: 139
- `i.hum`: 139
- `button.fchip`: 116

### Small tap targets by element

- `button.org-tg`: 14

### Multi-column grids by element (bar rows and label/value rows are expected; card grids are not)

- `span.fk-h`: 349
- `i.grip`: 89
- `button.lri`: 47
- `li.r16m-ckrow`: 39
- `div.need.logrow`: 38
- `div.kx-br`: 38
- `div.need`: 36
- `div.debt-bar`: 33
- `div.itsm-hr`: 32
- `div.rel-hbr`: 29
- `div.bud-sc`: 28
- `div.svx-bul`: 24

### Table column counts (before)

- 2 columns: 2 tables
- 3 columns: 4 tables
- 4 columns: 10 tables
- 5 columns: 17 tables
- 6 columns: 14 tables
- 7 columns: 17 tables
- 8 columns: 12 tables
- 9 columns: 17 tables
- 10 columns: 13 tables
- 11 columns: 11 tables
- 12 columns: 6 tables
- 14 columns: 1 tables

Only 16 tables have 4 or fewer columns, so the stacked-card pattern was applied up to 6 columns (47 tables); dense tables keep the bordered scroller.

## Worst 30 screens (before), with after values

Score = 5*wide + 0.2*small + 3*taps + 0.2*grids + 20*canvases + 5*nested scroll + 8*wide tables + scrollers + 30 if the page is over 12,000px tall.

| # | Screen | Score | Wide | Small text | Taps | Tables | Canvases | Page height px | After: wide / small / taps / page height |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | org_chart | 523 | 88 | 89 | 14 | 0 | 1 | 2873 | 0 / 0 / 0 / 2759 |
| 2 | trace | 78 | 0 | 179 | 0 | 1 | 0 | 43134 | 0 / 0 / 0 / 6720 |
| 3 | strat_exec | 78 | 0 | 179 | 0 | 1 | 0 | 43134 | 0 / 0 / 0 / 6720 |
| 4 | kcs_viz | 73 | 0 | 125 | 0 | 1 | 0 | 25145 | 0 / 0 / 0 / 25157 |
| 5 | tbm_model | 59 | 0 | 28 | 0 | 2 | 1 | 4060 | 0 / 0 / 0 / 4121 |
| 6 | itsm_rel | 57 | 1 | 49 | 0 | 1 | 1 | 9208 | 0 / 0 / 0 / 9217 |
| 7 | exe_mat | 55 | 0 | 65 | 0 | 3 | 0 | 8465 | 0 / 0 / 0 / 8208 |
| 8 | bc_home | 49 | 0 | 49 | 0 | 4 | 0 | 5812 | 0 / 0 / 0 / 9199 |
| 9 | fin_spend | 47 | 0 | 41 | 0 | 4 | 0 | 4998 | 0 / 0 / 0 / 6425 |
| 10 | r16g_perm | 44 | 0 | 73 | 0 | 3 | 0 | 6520 | 0 / 0 / 0 / 11382 |
| 11 | itsm_inc | 44 | 0 | 116 | 0 | 1 | 0 | 5993 | 0 / 6 / 0 / 5885 |
| 12 | nav_studio | 44 | 0 | 8 | 0 | 1 | 0 | 15315 | 0 / 0 / 0 / 7639 |
| 13 | itom_model | 41 | 0 | 70 | 0 | 2 | 0 | 4434 | 0 / 0 / 0 / 7775 |
| 14 | zevt | 41 | 0 | 4 | 0 | 1 | 0 | 12198 | 0 / 0 / 0 / 8359 |
| 15 | svc_cat | 40 | 0 | 32 | 0 | 0 | 0 | 13883 | 0 / 0 / 0 / 13156 |
| 16 | itom_slo | 38 | 0 | 58 | 0 | 2 | 0 | 6654 | 0 / 0 / 0 / 7499 |
| 17 | ppl_cap | 37 | 0 | 34 | 0 | 2 | 0 | 4649 | 0 / 0 / 0 / 4403 |
| 18 | itom_health | 37 | 0 | 51 | 0 | 2 | 0 | 5347 | 0 / 0 / 0 / 8319 |
| 19 | ppl_org | 37 | 0 | 34 | 0 | 2 | 0 | 7657 | 0 / 0 / 0 / 10875 |
| 20 | metrics | 35 | 0 | 25 | 0 | 0 | 0 | 17231 | 0 / 0 / 0 / 17138 |
| 21 | itom_evt | 35 | 0 | 34 | 0 | 0 | 1 | 6575 | 0 / 0 / 0 / 6556 |
| 22 | itom_cmdb | 35 | 0 | 62 | 0 | 1 | 0 | 7008 | 0 / 0 / 0 / 6920 |
| 23 | plat_proc | 34 | 0 | 64 | 0 | 1 | 0 | 4616 | 0 / 0 / 0 / 4826 |
| 24 | plat_contract | 31 | 0 | 29 | 0 | 1 | 0 | 9638 | 0 / 0 / 0 / 9466 |
| 25 | kcs_prompt | 31 | 0 | 26 | 0 | 2 | 0 | 3739 | 0 / 0 / 0 / 7877 |
| 26 | grc_home | 31 | 0 | 47 | 0 | 2 | 0 | 4028 | 0 / 0 / 0 / 7993 |
| 27 | agile_art | 30 | 1 | 33 | 0 | 1 | 0 | 6237 | 0 / 0 / 0 / 6198 |
| 28 | svc_oncall | 30 | 0 | 53 | 0 | 1 | 0 | 6960 | 0 / 0 / 0 / 6843 |
| 29 | svc_sla | 28 | 0 | 26 | 0 | 1 | 0 | 7377 | 0 / 0 / 0 / 7107 |
| 30 | svc_360 | 28 | 0 | 33 | 0 | 1 | 0 | 6807 | 0 / 0 / 0 / 6571 |

## Fixes by pattern (mod_r17o2_content.css/.js, all phone-only at max-width 600px)

- Tables: up to 6 columns become stacked label/value cards (data-label injected by an observer; opt out with data-r17-scroll); longer ones stay in a bordered scroller with a sticky first column and the existing edge fade; stacked lists over 24 rows show 20 and a "Show more" button.
- Grids: grid.g2/g3/g4 go to 1 column, tile and stat grids to 2 columns, statrow and tiles to a 2-column grid instead of a sideways strip, 12px gaps.
- Forms: single column, 16px inputs, 44px controls, sticky submit bar.
- Canvases: fit-to-screen toggle on every wide SVG (default fit when it stays readable, otherwise full size and pan); org chart opens as the indented outline; strategy tree opens collapsed.
- Cards: 14px padding, wrapping headings and chips, tap a truncated titled name to read it in full.
- Text: 12px floor (CSS for known classes plus a chunked sweep), heading clamp, 15px body.
- Hover-only controls are visible on touch devices.
