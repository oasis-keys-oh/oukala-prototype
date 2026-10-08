/* ---------------- ui helpers and charts ---------------- */
const SC={good:"--good-f",warn:"--warn-f",bad:"--bad-f"};
const lvName=(n,k)=>{const l=modelOf(n.model).lv[Math.round(k)-1];return l?l[0]:"Level "+k};
const mname=id=>modelOf(id).n;
const fv=v=>r1(v).toString();
function ladder(n,big){const m=mMax(n),c=cur(n),t=Math.round(tgtN(n,0)),f=fore(n,HW[0]);let h="";
 for(let k=1;k<=m;k++){const on=c>=k-.001,part=!on&&c>k-1,fc=!on&&f>=k-.001;h+=`<i class="${on?"on":fc?"fc":""}${k===t?" tg":""}">${part?`<u style="width:${Math.round((c-(k-1))*100)}%"></u>`:""}</i>`}
 return `<span class="mat-lad ${big?"big":""}" role="img" aria-label="Level ${fv(c)} of ${m}. Year 1 target ${t}. Forecast ${fv(f)}.">${h}</span>`}
function glideSVG(set,opt){opt=opt||{};const L=leaves(set);if(!L.length)return empty("Nothing to chart","No capabilities are linked yet.");
 const W=640,Hh=opt.h||250,pl=40,pr=16,pt=16,pb=34,x1=HW[2]+10,xs=w=>pl+(W-pl-pr)*w/x1,single=L.length===1,max=single?mMax(L[0]):5,ys=v=>pt+(Hh-pt-pb)*(1-(v-1)/(max-1)),sw=L.reduce((a,x)=>a+x.w,0)||1;
 const val=(f)=>L.reduce((a,n)=>a+(single?f(n):sc5(n,f(n)))*n.w,0)/sw;
 const samp=[];for(let w=0;w<=x1;w+=Math.max(10,Math.round(x1/36)))samp.push(w);
 const ex=samp.map(w=>[w,val(n=>exp(n,w))]),fc=samp.filter(w=>w>=TODAY).map(w=>[w,val(n=>fore(n,w,opt.slip))]);fc.unshift([TODAY,val(n=>cur(n))]);
 const cu=val(n=>cur(n)),b0=val(n=>n.b0!=null?n.b0:n.cur);
 const tg=HW.map((w,h)=>[w,val(n=>tgtN(n,h))]);
 let g="";for(let v=1;v<=max;v++)g+=`<line class="grid-l" x1="${pl}" x2="${W-pr}" y1="${ys(v)}" y2="${ys(v)}"/><text class="ax" x="${pl-8}" y="${ys(v)+4}" text-anchor="end">${v}</text>`;
 HZ.forEach((h,i)=>{g+=`<line class="grid-l" x1="${xs(HW[i])}" x2="${xs(HW[i])}" y1="${pt}" y2="${Hh-pb}"/><text class="ax" x="${xs(HW[i])}" y="${Hh-12}" text-anchor="middle">${h[0]}</text>`});
 const path=a=>a.map((p,i)=>(i?"L":"M")+xs(p[0]).toFixed(1)+" "+ys(p[1]).toFixed(1)).join("");
 g+=`<line x1="${xs(TODAY)}" x2="${xs(TODAY)}" y1="${pt}" y2="${Hh-pb}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 4"/><text class="ax" x="${xs(TODAY)+4}" y="${pt+10}">Today</text>`;
 g+=`<path d="${path(ex)}" fill="none" stroke="var(--muted)" stroke-width="2.2" stroke-dasharray="6 5"/>`;
 g+=`<path d="M${xs(0)} ${ys(b0)}L${xs(TODAY)} ${ys(cu)}" fill="none" stroke="var(--ink)" stroke-width="2.6"/>`;
 g+=`<path d="${path(fc)}" fill="none" stroke="${col("--accent")}" stroke-width="3"/>`;
 tg.forEach((p,i)=>{g+=`<path d="M${xs(p[0])} ${ys(p[1])-7}l7 7l-7 7l-7 -7z" fill="${col("--good-f")}" stroke="var(--bg)" stroke-width="1.5"><title>${HZ[i][0]} target ${fv(p[1])}</title></path>`});
 g+=`<circle cx="${xs(TODAY)}" cy="${ys(cu)}" r="5.5" fill="var(--ink)"/><circle cx="${xs(0)}" cy="${ys(b0)}" r="4" fill="var(--ink)"/>`;
 return `<svg class="chart mat-chart" viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="${H(opt.label||"Glide path")}: current level ${fv(cu)}, expected today ${fv(ex.find(p=>p[0]>=TODAY)[1])}">${g}</svg>`+legend([["Actual to today","--ink"],["Forecast with funded projects","--accent"],["Glide path (expected)","--muted"],["Target at each horizon","--good-f"]])}
