/* mod_s_rail_art (BR-11): gold falcon mark atop the rail; icons in src/assets/brand/icons (CSS masks); panel in the CSS.
   AI-generated imagery: BR-05 provenance applies before external use. */
(function(){
const W=window,NAVX=W.NAVX=W.NAVX||{};
const K="home my ask strat deliver ops money people risk transform all show build".split(" ");
const svg=(k,sz)=>K.indexOf(k)<0?null:`<svg class="rart-ico" data-rart="${k}" viewBox="0 0 24 24" width="${sz||18}" height="${sz||18}" aria-hidden="true"></svg>`;
NAVX.railIcon=svg;
/* mod_r28_brand.css paints the .logo tile; a new class keeps that rule off */
function mark(){const l=document.querySelector(".rail .brand .logo");if(!l)return false;const m=document.createElement("div");m.className="rart-mark";m.setAttribute("aria-hidden","true");l.replaceWith(m);return true}
W.RAILART={icons:()=>K.slice(),svg,mark};
if(W.HOOKS)HOOKS.on("afterRender",()=>{try{mark()}catch(e){}},{id:"railart.mark"});
})();
