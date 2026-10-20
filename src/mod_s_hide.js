/* mod_s_hide: unreachable screens are hidden, never deleted (CL-41, decision adopted 2026-10-19).
   HIDE.LIST is the result of tools/lint/reach.js (inventory: docs/inventory/unreachable-screens.md): screens with no menu entry,
   no family view, no link from another screen or file and no Showroom beat. They are hidden from the menu and search through the
   existing hide mechanism (R15.hidden, the r15hid menu group, SRCH.hiddenScreen); the id, its render function and every saved
   link keep working (URL, builder-mode search). Administrators unhide one on Administration, Environments and releases,
   "Hidden screens" (mod_admin.js). The choice is kept in this browser (U.store key falconaire-unhidden).
   API: window.HIDE {LIST, apply, hide(id), unhide(id), isHidden(id), unhidden(), rows()} */
(function(){
const W=window;const G=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const KEY="falconaire-unhidden";
const LIST=[
 {id:"zl_conn",at:"2026-10-20",why:"No menu entry, not a family view, no link from another screen or file, not in a Showroom tour. Three files mention the id only as text."}];
const ORIG={};
const R15=()=>{const r=W.R15=W.R15||{};r.hidden=r.hidden||{};return r};
const un=()=>new Set(G(()=>U.store.get(KEY,[]),[]));
function refresh(){G(()=>{if(NAVX.int&&NAVX.int.IDX)NAVX.int.IDX.dirty=true});G(()=>SRCH.dirty&&SRCH.dirty());G(()=>{if(W.renderNav)renderNav()})}
function hideOne(id){R15().hidden[id]=1;const m=G(()=>NAVX.map[id]);if(m&&m.g!=="r15hid"){ORIG[id]=m.g;m.g="r15hid"}}
function apply(){const u=un();LIST.forEach(x=>{if(!u.has(x.id))hideOne(x.id)});refresh()}
function isListed(id){return LIST.some(x=>x.id===id)}
function hide(id){if(!isListed(id))return false;const u=un();u.delete(id);G(()=>U.store.set(KEY,[...u]));hideOne(id);refresh();G(()=>audit("Hid a screen from the menu and search",id));return true}
function unhide(id,o){if(!isListed(id))return false;const u=un();u.add(id);G(()=>U.store.set(KEY,[...u]));delete R15().hidden[id];
 const m=G(()=>NAVX.map[id]);if(m&&m.g==="r15hid")m.g=ORIG[id]||"new";refresh();if(!(o&&o.quiet))G(()=>audit("Unhid a screen",id));return true}
const isHidden=id=>!!R15().hidden[id];
const rows=()=>LIST.map(x=>({id:x.id,name:G(()=>(SCREENS.find(s=>s[0]===x.id)||[])[1],x.id)||x.id,why:x.why,at:x.at,hidden:isHidden(x.id),registered:G(()=>SCREENS.some(s=>s[0]===x.id),false)}));
W.HIDE={LIST,apply,hide,unhide,isHidden,unhidden:()=>[...un()],rows};
apply();
/* menu entries can be created later (NAVX.add, family wiring); re-apply once the shell has rendered */
G(()=>HOOKS.on("afterRender",()=>{if(!W.HIDE._done){W.HIDE._done=1;apply()}},{id:"s_hide",order:50}));
})();
