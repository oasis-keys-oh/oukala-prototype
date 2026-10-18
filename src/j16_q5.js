(()=>{const o={};const g=(k,f)=>{try{o[k]=f()}catch(e){o[k]='ERR '+e.message}};
g('actions',()=>JSON.stringify(GUARD.actions).slice(0,800));g('caps',()=>JSON.stringify(GUARD.caps).slice(0,500));g('roleOf',()=>GUARD.roleOf('Casey Rowan'));g('can',()=>JSON.stringify(GUARD.can('Casey Rowan','budget.edit')));
g('sets',()=>JSON.stringify(Object.keys(GUARD.sets)).slice(0,500));
g('persona',()=>S.persona);g('me',()=>INBOX.me());g('rolesreg',()=>typeof ROLES!=='undefined'?Object.keys(ROLES).join(','):'');
g('adm.roles',()=>S.adm.roles.map(r=>r.id+':'+r.n).join('|'));
g('store',()=>STORE.define.toString().slice(0,300));g('storeput',()=>STORE.put.toString().slice(0,200));
g('track',()=>STORE.track.toString().slice(0,300));
return o})()
