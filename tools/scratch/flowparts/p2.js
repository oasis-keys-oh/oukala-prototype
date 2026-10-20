
/* ---------------------------------------------------------------- designer interactions */
let drag=null,supClick=false;
const reduced=()=>matchMedia("(prefers-reduced-motion:reduce)").matches||document.documentElement.dataset.motion==="reduced";
function canvasPt(cx,cy){const cv=$q("#flwCanvas");if(!cv)return{in:false,x:0,y:0};const rc=cv.getBoundingClientRect();const z=F.zoom||1;return{in:cx>=rc.left&&cx<=rc.right&&cy>=rc.top&&cy<=rc.bottom,x:(cx-rc.left+cv.scrollLeft)/z,y:(cy-rc.top+cv.scrollTop)/z}}
function autoPos(){const f=flow();for(let y=24;y<900;y+=104)for(let x=30;x<1600;x+=212)if(!f.nodes.some(n=>Math.abs(n.x-x)<NW+16&&Math.abs(n.y-y)<NH+16))return[x,y];return[30,30]}
function addNode(type,x,y){const f=flow(),d=clone(DEF[type]),nm=d._n;delete d._n;const n={id:"N"+uid(),type,name:nm,x:Math.max(0,Math.round(x/10)*10),y:Math.max(0,Math.round(y/10)*10),props:d};f.nodes.push(n);touch(f);F.sel=n.id;F.selEdge=null;audit("added workflow node",NT[type].l+" in "+f.name);toast(NT[type].l+" added. Edit it on the right, then connect its ports.","info");part();return n}
document.addEventListener("pointerdown",e=>{
 const pal=e.target.closest("[data-flw-pal]");
 if(pal){if(e.pointerType==="mouse"&&e.button)return;drag={k:"pal",type:pal.dataset.flwPal,x0:e.clientX,y0:e.clientY,moved:false,ghost:null};return}
 const nd=e.target.closest("[data-flw-node]");
 if(nd&&!e.target.closest("[data-flw-out],[data-flw-in]")){if(e.pointerType==="mouse"&&e.button)return;const n=node(flow(),nd.dataset.flwNode);if(!n)return;drag={k:"node",id:n.id,x0:e.clientX,y0:e.clientY,ox:n.x,oy:n.y,moved:false,el:nd}}
});
document.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;
 if(!drag.moved&&Math.hypot(dx,dy)<6)return;
 if(drag.k==="pal"){if(!drag.moved){drag.moved=true;const g=document.createElement("div");g.className="flw-ghost";g.style.setProperty("--nc","var("+NT[drag.type].c+")");g.innerHTML=IC(NT[drag.type].d)+"<b>"+NT[drag.type].l+"</b>";document.body.appendChild(g);drag.ghost=g;document.body.classList.add("flw-dragging")}
  drag.ghost.style.transform=`translate(${e.clientX+12}px,${e.clientY+12}px)`;const p=canvasPt(e.clientX,e.clientY);const w=$q(".flw-canvaswrap");if(w)w.classList.toggle("drop",p.in);e.preventDefault()}
 else{drag.moved=true;const f=flow(),n=node(f,drag.id);const z=F.zoom||1;n.x=Math.max(0,Math.round((drag.ox+dx/z)/10)*10);n.y=Math.max(0,Math.round((drag.oy+dy/z)/10)*10);drag.el.style.left=n.x+"px";drag.el.style.top=n.y+"px";redrawEdges();e.preventDefault()}
},{passive:false});
function endDrag(e){if(!drag)return;const d=drag;drag=null;document.body.classList.remove("flw-dragging");const w=$q(".flw-canvaswrap");if(w)w.classList.remove("drop");
 if(d.k==="pal"&&d.moved){d.ghost.remove();supClick=true;setTimeout(()=>supClick=false,80);const p=canvasPt(e.clientX,e.clientY);if(p.in){addNode(d.type,p.x-NW/2,p.y-NH/2)}else toast("Drop it on the canvas to add the node.","warn")}
 else if(d.k==="node"&&d.moved){supClick=true;setTimeout(()=>supClick=false,80);const f=flow(),n=node(f,d.id);touch(f);audit("moved workflow node",n.name);soft(n)}}
