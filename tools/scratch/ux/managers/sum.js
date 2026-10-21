// PR-31: print a compact summary of one persona's walk
const k=process.argv[2];const r=require('./out/'+k+'.json');const s=o=>{if(!o)return'';const c={...o};delete c.head;delete c.h;delete c.noName;delete c.rows;return JSON.stringify(c)};
console.log('#',r.name,'errors',r.errors.length);
for(const [t,R] of Object.entries(r.tenants)){console.log('==',t,'pins',JSON.stringify(R.pins));console.log('RAIL',R.rail.slice(0,400));
 console.log('HOME',s(R.home));console.log('HOMEHEAD',R.homeText.slice(0,900).replace(/\n+/g,' | '));
 for(const [id,m] of Object.entries(R.screens)){console.log('--',id,s(m));console.log('   HEAD',m.head.slice(0,500).replace(/\n+/g,' | '))}
 R.tasks.forEach(x=>console.log('TASK',x.kind,x.id,'found',JSON.stringify(x.found.labels),'rows',x.found.rowOpen,'outcome',String(x.outcome).slice(0,300).replace(/\n+/g,' | '),'where',JSON.stringify(x.where).slice(0,300)));
 console.log('SEARCH',(R.search.res||'').split('\n').slice(36,60).join(' | ').slice(0,600));
 console.log('THREAD',JSON.stringify(R.threadFirst),'OPEN',String(R.threadOpen||'').slice(0,200).replace(/\n+/g,' | '));
 for(const mode of ['dark','phone'])if(R[mode])console.log(mode.toUpperCase(),Object.entries(R[mode]).map(([k,v])=>k+' ox='+v.ox+' sw='+v.sw+' low='+v.low+' tiny='+v.tiny).join('; '))}
