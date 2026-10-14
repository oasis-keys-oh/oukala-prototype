/* ===== Round 17, Agent T, part B: org chart integration. AI card, outline item, lines, legend, the Human and AI workforce band and the AI workforce tab. ===== */
(function(){
const R=window.R17T,O=window.ORGX;if(!R||!O||!S.org)return;
const {H,G}=R;const OS=S.org,SS=S.r17t;
if(OS.lines&&OS.lines.svc===undefined)OS.lines.svc=true;
if(OS.mode==="aionly"||OS.mode==="ai"||OS.mode==="human"||OS.mode==="both"){}else OS.mode="both";
const money=n=>"$"+(n<10?n.toFixed(2):Math.round(n).toLocaleString("en-US"));
const spk=(arr,w,h)=>{w=w||34;h=h||12;const mx=Math.max(1,...arr);const p=arr.map((v,i)=>(i*(w-2)/(arr.length-1)+1).toFixed(1)+","+(h-1-v*(h-2)/mx).toFixed(1)).join(" ");return `<svg class="r17t-spk" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${p}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`};
R.spark=spk;
const lvShort={1:"Suggest",2:"Approve",3:"Act"};
R.inline=(name,o)=>{o=o||{};if(R.isAgent(name)){const c=R.canon(name)||name,d=G(()=>agentDisplay(c),{full:c});return `<span class="org-dn r17t-in">${R.aiBadge(c,{size:o.size||26})}<b>${H(d.full)}</b><i class="r17t-tag">AI</i></span>`}return `<span class="org-dn r17t-in">${avatar(name,{size:o.size||26})}<b>${H(name)}</b></span>`};
R.actorInline=name=>R.inline(name);

/* ---------- chart pieces ---------- */
O.agLine=id=>{const n=String(id).replace(/^ag:/,"");const m=R.model(n);if(!m)return"";return m.ctl||m.lc!=="active"||m.a.status!=="running"?"off":(m.state==="working"?"live":"")};
O.agLabel=(x,y)=>`<text class="org-lnlbl" x="${x}" y="${y}">SPONSORED BY</text>`;
O.agTag=n=>`<span class="r17t-tag">AI ${n}</span>`;
const corner=`<svg class="r17t-corner" viewBox="0 0 22 14" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h9l3 3h8"/><path d="M6 11h7l2-2h6"/></g><g fill="currentColor"><circle cx="21" cy="6" r="1.4"/><circle cx="21" cy="9" r="1.4"/></g></svg>`;
O.agCard=function(c,pos){const a=c.a,m=R.model(a.name);const d=G(()=>agentDisplay(a.name),{first:a.name,title:"",full:a.name});
 const st=m?m.state:"idle",off=!m||m.ctl||m.lc!=="active"||a.status!=="running";
 const dot=a.status==="running"&&!off?"good":a.status==="paused"||(m&&m.lc!=="active")?"warn":"bad";
 const lbl=`${d.full}, AI teammate. Sponsored by ${a.sponsor}${m&&m.backup?", backup "+m.backup:""}. Tier ${m?m.tier:""}, ${m?m.lc:""}, ${st}.`;
 return `<div class="org-n org-ag r17t-ag ${off?"off":""} ${st==="working"&&!off?"live":""}" data-oid="${H(c.id)}" style="${pos}"><button type="button" class="org-card ag is-agent" data-org-agent="${H(a.name)}" aria-label="${H(lbl)}" title="${H(d.full+" · sponsor "+a.sponsor)}"><span class="r17t-cavw">${R.aiBadge(a.name,{size:40,tag:false})}</span><span class="org-t" data-noag><b>${H(d.first)}</b><small>${H(d.title||a.name)}</small><span class="r17t-m"><i class="r17t-tag">AI</i><em>T${m?m.tier:"?"} ${lvShort[m?m.tier:1]}</em>${m?spk(m.m.runs14):""}</span></span><i class="org-st ${dot}" title="${H(off?(m&&m.ctl?"stopped":"paused"):st)}"></i>${corner}</button></div>`};
O.agOutline=function(a){const m=R.model(a.name);const d=G(()=>agentDisplay(a.name),{first:a.name,title:"",full:a.name});
 return `<li role="treeitem" class="org-ol-a"><button type="button" class="org-ol is-agent" data-org-agent="${H(a.name)}">${R.aiBadge(a.name,{size:30,tag:false})}<span class="r17t-ol" data-noag><span><b>${H(d.first)} <i class="r17t-tag">AI</i></b><small>${H(d.title||a.name)} · sponsored by ${H(a.sponsor)}</small><small>Tier ${m?m.tier:"?"} ${lvShort[m?m.tier:1]} · ${m?H(m.lc):""} · ${m?H(m.state):""}</small></span></span></button></li>`};
O.legendX=function(){const hu=`<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="8.5" fill="none" stroke="var(--muted)" stroke-width="1.6"/><circle cx="11" cy="9" r="3" fill="var(--muted)"/><path d="M5.5 17c1-3 3-4 5.500-4s4.500 1 5.500 4" fill="var(--muted)"/></svg>`;
 const ai=`<svg width="24" height="22" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 1C19 1 23 5 23 11S19 21 12 21 1 17 1 11 5 1 12 1Z" fill="var(--r17t-ai)"/><path d="M14 4h4l2 2v3" fill="none" stroke="var(--r17t-trace)" stroke-width="1.2" stroke-linecap="round"/><text x="12" y="15" text-anchor="middle" font-size="9" font-weight="800" fill="var(--r17t-ink)" font-family="Hanken Grotesk,system-ui,sans-serif">Ai</text></svg>`;
 const ln=(c,d)=>`<svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true"><path d="M1 5H33" stroke="${c}" stroke-width="${d[0]}" ${d[1]?`stroke-dasharray="${d[1]}"`:""} stroke-linecap="round"/></svg>`;
 return `<div class="r17t-key" role="group" aria-label="Legend: people and AI teammates"><span>${hu}<b>Person</b> round avatar, solid card, solid line to manager</span><span>${ai}<b>AI teammate</b> squircle badge, circuit mark, AI tag, dashed card</span><span>${ln("var(--r17t-line)",[1.8,"6 5"])}dashed: sponsored by a person</span><span>${ln("var(--r17t-ai)",[1,"1 3"])}thin dotted: team it serves</span><span><span class="r17t-live"><i></i></span>moving dashes only while it is running</span></div>`};

/* ---------- Human and AI workforce band ---------- */
const tierBar=w=>{const t=w.tiers,n=Math.max(1,w.agents);return `<div class="r17t-stack" role="img" aria-label="AI teammates by tier: ${t[1]} suggest, ${t[2]} act with approval, ${t[3]} act within rules">${[1,2,3].map(k=>`<i class="r17t-i-t${k}" style="width:${t[k]*100/n}%"></i>`).join("")}</div>`};
function strip(w){const top=w.sponsors[0];const sp=w.cap?Math.round(w.spend*100/w.cap):0;
 const c=(l,v,sub,cls,t)=>`<span class="r17t-sc ${cls||""}" ${t?`title="${H(t)}"`:""}><small>${l}</small><b data-role="metric">${v}</b>${sub?`<em>${sub}</em>`:""}</span>`;
 return `<section class="r17t-strip" aria-label="Human and AI workforce"><div class="r17t-sh"><b>Human and AI workforce</b><button type="button" class="btn quiet" data-org-tab="aiw">Open AI workforce</button></div><div class="r17t-scs">${c("People",w.heads,"round avatars","hu")}${c("AI teammates",w.agents,"T1 "+w.tiers[1]+" · T2 "+w.tiers[2]+" · T3 "+w.tiers[3],"ai")}${c("Hours returned a week",Math.round(w.agHrs)+" h","vs "+Math.round(w.humHrs).toLocaleString("en-US")+" h people, illustrative","ai","Accepted runs this week x minutes saved per run, illustrative")}${c("Span of control",w.maxSpan,"limit "+SS.span+", "+w.over.length+" above",w.over.length?"bad":"ai",top?H(top.n)+" sponsors the most":"")}${c("No backup",w.nobackup.length,"AI teammates",w.nobackup.length?"bad":"")}${c("Paused or stopped",w.stopped.length,"",w.stopped.length?"warn":"")}${c("Spend vs budget",money(w.spend),"of "+money(w.cap)+" a day ("+sp+"%)","ai")}</div></section>`}
function band(w,full){
 const tot=w.humHrs+w.agHrs,hp=Math.round(w.humHrs*100/Math.max(1,tot));
 const top=w.sponsors[0];const spendPct=w.cap?Math.round(w.spend*100/w.cap):0;
 const anyMod=w.ags.some(x=>x.m.spendModeled);
 const lcTxt=["active","testing","paused","retired","draft"].filter(k=>w.lc[k]).map(k=>w.lc[k]+" "+k).join(" · ");
 return `<section class="r17t-bandw" aria-label="Human and AI workforce"><div class="row sp" style="margin-bottom:10px;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Human and AI workforce</h3><span class="muted small">From the org chart, the agent registry and run records. Modeled figures are labeled.</span></div><div class="row" style="gap:8px">${typeof fchip==="function"?fchip("m_r17t_sb")+fchip("m_r17t_span")+fchip("m_r17t_rev"):""}${full?"":`<button type="button" class="btn quiet" data-org-tab="aiw">Open AI workforce</button>`}</div></div>
 <div class="r17t-band">
  <div class="r17t-t"><small>People</small><b class="r17t-n" data-role="metric">${w.heads}</b><div class="r17t-stack" aria-hidden="true"><i class="r17t-i-hu" style="width:${hp}%"></i><i class="r17t-i-ai" style="width:${100-hp}%"></i></div><em>round avatar. ${G(()=>O.stats().mgrs,0)} managers, average span ${G(()=>O.stats().avgSpan,0)}. From the org chart.</em></div>
  <div class="r17t-t ai"><small>AI teammates</small><b class="r17t-n" data-role="metric">${w.agents}</b>${tierBar(w)}<em><span class="r17t-sw r17t-i-t1"></span>T1 ${w.tiers[1]} <span class="r17t-sw r17t-i-t2"></span>T2 ${w.tiers[2]} <span class="r17t-sw r17t-i-t3"></span>T3 ${w.tiers[3]} · ${lcTxt}${w.observed?` · ${w.observed} third-party AI observed, not governed`:""}</em></div>
  <div class="r17t-t"><small>Capacity mix <span class="r17t-lbl m">illustrative</span></small><b class="r17t-n" data-role="metric">${Math.round(w.agHrs)} h</b><div class="r17t-stack" aria-hidden="true"><i class="r17t-i-hu" style="width:${hp}%"></i><i class="r17t-i-ai" style="width:${100-hp}%"></i></div><em>hours returned a week by AI vs ${Math.round(w.humHrs).toLocaleString("en-US")} h contracted by people. Formula: accepted runs this week (${w.wkRuns} runs from run data) × ${SS.minPerRun} min ÷ 60. Sponsors' own estimate: ${w.planned} h.</em></div>
  <div class="r17t-t ${w.over.length?"":"ai"}"><small>Span of control</small><b class="r17t-n" data-role="metric">${w.maxSpan}</b><em>${top?`most AI teammates under one sponsor: ${H(top.n)}, ${money(top.cap)} a day of budget`:"no sponsors yet"}. Limit ${SS.span}: <b>${w.over.length}</b> above${w.over.length?` (${w.over.map(s=>H(s.n)).join(", ")})`:""}.</em></div>
  <div class="r17t-t"><small>No backup</small><b class="r17t-n" data-role="metric">${w.nobackup.length}</b><em>${w.nobackup.length?w.nobackup.slice(0,3).map(x=>H(x.d.first)).join(", ")+" need a backup who is a different person":"Every AI teammate has a sponsor and a different named backup."}</em></div>
  <div class="r17t-t"><small>Paused or stopped</small><b class="r17t-n" data-role="metric">${w.stopped.length}</b><em>${w.stopped.length?w.stopped.slice(0,3).map(x=>H(x.d.first)+(x.ctl?" (kill switch)":" (paused)")).join(", "):"None paused, none behind a kill switch."}</em></div>
  <div class="r17t-t"><small>Spend vs budget today${anyMod?` <span class="r17t-lbl m">partly modeled</span>`:""}</small><b class="r17t-n" data-role="metric">${money(w.spend)}</b><div class="r17t-gauge ${spendPct>90?"bad":spendPct>70?"warn":""}" role="img" aria-label="${spendPct} percent of budget"><i style="width:${Math.min(100,spendPct)}%"></i></div><em>of ${money(w.cap)} daily budget (${spendPct}%). Gateway agents use the Control Tower figure; others are run count × typical cost.</em></div>
 </div></section>`}
O.workBand=function(){R.syncMetrics();return `<div class="card glass r17t-bandcard">${strip(R.workforce())}</div>`};

/* ---------- AI workforce tab ---------- */
function pendHTML(ag){const L=(SS.pend||[]).filter(p=>p.state==="waiting"&&(!ag||p.agent===ag));if(!L.length)return `<p class="muted small">No hire or retire requests are waiting.</p>`;
 return L.map(p=>`<div class="r17t-pend"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${p.kind==="hire"?"Hire":"Retire"}: ${H(p.title)}</b><span class="pill warn">waiting on ${H(p.group)}</span></div><div class="small muted">Sponsor ${H(p.sponsor)} · backup ${H(p.backup)} · routed to a group, not a person. The requester cannot decide.</div><div class="row" style="gap:6px;flex-wrap:wrap">${p.members.map(m=>`<button type="button" class="btn" data-r17t-decide="${H(p.id)}|${H(m)}|approve">Approve as ${H(m)}</button>`).join("")}<button type="button" class="btn danger" data-r17t-decide="${H(p.id)}|${H(p.members[0]||"")}|reject">Reject</button></div></div>`).join("")}
R.pendHTML=pendHTML;
function aiwPane(){R.syncMetrics();const w=R.workforce();const maxH=Math.max(1,...w.teams.map(t=>t.hrs));
 const teamT=`<div class="tscroll"><table class="r17t-tbl"><thead><tr><th>Team</th><th class="num">AI teammates</th><th>Hours returned a week (sponsor estimate)</th><th class="num">Runs, last 7 days <span class="r17t-lbl m">modeled</span></th></tr></thead><tbody>${w.teams.slice(0,6).map(t=>`<tr><td><b>${H(t.t)}</b><div class="small muted">${t.agents.slice(0,3).map(n=>H(G(()=>agentDisplay(n).first,n))).join(", ")}${t.agents.length>3?" +"+(t.agents.length-3):""}</div></td><td class="num">${t.n}</td><td><div class="r17t-bar"><span><i style="width:${t.hrs*100/maxH}%"></i></span><b class="num">${t.hrs.toFixed(1)} h</b></div></td><td class="num">${t.runs}</td></tr>`).join("")}</tbody></table></div>`;
 const spT=`<div class="tscroll"><table class="r17t-tbl"><thead><tr><th>Sponsor</th><th class="num">AI teammates</th><th class="num">Waiting on them</th><th class="num">Budget exposure a day</th><th></th></tr></thead><tbody>${w.sponsors.slice(0,8).map(s=>`<tr><td>${R.actorChip(s.n)}</td><td class="num"><b>${s.ags.length}</b></td><td class="num">${s.wait}</td><td class="num">${money(s.cap)}</td><td>${s.over?`<span class="pill bad">above ${SS.span}</span>`:s.edge?`<span class="pill warn">at the limit</span>`:`<span class="pill good">in range</span>`}</td></tr>`).join("")}</tbody></table></div>`;
 const rows=w.ags.map(x=>({name:x.name,first:x.d.full,lc:x.lc,tier:x.tier,sponsor:x.sponsor,backup:x.backup||"",spend:x.m.spend,cap:x.m.cap,acc:x.m.accept==null?-1:x.m.accept,score:x.review?x.review.score:-1,state:x.state}));
 const tbl=btHTML({id:"r17t_team",h:440,rowH:54,key:"name",exportName:"ai-teammates",facets:["lc","tier"],cols:[
  {k:"first",label:"AI teammate",fmt:r=>`<span class="org-dn r17t-in">${R.aiBadge(r.name,{size:30,tag:false})}<b data-noag>${H(r.first)}</b><i class="r17t-tag">AI</i></span>`,val:r=>r.first},
  {k:"lc",label:"Lifecycle",fmt:r=>`<span class="pill ${r.lc==="active"?"good":r.lc==="testing"?"info":"warn"}">${H(r.lc)}</span>`,val:r=>r.lc},
  {k:"tier",label:"Tier",fmt:r=>"T"+r.tier,val:r=>r.tier},
  {k:"sponsor",label:"Sponsor",fmt:r=>R.actorChip(r.sponsor),val:r=>r.sponsor},
  {k:"backup",label:"Backup",fmt:r=>r.backup?R.actorChip(r.backup):`<span class="pill bad">none</span>`,val:r=>r.backup},
  {k:"spend",label:"Spend vs budget",fmt:r=>`${money(r.spend)} / ${money(r.cap)}<div class="r17t-gauge"><i style="width:${Math.min(100,r.cap?r.spend*100/r.cap:0)}%"></i></div>`,val:r=>r.cap?r.spend/r.cap:0},
  {k:"acc",label:"Accepted",fmt:r=>r.acc<0?`<span class="muted">pilot</span>`:r.acc+"%",val:r=>r.acc},
  {k:"score",label:"Review score",fmt:r=>r.score<0?`<span class="muted">n/a</span>`:`<b>${r.score}</b>`,val:r=>r.score}],rows,open:id=>R.openProfile(id)});
 return `<div class="r17t-pane" style="display:flex;flex-direction:column;gap:16px">
 <div class="card glass r17t-bandcard">${band(w,true)}
  <div class="row" style="gap:16px;flex-wrap:wrap;margin-top:12px"><label class="r17t-inp">Minutes saved per accepted run <input class="txtin" type="number" min="1" max="120" value="${SS.minPerRun}" data-r17t-min aria-label="Minutes saved per accepted run"> <span class="r17t-lbl m">illustrative</span></label><label class="r17t-inp">Span limit per sponsor <input class="txtin" type="number" min="1" max="20" value="${SS.span}" data-r17t-span aria-label="Span of control limit"></label><button type="button" class="btn primary" data-r17t-hire>Hire an AI teammate</button></div></div>
 <div class="r17t-grid2">${card("Teams with the most AI help","Teams are the sponsor's team. Hours are the sponsors' own estimate; runs are modeled from the run totals.",teamT)}${card("Sponsor load","AI teammates per human sponsor, work waiting on them and the daily budget they answer for.",spT)}</div>
 ${card("AI teammates","Select a row to open the profile. An AI teammate is never an owner: every one has a human sponsor and a different human backup.",tbl)}
 ${card("Requests waiting on the AI governance board","Hiring and retiring go to a group, never a person.",`<div data-r17t-pend>${pendHTML()}</div>`)}
 ${procCard("org_ai_teammate")}</div>`}
O.tabs.splice(1,0,["aiw","AI workforce"]);
const prevX=O.extraPane;O.extraPane=tab=>tab==="aiw"?aiwPane():prevX?prevX(tab):null;

document.addEventListener("input",e=>{const m=e.target.closest&&e.target.closest("[data-r17t-min],[data-r17t-span]");if(!m)return;const v=Math.max(1,+m.value||1);if(m.hasAttribute("data-r17t-min"))SS.minPerRun=Math.min(120,v);else SS.span=Math.min(20,v);R.bust();clearTimeout(R._t);R._t=setTimeout(()=>{const k=m.hasAttribute("data-r17t-min")?"[data-r17t-min]":"[data-r17t-span]";render();const n=document.querySelector(k);if(n){n.focus();try{n.setSelectionRange(99,99)}catch(x){}}},450)});
document.addEventListener("click",e=>{const h=e.target.closest&&e.target.closest("[data-r17t-hire]");if(h){R.hireForm&&R.hireForm()}});
/* a quiet pulse of the band when the chart opens is not needed; the band re-renders with the screen */
})();
