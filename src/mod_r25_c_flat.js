/* Round 25: flatten the interface. Fewer containers, fewer things above the fold, faster paint.
   1. The "how this works" process card at the foot of a screen folds into one line you can open.
   2. On the org chart the summary strips fold into one disclosure, so the chart comes first.
   3. Nothing is removed: every block is still one click away. */
(function(){
const D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
function fold(el,label,key){if(!el||el.closest("details.fl")||el.dataset.fl)return null;el.dataset.fl="1";
 const d=D.createElement("details");d.className="fl";d.dataset.flKey=key||"";const s=D.createElement("summary");s.textContent=label;d.appendChild(s);el.parentNode.insertBefore(d,el);d.appendChild(el);return d}
function flatten(){const v=D.getElementById("view");if(!v)return;const scr=G(()=>S.screen,"");
 if(scr==="studio")return;
 v.querySelectorAll(".screen > section.card").forEach(c=>{if(c.querySelector(":scope > .proc")&&c.querySelector(".r15-runbar,.proc")){const h=c.querySelector(".cardhead h3,h3");fold(c,(h?h.textContent.trim():"How this works")+" (process)","proc")}});
 if(scr==="org_chart"){const a=v.querySelector(".r15d-agstrip"),b=v.querySelector(".r17t-bandcard");
  if(a&&b&&!a.dataset.fl&&!b.dataset.fl){const d=fold(b,"Summary: people, AI teammates, span of control and agents","sum");if(d){a.dataset.fl="1";d.appendChild(a)}}}}
/* fold persistent state across re-renders within the session */
const OPEN={};D.addEventListener("toggle",e=>{const t=e.target;if(t.matches&&t.matches("details.fl")){OPEN[(G(()=>S.screen,"")+":"+t.dataset.flKey)]=t.open}},true);
function restore(){D.querySelectorAll("details.fl").forEach(d=>{const k=G(()=>S.screen,"")+":"+d.dataset.flKey;if(OPEN[k])d.open=true})}
R15D.after.push(()=>{flatten();restore()});
})();
