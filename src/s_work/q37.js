 const E=PLAT.entities();const by=d=>E.filter(e=>e.domain===d).map(e=>e.id).join(', ');
 return JSON.stringify({people:by('people'),cmdb:by('cmdb'),itom:by('itom'),fin:by('fin'),money:by('money'),plat:by('plat').slice(0,600),gov:by('gov').slice(0,500),
 store:STORE.entities().length, storeLogN:STORE.log&&STORE.log.length, tracked:STORE.tracked&&STORE.tracked(), keys:Object.keys(S).length, ver:typeof STORE.meter==='function'&&STORE.meter(),
 evLog:EVENTS.log.length});
