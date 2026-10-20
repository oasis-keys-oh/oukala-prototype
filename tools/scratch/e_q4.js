(()=>{const o={};const gs=Object.keys(PROC.defs).filter(k=>PROC.defs[k].steps.some(s=>s.who==='gate'));o.n=gs.length;o.sample=PROC.defs[gs[0]];o.k=gs.slice(0,100);
o.run=S.bud.run;o.po=S.bud.po.filter(p=>p.line==='Run').slice(0,2);o.lineIds=S.bud.lines.map(l=>l.id).join(',');o.adp=Object.keys(INBOX.adapters);o.me=INBOX.me?INBOX.me():'';
o.wfa=FLOWX.flows().slice(0,1).map(f=>({o:f.owner,s:f.service})); return o})()
