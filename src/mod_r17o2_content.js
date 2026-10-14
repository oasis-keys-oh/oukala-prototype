/* Round 17, Agent O2: phone content patterns. Phone only (max-width 600px); lightweight observer, no work at startup beyond attaching it. */
(function(){
const MQ=window.matchMedia("(max-width:600px)"),PAGE=20,MAXC=6;
/* org chart opens as an indented outline on phones (chart stays one tap away) */
try{if(MQ.matches&&S.org&&!S.org.r17o2){S.org.r17o2=1;S.org.outline=true}}catch(e){}
let tm=0,busy=false,sweepTok=0;
const view=()=>document.getElementById("view");
function sched(){if(tm||!MQ.matches)return;tm=setTimeout(()=>{tm=0;run()},140)}
function hdrLabels(t){const hr=[...t.tHead?t.tHead.rows:[]];if(!hr.length)return null;if(hr.some(r=>[...r.cells].some(c=>c.colSpan>1)))return null;const row=hr[hr.length-1];const L=[];[...row.cells].forEach(c=>{L.push((c.textContent||"").replace(/\s+/g," ").trim())});return L}
function tables(v){v.querySelectorAll("table").forEach(t=>{if(t.dataset.r17o2==="k"){const L=hdrLabels(t);if(L)[...t.tBodies].forEach(b=>[...b.rows].forEach(r=>[...r.cells].forEach((c,i)=>{if(!c.hasAttribute("data-label")&&L[i]&&r.cells.length===L.length)c.setAttribute("data-label",L[i])})));return}if(t.dataset.r17o2)return;if(t.closest(".bt,[data-virtual],.vtab,.r17o2-nofit")&&!t.closest(".tscroll")){t.dataset.r17o2="s";t.classList.add("r17o2-scr");return}
 const L=hdrLabels(t);const opt=t.hasAttribute("data-r17-scroll")||t.closest("[data-r17-scroll]")||t.closest(".bt");
 const cols=L?L.length:(t.rows[0]?t.rows[0].cells.length:99);const rows=t.tBodies[0]?t.tBodies[0].rows:[];
 const stack=!opt&&L&&cols>=2&&cols<=MAXC&&rows.length>0&&![...rows].some(r=>r.cells.length!==cols&&![...r.cells].some(c=>c.colSpan>1)&&r.cells.length>1);
 if(stack){[...t.rows].forEach(r=>{if(r.parentElement===t.tHead)return;if(r.cells.length===1&&r.cells[0].colSpan>1){r.cells[0].classList.add("r17o2-span");return}[...r.cells].forEach((c,i)=>{if(!c.hasAttribute("data-label")&&L[i])c.setAttribute("data-label",L[i])})});t.classList.add("r17o2-stack");t.dataset.r17o2="k";
  const rs=[...rows];if(rs.length>PAGE+4){let shown=PAGE;rs.forEach((r,i)=>{if(i>=shown)r.classList.add("r17o2-hid")});const w=t.closest(".tscroll,.tablewrap")||t;const b=document.createElement("button");b.type="button";b.className="btn r17o2-more";b.textContent="Show "+Math.min(PAGE,rs.length-shown)+" more ("+(rs.length-shown)+" hidden)";b.addEventListener("click",()=>{const hid=rs.filter(r=>r.classList.contains("r17o2-hid"));hid.slice(0,PAGE).forEach(r=>r.classList.remove("r17o2-hid"));const left=hid.length-PAGE;if(left<=0)b.remove();else b.textContent="Show "+Math.min(PAGE,left)+" more ("+left+" hidden)"});w.insertAdjacentElement("afterend",b)}}
 else{t.classList.add("r17o2-scr");t.dataset.r17o2="s"}})}
/* canvases in horizontal scrollers: fit-to-width toggle, default fit when it stays readable */
function canvases(v){v.querySelectorAll("svg[viewBox]").forEach(s=>{if(s.dataset.r17o2c||s.closest("svg")!==s||s.closest(".pop,[popover]"))return;const sc=s.parentElement;if(!sc)return;const cs=getComputedStyle(sc);if(cs.overflowX!=="auto"&&cs.overflowX!=="scroll")return;const vb=s.getAttribute("viewBox").split(/[ ,]+/).map(Number);const natural=Math.max(parseFloat(s.getAttribute("width"))||0,parseFloat(s.style.minWidth)||0,parseFloat(s.style.width)||0,s.getBoundingClientRect().width);if(!(natural>sc.clientWidth+24)||sc.clientWidth<100)return;
 s.dataset.r17o2c="1";const ratio=sc.clientWidth/(vb[2]||natural);const bar=document.createElement("div");bar.className="r17o2-fitbar";const b=document.createElement("button");b.type="button";b.className="btn";const set=on=>{s.classList.toggle("r17o2-fit",on);sc.classList.toggle("r17o2-fitw",on);b.textContent=on?"Zoom in to full size":"Fit to screen";bar.firstChild.textContent=on?"Fitted to your screen":"Full size, drag to pan"};bar.innerHTML="<span></span>";bar.appendChild(b);b.addEventListener("click",()=>set(!s.classList.contains("r17o2-fit")));sc.insertAdjacentElement("beforebegin",bar);set(ratio>=0.5)})}
/* text floor: anything under 12px on a phone gets 12px (chunked, once per element) */
const seen=new WeakSet();
function sweep(v){const tok=++sweepTok;const all=[...v.querySelectorAll("*")];let i=0;(function step(){if(tok!==sweepTok)return;const end=Math.min(i+500,all.length);for(;i<end;i++){const e=all[i];if(seen.has(e))continue;seen.add(e);if(e.namespaceURI!=="http://www.w3.org/1999/xhtml")continue;let own=false;for(const n of e.childNodes)if(n.nodeType===3&&n.nodeValue.trim().length>1){own=true;break}if(own&&parseFloat(getComputedStyle(e).fontSize)<12)e.classList.add("r17o2-sm")}if(i<all.length)(window.requestIdleCallback||setTimeout)(step)})()}
function run(){const v=view();if(!v||busy)return;busy=true;try{tables(v);canvases(v);sweep(v)}catch(e){}busy=false;}
function attach(){const v=view();if(!v){setTimeout(attach,200);return}new MutationObserver(()=>{if(!busy)sched()}).observe(v,{childList:true,subtree:true});sched()}
attach();MQ.addEventListener&&MQ.addEventListener("change",sched);
/* tap a truncated, titled name to read it in full */
document.addEventListener("click",e=>{if(!MQ.matches)return;const t=e.target.closest&&e.target.closest("#view [title]");if(!t||t.closest("a,button,summary,input,select,[data-go],[data-nav]"))return;if(t.scrollWidth>t.clientWidth+1||t.classList.contains("r17o2-open"))t.classList.toggle("r17o2-open")});
})();
