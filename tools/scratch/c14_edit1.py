import re
p='mod_svc.js';s=open(p,encoding='utf-8').read()
# 1. timeline helper + use
helper=r'''
/* ROUND 14: linear "What happens next" timeline. Stages in order, a connector only between consecutive steps, overlapping stages shown as parallel lanes. */
function tlWhen(h){return h<1?"Straight away":h<24?"After about "+Math.round(h)+" h":"After about "+(Math.round(h/24*10)/10)+" working days"}
function tlLen(x){const d=Math.max(0,x.e-x.s);return d<1?"under an hour":d<24?"about "+Math.max(1,Math.round(d))+" h":"about "+(Math.round(d/24*10)/10)+" d"}
function tlGroups(sp){const L=sp.slice().sort((a,b)=>a.s-b.s||a.e-b.e),G=[];let cur=null,end=0;L.forEach(x=>{if(cur&&x.s<end-.01){cur.push(x);end=Math.max(end,x.e)}else{cur=[x];G.push(cur);end=x.e}});
 return G.map(g=>{const lanes=[];g.forEach(x=>{let ln=lanes.find(l=>l[l.length-1].e<=x.s+.01);if(!ln){ln=[];lanes.push(ln)}ln.push(x)});return lanes})}
function timelineHTML(sp,it){const G=tlGroups(sp);let n=0;const hide=it&&it.vis&&it.vis.assignee==="hidden";
 const who_=x=>hide?"":x.team==="Requester"?"You":x.team==="Approvers"?"Your approvers":E(x.team);
 const node=(x,num,par)=>`<div class="svc-tln ${par?"par":""}"><i class="svc-tlnum" aria-hidden="true">${num}</i><div class="svc-tlcard"><b>${E(x.k)}</b><div class="svc-tlmeta"><span title="Who">${who_(x)?who_(x):""}</span>${TY[x.type]?`<span class="svc-tltype" style="--tc:var(${TY[x.type].c})">${tyIc(x.type)}${E(TY[x.type].n)}</span>`:""}<span class="muted" title="How long">${tlLen(x)}</span></div></div></div>`;
 const items=G.map((lanes,gi)=>{const first=Math.min(...lanes.map(l=>l[0].s));
  if(lanes.length===1){const seq=lanes[0];return `<li class="svc-tlrow"><span class="svc-tlwhen">${tlWhen(first)}</span><div class="svc-tlbody">${seq.map(x=>{n++;return node(x,n,false)}).join("")}</div></li>`}
  const base=n+1;n+=lanes.reduce((a,l)=>a+l.length,0);let k=0;
  return `<li class="svc-tlrow par"><span class="svc-tlwhen">${tlWhen(first)}</span><div class="svc-tlbody"><div class="svc-tlpar" role="group" aria-label="These stages run at the same time"><span class="svc-tlparh">At the same time</span><div class="svc-tllanes">${lanes.map((l,li)=>`<div class="svc-tllane">${l.map(x=>node(x,base+(k++),true)).join("")}</div>`).join("")}</div></div></div></li>`}).join("");
 return `<ol class="svc-tl" aria-label="Stages in order">${items}</ol>`}
'''
a=s.index('function pTabs(it,sc,fw){')
s=s[:a]+helper.lstrip('\n')+s[a:]
old=s[s.index(' const next=card("What happens next"'):]
old=old[:old.index('\n')]
new=''' const next=card("What happens next","Stages in order. Steps that can run at the same time are grouped. Times are typical, in working time.",`${timelineHTML(sp,it)}<p class="svc-tlend"><b>Delivery:</b> typically ${E(it.est)} from the day all approvals are in.</p>`);'''
s=s.replace(old,new)
open(p,'w',encoding='utf-8').write(s)