function radarSVG(axes,series,max){const n=axes.length;if(n<3)return empty("Not enough areas for a radar","A radar needs at least three capabilities.");const S0=360,cx=S0/2,cy=S0/2+4,R=S0/2-84;
 const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*clamp((v-0)/max,0,1);return [cx+r*Math.cos(a),cy+r*Math.sin(a)]};let g="";
 for(let k=1;k<=max;k++){g+=`<polygon points="${axes.map((_,i)=>pt(i,k).join(",")).join(" ")}" fill="none" stroke="var(--hair)" stroke-width="1"/>`}
 axes.forEach((a,i)=>{const [x,y]=pt(i,max+.01),[lx,ly]=pt(i,max+.9),an=lx<cx-6?"end":lx>cx+6?"start":"middle";g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--hair)"/><text class="ax" x="${lx}" y="${ly+4}" text-anchor="${an}" style="font-size:11px">${H(a.length>26?a.slice(0,25)+"…":a)}<title>${H(a)}</title></text>`});
 series.forEach(s=>{g+=`<polygon points="${s.v.map((v,i)=>pt(i,v).join(",")).join(" ")}" fill="${s.fill?col(s.c):"none"}" fill-opacity=".18" stroke="${col(s.c)}" stroke-width="2.4" ${s.dash?'stroke-dasharray="6 4"':""}/>`});
 return `<svg class="chart mat-radar" viewBox="0 0 ${S0} ${S0+8}" width="100%" role="img" aria-label="Radar of ${n} capabilities">${g}</svg>`+legend(series.map(s=>[s.l,s.c]))}
function ganttSVG(w){const rows=w.rows.filter(r=>r.leaf&&r.gap>0).sort((a,b)=>a.st-b.st||a.en-b.en).slice(0,14);if(!rows.length)return empty("No work needed","Everything in scope already meets the requested level.");
 const W=640,Lp=170,H2=40+rows.length*26,mx=Math.max(6,Math.ceil(Math.max(...rows.map(r=>r.en),(HW[w.hz]-TODAY)/21.7)+1)),xs=m=>Lp+(W-Lp-12)*m/mx;let g="";
 for(let m=0;m<=mx;m+=Math.max(1,Math.ceil(mx/10)))g+=`<line class="grid-l" x1="${xs(m)}" x2="${xs(m)}" y1="14" y2="${H2-24}"/><text class="ax" x="${xs(m)}" y="${H2-8}" text-anchor="middle">${m===0?"Now":"+"+m+"m"}</text>`;
 const dm=(HW[w.hz]-TODAY)/21.7;g+=`<line x1="${xs(dm)}" x2="${xs(dm)}" y1="10" y2="${H2-24}" stroke="${col("--bad-f")}" stroke-width="2" stroke-dasharray="4 4"/><text class="ax" x="${xs(dm)-4}" y="12" text-anchor="end" style="fill:${col("--bad-f")}">${HZ[w.hz][0]} date</text>`;
 rows.forEach((r,i)=>{const y=26+i*26,cov=r.rem===0,x0=xs(r.st),x2=Math.max(x0+4,xs(Math.max(r.en,r.st+.3)));g+=`<text class="ax" x="6" y="${y+4}" style="fill:var(--ink)">${H(r.n.name.length>26?r.n.name.slice(0,25)+"…":r.n.name)}<title>${H(r.n.name)}</title></text><rect x="${x0}" y="${y-8}" width="${x2-x0}" height="16" rx="6" fill="${col(cov?"--good-f":r.en>dm?"--bad-f":"--accent")}" opacity=".88"><title>${H(r.n.name)}: level ${fv(r.cur)} to ${r.req}, ${cov?"covered by funded project":"new work"}, month ${Math.round(r.st)} to ${Math.round(r.en)}</title></rect>`});
 return `<svg class="chart" viewBox="0 0 ${W} ${H2}" width="100%" role="img" aria-label="Roadmap of the work needed, in months from today">${g}</svg>`+legend([["Funded project already delivers it","--good-f"],["New work, finishes in time","--accent"],["New work, finishes after the date","--bad-f"]])}
