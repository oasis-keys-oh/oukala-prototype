(async()=>{for(let i=0;i<60&&!ZLINK.state.fixed.fx_r15e_n;i++)await new Promise(r=>setTimeout(r,1000));await new Promise(r=>setTimeout(r,3000));
const A=INBOX.adapters.gate_rec;const names=[...new Set(R15E.gates().map(g=>R15E.personOf(g.approver)))];let it=null,who=null;for(const n of names){const l=A.list(n);if(l.length){it=l[0];who=n;break}}
const o={names:names.length,item:it&&it.title,who};
if(it){const r=A.approve(it,"ok");o.r=r;o.state=R15E.gates().find(g=>g.id===it.sid).state}
const inb=INBOX.items().filter(x=>x.src==='gate_rec').length;o.inbox=inb;
const l=window.EVENTS.log.slice(0,6).map(e=>e.id+' '+e.outcomes.map(x=>x.rule+':'+x.status).join(','));o.log=l;
o.wrapped=Object.keys(INBOX.adapters).filter(k=>INBOX.adapters[k].__r15e).length;o.cov=window.EVENTS.coverage();o.ct=CONTRACT.evaluate('zevt').score;o.ntf=NTFX.log().slice(0,3);o.wire=S.zl15&&S.zl15.wired;
return o})()
