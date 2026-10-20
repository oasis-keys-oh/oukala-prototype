# Mobile shell, Round 17 (agent O1)

Files: `mod_r17o1_shell.js`, `mod_r17o1_shell.css` (source template `r17o1_src/shell.css.tpl`, `@PH@` is the phone media query). All classes and ids are prefixed `r17o1-`. Tests: `r17_mobile_shell.js` (assertions), `r17o1_states.js` (screenshots), `r17o1_geom.js` (desktop geometry diff), `r17o1_build.sh` (build without other agents' in-progress modules). Screenshots: `r17_shots/o1_*.png`.

## Breakpoints
| Mode | Query | Shell |
|---|---|---|
| Phone portrait | `max-width:700px` | Top rail (logo mark, screen title, + New, bell, Ask), bottom tab bar, More sheet, sticky action bar |
| Phone landscape | `max-height:500px and max-width:950px` (844x390) | Same, but the tab bar is a 64px left rail so content keeps its height; sheets slide in from the right (max 560px) |
| Tablet | `701 to 900px wide, height over 500px` | Collapsed icon rail (JS checks `#railCollapse`), full top bar, drawers stay side panels |
| Desktop | above 900px | Unchanged. Existing 901 to 1100 auto-collapse is kept |

Shared edits (all only change the threshold, desktop untouched): `mod_nav.js` (`phoneMQ` now the phone query, was 900px), `mod_nav.css` and `style.css` and `style3.css` (the old `max-width:900px` phone block now uses the phone query), `screens3.js` (renderNav listener), `kit2.js` (auto-collapse now starts at 701px, not 901px, and not on short landscape). Originals are in `r17o1_orig/`.

## Patterns
1. **Bottom tab bar** `#r17o1Tab`: Home, My work (`inbox`), Approvals (badge = same count as the nav badge, falls back to the inbox approval count), Search (opens the existing full-screen palette), More. 64px high, 48px targets, `env(safe-area-inset-*)`. The old rail drawer, `.nx-tab`, floating Ask orb are hidden on phone.
2. **More sheet** `#r17o1Sheet` (full height, handle, swipe down to close, Escape, focus trap, `inert` on the page behind, scroll lock). It holds a live copy of the grouped navigation including the favorites accordion (`NAVX.html()`), History, Clarity lens, Agents, Profile, the role switcher (copy of the persona popover buttons) and the Demo / Enterprise switch (`SCALE.set`). Opening it builds the DOM once per open; nothing runs at startup beyond one small build.
3. **Top rail**: logo mark (goes Home), current screen title, + New, bell, Ask. Search, favorites, history, lens, agents and role move into the sheet. The Ask panel opens as a full-screen sheet.
4. **Page header**: single-line truncated breadcrumb, owner chip wraps to its own line, h1 `clamp(22px,6.6vw,28px)`. Tab bars (`.vsw`, `[role=tablist]`) are one scrollable line, fade edges only on the side that has more, the selected tab is scrolled into view.
5. **Page actions**: when the header has a primary button, it docks in a sticky bar above the tab bar and the other header buttons go behind a "more actions" button (Actions sheet). Originals stay in the DOM (hidden) and the bar proxies clicks, so module handlers keep working.
6. **Sheets**: `#drawer`, every `.pop`, `.nx-pop`, `.nw-pop`, `.pk2-pop`, `.r15-grppop` (Why am I seeing this, + New, pickers, favorites, history, role) become bottom sheets (handle, `dvh`, safe area, swipe down from the top 46px or the sticky header). The drawer is full height with a sticky header that shows the record title; Full screen is hidden. Multi-select pickers (`.mp`) open as a bottom sheet.
7. **Viewport and input**: `viewport-fit=cover` added at runtime, `theme-color` for light and dark (follows an explicit theme choice), 16px minimum on inputs (no iOS zoom), `touch-action:manipulation`, no tap highlight, `overscroll-behavior:none`, 44px minimum on shell controls, `visualViewport` keeps sheets above the software keyboard and hides the bars while typing.
8. **Performance on phone**: glass blur 12px (was 24px), top bar 14px, orbs and contour animation off, no card hover lift, `prefers-reduced-motion` honoured (no sheet transitions).

The published page wrapper (outside this repo) should also carry `viewport-fit=cover`; the module adds it at runtime if absent.

## Verification (out_o117 build, other agents' modules excluded)
- `r17_mobile_shell.js` at 390 and 360: 169 screens, shell tap targets under 44px: 0, shell elements wider than the viewport: 0, page errors: 0.
- Content that sticks out past the viewport inside `#view` (which is `overflow-x:clip`, so the page itself never scrolls sideways): see list below.
- Desktop 1440x900, 10 screens (home, inv, itsm_inc, kg, metrics, fo, tower, plat_data, ppl_org, flw_appr): top bar and 6 of 10 screens have zero geometry or style differences against out_v16g. The remaining differences are live-content timing (formula copy buttons injected lazily, randomized graph layout), not shell rules; a pixel diff is too noisy because the baseline differs from itself.

## Handed to O2 (content offenders at 390 wide)
Only one screen has content wider than the viewport that is not inside a scroll container:
- `itsm_rel`: `SUMMARY.chip` ends at x=416.

Other content notes seen in screenshots (not measured failures):
- `itsm_inc` and other table screens: the filter pill row (Priority picker button) touches the right edge at 390.
- `home`: "Viewing as Executive" text sits over the hero photo with low contrast.
- Notification banners (agent N) cover the landscape tab rail at 844x390; the banner `left` should be at least 80px plus the safe area in landscape.
