/* ============ Helpers and shared components ============ */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=n=>"$"+Math.round(n).toLocaleString("en-US");
const mk=n=>n>=1e6?"$"+(n/1e6).toFixed(2).replace(/0$/,"")+"M":n>=1e3?"$"+Math.round(n/1e3)+"K":"$"+n;
const col=v=>`var(${v})`;
let _pid=0;const pid=()=>"p"+(++_pid);
const stCls=s=>s==="bad"?"bad":s==="warn"?"warn":s==="good"?"good":"mute";
const stTxt=s=>({good:"On track",warn:"Watch",bad:"Needs action"}[s]||"Neutral");
const S={screen:"home",persona:"exec",sel:null,flowSel:null,rec:"I2",inv:"INV-20433",invTab:0,dec:{},auto:3,rules:JSON.parse(JSON.stringify(RULES)),calSel:null,fo:{},foNow:"week",agents:JSON.parse(JSON.stringify(AGENTS)),ct:{scope:"agent",target:"ia",reason:"",armed:false,log:[]},
 q:"",sort:{k:"n",d:1},extra:[],metricFilter:"all",chat:[],kgStart:"std1",kgSel:null,kgDone:{},kgTasks:null,kgLinked:{}};
window.KG_EXTRA=[];
const PREF={theme:"auto",size:"m",density:"comfortable",motion:"system",skill:"standard",contrast:"normal"};
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem("oukala-v2")||"null");if(p){Object.assign(PREF,p.pref||{});if(PERSONAS[p.persona])S.persona=p.persona}}catch(e){}applyPrefs()}
function savePrefs(){try{localStorage.setItem("oukala-v2",JSON.stringify({pref:PREF,persona:S.persona}))}catch(e){}}
function applyPrefs(){const r=document.documentElement;PREF.theme==="auto"?r.removeAttribute("data-theme"):r.setAttribute("data-theme",PREF.theme);r.dataset.size=PREF.size;r.dataset.density=PREF.density;r.dataset.skill=PREF.skill;r.dataset.contrast=PREF.contrast;PREF.motion==="reduced"?r.dataset.motion="reduced":r.removeAttribute("data-motion")}
function audit(a,d){AUDIT.unshift({t:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),p:PERSONAS[S.persona].n,s:S.screen,a,d:d||""});const b=$("#auditCount");if(b)b.textContent=AUDIT.length}