function depSVG(w){const lv=w.leafRows.filter(r=>r.gap>0).sort((a,b)=>b.tot-a.tot),caps=lv.slice(0,10);if(!caps.length)return empty("No dependencies to draw","Nothing needs to change.");
 const sv=Object.keys(w.svcs).slice(0,8),pj=Object.keys(w.projs).slice(0,8),sk=Object.keys(w.skills).slice(0,8),colsX=[10,190,370,520],cw=[150,150,140,120],W=660,Hh=Math.max(caps.length,sv.length,pj.length,sk.length)*34+60;
 const yy=(i,n)=>44+i*((Hh-60)/Math.max(1,n));let g="",pos={};
 const box=(x,y,w2,t,c,id)=>{pos[id]=[x,y];g+=`<g><rect x="${x}" y="${y-12}" width="${w2}" height="24" rx="9" fill="${col(c)}" fill-opacity=".2" stroke="${col(c)}"/><text x="${x+8}" y="${y+4}" style="font-size:11px;fill:var(--ink)">${H(t.length>Math.floor(w2/6.4)?t.slice(0,Math.floor(w2/6.4)-1)+"…":t)}<title>${H(t)}</title></text></g>`};
 ["Capabilities that must rise","Services that realize them","Projects that deliver","People and skills"].forEach((t,i)=>{g+=`<text class="ax" x="${colsX[i]}" y="16" style="font-weight:700">${t}</text>`});
 caps.forEach((r,i)=>box(colsX[0],yy(i,caps.length),cw[0],r.n.name,"--p4","c"+r.id));sv.forEach((s,i)=>box(colsX[1],yy(i,sv.length),cw[1],(svcOf(s)||{n:s}).n,"--e4","s"+s));pj.forEach((p,i)=>box(colsX[2],yy(i,pj.length),cw[2],p+" "+projInfo(p).n,"--w1","p"+p));sk.forEach((k,i)=>box(colsX[3],yy(i,sk.length),cw[3],SKILLS[k]?SKILLS[k][0]:k,"--s3","k"+k));
 let e="";const edge=(a,b,c)=>{if(!pos[a]||!pos[b])return;const x1=pos[a][0]+(a[0]==="c"?cw[0]:a[0]==="s"?cw[1]:cw[2]),y1=pos[a][1],x2=pos[b][0],y2=pos[b][1];e+=`<path d="M${x1} ${y1}C${x1+30} ${y1},${x2-30} ${y2},${x2} ${y2}" fill="none" stroke="${col(c)}" stroke-opacity=".5" stroke-width="1.4"/>`};
 caps.forEach(r=>{r.n.svcs.forEach(s=>edge("c"+r.id,"s"+s,"--e4"));r.cred.forEach(c=>edge("c"+r.id,"p"+c.p,"--w1"));r.n.sk.forEach(k=>{if(pos["k"+k]){const x1=pos["c"+r.id][0]+cw[0],y1=pos["c"+r.id][1],x2=pos["k"+k][0],y2=pos["k"+k][1];e+=`<path d="M${x1} ${y1}C${x1+200} ${y1-30},${x2-200} ${y2+30},${x2} ${y2}" fill="none" stroke="${col("--s3")}" stroke-opacity=".35" stroke-width="1.2"/>`}})});
 return `<svg class="chart mat-dep" viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="Dependency map from capabilities to services, projects and skills">${e}${g}</svg>`+(lv.length>10?`<p class="muted small">Showing the 10 most expensive of ${lv.length} capabilities. The table below lists all of them.</p>`:"")}
