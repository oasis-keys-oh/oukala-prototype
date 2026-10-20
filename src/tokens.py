# Design tokens injected by build.py ahead of all CSS. Value names and scales: docs/css-tokens.md.
# CL-19: two font stacks, --font-sans and --font-serif (plus --f-mono for code); --f-body, --f-disp, --sans, --serif, --font, --font-ui, --f-ui, --font-display, --f-head stay as aliases.
# CL-23: eight z-index layers (--z-below to --z-top); a rule that must sit above a sibling in the same layer adds an offset: calc(var(--z-float) + 10).
# CL-24: breakpoints (CSS custom media is not available, so media queries use the literal values): phone max 700px, tablet max 900px, laptop max 1100px, wide max 1500px; min-width queries use value+1. docs/css-tokens.md.
# CL-21: radius scale --rad-xs 4px to --rad-panel 22px, plus --rad-pill and --rad-round (50%).
# CL-22: --white and --black are the two neutrals module CSS used as literals (same value in both themes).
# CL-25: the :root custom properties that style.css, style7.css and style8.css declared (radius --r, rail width, easing, card padding, top bar height, spacing) now live here.
# CL-18: the alias line at the end of LIGHT defines names module CSS used without a definition; each maps to an existing token (no new colors).
LIGHT = """
--art-wash:rgba(255,255,255,.78);--art-wash2:rgba(255,255,255,.58);
--white:#FFFFFF;--black:#000000;--p1:#17899F;--p2:#2C92A6;--p3:#419CAE;--p4:#189EB8;--p5:#6EBECD;--p6:#98CDD8;
--w1:#FFBA01;--w3:#FBC430;--e1:#E91224;--e4:#F16470;--s1:#0E7D10;--s3:#3A933C;--s4:#67AA69;--u1:#930E93;--u3:#A53AA5;--u4:#B767B7;
--bg:#FBFBF9;--ink:#16262B;--muted:#435860;--faint:#5A6E74;
--glass:rgba(244,248,250,.78);--glass2:rgba(255,255,255,.94);--edge:rgba(255,255,255,.95);--hair:rgba(22,38,43,.10);--shade:rgba(20,60,76,.11);--cardline:rgba(22,50,62,.11);
--accent:#0C6074;--accent-ink:#FFFFFF;--accent-soft:rgba(23,137,159,.14);
--good:#0A6A0C;--warn:#7A5400;--bad:#B00D1B;--metric:#851085;--story:#0C6074;
--good-f:#2F8132;--warn-f:#FFBA01;--bad-f:#D80F20;--metric-f:#A53AA5;--story-f:#17899F;
--good-s:rgba(14,125,16,.13);--warn-s:rgba(255,186,1,.24);--bad-s:rgba(233,18,36,.12);--metric-s:rgba(147,14,147,.11);--story-s:rgba(23,137,159,.14);
--orb1:rgba(23,137,159,.45);--orb2:rgba(165,58,165,.28);--orb3:rgba(255,186,1,.30);--line-art:rgba(23,137,159,.28);--track:rgba(22,38,43,.10);
--eb-mix:#16262B;--focus:#0B5C6E;--focus-halo:rgba(255,255,255,.9);--dis-ink:#5F7177;--dis-bg:rgba(22,38,43,.06);--fs-2xs:11px;--fs-xs:12px;--fs-sm:13px;--fs-md:15px;--fs-lg:18px;--fs-xl:22px;--fs-2xl:28px;--fs-3xl:38px;--fw-label:700;--fw-ui:600;--fw-body:400;--fw-strong:600;--f-tab:var(--f-body);--font-sans:"Hanken Grotesk","Segoe UI",system-ui,sans-serif;--font-serif:"Newsreader",Georgia,serif;--f-body:var(--font-sans);--f-disp:var(--font-serif);--f-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
--info:var(--story);--info-f:var(--story-f);--info-s:var(--story-s);--bad-t:var(--bad);--bad-b:var(--bad-s);--warn-t:var(--warn);--mut:var(--muted);--on-accent:var(--accent-ink);
--card:var(--glass2);--surface:var(--card);--glass3:var(--glass2);--glass-b:var(--hair);--hover:var(--track);--r17p-dim:rgba(6,17,22,.46);
--font:var(--font-sans);--font-ui:var(--font-sans);--f-ui:var(--font-sans);--sans:var(--font-sans);--serif:var(--font-serif);--font-display:var(--font-serif);--f-head:var(--font-serif);
--z-below:-1;--z-local:0;--z-sticky:20;--z-float:50;--z-overlay:100;--z-drag:200;--z-modal:900;--z-top:9000;
--rad-xs:4px;--rad-sm:6px;--rad-md:8px;--rad-lg:10px;--rad-xl:12px;--rad-card:14px;--rad-2xl:16px;--rad-3xl:18px;--rad-panel:22px;--rad-pill:999px;--rad-round:50%;
--gap:16px;--r:22px;--r2:14px;--railw:268px;--ease:cubic-bezier(.2,.7,.2,1);--card-pad:20px;--card-gap:18px;--tb-h:84px;--sp-1:8px;--sp-2:16px;--sp-3:24px;--sp-4:32px;--gap-lg:16px;--sp-5:24px;--r17-nav-h:84px;
"""
DARK = """
--art-wash:rgba(6,17,22,.80);--art-wash2:rgba(6,17,22,.68);
--bg:#061116;--ink:#E8F3F5;--muted:#B3C8CD;--faint:#8CA4AB;
--glass:rgba(18,42,50,.62);--glass2:rgba(36,74,86,.70);--edge:rgba(255,255,255,.16);--hair:rgba(255,255,255,.10);--shade:rgba(0,0,0,.50);--cardline:rgba(255,255,255,.13);
--accent:#6EBECD;--accent-ink:#04222A;--accent-soft:rgba(110,190,205,.16);
--good:#93D395;--warn:#FFBA01;--bad:#FF9AA2;--metric:#E3B8E3;--story:#86D0DD;
--good-f:#74B876;--warn-f:#FFBA01;--bad-f:#F77F89;--metric-f:#B767B7;--story-f:#6EBECD;
--good-s:rgba(103,170,105,.16);--warn-s:rgba(255,186,1,.15);--bad-s:rgba(241,100,112,.15);--metric-s:rgba(183,103,183,.18);--story-s:rgba(110,190,205,.15);
--orb1:rgba(23,137,159,.55);--orb2:rgba(165,58,165,.38);--orb3:rgba(255,186,1,.16);--line-art:rgba(110,190,205,.22);--track:rgba(255,255,255,.12);
--eb-mix:#FFFFFF;--focus:#8FD3E0;--focus-halo:rgba(6,17,22,.9);--dis-ink:#8FA6AC;--dis-bg:rgba(255,255,255,.06);
color-scheme:dark;
"""
def block():
    return (":root{" + LIGHT.replace("\n","") + "}\n"
      "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){" + DARK.replace("\n","") + "}}\n"
      ":root[data-theme=\"dark\"]{" + DARK.replace("\n","") + "}\n")
