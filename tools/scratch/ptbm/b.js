
/* ============ drawing: sankey and charts ============ */
const fv=v=>v>=1e6?(v/1e6).toFixed(v>=1e7?0:1)+"M":v>=1e3?(v/1e3).toFixed(v>=1e4?0:1)+"K":(v<10&&v%1?v.toFixed(1):Math.round(v)+"");
const stat=(l,v,sub,cls)=>`<div class="stat ${cls||""}"><small>${l}</small><span class="num" data-role="metric">${v}</span><em>${sub||""}</em></div>`;
const statrow=a=>`<div class="statrow">${a.join("")}</div>`;
function sankey(cols,links,sel){const W=1180,Hh=Math.max(560,Math.min(760,cols.reduce((a,c)=>Math.max(a,c.nodes.length),0)*30+120)),padT=40,nw=14,gap=7,nc=cols.length;const colW=(W-nw-170)/(nc-1);
 const byId={};cols.forEach((c,ci)=>{c.nodes.forEach(n=>{n.ci=ci;byId[n.id]=n;n.out=[];n.inn=[]})});links=links.filter(l=>byId[l[0]]&&byId[l[1]]&&l[2]>0);links.forEach(l=>{byId[l[0]].out.push(l);byId[l[1]].inn.push(l)});
 const tot=cols.map(c=>c.nodes.reduce((a,n)=>a+n.v,0));let k=1e9;cols.forEach((c,ci)=>{k=Math.min(k,(Hh-padT-14-gap*(c.nodes.length-1))/(tot[ci]||1))});
 cols.forEach((c,ci)=>{const stack=c.nodes.reduce((a,n)=>a+Math.max(5,n.v*k),0)+gap*(c.nodes.length-1);let y=padT+(Hh-padT-14-stack)/2;c.nodes.forEach(n=>{n.h=Math.max(5,n.v*k);n.x=ci*colW;n.y=y;y+=n.h+gap})});
 cols.forEach(c=>c.nodes.forEach(n=>{n.out.sort((a,b)=>byId[a[1]].y-byId[b[1]].y);let o=n.y;n.out.forEach(l=>{l.y0=o;l.th=Math.max(1,l[2]*k);o+=l.th})}));
 cols.forEach(c=>c.nodes.forEach(n=>{n.inn.sort((a,b)=>byId[a[0]].y-byId[b[0]].y);let o=n.y;n.inn.forEach(l=>{l.y1=o;o+=Math.max(1,l[2]*k)})}));
 let on=null;if(sel&&byId[sel]){on=new Set([sel]);const up=id=>byId[id].inn.forEach(l=>{if(!on.has(l[0])){on.add(l[0]);up(l[0])}}),dn=id=>byId[id].out.forEach(l=>{if(!on.has(l[1])){on.add(l[1]);dn(l[1])}});up(sel);dn(sel)}
 let g="";links.forEach(l=>{const a=byId[l[0]],b=byId[l[1]];const x0=a.x+nw,x1=b.x,xm=(x0+x1)/2;const hot=!on||(on.has(l[0])&&on.has(l[1]));g+=`<path d="M${x0} ${(l.y0+l.th/2).toFixed(1)} C${xm} ${(l.y0+l.th/2).toFixed(1)} ${xm} ${(l.y1+l.th/2).toFixed(1)} ${x1} ${(l.y1+l.th/2).toFixed(1)}" fill="none" stroke="var(${a.c})" stroke-width="${l.th.toFixed(1)}" opacity="${hot?.42:.07}"><title>${H(a.name)} to ${H(b.name)}: ${D$(l[2])} a month</title></path>`});
 cols.forEach((c,ci)=>{g+=`<text x="${ci*colW}" y="16" class="sk-h">${H(c.label)}</text>`;c.nodes.forEach(n=>{const hot=!on||on.has(n.id);const last=false;g+=`<g class="sk-n ${n.id===sel?"sel":""}" data-tbm-node="${H(n.id)}" tabindex="0" role="button" aria-label="${H(n.name)} ${D$(n.v)} a month" style="opacity:${hot?1:.25}"><rect x="${n.x}" y="${n.y.toFixed(1)}" width="${nw}" height="${n.h.toFixed(1)}" rx="3" fill="var(${n.c})"/><title>${H(n.name)}: ${D$(n.v)} a month. Click to trace it.</title>${n.h>=11?`<text x="${last?n.x-6:n.x+nw+6}" y="${(n.y+n.h/2+4).toFixed(1)}" text-anchor="${last?"end":"start"}" class="sk-t">${H(n.name.length>26?n.name.slice(0,25)+"…":n.name)} <tspan class="sk-v">${D$(n.v)}</tspan></text>`:""}</g>`})});
 return `<svg class="sk" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Cost flow from ledger cost pools to consumers" style="min-width:900px">${g}</svg>`}
