# 4. Design system and layout rules

One token set drives every color, space, radius and type size in dark and light, and six automated scans keep screens inside it.

The build defines 147 CSS custom properties on `:root`. Components use tokens only; literal hex colors are not allowed in component rules. Values below were read from the computed styles of `out_v16b`.

## 4.1 Color tokens

The default theme follows the system setting; the owner reviews in dark. Contrast is against `--bg`.

| Token | Role | Light | Dark | Contrast light / dark |
|---|---|---|---|---|
| `--bg` | Canvas | #FBFBF9 | #061116 | n/a |
| `--ink` | Body text | #16262B | #E8F3F5 | 15.1 / 16.9 |
| `--muted` | Secondary text | #435860 | #B3C8CD | 7.2 / 11.0 |
| `--faint` | Hints | #5A6E74 | #8CA4AB | 5.2 / 7.3 |
| `--accent` | Links, selected | #0C6074 | #6EBECD | 6.9 / 9.0 |
| `--accent-ink` | Text on filled accent | #FFFFFF | #04222A | 7.1 / 7.8 on accent |
| `--good` | Success text | #0A6A0C | #93D395 | 6.6 / 10.9 |
| `--warn` | Warning text | #7A5400 | #FFBA01 | 6.6 / 11.2 |
| `--bad` | Error text | #B00D1B | #FF9AA2 | 6.9 / 9.5 |
| `--metric` | Metric text | #851085 | #E3B8E3 | 8.4 / 11.1 |
| `--story` | Story text | #0C6074 | #86D0DD | 6.9 / 11.0 |
| `--cardline` | Card border | rgba(22,50,62,.11) | rgba(255,255,255,.13) | n/a |
| `--focus` | Focus ring | #0B5C6E | #8FD3E0 | n/a |

Fill tokens (`--good-f`, `--warn-f`, `--bad-f`, `--metric-f`, `--story-f`) are for bars, dots and swatches, and `-s` tokens are soft tints for pill backgrounds. Every colored mark that carries meaning needs a legend or tooltip. Requirements: see OK-DSGN-nnn.

## 4.2 Spacing, radii and elevation

| Token or value | Size | Use |
|---|---|---|
| `--sp-1` | 8 px | Tight gaps inside a component |
| `--sp-2` | 16 px | Gap between related blocks |
| `--sp-3` | 24 px | Gap between screen sections (`.screen` gap) |
| `--sp-4` | 32 px | Gap between page bands |
| `--card-pad` | 20 px | Card padding |
| `--card-gap` | 18 px | Gap between cards in a row |
| `--r` | 22 px | Cards |
| `--r2` | 14 px | Inner panels, toasts |
| 16 / 12 / 99 / 999 | px | Stat tiles / chips / pills / buttons |
| Drawer / popover | 30 / 26 px | Overlay radius |

Cards use a 1 px `--cardline` border, a 24 px backdrop blur and a two-layer shadow. Two bordered cards may not sit closer than 8 px in any direction.

## 4.3 Type scale and fonts

| Token | Size | Weight token | Use |
|---|---|---|---|
| `--fs-2xs` | 11 px | `--fw-label` 700 | Table headers, eyebrows |
| `--fs-xs` | 12 px | 700 | Pills |
| `--fs-sm` | 13 px | `--fw-ui` 600 | Buttons, chips |
| `--fs-md` | 15 px | `--fw-body` 400 | Body, table cells |
| `--fs-lg` | 18 px | 600 | Section lead-ins |
| `--fs-xl` | 22 px | 500 display | Card titles |
| `--fs-2xl` | 28 px | 500 display | Large figures |
| `--fs-3xl` | 38 px | 500 display | Hero figures |

Body font is Hanken Grotesk with Segoe UI and system-ui fallbacks, line height 1.55 (23.25 px at 15 px). Display font is Newsreader with Georgia fallback, used for h1 (34 px), card titles (22 px) and large numbers (44 px). The monospace token is for code and identifiers only. Money and numbers in tables use tabular lining figures in the body font, never a different family.

## 4.4 Component specifications

| Component | Specification |
|---|---|
| Card | `.card.glass`; padding 20; head holds an h3 and one muted line; footer pinned to the bottom; siblings in a row have equal height |
| KPI tile | `.stat`; padding 12 x 14; radius 16; small label, display number, one sub line; zero values dim unless `keep` is set |
| Metric chip | `fchip`; 12.5 px bold pill; carries `data-k`; hover shows the KPI box with Start, Now, Change and Gap |
| Table | See 4.5 |
| Drawer | 470 wide, inset 16, padding 24, sticky control bar with Full screen and Close; art wash behind content; bottom sheet at 400 px |
| Popover | `min(520px, 100vw - 32)` wide, max 82 percent height, radius 26, padding 22; metric popovers anchor under the chip; formulas wrap with a Copy button |
| Toast | 13 px bold, max 400 wide, radius 14, one action, 32 px close; severity dot uses fill tokens; docked, never floating over content |
| Button | 36 px high, 13 px bold, pill radius; primary uses the accent gradient; one primary per row |
| Chip | 36 px high, radius 12, toggle or filter |
| Pill | 12 px bold, radius 99, status only |
| Tab | `views()` tablist; 13.5 px; one scrollable row up to 20 tabs; `aria-selected` |
| Empty state | Dashed look, one sentence, one action |

## 4.5 Tables

1. Header cells are 11 px, bold, `--muted`; body cells 15 px with padding 13 x 14.
2. Text columns are left aligned. Number, money and percent columns are right aligned (`td.num`) with tabular figures and no wrap.
3. Identifiers do not wrap. Dates and statuses share one style per column.
4. A table sits in `.tscroll` and scrolls sideways at narrow widths. Inside a card it has no border, shadow, fill or vertical scrollbar.
5. Lists that can pass about 200 rows use `btHTML` (virtual rows, sort, search, facets, grouping, CSV export).
6. Each column keeps one font family, size, weight and left padding across rows. Tree rows and signed variance cells are the documented exceptions.

