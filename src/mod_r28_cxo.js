/* ===== mod_r28_cxo: the executive menu.
   PH-14 (step 3, Omar 2026-10-20, decision 4): the separate CxO Simple list is retired. A CxO now gets the same purview menu as
   every persona (mod_nav.js: the business areas in its purview, in the fixed order, with its four role pins first inside their
   area; NAVX.purview reads the areas and pins from mod_r15d_persona.js). The COO cut (PR-18) stays reachable: every wedge screen
   is an entry or a role pin of the COO purview, and wedge mode filters that menu (mod_s_showroom.js).
   This module keeps two small jobs: it marks the page for executive personas (data-cxo, used by the rail styles) and reapplies
   wedge mode after a late menu redraw. ===== */
(function(){
const W=window,D=document;
const G=(f,d)=>{try{const r=f();return r===undefined?d:r}catch(e){return d}};
const CXO=["exec","ceo","cfo","coo","chro","ciso","caio","clo","cto"];
function install(){const base=G(()=>NAVX.html,null);if(!base||base._r28)return;
 const f=function(){const raw=base.apply(this,arguments);
  try{const on=CXO.indexOf(G(()=>S.persona,""))>=0;if(on&&G(()=>SHOW.wedge.on(),false))setTimeout(()=>G(()=>SHOW.wedge.apply()),0);if(D.body){if(on)D.body.setAttribute("data-cxo","1");else D.body.removeAttribute("data-cxo")}}catch(e){console.error("r28 cxo menu",e)}
  return raw};f._r28=1;NAVX.html=f}
install();
})();
