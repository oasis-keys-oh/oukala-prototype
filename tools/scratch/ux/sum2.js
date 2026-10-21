// PR-31: compact per-persona digest
const k=process.argv[2];const r=require('./out/'+k+'.json');console.log('#',r.name,'errors',r.errors.length);
for(const [t,R] of Object.entries(r.tenants)){const ht=R.homeText.replace(/\n+/g,' | ');const i=ht.indexOf('MY CONTRIBUTION');
 console.log('==',t,'| rail:',R.rail.replace(/Falconaire \| |\? \| How to read this menu \| /g,'').slice(0,220));
 console.log(' hero:',ht.slice(ht.indexOf('Welcome'),ht.indexOf('Choose what')).slice(0,260));
 console.log(' contrib:',ht.slice(i,i+330));console.log(' thread(home):',R.home.thread);
 for(const [id,m] of Object.entries(R.screens)){const den=/is not available to/.test(m.head);console.log(' -',id,den?'DENIED':'',m.title,'| words',m.words,'honest',m.honest,'tables',m.tables,'rows',JSON.stringify(m.rows),'gaps',m.gapEx.length,'banned',JSON.stringify(m.banned),'mer',m.meridian);
  console.log('    ',m.head.replace(/Lens \| (CIO|COO|CEO|CFO) \| Why am I seeing this\? \| /,'').replace(/\n+/g,' | ').slice(0,330));if(m.gapEx.length)console.log('     gaps:',m.gapEx.slice(0,3).join(' || ').slice(0,300))}
 R.tasks.forEach(x=>console.log(' TASK',x.kind,x.id,'screen-btns',JSON.stringify(x.found.labels),'drawer',x.where&&x.where.drawer,'drawer-btns',JSON.stringify(x.where&&x.where.labels),'| outcome',String(x.outcome).slice(0,200).replace(/\n+/g,' / ')));
 const sr=(R.search.res||'');const j=sr.indexOf('WHO TO ASK')>=0?sr.indexOf('WHO TO ASK'):sr.indexOf('or type area');console.log(' SEARCH',R.search.q,':',sr.slice(j,j+420).replace(/\n+/g,' | '));
 for(const mode of ['dark','phone'])if(R[mode])console.log(' ',mode,Object.entries(R[mode]).map(([k,v])=>k+(v.ox?' OVERFLOW':'')).join(', '))}
