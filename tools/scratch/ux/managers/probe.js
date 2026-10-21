const L=require('./lib');(async()=>{const {b,p,errs}=await L.open();
const r=await p.evaluate(()=>({tenants:DATA.tenants().map(t=>[t.id,t.org]),theme:document.documentElement.getAttribute('data-theme'),
 personaApi:Object.keys(NAVX.persona),tenantBtn:((document.getElementById('tnBtn')||{}).outerHTML||'').slice(0,400),
 shell:[...document.body.children].map(e=>e.tagName+'#'+e.id+'.'+e.className).slice(0,30)}));console.log(JSON.stringify(r,null,1).slice(0,3000));
await L.setup(p,'pm');await L.goto(p,'home');
console.log('RAILS:',await p.evaluate(()=>[...document.querySelectorAll('nav,aside,[id*=side],[id*=rail]')].map(e=>e.tagName+'#'+e.id+'.'+e.className+' '+e.innerText.length).join('\n')));
console.log('HOME:',(await L.txt(p)).slice(0,3000));console.log(errs);await b.close()})();
