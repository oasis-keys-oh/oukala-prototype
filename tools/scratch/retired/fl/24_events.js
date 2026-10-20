/* ================================================================ EVENTS FOR THE DESIGNER */
function setAt(path,val){const f=curFlow(),n=selNode(f);const[o,k]=rootOf(f,n||{},path);if(path.startsWith("f.")||n){if(!E._lu||Date.now()-E._lu>1500)pushU(f);E._lu=Date.now();if(k==="n"&&!path.startsWith("f."))n.n=val;else sp(o,k,val);touch(f);return true}return false}
function setType(n,t){if(n.t===t)return;const old=n.a;n.t=t;n.a=Object.assign((A0[t]||A0.human)(),t==="agent"?{goal:old.instr||old.goal||n.n}:t==="human"?{instr:old.goal||old.instr||""}:{});if(t==="agent"){n.p.asg.kind="agent";n.p.asg.person=n.a.agent}else if(n.p.asg.kind==="agent"){n.p.asg.kind="team";n.p.asg.person=""}}
const arrAt=(f,n,path)=>{const[o,k]=rootOf(f,n||{},path);let v=gp(o,k);if(v==null){sp(o,k,[]);v=gp(o,k)}return v};
const mkRule=()=>({f:"",o:"=",v:"",vt:"lit"});
function mkGroupFromSel(){const f=curFlow(),n=selNode(f);if(!n){toast("Select a step first; it and the steps right after it in the same lane join the sub-flow.","warn");return}
 openForm({id:"wfd_grp",title:"Group into a sub-flow",story:"Folds the selected step and the steps that follow it in the same lane into one collapsible box, so big workflows stay readable.",submit:"Create sub-flow",fields:[{k:"n",label:"Sub-flow name",type:"text",req:true,ph:"Security review"}],defaults:{n:(f.lanes[n.l]||{}).n+" sub-flow"},onSubmit:v=>{mut(f=>{const g={id:"G"+uid(),n:v.n,collapsed:false};f.groups.push(g);let cur=n,k=0;while(cur&&k<5){cur.g=g.id;k++;const nx=f.edges.filter(e=>e.f===cur.id).map(e=>nodeById(f,e.t)).filter(x=>x&&x.l===n.l&&!x.g&&x.t!=="end");cur=nx[0]}},["created sub-flow",v.n]);return{toast:"Sub-flow created. Collapse it from the toolbar."}}})}
function laneForm(i){const f=curFlow(),l=f.lanes[i],cnt=f.nodes.filter(n=>n.l===i).length;
 openForm({id:"wfd_lane",title:"Lane: "+l.n,story:"A lane is the team, AI agent or system that owns the steps in it. Moving a step into a lane assigns it to that team.",submit:"Save lane",fields:[{k:"n",label:"Lane name",type:"select",opts:[l.n].concat(TEAMN.filter(t=>t!==l.n)).concat(["AI agents","System","Requester"].filter(t=>t!==l.n&&!TEAMN.includes(t)))},{k:"x",label:cnt?"Delete lane (move its "+cnt+" steps to the first lane)":"Delete this empty lane",type:"toggle"}],defaults:{n:l.n,x:false},onSubmit:v=>{mut(f=>{if(v.x&&f.lanes.length>1){f.nodes.forEach(n=>{if(n.l===i)n.l=i?0:1;else if(n.l>i)n.l--});f.lanes.splice(i,1)}else f.lanes[i].n=v.n},["edited lane",v.x?"deleted "+l.n:l.n+" → "+v.n]);return{toast:v.x?"Lane deleted":"Lane saved"}}})}
