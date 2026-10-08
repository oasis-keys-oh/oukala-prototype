/* ---------- spec normalization, data resolution, grouping ---------- */
const MNT={};let KID=0;
const TYD={};/* type defs */
function T(id,n,fam,d,demo,r,o){V.types[id]=Object.assign({id,n,fam,d,demo,r},o||{});return V.types[id]}
V.T=T;
function norm(sp){sp=Object.assign({v:1,type:"bar",src:"inc",enc:{},agg:"",sort:"",limit:0,bin:0,grain:"week",filter:[],calc:[],pal:"brand",ann:[],opt:{},hide:[]},sp||{});sp.enc=sp.enc||{};sp.filter=sp.filter||[];sp.calc=sp.calc||[];sp.ann=sp.ann||[];sp.opt=sp.opt||{};sp.hide=sp.hide||[];return sp}
V.norm=norm;
function inferFields(rows){const f=[];if(!rows.length)return f;Object.keys(rows[0]).forEach(k=>{const vs=[];for(let i=0;i<rows.length&&vs.length<60;i++){const v=rows[i][k];if(v!=null&&v!=="")vs.push(v)}const num=vs.length&&vs.every(v=>typeof v==="number"&&isFinite(v)),dt=vs.length&&vs.every(v=>/^\d{4}-\d\d-\d\d/.test(String(v)));f.push({k,label:k.replace(/_/g," ").replace(/^./,c=>c.toUpperCase()),t:num?"n":dt?"d":"c"})});return f}
V.inferFields=inferFields;
function resolve(spec,data){let src,rows;if(data){const id="inline:"+(spec.src||"data");const f=inferFields(data);src={id,label:"Provided data",grp:"Inline",fields:f,lin:"Rows supplied by the calling screen",rows:()=>data};INL[(spec.src||"data")]=src;rows=data}else{src=getSrc(spec.src);if(!src)throw new Error("Unknown data source “"+spec.src+"”");rows=rowsOf(src,spec.n||(src.big?Z.bigN:0))}
 let fields=src.fields.slice();
 if(spec.calc.length){const fns=spec.calc.map(c=>{try{return [c.k,parseExpr(c.expr,fields)]}catch(e){return null}}).filter(Boolean);if(fns.length){rows=rows.map(r=>{const o=Object.assign({},r);fns.forEach(([k,f])=>{o[k]=f(o)});return o});spec.calc.forEach(c=>{if(!fields.some(f=>f.k===c.k))fields.push({k:c.k,label:c.label||c.k,t:"n",f:c.expr,calc:1})})}}
 const fl=spec.filter.filter(f=>f&&f.f&&f.v!==""&&f.v!=null);if(fl.length)rows=rows.filter(r=>fl.every(f=>{const a=r[f.f],b=f.v,n=+b;switch(f.op){case ">":return +a>n;case "<":return +a<n;case ">=":return +a>=n;case "<=":return +a<=n;case "!=":return String(a)!==String(b);case "contains":return String(a).toLowerCase().includes(String(b).toLowerCase());default:return String(a)===String(b)}}));
 if(Z.filt&&spec.xf!==false&&fields.some(f=>f.k===Z.filt.k))rows=rows.filter(r=>String(r[Z.filt.k])===Z.filt.v);
 return {src,rows,fields}}
