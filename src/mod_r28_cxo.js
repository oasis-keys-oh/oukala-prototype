/* ===== mod_r28_cxo: the executive menu. A CxO sees seven things and nothing else; search (Ctrl K) and the Full menu setting still reach every screen.
   Applies to the executive personas when the menu style is Simple. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const CXO=["exec","ceo","cfo","coo","chro","ciso","caio","clo","cto"];
const TOP=[["home","Home"],["exe_strat","Strategy alignment"],["ppl_jrny","Journey maps"],["exe_dash","Dashboard"],["orgdesign","Agent Action"],["bst","Budget and spend traceability"]];
const SV=[["r18_strategy","Strategy enablement"],["r18_lens","Executive lenses"],["metrics","Measures and targets"],["bud_ben","Benefits realization"],["exe_risk","Risk heat map"],["exe_board","Board pack"]];
function compose(raw){
 const root=D.createElement("div");root.innerHTML=raw;
 const find=id=>root.querySelector('[data-nx-it="'+id+'"]');
 const item=(id,label)=>{const e=find(id);if(!e)return null;const c=e.cloneNode(true);c.classList.remove("r15d-pin");const l=c.querySelector(".nx-l");if(l)l.textContent=label;const h=c.querySelector(".nx-h");if(h)h.remove();return c};
 const out=D.createElement("div");out.className="r28-cxo";
 TOP.forEach(([id,l])=>{const c=item(id,l);if(c)out.appendChild(c)});
 const sub=SV.map(([id,l])=>item(id,l)).filter(Boolean);
 if(sub.length){const d=D.createElement("details");d.className="r27-all r28-sv";d.dataset.r28Sv="1";
  if((G(()=>S.r28.svOpen,false))||sub.some(c=>c.querySelector('[aria-current="page"]')))d.open=true;
  d.innerHTML='<summary><span>Strategy and value</span></summary>';sub.forEach(c=>d.appendChild(c));out.appendChild(d)}
 return out.innerHTML}
function install(){const base=G(()=>NAVX.html,null);if(!base||base._r28)return;
 const f=function(){let raw=base.apply(this,arguments);
  try{const p=G(()=>S.persona,"");const on=CXO.indexOf(p)>=0&&G(()=>PREF.nav,"simple")!=="full";if(on)raw=compose(raw);if(D.body){if(on)D.body.setAttribute("data-cxo","1");else D.body.removeAttribute("data-cxo")}}catch(e){console.error("r28 cxo menu",e)}
  return raw};f._r28=1;NAVX.html=f}
install();
D.addEventListener("toggle",e=>{const t=e.target;if(t&&t.dataset&&t.dataset.r28Sv){S.r28=S.r28||{};S.r28.svOpen=t.open}},true);
})();