function addLaneForm(){openForm({id:"wfd_alane",title:"Add a lane",story:"Pick the team, AI agent or system that will own the steps in this lane.",submit:"Add lane",fields:[{k:"n",label:"Owner",type:"select",opts:TEAMN.concat(["AI agents","System","Requester","Contractor","Managed service provider"])}],onSubmit:v=>{mut(f=>{f.lanes.push({n:v.n})},["added lane",v.n]);return{toast:"Lane added"}}})}
function settingsForm(){const f=curFlow();openForm({id:"wfd_set",title:"Workflow settings",story:"Name, owner and where it applies. Changes are saved to the draft.",submit:"Save",fields:[{k:"name",label:"Name",type:"text",req:true},{k:"desc",label:"What it does",type:"longtext"},{k:"owner",label:"Owner",type:"people"},{k:"service",label:"Business service it supports",type:"text"},{k:"kind",label:"Kind",type:"select",opts:["request","incident","change","approval","onboarding","release","contract","purchase","process"]}],defaults:{name:f.name,desc:f.desc,owner:f.owner,service:f.service,kind:f.kind},onSubmit:v=>{mut(f=>{Object.assign(f,{name:v.name,desc:v.desc,owner:v.owner||f.owner,service:v.service,kind:v.kind})},["edited workflow settings",v.name],true);audit("edited workflow settings",v.name);return{toast:"Saved"}}})}
function dupNode(id){mut(f=>{const n=nodeById(f,id),c=clone(n);c.id="N"+uid();c.n=n.n+" (copy)";c.x=n.x+22;c.r=n.r?0:1;f.nodes.push(c);E.sel=c.id},["duplicated step",id])}
function expandG(id,on){mut(f=>{const g=f.groups.find(x=>x.id===id);if(g)g.collapsed=on},["toggled sub-flow",id],true)}
function mapDmn(){const f=curFlow(),n=selNode(f),t=F.dmn.find(x=>x.id===n.a.dmn);if(!t){toast("Choose a decision table first.","warn");return}const pm=pillMap(f,n),pills=Object.values(pm);
 mut(()=>{t.inputs.forEach(i=>{if(n.p.inputs.some(x=>x.name===i.l))return;const lab=i.l.toLowerCase(),hit=pills.find(p=>p.label.toLowerCase()===lab)||pills.find(p=>p.label.toLowerCase().includes(lab)||lab.includes(p.label.toLowerCase()));n.p.inputs.push({name:i.l,type:i.t==="num"?"num":"text",src:hit?"pill":"lit",val:hit?hit.id:"",req:true})})},["mapped decision table inputs",t.name])}
