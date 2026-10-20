/* ===== Round 18, J: a name never appears alone. Every person's name in the working area gets the shared avatar bubble (the same one the org chart, inbox and people drawer use),
   and clicking it opens the same person drawer. One pass after each render; skips buttons, links, form fields, headings and anything already marked. ===== */
(function(){
"use strict";
const W=window,D=document;const R18=W.R18;if(!R18)return;const G=R18.G;
let RX=null,KEY="";
function names(){const s=new Set();G(()=>DIR.forEach(d=>d.name&&d.kind!=="ai"&&s.add(d.name)),0);G(()=>PEOPLE.forEach(p=>p[0]&&s.add(p[0])),0);G(()=>Object.keys(PERSONAS).forEach(k=>PERSONAS[k].as&&s.add(PERSONAS[k].as)),0);
 return [...s].filter(n=>/\s/.test(n)&&n.length>5)}
function rx(){const n=names();const key=n.length+"|"+n[0];if(RX&&key===KEY)return RX;KEY=key;RX=new RegExp("("+n.sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","g");return RX}
const SKIP=".r18-qwho,button,a,label,option,select,textarea,input,script,style,h1,h2,.pchipx,[data-person],.avx,.r15d-role,[contenteditable],.hero .eyebrow,.crumb,.r16-pha,svg,.pop .eyebrow";
function enhance(root){if(!root||!W.avatar)return;const re=rx();const w=D.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){const v=n.nodeValue;if(!v||v.length<6)return NodeFilter.FILTER_REJECT;re.lastIndex=0;if(!re.test(v))return NodeFilter.FILTER_REJECT;const p=n.parentElement;if(!p||p.closest(SKIP))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
 const list=[];let n;while((n=w.nextNode())&&list.length<400)list.push(n);
 list.forEach(t=>{const v=t.nodeValue;re.lastIndex=0;const f=D.createDocumentFragment();let last=0,m;while((m=re.exec(v))){if(m.index>last)f.appendChild(D.createTextNode(v.slice(last,m.index)));
   const s=D.createElement("span");s.className="r18-pn";s.setAttribute("data-person",m[1]);s.setAttribute("role","button");s.setAttribute("tabindex","0");s.innerHTML=W.avatar(m[1],{size:20})+"<span>"+m[1].replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</span>";f.appendChild(s);last=m.index+m[1].length}
  if(last<v.length)f.appendChild(D.createTextNode(v.slice(last)));t.parentNode.replaceChild(f,t)})}
const GR=[[/\b1 of (\d+) (builds|tools|objectives|requests) (are|have|use)\b/g,(m,n,w,v)=>"1 of "+n+" "+w+" "+({are:"is",have:"has",use:"uses"}[v])],[/\b1 (builds|tools)\b/g,"1 build"],[/\b1 objectives\b/g,"1 objective"],[/\b1 requests\b/g,"1 request"],[/\b1 grants\b/g,"1 grant"],[/\b1 items\b/g,"1 item"],[/\b1 (builds|tools|requests) (are|have)\b/g,(m,w,v)=>"1 "+w.replace(/s$/,"")+" "+(v==="are"?"is":"has")]];
function grammar(root){if(!root)return;const w=D.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /\b1 /.test(n.nodeValue)&&!(n.parentElement&&n.parentElement.closest("script,style,input,textarea"))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const L=[];let n;while((n=w.nextNode())&&L.length<600)L.push(n);L.forEach(t=>{let v=t.nodeValue,o=v;GR.forEach(([r,x])=>{v=v.replace(r,x)});if(v!==o)t.nodeValue=v})}
/* links to screens this role may not open are shown as unavailable rather than leading to a denied page */
function sweep(root){if(!root||!W.PERM||!PERM.state||!PERM.state.enforce)return;root.querySelectorAll("[data-go]").forEach(el=>{const id=String(el.dataset.go||"").split(":")[0];if(!id||id==="home")return;if(!G(()=>SCREENS.some(s=>s[0]===id),false))return;let ok=true;try{ok=PERM.can(null,"read","screen:"+id).ok}catch(e){}
 if(!ok){el.setAttribute("aria-disabled","true");el.setAttribute("title","Not available to your role");el.classList.add("r18-denied");el.setAttribute("data-denied",id);el.removeAttribute("data-go")}})}
let timer=0,obs=null;
function run(){const v=D.getElementById("view");const d=D.getElementById("drawer");if(obs)obs.disconnect();try{sweep(v);grammar(v);enhance(v);enhance(d)}catch(e){console.error("r18 people",e)}watch()}
function watch(){const v=D.getElementById("view");if(!v)return;if(!obs)obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,120)});obs.observe(v,{childList:true,subtree:true,characterData:false})}
HOOKS.on("afterRender",()=>{clearTimeout(timer);timer=setTimeout(run,60)},{id:"r18j.people"});
setTimeout(run,800);
})();
