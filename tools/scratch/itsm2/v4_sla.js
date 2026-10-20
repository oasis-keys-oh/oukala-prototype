function slaOf(i){const pr=PRI[prio(i)],el=i.age-(i.pausedH||0);
 const mk=(tgt,used,done)=>{const rem=tgt-used,f=rem/tgt;return {tgt,rem,f,done,cls:rem<0?"bad":(!done&&f<.25)?"warn":"good",txt:done?(rem<0?"Missed by "+fH(rem):"Met, "+fH(rem)+" to spare"):rem<0?"Breached "+fH(rem)+" ago":fH(rem)+" left",pct:Math.max(0,Math.min(100,used/tgt*100))}};
 const resp=mk(pr.resp,i.respH!=null?i.respH:i.age,i.respH!=null);
 const res=i.st==="Resolved"?mk(pr.res,i.resH,true):mk(pr.res,el,false);
 return {resp,res,paused:i.st==="On hold",risk:isOpen(i)&&((!resp.done&&resp.cls!=="good")||res.cls!=="good"),breach:isOpen(i)&&((!resp.done&&resp.cls==="bad")||res.cls==="bad")}}
const slaChip=(lab,t)=>`<span class="itsm-sla ${t.cls}" title="${esc(lab)} target ${fH(t.tgt)}"><b>${lab}</b>${esc(t.txt)}</span>`;
const slaMeter=(lab,t,paused)=>`<div class="itsm-m"><div class="row sp"><b>${lab}</b><span class="itsm-sla ${t.cls}">${paused?"Paused: ":""}${esc(t.txt)}</span></div><div class="itsm-bar"><i class="${t.cls}" style="width:${t.pct}%"></i><u style="left:75%" title="Risk zone starts at 75% of target"></u></div><small class="muted">Target ${fH(t.tgt)}</small></div>`;
const noteAdd=(i,w,k,x)=>i.notes.push({a:0,w,k,x});