const eqAny=(a,b)=>String(a)===String(b);
document.addEventListener("click",e=>{const T=e.target;if(!T.closest)return;const q=s=>T.closest(s),f=curFlow(),g=(a)=>{const el=q("["+a+"]");return el?el.getAttribute(a):null};let v;
 if(q("[data-wfd-new]"))return newFlowForm();
 if(q("[data-wfd-import]"))return importForm();
 if(v=q("[data-wfd-go]")){const id=v.dataset.wfdGo,nd=v.dataset.wfdGonode;return openEditor(id,nd)}
 if(v=q("[data-wfd-conv]")){const[a,b]=v.dataset.wfdConv.split("|");return convertNode(a,b)}
 if(!f)return;
 if(q("[data-wfd-back]")){stopSim();E.sim=null;F.open=null;E.sel=null;render();return}
 if(q("[data-wfd-undo]"))return undo();if(q("[data-wfd-redo]"))return redo();
 if(q("[data-wfd-insptog]")){const m=document.querySelector(".wfd-main");if(m){E.inspOff=!E.inspOff;m.classList.toggle("insp-off",E.inspOff);setTimeout(()=>{try{fitZoom()}catch(e){}},50)}const d=document.querySelector(".wfd-more");if(d)d.open=false;return}
 if(q(".wfd-menu .chip")){const d=document.querySelector(".wfd-more");if(d)setTimeout(()=>{d.open=false},0)}
 if(v=q("[data-wfd-ovl]")){E.ovl=v.dataset.wfdOvl;return paintAll()}
 if(v=q("[data-wfd-zoom]")){const z=v.dataset.wfdZoom;if(z==="fit")fitZoom();else{E.zoom=Math.max(.35,Math.min(1.5,Math.round(((E.zoom||1)+(z==="+"?.1:-.1))*100)/100));paintCanvas();paintHead()}return}
 if(q("[data-wfd-colall]")){const on=!f.groups.every(g=>g.collapsed);mut(f=>f.groups.forEach(g=>g.collapsed=on),["toggled sub-flows",f.name],true);return}
 if(q("[data-wfd-mkgroup]"))return mkGroupFromSel();
 if(q("[data-wfd-tidy]"))return tidy();if(q("[data-wfd-addlane]"))return addLaneForm();
 if(v=q("[data-wfd-lane]"))return laneForm(+v.dataset.wfdLane);
 if(q("[data-wfd-edit]"))return settingsForm();
 if(q("[data-wfd-test]")){const s=E.scen;E.scen=null;return startSim(f,s==="gatefail"?{score:25}:{})}
 if(q("[data-wfd-publish]"))return publishForm(f);
 if(q("[data-wfd-export]")){E.pane="json";paintBottom();return exportFile(f)}
 if(q("[data-wfd-copy]")){try{navigator.clipboard.writeText(exportJSON(f));toast("Copied the workflow JSON","good")}catch(x){toast("Select the text and copy it.","info")}return}
 if(q("[data-wfd-dl]"))return exportFile(f);
 if(v=q("[data-wfd-pane]")){E.pane=v.dataset.wfdPane;return paintBottom()}
 if(v=q("[data-wfd-focus]"))return selectNode(v.dataset.wfdFocus,true);
 if(q("[data-wfd-fixall]")){let g=0,n=0;while(g++<120){const l=validate(curFlow()),ix=l.findIndex(x=>x.fix);if(ix<0)break;const before=l.length;applyFix(ix);n++;if(validate(curFlow()).length>=before&&g>3)break}toast("Applied "+n+" automatic fixes.","good");return}
 if(v=q("[data-wfd-fix]"))return applyFix(+v.dataset.wfdFix);
 if(v=q("[data-wfd-scen]")){const k=v.dataset.wfdScen,r=recOf(f),d=defaultRec(f);if(k==="typical"||k==="gatefail")F.rec[f.id]=d;else if(r.amount!=null||d.amount!=null){F.rec[f.id]=Object.assign({},d,{amount:Math.round((d.amount||1000)*(k==="high"?4:.25))})}E.scen=k==="gatefail"?"gatefail":null;toast(k==="gatefail"?"Next run forces the assessment score to 25.":"Test record updated.","info");return paintBottom()}
 if(q("[data-wfd-simstop]")){stopSim();E.sim=null;E.insp="step";return paintAll()}
 if(v=q("[data-wfd-runopen]")){const r=(F.runs[f.id]||[])[+v.dataset.wfdRunopen];if(r){stopSim();E.sim={res:r.res,i:0,playing:false};E.insp="run";E.sel=r.res.steps[0]&&r.res.steps[0].nid;paintAll()}return}
 if(v=q("[data-wfd-restore]")){const h=(f.history||[]).find(x=>x.v===+v.dataset.wfdRestore);if(h&&h.snap){pushU(f);restoreF(f,h.snap);audit("restored workflow version",f.name+" v"+h.v);toast("Restored v"+h.v+" as a draft. Publish to make it live.","good");paintAll()}return}
 if(v=q("[data-wfd-sim]")){const a=v.dataset.wfdSim,s=E.sim;if(!s)return;if(a==="play"){if(s.i>=s.res.steps.length-1)s.i=0;E.sel=s.res.steps[s.i].nid;playSim();paintInsp()}else if(a==="pause"){stopSim();s.playing=false;paintInsp()}else if(a==="next")simStep(1);else if(a==="prev")simStep(-1);else if(a==="restart"){s.i=0;E.sel=s.res.steps[0].nid;playSim();paintCanvas();paintInsp()}return}
 if(v=q("[data-wfd-simgo]")){const s=E.sim;stopSim();s.playing=false;s.i=+v.dataset.wfdSimgo;E.sel=s.res.steps[s.i].nid;paintCanvas();paintInsp();return}
 if(v=q("[data-wfd-insp]")){E.insp=v.dataset.wfdInsp;return paintInsp()}
 if(v=q("[data-wfd-tab]")){E.tab=v.dataset.wfdTab;return paintInsp()}
 /* canvas items */
 if(v=q("[data-wfd-pal]")){if(supClick)return;const p=freePos(f);addNode(v.dataset.wfdPal,p.x,laneTop(p.l)+12+p.r*(NH+10),p.l,p.r);return}
 if(v=q("[data-wfd-in]")){if(supClick)return;if(E.conn)addEdge(E.conn.from,E.conn.port,v.dataset.wfdIn);return}
 if(q("[data-wfd-out]"))return;
 if(v=q("[data-wfd-node]")){if(supClick)return;const id=v.dataset.wfdNode;if(E.conn&&E.conn.from!==id)return addEdge(E.conn.from,E.conn.port,id);return selectNode(id)}
 if(v=q("[data-wfd-edge]")){if(supClick)return;E.selE=v.dataset.wfdEdge;E.sel=null;E.conn=null;paintCanvas();paintInsp();return}
 if(q("#wfdCanvas")&&!supClick&&!q(".wfd-lanelab")){if(E.sel||E.selE||E.conn){E.sel=null;E.selE=null;E.conn=null;paintCanvas();paintInsp()}return}
 /* inspector */
 if(q("[data-wfd-desel]")){E.sel=null;E.selE=null;E.conn=null;paintCanvas();return paintInsp()}
 const n=selNode(f);
 if(v=q("[data-wfd-del]"))return delNode(v.dataset.wfdDel);
 if(v=q("[data-wfd-dup]"))return dupNode(v.dataset.wfdDup);
 if(v=q("[data-wfd-deledge]")){const id=v.dataset.wfdDeledge;E.selE=null;return mut(f=>{f.edges=f.edges.filter(x=>x.id!==id)},["removed connection",f.name])}
 if(v=q("[data-wfd-startconn]")){const nn=nodeById(f,v.dataset.wfdStartconn);E.conn={from:nn.id,port:outs(nn)[0]||"next"};paintCanvas();toast("Click the step to connect to. Esc cancels.","info");return}
 if(v=q("[data-wfd-expand]"))return expandG(v.dataset.wfdExpand,false);
 if(v=q("[data-wfd-ungroup]")){const id=v.dataset.wfdUngroup;E.sel=null;return mut(f=>{f.nodes.forEach(n=>{if(n.g===id)n.g=null});f.groups=f.groups.filter(x=>x.id!==id)},["dissolved sub-flow",id])}
 if(q("[data-wfd-varadd]"))return mut(f=>{f.vars.push({name:"var"+(f.vars.length+1),type:"text",init:""})},["added flow variable",f.name],true);
 if(v=q("[data-wfd-vardel]")){const i=+v.dataset.wfdVardel;return mut(f=>f.vars.splice(i,1),["removed flow variable",f.name],true)}
 if(!n)return;
 if(v=q("[data-wfd-mode]")){const k=v.dataset.wfdMode;return mut(()=>setType(n,k==="human"?"human":k==="agentic"?"agent":"auto"),["changed who does the step",n.n+" → "+k])}
 if(v=q("[data-wfd-pick]")){return mut(()=>{n.p.asg.kind=n.t==="agent"?"agent":"person";n.p.asg.person=v.dataset.wfdPick},["assigned step",n.n+" → "+v.dataset.wfdPick],true)}
 if(v=q("[data-wfd-smedel]")){return mut(()=>n.a.sme.splice(+v.dataset.wfdSmedel,1),["removed assessment expert",n.n],true)}
 if(q("[data-wfd-asmadd]"))return mut(()=>{(n.a.asm=n.a.asm||[]).push({type:ASSESS_TYPES()[0].id,mode:"gate"})},["attached assessment",n.n]);
 if(v=q("[data-wfd-asmdel]"))return mut(()=>n.a.asm.splice(+v.dataset.wfdAsmdel,1),["removed assessment",n.n]);
 if(v=q("[data-wfd-asmopen]"))return go("flw_asmt",v.dataset.wfdAsmopen);
 if(q("[data-wfd-bradd]"))return mut(()=>{n.a.branches.push({id:"b"+uid(),label:"Path "+(n.a.branches.length+1),c:{j:"AND",rules:[],groups:[]}})},["added branch",n.n],true);
 if(v=q("[data-wfd-brdel]")){const i=+v.dataset.wfdBrdel,lab=n.a.branches[i].label;return mut(f=>{n.a.branches.splice(i,1);f.edges=f.edges.filter(e=>!(e.f===n.id&&e.p===lab))},["removed branch",n.n],true)}
 if(v=q("[data-wfd-cadd]")){const[p,k]=v.dataset.wfdCadd.split("|");return mut(()=>{const[o,key]=rootOf(f,n,p);let c=gp(o,key);if(c==null){sp(o,key,{j:"AND",rules:[],groups:[]});c=gp(o,key)}if(!c.rules)c.rules=[];if(!c.groups)c.groups=[];if(k==="rule")c.rules.push(mkRule());else c.groups.push({j:"OR",rules:[mkRule()]})},["added condition",n.n],true)}
 if(v=q("[data-wfd-cdel]")){const[p,i]=v.dataset.wfdCdel.split("|");return mut(()=>arrAt(f,n,p).splice(+i,1),["removed condition",n.n],true)}
 if(v=q("[data-wfd-ldel]")){const[p,i]=v.dataset.wfdLdel.split("|");return mut(()=>arrAt(f,n,p).splice(+i,1),["removed "+(p==="p.inputs"?"input":"output"),n.n],true)}
 if(q("[data-wfd-inadd]"))return mut(()=>n.p.inputs.push({name:"input"+(n.p.inputs.length+1),type:"text",src:"pill",val:"",req:false}),["added input",n.n],true);
 if(q("[data-wfd-outadd]"))return mut(()=>n.p.outputs.push({name:"result"+(n.p.outputs.length+1),type:"text",desc:""}),["added output",n.n],true);
 if(v=q("[data-wfd-opendmn]")){F.dsel=v.dataset.wfdOpendmn;return go("flw_dmn")}
 if(q("[data-wfd-mapdmn]"))return mapDmn();
 if(v=q("[data-wfd-chip]")){const[p,val]=v.dataset.wfdChip.split("|");return mut(()=>{const[o,k]=rootOf(f,n,p);sp(o,k,val);if(p==="a.gate"||p==="a.mode"||p==="a.kind"||p==="a.autonomy"||p==="p.params.onError")f.edges=f.edges.filter(e=>e.f!==n.id||outs(n).includes(e.p))},["edited step",n.n+": "+p+" = "+val],true)}
 if(v=q("[data-wfd-multi]")){const[p,val]=v.dataset.wfdMulti.split("|");return mut(()=>{const a=arrAt(f,n,p),i=a.indexOf(val);if(i<0)a.push(val);else a.splice(i,1)},["edited step",n.n+": "+p],true)}
 if(v=q("[data-wfd-tog]")){const p=v.dataset.wfdTog;return mut(()=>{const[o,k]=rootOf(f,n,p);sp(o,k,!gp(o,k))},["edited step",n.n+": "+p],true)}
 if(v=q("[data-wfd-vt]")){const p=v.dataset.wfdVt;return mut(()=>{const[o,k]=rootOf(f,n,p);const r=gp(o,k);r.vt=r.vt==="pill"?"lit":"pill";r.v=""},["edited condition",n.n],true)}},true);