function flow(){const m=model(),sv=window.SVCREG||[];const foc=T.focus&&svcOf(T.focus)?T.focus:null;const cols=[],links=[];
 cols.push({label:"Cost pools (general ledger)",nodes:POOLS.map((p,i)=>({id:"p:"+p[0],name:p[0],v:m.poolT[i],c:p[1]}))});
 const ti=TOWERS.map((t,i)=>({id:"t:"+t[0],name:t[0],v:m.towT[i],c:t[1]})).sort((a,b)=>b.v-a.v);cols.push({label:"Resource towers",nodes:ti});
 POOLS.forEach((p,j)=>TOWERS.forEach((t,i)=>links.push(["p:"+p[0],"t:"+t[0],m.tp[i][j]])));
 const svNodes=sv.map((s,i)=>({id:"s:"+s.id,name:s.n,v:s.cost,c:TOWERS[i%8][1],sid:s.id})).sort((a,b)=>b.v-a.v);
 const showSv=foc?svNodes.filter(n=>n.sid===foc).concat([{id:"s:other",name:"Other "+(sv.length-1)+" services",v:svNodes.filter(n=>n.sid!==foc).reduce((a,b)=>a+b.v,0),c:"--faint"}]):svNodes;cols.push({label:"Solutions: services",nodes:showSv});
 const sId=id=>foc&&id!==foc?"s:other":"s:"+id;const lk={};const add=(a,b,v)=>{const k=a+"|"+b;lk[k]=(lk[k]||0)+v};
 sv.forEach(s=>TOWERS.forEach((t,i)=>add("t:"+t[0],sId(s.id),m.svT[s.id][i])));Object.entries(lk).forEach(([k,v])=>{const [a,b]=k.split("|");links.push([a,b,v])});
 const cm={};sv.forEach(s=>Object.entries(m.cons[s.id]||{}).forEach(([c,v])=>cm[c]=(cm[c]||0)+v));
 const consNodes=CONS.filter(c=>cm[c[0]]).map(c=>({id:"c:"+c[0],name:c[0],v:cm[c[0]],c:CONS_C[c[1]]})).sort((a,b)=>b.v-a.v);
 if(foc){const s=svcOf(foc);const oc=m.offs[foc]||[];cols.push({label:"Service offerings",nodes:oc.map((o,i)=>({id:"o:"+o.name,name:o.name,v:o.cost,c:TOWERS[(i+3)%8][1]})).concat([{id:"o:other",name:"Other offerings",v:totalCost()-s.cost,c:"--faint"}])});
  oc.forEach(o=>links.push(["s:"+foc,"o:"+o.name,o.cost]));links.push(["s:other","o:other",totalCost()-s.cost]);
  const l2={};oc.forEach(o=>Object.entries(m.cons[foc]).forEach(([c,v])=>add2(l2,"o:"+o.name,"c:"+c,o.cost*v/s.cost)));sv.filter(x=>x.id!==foc).forEach(x=>Object.entries(m.cons[x.id]).forEach(([c,v])=>add2(l2,"o:other","c:"+c,v)));Object.entries(l2).forEach(([k,v])=>{const [a,b]=k.split("|");links.push([a,b,v])})}
 else{const l2={};sv.forEach(s=>Object.entries(m.cons[s.id]||{}).forEach(([c,v])=>add2(l2,"s:"+s.id,"c:"+c,v)));Object.entries(l2).forEach(([k,v])=>{const [a,b]=k.split("|");links.push([a,b,v])})}
 cols.push({label:"Consumers",nodes:consNodes});return {cols,links}}
function add2(o,a,b,v){const k=a+"|"+b;o[k]=(o[k]||0)+v}
function nodeInfo(id){const m=model();const t=totalCost();const [k,x]=[id.slice(0,1),id.slice(2)];const sv=window.SVCREG||[];let name=x,val=0,up=[],dn=[];
 if(k==="p"){const i=POOLS.findIndex(p=>p[0]===x);val=m.poolT[i];dn=TOWERS.map((tw,j)=>[tw[0],m.tp[j][i]]);name=x}
 else if(k==="t"){const i=TOWERS.findIndex(p=>p[0]===x);val=m.towT[i];up=POOLS.map((p,j)=>[p[0],m.tp[i][j]]);dn=sv.map(s=>[s.n,m.svT[s.id][i]])}
 else if(k==="s"){const s=svcOf(x);if(!s)return null;name=s.n;val=s.cost;up=TOWERS.map((tw,i)=>[tw[0],m.svT[x][i]]);dn=Object.entries(m.cons[x]||{})}
 else if(k==="c"){sv.forEach(s=>{const v=(m.cons[s.id]||{})[x];if(v){up.push([s.n,v]);val+=v}})}
 else return null;
 up=up.filter(a=>a[1]>0.5).sort((a,b)=>b[1]-a[1]);dn=dn.filter(a=>a[1]>0.5).sort((a,b)=>b[1]-a[1]);return{name,val,pct:val/t*100,up,dn}}
