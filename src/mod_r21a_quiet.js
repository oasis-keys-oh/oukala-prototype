/* Round 21a: one Silence control for popup notifications. Items still arrive and count in the inbox; only banners and cards stop. */
(function(){
const D=document,W=window,G=(f,d)=>{try{return f()}catch(e){return d}};
const KEY="oukala.silence";
let until=+U.store.get(KEY,0)||0;
const save=()=>U.store.set(KEY,until);
const silenced=()=>until===-1||until>Date.now();
const apply=()=>{D.documentElement.classList.toggle("r21-quiet",silenced());const b=D.getElementById("inbxBell");if(b){b.classList.toggle("r21-muted",silenced());if(silenced())b.title="Notifications silenced "+label()}};
const label=()=>until===-1?"until you turn them back on":"until "+new Date(until).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
function set(mode){const n=new Date();
 if(mode==="hour")until=Date.now()+3600e3;else if(mode==="day"){const t=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,7,0,0);until=t.getTime()}else if(mode==="off")until=-1;else until=0;
 save();apply();G(()=>toast(silenced()?"Pop-up notifications silenced "+label()+". Items still collect in the inbox.":"Pop-up notifications are on.","info"));menu(false)}
function menu(open){let m=D.getElementById("r21SilMenu");if(!open){m&&m.remove();return}
 if(m)m.remove();const btn=D.querySelector("[data-r21-silence]");if(!btn)return;
 m=D.createElement("div");m.id="r21SilMenu";m.setAttribute("role","menu");
 const opts=[["hour","Silence for 1 hour"],["day","Silence until tomorrow morning"],["off","Silence until I turn it back on"],["on","Turn pop-ups back on"]];
 m.innerHTML='<div class="r21-sm-h">Pop-up notifications</div>'+opts.filter(o=>o[0]!=="on"||silenced()).map(o=>'<button type="button" role="menuitem" data-r21-sil-set="'+o[0]+'">'+o[1]+'</button>').join("")+'<div class="r21-sm-f">Items still arrive in your inbox.</div>';
 const p=D.getElementById("inbxPanel")||D.body;p.appendChild(m);const r=btn.getBoundingClientRect(),pr=p.getBoundingClientRect();m.style.top=(r.bottom-pr.top+6)+"px";m.style.right=Math.max(8,pr.right-r.right-4)+"px"}
D.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-r21-silence]");if(t){e.preventDefault();e.stopPropagation();menu(!D.getElementById("r21SilMenu"));return}
 const s=e.target.closest&&e.target.closest("[data-r21-sil-set]");if(s){e.stopPropagation();set(s.dataset.r21SilSet);return}
 if(!(e.target.closest&&e.target.closest("#r21SilMenu")))menu(false)},true);
setInterval(()=>{if(until>0&&until<=Date.now()){until=0;save()}apply()},5000);
setTimeout(apply,800);
W.R21Q={silenced,set,until:()=>until};
})();
