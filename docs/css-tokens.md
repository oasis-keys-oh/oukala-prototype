# CSS tokens and scales

Rule R8: colors, font sizes, radii, spacing, z-index and breakpoints come from tokens. The tokens live in `src/tokens.py`; `src/build.py` injects them as the first stylesheet (light block, then the dark block for `prefers-color-scheme:dark` and `[data-theme="dark"]`). `tools/tests/css_lint.js` (in `npm test`) checks them. This file describes; status and priority live only in the Product Backlog.

## Aliases for names modules used without a definition (CL-18)
| Name | Maps to |
|---|---|
| `--info`, `--info-f`, `--info-s` | `--story`, `--story-f`, `--story-s` |
| `--bad-t`, `--bad-b`, `--warn-t` | `--bad`, `--bad-s`, `--warn` |
| `--mut` | `--muted` |
| `--on-accent` | `--accent-ink` |
| `--card`, `--surface`, `--glass3` | `--glass2` (`--surface` through `--card`) |
| `--glass-b` | `--hair` |
| `--hover` | `--track` |
| `--r17p-dim` | the dark background at 46% (same value as its old fallback) |
| `--gap`, `--gap-lg`, `--sp-5`, `--r17-nav-h` | 16px, 16px, 24px, 84px (the old fallbacks) |
| font names | see below |

## Font stacks (CL-19)
| Token | Value | Aliases kept |
|---|---|---|
| `--font-sans` | "Hanken Grotesk", "Segoe UI", system-ui, sans-serif | `--f-body`, `--sans`, `--font`, `--font-ui`, `--f-ui` |
| `--font-serif` | "Newsreader", Georgia, serif | `--f-disp`, `--serif`, `--font-display`, `--f-head` |
| `--f-mono` | ui-monospace, SFMono-Regular, Menlo, Consolas, monospace | |

Two literal stacks stay on purpose: the italic Georgia numeral in `mod_r20.css` and the system-ui body of one guardrail panel in `mod_r26_guardrails.css`. Moving either to a token changes the face when the web fonts load.

## Z-index layers (CL-23)
| Token | Value | Holds |
|---|---|---|
| `--z-below` | -1 | decorative layers behind content |
| `--z-local` | 0 | stacking inside one component (offsets +1 to +9) |
| `--z-sticky` | 20 | sticky bars, top bar, rail, floating action button |
| `--z-float` | 50 | chat panel, inspectors, anchored popovers, phone tab bar |
| `--z-overlay` | 100 | toasts, banners, sheets, search palette, Showroom bar |
| `--z-drag` | 200 | drag ghosts, picker popovers |
| `--z-modal` | 900 | full-screen previews |
| `--z-top` | 9000 | tenant menu, tooltips, skip link |

A rule that must sit above a sibling in the same layer adds an offset, for example `calc(var(--z-float) + 10)`; every converted value computes to the number it had before. The boot screen (`#oukBoot`, 99999) is written by `build.py` and is outside the list.

## Breakpoints (CL-24)
CSS custom media queries are not available in browsers, so media queries carry the literal values below. Use only these.

| Name | max-width query | min-width query | Notes |
|---|---|---|---|
| phone | `(max-width:700px)` | `(min-width:701px)` | same value as the phone shell in JS (`PHQ` in `mod_r17o1_shell.js`) |
| tablet | `(max-width:900px)` | `(min-width:901px)` | |
| laptop | `(max-width:1100px)` | `(min-width:1101px)` | |
| wide | `(max-width:1500px)` | `(min-width:1501px)` | |

Normalized from 26 max-width and 13 min-width values: 420 to 760 became phone, 800 to 980 tablet, 1000 to 1300 laptop, 1499 to 1700 wide. Queries that also test height (the landscape phone query `(max-height:500px) and (max-width:950px)`, `(max-height:620px)`) keep their values because they mirror `PHQ`. Layout moves only for viewports between an old and a new value (for example 600 to 700 px, 760 to 900 px); at 400 px and 1440 px every query matches as before.

JS checks that still use other widths (to align with the list above, JS stream): `matchMedia` 520, 600, 640 and 760 px and `innerWidth` 600, 640, 760, 1000, 1250 px in `kit2.js`, `mod_chat.js`, `mod_inbox.js`, `mod_draw2.js`, `mod_nav.js`, `mod_plat_atlas.js`, `mod_org2.js`, `mod_plat_modmap.js`, `mod_plat_proclib.js`, `mod_r16i_core.js`, `mod_r16k_trace.js`, `mod_r17o2_content.js`, `mod_r16k_fix.js`, `mod_r17n_notify.js`, `mod_r17p_b_engine.js`, `mod_r18a_shell.js`, `mod_r25_b_studio.js`, `mod_svc360.js`, `screens3.js`, `ui.js`.