function stepCurve(st,sc){const W=560,Hh=250,L=54,R=14,Tp=18,B=34;const peak=demandAt(st,SCN().weeks);const dmax=Math.max(st.base*1.9,peak*1.25,st.cap*st.util*(st.units+1.4));const nmax=Math.ceil(dmax/(st.cap*st.util));const cmax=nmax*st.cost;
 const xs=d=>L+(W-L-R)*d/dmax,ys=c=>Tp+(Hh-Tp-B)*(1-c/cmax);let p=`M${xs(0)} ${ys(st.cost)}`;for(let n=1;n<=nmax;n++){const x=xs(n*st.cap*st.util);p+=`H${x}V${ys((n+1)*st.cost)}`}p+=`H${xs(dmax)}`;
 let g=`<path d="${p}" fill="none" stroke="var(--accent)" stroke-width="2.4"/>`;for(let n=1;n<=nmax;n++){const x=xs(n*st.cap*st.util);g+=`<line x1="${x}" x2="${x}" y1="${Tp}" y2="${Hh-B}" stroke="var(--hair)" stroke-dasharray="3 4"/>`;if(n<=nmax)g+=`<text x="${x}" y="${Hh-B+14}" text-anchor="middle" class="sk-ax">${fv(n*st.cap*st.util)}</text>`}
 [0,.5,1].forEach(f=>{const c=cmax*f;g+=`<text x="${L-6}" y="${ys(c)+4}" text-anchor="end" class="sk-ax">$${fv(c)}</text><line x1="${L}" x2="${W-R}" y1="${ys(c)}" y2="${ys(c)}" stroke="var(--hair)"/>`});
 const m1=(d,lab,cls)=>{const n=Math.max(1,Math.ceil(d/(st.cap*st.util)-1e-9));return `<circle cx="${xs(d)}" cy="${ys(n*st.cost)}" r="6" class="${cls}"/><text x="${xs(d)}" y="${ys(n*st.cost)-11}" text-anchor="middle" class="sk-ax b">${lab}</text>`};
 g+=m1(st.base,"today","dot-a")+m1(peak,"forecast","dot-b");
 return `<svg class="sk-c" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Stepped cost curve for ${H(st.name)}"><text x="${L}" y="12" class="sk-ax">Annual cost of ${H(st.res)}s</text>${g}<text x="${(L+W-R)/2}" y="${Hh-4}" text-anchor="middle" class="sk-ax">${H(st.unit)} (a step is added at each dashed line)</text></svg>`}
function timeline(st){const W=560,Hh=250,L=54,R=14,Tp=18,B=30;const wk=SCN().weeks;const ds=Array.from({length:wk+1},(_,w)=>demandAt(st,w));const ev=evalStep(st,wk);const cap0=st.cap*st.units*st.util,cap1=st.cap*Math.max(st.units,ev.peak)*st.util;const ymax=Math.max(...ds,cap0,ev.add?cap1:0)*1.1;
 const xs=w=>L+(W-L-R)*w/wk,ys=v=>Tp+(Hh-Tp-B)*(1-v/ymax);let g=[0,.5,1].map(f=>`<text x="${L-6}" y="${ys(ymax*f/1.1)+4}" text-anchor="end" class="sk-ax">${fv(ymax*f/1.1)}</text><line x1="${L}" x2="${W-R}" y1="${ys(ymax*f/1.1)}" y2="${ys(ymax*f/1.1)}" stroke="var(--hair)"/>`).join("");
 g+=`<path d="${ds.map((d,w)=>(w?"L":"M")+xs(w).toFixed(1)+" "+ys(d).toFixed(1)).join("")}" fill="none" stroke="var(--metric-f)" stroke-width="2.6"/>`;g+=`<line x1="${L}" x2="${W-R}" y1="${ys(cap0)}" y2="${ys(cap0)}" stroke="var(--bad-f)" stroke-width="2" stroke-dasharray="6 4"/><text x="${W-R}" y="${ys(cap0)-6}" text-anchor="end" class="sk-ax b">Capacity today (${st.units} ${H(st.res)}${st.units>1?"s":""} at ${Math.round(st.util*100)}%)</text>`;
 if(ev.add){g+=`<line x1="${L}" x2="${W-R}" y1="${ys(cap1)}" y2="${ys(cap1)}" stroke="var(--good-f)" stroke-width="2" stroke-dasharray="2 4"/><text x="${W-R}" y="${ys(cap1)-6}" text-anchor="end" class="sk-ax b">With ${ev.add} more</text>`;if(ev.up!=null)g+=`<line x1="${xs(ev.up)}" x2="${xs(ev.up)}" y1="${Tp}" y2="${Hh-B}" stroke="var(--warn-f)" stroke-width="2"/><text x="${xs(ev.up)+5}" y="${Tp+12}" class="sk-ax b">Week ${ev.up}</text>`}
 [0,.25,.5,.75,1].forEach(f=>g+=`<text x="${xs(wk*f)}" y="${Hh-B+14}" text-anchor="middle" class="sk-ax">${Math.round(wk*f)}</text>`);
 return `<svg class="sk-c" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Demand against capacity for ${H(st.name)}"><text x="${L}" y="12" class="sk-ax">Demand (${H(st.unit)}) by week</text>${g}<text x="${(L+W-R)/2}" y="${Hh-4}" text-anchor="middle" class="sk-ax">Weeks from today</text></svg>`}
