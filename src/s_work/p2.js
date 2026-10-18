const L=require('./load.js');
(async()=>{const {b,p}=await L();
const r=await p.evaluate(()=>{
 const o={};
 o.groups=JSON.stringify(NAVX.groups).slice(0,3000);
 try{o.counts=JSON.stringify(NAVX.counts())}catch(e){o.counts='err '+e.message}
 try{o.state=JSON.stringify(NAVX.state).slice(0,800)}catch(e){}
 try{o.missing=JSON.stringify(NAVX.missing()).slice(0,600);o.unmapped=JSON.stringify(NAVX.unmapped()).slice(0,600)}catch(e){o.mu='err'}
 o.screen0=JSON.stringify(SCREENS[0]).slice(0,300);
 o.SCREENSkeys=SCREENS.slice(0,3).map(s=>s.length);
 o.groupLabel=typeof NAVX.groupLabel;
 try{o.gl=JSON.stringify(['portfolio','service','ops','know','people','automate','ai','platform'].map(g=>NAVX.groupLabel(g)))}catch(e){o.gl='err'}
 try{o.gi=JSON.stringify(NAVX.groupItems('portfolio')).slice(0,500)}catch(e){o.gi='err '+e.message}
 return o});
console.log(JSON.stringify(r,null,1));await b.close()})();
