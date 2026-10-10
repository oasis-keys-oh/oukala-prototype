LIGHT = """
--art-wash:rgba(255,255,255,.78);--art-wash2:rgba(255,255,255,.58);
--p1:#17899F;--p2:#2C92A6;--p3:#419CAE;--p4:#189EB8;--p5:#6EBECD;--p6:#98CDD8;
--w1:#FFBA01;--w3:#FBC430;--e1:#E91224;--e4:#F16470;--s1:#0E7D10;--s3:#3A933C;--s4:#67AA69;--u1:#930E93;--u3:#A53AA5;--u4:#B767B7;
--bg:#FBFBF9;--ink:#16262B;--muted:#4A5F66;--faint:#7C9298;
--glass:rgba(244,248,250,.78);--glass2:rgba(255,255,255,.94);--edge:rgba(255,255,255,.95);--hair:rgba(22,38,43,.10);--shade:rgba(20,60,76,.11);--cardline:rgba(22,50,62,.11);
--accent:#0F6E82;--accent-ink:#FFFFFF;--accent-soft:rgba(23,137,159,.14);
--good:#0E7D10;--warn:#8A5F00;--bad:#C70F1F;--metric:#930E93;--story:#0F6E82;
--good-f:#3A933C;--warn-f:#FFBA01;--bad-f:#E91224;--metric-f:#A53AA5;--story-f:#17899F;
--good-s:rgba(14,125,16,.13);--warn-s:rgba(255,186,1,.24);--bad-s:rgba(233,18,36,.12);--metric-s:rgba(147,14,147,.11);--story-s:rgba(23,137,159,.14);
--orb1:rgba(23,137,159,.45);--orb2:rgba(165,58,165,.28);--orb3:rgba(255,186,1,.30);--line-art:rgba(23,137,159,.28);--track:rgba(22,38,43,.10);
"""
DARK = """
--art-wash:rgba(6,17,22,.80);--art-wash2:rgba(6,17,22,.68);
--bg:#061116;--ink:#E8F3F5;--muted:#A3BBC1;--faint:#6F8A91;
--glass:rgba(18,42,50,.62);--glass2:rgba(36,74,86,.70);--edge:rgba(255,255,255,.16);--hair:rgba(255,255,255,.10);--shade:rgba(0,0,0,.50);--cardline:rgba(255,255,255,.13);
--accent:#6EBECD;--accent-ink:#04222A;--accent-soft:rgba(110,190,205,.16);
--good:#7FC381;--warn:#FFBA01;--bad:#F16470;--metric:#D7A4D7;--story:#6EBECD;
--good-f:#67AA69;--warn-f:#FFBA01;--bad-f:#F16470;--metric-f:#B767B7;--story-f:#6EBECD;
--good-s:rgba(103,170,105,.20);--warn-s:rgba(255,186,1,.18);--bad-s:rgba(241,100,112,.20);--metric-s:rgba(183,103,183,.22);--story-s:rgba(110,190,205,.18);
--orb1:rgba(23,137,159,.55);--orb2:rgba(165,58,165,.38);--orb3:rgba(255,186,1,.16);--line-art:rgba(110,190,205,.22);--track:rgba(255,255,255,.12);
color-scheme:dark;
"""
def block():
    return (":root{" + LIGHT.replace("\n","") + "}\n"
      "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){" + DARK.replace("\n","") + "}}\n"
      ":root[data-theme=\"dark\"]{" + DARK.replace("\n","") + "}\n")