/* typing and picking in the inspector */
function valOf(el){const ty=el.dataset.wfdTy;let v=el.value;if(ty==="num")v=v===""?"":parseFloat(v);else if(ty==="list")v=v.split(",").map(s=>s.trim()).filter(Boolean);return v}
document.addEventListener("input",e=>{const el=e.target;if(!el.matches)return;
 if(el.matches("[data-wfd-find]")){E.q=el.value;paintCanvas();return}
 if(el.matches("[data-wfd-rec]")){const f=curFlow(),r=recOf(f),k=el.dataset.wfdRec;r[k]=typeof r[k]==="number"?(parseFloat(el.value)||0):el.value;return}
 if(el.matches("[data-wfd-set]")&&(el.tagName==="INPUT"||el.tagName==="TEXTAREA")&&!el.dataset.wfdRe){if(setAt(el.dataset.wfdSet,valOf(el)))soft()}});
document.addEventListener("change",e=>{const el=e.target;if(!el.matches)return;const f=curFlow();if(!f)return;
 if(el.matches("[data-wfd-set]")){const p=el.dataset.wfdSet;const done=setAt(p,valOf(el));if(!done)return;if(p==="f.table"){delete F.rec[f.id]}if(p==="a.type"||p==="a.dmn"||p==="a.ref"||p==="a.op"||el.dataset.wfdRe||p==="a.src"){if(p==="a.dmn"){const n=selNode(f),t=F.dmn.find(x=>x.id===n.a.dmn);if(t&&!t.outputs.some(o=>o.k===n.a.col))n.a.col=t.outputs[0].k}paintCanvas();paintInsp();soft()}else{paintInsp();soft()}return}
 if(el.matches("[data-wfd-type]")){const n=selNode(f);return mut(()=>setType(n,el.value),["changed step type",n.n+" → "+el.value])}
 if(el.matches("[data-wfd-chk]")){const n=selNode(f);if(setAt(el.dataset.wfdChk,el.checked))paintInsp();return}
 if(el.matches("[data-wfd-ins]")){const n=selNode(f),p=el.dataset.wfdIns;if(!el.value)return;const[o,k]=rootOf(f,n,p);const cur=gp(o,k)||"";setAt(p,(cur?cur+" ":"")+"{{"+el.value+"}}");paintInsp();soft();return}
 if(el.matches("[data-wfd-sme]")){const n=selNode(f);if(!el.value)return;return mut(()=>{(n.a.sme=n.a.sme||[]);if(!n.a.sme.includes(el.value))n.a.sme.push(el.value)},["assigned assessment expert",el.value],true)}
 if(el.matches("[data-wfd-rec]"))paintBottom()});
