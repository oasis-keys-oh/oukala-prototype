/* R17 process diagrams: a swimlane diagram for every process, generated from its steps. Prefix r17pd- */
(function(){
 const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 /* step kinds through STEPMODE (CL-58): human, robot, agent, approval gate; colors are the sm tokens from mod_s_steps.css */
 const KOF=v=>window.STEPMODE?STEPMODE.of(v):"human";
 const WHO={human:"Human",robot:"Robot",agent:"Agent",gate:"Approval gate"};if(window.STEPMODE)Object.keys(WHO).forEach(k=>WHO[k]=STEPMODE.label(k));
 const KIND={human:"var(--sm-human)",robot:"var(--sm-robot)",agent:"var(--sm-agent)",gate:"var(--sm-gate)"};
 const TRT=s=>window.STEPKIT?" | "+STEPKIT.trigText(Object.assign({},s,{trig:s.trig||(STEPKIT.needsTrigger(s.who)?STEPKIT.guessTrig(s):null)})):"";
 function wrap(t,n){const w=String(t||"").split(/\s+/),L=[];let c="";w.forEach(x=>{if((c+" "+x).trim().length>n&&c){L.push(c);c=x}else c=(c+" "+x).trim()});if(c)L.push(c);if(L.length>3){L.length=3;L[2]=L[2].replace(/.{0,2}$/,"…")}return L}
 function steps(id){try{const p=window.PROCLIB&&PROCLIB.get(id);return p?p.stepsList:[]}catch(e){return[]}}
 function buildFlat(list){
  const SW=118,SH=44,GX=26,GY=44,PAD=12,COLS=Math.min(5,list.length),rows=Math.ceil(list.length/COLS);
  const W=PAD*2+COLS*SW+(COLS-1)*GX,H=PAD*2+rows*SH+(rows-1)*GY+10;
  const P=list.map((s,i)=>({s,x:PAD+(i%COLS)*(SW+GX),y:PAD+10+Math.floor(i/COLS)*(SH+GY)}));
  let out=`<defs><marker id="r17pdB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1.5L9 5 1 8.5z" style="fill:var(--muted)"/></marker></defs>`;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];
   const d=a.y===b.y?`M${a.x+SW} ${a.y+SH/2}H${b.x}`:`M${a.x+SW/2} ${a.y+SH}V${a.y+SH+GY/2}H${b.x+SW/2}V${b.y}`;
   out+=`<path d="${d}" class="r17pd-cn" marker-end="url(#r17pdB)"/>`}
  P.forEach((p,i)=>{const s=p.s,w=KOF(s.who),c=KIND[w],x0=p.x,y0=p.y,cx=x0+SW/2,cy=y0+SH/2;
   const tip=`${i+1}. ${s.n} | ${WHO[w]} | ${s.owner||"Unassigned"}${TRT(s)}`;let shp;
   if(w==="gate")shp=`<path d="M${cx} ${y0-5}L${x0+SW} ${cy}L${cx} ${y0+SH+5}L${x0} ${cy}Z" class="r17pd-sh" style="--k:${c}"/>`;
   else if(w==="agent")shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="18" class="r17pd-sh r17pd-ai" style="--k:${c}"/><rect x="${x0+SW-30}" y="${y0-7}" width="26" height="13" rx="6.5" class="r17pd-bd" style="--k:${c}"/><text x="${x0+SW-17}" y="${y0+3}" class="r17pd-bt" text-anchor="middle">AI</text>`;
   else if(w==="robot")shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="4" class="r17pd-sh" style="--k:${c}"/><rect x="${x0+5}" y="${y0}" width="1.6" height="${SH}" style="fill:${c}"/><rect x="${x0+SW-6.6}" y="${y0}" width="1.6" height="${SH}" style="fill:${c}"/>`;
   else shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="8" class="r17pd-sh" style="--k:${c}"/>`;
   const L=wrap(s.n,w==="gate"?12:17);
   out+=`<g class="r17pd-n"><title>${E(tip)}</title>${shp}<text x="${cx}" y="${cy-(L.length-1)*6+4}" text-anchor="middle" class="r17pd-tx" style="font-size:11.5px">${L.map((ln,j)=>`<tspan x="${cx}" dy="${j?12:0}">${E(ln)}</tspan>`).join("")}</text><text x="${x0+2}" y="${y0-3}" class="r17pd-no">${i+1}</text></g>`});
  return{svg:`<svg class="r17pd-svg r17pd-flat" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Process flow thumbnail" xmlns="http://www.w3.org/2000/svg">${out}</svg>`,w:W,h:H,lanes:1,n:list.length};
 }
 /* returns {svg,w,h,lanes,n} */
 function build(list,o){
  o=o||{};const compact=!!o.compact;if(compact&&list.length)return buildFlat(list);
  const LW=compact?0:150,SW=compact?120:150,SH=compact?46:58,GX=compact?30:44,LH=compact?64:104,PAD=compact?10:18;
  const owners=[];list.forEach(s=>{const k=s.owner||"Unassigned";if(!owners.includes(k))owners.push(k)});
  if(!owners.length)return null;
  const lane=k=>owners.indexOf(k||"Unassigned");
  const W=LW+PAD*2+60+list.length*(SW+GX)+40,H=owners.length*LH+PAD*2;
  const cy=i=>PAD+i*LH+LH/2;
  let out=`<defs><marker id="r17pdA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1.5L9 5 1 8.5z" style="fill:var(--muted)"/></marker></defs>`;
  if(!compact)owners.forEach((k,i)=>{const y=PAD+i*LH;out+=`<rect x="${PAD}" y="${y}" width="${W-PAD*2}" height="${LH}" class="r17pd-lane${i%2?" alt":""}"/><rect x="${PAD}" y="${y}" width="${LW}" height="${LH}" class="r17pd-lh"/>`;
   wrap(k,18).forEach((ln,j,a)=>{out+=`<text x="${PAD+10}" y="${y+LH/2+(j-(a.length-1)/2)*15+4}" class="r17pd-lt">${E(ln)}</text>`})});
  const pos=[];let x=PAD+LW+60;
  const startL=lane(list[0].owner);
  out+=`<circle cx="${PAD+LW+26}" cy="${cy(startL)}" r="11" class="r17pd-st"/>`;
  list.forEach((s,i)=>{const l=lane(s.owner);pos.push({x,y:cy(l),l,s});x+=SW+GX});
  /* connectors */
  const conn=(ax,ay,bx,by)=>{const mx=(ax+bx)/2;return ax===bx?`M${ax} ${ay}L${bx} ${by}`:`M${ax} ${ay}H${mx}V${by}H${bx}`};
  out+=`<path d="${conn(PAD+LW+37,cy(startL),pos[0].x,pos[0].y)}" class="r17pd-cn" marker-end="url(#r17pdA)"/>`;
  for(let i=0;i<pos.length-1;i++){const a=pos[i],b=pos[i+1];out+=`<path d="${conn(a.x+SW,a.y,b.x,b.y)}" class="r17pd-cn" marker-end="url(#r17pdA)"/>`}
  const last=pos[pos.length-1],ex=last.x+SW+GX/2+16;
  out+=`<path d="M${last.x+SW} ${last.y}H${ex-12}" class="r17pd-cn" marker-end="url(#r17pdA)"/><circle cx="${ex}" cy="${last.y}" r="11" class="r17pd-en"/><circle cx="${ex}" cy="${last.y}" r="6" class="r17pd-en2"/>`;
  /* steps */
  pos.forEach((p,i)=>{const s=p.s,w=KOF(s.who),c=KIND[w],x0=p.x,y0=p.y-SH/2;
   const tip=`${i+1}. ${s.n} | ${WHO[w]} | ${s.owner||"Unassigned"}${TRT(s)}${s.sla?" | Target: "+s.sla:""}${s.in?" | In: "+s.in:""}${s.out?" | Out: "+s.out:""}`;
   let shp;
   if(w==="gate")shp=`<path d="M${x0+SW/2} ${y0-6}L${x0+SW} ${p.y}L${x0+SW/2} ${y0+SH+6}L${x0} ${p.y}Z" class="r17pd-sh" style="--k:${c}"/>`;
   else if(w==="agent")shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="${SH/2.4}" class="r17pd-sh r17pd-ai" style="--k:${c}"/><rect x="${x0+SW-34}" y="${y0-8}" width="30" height="15" rx="7.5" class="r17pd-bd" style="--k:${c}"/><text x="${x0+SW-19}" y="${y0+3}" class="r17pd-bt" text-anchor="middle">AI</text>`;
   else if(w==="robot")shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="4" class="r17pd-sh" style="--k:${c}"/><rect x="${x0+5}" y="${y0}" width="1.6" height="${SH}" style="fill:${c}"/><rect x="${x0+SW-6.6}" y="${y0}" width="1.6" height="${SH}" style="fill:${c}"/>`;
   else shp=`<rect x="${x0}" y="${y0}" width="${SW}" height="${SH}" rx="9" class="r17pd-sh" style="--k:${c}"/>`;
   const L=wrap(s.n,compact?17:w==="gate"?14:20);
   out+=`<g class="r17pd-n" tabindex="0" role="img" aria-label="${E(tip)}"><title>${E(tip)}</title>${shp}<text x="${x0+SW/2}" y="${p.y-(L.length-1)*(compact?6:7)+4}" text-anchor="middle" class="r17pd-tx">${L.map((ln,j)=>`<tspan x="${x0+SW/2}" dy="${j?(compact?12:14):0}">${E(ln)}</tspan>`).join("")}</text>${!compact&&s.sla?`<text x="${x0+SW/2}" y="${y0+SH+(w==="gate"?22:17)}" text-anchor="middle" class="r17pd-sl">${E(s.sla)}</text>`:""}<text x="${x0+(w==="gate"?SW/2:8)}" y="${y0-(w==="gate"?9:4)}" ${w==="gate"?'text-anchor="middle"':""} class="r17pd-no">${i+1}</text></g>`});
  return{svg:`<svg class="r17pd-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Process diagram" xmlns="http://www.w3.org/2000/svg">${out}</svg>`,w:W,h:H,lanes:owners.length,n:list.length};
 }
 function legend(){return `<div class="r17pd-lg" aria-label="Legend"><span><i class="r17pd-k h"></i>${E(WHO.human)}</span><span><i class="r17pd-k s"></i>${E(WHO.robot)}</span><span><i class="r17pd-k a"></i>${E(WHO.agent)}</span><span><i class="r17pd-k g"></i>${E(WHO.gate)}</span><span class="muted">Robot and agent steps start on a trigger; human steps start by assignment.Rows are the owner of each step. Select the numbers or shapes for inputs, outputs and target time.</span></div>`}
 function card(id){
  const st=steps(id);const d=build(st);
  if(!d)return `<div class="eyebrow">Process diagram</div><p class="small muted">No steps are recorded, so there is nothing to draw. Add steps in the Workflow designer or the drawing studio.</p>${window.DRAW&&DRAW.btn?DRAW.btn(id,"Open drawing studio"):""}`;
  return `<div class="row sp"><div><div class="eyebrow">Process diagram</div><p class="small muted">${d.n} steps across ${d.lanes} ${d.lanes===1?"owner":"owners"}. Drawn from the process definition, so it changes when the steps change.</p></div><div class="row"><button type="button" class="btn sm" data-r17pd-svg="${E(id)}">Export SVG</button>${window.DRAW&&DRAW.btn?DRAW.btn(id,"Edit in drawing studio","sm"):""}</div></div>${legend()}<div class="r17pd-scroll" tabindex="0" aria-label="Process diagram, scrollable">${d.svg}</div>`;
 }
 const GAL={q:"",fam:"",lim:24};
 function gallery(){
  let L=[];try{L=PROCLIB.list()}catch(e){}
  const fams=[...new Set(L.map(p=>p.familyName).filter(Boolean))].sort();
  const q=GAL.q.toLowerCase();
  const rows=L.filter(p=>(!GAL.fam||p.familyName===GAL.fam)&&(!q||(p.name+" "+p.module).toLowerCase().includes(q)));
  const shown=rows.slice(0,GAL.lim);
  const cards=shown.map(p=>{const d=build(steps(p.id),{compact:true});
   return `<button type="button" class="card glass r17pd-gc" data-pl-open="${E(p.id)}" title="Open ${E(p.name)}"><div class="r17pd-gh"><b>${E(p.name)}</b><small class="muted">${E(p.familyName||"")} · ${p.steps} steps · Level ${p.level}</small></div><div class="r17pd-gt">${d?d.svg:'<span class="muted small">No steps recorded</span>'}</div></button>`}).join("");
  return `<div class="r17pd-gal" id="r17pdGal"><div class="row sp" style="flex-wrap:wrap;gap:10px"><div><div class="eyebrow">Process diagrams</div><p class="small muted">${rows.length} of ${L.length} processes. Each diagram is drawn from the process steps. Select one to open the full process page.</p></div><div class="row" style="gap:8px;flex-wrap:wrap"><input type="search" class="fin" placeholder="Search diagrams" aria-label="Search diagrams" value="${E(GAL.q)}" data-r17pd-q><select class="fin" aria-label="Family" data-r17pd-fam><option value="">All families</option>${fams.map(f=>`<option ${GAL.fam===f?"selected":""}>${E(f)}</option>`).join("")}</select></div></div>${legend()}<div class="r17pd-grid">${cards||'<p class="muted">No process matches.</p>'}</div>${rows.length>shown.length?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-r17pd-more>Show ${Math.min(24,rows.length-shown.length)} more</button></div>`:""}</div>`;
 }
 function repaint(){const g=document.getElementById("r17pdGal");if(g){const t=document.createElement("div");t.innerHTML=gallery();g.replaceWith(t.firstElementChild)}}
 document.addEventListener("input",e=>{const t=e.target;if(t.matches&&t.matches("[data-r17pd-q]")){GAL.q=t.value;GAL.lim=24;clearTimeout(repaint._t);repaint._t=setTimeout(()=>{repaint();const i=document.querySelector("[data-r17pd-q]");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},180)}});
 document.addEventListener("change",e=>{const t=e.target;if(t.matches&&t.matches("[data-r17pd-fam]")){GAL.fam=t.value;GAL.lim=24;repaint()}});
 document.addEventListener("click",e=>{
  const m=e.target.closest&&e.target.closest("[data-r17pd-more]");if(m){GAL.lim+=24;repaint();return}
  const s=e.target.closest&&e.target.closest("[data-r17pd-svg]");if(s){const id=s.getAttribute("data-r17pd-svg"),d=build(steps(id));if(!d)return;
   const svg=d.svg.replace("<svg ",'<svg style="font-family:Arial,sans-serif" ');const b=new Blob([svg],{type:"image/svg+xml"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=id+".diagram.svg";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);try{toast("Exported "+id+".diagram.svg")}catch(_){}}
 });
 window.R17PD={build,card,gallery,steps};
})();
