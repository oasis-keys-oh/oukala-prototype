 const out=Object.entries(PERSONAS).map(([k,p])=>({k,n:p.n,who:p.who,home:(p.home||[]).join('+'),rings:(p.rings||[]).length,nav:(p.nav||[]).length,navFirst:(p.nav||[]).slice(0,4).join(','),user:(PERM.personaUser&&PERM.personaUser[k])||null,roles:(PERM.personaRoles&&PERM.personaRoles[k])||null,keys:Object.keys(p).join(',')}));
 return JSON.stringify(out);