## Type scale (CL-20)
`--fs-2xs` 11px, `--fs-xs` 12px, `--fs-sm` 13px, `--fs-md` 15px, `--fs-lg` 18px, `--fs-xl` 22px, `--fs-2xl` 28px, `--fs-3xl` 38px.

First pass: the 10 largest CSS files that set font sizes (`mod_r20`, `mod_flow`, `mod_people`, `style`, `mod_itsm`, `mod_r26_guardrails`, `mod_plat_atlas`, `style4`, `mod_svc`, `mod_r18`; `style5.css` holds only inline images). A literal size that equals a step now reads the token (335 declarations, `font-size` and the `font` shorthand), so nothing moves. Left in those files: 274 sizes that sit between steps (8 to 10.5, 11.5, 12.5, 13.5, 14, 14.5, 16, 17, 19, 20, 24, 26, 30 px and larger display sizes). Moving them onto the scale changes text size by 0.5 to 2 px and wrapping, so it needs a visual review per screen (the next pass, with screenshots).

## Radius scale (CL-21)
| Token | Value | Literals mapped |
|---|---|---|
| `--rad-xs` | 4px | 3, 4, 5 px |
| `--rad-sm` | 6px | 6, 7 px |
| `--rad-md` | 8px | 8, 9 px |
| `--rad-lg` | 10px | 10, 11 px |
| `--rad-xl` | 12px | 12, 13 px |
| `--rad-card` | 14px | 14 px (same value as `--r2`) |
| `--rad-2xl` | 16px | 16 px |
| `--rad-3xl` | 18px | 18 px |
| `--rad-panel` | 22px | 22 px (same value as `--r`) |
| `--rad-pill` | 999px | 99, 999, 9999 px |
| `--rad-round` | 50% | 50% |

1,782 literal radii now use the scale (all sides of shorthands included). 122 of them moved by 1 px (3, 5, 7, 9, 11, 13 px) and 343 pill radii went from 99 to 999 px, which looks the same on anything under 198 px tall. Left as literals (124): 20, 24, 26, 28, 30, 36 px on large panels and sheets and 1 to 2 px on hairline bars; each is 2 px or more from a step, so moving it is a visible change for review. `css_lint.js` keeps the count from rising.

## Shared primitives and keyframes (CL-25)
- Core `:root` custom properties (`--r`, `--r2`, `--railw`, `--ease`, `--card-pad`, `--card-gap`, `--tb-h`, `--sp-1` to `--sp-4`) moved from style.css, style7.css and style8.css into `tokens.py`. Overrides later in the cascade (phone `--tb-h`, collapsed rail `--railw`) are unchanged.
- View switcher (`.views` tabs 6 to 20): one copy in style4.css; the copies in mod_rel, mod_exec, mod_mat, mod_ppm, mod_oncall and mod_sla (15 rules) are gone.
- Screen-reader utility `.sr`: one copy in style.css (copies in mod_dec and mod_r16i_portal removed).
- Fast screen entry (`.screen.kfast` and `@keyframes kfastIn`, plus its reduced-motion rule): one copy in style.css instead of four (mod_admin, mod_kcs, mod_kgx, mod_viz).
- Keyframes `rise` and `edgeflow` were each declared twice; the first copy (style.css) never applied, because the last declaration of a name wins. The dead copies are gone.
- Same-file exact duplicates removed (earlier copy): mod_ppm, mod_oncall, mod_itsm (3), mod_org (2), mod_r17u.
- Candidates left for a later pass (same frames under different names; renaming touches animation names that JS may set): `flwpulse`/`pplpulse`, `nxfade`/`r17n-fade`/`vzIn`/`vzneed`/`wfdPlus`, `inbx-count`/`r17n-count`, `ct-in`/`vzin`, `mm-dash`/`plk-flow`, `r17pdflow`/`r17t-flow`, `jdraw`/`r26draw`, `svxflow`/`vzdash`. `.chip`, `.btn`, `.card` and `.tile` have one base rule each (style.css); the later rules that name them are deliberate refinements (focus, press, equal heights), not copies.

