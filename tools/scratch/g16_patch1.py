p='perm_test.js'
s=open(p).read()
a=s.index(" const res=await p.evaluate(ids=>")
b=s.index(" rows.push([k,nOpen,nDen]);")
new=''' const RA=process.argv.includes('--render-all');const KEY=Object.keys(POLICY);
 const res=await p.evaluate(({ids,RA,KEY})=>{const out=[];const navIds=new Set([...document.querySelectorAll('#nav [data-nx-it]')].map(e=>e.dataset.nxIt));
  for(const id of ids){try{const can=PERM.can(null,'read','screen:'+id).ok;let den=null;
   if(RA||!can||KEY.includes(id)){go(id);den=!!document.getElementById('view').querySelector('[data-perm-denied]')}
   out.push({id,den,nav:navIds.has(id),can})}catch(e){out.push({id,err:e.message})}}return out},{ids,RA,KEY});
 for(const r of res){const id=r.id;
  if(r.err){V(k,'render-error',id+': '+r.err);continue}
  if(r.den!==null&&r.den===r.can)V(k,'screen-render-mismatch',id+' evaluator='+(r.can?'allow':'deny')+' but view '+(r.den?'denied':'rendered'));
  if(!r.can&&r.nav)V(k,'nav-leak',id+' denied but present in the menu');
  if(r.can)nOpen++;else nDen++;
  if(POLICY[id]){const want=POLICY[id].includes(k);if(want!==r.can)V(k,'policy',id+' should be '+(want?'open':'denied')+' for '+k+' but is '+(r.can?'open':'denied'))}
  if(k==='ops'&&NEVER_FOR_OPS.includes(id)&&r.den===false)V(k,'service-desk-leak',id+' rendered for service desk');
 }
 console.log('persona',k,'open',nOpen,'denied',nDen,'at',Math.round((Date.now()-T0)/1000),'s');
'''
s=s[:a]+new+s[b:]
open(p,'w').write(s)