## 4.6 Pickers, chips and pills

Pills and chips stay for small fixed sets. Anything that grows with data uses a picker.

| Case | Control |
|---|---|
| 7 or fewer fixed options | Chips or pills |
| 8 or more options, or data-driven list | `PICKER` (search, keyboard, groups, recent and starred, virtual list) |
| Person | `PICK.person` with name, title, team, cost center; You and Your reports first |
| Filter that can pass 6 values | `PICKER` or `mpHTML` multi-select |
| Tabs, legends, months, stat rows, nav rows | Stay as chips |

`PICKER` row height is 44 px, header 28 px, page 200. At 500 projects, open takes 12 to 119 ms and filtering under 5 ms with at most 11 rows rendered. Fields of type chips or multi with more than 7 options delegate to it. All options come from `LISTS`, 14 lists defined once.

## 4.7 Sliders, zoom and canvases

Every pan and zoom canvas has permanent controls: a vertical and a horizontal slider, a zoom slider with minus, plus, percent and Fit, and an optional Map toggle. Native scrollbars are 12 px wide on all overflow containers (`--sb-size`). Canvases covered: org chart, module map, atlas, drawing studio, workflow designer, ITOM graph, swimlanes. Fit runs on open and on resize, and nothing draws outside the canvas.

## 4.8 Positioning, density and motion

1. Rail and top bar are sticky. The Ask button, drawer, toast dock and bell panel are fixed. Popovers anchor to their trigger.
2. Anchors and sections clear the floating top bar through `scroll-padding-top` from `--tb-h` (84 px).
3. Controls never overlay drawer content; they live in the sticky drawer bar.
4. The default density is comfortable; a tenant may set density in its brand record.
5. Motion uses `--ease` (cubic-bezier .2, .7, .2, 1). Screen entrance is 200 ms; toasts enter in 350 ms; hover lift is subtle.
6. With `prefers-reduced-motion`, all animation and transition durations drop to 0.001 ms and screens do not animate in.
7. Text never uses `overflow-wrap:anywhere` or `word-break:break-all`.

## 4.9 Accessibility targets

| Target | Value |
|---|---|
| Standard | WCAG 2.1 AA |
| Text contrast | 4.5:1 minimum; the token set gives 5.2 or more |
| Focus | Two-tone 2 px ring on every control; no ring on programmatic focus of `#view` |
| Touch targets | 44 px minimum on phones |
| Keyboard | Skip link; DOM-order tab flow; Alt+Arrows for drag and drop; `/` or Ctrl+K for search |
| Structure | Landmarks, labeled controls, `aria-selected` tabs, live regions for inbox and routing |
| Phone | No horizontal page scroll at 400 px |

## 4.10 Automated checks

Run each from the build folder with `NODE_PATH=$(npm root -g)`. Zero findings is the bar before any release.

| Check | Flags | Threshold | Command | Latest |
|---|---|---|---|---|
| `spacescan.js` | Words broken mid-word; tall narrow text; bordered cards closer than 8 px | 0 flagged; narrow means width under 110 px and 4 or more lines | `node spacescan.js OUT [--phone] [--dark] [--w 1100] [--only a,b]` | 0 flagged at Round 16; not rerun on `out_v16b` |
| `cardscan.js` | Sibling card height gap over 3 px (H) or 4 px (U); section offset over 4 px (S); blank last grid row over 40 px (G) | 0 findings; `data-eq="off"` exempts | `node cardscan.js OUT [--w 1440] [--theme dark]` | 8 findings on 2 screens in `out_v16b` |
| `nestscan.js` | Scroll wrapper with border, shadow or fill inside a card; inner vertical scrollbar | 0 findings; `data-scroll="ok"` exempts | `node nestscan.js OUT [--theme dark]` | 0 findings on 169 screens in `out_v16b` |
| `fontscan.js` | Mixed family, size, weight, padding or fill within a table column | 0 findings | `node fontscan.js OUT [--light] [--inner] [--shard i/n]` | Run did not finish; see known gaps |
| `whyscan.js` | "Why" control position drift above 0.6 px, count not 1, title overlap | 0 deviations | `node whyscan.js OUT [--n 40]` | 0 deviations on 30 screens |
| `a14_geom.js` | Org chart connector ends more than 1 px from card edge centers | 72 configurations pass | `node a14_geom.js OUT` | Passed at Round 14; not rerun on `out_v16b` |

Companions: `allscreens.js` (errors, page overflow, empty views), `zlink_walk.js` (dead links), `ci_refs.js` (reference fields declare a target), `j16_enterprise.js` (50 and 500 project scale test).

## Known gaps

1. Off-scale sizes remain: h1 34 px, large number 44 px, buttons 13 px, tabs 13.5 px, metric chips 12.5 px.
2. Contrast failures numbered under 300 per theme at Round 14 and are tracked as debt, including dark text on colored load bars.
3. Phone tap targets under 44 px were counted at 830 in Round 15.
4. Sticky table headers inside page scroll still sit at top 0 under the floating bar.
5. Cardscan reports 8 findings in `draw_studio` (button rows) and `r15d_firstweek` (section offset).
6. The fontscan and geometry runs on `out_v16b` did not finish because the browser closed; rerun them before release.
7. Fonts load from a hosted font service; offline builds fall back to Segoe UI and Georgia.

Register filter: Module=DSGN (all subsections; accessibility rows carry Category=Experience).
