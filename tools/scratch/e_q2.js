(()=>{const o={};const a=ZLINK.audit();const c=id=>a.checks.find(x=>x.id===id);
o.undecl=c('d_undecl').items.map(i=>i.id+': '+i.detail).slice(0,60);
o.ref=c('d_ref_untargeted').items.map(i=>i.id+': '+i.detail);
o.untr=c('d_metric_untraced').items.slice(0,8).map(i=>i.id+' '+i.label+' '+i.detail);
o.inckb=c('inc_kb').items.map(i=>i.label+'|'+i.detail);
o.metrem=c('metric_rem').items.slice(0,4).map(i=>i.label+'|'+i.detail);
o.poline=c('po_line').items.map(i=>i.label+'|'+i.detail);
o.bud=Object.keys(S.bud);o.lines=S.bud.lines.slice(0,3);o.po=S.bud.po.slice(0,2);
o.dead=[...new Set(ZLINK.deadLinks().out.map(d=>d.rel))].map(r=>r+':'+ZLINK.deadLinks().out.filter(d=>d.rel===r).length);
o.lin=Object.keys(LIN);o.ent=Object.keys(ATLAS);o.plat=Object.keys(PLAT);o.kcs=KCSX.items().slice(0,2);o.kcsn=KCSX.items().length;
return o})()