## Hex colors (CL-22)
Hex colors are allowed only in `src/tokens.py`. Module CSS went from 416 to 220 hex literals. Rules for the mapping (no new colors):
- Two neutrals that modules used as literals are now constants in `tokens.py`: `--white` (#FFFFFF, 134 uses) and `--black` (#000000, 24 uses). They keep the same value in both themes, like the palette steps `--p1` to `--u4`.
- A rule that applies in both themes maps only to a constant token (palette step, `--white`, `--black`), so neither theme changes more than the color distance. A rule that applies only in dark (or only in light) may also map to a themed token by its value in that theme.
- A color maps when the nearest token is within CIE76 dE 8 (a just noticeable to small difference; 37 declarations moved by dE 2.3 to 7.7). Alpha hex (#RRGGBBAA) becomes `color-mix(in srgb, var(--token) N%, transparent)`.

Not mapped (nearest token too far, or a deliberate value):
- `mod_r27_prefs.css` (29): light-mode contrast overrides. They are darker than the tokens on purpose (WCAG AA on tinted chips); mapping them to `--good`, `--warn` or `--bad` would lower contrast. Proposed: contrast ink tokens (`--good-ink`, `--warn-ink`, `--bad-ink`, `--muted-ink`) in `tokens.py` with these values.
- `mod_r26_guardrails.css` (54): the sample citizen app mockup (`.r26-app`, its own neutral palette) and the guardrail lane colors (change, sign, masked). Proposed: lane tokens.
- `mod_r20.css`, `mod_r18.css`, `mod_r21.css` (66): the dark hero gradient stops and the hero metric colors. Proposed: hero tokens.
- The rest: chart and status hues with no near step.

| File | Left | Colors (nearest token and distance, CIE76 dE) |
|---|---|---|
| `mod_r26_guardrails.css` | 54 | #1b2a33 (--black dE 18), #1d4ed8 (--u3 dE 44), #1d6f8a (--p1 dE 12), #2a9d6f (--s4 dE 15), #4b5bd6 (--u3 dE 38), #4f5b64 (--p1 dE 28), #6d28d9 (--u1 dE 38), #7b8790 (--p3 dE 22), #7c4dff (--u1 dE 44), #999999 (--p6 dE 24), #9aa5ab (--p6 dE 18), #9aa8b0 (--p6 dE 17), #c0366a (--e4 dE 25), #cccccc (--white dE 18), #d7dee3 (--white dE 12), #d9921a (--w3 dE 21), #dddddd (--white dE 12), #e4eaee (--white dE 8) |
| `mod_r20.css` | 42 | #06222a (--black dE 16), #0b2140 (--black dE 26), #1a0f35 (--black dE 29), #1d0c3a (--black dE 35), #1d426a (--p1 dE 35), #2c6fb5 (--p1 dE 35), #63d3df (--p5 dE 10), #6a4cd6 (--u3 dE 32), #6a4de0 (--u3 dE 36), #7fdc9c (--s4 dE 19), #8aa2a9 (--p6 dE 17), #8fe3a8 (--s4 dE 21), #9a6bff (--u3 dE 34), #a597c6 (--u4 dE 32), #a6ecf4 (--p6 dE 11), #a9bec4 (--p6 dE 11), #aef0c3 (--s4 dE 29), #b9aad8 (--p6 dE 31), #bfeff5 (--p6 dE 13), #c3b7dd (--p6 dE 27), #c9a8ff (--u4 dE 26), #d6e2e6 (--white dE 12), #f0c46a (--w3 dE 25), #f1ecfb (--white dE 10), #f3cd7c (--w3 dE 30), #f6f1ff (--white dE 8), #f8da98 (--white dE 38), #ff8f86 (--e4 dE 18), #ff9a92 (--e4 dE 23), #ffb9b3 (--white dE 33) |
| `mod_r27_prefs.css` | 29 | #000000, #0b6475, #14532a, #2c6676, #2f393d, #3d474c, #3f4b50, #4d5a60, #59666b, #5c6a70, #6b3f00, #6b4000, #6b4f00, #7a3f7a, #8a1f2a, #8f1020, #9c1424, #9c2530, #ffffff |
| `mod_r18.css` | 13 | #06222a (--black dE 16), #0a202a (--black dE 15), #0c2630 (--black dE 18), #0d2833 (--black dE 19), #123642 (--black dE 25), #63d3df (--p5 dE 10), #6a4cd6 (--u3 dE 32), #7fdc9c (--s4 dE 19), #8aa2a9 (--p6 dE 17), #a9bec4 (--p6 dE 11), #b9ccd2 (--p6 dE 11), #f0c46a (--w3 dE 25), #ff8f86 (--e4 dE 18) |
| `mod_r21.css` | 11 | #07111f (--black dE 12), #1c7a45 (--s3 dE 19), #8fe3a8 (--s4 dE 21), #a8741a (--w3 dE 37), #b3261e (--e1 dE 23), #f6cf7a (--w3 dE 28), #ff9a92 (--e4 dE 23) |
| `mod_r17q_a.css` | 9 | #0b5c6b (--p1 dE 18), #1c1c1c (--black dE 10), #1f7a3a (--s3 dE 14), #555555 (--p1 dE 34), #888888 (--p3 dE 28), #b26a00 (--w1 dE 38), #bbbbbb (--p6 dE 19), #dddddd (--white dE 12) |
| `mod_r17t.css` | 8 | #5a44d8 (--u1 dE 37), #6a4fe0 (--u3 dE 35), #8a74ff (--u3 dE 36), #9a87ff (--u4 dE 31), #b3a6ff (--metric dE 28) |
| `mod_r16j_e_dash.css` | 6 | #1a8a4a (--s3 dE 12), #b8860b (--w3 dE 26), #c0392b (--e1 dE 24) |
| `mod_org.css` | 5 | #1d6f8a (--p1 dE 12), #4f5f68 (--p1 dE 26), #9a5b00 (--w3 dE 45), #ffc46b (--w3 dE 23) |
| `mod_r17u.css` | 5 | #1a4fb4 (--u4 dE 41), #444444 (--black dE 29), #555555 (--p1 dE 34), #bbbbbb (--p6 dE 19), #cccccc (--white dE 18) |
| `mod_r16m_a_core.css` | 4 | #14171c (--black dE 9), #1f6f78 (--p1 dE 13), #64748b (--p1 dE 22) |
| `mod_r17n_notify.css` | 4 | #2e9d5b (--s3 dE 12), #4a7bd0 (--u4 dE 39), #d04040 (--e4 dE 17), #d98a1a (--w1 dE 25) |
| `mod_r25_b_studio.css` | 4 | #0c6074 (--p1 dE 17), #2a1146 (--black dE 40), #5b4bd6 (--u3 dE 35), #e6d2ff (--white dE 28) |
| `mod_r32_orgprop.css` | 4 | #0c6074 (--p1 dE 17), #7a3fd0 (--u1 dE 28) |
| `mod_wbs.css` | 3 | #a8650a (--w3 dE 41), #c0182f (--e1 dE 22) |
| `style7.css` | 3 | #0e6478 (--p1 dE 15), #16262b (--black dE 16), #b00d1b (--e1 dE 22) |
| `mod_oncall.css` | 2 | #1a1a1a (--black dE 9) |
| `mod_r32_num_b.css` | 2 | #c89b3c (--w3 dE 26), #d8dce6 (--white dE 13) |
| `mod_svc.css` | 2 | #10252b (--black dE 16), #4a5d63 (--p1 dE 26) |
| `mod_flow.css` | 1 | #cfe9d6 (--white dE 17) |
| `mod_r15f1_a_store.css` | 1 | #c0392b (--e1 dE 24) |
| `mod_r16j_b_picker.css` | 1 | #c98a00 (--w3 dE 23) |
| `mod_r17o1_shell.css` | 1 | #c0182d (--e1 dE 21) |
| `mod_r28_brand.css` | 1 | #0c1f2e (--black dE 17) |
| `mod_r32_brand.css` | 1 | #34d17f (--s4 dE 26) |
| `mod_r32_tenant.css` | 1 | #112233 (--black dE 18) |
| `style.css` | 1 | #16262b (--black dE 16) |
| `style2.css` | 1 | #1a1200 (--black dE 11) |
| `style4.css` | 1 | #7a1f7a (--u3 dE 16) |

## mod_r20.css audit (CL-28)
Prototype fact, measured 2026-10-20 with `tools/tests/css_coverage.js` (CSS rule coverage while all 195 screens open in turn, light, dark and 400 px).
- Size: 183,370 characters, of which 169,932 (93%) are one inline JPEG, the rail background (`--r20-img`). The rules themselves are about 13.4 KB.
- 100 rules: 58 matched on at least one screen. The other 42 (5.3 KB) matched nothing, but every one of them styles something that opens or changes on interaction: the profile, View as, lens, New and inbox popovers, the chat dock, hover and focus tooltips (`.r20-pi`, `.r20-ico`), the quiet-mode silence menu (`#r21SilMenu`), the open notification layer, the favorites accordion, roadmap level states. Their class and id names are all written by scripts.
- Dead rules moved out: none. The rule for this row was to move only rules that coverage shows unused and that cannot match; no rule in mod_r20.css meets both, so nothing went to `tools/scratch/css-dead/`.
- The size win is the image: serve it as a file (`hero/` already ships next to `index.html`) and reference it with `url(hero/...)`. That needs a new file under `src/assets/hero/` (build territory), so it is a proposal. The file has no JS counterpart; its rules belong to the shell, lens, chat, inbox and persona-home modules and can be moved to those files when they are renamed (CL-29).

## Round-named CSS files: proposed domain names (CL-29)
Not renamed in the CSS stream: a module is a `.js` and `.css` pair with one name in `src/modules.json`, and the JS file and `modules.json` belong to the JS streams. Rename both files of a pair in one commit and change the entry in `modules.json` in place: the cascade follows `modules.json` order, not file names (CL-16), so a rename in place changes nothing on screen. `mod_s_<domain>` follows docs/ARCHITECTURE.md section 2; where a `mod_s_` name already exists, the proposal says so.

| Current | Pair | Proposed | What it styles |
|---|---|---|---|
| `mod_r15b_pick` | js | `mod_s_picklist` | person picklist |
| `mod_r15d` | css only | `mod_s_agent_front` | agent strip and front-door panels (pairs with `mod_r15d_*.js`) |
| `mod_r15f1_a_store` | js | `mod_s_entity_store` | entity store screens |
| `mod_r15f2_a_shell` | js | `mod_s_record_shell` | shared record shell |
| `mod_r15f2_b_grc` | js | `mod_s_grc` | GRC suite |
| `mod_r15f3_0` | js | `mod_s_suite_shared` | shared suite styles (prefix r3-) |
| `mod_r15f3_mobile` | js | `mod_s_mobile_approvals` | mobile approvals and on-call |
| `mod_r16g_perm` | css only | `mod_s_permissions` | permissions screen |
| `mod_r16h` | css only | `mod_s_approval_tree` | approval tree, status catalog, CI ownership |
| `mod_r16i_core` | js | `mod_s_page_header` | page-header actions, favorites, star menu |
| `mod_r16i_notif` | js | `mod_s_notify_center` | notification center |
| `mod_r16i_portal` | js | `mod_s_portal` | portal and employee view |
| `mod_r16j_b_picker` | js | `mod_s_picker` | scalable picker |
| `mod_r16j_d_admin` | js | `mod_s_admin_scale` | admin studio at scale |
| `mod_r16j_e_dash` | js | `mod_s_dashboard_builder` | dashboard layout, chart builder |
| `mod_r16k_fix` | js | `mod_s_layout_fixes` | layout fixes |
| `mod_r16k_trace` | js | `mod_s_strategy_exec` | strategy to execution |
| `mod_r16l_a` | css only | `mod_s_resilience` | resilience group |
| `mod_r16m_a_core` | js | `mod_s_setup` | implementation and setup |
| `mod_r17n_notify` | js | `mod_s_notify_layer` | notification layer |
| `mod_r17o1_shell` | js | `mod_s_phone_shell` | phone and tablet shell |
| `mod_r17o2_content` | js | `mod_s_phone_content` | phone content patterns |
| `mod_r17p` | css only | `mod_s_tour` | tour |
| `mod_r17q_a` | css only | `mod_s_value` | value realized, how it was built |
| `mod_r17r_impact` | js | `mod_s_impact_picker` | impact picker |
| `mod_r17r_procdiagram` | js | `mod_s_proc_diagram` | process diagram |
| `mod_r17r_tables` | js | `mod_s_tables` | flat connected tables |
| `mod_r17s` | css only | `mod_s_rules_scripts` | rules and scripts |
| `mod_r17t` | css only | `mod_s_actors` | human and AI actors |
| `mod_r17u` | css only | `mod_s_benefits_dash` | benefits tool and dashboards |
| `mod_r18` | css only | `mod_s_make_work_oversee` | Make, Work, Oversee shell, builds, lenses |
| `mod_r20` | css only | `mod_s_rail_lenses` | rail image, lenses, roadmap (see CL-28) |
| `mod_r21` | css only | `mod_s_persona_home` | persona landing pages |
| `mod_r24_hero` | js | `mod_s_hero` | painted hero |
| `mod_r25_b_studio` | js | `mod_s_build_studio` | build studio |
| `mod_r25_c_flat` | js | `mod_s_flat` | flat interface |
| `mod_r26_guardrails` | css only | `mod_s_guardrails_studio` (`mod_s_guard` exists for the register) | guardrail building visuals |
| `mod_r27_prefs` | js | `mod_s_prefs` | preferences and contrast |
| `mod_r28_brand` | css only | `mod_s_brand_logo` | logo |
| `mod_r28_cxo` | js | `mod_s_exec_menu` | executive menu |
| `mod_r28_od` | css only | `mod_s_org_redesign` | org redesign |
| `mod_r30_jmap` | css only | `mod_s_journey_map` | journey maps |
| `mod_r31_jx` | js | `mod_s_journey_trace` | journey map details |
| `mod_r31_jzx` | js | `mod_s_org_assist` | org chart with agent assist |
| `mod_r32_brand` | css only | `mod_s_wordmark` | wordmark |
| `mod_r32_num_b` | js | `mod_s_numbers` | record numbers |
| `mod_r32_orgprop` | js | `mod_s_org_proposals` | recommended agents on the org chart |
| `mod_r32_scrmap_b_screen` | js | `mod_s_screen_map` | Screen map |
| `mod_r32_tenant` | js | `mod_s_tenant_switch` | tenant switcher |
| `mod_r33_showroom` | js | `mod_s_showroom_core` (`mod_s_showroom` exists) | Showroom |

The css-only files can be renamed with a `modules.json` edit alone; that is still outside the CSS stream's files, so they are listed too.

## Capitals (PR-04, CSS part)
Uppercase is for eyebrow labels only: a short label above a heading or a group of items. The 16 rules that keep `text-transform:uppercase`: `.eyebrow`, `.r17p-eb`, `.stu-eb`, the persona hero kicker (`.r21-hero h1`), and the group headings of the rail and menus (`.navgrp`, `.navgd>summary`, `.navsub`, `.nx-fht`, `.pk-g`, `.pk2-g`, `.nw-h`, `.tn-h`, `.r16n-gh`, `.inbx-gh`, `.r27-simple .r27-h`, `.r21-sm-h`).

The other 131 rules (table headers, stat and tile captions, badges, pills, field labels, section labels inside cards) dropped the uppercase and the wide letter-spacing that went with it (130 declarations), so text shows as written, in sentence case. CSS cannot turn text into sentence case, so a label written in capitals or lower case in a script still shows that way; two scripts set capitals inline (`mod_exec.js`, `mod_r17q_c_value.js`, JS stream).

The all-caps metric modals: a popover sits in the DOM inside the chip or label that opens it, so it inherited that label's capitals, tracking and bold weight. `.pop` now starts from body text (`text-transform:none`, normal tracking, body weight); eyebrows inside it stay uppercase.

## Cascade layers and !important (CL-26)
Layer order, declared once at the top of the token block: `@layer base, components, modules, overrides;`. The tokens are in `base`.

Why the rest is not in layers yet: a rule in a later layer beats any rule in an earlier layer whatever its specificity, unlayered rules beat all layers, and for `!important` the order flips (earlier layers win). Today the cascade between style*.css and module files is decided by specificity and source order; putting style*.css in `components` and modules in `modules` changes every contest where an earlier file wins by specificity, and each one needs a screenshot review. The plan per file: move a file into its layer only when `css_shots.js` shows no difference, then drop the `!important` that only existed to win against a later file.

This pass removed `!important` where it changes nothing (prototype fact, observed states). `tools/tests/css_important.js` opens all 195 screens in light, dark and 400 px; for each `!important` longhand whose selector matches, it drops the priority, compares the computed value on up to 40 matched elements and puts it back. A declaration lost its `!important` only when it matched on at least one screen, never made a difference, and is not a property that scripts often set inline (display, visibility, position, offsets, transform, sizes, opacity, pointer-events, z-index, overflow; 28 such declarations kept although they made no difference).

| | Count |
|---|---|
| `!important` in source CSS before | 375 |
| removed (matched, no difference anywhere) | 64 |
| kept: made a difference on some screen | 61 |
| kept: never matched (hover, focus, open panels, other tenants) | 218 |
| kept: no difference but a property scripts set inline | 28 |
| left | 311 |

`css_lint.js` fails when the count goes above 311. Risk: a removed declaration could still matter in a state the probe does not reach (after a click, a drag or a resize); the full suite and the screenshot pass found none.
