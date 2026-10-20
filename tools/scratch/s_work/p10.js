const L=require('./load.js');
(async()=>{
const {b,p}=await L(1440,900);
const r=await p.evaluate(async()=>{
 const sl=ms=>new Promise(r=>setTimeout(r,ms));go('bud_over');await sl(1000);
 const o={};
 const S=(sel,props)=>{const e=document.querySelector('#view '+sel)||document.querySelector(sel);if(!e)return sel+': none';const cs=getComputedStyle(e);const r=e.getBoundingClientRect();return sel+' ['+Math.round(r.width)+'x'+Math.round(r.height)+'] '+props.map(p=>p+'='+cs[p]).join('; ')};
 const P=['fontFamily','fontSize','fontWeight','lineHeight','padding','borderRadius','border','textAlign','fontVariantNumeric','backdropFilter','boxShadow','color','background','gap','minHeight'];
 ['.card','.card h3','.card .cardhead','.kpi','.tile','.stat','.mini','table','th','td','td.num','td.r','.pill','.chip','.btn','.btn.primary','.btn.quiet','.fchip','input','select','.eyebrow','h1','.story','.num','.hero','.tab','[role=tab]','.views'].forEach(s=>o[s]=S(s,P));
 return o});
for(const k in r)console.log(r[k]);await b.close()})();
