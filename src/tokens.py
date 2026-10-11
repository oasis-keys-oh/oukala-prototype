LIGHT = """
--art-wash:rgba(255,255,255,.78);--art-wash2:rgba(255,255,255,.58);
--p1:#17899F;--p2:#2C92A6;--p3:#419CAE;--p4:#189EB8;--p5:#6EBECD;--p6:#98CDD8;
--w1:#FFBA01;--w3:#FBC430;--e1:#E91224;--e4:#F16470;--s1:#0E7D10;--s3:#3A933C;--s4:#67AA69;--u1:#930E93;--u3:#A53AA5;--u4:#B767B7;
--bg:#FBFBF9;--ink:#16262B;--muted:#435860;--faint:#5A6E74;
--glass:rgba(244,248,250,.78);--glass2:rgba(255,255,255,.94);--edge:rgba(255,255,255,.95);--hair:rgba(22,38,43,.10);--shade:rgba(20,60,76,.11);--cardline:rgba(22,50,62,.11);
--accent:#0C6074;--accent-ink:#FFFFFF;--accent-soft:rgba(23,137,159,.14);
--good:#0A6A0C;--warn:#7A5400;--bad:#B00D1B;--metric:#851085;--story:#0C6074;
--good-f:#2F8132;--warn-f:#FFBA01;--bad-f:#D80F20;--metric-f:#A53AA5;--story-f:#17899F;
--good-s:rgba(14,125,16,.13);--warn-s:rgba(255,186,1,.24);--bad-s:rgba(233,18,36,.12);--metric-s:rgba(147,14,147,.11);--story-s:rgba(23,137,159,.14);
--orb1:rgba(23,137,159,.45);--orb2:rgba(165,58,165,.28);--orb3:rgba(255,186,1,.30);--line-art:rgba(23,137,159,.28);--track:rgba(22,38,43,.10);
--eb-mix:#16262B;--focus:#0B5C6E;--focus-halo:rgba(255,255,255,.9);--dis-ink:#5F7177;--dis-bg:rgba(22,38,43,.06);--fs-2xs:11px;--fs-xs:12px;--fs-sm:13px;--fs-md:15px;--fs-lg:18px;--fs-xl:22px;--fs-2xl:28px;--fs-3xl:38px;--fw-label:700;--fw-ui:600;--fw-body:400;--fw-strong:600;--f-tab:var(--f-body);--f-mono:ui-monospace,SFMono-Regular,Menlo,monospace;
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
