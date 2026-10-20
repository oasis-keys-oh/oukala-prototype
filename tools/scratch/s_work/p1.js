const L=require('./load.js');
(async()=>{const {b,p}=await L();
const r=await p.evaluate(()=>{
 const o={};
 o.screens=SCREENS.length;
 o.groups=typeof NAVX!=="undefined"?Object.keys(NAVX):null;
 o.globals=['REG','NAVX','ATLAS','PROCLIB','METRICS','EVENTS','PERM','ORGX','PERSONAS','STORE','LISTS','PICKER','GUARD','FACTS','AGENTS_STATE','CONTRACT','OWNX','MODMAP','MAT','R15E','NEWMENU','PICK','DATAMODEL','PROC','SLIDERS','DATALINK','ZLINK','GATE','R16I','R16J','R16K','R16L','R16M','R16G','R16H','BCDR','SEARCHX','ASKX','INBOX','TOWER','AGENTS','LIVEEVENTS','FLOWX','DASH','VIZ','SEM'].map(k=>k+':'+(typeof window[k]!=="undefined"?typeof window[k]:(function(){try{return typeof eval(k)}catch(e){return 'none'}})()));
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
