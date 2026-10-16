/* Round 22: the executive persona is the CIO and says so; new executive personas sit together in the role list. */
(function(){
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
try{
 if(PERSONAS.exec){PERSONAS.exec.n="CIO";PERSONAS.exec.who="Chief Information Officer: sees everything that needs a decision"}
 const ORDER=["exec","ceo","cfo","coo","chro","ciso","caio","clo","board","portfolio","audit","pm","ops","change","arch","admin","fin","emp","newhire","guest"];
 const ks=ORDER.filter(k=>PERSONAS[k]).concat(Object.keys(PERSONAS).filter(k=>ORDER.indexOf(k)<0));
 const keep=Object.assign({},PERSONAS);ks.forEach(k=>{delete PERSONAS[k]});ks.forEach(k=>{PERSONAS[k]=keep[k]});
}catch(e){console.error("r22 roles",e)}
try{ /* greeting person: each role is held by its own named person */ const PU=(window.PERM&&PERM.personaUser)||{};Object.keys(PERSONAS).forEach(k=>{if(PU[k]&&!/^(Board member|Vendor guest)$/.test(PU[k]))PERSONAS[k].as=PU[k]})}catch(e){console.error("r22 as",e)}
})();
