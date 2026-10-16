/* Round 26 (part 2): the data model map, permissions drawn in color and then on the org chart, the maturity target and roadmap, and the continuity plan. */
(function(){
const W=window,D=document,SD=W.STUD,X=W.STUDIO&&W.STUDIO.x;if(!X||!SD)return;
const {E,G,Q,WHO,head,tile,eyebrow,flatSteps,say,later,render,STAFF,OWN,me}=X,V=X.views;
const steps=()=>flatSteps();
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmt=(d,o)=>d.toLocaleDateString("en-US",o||{month:"short",day:"numeric"});

/* ---------- 1. how it plugs into the data model ---------- */
function links(){const B=Q.B,st=steps(),ents=Array.from(new Set(B.data.map(d=>d.ent))),out=[];
 const stop=/the|and|for|a|an|of|to|new|record|check/;
 const tok=s=>String(s).toLowerCase().replace(/[^a-z ]/g," ").split(/\s+/).filter(x=>x.length>3&&!stop.test(x));
 const show=st.length>9?st.filter((s,i)=>i%Math.ceil(st.length/9)===0).slice(0,9):st;
 show.forEach(s=>{const si=st.indexOf(s);let hit=ents.filter(e=>{const t=tok(e.replace(/[._]/g," "));return tok(s.n).some(x=>t.some(y=>y.indexOf(x)===0||x.indexOf(y)===0))});
  if(!hit.length){const el=B.data.filter(d=>tok(d.el).some(x=>tok(s.n).some(y=>y.indexOf(x)===0||x.indexOf(y)===0))).map(d=>d.ent);hit=Array.from(new Set(el))}
  if(!hit.length&&ents.length)hit=[ents[Math.min(ents.length-1,Math.floor(show.indexOf(s)*ents.length/show.length))]];
  hit.slice(0,2).forEach(e=>out.push({si,s,e,w:/record|update|file|sign|write|restock|release|close|log|trigger/i.test(s.n)}))});
 return{show,ents,out}}
function tableInfo(ent){const base=String(ent).split(".")[0],t=G(()=>DATAMODEL.tables[base],null);return t?{label:t.label||base,fields:(t.fields||[]).length,domain:t.domain||"unassigned",ex:true}:{label:base.replace(/_/g," "),fields:0,domain:"not in the model yet",ex:false}}
V.datamap=function(){const B=Q.B,L=links(),LW=176,RW=176,GAP=190,W0=LW+GAP+RW,RH=58,H=Math.max(L.show.length,L.ents.length)*RH+10;
 const ly=i=>5+i*RH+(H-10-L.show.length*RH)/2+0,ry=i=>5+i*RH+(H-10-L.ents.length*RH)/2;
 let svg=`<svg class="r26-dmsvg" width="${W0}" height="${H}" viewBox="0 0 ${W0} ${H}" aria-hidden="true">`;
 L.out.forEach((l,k)=>{const si=L.show.indexOf(l.s),ei=L.ents.indexOf(l.e),y1=ly(si)+22,y2=ry(ei)+24,x1=LW,x2=LW+GAP,m=(x1+x2)/2,nw=B.data.filter(d=>d.ent===l.e).every(d=>d.kind==="new");
  svg+=`<path class="r26-ln ${nw?"new":""} ${l.w?"w":""}" style="--i:${k}" d="M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}"/>`});
 svg+="</svg>";
 const left=L.show.map((s,i)=>`<div class="r26-dn ${WHO[s.who][1]}" style="top:${ly(i)}px;width:${LW}px"><em>${steps().indexOf(s)+1}</em><b>${E(s.n)}</b></div>`).join("");
 const right=L.ents.map((e,i)=>{const rows=B.data.filter(d=>d.ent===e),nw=rows.every(d=>d.kind==="new"),mixed=!nw&&rows.some(d=>d.kind==="new"),ti=tableInfo(e);
  return `<div class="r26-de ${nw?"new":""}" style="top:${ry(i)}px;left:${LW+GAP}px;width:${RW}px"><code>${E(e)}</code><small>${nw?"New":mixed?"Reused, with new":"Reused"} · ${rows.length} element${rows.length>1?"s":""}</small></div>`}).join("");
 const nNew=B.data.filter(d=>d.kind==="new").length,nOld=B.data.length-nNew;
 const reg=B.built&&B.ents?`<p class="r26-call">Registered in the data model as a <b>proposed</b> entity with ${B.ents} new attribute${B.ents>1?"s":""}. Existing entities are read in place, not copied.</p>`:"";
 const checks=[["Only authoritative sources are read",true],["Every new element has an owner",B.data.filter(d=>d.kind==="new").every(d=>d.owner),B.data.filter(d=>d.kind==="new").filter(d=>!d.owner).length?"Waiting on an owner":""],["Every new element has a validation rule",B.data.filter(d=>d.kind==="new").every(d=>d.rule)],["No duplicate of an existing element",true],["Classification set (internal by default)",true],["Sensitive fields masked for view-only people",true]];
 return `${head("Data","How it plugs into the data model",`<b>${nOld}</b> elements read from existing entities, <b>${nNew}</b> new. Lines show which steps read or write them.`)}
 <div class="r26-dmleg"><span><i class="ln"></i>Reads an existing entity</span><span><i class="ln w"></i>Writes</span><span><i class="ln new"></i>New data</span></div>
 <div class="r26-dmwrap card glass"><div class="r26-dm" style="width:${W0}px;height:${H}px">${svg}${left}${right}</div></div>
 <h3>What exists in the model</h3><div class="r26-tbl">${Array.from(new Set(L.ents.map(e=>String(e).split(".")[0]))).map(e=>{const ti=tableInfo(e);return `<div class="r26-tr card glass"><b>${E(ti.label)}</b><span>${ti.ex?ti.fields+" fields · "+E(ti.domain):"Proposed by this build"}</span><i class="r26-pill ${ti.ex?"ok":"new"}">${ti.ex?"In the data model":"New entity"}</i></div>`}).join("")}</div>
 ${reg}<h3>Checked for you</h3><div class="stu-gg">${checks.map(c=>X.glTile([c[0],c[2]||"",c[1]])).join("")}</div>`}

/* ---------- 2. permissions: define by color, then see it on the org chart ---------- */
const LV={none:{n:"No access",s:"None"},see:{n:"Can see",s:"See"},masked:{n:"Masked",s:"Masked"},change:{n:"Can change",s:"Change"},sign:{n:"Can sign off",s:"Sign off"}};
const COMPS=[["proc","Process and steps"],["meas","Measures"],["data","New data attributes"],["sens","Sensitive fields"],["know","Knowledge articles"],["appr","Approvals and sign-off"],["audit","Audit trail"]];
function base(){const B=Q.B,m={},own=(OWN[Q.sc&&Q.sc.id]||[me(),"Casey Rowan"]);
 const rank={view:1,edit:2,sign:3};(B.people||[]).forEach(g=>{(g.people||[]).forEach(n=>{const l=rank[g.lvl]||1;if(!m[n]||m[n].l<l)m[n]={l,g:g.label}})});
 const ow=B.owner||own[0],bk=own[1];m[ow]={l:3,g:"Owner"};if(bk&&bk!==ow)m[bk]=Object.assign({},m[bk]||{},{l:Math.max(3,(m[bk]||{}).l||0),g:"Backup"});
 return{m,ow,bk,stew:B.data.filter(d=>d.kind==="new"&&d.owner).map(d=>d.owner)}}
X.levelFor=function(n,comp,b){b=b||base();const e=b.m[n],l=e?e.l:0,isO=n===b.ow||n===b.bk;
 const r={proc:()=>l>=3?"sign":l===2?"change":l?"see":"none",meas:()=>l>=2&&isO?"change":l?"see":"none",data:()=>l>=2&&(b.stew.indexOf(n)>=0||isO)?"change":l?"see":"none",sens:()=>isO||l>=3?"see":l?"masked":"none",know:()=>l>=2?"change":l?"see":"none",appr:()=>l>=3?"sign":l?"see":"none",audit:()=>(l>=3||isO)?"see":"none"};return r[comp]()};
V.perm=function(){const B=Q.B,b=base(),groups=(B.people||[]).map(g=>({label:g.label,n:g.people.length,lvl:g.lvl,ext:g.ext}));
 const cols=[{k:"owner",l:"Owner and backup",who:b.ow},...groups.slice(0,3).map(g=>({k:g.label,l:g.label,n:g.n,sample:(B.people.find(x=>x.label===g.label)||{people:[]}).people[0],lvl:g.lvl,ext:g.ext})),{k:"other",l:"Everyone else",who:"__none"}];
 const cell=(c,comp)=>{let lv;if(c.k==="owner")lv=X.levelFor(b.ow,comp,b);else if(c.k==="other")lv="none";else if(c.ext)lv=comp==="proc"||comp==="know"?"see":"none";else lv=c.sample?X.levelFor(c.sample,comp,b):"none";return `<td><span class="r26-lv ${lv}"><i></i>${LV[lv].s}</span></td>`};
 const sel=Q.permComp||"proc",chart=chartHTML(sel,b),cnt={sign:0,change:0,see:0,masked:0,none:0};STAFF().forEach(p=>cnt[X.levelFor(p.n,sel,b)]++);
 return `${head("Access","Permissions, in color",'One color for each level. First the rules, then the same colors on the org chart.')}
 <div class="r26-leg">${["see","change","sign","masked","none"].map(k=>`<span class="r26-lv ${k}"><i></i>${LV[k].n}</span>`).join("")}</div>
 <div class="r26-mxw card glass"><table class="r26-mx"><caption class="r26-sr0">Access by component and group</caption><thead><tr><th scope="col">Component</th>${cols.map(c=>`<th scope="col">${E(c.l)}${c.n?`<small>${c.n} people</small>`:""}</th>`).join("")}</tr></thead><tbody>${COMPS.map(([k,n])=>`<tr class="${sel===k?"on":""}"><th scope="row"><button type="button" data-r26-comp="${k}">${E(n)}</button></th>${cols.map(c=>cell(c,k)).join("")}</tr>`).join("")}</tbody></table></div>
 <h3>Now the org chart, colored by who reaches <i>${E(COMPS.find(c=>c[0]===sel)[1].toLowerCase())}</i></h3>
 <div class="r26-pick" role="group" aria-label="Component">${COMPS.map(([k,n])=>`<button type="button" class="${sel===k?"on":""}" data-r26-comp="${k}" aria-pressed="${sel===k}">${E(n)}</button>`).join("")}</div>
 <div class="r26-cnt">${["sign","change","see","masked","none"].filter(k=>cnt[k]).map(k=>`<span class="r26-lv ${k}"><i></i><b>${cnt[k]}</b> ${LV[k].n.toLowerCase()}</span>`).join("")}</div>
 ${chart}<p class="stu-note">Color is never the only signal: every person also carries a letter, and each cell above names its level.</p>`}
const LET={sign:"S",change:"C",see:"V",masked:"M",none:""};
function chartHTML(comp,b){const s=STAFF(),root=s.find(x=>!s.some(y=>y.n===x.mgr));if(!root)return"";
 const kids=n=>s.filter(x=>x.mgr===n);const desc=n=>kids(n).reduce((a,k)=>a.concat([k],desc(k.n)),[]);
 const dot=p=>{const lv=X.levelFor(p.n,comp,b);return `<span class="r26-pd ${lv}" title="${E(p.n)}, ${E(p.role)}: ${LV[lv].n}" role="img" aria-label="${E(p.n)}: ${LV[lv].n}">${E(X.initials(p.n))}<sup>${LET[lv]}</sup></span>`};
 const top=kids(root.n);
 return `<div class="r26-org card glass"><div class="r26-ceo">${dot(root)}<span><b>${E(root.n)}</b><small>${E(root.role)}</small></span></div><div class="r26-cols">${top.map(t=>{const d=desc(t.n);return `<section class="r26-oc"><header>${dot(t)}<span><b>${E(t.n.split(" ")[0]+" "+t.n.split(" ").slice(-1))}</b><small>${E(t.role)}</small></span></header><div class="r26-dots">${d.map(dot).join("")}</div>${d.length?"":`<small class="r26-0">No reports</small>`}</section>`}).join("")}</div></div>`}

/* ---------- 3. maturity: set the target, get the roadmap and the people who research it ---------- */
const LADDER=[["Initial","Done by habit. Depends on who is there."],["Managed","Named owner, written steps, time limits."],["Defined","Same way everywhere, with training."],["Measured","Numbers on a cadence, with limits."],["Optimizing","Improved on purpose, with experiments."]];
const BANK={2:[["Name an owner and a different backup","Who covers when the owner is out?",/people operations|human/i,"Process owner role definition"],["Write the steps with time limits","What do similar teams allow per step?",/Standards development|Portfolio/i,"Time limit benchmarks"],["Put every measure on a monthly review","Which decision does each measure drive?",/Data and analytics/i,"Measure review cadence"]],
 3:[["Make the process the same in every team","Where do teams differ today, and why?",/Portfolio and delivery|Architecture/i,"Variance across teams"],["Train and certify the people who run it","What training is required by role?",/people operations/i,"Role based training plan"],["Log every exception with a reason","Which exceptions repeat?",/Internal audit|Legal/i,"Exception taxonomy"]],
 4:[["Set numeric targets with control limits","What is normal variation for each measure?",/Data and analytics/i,"Statistical limits"],["Alert automatically on drift","Which drift needs a person, which a function?",/Platform engineering/i,"Alerting design"],["Do a root cause on every miss","What causes recur?",/Internal audit|Security/i,"Root cause library"]],
 5:[["Keep a standing improvement backlog","Which fixes pay back fastest?",/Finance/i,"Value of improvements"],["Run experiments on the slowest step","What can we change safely and measure?",/Data and analytics|Architecture/i,"Experiment design"],["Compare against outside benchmarks","Who does this best, and how?",/Standards development|Internal audit/i,"External benchmarks"]]};
X.curLevel=function(){const g=(Q.sc&&Q.sc.beats.find(b=>b.guard)||{}).guard,m=String((g&&g.maturity)||"").match(/Level (\d)/i);return m?+m[1]:(Q.sc&&Q.sc.kind==="extend"?3:2)};
X.setTarget=function(n){Q.B.target=Math.max(X.curLevel(),Math.min(5,+n||X.curLevel()+1))};
const tgtOf=()=>Q.B.target||Math.min(5,X.curLevel()+1);
function roadmap(){const cur=X.curLevel(),tgt=tgtOf(),rel=[];let wk=0;for(let l=cur+1;l<=tgt;l++){wk+=6;const acts=(BANK[l]||[]).map(a=>{const who=X.pickPerson(a[2],me()),P=X.person(who);return{t:a[0],q:a[1],topic:a[3],who,unit:P?P.unit:"",role:P?P.role:""}});rel.push({l,name:LADDER[l-1][0],by:addDays(new Date(),wk*7),acts})}return rel}
V.maturity=function(){const cur=X.curLevel(),tgt=tgtOf(),rm=roadmap(),nA=rm.reduce((a,r)=>a+r.acts.length,0);
 return `${head("Maturity","Where it is and where you want it",`Today <b>Level ${cur}, ${LADDER[cur-1][0]}</b>. Pick a target and I build the roadmap and assign the research.`)}
 <ol class="r26-lad" aria-label="Maturity levels">${LADDER.map((x,i)=>{const l=i+1,st=l<cur?"past":l===cur?"now":l<=tgt?"goal":"off";return `<li class="${st} ${l===tgt?"tgt":""}"><button type="button" data-r26-tgt="${l}" ${l<cur?"disabled":""} aria-pressed="${l===tgt}"><em>${l}</em><b>${x[0]}</b><small>${x[1]}</small>${l===cur?`<u>You are here</u>`:""}${l===tgt&&l!==cur?`<u class="t">Target</u>`:""}</button></li>`}).join("")}</ol>
 ${tgt>cur?`<h3>Roadmap to Level ${tgt}</h3><p class="stu-sum">${rm.length} release${rm.length>1?"s":""}, ${nA} actions. Each has someone assigned to research it first, so nothing starts from a blank page.</p>
 <div class="r26-rm">${rm.map(r=>`<section class="r26-rl card glass"><header><em>L${r.l}</em><b>${E(r.name)}</b><span>by ${fmt(r.by,{month:"short",day:"numeric",year:"numeric"})}</span></header>${r.acts.map(a=>`<div class="r26-ra"><b>${E(a.t)}</b><p>Research: ${E(a.q)}</p><div class="r26-asg"><span class="r26-av" aria-hidden="true">${E(X.initials(a.who))}</span><span><b>${E(a.who)}</b><small>${E(a.unit)} · ${E(a.topic)}</small></span></div></div>`).join("")}</section>`).join("")}</div>`:`<p class="stu-note">Target is where it is today. Choose a higher level to generate a roadmap.</p>`}`}

/* ---------- 4. business continuity ---------- */
function bcpRows(){const st=steps(),b=base(),out=[];st.forEach((s,i)=>{let sc=0;if(s.who==="gate")sc+=3;if(/sign|approv|release|decid|batch|safety|payment|refund|permit|isolat|hold|certificate|calibrat/i.test(s.n))sc+=3;if(s.who==="human")sc+=1;if(s.who==="agent"||s.who==="fn")sc+=1;if(i===0||i===st.length-1)sc+=1;out.push({s,i,sc})});
 out.sort((a,c)=>c.sc-a.sc||a.i-c.i);return out.slice(0,6).map(r=>{const s=r.s,tier=r.sc>=5?1:r.sc>=3?2:3,rto=tier===1?4:tier===2?24:72;
  const fb=s.who==="gate"||/sign|approv/i.test(s.n)?"Backup approver signs on paper, entered afterwards":s.who==="agent"?"A person does it by hand from the checklist":s.who==="fn"||s.who==="auto"?"Run the same rule by hand in a spreadsheet, then reconcile":"The backup person takes it, using the printed steps";
  return{i:r.i,n:s.n,who:s.who,tier,rto,fb,imp:tier===1?"Stops the whole process and leaves a record gap":tier===2?"Work queues up and deadlines slip":"Inconvenient. Catch up later",dep:(Q.B.data[r.i%Math.max(1,Q.B.data.length)]||{}).ent||"process log"}})}
V.bcp=function(){const B=Q.B,b=base(),rows=bcpRows(),own=b.ow,bk=b.bk||me(),svc=X.pickPerson(/service desk/i,me()),maxR=72,first=addDays(new Date(),75);
 return `${head("Continuity","If it stops, what happens next",`The ${rows.length} steps that would hurt most, how long you can wait, and who steps in.`)}
 <div class="stu-ks">${tile("Critical steps",rows.filter(r=>r.tier===1).length,"recover within 4 hours")}${tile("Owner",E(own),"calls the first response")}${tile("Backup",E(bk),"takes over at once")}${tile("First drill",fmt(first),"tabletop, 45 minutes")}</div>
 <h3>How long each step can wait</h3><div class="r26-bc card glass">${rows.map(r=>`<div class="r26-bcr"><span class="r26-bcn"><em class="${WHO[r.who][1]}">${r.i+1}</em><b>${E(r.n)}</b></span><span class="r26-bcb"><i class="t${r.tier}" style="width:${Math.max(6,Math.round(r.rto/maxR*100))}%"></i></span><span class="r26-bct">${r.rto<24?r.rto+" hours":r.rto/24+" day"+(r.rto>24?"s":"")}</span></div>`).join("")}<div class="r26-bcl"><span><i class="t1"></i>Tier 1, mission critical</span><span><i class="t2"></i>Tier 2, important</span><span><i class="t3"></i>Tier 3, can wait</span></div></div>
 <h3>Fallback for each</h3><div class="r26-fbs">${rows.map(r=>`<div class="r26-fb card glass t${r.tier}"><b>${E(r.n)}</b><p><span>If it stops</span>${E(r.imp)}</p><p><span>Fallback</span>${E(r.fb)}</p><p><span>Depends on</span>${E(r.dep)}</p></div>`).join("")}</div>
 <h3>Recovery sequence</h3><ol class="r26-seq">${[["Declare","The owner, "+own+", declares it and tells "+bk+"."],["Switch","The backup takes over. Open items move to them automatically."],["Run by hand","Use the fallback for each critical step. Log what is done by hand."],["Restore","The service desk lead, "+svc+", restores the data and systems."],["Reconcile","Enter everything done by hand. The owner signs the reconciliation."]].map((x,i)=>`<li><em>${i+1}</em><span><b>${x[0]}</b>${E(x[1])}</span></li>`).join("")}</ol>
 <p class="stu-note">Tested twice a year. A failed drill reopens the plan and raises a task for the owner.</p>`}

/* ---------- events ---------- */
D.addEventListener("click",e=>{if(!D.getElementById("stuRoot"))return;const c=e.target.closest&&e.target.closest("[data-r26-comp],[data-r26-tgt]");if(!c)return;
 if(c.dataset.r26Comp){Q.permComp=c.dataset.r26Comp;render();return}
 if(c.dataset.r26Tgt){const n=+c.dataset.r26Tgt;if(n<X.curLevel())return;X.setTarget(n);say("Target set to <b>Level "+tgtOf()+", "+LADDER[tgtOf()-1][0]+"</b>. I rebuilt the roadmap and assigned the research.");render()}});
X.connect={base,roadmap,bcpRows,tgtOf,LADDER};
})();