document.addEventListener("keydown",e=>{const f=curFlow();if(!f||!document.querySelector("[data-wfd-root]"))return;const tg=e.target,typing=tg.matches&&tg.matches("input,textarea,select,[contenteditable]");
 if(e.key==="Escape"){if(E.conn){E.conn=null;paintCanvas();return}if(E.sel||E.selE){E.sel=null;E.selE=null;paintCanvas();paintInsp()}return}
 if(typing)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();return e.shiftKey?redo():undo()}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();return redo()}
 const nd=tg.closest&&tg.closest("[data-wfd-node]");
 if(nd&&!nd.dataset.wfdNode.startsWith("grp:")){const id=nd.dataset.wfdNode,n=nodeById(f,id);
  if(e.key==="Enter"||e.key===" "){if(e.target!==nd)return;e.preventDefault();return selectNode(id)}
  if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();return delNode(id)}
  const mv={ArrowLeft:[-22,0],ArrowRight:[22,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(mv&&e.altKey){e.preventDefault();mut(()=>{if(mv[0])n.x=Math.max(LW+4,n.x+mv[0]);else{const r=(n.r||0)+mv[1];if(r<0){if(n.l>0){n.l--;n.r=1}}else if(r>1){if(n.l<f.lanes.length-1){n.l++;n.r=0}}else n.r=r}},["moved workflow step",n.n],true);const el=$q(`[data-wfd-node="${id}"]`);if(el)el.focus()}}
 else if(nd&&nd.dataset.wfdNode.startsWith("grp:")&&(e.key==="Enter")){e.preventDefault();expandG(nd.dataset.wfdNode.slice(4),false)}
 const ed=tg.closest&&tg.closest("[data-wfd-edge]");if(ed&&(e.key==="Enter"||e.key===" ")){e.preventDefault();E.selE=ed.dataset.wfdEdge;E.sel=null;paintCanvas();paintInsp()}
 if(ed&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault();const id=ed.dataset.wfdEdge;E.selE=null;mut(f=>{f.edges=f.edges.filter(x=>x.id!==id)},["removed connection",f.name])}});
document.addEventListener("dblclick",e=>{const nd=e.target.closest&&e.target.closest("[data-wfd-node^='grp:']");if(nd)expandG(nd.dataset.wfdNode.slice(4),false)});
