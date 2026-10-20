(()=>{const o={};
o.dir=DIR.length;o.dirHumans=DIR.filter(d=>d.kind==="human").map(d=>d.name).join(", ");
o.ppl=S.ppl.people.map(p=>p.n+"|"+p.role+"|"+p.team+"|"+p.mgr+"|"+p.kind).join("\n");
o.agents=JSON.stringify(S.ppl.agents).slice(0,500);
o.doa=JSON.stringify(DOA.tiers());
o.ents=PLAT.entities().map(e=>e.id).filter(i=>/person|skill|team|org|position|goal|okr|review|approval|role|access|permission|agent/.test(i)).join(",");
o.admUsers=1;
o.AIGOV=typeof AIGOV;
o.tw=Object.keys(window).filter(k=>/^(ADM|ACCESS|RBAC|ROLES|POL|GOAL|OKR|STRAT|SLA|PERF|REVIEW)/.test(k)).join(",");
o.stratKeys=window.STRAT?Object.keys(STRAT):0;
o.adminKeys=window.ADMX?Object.keys(ADMX):window.ADM?Object.keys(ADM):0;
return o})()