/* icons */
const IC=d=>`<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON={sparkle:"M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",warn:"M12 3l10 18H2zM12 10v5M12 18v.01",check:"M5 12l5 5 9-10",info:"M12 8v.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",bolt:"M13 2L4 14h7l-1 8 9-12h-7z",search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",chev:"M15 6l-6 6 6 6",lock:"M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",book:"M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"};
const ico=k=>IC(ICON[k]);

/* ---- charts ---- */
function ring(v,max,size,color,label,txtSize){const r=(size-14)/2,c=2*Math.PI*r,off=c*(1-Math.min(1,v/max));return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true"><circle class="trk" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="12"/><circle class="arc" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="12" style="--c:${c.toFixed(1)};--off:${off.toFixed(1)}"/></svg><div class="val" style="font-size:${txtSize||size/3.1}px">${label}</div></div>`}
function spark(vals,w,h,color){const mn=Math.min(...vals),mx=Math.max(...vals),sp=(mx-mn)||1;const pts=vals.map((v,i)=>[3+i*(w-6)/(vals.length-1),h-4-(v-mn)/sp*(h-8)]);const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join("");const l=pts[pts.length-1];return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}L${l[0]} ${h}L${pts[0][0]} ${h}Z" fill="${color}" opacity=".16"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${l[0]}" cy="${l[1]}" r="3.5" fill="${color}"/></svg>`}
/* line/area chart drawn to one scale. series: [{vals,color,dash,area,label}], vals may be shorter than labels */
function lineChart(labels,series,o){const W=o.w||640,H=o.h||260,L=46,R=18,T=18,B=30,mx=o.max,ys=v=>T+(H-T-B)*(1-v/mx),xs=i=>L+(W-L-R)*i/(labels.length-1);let g="";const ticks=o.ticks||4;for(let i=0;i<=ticks;i++){const v=mx*i/ticks;g+=`<line class="grid-l" x1="${L}" x2="${W-R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="ax" x="${L-8}" y="${ys(v)+4}" text-anchor="end">${o.fmt?o.fmt(v):Math.round(v)}</text>`}
 labels.forEach((l,i)=>{if(!o.every||i%o.every===0)g+=`<text class="ax" x="${xs(i)}" y="${H-8}" text-anchor="middle">${l}</text>`});
 series.forEach(s=>{const p=s.vals.map((v,i)=>[xs(i+(s.start||0)),ys(v)]);const d=p.map((q,i)=>(i?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1)).join("");if(s.area)g+=`<path d="${d}L${p[p.length-1][0]} ${ys(0)}L${p[0][0]} ${ys(0)}Z" fill="${s.color}" opacity=".14"/>`;g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||3}" ${s.dash?'stroke-dasharray="7 6"':""} stroke-linecap="round" stroke-linejoin="round"/>`;const e=p[p.length-1];if(!s.dash)g+=`<circle cx="${e[0]}" cy="${e[1]}" r="5" fill="${s.color}" stroke="var(--bg)" stroke-width="2"/>`});
 (o.marks||[]).forEach(m=>{const y=ys(m.v);g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${m.color}" stroke-width="1.6" stroke-dasharray="3 5"/><text class="ax" x="${W-R}" y="${y-6}" text-anchor="end" fill="${m.color}" style="fill:${m.color}">${m.label}</text>`});
 return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.alt||"Chart")}">${g}</svg>`}

/* ---- popover-based components (no JS needed to open) ---- */
function aiChip(o){const id=pid();return `<button class="aichip" popovertarget="${id}">${ico("sparkle")}${esc(o.model||"AI")} · ${o.conf?Math.round(o.conf*100)+"%":"draft"}</button>
<div popover id="${id}" class="pop glass"><div class="eyebrow">AI output</div><h3>${esc(o.title||"Where this came from")}</h3><p class="muted">${esc(o.note||"Generated from the records below, within the access of the person viewing it.")}</p>
<dl class="kv"><dt>Model</dt><dd>${esc(o.model||"Claude")}${o.verify?` · checked by ${esc(o.verify)}`:""}</dd><dt>Confidence</dt><dd>${o.conf?Math.round(o.conf*100)+"%":"Not scored"}</dd><dt>Data lineage</dt><dd><ul class="steps">${(o.src||["Invoices","Contracts","Purchase orders"]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></dd><dt>Guardrails</dt><dd><ul class="steps">${(o.guards||["Reads only what you can read","Cannot execute payments","Every action is audited"]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></dd></dl>
<div class="row"><button class="btn" popovertarget="${id}" popovertargetaction="hide">Close</button><button class="btn quiet" data-go="tower">Open AI Control Tower</button></div></div>`}
function metricBody(id){const m=METRICS[id],st=mstat(m),r=m.rem;const lo=Math.min(m.badAt,m.tgt),hi=Math.max(m.badAt,m.tgt);const sc=v=>Math.max(0,Math.min(100,v/m.max*100));
 const bands=m.dir==="max"?[[0,m.badAt,"--bad-f"],[m.badAt,m.tgt,"--warn-f"],[m.tgt,m.max,"--good-f"]]:[[0,m.tgt,"--good-f"],[m.tgt,m.badAt,"--warn-f"],[m.badAt,m.max,"--bad-f"]];
 return `<div class="eyebrow">Metric · defined once, used in ${m.use.length} places</div><h3>${esc(m.n)}</h3><div class="row" style="margin:6px 0 12px"><span class="num" style="font-size:44px;line-height:1">${mfmt(m)}</span><span class="pill ${stCls(st)}">${st==="good"?"On trend":st==="warn"?"Off trend":"Off trend, act"}</span><span class="muted small">target ${m.dir==="max"?"at least":"at most"} ${mfmt(m,m.tgt)}</span></div>
 <div class="formula">${esc(m.f)}</div>
 <div class="bandbar" style="margin:16px 0 6px">${bands.map(b=>`<span style="width:${sc(b[1])-sc(b[0])}%;background:var(${b[2]});opacity:.85"></span>`).join("")}<u style="left:${sc(m.cur)}%"></u></div>
 <div class="row sp muted small"><span>Last 8 periods</span><span>Owner: ${esc(m.owner)}</span></div><div>${spark(m.tr,420,54,col(st==="good"?"--good-f":st==="warn"?"--warn-f":"--bad-f"))}</div>
 <div class="eyebrow" style="margin:14px 0 8px">If off trend</div>
 ${r?`<div class="rem"><div class="ico">${ico(r.kind==="agent"?"bolt":"book")}</div><div><b>${esc(r.agent)} runs ${esc(r.ref)}: ${esc(r.title)}</b><div class="muted">${st==="good"?"Standing by. Starts automatically when the metric crosses its threshold.":esc(r.prog)}</div></div></div><label class="row" style="margin-top:12px"><span class="switch"><input type="checkbox" data-auto="${id}" ${r.auto?"checked":""}><span></span></span><span class="small"><b>Start remediation automatically</b><br><span class="muted">Turn off to have it ask you first.</span></span></label>`:`<div class="rem"><div class="ico">${ico("info")}</div><div><b>No remediation attached yet</b><div class="muted">Attach a knowledge article, procedure or agent so being off trend triggers action.</div></div></div>`}
 <div class="eyebrow" style="margin:14px 0 8px">Used in</div><div class="row">${m.use.map(u=>`<span class="pill mute">${u}</span>`).join("")}</div>`}
function kpiMini(id,p){const m=METRICS[id],st=mstat(m),c=col(st==="good"?"--good-f":st==="warn"?"--warn-f":"--bad-f");return `<button type="button" class="fkpi" ${p?`popovertarget="${p}"`:""} data-k="${id}" aria-label="${esc(m.n)}: ${esc(mfmt(m))}, target ${esc(mfmt(m,m.tgt))}. Open formula"><span class="fk-h"><span class="fk-n">${esc(m.n)}</span><i class="fk-d ${stCls(st)}"></i></span><span class="fk-v"><b class="num">${mfmt(m)}</b><span class="fk-t">target ${m.dir==="max"?"≥":"≤"} ${mfmt(m,m.tgt)}</span></span><span class="fk-s">${spark(m.tr,150,22,c)}</span></button>`}
function kpiBox(id){const m=METRICS[id],st=mstat(m),sc=v=>Math.max(0,Math.min(100,v/m.max*100));const bands=m.dir==="max"?[[0,m.badAt,"--bad-f"],[m.badAt,m.tgt,"--warn-f"],[m.tgt,m.max,"--good-f"]]:[[0,m.tgt,"--good-f"],[m.tgt,m.badAt,"--warn-f"],[m.badAt,m.max,"--bad-f"]];
 return `<div class="eyebrow">Owner · ${esc(m.owner)}</div><div class="row sp"><b style="font-size:16px">${esc(m.n)}</b><span class="pill ${stCls(st)}">${st==="good"?"On trend":"Off trend"}</span></div><div class="row" style="align-items:flex-end"><span class="num" style="font-size:38px;line-height:1">${mfmt(m)}</span><span class="muted small" style="padding-bottom:4px">target ${m.dir==="max"?"at least":"at most"} ${mfmt(m,m.tgt)}</span></div><div>${spark(m.tr,300,34,col(st==="good"?"--good-f":st==="warn"?"--warn-f":"--bad-f"))}</div><div class="formula">${esc(m.f)}</div><div class="bandbar">${bands.map(b=>`<span style="width:${sc(b[1])-sc(b[0])}%;background:var(${b[2]});opacity:.85"></span>`).join("")}<u style="left:${sc(m.cur)}%"></u></div><div class="muted small">Click for the full card, remediation and owner.</div>`}
window.kpiMini=kpiMini;window.kpiBox=kpiBox;
function fchip(id,label){const m=METRICS[id],p=pid();return `<button class="fchip" data-k="${id}" popovertarget="${p}">ƒ ${esc(label||m.n)}</button><div popover id="${p}" class="pop glass">${metricBody(id)}<div class="row" style="margin-top:14px"><button class="btn" popovertarget="${p}" popovertargetaction="hide">Close</button><button class="btn quiet" data-go="metrics:${id}">Open in Metrics</button></div></div>${kpiMini(id,p)}`}
function metricRing(id,size){const m=METRICS[id],st=mstat(m),p=pid(),sz=size||132;const color=col(st==="good"?"--good-f":st==="warn"?"--warn-f":"--bad-f");
 const frac=m.dir==="max"?m.cur/m.max:Math.min(1,m.tgt/m.cur);
 const lab=m.u==="pts"?Math.round(m.cur):m.u==="idx"?m.cur.toFixed(2):m.u==="%"?(m.cur%1?m.cur.toFixed(1):m.cur)+"%":m.u==="days"?m.cur+"d":m.cur+"h";
 return `<div class="ringcard" data-role="metric"><button popovertarget="${p}" style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center">${ring(Math.max(.04,frac)*100,100,sz,color,lab,sz/3.4)}<b>${esc(m.n)}</b></button>
 <span class="pill ${stCls(st)}">${st==="good"?"On trend":"Off trend"} · target ${m.dir==="max"?"≥":"≤"} ${mfmt(m,m.tgt)}</span><span class="fx">${esc(m.f)}</span>
 <div popover id="${p}" class="pop glass">${metricBody(id)}<div class="row" style="margin-top:14px"><button class="btn" popovertarget="${p}" popovertargetaction="hide">Close</button><button class="btn quiet" data-go="metrics:${id}">Open in Metrics</button></div></div></div>`}

/* ---- drawer (popover with light-dismiss: click outside or Esc closes it) ---- */
function openDrawer(html){const d=$("#drawer");d.innerHTML=`<button class="btn quiet closebtn" popovertarget="drawer" popovertargetaction="hide" aria-label="Close">Close</button>${html}`;if(d.showPopover){try{d.showPopover()}catch(e){}}else d.setAttribute("open","");if(window.HOOKS)HOOKS.run("afterOpenDrawer",d)}
function closeDrawer(){const d=$("#drawer");if(d.hidePopover){try{d.hidePopover()}catch(e){}}}
function connectedHTML(id,nb){const rows=nb.map(x=>{const t=ANODE(x.o);return t?{lab:x.out?"Goes to":"Comes from",row:{id:x.o,t:t.n,sub:x.l,tag:x.out?"out":"in",go:()=>recDrawer(x.o)}}:null}).filter(Boolean);
 if(window.lrHTML){const by={};rows.forEach(r=>(by[r.lab]=by[r.lab]||[]).push(r.row));return lrHTML({id:"rec-"+id,groups:Object.entries(by).map(([k,v])=>({key:k,label:k,rows:v})),limit:6,search:true,empty:"No connections."})}
 return `<div class="row">${rows.slice(0,40).map(r=>`<button class="chip" data-rec="${r.row.id}">${esc(r.row.sub)} · ${esc(r.row.t)}</button>`).join("")}</div>`}
function recDrawer(id){const n=N(id)||KGN.find(x=>x.id===id);if(!n)return;const isK=!!KGN.find(x=>x.id===id);const T=isK?KT[n.t]:TYPES[n.t];
 const nb=ALLE().filter(e=>e[0]===id||e[1]===id).map(e=>({o:e[0]===id?e[1]:e[0],l:e[2],out:e[0]===id}));
 const attrs=n.a||{};const unused=Object.keys(attrs).filter(k=>!ROLE[k]);
 openDrawer(`<span class="pill" style="background:color-mix(in srgb,${col(T[1])} 22%,transparent);color:var(--ink)"><i class="dot" style="background:${col(T[1])}"></i>${T[0]}</span><h2 style="font-size:30px;margin:12px 0 6px;padding-right:60px">${esc(n.n)}</h2>
 <p class="story" data-role="story" style="font-size:17px;margin-bottom:10px">${esc(n.story||n.sub||"")}</p>
 <dl class="kv"><dt>Owner</dt><dd data-role="story">${esc(n.owner||"")}</dd>${n.s?`<dt>Status</dt><dd><span class="pill ${stCls(n.s)}">${stTxt(n.s)}</span></dd>`:""}${n.amt!=null?`<dt>Amount</dt><dd class="num" data-role="metric" style="font-size:22px">${money(n.amt)}</dd>`:""}${Object.entries(attrs).filter(([k])=>k!=="Owner").map(([k,v])=>`<dt>${esc(k)}</dt><dd data-role="${ROLE[k]||"none"}">${esc(v)}</dd>`).join("")}</dl>
 ${unused.length?`<div class="hint" style="display:block;background:var(--warn-s);color:var(--warn);margin-bottom:12px"><b>Clarity check:</b> ${unused.map(esc).join(", ")} ${unused.length>1?"are":"is"} in no story and no metric. Could we remove ${unused.length>1?"them":"it"}?</div>`:""}
 <div class="eyebrow" style="margin:12px 0 8px">Connected to</div>${connectedHTML(id,nb)}
 <div class="row" style="margin-top:20px">${N(id)?`<button class="btn primary" data-trace="${id}">Show in Executive trace</button>`:""}<button class="btn" data-impact="${id}">Run impact analysis</button><button class="btn quiet" data-ask="Tell me about ${esc(n.n)}">Ask ${BRAND.name}</button></div>`);audit("opened record",id)}

/* ---- navigation ---- */
function navHelpBtn(){return `<button class="navhelp" popovertarget="navHelp" title="How to read the navigation"><span aria-hidden="true">?</span> How to read this menu</button>`}
function navHTML(){if(window.NAVX&&NAVX.html)return NAVX.html();const P=PERSONAS[S.persona];const lab=Object.fromEntries(SCREENS.map(s=>[s[0],s]));const fav=["home"];
 const gOf=k=>(window.NAVGRP&&NAVGRP[k])||lab[k][3];
 const item=k=>{const s=lab[k];const badge=k==="inv"?'<em class="badge">3</em>':k==="tower"?'<em class="badge">1</em>':"";return `<button class="navi" data-nav="${k}" ${S.screen===k?'aria-current="page"':""} title="${esc(s[1])}">${IC(s[2])}<span>${esc(s[1].replace(/\s*\([^)]*\)\s*$/,""))}</span>${badge.replace("<em","<b")}</button>`};
 const flat=window.matchMedia("(max-width:900px)").matches||($("#railCollapse")&&$("#railCollapse").checked);
 if(flat){const rest=SCREENS.map(s=>s[0]).filter(k=>!fav.includes(k));return fav.concat(rest).map(item).join("")}
 S.navOpen=S.navOpen||{};const cur=lab[S.screen]?gOf(S.screen):null;
 const order=(g,ks)=>{const o=(window.NAVORD&&NAVORD[g])||[];return o.filter(k=>ks.includes(k)).concat(ks.filter(k=>!o.includes(k)))};
 return navHelpBtn()+fav.map(item).join("")+NAVG.map(([g,gl])=>{const ks0=SCREENS.map(s=>s[0]).filter(k=>gOf(k)===g&&!fav.includes(k));const par=window.NAVP&&NAVP[g];const ks=order(g,ks0).filter(k=>k!==par);if(!ks.length&&!par)return"";const open=S.navOpen[g]!==undefined?S.navOpen[g]:cur===g;const sub=(window.NAVSUB&&NAVSUB[g])||{};
  const head=par&&lab[par]?`<span class="gparent" data-nav="${par}" role="link" tabindex="0" ${S.screen===par?'aria-current="page"':""} title="Open ${esc(lab[par][1])}">${gl}</span>`:gl;
  return `<details class="navgd" data-ng="${g}" ${open?"open":""}><summary>${head}</summary>${ks.map(k=>(sub[k]?`<span class="navsub">${sub[k]}</span>`:"")+item(k)).join("")}</details>`}).join("")}
function renderNav(){$("#nav").innerHTML=navHTML();$("#personaName").textContent=PERSONAS[S.persona].n}
function go(screen,arg){if(window.HOOKS)HOOKS.run("beforeGo",screen,arg);S.screen=screen;S.navOpen={};if(screen==="inv"&&arg)S.inv=arg;if(screen==="trace"&&arg){S.rec=arg;S.flowSel=null}if(screen==="fo"&&arg){S.calSel=arg}if(screen==="metrics"&&arg)S.metricSel=arg;if(screen==="kg"&&arg)S.kgStart=arg;closeDrawer();$$("[popover]:popover-open").forEach(p=>{try{p.hidePopover()}catch(e){}});render();window.scrollTo({top:0,behavior:"smooth"});audit("navigated",screen+(arg?" · "+arg:""))}
let _R={};
function navReveal(){const n=$("#nav"),a=n&&n.querySelector("[aria-current=page]");if(!a)return;const nr=n.getBoundingClientRect(),ar=a.getBoundingClientRect();if(ar.bottom>nr.bottom-8)n.scrollTop+=ar.bottom-nr.bottom+40;else if(ar.top<nr.top+8)n.scrollTop-=nr.top-ar.top+40}
function render(){if(window.normMetrics)normMetrics();renderNav();navReveal();const v=$("#view");v.dataset.screen=S.screen;v.innerHTML=(_R[S.screen]||(()=>"") )();v.focus({preventScroll:true});afterRender();if(window.HOOKS)HOOKS.run("afterRender",S.screen)}
function afterRender(){if(window.coreAfter)coreAfter();if(S.screen==="fo"&&S.calSel){const m=MEETINGS.find(x=>x.id===S.calSel);S.calSel=null;if(m)meetingDrawer(m.id)}}

/* ---- search-ahead and chat ---- */
function searchIndex(){const out=[];/* CL-87: hidden screens are offered only in builder mode (SRCH, mod_s_search.js) */const hid=id=>{try{return !!(window.SRCH&&SRCH.hiddenScreen&&SRCH.hiddenScreen(id)&&!SRCH.builder())}catch(e){return false}};SCREENS.forEach(s=>{if(!hid(s[0]))out.push({g:"Go to",t:s[1],m:"Screen",c:"--accent",f:()=>go(s[0])})});
 NODES.forEach(n=>out.push({g:"Records",t:n.n,m:TYPES[n.t][0]+" · "+n.id,c:TYPES[n.t][1],f:()=>recDrawer(n.id),k:n.story}));
 KGN.forEach(n=>out.push({g:"Knowledge",t:n.n,m:KT[n.t][0],c:KT[n.t][1],f:()=>go("kg",n.id),k:n.sub}));
 Object.entries(METRICS).forEach(([id,m])=>out.push({g:"Metrics",t:m.n,m:mfmt(m),c:"--metric-f",f:()=>go("metrics",id),k:m.f}));
 MEETINGS.forEach(m=>out.push({g:"Meetings",t:m.t,m:"Oct "+m.d,c:MEET_TYPES[m.k][1],f:()=>go("fo",m.id)}));
 INVOICES.forEach(i=>out.push({g:"Invoices",t:i.id+" · "+i.vendor,m:money(i.amt),c:"--e4",f:()=>go("inv",i.id)}));return out}
function showSugg(){const q=$("#q").value.trim().toLowerCase(),box=$("#sugg");if(!q){box.classList.remove("open");return}
 const toks=q.split(/\s+/);let res=searchIndex().filter(r=>toks.every(t=>(r.t+" "+r.m+" "+(r.k||"")).toLowerCase().includes(t))).slice(0,7);const groups={};res.forEach(r=>(groups[r.g]=groups[r.g]||[]).push(r));
 let h="";S._sr=[];Object.entries(groups).forEach(([g,rs])=>{h+=`<div class="grp eyebrow">${g}</div>`;rs.forEach(r=>{S._sr.push(r);h+=`<button data-sr="${S._sr.length-1}"><i class="dotc" style="background:${col(r.c)}"></i><span>${esc(r.t)}</span><span class="meta">${esc(r.m)}</span></button>`})});
 h+=`<div class="grp eyebrow">Ask ${BRAND.name}</div><button data-sr="ask"><i class="dotc" style="background:var(--accent)"></i><span>${esc($("#q").value.trim())}</span><span class="meta">Press Enter</span></button>`;box.innerHTML=h;box.classList.add("open")}
const REPLY={
 hold:()=>({t:"Two invoices are worth a closer look. INV-20433 (Lumen, $62,900) should be held because accepted work is $390,000 and $412,000 is already paid. INV-20440 (Apex Print, $12,480) looks like a duplicate of one paid on Sep 12.",steps:["Searched 4 open invoices","Compared each to accepted work and prior payments","Applied your approver scope"],act:()=>go("inv","INV-20433")}),
 why:()=>({t:"The portfolio is amber because the Standards beta moved from Nov 4 to Nov 13. Lumen delivered the search indexer nine days late, and Vendor services is now $45,000 over commitment.",steps:["Traced Digital Publishing to its two projects","Followed the slip to Lumen SOW-4","Read the budget line commitments"],act:()=>go("trace","PR1")}),
 cal:()=>({t:"Tomorrow you have the change advisory board at 10:00, a 1:1 with Tom Becker at 13:00, and Wednesday has no conflicts. First Officer has a pre-read ready for the board.",steps:["Read your calendar through Microsoft Graph","Matched meetings to records","Prepared pre-reads"],act:()=>go("fo")}),
 portal:()=>({t:"The portal has been slow since 09:12. Availability is 99.62% against 99.9%, and Ops Agent is running the failover runbook, which is 14 months old. A rehearsal is set for 16:00.",steps:["Read incident INC1 and service S1","Checked the runbook's review date","Looked up the open change request"],act:()=>go("trace","INC1")}),
 rule:()=>({t:"At $25,000 with all checks passing, 14 of the last 60 invoices would have cleared automatically with no overrides. Raising the limit to $50,000 adds 8 more but includes 2 that were later overridden.",steps:["Back-tested the rule on 60 invoices","Counted later overrides"],act:()=>{S.invTab=2;go("inv")}}),
 impact:()=>({t:"Changing Standard 842 reaches 2 paragraphs, 2 policies, 3 procedures and controls, 2 systems, 2 data elements and 2 reports. Eight owners would get review tasks, about 41 hours of work.",steps:["Walked the knowledge graph from the standard","Counted owners and effort"],act:()=>go("kg","std1")}),
 def:()=>({t:"I can answer that from your records. For this demo I give canned answers, but each reply shows which data it used and which guardrails applied.",steps:["Read the current screen","Applied your access scope"]})};
function ask(q){const l=q.toLowerCase();let key="def";
 if(/theme|dark mode|light mode/.test(l)){PREF.theme=/light/.test(l)?"light":"dark";applyPrefs();savePrefs();return say(q,{t:"Switched to the "+PREF.theme+" theme.",steps:["Changed your display preference"]})}
 if(/clarity|lens/.test(l)){$("#lens").checked=!$("#lens").checked;return say(q,{t:"Clarity lens is "+($("#lens").checked?"on":"off")+". Teal fields tell the story, purple fields are measured, amber ones are in neither.",steps:["Toggled the lens"]})}
 if(/kill|pause|stop.*agent|shut/.test(l)){S.screen="tower";S.ct.scope="agent";render();return say(q,{t:"I opened the Control Tower with the kill switch prepared. Nothing is stopped until you add a reason and confirm.",steps:["Opened Control Tower","Left the confirmation to you"]})}
 if(/impact|ripple|asc|gaap|lease|standard/.test(l))key="impact";else if(/auto|rule|clear automatically/.test(l))key="rule";else if(/hold|invoice|lumen|pay/.test(l))key="hold";else if(/calendar|meeting|tomorrow|schedule/.test(l))key="cal";else if(/portal|slow|incident|stale|article/.test(l))key="portal";else if(/why|amber|slip|slipped|change/.test(l))key="why";
 say(q,REPLY[key]())}
function say(q,r){S.chat.push({me:1,t:q});S.chat.push({ai:1,t:r.t,steps:r.steps,act:r.act});audit("asked "+BRAND.name,q);drawChat();if(r.act)S.chat[S.chat.length-1].go=1;$("#chatOpen").checked=true;drawChat()}
function drawChat(){const P=PERSONAS[S.persona];$("#msgs").innerHTML=(S.chat.length?"":`<div class="msg ai">Hi Casey. Ask me anything about what you see, or tell me what to do. I can navigate, explain, draft and act within your access.<ul class="did"><li>Context: ${SCREENS.find(s=>s[0]===S.screen)?.[1]||"Knowledge graph"} as ${esc(P.n)}</li></ul></div>`)+S.chat.map((m,i)=>m.me?`<div class="msg me">${esc(m.t)}</div>`:`<div class="msg ai">${esc(m.t)}<ul class="did">${(m.steps||[]).map(s=>`<li>${esc(s)}</li>`).join("")}</ul><div class="row" style="margin-top:8px">${aiChip({model:"Claude",conf:.9,src:m.steps,title:"How I answered"})}${m.act?`<button class="btn" data-chatact="${i}">Take me there</button>`:""}</div></div>`).join("");
 $("#sugs").innerHTML=P.sugg.concat(["Run impact analysis on Standard 842"]).map(s=>`<button class="chip" data-ask="${esc(s)}">${esc(s)}</button>`).join("");$("#msgs").scrollTop=1e6}

/* round 9: hover a formula chip to see its KPI box; Clarity lens swaps chips for inline mini KPI cards */
(function(){let box=null,t=null,anchor=null,iv=0;const get=()=>{if(!box){box=document.createElement("div");box.id="fhov";box.setAttribute("popover","manual");box.className="glass fhov";box.setAttribute("role","tooltip");document.body.appendChild(box)}return box};
 const hide=()=>{clearTimeout(t);clearInterval(iv);iv=0;anchor=null;if(box&&box.matches(":popover-open")){try{box.hidePopover()}catch(e){}}};
 const chipOf=n=>n&&n.closest?n.closest(".fchip[data-k]"):null;
 const show=el=>{const id=el.dataset.k;if(!id||!METRICS[id])return;if(anchor===el&&box&&box.matches(":popover-open"))return;clearTimeout(t);t=setTimeout(()=>{if(!document.contains(el))return;anchor=el;const b=get();b.innerHTML=kpiBox(id);try{b.showPopover()}catch(e){}const r=el.getBoundingClientRect(),w=b.offsetWidth,h=b.offsetHeight;let x=Math.min(Math.max(8,r.left),innerWidth-w-8),y=r.bottom+8;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-8);b.style.left=x+"px";b.style.top=y+"px";
  clearInterval(iv);iv=setInterval(()=>{if(!anchor||!document.contains(anchor)||!anchor.matches(":hover,:focus-visible"))hide()},250)},160)};
 /* the chip can be replaced by a re-render while hovered, so pointerout alone is not enough: any pointer move off a chip closes the box */
 document.addEventListener("pointermove",e=>{const c=chipOf(e.target);if(c){show(c)}else if(anchor||t)hide()},{passive:true});
 document.addEventListener("pointerleave",hide);document.addEventListener("scroll",hide,true);window.addEventListener("blur",hide);
 document.addEventListener("focusin",e=>{const c=chipOf(e.target);if(c)show(c)});document.addEventListener("focusout",hide);document.addEventListener("click",hide,true);document.addEventListener("keydown",e=>{if(e.key==="Escape")hide()})})();

/* round 12: tables. Align a header to its figures: when every cell of a column is a number cell (.num or .tabular), the header takes the same right alignment */
(function(){let q=0;const fix=root=>{(root||document).querySelectorAll("table").forEach(t=>{const h=t.tHead&&t.tHead.rows[0];if(!h||t.dataset.nal===String(t.rows.length))return;t.dataset.nal=t.rows.length;const rows=[...t.tBodies].flatMap(b=>[...b.rows]);if(!rows.length)return;[...h.cells].forEach((th,i)=>{if(th.colSpan>1)return;let n=0,tot=0;rows.forEach(r=>{const c=r.cells[i];if(!c||c.colSpan>1)return;if(!c.textContent.trim())return;tot++;if(c.classList.contains("num")||c.classList.contains("tabular"))n++});th.classList.toggle("num",tot>0&&n===tot)})})};
 const sched=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;try{fix()}catch(e){}})};
 const start=()=>{const v=document.getElementById("view")||document.body;new MutationObserver(sched).observe(v,{childList:true,subtree:true});sched()};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else setTimeout(start,0)})();