function groupBy(C,o){o=o||{};const sp=C.spec,en=sp.enc,x=o.x===undefined?en.x:o.x,c=o.c===undefined?en.color:o.c,y=o.y===undefined?en.y:o.y;const ag=o.agg||sp.agg||(y?(C.F(y)&&C.F(y).u==="%"?"avg":"sum"):"count");const xf=C.F(x),cf=C.F(c),yf=C.F(y),grain=o.grain||sp.grain||"week";const nb=o.bin!=null?o.bin:sp.bin;
 let lo=0,st=1,numx=xf&&xf.t==="n"&&nb>0;if(numx){let a=Infinity,b=-Infinity;C.rows.forEach(r=>{const v=+r[x];if(v<a)a=v;if(v>b)b=v});lo=a;st=(b-a)/nb||1}
 const xk=r=>{if(!x)return "All";const v=r[x];if(xf&&xf.t==="d")return bucket(v,grain);if(numx){const i=Math.min(nb-1,Math.floor((+v-lo)/st));return String(lo+i*st)}return v==null||v===""?"(none)":String(v)};
 const M=new Map(),cn=new Map(),hide=new Set(sp.hide);
 const yv=y&&ag!=="count"&&ag!=="distinct"?r=>+r[y]:ag==="distinct"&&y?r=>r[y]:()=>1;
 C.rows.forEach(r=>{const k=xk(r),ck=c?(r[c]==null||r[c]===""?"(none)":String(r[c])):"";if(c&&hide.has(ck))return;let m=M.get(k);if(!m){m=new Map();M.set(k,m)}let a=m.get(ck);if(!a){a=[];m.set(ck,a)}a.push(yv(r));cn.set(ck,(cn.get(ck)||0)+1)});
 let cs=[...cn.keys()];const maxS=o.maxS||sp.maxS||8;
 if(c){cs.sort((a,b)=>cn.get(b)-cn.get(a));if(cs.length>maxS&&!o.noOther){const keep=new Set(cs.slice(0,maxS-1));const oth=[];M.forEach(m=>{const t=[];[...m.keys()].forEach(k=>{if(!keep.has(k)){t.push(...m.get(k));m.delete(k)}});if(t.length)m.set("Other",t)});cs=cs.slice(0,maxS-1).concat(["Other"])}if(xf&&xf.opts)cs.sort((a,b)=>xf.opts.indexOf(a)-xf.opts.indexOf(b));if(cf&&cf.opts)cs.sort((a,b)=>cf.opts.indexOf(a)-cf.opts.indexOf(b))}else cs=[""];
 const fn=aggFn(ag);let xs=[...M.keys()];const isT=xf&&xf.t==="d";
 const cell=(k,ck)=>{const a=M.get(k)&&M.get(k).get(ck);return a&&a.length?fn(a):null};
 const tot=k=>{let t=0;cs.forEach(ck=>{const v=cell(k,ck);if(v!=null)t+=v});return t};
 if(isT||numx){xs.sort((a,b)=>numx?a-b:a<b?-1:1);if(isT&&(grain==="day"||grain==="week")&&xs.length>1&&xs.length<400&&(ag==="sum"||ag==="count")&&o.fill!==false){const step=grain==="day"?864e5:7*864e5,a=Date.parse(xs[0]+"T00:00:00Z"),b=Date.parse(xs[xs.length-1]+"T00:00:00Z"),full=[];for(let t=a;t<=b&&full.length<400;t+=step)full.push(isoD(t));xs=full}}
 else{const so=o.sort||sp.sort||"desc";if(xf&&xf.opts)xs.sort((a,b)=>xf.opts.indexOf(a)-xf.opts.indexOf(b));else if(so==="desc")xs.sort((a,b)=>tot(b)-tot(a));else if(so==="asc")xs.sort((a,b)=>tot(a)-tot(b));else if(so==="alpha")xs.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));const lim=o.limit!=null?o.limit:sp.limit;if(lim>0&&xs.length>lim)xs=xs.slice(0,lim)}
 const xl=xs.map(k=>isT?blabel(k,grain):numx?fnum(+k)+"–"+fnum(+k+st):k);
 const V2=xs.map(k=>cs.map(ck=>cell(k,ck)));let mx=-Infinity,mn=Infinity;V2.forEach(r=>r.forEach(v=>{if(v!=null){if(v>mx)mx=v;if(v<mn)mn=v}}));if(mx===-Infinity){mx=1;mn=0}
 return {xs,xl,cs,v:V2,tot:xs.map(tot),max:mx,min:mn,ag,x,c,y,isT,numx,step:st,lo,n:C.rows.length,grain,cell,raw:M}}
