/* Round 26 (part 3): proving it. Test agents walk the whole process and find things to fix. A real scan of a generated app checks usability and Section 508 (WCAG 2.1 AA).
   The approval path into the governance body with its calendar and preparation list. The wall of every artifact. Then the beats that put all of this into the four demos. */
(function(){
const W=window,D=document,SD=W.STUD,X=W.STUDIO&&W.STUDIO.x;if(!X||!SD)return;
const {E,G,Q,WHO,head,tile,say,later,render,STAFF,OWN,me,flatSteps}=X,V=X.views;
const A=()=>!Q.fast,steps=()=>flatSteps();
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);x.setHours(12,0,0,0);return x};
const fmt=(d,o)=>d.toLocaleDateString("en-US",o||{weekday:"short",month:"short",day:"numeric"});

/* ================= test agents ================= */
const AG=[["Happy path","Walks the normal route from request to close","a"],["Edge cases","Late, repeated and out of order requests","b"],["Access","Tries every step as people who should not have it","c"],["Data","Missing, wrong and oversized values","d"],["Break it","Removes people and systems in the middle of a run","e"]];
function casesFor(){const st=steps().length,B=Q.B,g=(B.people||[]).reduce((a,x)=>a+Math.min(x.people.length,4),0);return[st*2,st*3,7*Math.max(2,(B.people||[]).length)+g,Math.max(3,B.data.length)*4,st+4*Math.max(1,st>20?4:2)]}
function checks(){const B=Q.B,st=steps(),f=[];
 const gates=st.map((s,i)=>({s,i})).filter(x=>x.s.who==="gate"&&!x.s.base&&!x.s.esc);
 if(gates.length)f.push({id:"esc",a:1,si:gates.map(x=>x.i),t:gates.length+" approval step"+(gates.length>1?"s":"")+" wait forever if the approver is away",fx:"Escalates to the backup after the time limit",ap:()=>gates.forEach(x=>x.s.esc=true)});
 const ag=st.map((s,i)=>({s,i})).filter(x=>x.s.who==="agent"&&!x.s.fallback);
 if(ag.length)f.push({id:"fbk",a:4,si:ag.map(x=>x.i),t:ag.length+" AI agent step"+(ag.length>1?"s":"")+" have no fallback when the agent is unsure or unavailable",fx:"Falls back to a person after one failed try",ap:()=>ag.forEach(x=>x.s.fallback=true)});
 const hand=st.map((s,i)=>({s,i})).filter(x=>x.s.who==="agent"&&st[x.i+1]&&(st[x.i+1].who==="auto"||st[x.i+1].who==="fn")&&!x.s.confirm);
 if(hand.length)f.push({id:"hand",a:1,si:hand.map(x=>x.i),t:"An AI agent's answer flows straight into an automatic step with no person checking",fx:"A person confirms before the next step runs",ap:()=>hand.forEach(x=>x.s.confirm=true)});
 const nd=B.data.filter(d=>d.kind==="new"&&(!d.rule||!d.owner));
 if(nd.length)f.push({id:"rule",a:3,si:[],t:nd.length+" new data attribute"+(nd.length>1?"s":"")+" accept anything",fx:"Rule and owner added",ap:()=>nd.forEach(d=>{d.rule=d.rule||"Required, checked against the source";d.owner=d.owner||me()})});
 const nosla=st.map((s,i)=>({s,i})).filter(x=>!x.s.base&&!x.s.sla&&x.s.who!=="auto");
 if(nosla.length)f.push({id:"sla",a:1,si:nosla.map(x=>x.i),t:nosla.length+" step"+(nosla.length>1?"s have":" has")+" no time limit",fx:"Time limit set from similar steps",ap:()=>nosla.forEach(x=>x.s.sla="2 days")});
 const first=st[0];if(first&&!first.base&&!B.dupFix)f.push({id:"dup",a:1,si:[0],t:"Sending the request twice creates two records",fx:"Duplicate check on the request number",ap:()=>{B.dupFix=true}});
 const big=(B.people||[]).filter(g=>g.lvl==="edit"&&g.people.length>25);
 if(big.length)f.push({id:"edit",a:2,si:[],t:big.map(g=>g.label).join(" and ")+" can all change it ("+big.reduce((a,g)=>a+g.people.length,0)+" people)",fx:"Narrowed to view. Owners and backups keep change",ap:()=>big.forEach(g=>g.lvl="view")});
 return f}
function T(){return Q.T||(Q.T={phase:"idle",prog:[0,0,0,0,0],log:[],runs:0,cases:0,fixedN:0})}
X.runTest=function(){const t=T();t.phase="run";t.runs++;t.prog=[0,0,0,0,0];const n=casesFor();t.n=n;t.cases=n.reduce((a,b)=>a+b,0);Q.B.test=null;render();
 const sp=[14,10,9,12,7];const tick=()=>{if(Q.T!==t||t.phase!=="run")return;t.prog=t.prog.map((p,i)=>Math.min(100,p+sp[i]*(A()?1:20)));render();if(t.prog.every(p=>p>=100))done();else later(tick,380)};
 if(!A()){t.prog=[100,100,100,100,100];done()}else later(tick,380);
 function done(){const f=checks();f.forEach(x=>{if(!t.log.some(l=>l.id===x.id&&!l.done))t.log.push({id:x.id,a:x.a,si:x.si,t:x.t,fx:x.fx,done:false})});
  if(!f.length){t.phase="clean";Q.B.test={clean:true,n:t.cases,fixed:t.fixedN};say("Clean run. <b>"+t.cases+" checks</b> across five test agents, nothing left to fix"+(t.fixedN?" after "+t.fixedN+" fixes.":"."))}
  else{t.phase="found";say("The five test agents ran <b>"+t.cases+" checks</b> and found <b>"+f.length+" thing"+(f.length>1?"s":"")+" to fix</b>:",null,f.map(x=>x.t));if(Q.auto)later(()=>X.fixAllTests(),A()?1500:0)}
  render()}};
