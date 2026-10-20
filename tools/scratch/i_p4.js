(async()=>{const o={};
o.canA=DOA.canApprove(48000,"budget","Dev Rao");o.appF=DOA.approverFor(48000,"budget","Dev Rao");
const c=ITSMX.changes.find(c=>c.id==="CHG0312");o.chg={t:c.t,type:c.type,svc:c.svc,start:c.start,end:c.end,win:c.win,cost:c.cost,ok:c.ok,appr:c.appr,env:c.env,just:c.just,impl:c.impl,back:c.back,test:c.test,tr:c.tr,rq:c.rq,auto:c.auto,subH:c.subH};
o.work={};for(const p of ["Casey Rowan","Avery Chen","Priya Shah","Tom Becker"]){o.work[p]=WORK.map(w=>{try{return w.kind+":"+(w.fn(p)||[]).length}catch(e){return w.kind+":ERR"}}).filter(x=>!/:0$/.test(x))}
o.workSample=WORK.map(w=>{try{return (w.fn("Casey Rowan")||[])[0]}catch(e){}}).filter(Boolean).slice(0,3).map(x=>({...x,go:undefined}));
o.alerts=(OBSX.alerts()||[]).slice(0,2);
o.alertN=(OBSX.alerts()||[]).length;
o.svcrej=Object.keys(window).filter(k=>/^svc/.test(k));
o.rqRej=REQREG.find(r=>r.rej);
o.ocpto=Object.keys(S.oc||{});
o.nm=Object.keys(S.ppl2||{}).slice(0,30);
o.me4=["exec","fin","pm","ops"].map(p=>p);
o.itsmCr=typeof ITSMX.createChange;
o.sowCh=SOWX.changes().length; o.sowOpen=String(SOWX.open).slice(0,150);
o.matOpen=String(MAT.openCap).slice(0,100);
o.pplPend=Object.keys(S.pp2||{});
o.dirSam=DIR.find(d=>d.name==="Casey Rowan");
o.audit=AUDIT.length;
o.sampleUSERS=typeof USERS;
return o})()
