const {open}=require('./lib');(async()=>{const {b,p}=await open();
const r=await p.evaluate(()=>{const out={};['emp','newhire','guest','arch','admin','ops','pm','portfolio','fin','exec'].forEach(k=>{NAVX.persona.set(k);let pv={};try{pv=JXR.purview()}catch(e){pv={err:e.message}};const P=NAVX.purview(k);out[k]={user:pv.user,scope:pv.scope,dept:pv.dept,why:pv.why,P:JSON.stringify(P).slice(0,300)}});return out});
console.log(JSON.stringify(r,null,1));console.log(p.errs);await b.close()})();