X.fixTest=function(id){const t=T(),f=checks().find(x=>x.id===id);if(!f)return;f.ap();const l=t.log.find(x=>x.id===id&&!x.done);if(l)l.done=true;t.fixedN++;
 say("Fixed: <b>"+E(f.fx)+"</b>.");if(!checks().length){t.phase="fixed";if(Q.auto)later(()=>X.runTest(),A()?900:0)}render()};
X.fixAllTests=function(){const t=T();const f=checks();f.forEach(x=>{x.ap();const l=t.log.find(y=>y.id===x.id&&!y.done);if(l)l.done=true;t.fixedN++});if(f.length)say("Fixed all "+f.length+". I am running everything again to prove it.");t.phase="fixed";render();if(A())later(()=>X.runTest(),1100);else X.runTest()};
V.test=function(){const t=T(),B=Q.B,open=checks(),n=t.n||casesFor(),st=steps();const bad=new Set();open.forEach(f=>f.si.forEach(i=>bad.add(i)));
 const sq=st.length>36?st.filter((s,i)=>i%Math.ceil(st.length/36)===0):st,idx=s=>st.indexOf(s);
 const cards=AG.map((a,i)=>{const p=t.prog[i],done=p>=100,fails=t.phase==="idle"||t.phase==="run"?0:open.filter(f=>f.a===i).length,cs=n[i];
  return `<div class="r26-ta card glass ${done?"done":""} ${fails?"fail":""}"><div class="r26-th0"><i class="r26-orb ${a[2]}" aria-hidden="true"></i><span><b>${a[0]}</b><small>${a[1]}</small></span></div><div class="r26-sq" aria-hidden="true">${sq.map(s=>{const k=idx(s),on=p>=(k+1)/st.length*100;return `<u class="${on?(bad.has(k)&&t.phase!=="run"&&fails?"x":"ok"):""}"></u>`}).join("")}</div><div class="r26-tp"><span>${t.phase==="idle"?"Waiting":done?(fails?fails+" to fix":"All passed"):"Running"}</span><b>${Math.round(cs*Math.min(p,100)/100)} of ${cs} checks</b></div></div>`}).join("");
 const log=t.log;const stat=t.phase==="clean"?`<span class="r26-ok">Clean</span>`:t.phase==="found"?`<span class="r26-no">${open.length} to fix</span>`:t.phase==="run"?"Running":t.phase==="fixed"?"Ready to run again":"Not run";
 return `${head("Test agents","Five agents try to break it",`They walk every step, every person's access and every data rule. Run ${t.runs||0}. ${stat}`)}
 <div class="r26-tgrid">${cards}</div>
 ${log.length?`<h3>What they found</h3><div class="r26-fl">${log.map(l=>`<div class="r26-fi card glass ${l.done?"done":""}"><span class="r26-fa">${E(AG[l.a][0])}</span><b>${E(l.t)}</b><small>${l.done?"Fixed: "+E(l.fx):"Fix: "+E(l.fx)}</small>${l.done?`<i class="r26-chk">Fixed</i>`:`<button class="btn quiet" data-r26-fix="${l.id}">Fix</button>`}</div>`).join("")}</div>`:""}
 <div class="stu-cta">${t.phase==="idle"?`<button class="btn primary" data-r26-run="test">Run the test agents</button>`:""}${t.phase==="found"?`<button class="btn primary" data-r26-fixall="1">Fix all ${open.length}</button>`:""}${t.phase==="fixed"?`<button class="btn primary" data-r26-run="test">Run them again</button>`:""}${t.phase==="clean"?`<span class="r26-ok">${t.cases} checks passed${t.fixedN?" after "+t.fixedN+" fixes":""}. Test evidence is attached to the record.</span>`:""}</div>`}

/* ================= usability and Section 508, scanned on a real preview ================= */
const LOGO="data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="9" fill="#1d6f8a"/><path d="M12 28V12h6c5 0 8 3 8 8s-3 8-8 8z" fill="#fff"/></svg>');
function appHTML(fx){const B=Q.B,st=steps().slice(0,4),h=fx.hd?"h2":"h4";const lab=(id,t,ph,type)=>fx.lbl?`<label for="${id}">${E(t)}</label><input id="${id}" type="${type||"text"}" placeholder="${E(ph)}">`:`<input id="${id}" type="${type||"text"}" placeholder="${E(t)}">`;
 const chip=(c,t)=>`<span class="r26-st"><i class="r26-sd ${c}"></i>${fx.col?E(t):""}</span>`;
 const t=E(B.title);
 return `<div class="r26-app ${fx.foc?"fx-foc":""}" lang="en"><header><img src="${LOGO}" width="32" height="32" ${fx.alt?`alt="Meridian Standards Foundation logo"`:""}><h1>${t}</h1><button type="button" class="r26-x ${fx.tgt?"big":""}" ${fx.btn?`aria-label="Close"`:""}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="2"/></svg></button></header>
 <${h}>Start a request</${h}>
 <form onsubmit="return false">${lab("r26f1","What do you need?","Describe it in a sentence")}${lab("r26f2","When is it needed?","Pick a date","date")}<p class="r26-help ${fx.con?"ok":""}">We will tell you who picks it up and how long it should take.</p>
 <div class="r26-bt"><button type="button" class="primary">${fx.ux1?"Submit request":"Click here"}</button><button type="button" class="${fx.ux2?"secondary":"primary"}">Save draft</button><button type="button" class="r26-del ${fx.tgt?"big":""}" data-act="delete" ${fx.ux3?`data-confirm="1" data-undo="1"`:""} ${fx.btn?`aria-label="Delete draft"`:""}><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 4h8M5 4V2h4v2M4 4l.6 8h4.8L10 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button></div></form>
 <${h}>Where it is</${h}>
 <table>${fx.th?`<thead><tr><th scope="col">Step</th><th scope="col">Owner</th><th scope="col">Status</th></tr></thead>`:""}<tbody>${st.map((s,i)=>`<tr>${fx.th?`<th scope="row">${E(s.n)}</th>`:`<td>${E(s.n)}</td>`}<td>${E(s.owner||"Owner")}</td><td>${chip(i===0?"g":i===1?"a":"n",i===0?"Done":i===1?"In progress":"Waiting")}</td></tr>`).join("")}</tbody></table></div>`}
function accName(el){return(el.getAttribute("aria-label")||el.getAttribute("title")||el.textContent||"").trim()}
function hasLabel(el){if(el.getAttribute("aria-label")||el.getAttribute("aria-labelledby"))return true;if(el.id&&el.ownerDocument.querySelector('label[for="'+el.id+'"]'))return true;return!!el.closest("label")}
function lumOf(c){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])}
function rgb(s){const m=String(s).match(/[\d.]+/g)||[0,0,0,1];return[+m[0],+m[1],+m[2],m.length>3?+m[3]:1]}
function bgOf(el){while(el){const c=rgb(getComputedStyle(el).backgroundColor);if(c[3]>.5)return c;el=el.parentElement}return[255,255,255,1]}
const UX=[
 ["alt","508","WCAG 1.1.1 Non-text content","Logo image has no text alternative","Added alt text",r=>[...r.querySelectorAll("img:not([alt])")]],
 ["lbl","508","WCAG 1.3.1 and 3.3.2 Labels","Fields use placeholder text as their only label","Visible labels added",r=>[...r.querySelectorAll("input,select,textarea")].filter(e=>!hasLabel(e))],
 ["btn","508","WCAG 4.1.2 Name, role, value","Icon buttons have no accessible name","Names added for screen readers",r=>[...r.querySelectorAll("button")].filter(b=>!accName(b))],
 ["con","508","WCAG 1.4.3 Contrast (minimum)","Text is too light against its background","Darkened to at least 4.5 to 1",r=>[...r.querySelectorAll("p,label,small,th,td,span,h1,h2,h4,button")].filter(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return false;const cs=getComputedStyle(e),fg=rgb(cs.color),bg=bgOf(e),l1=lumOf(fg),l2=lumOf(bg),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05),big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&+cs.fontWeight>=700);return ratio<(big?3:4.5)})],
 ["col","508","WCAG 1.4.1 Use of color","Status is shown by color alone","Status words added next to the color",r=>[...r.querySelectorAll(".r26-st")].filter(e=>!e.textContent.trim())],
 ["tgt","508","WCAG 2.5.8 Target size (minimum)","Controls are smaller than 24 by 24 pixels","Enlarged to 32 pixels",r=>[...r.querySelectorAll("button,a")].filter(e=>{const b=e.getBoundingClientRect();return b.width<24||b.height<24})],
 ["hd","508","WCAG 1.3.1 Headings","Heading levels skip from 1 to 4","Headings now go 1, 2, 2",r=>{let p=0;const o=[];r.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h=>{const l=+h.tagName[1];if(p&&l>p+1)o.push(h);p=l});return o}],
 ["th","508","WCAG 1.3.1 Tables","Table has no header cells","Header cells added",r=>[...r.querySelectorAll("table")].filter(t=>!t.querySelector("th"))],
 ["foc","508","WCAG 2.4.7 Focus visible","Keyboard focus is hidden on buttons","Visible focus ring restored",r=>{const prev=D.activeElement,o=[...r.querySelectorAll("button,a,input")].filter(e=>{e.focus();const cs=getComputedStyle(e);return(cs.outlineStyle==="none"||parseFloat(cs.outlineWidth)===0)&&cs.boxShadow==="none"});if(prev&&prev.focus)prev.focus();else D.activeElement&&D.activeElement.blur&&D.activeElement.blur();return o}],
 ["ux1","UX","Clear labels","The main button says “Click here”","Now says “Submit request”",r=>[...r.querySelectorAll("button")].filter(b=>/^(click here|submit|ok|go)$/i.test(b.textContent.trim()))],
 ["ux2","UX","One main action","Two primary buttons compete","Save draft is now secondary",r=>[...r.querySelectorAll("form")].reduce((a,f)=>{const p=[...f.querySelectorAll("button.primary")];return a.concat(p.slice(1))},[])],
 ["ux3","UX","Safe actions","Delete has no confirmation or undo","Confirmation and undo added",r=>[...r.querySelectorAll('[data-act="delete"]')].filter(b=>!b.hasAttribute("data-confirm"))]];
function U(){return Q.U||(Q.U={phase:"idle",fx:{},res:[],rounds:0,fixed:0,prog:0,bad:{}})}
function scan(){const u=U(),h=D.createElement("div");h.style.cssText="position:absolute;left:-9999px;top:0;width:560px";h.innerHTML=appHTML(u.fx);D.body.appendChild(h);const root=h.firstElementChild,all=[...root.querySelectorAll("*")];
 u.res=UX.map(c=>{let o=[];try{o=c[5](root)}catch(e){}return{id:c[0],sec:c[1],ref:c[2],t:c[3],fx:c[4],n:o.length,idx:o.map(e=>all.indexOf(e))}});D.body.removeChild(h);u.bad={};u.res.forEach(r=>r.idx.forEach(i=>u.bad[i]=1));return u.res}
X.runUx=function(){const u=U();u.phase="scan";u.rounds++;u.prog=0;Q.B.ux=null;render();
 const fin=()=>{scan();const open=u.res.filter(r=>r.n);if(!open.length){u.phase="clean";Q.B.ux={clean:true,fixed:u.fixed,n:UX.length};say("<b>No open issues.</b> "+UX.filter(c=>c[1]==="508").length+" Section 508 and WCAG 2.1 AA checks and "+UX.filter(c=>c[1]==="UX").length+" usability checks pass"+(u.fixed?" after "+u.fixed+" fixes.":"."))}
  else{u.phase="found";say("I built a preview of the app and scanned it: <b>"+open.length+" problems</b>, "+open.filter(r=>r.sec==="508").length+" of them Section 508 or WCAG 2.1 AA.",null,open.map(r=>r.t));if(Q.auto)later(()=>X.fixAllUx(),A()?1500:0)}render();markBad()};
 const tick=()=>{if(Q.U!==u||u.phase!=="scan")return;u.prog=Math.min(100,u.prog+20);render();if(u.prog>=100)fin();else later(tick,300)};
 if(A())later(tick,300);else fin()};
X.fixUx=function(id){const u=U(),r=u.res.find(x=>x.id===id);if(!r||!r.n)return;u.fx[id]=true;u.fixed++;say("Fixed: <b>"+E(r.fx)+"</b>.");scan();render();markBad()};
X.fixAllUx=function(){const u=U();const open=u.res.filter(r=>r.n);open.forEach(r=>{u.fx[r.id]=true;u.fixed++});if(open.length)say("Fixed all "+open.length+". Scanning the app again.");if(A()){scan();render();markBad();later(()=>X.runUx(),1100)}else X.runUx()};
X.after=function(){if(Q.view==="ux")markBad()};
function markBad(){const u=U(),root=D.querySelector("#r26Pv .r26-app");if(!root)return;const all=[...root.querySelectorAll("*")];Object.keys(u.bad).forEach(i=>{if(all[i])all[i].classList.add("r26-bad")})}
V.ux=function(){const u=U(),B=Q.B,sc=u.res.length?u.res:[],open=sc.filter(r=>r.n),a=UX.filter(c=>c[1]==="508").length,pass=u.phase==="idle"||u.phase==="scan"?0:sc.filter(r=>!r.n).length,score=u.res.length?Math.round(pass/UX.length*100):0;
 const row=r=>`<div class="r26-ur card glass ${r.n?"":"ok"}"><span class="r26-ud ${r.n?"bad":"ok"}"></span><div><b>${E(r.n?r.t:r.t.replace(/^(.)/,x=>x))}</b><small>${E(r.ref)}${r.n?" · "+r.n+" place"+(r.n>1?"s":""):""}</small>${r.n?"":`<small class="r26-fxd">${u.fx[r.id]?"Fixed: "+E(r.fx):"Passes"}</small>`}</div>${r.n?`<button class="btn quiet" data-r26-fixux="${r.id}">Fix</button>`:""}</div>`;
 return `${head("Usability and accessibility","What a person actually sees",'I generate the app screen, then scan the real page for Section 508 (WCAG 2.1 AA) and usability problems.')}
 <div class="r26-uxg"><div class="r26-pvw"><div class="r26-pvh"><span>Preview of the app</span>${u.phase==="scan"?`<i class="r26-scanb"><u style="width:${u.prog}%"></u></i>`:""}</div><div id="r26Pv" class="r26-pv ${u.phase==="scan"?"scan":""}">${appHTML(u.fx)}</div></div>
 <div class="r26-ul"><div class="r26-score"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="18" class="v" style="stroke-dasharray:${(score/100*113).toFixed(0)} 113"/></svg><span><b>${u.res.length?score+"%":"Not scanned"}</b><small>${u.res.length?pass+" of "+UX.length+" checks pass":"Run the scan"}</small></span></div>
 ${u.res.length?`<h4>Section 508 and WCAG 2.1 AA</h4>${sc.filter(r=>r.sec==="508").map(row).join("")}<h4>Usability</h4>${sc.filter(r=>r.sec==="UX").map(row).join("")}`:`<p class="stu-note">${a} accessibility and ${UX.length-a} usability checks are ready.</p>`}</div></div>
 <div class="stu-cta">${u.phase==="idle"?`<button class="btn primary" data-r26-run="ux">Scan the app</button>`:""}${u.phase==="found"?`<button class="btn primary" data-r26-fixall="ux">Fix all ${open.length}</button>`:""}${u.phase==="clean"?`<span class="r26-ok">No open issues. The conformance report is attached to the record.</span>`:""}</div>`}

/* ================= approval path and calendar ================= */
function nth(y,m,dow,n){const d=new Date(y,m,1,12);let c=0;while(true){if(d.getDay()===dow){c++;if(c===n)return new Date(d)}d.setDate(d.getDate()+1)}}
function meetings(){const t=new Date(),out=[];for(let k=0;k<4;k++){const y=new Date(t.getFullYear(),t.getMonth()+k,1).getFullYear(),m=new Date(t.getFullYear(),t.getMonth()+k,1).getMonth();out.push({k:"gb",d:nth(y,m,4,2),n:"Governance Board"});out.push({k:"pc",d:nth(y,m,2,1),n:"Process Council"});out.push({k:"pc",d:nth(y,m,2,3),n:"Process Council"})}return out.sort((a,b)=>a.d-b.d)}
function plan(){const B=Q.B,now=new Date(),M=meetings(),simple=!B.data.some(d=>d.kind==="new")&&!steps().some(s=>s.who==="agent")&&Q.sc&&Q.sc.kind==="extend";
 const body=simple?"pc":"gb";const gb=M.find(m=>m.k===body&&addDays(m.d,-7)>addDays(now,1));const pc=M.find(m=>m.k==="pc"&&m.d<gb.d&&addDays(m.d,-3)>addDays(now,1))||M.find(m=>m.k==="pc");
 const dl=addDays(gb.d,-7);return{simple,gb,pc,dl,M}}
X.govPlan=plan;
function pathSteps(p){const B=Q.B,own=B.owner||me(),nNew=B.data.filter(d=>d.kind==="new").length,nAg=steps().filter(s=>s.who==="agent").length,pk=(re,f)=>X.pickPerson(re,f);
 const s=[["Owner accepts",own,"You are named owner and sponsor. Your backup is told.",B.agreed?"done":"next","Same day"],
 ["Data steward review",pk(/Data and analytics/i,own),nNew?nNew+" new attribute"+(nNew>1?"s":"")+" checked for owner, source and rule.":"Reuses existing data only. A quick confirmation.",B.agreed?"done":"wait","2 days"],
 ["Security and privacy review",pk(/Security/i,own),"Access rules, masked fields and "+(nAg?nAg+" AI agent step"+(nAg>1?"s":""):"no AI agents")+".",B.submitted?"done":"wait","3 days"],
 ["Process Council",pk(/Portfolio and delivery/i,own),"Fit with the process library and other owners. Meets "+fmt(p.pc.d)+".",B.submitted?"done":"wait",fmt(p.pc.d,{month:"short",day:"numeric"})]];
 if(!p.simple)s.push(["Governance Board",pk(/Chief executive/i,own),"Final decision. It sees one page, the test and accessibility results, and your answers to likely questions.",B.submitted?"done":"wait",fmt(p.gb.d,{month:"short",day:"numeric"})]);
 return s}
function prep(p){const B=Q.B,own=B.owner||me(),pk=X.pickPerson;B.prep=B.prep||{};
 return[["Accept ownership",own,new Date(),!!B.agreed,"auto"],["One page summary of the build",me(),new Date(),!!B.built,"auto"],["Test and accessibility results attached",own,new Date(),!!(B.test&&B.test.clean&&B.ux&&B.ux.clean),"auto"],
 ["Book the data steward review",pk(/Data and analytics/i,own),addDays(p.dl,-5),!!B.prep.steward],["Open the security review ticket",pk(/Security/i,own),addDays(p.dl,-5),!!B.prep.sec],["Add a note on any new cost",pk(/Finance/i,own),addDays(p.dl,-3),!!B.prep.cost],["Submit the pack",own,p.dl,!!B.submitted,"auto"],["Rehearse the five minute walkthrough",own,addDays(p.gb.d,-2),!!B.prep.reh]]}
function cal(p,y,m){const first=new Date(y,m,1),pad=first.getDay(),days=new Date(y,m+1,0).getDate(),today=new Date(),cells=[];for(let i=0;i<pad;i++)cells.push("<i></i>");
 for(let d=1;d<=days;d++){const dt=new Date(y,m,d,12),ev=p.M.filter(x=>x.d.toDateString()===dt.toDateString()),isDl=dt.toDateString()===p.dl.toDateString(),isT=dt.toDateString()===today.toDateString(),tgt=dt.toDateString()===p.gb.d.toDateString();
  const lab=ev.map(x=>x.n).join(", ")+(isDl?"Submission deadline":"")+(isT?" Today":"");
  cells.push(`<b class="${ev.some(x=>x.k==="gb")?"gb":ev.some(x=>x.k==="pc")?"pc":""} ${isDl?"dl":""} ${isT?"td":""} ${tgt?"tg":""}" ${lab?`title="${E(lab)}"`:""}>${d}</b>`)}
 return `<div class="r26-mo"><h4>${new Date(y,m,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</h4><div class="r26-wk" aria-hidden="true"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="r26-cg">${cells.join("")}</div></div>`}
V.approve=function(){const B=Q.B,p=plan(),ps=pathSteps(p),pr=prep(p),done=pr.filter(x=>x[3]).length,t=new Date();
 const mo=[[t.getFullYear(),t.getMonth()],[new Date(t.getFullYear(),t.getMonth()+1,1).getFullYear(),new Date(t.getFullYear(),t.getMonth()+1,1).getMonth()]];
 if(p.gb.d.getMonth()>mo[1][1]&&p.gb.d.getFullYear()>=mo[1][0])mo.push([p.gb.d.getFullYear(),p.gb.d.getMonth()]);
 return `${head("Approval","How it gets approved",p.simple?"Low risk: it extends an approved process with no new data and no AI agents, so it goes on the consent agenda.":"Standard path: four reviews, then the Governance Board decides.")}
 <div class="stu-ks">${tile("Target meeting",p.simple?fmt(p.pc.d,{month:"short",day:"numeric"}):fmt(p.gb.d,{month:"short",day:"numeric"}),p.simple?"Process Council, consent agenda":"Governance Board")}${tile("Submit by",fmt(p.dl,{month:"short",day:"numeric"}),"one week ahead")}${tile("Prepared",done+" of "+pr.length,"items ready")}${tile("Status",B.submitted?"Submitted":"Not yet",B.submitted?E(B.submitted):"waiting on you")}</div>
 <h3>The path</h3><ol class="r26-pth">${ps.map((x,i)=>`<li class="${x[3]}"><em>${x[3]==="done"?"✓":i+1}</em><div class="card glass"><b>${E(x[0])}</b><span class="r26-pw"><i class="r26-av" aria-hidden="true">${E(X.initials(x[1]))}</i>${E(x[1])}</span><p>${E(x[2])}</p><small>${E(x[4])}</small></div></li>`).join("")}</ol>
 <h3>The calendar</h3><div class="r26-cals card glass">${mo.map(m=>cal(p,m[0],m[1])).join("")}<div class="r26-cl"><span><i class="gb"></i>Governance Board</span><span><i class="pc"></i>Process Council</span><span><i class="dl"></i>Submit by</span><span><i class="td"></i>Today</span></div></div>
 <h3>What to prepare in advance</h3><div class="r26-pr">${pr.map((x,i)=>`<label class="r26-pi card glass ${x[3]?"done":""}"><input type="checkbox" ${x[3]?"checked":""} ${x[4]==="auto"?"disabled":`data-r26-prep="${["","","","steward","sec","cost","","reh"][i]}"`}><span><b>${E(x[0])}</b><small>${E(x[1])} · by ${fmt(x[2],{month:"short",day:"numeric"})}${x[4]==="auto"?" · done by the studio":""}</small></span></label>`).join("")}</div>
 <div class="stu-cta">${B.submitted?`<span class="r26-ok">Submitted for the ${E(B.submitted)}.</span>`:`<button class="btn primary" data-r26-submit="1">Accept ownership and submit</button>`}</div>`}
X.submit=function(){const B=Q.B,p=plan();B.agreed=true;B.submitted=(p.simple?"Process Council":"Governance Board")+" on "+fmt(p.simple?p.pc.d:p.gb.d,{month:"short",day:"numeric"});say("Submitted for the <b>"+E(B.submitted)+"</b>. The pack is one page, with test and accessibility results attached. Your sponsor, "+E(B.owner||me())+", is named as presenter.");render()};
X.publishFinal=function(){const B=Q.B;if(!B.agreed){say("I will hold it here until you accept ownership.");return}X.publish()};

/* ================= the wall of every artifact ================= */
const svg=(x)=>`<svg class="r26-ts" viewBox="0 0 160 96" aria-hidden="true">${x}</svg>`;
const LCOL={human:"h",auto:"a",fn:"f",agent:"g",gate:"k"};
const TH={
 proc:()=>{const st=steps(),n=Math.min(st.length,14),L=["human","agent","fn","auto","gate"];let o="";st.slice(0,n).forEach((s,i)=>{const x=10+i*(140/n),y=8+L.indexOf(s.who)*17;o+=`<rect class="${LCOL[s.who]}" x="${x}" y="${y}" width="${Math.max(6,140/n-4)}" height="11" rx="3"/>`});return svg(o)},
 agents:()=>{const m={human:0,gate:0,fn:0,agent:0,auto:0};steps().forEach(s=>m[s.who]++);const t=steps().length||1;let x=10,o="";["human","gate","fn","agent","auto"].forEach(k=>{const w=m[k]/t*140;if(w){o+=`<rect class="${LCOL[k]}" x="${x}" y="30" width="${Math.max(2,w-2)}" height="28" rx="5"/>`;x+=w}});return svg(o+`<rect class="f" x="10" y="68" width="10" height="10" rx="3"/><rect class="g" x="26" y="68" width="10" height="10" rx="3"/><rect class="h" x="42" y="68" width="10" height="10" rx="3"/>`)},
 std:()=>svg([0,1,2,3].map(i=>`<rect class="p" x="10" y="${10+i*20}" width="38" height="13" rx="6"/><rect class="l" x="56" y="${13+i*20}" width="${70+((i*23)%40)}" height="6" rx="3"/>`).join("")),
 data:()=>svg([0,1,2,3].map(i=>`<circle class="h" cx="18" cy="${16+i*22}" r="6"/>`).join("")+[0,1,2].map(i=>`<rect class="a" x="124" y="${10+i*28}" width="26" height="16" rx="5"/>`).join("")+[[0,0],[1,0],[2,1],[3,2],[1,2]].map(c=>`<path class="ln" d="M24 ${16+c[0]*22} C70 ${16+c[0]*22} 80 ${18+c[1]*28} 124 ${18+c[1]*28}"/>`).join("")),
 metrics:()=>{const m=(Q.B.metrics[0]||{tr:[3,4,3,5,6,6,7]}).tr||[3,4,5],mn=Math.min.apply(0,m),mx=Math.max.apply(0,m),r=mx-mn||1;const p=m.map((v,i)=>`${10+i*140/(m.length-1)},${80-(v-mn)/r*58}`).join(" ");return svg(`<polyline class="sp" points="${p}"/><polygon class="spa" points="10,86 ${p} 150,86"/>`)},
 access:()=>{const b=X.connect.base(),s=STAFF().slice(0,48);return svg(s.map((p,i)=>`<circle class="lv-${X.levelFor(p.n,"proc",b)}" cx="${14+(i%12)*11.6}" cy="${16+Math.floor(i/12)*18}" r="4.4"/>`).join(""))},
 maturity:()=>{const c=X.curLevel(),t=X.connect.tgtOf();return svg([1,2,3,4,5].map(l=>`<rect class="${l<=c?"a":l<=t?"t":"l"}" x="${12+(l-1)*29}" y="${78-l*13}" width="22" height="${l*13}" rx="3"/>`).join(""))},
 roadmap:()=>svg([0,1,2].map(i=>`<rect class="l" x="10" y="${14+i*24}" width="140" height="12" rx="6"/><rect class="${["h","g","f"][i]}" x="${10+i*36}" y="${14+i*24}" width="${60}" height="12" rx="6"/>`).join("")),
 bcp:()=>svg([[120,"k"],[84,"a"],[60,"g"],[34,"f"],[22,"l"]].map((r,i)=>`<rect class="${r[1]}" x="10" y="${10+i*16}" width="${r[0]}" height="10" rx="5"/>`).join("")),
 know:()=>svg([0,1,2,3,4,5].map(i=>`<rect class="l" x="14" y="${12+i*13}" width="${i%3===2?70:130}" height="6" rx="3"/>`).join("")),
 test:()=>svg([0,1,2,3,4].map(i=>`<rect class="l" x="30" y="${10+i*16}" width="116" height="9" rx="4"/><rect class="a" x="30" y="${10+i*16}" width="${60+i*13}" height="9" rx="4"/><circle class="a" cx="16" cy="${14.5+i*16}" r="5"/>`).join("")),
 ux:()=>svg(`<rect class="l" x="14" y="10" width="60" height="76" rx="8"/><rect class="p" x="20" y="18" width="48" height="8" rx="3"/><rect class="a" x="20" y="66" width="48" height="10" rx="5"/><circle class="ring" cx="116" cy="48" r="22"/><circle class="ring v" cx="116" cy="48" r="22" stroke-dasharray="138 138"/>`),
 approve:()=>svg(Array.from({length:28},(_,i)=>`<rect class="${i===17?"f":i===10?"k":"l"}" x="${12+(i%7)*20}" y="${12+Math.floor(i/7)*19}" width="15" height="14" rx="4"/>`).join("")),
 agree:()=>svg(`<rect class="l" x="30" y="8" width="100" height="80" rx="6"/><rect class="p" x="42" y="20" width="60" height="6" rx="3"/><rect class="p" x="42" y="34" width="76" height="6" rx="3"/><path class="sig" d="M44 70 q8 -16 14 0 t14 0 t18 -6"/>`),
 audit:()=>svg(`<path class="ln" d="M20 48 H140"/>`+[0,1,2,3,4,5].map(i=>`<circle class="${i%2?"g":"h"}" cx="${24+i*22}" cy="${i%2?34:62}" r="6"/><path class="ln" d="M${24+i*22} 48 V${i%2?34:62}"/>`).join(""))};
function wallItems(){const B=Q.B,b=!!Q.built,t=B.test&&B.test.clean,u=B.ux&&B.ux.clean,g=B.guard||{},n=steps().length;const R=Q.reached;
 return[["proc","Process and workflow",n+" steps on five lanes","flow",1],["agents","AI agents and Functions",steps().filter(s=>s.who==="fn").length+" Function"+(steps().filter(s=>s.who==="fn").length===1?"":"s")+", "+steps().filter(s=>s.who==="agent").length+" AI agent"+(steps().filter(s=>s.who==="agent").length===1?"":"s"),"agents",!!R.agents],["std","Standards by step",X.design.stdRows().length+" recommendations","stdstep",!!R.std],["data","Data model map",B.data.length+" elements, "+B.data.filter(d=>d.kind==="new").length+" new","datamap",!!R.data],["metrics","Measures",B.metrics.length+" with a decision each","metrics",!!R.metrics],["access","Access by color","Org chart colored by who reaches what","perm",!!R.access],["maturity","Maturity model","Level "+X.curLevel()+" to "+X.connect.tgtOf(),"maturity",!!R.maturity],["roadmap","Roadmap","Releases with research assigned","maturity",!!R.maturity],["bcp","Continuity plan","Fallback for every critical step","bcp",!!R.bcp],["know","Knowledge articles",(g.articles||[]).length+" drafted","guard",b],["test","Test report",t?"Passed":"Test agents next","test",!!t],["ux","UX and 508 report",u?"Passed":"Scan next","ux",!!u],["approve","Approval pack",B.submitted?"Submitted":"Calendar and prep","approve",!!B.submitted],["agree","Ownership agreement",B.agreed?"Accepted":"Waiting for you","guard",!!B.agreed],["audit","Audit trail","Every edit logged with its author","guard",b]]}
function wall(){const it=wallItems(),show=Q.built&&!Q.wallSeen;if(Q.built)Q.wallSeen=true;
 return `<div class="r26-wall">${it.map((x,i)=>`<button type="button" class="r26-wt card glass ${x[4]?"on":""} ${show?"pop":""}" style="--i:${i}" data-r26-jump="${x[3]}" ${x[4]?"":"disabled"} aria-label="${E(x[1])}: ${E(x[2])}${x[4]?"":", not ready yet"}"><div class="r26-th">${x[4]?TH[x[0]]():`<span class="r26-ghost"></span>`}</div><b>${E(x[1])}</b><small>${E(x[2])}</small><i class="r26-ck ${x[4]?"on":""}" aria-hidden="true">${x[4]?"✓":""}</i></button>`).join("")}</div>`}
X.wall=wall;
V.guard=function(){const B=Q.B,b=Q.built,it=wallItems(),n=it.filter(x=>x[4]).length;
 return `${head("Guardrails","Everything that comes with it",b?n+" of "+it.length+" artifacts ready. Open any of them.":"You asked for one thing. These come with it by default.")}${wall()}
 <div class="stu-cta">${b?`<span class="stu-hint">${n<it.length?"Next the test agents, the accessibility scan and approval fill in the rest.":"Everything is ready."}</span>`:`<button class="btn primary" data-stu-build="1">Build the app and all its guardrails</button>`}</div>`};
const oldShare=V.share;V.share=function(){const h=oldShare();return h.replace('<div class="stu-gg">','<h3>Everything that ships with it</h3>'+wall()+'<h3>Checks before publishing</h3><div class="stu-gg">')};

/* ================= events ================= */
D.addEventListener("click",e=>{if(!D.getElementById("stuRoot"))return;const c=e.target.closest&&e.target.closest("[data-r26-run],[data-r26-fix],[data-r26-fixall],[data-r26-fixux],[data-r26-submit],[data-r26-jump]");if(!c)return;const d=c.dataset;
 if(d.r26Run==="test"){X.runTest();return}if(d.r26Run==="ux"){X.runUx();return}
 if(d.r26Fix){X.fixTest(d.r26Fix);return}if(d.r26Fixall==="ux"){X.fixAllUx();return}if(d.r26Fixall){X.fixAllTests();return}
 if(d.r26Fixux){X.fixUx(d.r26Fixux);return}if(d.r26Submit){X.submit();return}
 if(d.r26Jump){Q.view=d.r26Jump;render();if(Q.view==="ux")markBad()}});
D.addEventListener("change",e=>{const t=e.target;if(!t.matches||!t.matches("[data-r26-prep]")||!D.getElementById("stuRoot"))return;Q.B.prep[t.dataset.r26Prep]=t.checked;render()});

/* ================= the beats: injected into every demo ================= */
const lastIdx=(bs,f)=>{let k=-1;bs.forEach((b,i)=>{if(f(b))k=i});return k};
X.beatsFor=function(sc,bs){
 const cur=X.curLevel?X.curLevel():2;
 const ins=(at,list)=>{bs.splice(at+1,0,...list)};
 const B=()=>Q.B,fnN=()=>steps().filter(s=>s.who==="fn").length;
 const guardAt=bs.findIndex(b=>b.guard);
 /* after the last Standards beat, the guardrail checks that need only the process */
 const pAt=Math.max(lastIdx(bs,b=>b.ph==="process"),lastIdx(bs,b=>b.ph==="std"));
 const design=[
  {ph:"std",btn:"Check each step against the standards",view:"stdstep",say:()=>["I checked every step against what the industry does and wrote a recommendation for each one that has a standard. <b>"+X.design.stdRows().length+" of "+steps().length+" steps</b> have one."]},
  {ph:"agents",btn:"Where should AI agents help?",view:"agents",hold:3200,say:()=>{const rows=X.design.rows(),c=rows.filter(r=>!r.s.base);const fn=c.filter(r=>r.tgt==="fn").length,ag=c.filter(r=>r.tgt==="agent").length,rm=c.filter(r=>r.cur==="agent"&&r.tgt==="fn");
   return["I asked one question of each step: <i>is the answer always the same for the same input?</i> If it is, I do not recommend an AI agent. A <b>Function</b>, a fixed rule shown in indigo, is cheaper, instant and exactly testable.",
    "Result: <b>"+fn+"</b> step"+(fn===1?"":"s")+" as Functions, <b>"+ag+"</b> for an AI agent with a person confirming, the rest with people."+(rm.length?" I took the AI agent off <b>"+E(rm[0].s.n)+"</b>: a comparison against a limit does not need one.":"")]},
   run:()=>{if(A())later(()=>{X.applyAgents();render()},1400);else X.applyAgents()}}];
 ins(pAt<0?1:pAt,design);
 const dAt=lastIdx(bs,b=>b.ph==="data");
 ins(dAt<0?bs.length-2:dAt,[{ph:"data",btn:"Show how it plugs into the data model",view:"datamap",say:()=>["Here is how it connects to the data model. Each line is a step reading or writing an entity. Existing entities are read where they live, not copied. Only what is new gets registered, as a proposal with an owner."]}]);
 const aAt=lastIdx(bs,b=>b.ph==="access");
 ins(aAt<0?bs.length-2:aAt,[{ph:"access",btn:"Show who can reach what",view:"perm",say:()=>["Permissions first, in color: one color per level, for each part of what you are building. Then the same colors on the org chart, so you can see at a glance who reaches what. Choose a component to recolor the chart."]}]);
 const gAt=bs.findIndex(b=>b.guard),mat=cur<5?[{l:"Level "+(cur+1)+", "+X.connect.LADDER[cur][0],t:cur+1,rec:1}]:[];
 if(cur+1<5)mat.push({l:"Level "+(cur+2)+", "+X.connect.LADDER[cur+1][0],t:cur+2});mat.push({l:"Stay at Level "+cur,t:cur});
 const pre=[
  {ph:"maturity",btn:"Set a maturity target",view:"maturity",say:()=>["Where is this process on the maturity ladder today? <b>Level "+cur+", "+X.connect.LADDER[cur-1][0]+"</b>. You choose how far to take it, and I build the roadmap and assign the research."],
   ask:{q:"Where should it be?",opts:mat.map(m=>({l:m.l,rec:m.rec,tgt:m.t,say:m.t>cur?"Target set. I built a roadmap of "+(m.t-cur)+" release"+(m.t-cur>1?"s":"")+" and assigned each piece of research to the person who knows the area best.":"Understood. It stays at Level "+cur+" and I will not generate a roadmap."}))}},
  {ph:"bcp",btn:"Build the continuity plan",view:"bcp",say:()=>["Now the business continuity plan: which steps would hurt most if they stopped, how long you can wait on each, and who steps in. The fallback for each is written, and the first drill is on the calendar."]}];
 bs.splice(gAt<0?bs.length-1:gAt,0,...pre);
 const post=[
  {ph:"test",btn:"Run the test agents",view:"test",hold:9500,say:["Now I try to break it. Five test agents walk the whole process: the normal route, edge cases, every person's access, bad data, and what happens when people or systems disappear."],run:()=>X.runTest()},
  {ph:"ux",btn:"Check usability and Section 508",view:"ux",hold:6500,say:["Next I check what a person would see. I generate the app screen and scan the real page for Section 508 and WCAG 2.1 AA problems and for usability."],run:()=>X.runUx()},
  {ph:"approve",btn:"Show the approval path",view:"approve",say:()=>{const p=plan();return["Last, approval. "+(p.simple?"This is low risk, so it goes to the Process Council on the consent agenda.":"It goes through four reviews, then the Governance Board decides.")+" The next "+(p.simple?"council":"board")+" meeting that works is <b>"+fmt(p.simple?p.pc.d:p.gb.d,{month:"long",day:"numeric"})+"</b>. The pack is due one week before. Here is what to prepare."]},
   ask:{q:"Accept ownership and submit it?",opts:[{l:"Accept and submit",rec:1,agree:true,run:"submit"},{l:"Not yet",say:"Understood. Nothing is submitted. Everything stays here until you are ready."}]}},
  {ph:"share",btn:"Share it with the enterprise",view:"share",say:["Now it can go in the library."],run:()=>{later(()=>X.publishFinal(),A()?500:0)}}];
 bs.push(...post);
 return bs};
})();