/* ---------- render pipeline ---------- */
const FS=(f)=>f?f.label:"";
function aggLabel(sp,C){const y=sp.enc.y,ag=sp.agg||(y?"sum":"count");const yf=C.F(y);if(!y||ag==="count")return "Count of records";const n=(V.AGGS.find(a=>a[0]===ag)||[0,ag])[1];return n+" of "+(yf?yf.label.toLowerCase():y)}
function mkCtx(el,spec,data,o){const R=resolve(spec,data),F={};R.fields.forEach(f=>F[f.k]=f);const th=!!o.thumb,W=th?(o.w||190):clamp(Math.round(el.clientWidth||620),240,1200),T0=V.types[spec.type];
 const ar=spec.opt.ar||(T0&&T0.ar)||.56;let H=th?Math.round(W*.6):Math.round(clamp(W*ar,spec.opt.hmin||200,spec.opt.hmax||(T0&&T0.hmax)||620));if(spec.h&&!th)H=spec.h;
 const C={el,spec,src:R.src,rows:R.rows,fields:R.fields,F:k=>k?F[k]:null,W,H,thumb:th,nf:0,pal:palOf(spec),gc:{}};
 C.col=i=>C.pal[((i%C.pal.length)+C.pal.length)%C.pal.length];C.g=(oo)=>{const key=JSON.stringify(oo||{});return C.gc[key]||(C.gc[key]=groupBy(C,oo))};
 const yf=F[spec.enc.y];C.yf=yf;C.fy=unitFmt(yf&&spec.agg!=="count"?yf.u:"");C.fx=aggLabel(spec,C)+(yf&&yf.f?" · "+yf.f:"");C.al=aggLabel(spec,C);
 C.seq=t=>ramp(SEQ[spec.ramp||"teal"],t);C.xt=(F[spec.enc.x]||{}).t;
 C.mk=(lines,ck)=>` data-tt="${E(lines.concat([C.thumb?"":"ƒ "+C.fx]).filter(Boolean).join("\n"))}"${ck&&ck[1]!=null&&C.F(ck[0])&&C.F(ck[0]).t!=="d"?` data-ck="${E(ck[0]+"\u001f"+ck[1])}"`:""}${C.nf++<80&&!C.thumb?' tabindex="0"':""}`;
 C.svg=(inner,cls,h)=>`<svg class="vz-svg ${cls||""}" viewBox="0 0 ${W} ${h||H}" width="100%" ${C.thumb?'aria-hidden="true"':'role="img" aria-label="'+E(C.desc||"")+'"'} preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
 C.trunc=(s,n)=>{s=String(s);return s.length>n?s.slice(0,n-1)+"…":s};C.legend=[];C.table=null;C.desc="";return C}
function runType(el,spec,data,o){const T0=V.types[spec.type];if(!T0)throw new Error("Unknown chart type “"+spec.type+"”");const C=mkCtx(el,spec,data,o);C.desc=(T0.n)+" of "+(C.F(spec.enc.y)?C.F(spec.enc.y).label:"records")+(spec.enc.x&&C.F(spec.enc.x)?" by "+C.F(spec.enc.x).label:"")+". ";
 if(!C.rows.length)return {C,out:{html:`<div class="vz-empty"><b>No rows to draw</b><span>The filters or the cross-filter remove every row. Clear them to see the chart.</span></div>`}};
 let out=T0.r(C);if(typeof out==="string")out={html:out};return {C,out}}
function draw(id){const m=MNT[id];if(!m||!m.el.isConnected)return;const el=m.el,spec=m.spec,o=m.o;m.w=el.clientWidth;
 try{const {C,out}=runType(el,spec,m.data,o);m.C=C;if(o.thumb){el.innerHTML=`<div class="vz-th">${out.html}</div>`;if(out.post)out.post(el,C);return}
  const T0=V.types[spec.type],title=spec.title||autoTitle(spec,C);const tbl=out.table||C.table||defTable(C);
  const lg=(out.legend||C.legend||[]).filter(x=>x);const hid=new Set(spec.hide);
  el.innerHTML=`<figure class="vz-f${m.tbl?" showtbl":""}" data-vzf="${id}"><figcaption class="vz-h"><div class="vz-t"><b>${E(title)}</b>${spec.sub||o.sub?`<span>${E(spec.sub||o.sub)}</span>`:`<span>${E(T0.n)} · ${E(C.src.label)}</span>`}</div>${o.bare?"":`<div class="vz-tools"><button class="btn quiet vz-tb" data-viz-tbl="${id}" aria-pressed="${!!m.tbl}" title="Show the data table behind this chart">Data table</button><button class="btn quiet vz-tb" data-viz-full="${id}" title="Open full screen">Full screen</button></div>`}</figcaption>
  <div class="vz-body" ${m.tbl?"hidden":""}>${out.html}</div>${lg.length?`<div class="vz-leg" role="group" aria-label="Legend. Select an item to hide or show it.">${lg.map(l=>`<button type="button" class="vz-lg${hid.has(l[0])?" off":""}" data-viz-lg="${id}" data-v="${E(l[0])}" aria-pressed="${!hid.has(l[0])}"><i style="background:${l[1]}"></i>${E(C.trunc(l[0]||C.al,26))}</button>`).join("")}${out.ramp?`<span class="vz-ramp"><small>${E(out.ramp[0])}</small><i style="background:linear-gradient(90deg,${[0,.25,.5,.75,1].map(t=>C.seq(t)).join(",")})"></i><small>${E(out.ramp[1])}</small></span>`:""}</div>`:out.ramp?`<div class="vz-leg"><span class="vz-ramp"><small>${E(out.ramp[0])}</small><i style="background:linear-gradient(90deg,${[0,.25,.5,.75,1].map(t=>C.seq(t)).join(",")})"></i><small>${E(out.ramp[1])}</small></span></div>`:""}
  <div class="vz-tblw" ${m.tbl?"":"hidden"}>${tbl}</div>${o.nofoot?"":`<div class="vz-foot">${lineage(spec,C,o)}</div>`}</figure>`;
  if(out.post)out.post(el.querySelector(".vz-body"),C)}catch(e){console.warn("viz",spec.type,e);el.innerHTML=`<div class="vz-empty ${o.thumb?"th":""}"><b>${o.thumb?"Cannot draw":"This chart cannot be drawn with these fields"}</b><span>${E(e.message||e)}</span>${o.thumb?"":`<span>${E(needText(spec.type))}</span>`}</div>`}}
const needText=t=>{const T0=V.types[t];return T0&&T0.need?"This type needs "+T0.need+".":""};
function autoTitle(sp,C){const en=sp.enc,xf=C.F(en.x),yf=C.F(en.y);const t=C.al+(xf?" by "+xf.label.toLowerCase():"");return t.charAt(0).toUpperCase()+t.slice(1)}
function defTable(C){const g=C.g({limit:200,sort:C.spec.sort||"desc"});const hd=[C.F(g.x)?C.F(g.x).label:"Group"].concat(g.c?g.cs:[C.al]);return tbl(hd,g.xl.map((l,i)=>[l].concat(g.v[i].map(v=>v==null?"":fnum(v)))),C)}
function tbl(hd,rows,C){return `<div class="tscroll vz-tw"><table><caption class="sr">Data behind the chart. ${E(rows.length)} rows.</caption><thead><tr>${hd.map(h=>`<th scope="col">${E(h)}</th>`).join("")}</tr></thead><tbody>${rows.slice(0,300).map(r=>`<tr>${r.map((c,i)=>`<td${i?' class="num"':""}>${E(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>${rows.length>300?`<p class="muted small">First 300 of ${rows.length} rows. Export CSV for everything.</p>`:""}</div>`}
V.tbl=tbl;
function lineage(sp,C,o){const yf=C.yf,chips=[];chips.push(`<span class="pill mute" title="${E(C.src.lin||"")}">${E(C.src.label)}</span>`);chips.push(`<span class="pill mute">${C.rows.length.toLocaleString("en-US")} rows</span>`);if(yf&&yf.m&&METRICS[yf.m])chips.push(fchip(yf.m));else chips.push(`<span class="pill metric" title="${E(C.fx)}">ƒ ${E(C.trunc(C.al,34))}</span>`);
 (sp.filter||[]).filter(f=>f&&f.f&&f.v!=="").forEach(f=>chips.push(`<span class="pill info">${E(f.f)} ${E(f.op||"=")} ${E(f.v)}</span>`));if(Z.filt&&sp.xf!==false&&C.F(Z.filt.k))chips.push(`<span class="pill warn">Cross-filter: ${E(Z.filt.k)} = ${E(Z.filt.v)}</span>`);
 chips.push(`<span class="vz-lin" title="Where this chart's numbers come from">${E(C.src.lin||"")}</span>`);return chips.join("")}
V.render=function(el,spec,data,o){spec=norm(spec);o=o||{};const id=el.dataset.vzk||(el.dataset.vzk="v"+(++KID));MNT[id]={el,spec,data,o,tbl:MNT[id]&&MNT[id].tbl};if(!el.classList.contains("vz"))el.classList.add("vz");if(o.thumb)el.classList.add("vz-thumb");draw(id);if(!o.thumb)RO.observe(el);return id};
V.redraw=()=>{Object.keys(MNT).forEach(id=>{if(!MNT[id].el.isConnected){delete MNT[id];return}draw(id)})};
const RO=typeof ResizeObserver!=="undefined"?new ResizeObserver(es=>{es.forEach(e=>{const id=e.target.dataset.vzk,m=MNT[id];if(m&&Math.abs((m.w||0)-e.target.clientWidth)>28&&e.target.clientWidth>0){cancelAnimationFrame(m.raf);m.raf=requestAnimationFrame(()=>draw(id))}})}):{observe(){}};
/* placeholders hydrate lazily when visible (keeps hundreds of gallery thumbnails cheap) */
const SPECS={};
V.html=function(spec,data,o){o=o||{};const id="s"+(++Z.nid);SPECS[id]={spec,data,o};return `<div class="vz vz-mount${o.thumb?" vz-thumb":""}" data-vzs="${id}" style="min-height:${o.minh||(o.thumb?96:240)}px"></div>`};
const IO=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){IO.unobserve(e.target);hydrate(e.target)}})},{rootMargin:"160px"}):null;
function hydrate(n){if(n.dataset.vzdone)return;const s=SPECS[n.dataset.vzs];if(!s)return;n.dataset.vzdone="1";n.style.minHeight="";V.render(n,JSON.parse(JSON.stringify(s.spec)),s.data,s.o)}
let scanQ=0;function scan(){scanQ=0;document.querySelectorAll(".vz-mount:not([data-vzobs])").forEach(n=>{n.dataset.vzobs="1";if(IO)IO.observe(n);else hydrate(n)})}
new MutationObserver(()=>{if(!scanQ)scanQ=requestAnimationFrame(scan)}).observe(document.documentElement,{childList:true,subtree:true});
/* ---------- tooltip, hover, legend toggle, click to filter, keyboard ---------- */
let TIP=null;function tip(){if(!TIP){TIP=document.createElement("div");TIP.className="vz-tip glass";TIP.setAttribute("role","tooltip");document.body.appendChild(TIP)}return TIP}
function showTip(t,x,y){const d=tip();const lines=t.dataset.tt.split("\n");d.innerHTML=`<b>${E(lines[0])}</b>${lines.slice(1).map(l=>`<span class="${l.startsWith("ƒ ")?"vz-fx":""}">${E(l)}</span>`).join("")}`;d.classList.add("on");const w=d.offsetWidth,h=d.offsetHeight;d.style.left=clamp(x+14,6,innerWidth-w-6)+"px";d.style.top=clamp(y+14>innerHeight-h-6?y-h-12:y+14,6,innerHeight-h-6)+"px"}
const hideTip=()=>{if(TIP)TIP.classList.remove("on")};
document.addEventListener("mousemove",e=>{const t=e.target.closest&&e.target.closest("[data-tt]");if(t&&t.closest(".vz"))showTip(t,e.clientX,e.clientY);else hideTip()},{passive:true});
document.addEventListener("focusin",e=>{const t=e.target.closest&&e.target.closest("[data-tt]");if(t&&t.closest(".vz")){const b=t.getBoundingClientRect();showTip(t,b.left+b.width/2,b.top)}});
document.addEventListener("focusout",hideTip);document.addEventListener("scroll",hideTip,true);
document.addEventListener("keydown",e=>{const t=e.target;if(!t.matches||!t.matches("svg [data-tt][tabindex]"))return;const all=[...t.closest("svg").querySelectorAll("[data-tt][tabindex]")],i=all.indexOf(t);let n=null;if(e.key==="ArrowRight"||e.key==="ArrowDown")n=all[Math.min(all.length-1,i+1)];else if(e.key==="ArrowLeft"||e.key==="ArrowUp")n=all[Math.max(0,i-1)];else if(e.key==="Home")n=all[0];else if(e.key==="End")n=all[all.length-1];else if(e.key==="Enter"||e.key===" "){e.preventDefault();clickMark(t);return}if(n){e.preventDefault();n.focus()}});
function clickMark(t){const ck=t.dataset.ck;if(!ck)return;const [k,v]=ck.split("\u001f");V.setFilter(k,v)}
V.setFilter=function(k,v){const same=Z.filt&&Z.filt.k===k&&Z.filt.v===v;Z.filt=same?null:{k,v};audit(same?"cleared cross-filter":"cross-filtered visuals",k+" = "+v);toast(same?"Cross-filter cleared":"Filtered every visual that has “"+k+"” to "+v,"good");V.redraw();if(window.VIZ_afterFilter)window.VIZ_afterFilter();refreshBanners()};
function refreshBanners(){document.querySelectorAll("[data-viz-banner]").forEach(b=>{b.innerHTML=bannerHTML()})}
const bannerHTML=()=>Z.filt?`<span class="pill warn">Cross-filter on: ${E(Z.filt.k)} = ${E(Z.filt.v)}</span><button class="btn quiet" data-viz-clear>Clear filter</button>`:`<span class="muted small">Click a bar, slice, region or point to filter every other visual that shares the field.</span>`;
V.bannerHTML=bannerHTML;
document.addEventListener("click",e=>{let t;
 if(t=e.target.closest("[data-viz-clear]")){Z.filt=null;V.redraw();refreshBanners();toast("Cross-filter cleared","good");return}
 if(t=e.target.closest("[data-viz-lg]")){const m=MNT[t.dataset.vizLg];if(!m)return;const v=t.dataset.v,i=m.spec.hide.indexOf(v);if(i>=0)m.spec.hide.splice(i,1);else m.spec.hide.push(v);const sp=SPECS[m.el.dataset.vzs];if(sp)sp.spec.hide=m.spec.hide.slice();draw(t.dataset.vizLg);if(window.VIZ_afterSpec)window.VIZ_afterSpec(m);return}
 if(t=e.target.closest("[data-viz-tbl]")){const m=MNT[t.dataset.vizTbl];if(!m)return;m.tbl=!m.tbl;draw(t.dataset.vizTbl);return}
 if(t=e.target.closest("[data-viz-full]")){const m=MNT[t.dataset.vizFull];if(!m)return;openDrawer(`<div class="vz-drw">${V.html(JSON.parse(JSON.stringify(m.spec)),m.data,{minh:420})}<p class="muted small">Press Esc to close. Use the Full screen button at the top of this panel to fill the window.</p></div>`);audit("opened visual full screen",m.spec.title||m.spec.type);return}
 const mk=e.target.closest("[data-tt][data-ck]");if(mk&&mk.closest(".vz")&&!mk.closest(".vz-thumb"))clickMark(mk)});
