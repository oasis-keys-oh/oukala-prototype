/* Round 15, Agent D. Notification cards must not cover content.
   One card at most, docked bottom right above the Ask button (never over the hero or KPI row), no Approve button inside a
   transient card (approval stays in Needs you, with context and undo), collapses into the bell after a few seconds, never shown on
   the war room or major-incident screens, and dismissal persists on this device. */
(function(){
const W=window;const R15D=W.R15D=W.R15D||{};R15D.after=R15D.after||[];
const KEY="oukala-r15d-dismissed";
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return[]}};
const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a.slice(-200)))}catch(e){}};
let dismissed=load();
const QUIET=/^(itsm_mi|itom_evt)$/;
const suppressed=()=>QUIET.test(S.screen)||(document.getElementById("drawer")&&document.getElementById("drawer").matches(":popover-open"));
const HOLD=7000;
function tidy(){
 const b=document.getElementById("inbxBanners");if(!b)return;
 const kids=[...b.children];
 kids.forEach(el=>{if(dismissed.includes(el.dataset.id)){el.remove()}});
 if(suppressed()){[...b.children].forEach(el=>el.remove());return}
 b.querySelectorAll('[data-inbx-ban="approve"]').forEach(x=>x.remove());
 let extra=0;while(b.children.length>1){b.firstElementChild.remove();extra++}
 const el=b.firstElementChild;if(!el)return;
 if(!el.dataset.r15d){el.dataset.r15d="1";el.dataset.more="0";
  const note=document.createElement("small");note.className="r15d-ntf-note";note.textContent="Approve it from Needs you, where the amount, policy and undo are shown.";
  const m=el.querySelector(".inbx-bm");if(m)m.appendChild(note);
  let t=setTimeout(()=>collapse(el),HOLD);
  const pause=()=>clearTimeout(t),resume=()=>{t=setTimeout(()=>collapse(el),HOLD)};
  el.addEventListener("mouseenter",pause);el.addEventListener("focusin",pause);el.addEventListener("mouseleave",resume);el.addEventListener("focusout",resume);
  const x=el.querySelector('[data-inbx-ban="x"]');if(x)x.addEventListener("click",()=>{dismissed.push(el.dataset.id);save(dismissed)},true);
 }
 if(extra){el.dataset.more=String(+el.dataset.more+extra);let n=el.querySelector(".r15d-ntf-more");if(!n){n=document.createElement("small");n.className="r15d-ntf-more";const m=el.querySelector(".inbx-bm");if(m)m.appendChild(n)}n.textContent=el.dataset.more+" more waiting in Needs you"}
}
function collapse(el){if(!el||!el.isConnected)return;el.classList.add("r15d-out");setTimeout(()=>el.remove(),350);const bell=document.getElementById("inbxBell");if(bell){bell.classList.add("r15d-pulse");setTimeout(()=>bell.classList.remove("r15d-pulse"),1600)}}
function attach(){
 const b=document.getElementById("inbxBanners");
 if(b&&!b._r15d){b._r15d=1;new MutationObserver(tidy).observe(b,{childList:true});tidy();return true}
 return false}
const mo=new MutationObserver(()=>{if(attach())mo.disconnect()});
const boot=()=>{if(!attach())mo.observe(document.body,{childList:true})};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
R15D.after.push(()=>{attach();tidy()});
R15D.dismissAll=()=>{const b=document.getElementById("inbxBanners");if(b)[...b.children].forEach(e=>{dismissed.push(e.dataset.id);e.remove()});save(dismissed)};
})();
