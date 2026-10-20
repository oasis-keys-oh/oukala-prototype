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