document.addEventListener("pointerup",endDrag);document.addEventListener("pointercancel",endDrag);

function addEdge(from,port,to){const f=flow();if(from===to){toast("A step cannot connect to itself.","bad");return}
 if(node(f,to).type==="trigger"){toast("Nothing can lead into a trigger.","bad");return}
 const had=f.edges.some(e=>e.f===from&&e.p===port);f.edges=f.edges.filter(e=>!(e.f===from&&e.p===port));f.edges.push({id:"e"+uid(),f:from,p:port,t:to});F.conn=null;touch(f);
 audit("connected nodes",node(f,from).name+" → "+node(f,to).name);toast(had?"Connection replaced.":"Connected.","good");part()}
function selectNode(id,show){F.sel=id;F.selEdge=null;F.conn=null;part();if(show){const el=$q(`[data-flw-node="${id}"]`);if(el)el.scrollIntoView({block:"nearest",inline:"center",behavior:reduced()?"auto":"smooth"})}}
function tidy(){const f=flow(),lv={},q=f.nodes.filter(n=>n.type==="trigger").map(n=>n.id);q.forEach(i=>lv[i]=0);for(let k=0;k<q.length;k++){f.edges.filter(e=>e.f===q[k]).forEach(e=>{if(lv[e.t]==null){lv[e.t]=lv[q[k]]+1;q.push(e.t)}})}
 const mx=Math.max(0,...Object.values(lv));f.nodes.forEach(n=>{if(lv[n.id]==null)lv[n.id]=mx+1});const cnt={};f.nodes.slice().sort((a,b)=>a.y-b.y).forEach(n=>{const l=lv[n.id];cnt[l]=(cnt[l]||0);n.x=30+l*212;n.y=24+cnt[l]*104;cnt[l]++});touch(f);audit("tidied layout",f.name);toast("Layout tidied.","good");part()}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-flw-pal],[data-flw-pick],[data-flw-newflow],[data-flw-test],[data-flw-rec],[data-flw-publish],[data-flw-tidy],[data-flw-out],[data-flw-in],[data-flw-node],[data-flw-edge],[data-flw-desel],[data-flw-del],[data-flw-dup],[data-flw-deledge],[data-flw-startconn],[data-flw-chip],[data-flw-show],[data-flw-fix],[data-flw-aiapprover],[data-flw-restore],[data-flw-usetpl],[data-flw-zoom]");if(!t)return;const d=t.dataset,f=flow();
 if(supClick&&(d.flwPal!==undefined||d.flwNode!==undefined)){e.preventDefault();return}
 if(d.flwPal!==undefined){const[x,y]=autoPos();addNode(d.flwPal,x,y);return}
 if(d.flwPick){F.fid=d.flwPick;F.sel=null;F.selEdge=null;F.conn=null;F.run=null;render();return}
 if(d.flwNewflow!==undefined){openForm({id:"flw_new",title:"New blank flow",story:"Creates an empty draft with a trigger. Start from a template in the gallery if you want a head start.",submit:"Create flow",defaults:{event:"Record created"},fields:[{k:"name",label:"Flow name",type:"text",req:true,ph:"Vendor onboarding approval"},{k:"desc",label:"What it does",type:"longtext",ph:"One sentence a new owner would understand"},{k:"event",label:"Starts when",type:"select",opts:FF.trigger[0].o},{k:"owner",label:"Flow owner",type:"people"}],onSubmit:v=>{const nf=mkflow("f_"+uid(),v.name,v.desc||"New flow",[["T1","trigger","Start",30,40,{event:v.event}]],[]);nf.owner=v.owner;F.flows.push(nf);F.fid=nf.id;F.sel=null;audit("created flow",v.name);render();return{toast:"Flow created. Drag nodes from the palette."}}});return}
 if(d.flwZoom){if(d.flwZoom==='fit')F.zoom=null;else F.zoom=Math.max(.4,Math.min(1.2,(F.zoom||1)+(d.flwZoom==='+'?.1:-.1)));part();if(!F.zoom)autoFit();return}
 if(d.flwTest!==undefined){startRun();return}
 if(d.flwRec!==undefined){recForm();return}
 if(d.flwPublish!==undefined){publishForm();return}
 if(d.flwTidy!==undefined){tidy();return}
 if(d.flwOut){const[id,p]=d.flwOut.split("|");F.conn=F.conn&&F.conn.from===id&&F.conn.port===p?null:{from:id,port:p};part();if(F.conn)toast("Now click the left port of the target node.","info");return}
 if(d.flwIn){if(F.conn)addEdge(F.conn.from,F.conn.port,d.flwIn);else toast("Click a right-hand port first, then this one.","info");return}
 if(d.flwNode){if(F.conn&&F.conn.from!==d.flwNode&&node(f,d.flwNode).type!=="trigger"){addEdge(F.conn.from,F.conn.port,d.flwNode);return}selectNode(d.flwNode);return}
 if(d.flwEdge){F.selEdge=d.flwEdge;F.sel=null;part();return}
 if(d.flwDesel!==undefined){F.sel=null;F.selEdge=null;F.conn=null;part();return}
 if(d.flwDel){const n=node(f,d.flwDel);if(!n)return;f.nodes=f.nodes.filter(x=>x.id!==n.id);f.edges=f.edges.filter(x=>x.f!==n.id&&x.t!==n.id);F.sel=null;touch(f);audit("deleted workflow node",n.name);toast("Deleted “"+n.name+"” and its connections.","warn");part();return}
 if(d.flwDup){const n=node(f,d.flwDup),c2=clone(n);c2.id="N"+uid();c2.x+=30;c2.y+=NH+24;c2.name=n.name+" (copy)";f.nodes.push(c2);F.sel=c2.id;touch(f);audit("duplicated node",n.name);part();return}
 if(d.flwDeledge){f.edges=f.edges.filter(x=>x.id!==d.flwDeledge);F.selEdge=null;touch(f);audit("removed connection","");toast("Connection removed.","warn");part();return}
 if(d.flwStartconn){const n=node(f,d.flwStartconn),free=NT[n.type].out.find(p=>!f.edges.some(x=>x.f===n.id&&x.p===p))||NT[n.type].out[0];if(!free){toast("End nodes have no outputs.","warn");return}F.conn={from:n.id,port:free};part();toast("Click the left port of the target node.","info");return}
 if(d.flwChip){const[k,v]=d.flwChip.split("|"),n=node(f,F.sel);n.props[k]=v;touch(f);part();return}
 if(d.flwShow){selectNode(d.flwShow,true);return}
 if(d.flwFix){applyFix(d.flwFix);return}
 if(d.flwAiapprover!==undefined){const n=node(f,F.sel);n.props.approver="Controller (role)";touch(f);audit("accepted AI suggestion","approver");toast("Approver set to Controller (role).","info");part();return}
 if(d.flwRestore){const h=f.history.find(x=>x.v===+d.flwRestore);if(!h||!h.snap)return;f.nodes=clone(h.snap.nodes);f.edges=clone(h.snap.edges);if(f.ver===f.pub)f.ver++;f.dirty=true;F.sel=null;audit("restored version",f.name+" v"+h.v);toast("Version "+h.v+" restored as the current draft.","good");part();return}
 if(d.flwUsetpl){const tp=TPL.find(x=>x.id===d.flwUsetpl),nf=tp.f();nf.id="f_"+uid();F.flows.push(nf);F.fid=nf.id;F.sel=null;F.run=null;audit("created flow from template",tp.n);toast("Template copied as a new draft.","good");render();window.scrollTo({top:0,behavior:"smooth"});return}
});
document.addEventListener("input",e=>handleProp(e));document.addEventListener("change",e=>handleProp(e));
function handleProp(e){const t=e.target.closest&&e.target.closest("[data-flw-prop]");if(!t||!F.sel)return;const f=flow(),n=node(f,F.sel);if(!n)return;const k=t.dataset.flwProp,v=t.type==="number"?+t.value:t.value;if(k==="name")n.name=v;else n.props[k]=v;touch(f);soft(n)}
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&F.conn){F.conn=null;part();return}
 const nd=e.target.closest&&e.target.closest("[data-flw-node]");if(nd&&e.target===nd){const n=node(flow(),nd.dataset.flwNode);if(!n)return;
  if(e.key==="Enter"||e.key===" "){e.preventDefault();selectNode(n.id)}
  else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();const f=flow();f.nodes=f.nodes.filter(x=>x.id!==n.id);f.edges=f.edges.filter(x=>x.f!==n.id&&x.t!==n.id);F.sel=null;touch(f);audit("deleted workflow node",n.name);part()}
  else if(/^Arrow/.test(e.key)&&!e.altKey){e.preventDefault();const s=e.shiftKey?40:10;n.x=Math.max(0,n.x+(e.key==="ArrowRight"?s:e.key==="ArrowLeft"?-s:0));n.y=Math.max(0,n.y+(e.key==="ArrowDown"?s:e.key==="ArrowUp"?-s:0));touch(flow());part();const el=$q(`[data-flw-node="${n.id}"]`);if(el)el.focus()}}
 const ed=e.target.closest&&e.target.closest("[data-flw-edge]");if(ed&&(e.key==="Enter"||e.key===" ")){e.preventDefault();F.selEdge=ed.dataset.flwEdge;F.sel=null;part()}
});
/* ---------------------------------------------------------------- test run */
function evalExpr(expr,rec){const note=[];let res=false;
 String(expr).split(/\s+or\s+/i).forEach(o=>{let ok=true;o.split(/\s+and\s+/i).forEach(a=>{const m=a.trim().match(/^(\w+)\s*(>=|<=|==|!=|>|<|contains)\s*(.+)$/i);if(!m){ok=false;note.push("could not read “"+a.trim()+"”");return}
  let lv=rec[m[1]],rv=m[3].trim().replace(/^["']|["']$/g,"");if(lv===undefined){ok=false;note.push("no field called "+m[1]);return}
  if(rv==="true")rv=true;else if(rv==="false")rv=false;else if(rv!==""&&!isNaN(+rv))rv=+rv;const op=m[2].toLowerCase();let r;
  if(op===">")r=lv>rv;else if(op==="<")r=lv<rv;else if(op===">=")r=lv>=rv;else if(op==="<=")r=lv<=rv;else if(op==="==")r=String(lv).toLowerCase()===String(rv).toLowerCase();else if(op==="!=")r=String(lv).toLowerCase()!==String(rv).toLowerCase();else r=String(lv).toLowerCase().includes(String(rv).toLowerCase());
  if(!r)ok=false;note.push(`${m[1]} is ${typeof lv==="number"&&m[1]==="amount"?money(lv):lv} (${op} ${m[3].trim()}: ${r?"true":"false"})`)});if(ok)res=true});
 return{res,note:note.join("; ")}}
const clk=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
function simulate(f,rec){const steps=[];let cur=f.nodes.find(n=>n.type==="trigger"),g=0,t=0;
 const L=(n,k,x)=>({k,n:n.name,x,t:clk(t)});
 while(cur&&g++<40){const n=cur,p=n.props,lg=[];let port="next",stop=false;t+=1.4;
  if(n.type==="trigger")lg.push(L(n,"ok",`Started by “${p.event}” for ${rec.id} (${rec.vendor}, ${money(rec.amount)}).`));
  else if(n.type==="action"){const op=p.op;lg.push(L(n,"info",/hold/i.test(op)?`Hold placed on ${rec.id} in the Lease subledger (ERP). Reversible until Oct 19.`:/release/i.test(op)?`Payment of ${money(rec.amount)} released in ERP.`:/REST/i.test(op)?"REST call returned 200 in 412 ms.":op+" completed."))}
  else if(n.type==="agent"){const hold=!rec.accepted&&/invoice/i.test(p.agent);const rc=hold?"hold at 81% confidence: accepted work is below what is billed":"approve at 94% confidence";lg.push(L(n,"info",`${p.agent} recommends ${rc}.`));
   if(p.autonomy==="propose"){t+=8;lg.push(L(n,"wait","Proposal waits for a human reviewer (propose then approve)."));t+=140;lg.push(L(n,"ok","Reviewer accepted the proposal (simulated)."))}else if(p.autonomy==="suggest")lg.push(L(n,"info","Suggestion shown to the reviewer. The flow continues without waiting."));else lg.push(L(n,"warn","Acted autonomously. Logged for audit."))}
  else if(n.type==="condition"){const r=evalExpr(p.expr,rec);port=r.res?"Yes":"No";lg.push(L(n,"ok",`${r.note}. Path: ${port}.`));if(p.dmn&&F.dmn){const o=dmnRun(p.dmn,rec);if(o)lg.push(L(n,"info",`Decision table “${o.name}” fired rule ${o.rows.join(", ")}: ${o.text}.`))}}
  else if(n.type==="approval"){t+=60;const ok=rec.decision!=="reject";port=ok?"Approved":"Rejected";lg.push(L(n,"wait",`Task sent to ${p.approver||"nobody"}. SLA ${p.sla}h.`));t+=3*3600+12*60;lg.push(L(n,ok?"ok":"bad",`${ok?"Approved":"Rejected"} by ${(p.approver||"approver").replace(/ \(.*\)/,"")} after 3h 12m (simulated).`))}
  else if(n.type==="wait"){lg.push(L(n,"wait",`Waiting ${p.dur}${p.until?" or until "+p.until:""}. Fast-forwarded in the test.`));t+=3600}
  else if(n.type==="notify")lg.push(L(n,"info",`${p.channel} message sent to ${p.to}.`));
  else if(n.type==="subflow")lg.push(L(n,"info",`Subflow “${p.flow}” finished.`));
  else if(n.type==="end"){lg.push(L(n,"ok",`Finished with outcome: ${p.outcome}.`));stop=true}
  const e=f.edges.find(x=>x.f===n.id&&x.p===port);const st={node:n.id,logs:lg,edge:e?e.id:null,clock:clk(t),outcome:n.type==="end"?p.outcome:null};steps.push(st);
  if(stop)break;if(!e){lg.push(L(n,"bad",`No connection leaves the “${port}” port. The run stops here.`));break}cur=node(f,e.t)}
 if(g>=40)steps[steps.length-1].logs.push({k:"bad",n:"Engine",x:"Stopped after 40 steps to prevent a runaway loop.",t:clk(t)});
 return steps}
function stopRun(){if(F.run&&F.run.timer)clearTimeout(F.run.timer)}
function startRun(){const f=flow();stopRun();const steps=simulate(f,F.rec);if(!steps.length){toast("Add a trigger first.","bad");return}F.run={steps,i:-1,log:[],active:null,nodesDone:[],edgesDone:[],status:"running",clock:"0:00",outcome:""};audit("started test run",f.name+" with "+F.rec.id);const r=$q("#flwRun");if(r)r.scrollIntoView({block:"nearest",behavior:"smooth"});tick()}
function tick(){const r=F.run;if(!r||r.status!=="running")return;if(!$q("#flwCanvas")){r.status="stopped";return}
 if(r.i>=0){const pv=r.steps[r.i];r.nodesDone.push(pv.node);if(pv.edge)r.edgesDone.push(pv.edge)}r.i++;
 if(r.i>=r.steps.length){r.active=null;r.status="done";const last=r.steps[r.steps.length-1];r.outcome=last.outcome||"stopped without an End node";paintRun();toast("Test run finished: "+r.outcome+".",last.outcome?"good":"warn");return}
 const s=r.steps[r.i];r.active=s.node;s.logs.forEach(l=>r.log.push(l));r.clock=s.clock;paintRun();r.timer=setTimeout(tick,reduced()?120:720)}
function paintRun(){const r=F.run,f=flow();$$("#flwCanvas .flw-node").forEach(el=>{const id=el.dataset.flwNode;el.classList.toggle("run-act",r.active===id);el.classList.toggle("run-done",r.nodesDone.includes(id))});redrawEdges();const lg=$q("#flwRun");if(lg){lg.innerHTML=runHTML(f);const ol=$q(".flw-log",lg);if(ol)ol.scrollTop=1e6}
 if(r.active){const el=$q(`[data-flw-node="${r.active}"]`);if(el)el.scrollIntoView({block:"nearest",inline:"nearest",behavior:"auto"})}}
function recForm(){openForm({id:"flw_rec",title:"Sample record for test runs",story:"The test run walks this record through the flow. Change it to see a different branch, for example accepted work = yes sends Lumen-style invoices to the controller instead of a hold.",submit:"Use this record",defaults:{id:F.rec.id,vendor:F.rec.vendor,amount:F.rec.amount,accepted:F.rec.accepted,po:F.rec.po,risk:F.rec.risk,decision:F.rec.decision},
 fields:[{k:"id",label:"Invoice ID",type:"text",req:true},{k:"vendor",label:"Vendor",type:"text",req:true},{k:"amount",label:"Amount",type:"money",req:true},{k:"accepted",label:"Work accepted for this milestone",type:"toggle"},{k:"po",label:"PO match",type:"chips",opts:["Match","Mismatch","Missing"]},{k:"risk",label:"Vendor risk",type:"chips",opts:["Low","Medium","High"]},{k:"decision",label:"Simulated approver decision",type:"chips",opts:[["approve","Approves"],["reject","Rejects"]]}],
 onSubmit:v=>{F.rec={id:v.id,vendor:v.vendor,amount:+v.amount,accepted:!!v.accepted,overpaid:v.accepted?0:Math.round(v.amount*.35),po:v.po||"Match",risk:v.risk||"Low",decision:v.decision||"approve"};audit("changed sample record",v.id);part();return{toast:"Sample record updated. Press Test run."}}})}
function publishForm(){const f=flow(),v=validate(f),errs=v.filter(x=>x.sev==="err");
 if(errs.length){toast(errs.length+" problem"+(errs.length>1?"s":"")+" block publishing. Fix them in the validation panel.","bad");const el=$q("#flwValid");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});return}
 openForm({id:"flw_pub",title:"Publish “"+f.name+"” v"+f.ver,story:`Publishing makes v${f.ver} the version that runs for new records. Runs already in flight finish on the old version. ${v.length} warning${v.length===1?"":"s"} will remain and are listed in the audit entry.`,submit:"Publish v"+f.ver,defaults:{when:"now",notify:true},
 fields:[{section:"What changed"},{k:"note",label:"Change note",type:"longtext",req:true,ph:"Added an Invoice Advisor check before the amount test",help:"Shown in the version history and sent to the flow's subscribers.",ai:{label:"Draft from changes",fn:()=>"Draft v"+f.ver+": "+(f.pub!=null?diff(f).replace(/<[^>]+>/g,""):"first version.")}},{k:"when",label:"Go live",type:"chips",opts:[["now","Now"],["window","Next change window (Thu 18:00)"]]},{k:"notify",label:"Tell the people who own steps in this flow",type:"toggle"},{k:"reviewer",label:"Second reviewer (required for flows that move money)",type:"people"}],
 onSubmit:vals=>{f.pub=f.ver;f.dirty=false;f.history=f.history.filter(h=>h.v!==f.ver);f.history.unshift({v:f.ver,st:"published",by:who(),at:"Oct 6",note:vals.note,snap:{nodes:clone(f.nodes),edges:clone(f.edges)}});audit("published workflow",f.name+" v"+f.ver);const el=$q("#flwStatus");render();return{toast:"Published v"+f.ver+(vals.when==="window"?" for Thu 18:00":" and live now"),audit:vals.note}}})}

function autoFit(){const cv=$q("#flwCanvas");if(!cv||F.zoom)return;const f=flow(),W=Math.max(1000,...f.nodes.map(n=>n.x+NW+60)),H=Math.max(520,...f.nodes.map(n=>n.y+NH+60));const z=Math.max(.74,Math.min(1,Math.min((cv.clientWidth-8)/W,(cv.clientHeight-8)/H)));F.zoom=Math.round(z*100)/100;const w=$q(".flw-world",cv);if(w)w.style.zoom=F.zoom}
new MutationObserver(()=>{const cv=$q("#flwCanvas");if(cv&&!F.zoom&&cv.clientWidth)autoFit()}).observe(document.body,{childList:true,subtree:true});
