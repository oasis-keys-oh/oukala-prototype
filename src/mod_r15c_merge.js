/* ===== Round 15, Agent C: one name per screen, and merged screen families =====
   A family is one menu entry with several views. The canonical screen stays in the menu; the others stay registered
   (so links, search records, favorites, PROC and MODMAP references keep resolving) but leave the menu and are reached from a
   view switcher at the top of every member. Truly duplicate screens redirect through R15.alias.
   PH-14 (step 2, CL-51): the families and merges come from the navigation taxonomy in mod_nav.js (NAVX.taxo, seeded from
   docs/ia/screen-inventory.csv): 36 families and 10 merges. A merge whose target already holds the content as a tab redirects
   with a tab argument (R15.alias {to, tab:"viewsName:index"}); any other merge opens as a view of its target, so no content is
   lost and no id is deleted. R15.setFamilies() rebuilds everything from the taxonomy and is the one place that writes it. */
(function(){
const W=window,D=document;const R15=W.R15=W.R15||{};
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FAM=R15.families=R15.families||[];
/* a few single renames so every label is a verb phrase or a plain noun and none collides */
const SINGLE={svc_cat:"Manage the catalog",plat_data_old:"Data tables and checks (old)"};
const N=R15.names=R15.names||{};
const famOf=R15.famOf=R15.famOf||{};
R15.merged=R15.merged||{};
const TX=()=>G(()=>NAVX.taxo,null);
function setFamilies(){const T=TX();if(!T)return false;
 const list=T.families();const M=T.merges();
 /* merge-only targets get a two-view switcher: the target and the merged view (the target stays the menu entry) */
 Object.keys(M).forEach(old=>{const m=M[old];if(m.tab)return;if(list.some(f=>f.views.some(v=>v[0]===old)))return;
  let f=list.find(x=>x.id===m.to);if(!f){const r=T.row(m.to);f={id:m.to,label:r?r.l:m.to,merge:true,views:[[m.to,r?r.l:m.to]]};list.push(f)}
  f.views.push([old,m.l||old,true])});
 FAM.length=0;list.forEach(f=>FAM.push(f));
 Object.keys(famOf).forEach(k=>delete famOf[k]);Object.keys(R15.merged).forEach(k=>delete R15.merged[k]);
 FAM.forEach(f=>f.views.forEach(([id,v,mg])=>{famOf[id]=f;if(id===f.id){N[id]=f.label;delete R15.hidden[id]}else{N[id]=f.label+": "+v;R15.hidden[id]=1}if(mg)R15.merged[id]=M[id]?M[id].to:f.id}));
 /* merges that redirect to a tab of their target */
 Object.keys(M).forEach(old=>{const m=M[old];if(!m.tab)return;R15.alias[old]={to:m.to,tab:m.tab};R15.hidden[old]=1;R15.merged[old]=m.to;N[old]=(T.row(m.to)||{l:m.to}).l+": "+(m.l||old)});
 /* entries the taxonomy places in a menu are never hidden; retire candidates and role-only screens are */
 T.rows().forEach(id=>{const r=T.row(id);if(r.kind==="entry"&&!R15.alias[id]&&!famOf[id])delete R15.hidden[id];if(r.kind==="retire"||r.kind==="role")R15.hidden[id]=1});
 Object.keys(SINGLE).forEach(k=>{if(SINGLE[k])N[k]=SINGLE[k]});
 return true}
R15.setFamilies=setFamilies;
/* true duplicates: redirect */
R15.alias.plat_data_old={to:"plat_data",tab:"atlas:5"}; /* CL-51: lands on the Tables and checks view of the Master data model */R15.hidden.plat_data_old=1;
setFamilies();
/* the switcher: first thing on every member screen */
function switcher(){const id=G(()=>S.screen);const f=famOf[id];if(!f)return;const sc=D.querySelector("#view .screen")||D.querySelector("#view");if(!sc||sc.querySelector(".r15-fam"))return;
 const chips=f.views.filter(([v])=>G(()=>SCREENS.some(s=>s[0]===v),false)).map(([v,l,mg])=>`<button type="button" class="chip r15-fv" data-nav="${esc(v)}" aria-pressed="${v===id}"${v===id?' aria-current="page"':''}${mg?' data-r15-merged="1"':''}>${esc(l)}</button>`).join("");
 if(f.views.length<2)return;
 const html=`<nav class="r15-fam" aria-label="Views of ${esc(f.label)}"><span class="r15-fl">${esc(f.label)}</span><span class="r15-fc">${chips}</span></nav>`;const hero=sc.querySelector(":scope > .hero");if(hero)hero.insertAdjacentHTML("afterend",html);else sc.insertAdjacentHTML("afterbegin",html)}
function railOn(){const id=G(()=>S.screen);const f=famOf[id];if(!f||f.id===id)return;const b=D.querySelector('#nav .navi[data-nav="'+f.id+'"]');if(b){b.setAttribute("aria-current","page");b.closest(".navit")&&b.closest(".navit").classList.add("is-cur")}}
/* CL-35: lifecycle through HOOKS, not a render wrapper */
HOOKS.on("afterRender",()=>{try{switcher();railOn()}catch(e){console.error("r15 merge",e)}},{id:"r15.merge",order:1002});
/* group home for the service catalog owner screen */
setTimeout(()=>{G(()=>NAVX.add("svc_cat",{label:SINGLE.svc_cat,group:"fix"}))},0);
})();
