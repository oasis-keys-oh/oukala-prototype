/* Round 16 lead: startup coalescing. Many modules call renderNav() / NAVX.add() repeatedly while booting; render the nav once the burst settles. */
(function(){
 if(window.__zzperf)return;window.__zzperf=1;
 const rn=window.renderNav;if(typeof rn!=="function")return;
 let t=0,pending=false;
 window.renderNav=function(){
  if(!window.__navFirst){window.__navFirst=1;return rn.apply(this,arguments)}
  if(performance.now()<30000){pending=true;if(!t)t=setTimeout(()=>{t=0;if(pending){pending=false;try{rn.apply(window,arguments)}catch(e){console.error("renderNav",e)}}},350);return}
  return rn.apply(this,arguments)};
})();
