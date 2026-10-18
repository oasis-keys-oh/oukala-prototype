 const c=ATLAS.coverage();const out={};c.screens.forEach(s=>{out[s.id]=[...new Set((s.records||[]).map(r=>r.e&&r.e.id).filter(Boolean))].slice(0,5)});return JSON.stringify(out);
