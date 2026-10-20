(async()=>{const o={};
o.flowx=FLOWX.pending().length; o.flowSample=FLOWX.pending().slice(0,3);
o.itsmChanges=ITSMX.changes.filter(c=>c.st==="Authorize").map(c=>({id:c.id,t:c.t,st:c.st,req:c.req,keys:Object.keys(c).slice(0,40),stage:JSON.stringify(c.stages).slice(0,500)})).slice(0,2);
o.rel=RELX.releases.slice(0,2).map(r=>({id:r.id,n:r.n||r.name,st:r.st,keys:Object.keys(r).join(","),gng:JSON.stringify(r.gng).slice(0,200)}));
o.req=(window.REQREG||[]).filter(r=>(r.state||r.st)==="approval"||JSON.stringify(Object.values(r.ap||{}).map(a=>a.st)).includes("pending")).slice(0,2).map(r=>({id:r.id,state:r.state,ap:r.ap,keys:Object.keys(r).join(",")}));
o.reqN=(window.REQREG||[]).length;
o.fin=FIN._h.F.gq.slice(0,3);
o.gate=GATE.apps().slice(0,2); 
o.gateKeys=Object.keys(GATE);
o.debt=Object.keys(DEBT); o.debtItems=(DEBT.items&&DEBT.items()||[]).slice(0,2);
o.fab=Object.keys(FAB);
o.peoplex=Object.keys(PEOPLEX);
o.sowx=Object.keys(SOWX);
o.kcsx=Object.keys(KCSX); 
o.meetx=typeof MEETX;
o.atlas=Object.keys(ATLAS);
o.persona=S.persona;
return o})()
